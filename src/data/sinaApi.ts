/**
 * 通过新浪财经 API 获取 A 股实时行情
 * API: https://hq.sinajs.cn/list=<code1>,<code2>,...
 * 返回格式: var hq_str_sh600519="贵州茅台,1999.00,2000.00,1980.00,...";
 */

/** 将股票代码转为新浪 API 格式 */
function toSinaCode(code: string, market?: string): string {
  // 已有前缀的直接返回
  if (code.startsWith('sh') || code.startsWith('sz') || code.startsWith('bj')) {
    return code;
  }
  // 6开头 → 沪市主板/科创板
  if (code.startsWith('6')) return `sh${code}`;
  // 4/8开头 → 北交所
  if (code.startsWith('4') || code.startsWith('8')) return `bj${code}`;
  // 0/3开头 → 深市
  if (code.startsWith('0') || code.startsWith('3')) return `sz${code}`;
  // 未知，用传入的 market 判断
  if (market === 'sh' || market === 'star') return `sh${code}`;
  return `sz${code}`;
}

export interface SinaQuote {
  code: string;       // 原始代码
  name: string;       // 股票名称
  open: number;       // 今开
  prevClose: number;  // 昨收
  price: number;      // 当前价
  high: number;       // 最高
  low: number;        // 最低
  volume: number;     // 成交量(手)
  amount: number;     // 成交额(万)
  changePercent: number; // 涨跌幅
  time: string;       // 更新时间
}

function parseSinaResponse(text: string): SinaQuote[] {
  const results: SinaQuote[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/var hq_str_(\w+)="(.+)"/);
    if (!match) continue;
    const parts = match[2].split(',');
    if (parts.length < 32) continue;

    const name = parts[0];
    const open = parseFloat(parts[1]);
    const prevClose = parseFloat(parts[2]);
    const price = parseFloat(parts[3]);
    const high = parseFloat(parts[4]);
    const low = parseFloat(parts[5]);
    const volume = parseFloat(parts[8]);      // 手
    const amount = parseFloat(parts[9]) / 10000; // 转为万
    const time = parts[31] || '';

    results.push({
      code: match[1],
      name,
      open,
      prevClose,
      price,
      high,
      low,
      volume,
      amount,
      changePercent: prevClose > 0 ? parseFloat((((price - prevClose) / prevClose) * 100).toFixed(2)) : 0,
      time,
    });
  }
  return results;
}

export async function fetchRealtimeQuotes(stocks: { code: string; market?: string }[]): Promise<SinaQuote[]> {
  if (stocks.length === 0) return [];

  const sinaCodes = stocks.map((s) => toSinaCode(s.code, s.market));
  // 分批，每批最多 50 个
  const BATCH_SIZE = 50;
  const allQuotes: SinaQuote[] = [];

  for (let i = 0; i < sinaCodes.length; i += BATCH_SIZE) {
    const batch = sinaCodes.slice(i, i + BATCH_SIZE);
    const url = `https://hq.sinajs.cn/list=${batch.join(',')}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Referer: 'https://finance.sina.com.cn' },
      });
      clearTimeout(timeout);

      const text = await res.text();
      // 解码 GBK 编码
      const decoder = new TextDecoder('gbk');
      const decoded = decoder.decode(
        typeof text === 'string' ? new TextEncoder().encode(text) : text
      );
      const quotes = parseSinaResponse(decoded);
      allQuotes.push(...quotes);
    } catch (err) {
      console.warn(`Sina API batch failed:`, err);
    }
  }

  return allQuotes;
}

/** 将新浪报价合并到本地股票数据中 */
export function mergeQuotesIntoStocks(
  stocks: { id: string; code: string; market: string; price: number; prevClose: number }[],
  quotes: SinaQuote[]
): { id: string; price: number; prevClose: number; changePercent: number }[] {
  return stocks.map((stock) => {
    const sinaCode = toSinaCode(stock.code, stock.market);
    const quote = quotes.find((q) => q.code === sinaCode);
    if (quote && quote.price > 0) {
      return {
        id: stock.id,
        price: quote.price,
        prevClose: quote.prevClose,
        changePercent: quote.changePercent,
      };
    }
    // 无数据时保持原值
    return { id: stock.id, price: stock.price, prevClose: stock.prevClose, changePercent: 0 };
  });
}
