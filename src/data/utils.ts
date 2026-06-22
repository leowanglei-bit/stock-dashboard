import type { Stock } from '../types';

/** 最小的股票信息（代码 + 名称 + 市场），用于创建初始 Stock */
export interface StockSeed {
  code: string;
  name: string;
  market: Stock['market'];
}

let idCounter = 0;
export const genId = (prefix = 'id') => `${prefix}-${++idCounter}-${Date.now()}`;

/** 从 StockSeed 创建初始 Stock（价格会被 API 覆盖） */
export function entryToStock(entry: StockSeed): Stock {
  const basePrice = randomBasePrice(entry.market);
  const volatility = (Math.random() - 0.5) * 10;
  const price = parseFloat((basePrice * (1 + volatility / 100)).toFixed(2));
  return {
    id: genId('stk'),
    code: entry.code,
    name: entry.name,
    market: entry.market,
    price,
    prevClose: price,
    changePercent: 0,
  };
}

/** 根据市场类型生成一个基准股价 */
function randomBasePrice(market: string): number {
  // 科创/创业板股票价格范围偏高
  const ranges: Record<string, [number, number]> = {
    star: [30, 300],
    chinext: [15, 200],
    bse: [5, 80],
    sh: [10, 200],
    sz: [8, 150],
  };
  const [min, max] = ranges[market] || [10, 100];
  return parseFloat((min + Math.random() * (max - min)).toFixed(2));
}
