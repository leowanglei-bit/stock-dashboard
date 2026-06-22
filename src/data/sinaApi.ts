/**
 * A 股实时行情数据源
 * 主用: 新浪财经 hq.sinajs.cn
 * 备用: 腾讯证券 qt.gtimg.cn
 * 全部不可用 => 返回空数组，由上层展示"网络不可用"
 */

export interface StockQuote {
  code: string;       // 新浪格式代码 (如 sh600519)
  name: string;
  price: number;
  prevClose: number;
  changePercent: number;
  time: string;
}

// ───── 新浪 API ─────
function sinaCode(code: string, market?: string): string {
  if (code.startsWith('sh') || code.startsWith('sz') || code.startsWith('bj')) return code;
  if (code.startsWith('6')) return `sh${code}`;
  if (code.startsWith('4') || code.startsWith('8')) return `bj${code}`;
  if (code.startsWith('0') || code.startsWith('3')) return `sz${code}`;
  return market === 'sh' || market === 'star' ? `sh${code}` : `sz${code}`;
}

function parseSina(text: string): StockQuote[] {
  const results: StockQuote[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(/var hq_str_(\w+)="(.+)"/);
    if (!m) continue;
    const parts = m[2].split(',');
    if (parts.length < 32) continue;
    const pc = parseFloat(parts[2]);
    const price = parseFloat(parts[3]);
    results.push({
      code: m[1],
      name: parts[0],
      price,
      prevClose: pc,
      changePercent: pc > 0 ? parseFloat((((price - pc) / pc) * 100).toFixed(2)) : 0,
      time: parts[31] || '',
    });
  }
  return results;
}

async function fetchSina(codes: string[]): Promise<StockQuote[]> {
  const url = `https://hq.sinajs.cn/list=${codes.join(',')}`;
  const res = await fetch(url, {
    headers: { Referer: 'https://finance.sina.com.cn' },
    signal: AbortSignal.timeout(6000),
  });
  const buf = await res.arrayBuffer();
  const text = new TextDecoder('gbk').decode(buf);
  return parseSina(text);
}

// ───── 腾讯 API ─────
function tencentCode(code: string, market?: string): string {
  if (code.startsWith('sh') || code.startsWith('sz') || code.startsWith('bj')) return code;
  if (code.startsWith('6')) return `sh${code}`;
  if (code.startsWith('0') || code.startsWith('3')) return `sz${code}`;
  if (code.startsWith('4') || code.startsWith('8')) return `bj${code}`;
  return market === 'sh' || market === 'star' ? `sh${code}` : `sz${code}`;
}

function parseTencent(text: string): StockQuote[] {
  const results: StockQuote[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(/v_(\w+)="(.+)"/);
    if (!m) continue;
    const parts = m[2].split('~');
    if (parts.length < 46) continue;
    const name = parts[1];
    const code = parts[2];
    const price = parseFloat(parts[3]);
    const prevClose = parseFloat(parts[4]);
    const time = `${parts[30]} ${parts[31]}`;
    results.push({
      code: m[1],
      name: name || code,
      price,
      prevClose,
      changePercent: prevClose > 0 ? parseFloat((((price - prevClose) / prevClose) * 100).toFixed(2)) : 0,
      time,
    });
  }
  return results;
}

async function fetchTencent(codes: string[]): Promise<StockQuote[]> {
  const url = `https://qt.gtimg.cn/q=${codes.join(',')}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(6000),
  });
  const text = await res.text();
  return parseTencent(text);
}

// ───── 统一入口 ─────
export async function fetchRealtimeQuotes(
  stocks: { code: string; market?: string }[]
): Promise<{ quotes: StockQuote[]; source: 'sina' | 'tencent' | null }> {
  if (stocks.length === 0) return { quotes: [], source: null };

  const codes = stocks.map((s) => sinaCode(s.code, s.market));
  // 去重
  const unique = [...new Set(codes)];

  // 1. 试新浪
  try {
    const quotes = await fetchSina(unique);
    if (quotes.length > 0 && quotes.some((q) => q.price > 0)) {
      return { quotes, source: 'sina' };
    }
  } catch { /* 继续试备用 */ }

  // 2. 试腾讯
  try {
    const tencentCodes = stocks.map((s) => tencentCode(s.code, s.market));
    const tUnique = [...new Set(tencentCodes)];
    const quotes = await fetchTencent(tUnique);
    if (quotes.length > 0 && quotes.some((q) => q.price > 0)) {
      return { quotes, source: 'tencent' };
    }
  } catch { /* 无可用数据源 */ }

  // 3. 全部不可用
  return { quotes: [], source: null };
}

/** 将行情报价合并到本地股票数据 */
export function mergeQuotes(
  stocks: { id: string; code: string; market: string }[],
  quotes: StockQuote[]
): Map<string, { price: number; prevClose: number; changePercent: number }> {
  const map = new Map<string, { price: number; prevClose: number; changePercent: number }>();

  for (const stock of stocks) {
    const sc = sinaCode(stock.code, stock.market);
    const q = quotes.find((x) => x.code === sc);
    if (q && q.price > 0) {
      map.set(stock.id, { price: q.price, prevClose: q.prevClose, changePercent: q.changePercent });
    }
  }
  return map;
}
