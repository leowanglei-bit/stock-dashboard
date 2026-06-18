import { useEffect, useRef, useCallback } from 'react';
import type { Board } from '../types';

/**
 * 定时模拟股票价格波动
 */
export function usePriceSimulation(
  _boards: Record<string, Board>,
  setBoards: React.Dispatch<React.SetStateAction<Record<string, Board>>>,
  intervalMs: number,
  active: boolean
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setBoards((prev) => {
      const next: Record<string, Board> = {};
      for (const [id, board] of Object.entries(prev)) {
        next[id] = {
          ...board,
          stocks: board.stocks.map((stock) => {
            // 模拟随机波动: -3% ~ +3%
            const factor = (Math.random() - 0.5) * 6;
            const change = stock.price * (factor / 100);
            const newPrice = parseFloat((stock.price + change).toFixed(2));
            const changePercent = parseFloat(
              (((newPrice - stock.prevClose) / stock.prevClose) * 100).toFixed(2)
            );
            return {
              ...stock,
              prevClose: stock.prevClose,
              price: newPrice,
              changePercent,
            };
          }),
        };
      }
      return next;
    });
  }, [setBoards]);

  useEffect(() => {
    if (active && intervalMs > 0) {
      timerRef.current = setInterval(tick, intervalMs);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [active, intervalMs, tick]);
}
