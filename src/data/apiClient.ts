/**
 * 服务端持久化 — GitHub Repository API
 * 数据以压缩格式存储（去掉冗余字段），加载时自动展开
 */

const OWNER = 'leowanglei-bit';
const REPO = 'stock-dashboard';
const FILE_PATH = 'data/boards.json';

const M_NUM: Record<string, number> = { sh: 0, sz: 1, chinext: 2, star: 3, bse: 4 };
const M_STR: Record<number, string> = { 0: 'sh', 1: 'sz', 2: 'chinext', 3: 'star', 4: 'bse' };

export interface ServerData {
  boards: Record<string, any>;
  boardOrder: string[];
}

// ───── 压缩 / 展开 ─────

/** 压缩：完整格式 → 紧凑格式（去掉价格、缩短字段名） */
export function compress(boards: Record<string, any>, boardOrder: string[]): any {
  const b: any = {};
  for (const [id, board] of Object.entries(boards)) {
    b[id] = {
      t: board.title,
      s: board.stocks.map((s: any) => ({
        id: s.id,
        c: s.code,
        n: s.name,
        m: M_NUM[s.market] ?? 0,
      })),
    };
  }
  return { b, o: boardOrder };
}

/** 展开：紧凑格式 → 完整格式（补全价格字段为 0、恢复字段名） */
export function expand(data: any): ServerData {
  const rawBoards = data.b || data.boards || {};
  const rawOrder = data.o || data.boardOrder || [];

  const boards: Record<string, any> = {};
  for (const [id, board] of Object.entries(rawBoards)) {
    const b = board as any;
    boards[id] = {
      id,
      title: b.t || b.title || '',
      stocks: (b.s || b.stocks || []).map((s: any) => ({
        id: s.id || ('stk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)),
        code: s.c || s.code || '',
        name: s.n || s.name || '',
        market: M_STR[typeof s.m === 'number' ? s.m : M_NUM[s.market] ?? 0] || 'sh',
        price: 0,
        prevClose: 0,
        changePercent: 0,
      })),
    };
  }
  return { boards, boardOrder: rawOrder };
}

// ───── GitHub API ─────

const GH_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GH_TOKEN) as string || '';

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (GH_TOKEN) h['Authorization'] = 'Bearer ' + GH_TOKEN;
  return h;
}

let fileSha: string | null = null;

/** 从 GitHub 读取 boards.json（自动展开） */
export async function loadFromServer(): Promise<ServerData | null> {
  try {
    const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${FILE_PATH}`;
    const rawRes = await fetch(rawUrl, { signal: AbortSignal.timeout(5000) });
    if (rawRes.ok) {
      const data = await rawRes.json();
      if (data && (data.b || data.boards)) return expand(data);
    }
  } catch {}

  if (!GH_TOKEN) return null;
  try {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
    const res = await fetch(url, { headers: authHeaders(), signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const meta = await res.json();
    fileSha = meta.sha;
    const decoded = decodeURIComponent(escape(atob(meta.content)));
    const data = JSON.parse(decoded);
    return expand(data);
  } catch { return null; }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: ServerData | null = null;

async function doSave(data: ServerData): Promise<boolean> {
  if (!GH_TOKEN) return false;
  // 压缩后保存
  const compressed = compress(data.boards, data.boardOrder);
  const json = JSON.stringify(compressed);
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

/** 保存到 GitHub（防抖 2 秒，自动压缩） */
export function saveToServer(data: ServerData) {
  if (!GH_TOKEN) return;
  pendingData = data;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (pendingData) { await doSave(pendingData); pendingData = null; }
  }, 2000);
}

export function isServerMode(): boolean {
  return GH_TOKEN.length > 0;
}
