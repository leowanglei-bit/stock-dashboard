import { useEffect, useRef, useCallback } from 'react';
import type { Board } from '../types';
import { fetchRealtimeQuotes, mergeQuotes } from '../data/sinaApi';

/** 判断当前是否为 A 股交易时间 */
function isTradingTime(): boolean {
  const now = new Date();
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  const h = now.getHours();
  const m = now.getMinutes();
  const t = h * 60 + m;
  return (t >= 570 && t < 690) || (t >= 780 && t < 900);
}

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

      const now = new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      onUpdateTime?.(now);
      onApiStatus?.('ok');
    } else {
      onApiStatus?.('unavailable');
    }

    fetching.current = false;
  }, [setBoards, onUpdateTime, onApiStatus]);

  // 首次立即拉取（仅交易时段）
  useEffect(() => {
    if (isTradingTime()) tick();
  }, []); // eslint-disable-line

  // 定时拉取 — 交易时段按用户设置，非交易时段 60 秒检测一次
  useEffect(() => {
    if (!active) return;
    const interval = isTradingTime() ? intervalMs : 60000;
    const timer = setInterval(tick, interval);
    return () => clearInterval(timer);
  }, [active, intervalMs, tick]);

  return { refresh: tick };
}
