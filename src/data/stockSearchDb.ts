/**
 * A 股股票搜索
 * 全量清单不打进 bundle：首次使用时从服务器取 data/stocks.json（约 140 KB / 48 KB gzip），
 * 取回后常驻内存；清单未命中时退回新浪 suggest 接口补充。
 */

import { fetchDataset } from '../lib/dataSource';
import type { StockSeed } from './utils';

export type { StockSeed };

interface StocksFile {
  generatedAt: string;
  count: number;
  marketOrder: StockSeed['market'][];
  /** [代码, 名称, marketOrder 下标] */
  stocks: [string, string, number][];
}

let db: StockSeed[] | null = null;
let loading: Promise<StockSeed[]> | null = null;
let loadError: Error | null = null;

/** 最近一次数据集加载的错误（null = 正常），供界面提示用 */
export const getStockDbError = () => loadError;

/** 加载全量清单（幂等、并发去重）；失败会抛出，下次调用重试 */
export function loadStockDb(): Promise<StockSeed[]> {
  if (db) return Promise.resolve(db);
  if (!loading) {
    loading = fetchDataset<StocksFile>('stocks.json')
      .then((file) => {
        db = file.stocks.map(([code, name, mi]) => ({
          code,
          name,
          market: file.marketOrder[mi] ?? 'sh',
        }));
        loadError = null;
        return db;
      })
      .catch((err: Error) => {
        loading = null;
        loadError = err;
        throw err;
      });
  }
  return loading;
}

/** 预取清单（打开搜索框时调一次，首次搜索不用等网络） */
export function preloadStockDb() {
  loadStockDb().catch(() => undefined);
}

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
/** 搜索股票 —— 先查服务器下发的全量清单，未命中时尝试 API */
export async function searchStocks(query: string): Promise<StockSeed[]> {
  const q = query.trim();
  if (!q) return [];

  // 1. 全量清单搜索（数据集加载失败则跳过，直接走 API）
  let full: StockSeed[] = [];
  try {
    full = await loadStockDb();
  } catch {
    full = [];
  }

  const local = full.filter((s) => {
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

  // 2. 清单未命中 → 尝试 API
  const api = await fetchFromAPI(q);
  return api.slice(0, 20);
}
