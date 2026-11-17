import type { Metadata } from 'next';
import ValuationBoard from './ValuationBoard';

export const metadata: Metadata = {
  title: '宽基指数估值 · 灵犀茶馆',
  description: '宽基指数 PE-TTM / PB 现值与近 1/3/5/10 年历史百分位',
};

/**
 * 路由入口只负责 metadata：数据在浏览器端从服务器取（见 ValuationBoard.tsx），
 * 构建产物里不再内联估值 JSON。
 */
export default function BroadValuationPage() {
  return <ValuationBoard />;
}
