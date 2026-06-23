/**
 * 服务端持久化 — GitHub Repository API
 * Token 在构建时通过 VITE_GH_TOKEN 注入，用户无感
 * 本地开发时 token 为空，回退 localStorage
 */

import type { Board } from '../types';

const OWNER = 'leowanglei-bit';
const REPO = 'stock-dashboard';
const FILE_PATH = 'data/boards.json';

export interface ServerData {
  boards: Record<string, Board>;
  boardOrder: string[];
}

// 构建时注入的 token（Vite 暴露 import.meta.env.VITE_*）
const GH_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GH_TOKEN) as string || '';

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (GH_TOKEN) h['Authorization'] = 'Bearer ' + GH_TOKEN;
  return h;
}

let fileSha: string | null = null;

/** 从 GitHub 读取 boards.json */
export async function loadFromServer(): Promise<ServerData | null> {
  // 先试 raw（无认证，但读取最新提交的数据）
  try {
    const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${FILE_PATH}`;
    const rawRes = await fetch(rawUrl, { signal: AbortSignal.timeout(5000) });
    if (rawRes.ok) {
      const data = await rawRes.json();
      if (data && data.boards) return data;
    }
  } catch {}

  // 再试 API（需 token）
  if (!GH_TOKEN) return null;
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

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: ServerData | null = null;

async function doSave(data: ServerData): Promise<boolean> {
  if (!GH_TOKEN) return false;
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

/** 保存到 GitHub（防抖 2 秒） */
export function saveToServer(data: ServerData) {
  if (!GH_TOKEN) return;
  pendingData = data;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (pendingData) { await doSave(pendingData); pendingData = null; }
  }, 2000);
}

/** 判断当前是否使用服务端模式 */
export function isServerMode(): boolean {
  return GH_TOKEN.length > 0;
}
