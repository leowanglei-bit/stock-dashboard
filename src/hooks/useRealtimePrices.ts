import { useEffect, useRef, useCallback } from 'react';
import type { Board } from '../types';
import { fetchRealtimeQuotes, mergeQuotes } from '../data/sinaApi';

export function useRealtimePrices({
  _boards,
  setBoards,
  intervalMs,
  active,
  onUpdateTime,
  onApiStatus,
}: {
  _boards: Record<string, Board>;
  setBoards: React.Dispatch<React.SetStateAction<Record<string, Board>>>;
  intervalMs: number;
  active: boolean;
  onUpdateTime?: (time: string) => void;
  onApiStatus?: (status: 'fetching' | 'ok' | 'unavailable') => void;
}): { refresh: () => void } {
  const fetching = useRef(false);
  // Hold latest boards in a ref so the callback doesn't stale-close
  const boardsRef = useRef(_boards);
  boardsRef.current = _boards;

  const tick = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    onApiStatus?.('fetching');

    const current = boardsRef.current;
    const stockList: { code: string; market: string }[] = [];
    for (const b of Object.values(current)) {
      for (const s of b.stocks) stockList.push({ code: s.code, market: s.market });
    }

    if (stockList.length === 0) {
      fetching.current = false;
      onApiStatus?.('ok');
      return;
    }

    const { quotes, source } = await fetchRealtimeQuotes(stockList);

    if (source !== null && quotes.length > 0) {
      const updates = mergeQuotes(
        Object.values(current).flatMap((b) => b.stocks.map((s) => ({ id: s.id, code: s.code, market: s.market }))),
        quotes
      );

      if (updates.size > 0) {
        setBoards((prev) => {
          const next: Record<string, Board> = {};
          for (const [id, board] of Object.entries(prev)) {
            next[id] = {
              ...board,
              stocks: board.stocks.map((s) => {
                const u = updates.get(s.id);
                return u ? { ...s, price: u.price, prevClose: u.prevClose, changePercent: u.changePercent } : s;
              }),
            };
          }
          return next;
        });
      }

      const qt = quotes.find((q) => q.time);
      onUpdateTime?.(qt?.time || new Date().toLocaleTimeString('zh-CN'));
      onApiStatus?.('ok');
    } else {
      // 所有 API 全部不可用
      onApiStatus?.('unavailable');
    }

    fetching.current = false;
  }, [setBoards, onUpdateTime, onApiStatus]);

  // 首次立即拉取
  useEffect(() => {
    tick();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 定时拉取
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(tick, intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs, tick]);

  return { refresh: tick };
}
