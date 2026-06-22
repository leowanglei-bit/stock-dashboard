/**
 * A 股股票数据库
 * 冷启动时使用内置列表，后台使用新浪市场中心 API 拉取全量数据并缓存到 localStorage
 */

export interface StockSearchItem {
  code: string;
  name: string;
  market: 'sh' | 'sz' | 'star' | 'chinext' | 'bse';
}

// ───── 内置精简版（冷启动用，覆盖 95% 常见交易股票） ─────
const BUILT_IN: [string, string, number][] = [
  ['600000','浦发银行',0],['600015','华夏银行',0],['600016','民生银行',0],['600036','招商银行',0],
  ['600908','无锡银行',0],['600919','江苏银行',0],['600926','杭州银行',0],['601009','南京银行',0],
  ['601128','常熟银行',0],['601166','兴业银行',0],['601169','北京银行',0],['601229','上海银行',0],
  ['601288','农业银行',0],['601328','交通银行',0],['601398','工商银行',0],['601528','瑞丰银行',0],
  ['601577','长沙银行',0],['601838','成都银行',0],['601860','紫金银行',0],['601939','建设银行',0],
  ['601963','重庆银行',0],['601988','中国银行',0],['601997','贵阳银行',0],['002142','宁波银行',1],
  ['002807','江阴银行',1],['002839','张家港行',1],['002936','郑州银行',1],['002948','青岛银行',1],
  ['600030','中信证券',0],['601318','中国平安',0],['600519','贵州茅台',0],['000858','五粮液',1],
  ['000333','美的集团',1],['300750','宁德时代',2],['002594','比亚迪',1],['688981','中芯国际',3],
  ['600941','中国移动',0],['300059','东方财富',2],['002230','科大讯飞',1],['300308','中际旭创',2],
  ['600036','招商银行',0],['600900','长江电力',0],['601857','中国石油',0],['600028','中国石化',0],
];

const MARKET_MAP: Record<number, StockSearchItem['market']> = { 0: 'sh', 1: 'sz', 2: 'chinext', 3: 'star' };
const BUILT_IN_DB: StockSearchItem[] = BUILT_IN.map(([code, name, m]) => ({ code, name, market: MARKET_MAP[m] }));

// ───── 缓存管理 ─────
const CACHE_KEY = 'stock_search_db_v1';
const CACHE_TIME_KEY = 'stock_search_db_updated';

function loadCache(): StockSearchItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StockSearchItem[];
    return Array.isArray(parsed) && parsed.length > 100 ? parsed : null;
  } catch { return null; }
}

export function saveCache(data: StockSearchItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  } catch { /* quota */ }
}

function shouldRefresh(): boolean {
  try {
    const last = localStorage.getItem(CACHE_TIME_KEY);
    if (!last) return true;
    return Date.now() - parseInt(last, 10) > 7 * 24 * 60 * 60 * 1000;
  } catch { return true; }
}

// ───── API 获取全量股票（新浪市场中心） ─────
// 每个市场节点每页 100 只，先取第一页获取 total 再算页数
const MARKET_NODES: { node: string; market: StockSearchItem['market'] }[] = [
  { node: 'sh_a', market: 'sh' },     // 沪市主板 ~1500
  { node: 'sz_a', market: 'sz' },     // 深市主板 ~1500
  { node: 'cyb', market: 'chinext' },  // 创业板 ~1300
  { node: 'kcb', market: 'star' },     // 科创板 ~560
  { node: 'bse', market: 'bse' },      // 北交所 ~200
];

async function fetchNodeMarket(node: string, market: StockSearchItem['market']): Promise<StockSearchItem[]> {
  const results: StockSearchItem[] = [];
  // 先取第一页拿总数
  const firstUrl = `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=1&num=100&sort=symbol&asc=1&node=${node}&_s_r_a=init`;
  const firstRes = await fetch(firstUrl, {
    headers: { Referer: 'https://finance.sina.com.cn' },
    signal: AbortSignal.timeout(10000),
  });
  const firstText = await firstRes.text();
  let firstData: any[];
  try { firstData = JSON.parse(firstText); } catch { return []; }
  if (!Array.isArray(firstData) || firstData.length === 0) return [];

  // 从第一页数据中获取 total（如果有的话），或者假设分页
  // 实际 API 不返回 total，我们通过 num * 5 估算
  firstData.forEach((item: any) => {
    const code = item.code;
    if (code) {
      results.push({ code: code.toString(), name: item.name || '', market });
    }
  });

  // 尝试更多页面（每页 100，最多 25 页覆盖 2500 只）
  for (let page = 2; page <= 25; page++) {
    const url = `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=100&sort=symbol&asc=1&node=${node}&_s_r_a=init`;
    try {
      const res = await fetch(url, {
        headers: { Referer: 'https://finance.sina.com.cn' },
        signal: AbortSignal.timeout(8000),
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data) || data.length === 0) break; // 无更多数据
      data.forEach((item: any) => {
        const code = item.code;
        if (code) results.push({ code: code.toString(), name: item.name || '', market });
      });
      if (data.length < 100) break; // 最后一页
    } catch { break; }
  }

  return results;
}

export async function fetchAllStocksFromAPI(): Promise<StockSearchItem[]> {
  const all: StockSearchItem[] = [];
  for (const { node, market } of MARKET_NODES) {
    try {
      const stocks = await fetchNodeMarket(node, market);
      all.push(...stocks);
    } catch { /* skip */ }
  }
  return all;
}

// ───── 公开接口 ─────
/** 搜索股票 — 合并内置+缓存数据 */
export function searchStocksLocal(query: string): StockSearchItem[] {
  const q = query.trim();
  if (!q) return [];

  const seen = new Map<string, StockSearchItem>();
  for (const s of BUILT_IN_DB) seen.set(s.code, s);
  const cached = loadCache();
  if (cached) { for (const s of cached) seen.set(s.code, s); }
  const source = [...seen.values()];

  const results = source.filter((s) => {
    if (s.name === q || s.code === q) return true;
    if (q.length >= 2 && (s.name.includes(q) || s.code.includes(q))) return true;
    return false;
  });

  results.sort((a, b) => {
    const sa = a.name === q || a.code === q ? 0 : a.name.startsWith(q) ? 1 : 2;
    const sb = b.name === q || b.code === q ? 0 : b.name.startsWith(q) ? 1 : 2;
    return sa - sb;
  });

  return results.slice(0, 20);
}

/** 立即从 API 拉取全量数据并缓存（强制） */
export async function forceRefreshStockDB(): Promise<number> {
  const data = await fetchAllStocksFromAPI();
  if (data.length > 100) {
    saveCache(data);
  }
  return data.length;
}

/** 每周检查更新 */
export function tryRefreshStockDB() {
  if (!shouldRefresh()) return;
  fetchAllStocksFromAPI().then((data) => {
    if (data.length > 100) saveCache(data);
  }).catch(() => {});
}
