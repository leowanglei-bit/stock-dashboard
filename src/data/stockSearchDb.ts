/**
 * A 股股票搜索
 * 内置全量数据（~7200 只），本地搜索，内置未命中时尝试 API 补充
 */

import { ALL_STOCKS } from './fullStocks';
import type { StockSeed } from './fullStocks';

const FULL_DB: StockSeed[] = ALL_STOCKS;

// ───── API 补充查询 ─────
async function fetchFromAPI(query: string): Promise<StockSeed[]> {
  const url = `https://suggest3.sinajs.cn/suggest/type=11&key=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: { Referer: 'https://finance.sina.com.cn' },
      signal: AbortSignal.timeout(5000),
    });
    const buf = await res.arrayBuffer();
    const text = new TextDecoder('gbk').decode(buf);
    const m = text.match(/var suggestData=\[(.*?)\];/);
    if (!m) return [];
    const items = JSON.parse(`[${m[1]}]`) as [string, string, string][];
    return items
      .filter(([codeFull]) => /^(sz|sh)(\d{6})$/.test(codeFull))
      .map(([codeFull, name]) => {
        const match = codeFull.match(/^(sz|sh)(\d{6})$/);
        const code = match![2];
        const prefix = match![1];
        let market: StockSeed['market'] = 'sz';
        if (prefix === 'sh') market = code.startsWith('688') ? 'star' : 'sh';
        else market = code.startsWith('30') ? 'chinext' : code.startsWith('8') ? 'bse' : 'sz';
        return { code, name, market };
      });
  } catch { return []; }
}

// ───── 搜索接口 ─────
/** 搜索股票 — 先查内置全量数据，未命中时尝试 API */
export async function searchStocks(query: string): Promise<StockSeed[]> {
  const q = query.trim();
  if (!q) return [];

  // 1. 内置全量搜索
  const local = FULL_DB.filter((s) => {
    if (s.name === q || s.code === q) return true;
    if (q.length >= 2 && (s.name.includes(q) || s.code.includes(q))) return true;
    return false;
  });

  local.sort((a, b) => {
    const sa = a.name === q || a.code === q ? 0 : a.name.startsWith(q) ? 1 : 2;
    const sb = b.name === q || b.code === q ? 0 : b.name.startsWith(q) ? 1 : 2;
    return sa - sb;
  });

  if (local.length > 0) return local.slice(0, 20);

  // 2. 内置未命中 → 尝试 API
  const api = await fetchFromAPI(q);
  return api.slice(0, 20);
}
