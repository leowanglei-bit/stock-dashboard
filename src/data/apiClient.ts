/**
 * 服务端数据持久化 — GitHub Repository API
 * 读写 data/boards.json，跨设备数据一致
 */

const OWNER = 'leowanglei-bit';
const REPO = 'stock-dashboard';
const FILE_PATH = 'data/boards.json';

export interface ServerData {
  boards: Record<string, any>;
  boardOrder: string[];
}

let authToken = '';
let fileSha: string | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: ServerData | null = null;

export function setAuthToken(token: string) {
  authToken = token;
}

export function hasAuthToken(): boolean {
  return authToken.length > 0;
}

function authHeaders(): Record<string, string> {
  const prefix = 'Bearer';
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (authToken) headers['Authorization'] = prefix + ' ' + authToken;
  return headers;
}

/** 从服务器加载数据 */
export async function loadFromServer(): Promise<ServerData | null> {
  // 先尝试 raw（无认证，无速率限制）
  try {
    const rawUrl = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/main/' + FILE_PATH;
    const rawRes = await fetch(rawUrl, { signal: AbortSignal.timeout(5000) });
    if (rawRes.ok) return await rawRes.json();
  } catch { /* fallback */ }

  // API 方式（有认证可读私有）
  if (!authToken) return null;
  try {
    const url = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + FILE_PATH;
    const res = await fetch(url, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = atob(data.content);
    fileSha = data.sha;
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/** 保存数据到服务器（立即执行） */
async function doSave(data: ServerData): Promise<boolean> {
  if (!authToken) return false;
  const json = JSON.stringify(data, null, 2);
  const content = btoa(unescape(encodeURIComponent(json))); // 支持中文

  try {
    // 获取最新 SHA
    if (!fileSha) {
      const url = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + FILE_PATH;
      const getRes = await fetch(url, {
        headers: authHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      if (getRes.ok) {
        const meta = await getRes.json();
        fileSha = meta.sha;
      }
    }

    const putUrl = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + FILE_PATH;
    const body: any = { message: 'update boards [auto]', content };
    if (fileSha) body.sha = fileSha;

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (putRes.ok) {
      const result = await putRes.json();
      fileSha = result.content?.sha || null;
      return true;
    }
    if (putRes.status === 409) { // SHA 冲突，重试
      fileSha = null;
      return doSave(data);
    }
    return false;
  } catch {
    return false;
  }
}

/** 保存数据（防抖 2 秒） */
export function saveToServer(data: ServerData) {
  pendingData = data;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (pendingData) {
      await doSave(pendingData);
      pendingData = null;
    }
  }, 2000);
}
