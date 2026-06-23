import type { Stock } from '../types';

export interface StockSeed {
  code: string;
  name: string;
  market: Stock['market'];
}

let idCounter = 0;
export const genId = (prefix = 'id') => `${prefix}-${++idCounter}-${Date.now()}`;

/** 从 StockSeed 创建 Stock（价格会被实时 API 覆盖） */
export function entryToStock(entry: StockSeed): Stock {
  return {
    id: genId('stk'),
    code: entry.code,
    name: entry.name,
    market: entry.market,
    price: 0,
    prevClose: 0,
    changePercent: 0,
  };
}
