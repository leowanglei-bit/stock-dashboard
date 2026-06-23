/**
 * 服务端持久化 — 调 Flask 后端 API
 * Token 存 localStorage，首次使用需登录一次
 */

const SERVER = '';

export interface ServerData {
  boards: Record<string, any>;
  boardOrder: string[];
}

function token(): string {
  try { return localStorage.getItem('lxcg_token') || ''; } catch { return ''; }
}

export function setToken(t: string) {
  try { localStorage.setItem('lxcg_token', t); } catch {}
}

export function clearToken() {
  try { localStorage.removeItem('lxcg_token'); } catch {}
}

export function isLoggedIn(): boolean {
  return token().length > 0;
}

const AUTH_PREFIX = 'Bearer';

async function api(path: string, options?: RequestInit): Promise<Response> {
  const base = SERVER || window.location.origin;
  const t = token();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (t) headers['Authorization'] = AUTH_PREFIX + ' ' + t;
  return fetch(base + path, { ...options, headers });
}

export async function login(password: string): Promise<boolean> {
  const res = await api('/api/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  setToken(data.token);
  return true;
}

export async function loadFromServer(): Promise<ServerData | null> {
  try {
    const res = await api('/api/boards');
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function saveToServer(data: ServerData): Promise<boolean> {
  try {
    const res = await api('/api/boards', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch { return false; }
}
