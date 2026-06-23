export interface Stock {
  id: string;
  code: string;
  name: string;
  /** sh=沪主板, sz=深主板, star=科创板, chinext=创业板, bse=北交所 */
  market: 'sh' | 'sz' | 'star' | 'chinext' | 'bse';
  price: number;
  prevClose: number;
  changePercent: number;
}

export interface Board {
  id: string;
  title: string;
  stocks: Stock[];
}

export type ThemeMode = 'dark' | 'light';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
