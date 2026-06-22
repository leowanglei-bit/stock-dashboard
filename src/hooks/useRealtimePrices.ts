import { useEffect, useRef, useCallback } from 'react';
import type { Board } from '../types';
import { fetchRealtimeQuotes, mergeQuotesIntoStocks } from '../data/sinaApi';

interface UseRealtimePricesOptions {
  boards: Record<string, Board>;
  setBoards: React.Dispatch<React.SetStateAction<Record<string, Board>>>;
  intervalMs: number;
  active: boolean;
  onUpdateTime?: (time: string) => void;
  onStatusChange?: (status: 'fetching' | 'ok' | 'simulating' | 'error') => void;
}

export function useRealtimePrices({
  boards,
  setBoards,
  intervalMs,
  active,
  onUpdateTime,
  onStatusChange,
}: UseRealtimePricesOptions) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetching = useRef(false);

  const fetchPrices = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    onStatusChange?.('fetching');

    try {
      // 收集所有股票代码
      const stockList: { code: string; market: string }[] = [];
      for (const board of Object.values(boards)) {
        for (const stock of board.stocks) {
          stockList.push({ code: stock.code, market: stock.market });
        }
      }

      if (stockList.length === 0) {
        isFetching.current = false;
        onStatusChange?.('ok');
        return;
      }

      const quotes = await fetchRealtimeQuotes(stockList);

      if (quotes.length > 0) {
        setBoards((prev) => {
          const next: Record<string, Board> = {};
          for (const [id, board] of Object.entries(prev)) {
            const updates = mergeQuotesIntoStocks(
              board.stocks.map((s) => ({ id: s.id, code: s.code, market: s.market, price: s.price, prevClose: s.prevClose })),
              quotes
            );
            const updateMap = new Map(updates.map((u) => [u.id, u]));

            next[id] = {
              ...board,
              stocks: board.stocks.map((s) => {
                const u = updateMap.get(s.id);
                if (u && u.price > 0) {
                  return { ...s, price: u.price, prevClose: u.prevClose, changePercent: u.changePercent };
                }
                return s;
              }),
            };
          }
          return next;
        });

        // 取第一个有效报价的时间
        const firstQuote = quotes.find((q) => q.time);
        if (firstQuote?.time) {
          onUpdateTime?.(firstQuote.time);
        } else {
          onUpdateTime?.(new Date().toLocaleTimeString('zh-CN'));
        }

        onStatusChange?.('ok');
      } else {
        // API 无数据，降级为模拟
        simulateTick();
        onStatusChange?.('simulating');
      }
    } catch {
      // API 失败，降级为模拟
      simulateTick();
      onStatusChange?.('error');
    }

    isFetching.current = false;
  }, [boards, setBoards, onUpdateTime, onStatusChange]);

  const simulateTick = useCallback(() => {
    setBoards((prev) => {
      const next: Record<string, Board> = {};
      for (const [id, board] of Object.entries(prev)) {
        next[id] = {
          ...board,
          stocks: board.stocks.map((stock) => {
            const factor = (Math.random() - 0.5) * 6;
            const change = stock.price * (factor / 100);
            const newPrice = parseFloat((stock.price + change).toFixed(2));
            const changePercent = parseFloat(
              (((newPrice - stock.prevClose) / stock.prevClose) * 100).toFixed(2)
            );
            return { ...stock, price: newPrice, prevClose: stock.prevClose, changePercent };
          }),
        };
      }
      return next;
    });
    onUpdateTime?.(new Date().toLocaleTimeString('zh-CN'));
  }, [setBoards, onUpdateTime]);

  // Initial fetch on mount
  useEffect(() => {
    fetchPrices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic fetch/simulation
  useEffect(() => {
    if (active && intervalMs > 0) {
      timerRef.current = setInterval(fetchPrices, intervalMs);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [active, intervalMs, fetchPrices]);
}
