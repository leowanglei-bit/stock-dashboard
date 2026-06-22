/**
 * 服务端数据持久化 — GitHub Repository API
 * 自动读写 data/boards.json，跨设备数据一致
 * Token 从 localStorage 读取，用户无感
 */

const OWNER = 'leowanglei-bit';
const REPO = 'stock-dashboard';
const FILE_PATH = 'data/boards.json';

export interface ServerData {
  boards: Record<string, any>;
  boardOrder: string[];
}

let fileSha: string | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: ServerData | null = null;

function getToken(): string {
  try {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('github_token') : '') || '';
  } catch { return ''; }
}

function authHeaders(): Record<string, string> {
  const tok = getToken();
  const h: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (tok) {
    const prefix = 'Bearer';
    h['Authorization'] = prefix + ' ' + tok;
  }
  return h;
}

export async function loadFromServer(): Promise<ServerData | null> {
  try {
    const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${FILE_PATH}`;
    const rawRes = await fetch(rawUrl, { signal: AbortSignal.timeout(5000) });
    if (rawRes.ok) return await rawRes.json();
  } catch {}

  try {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
    const res = await fetch(url, { headers: authHeaders(), signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    fileSha = data.sha;
    const decoded = decodeURIComponent(escape(atob(data.content)));
    return JSON.parse(decoded);
  } catch { return null; }
}

async function doSave(data: ServerData): Promise<boolean> {
  if (!getToken()) return false;
  const json = JSON.stringify(data, null, 2);
  const content = btoa(unescape(encodeURIComponent(json)));

  try {
    if (!fileSha) {
      const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
      const getRes = await fetch(url, { headers: authHeaders(), signal: AbortSignal.timeout(5000) });
      if (getRes.ok) { const meta = await getRes.json(); fileSha = meta.sha; }
    }

    const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
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
    if (putRes.status === 409) { fileSha = null; return doSave(data); }
    return false;
  } catch { return false; }
}

export function saveToServer(data: ServerData) {
  pendingData = data;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (pendingData) { await doSave(pendingData); pendingData = null; }
  }, 2000);
}
