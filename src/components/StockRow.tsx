import React, { useRef, useEffect } from 'react';
import styles from './StockRow.module.css';
import type { Stock } from '../types';

const marketLabels: Record<string, { label: string; cls: string }> = {
  sh: { label: '沪', cls: 'badgeMain' },
  sz: { label: '深', cls: 'badgeMain' },
  star: { label: '科', cls: 'badgeStar' },
  chinext: { label: '创', cls: 'badgeChinext' },
  bse: { label: '北', cls: 'badgeBse' },
};

interface StockRowProps {
  stock: Stock;
  onDragStart: (e: React.DragEvent, stockId: string, boardId: string) => void;
  onDragOver: (e: React.DragEvent, stockId: string, boardId: string) => void;
  onDrop: (e: React.DragEvent, targetStockId: string, boardId: string) => void;
  onDelete: (stockId: string) => void;
  boardId: string;
  isDragging?: boolean;
}

export default function StockRow({
  stock,
  onDragStart,
  onDragOver,
  onDrop,
  onDelete,
  boardId,
  isDragging,
}: StockRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const changeColor = stock.changePercent >= 0 ? 'var(--rise-color)' : 'var(--fall-color)';
  const changeBg = stock.changePercent >= 0 ? 'var(--rise-bg)' : 'var(--fall-bg)';
  const changeBorder = stock.changePercent >= 0 ? 'var(--rise-border)' : 'var(--fall-border)';
  const m = marketLabels[stock.market] || marketLabels.sh;

  // Flash effect on price change
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    if (stock.changePercent > 0) {
      el.classList.remove('flash-fall');
      el.classList.add('flash-rise');
    } else if (stock.changePercent < 0) {
      el.classList.remove('flash-rise');
      el.classList.add('flash-fall');
    }
  }, [stock.price, stock.changePercent]);

  return (
    <div
      ref={ref}
      className={`${styles.stockRow} ${isDragging ? styles.stockRowDragging : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, stock.id, boardId)}
      onDragOver={(e) => onDragOver(e, stock.id, boardId)}
      onDrop={(e) => onDrop(e, stock.id, boardId)}
    >
      <div className={styles.stockLeft}>
        <span className={styles.grip}>
          <svg width="10" height="14" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="3" cy="2" r="1.5" /><circle cx="7" cy="2" r="1.5" />
            <circle cx="3" cy="6" r="1.5" /><circle cx="7" cy="6" r="1.5" />
            <circle cx="3" cy="10" r="1.5" /><circle cx="7" cy="10" r="1.5" />
            <circle cx="3" cy="14" r="1.5" /><circle cx="7" cy="14" r="1.5" />
          </svg>
        </span>
        <span className={`${styles.marketBadge} ${styles[m.cls]}`}>{m.label}</span>
        <div className={styles.stockMeta}>
          <span className={styles.stockName}>{stock.name}</span>
          <span className={styles.stockCode}>
            {stock.code}
            {stock.popularity && <span className={styles.stockPop}>· 人气{stock.popularity}</span>}
          </span>
        </div>
      </div>
      <div className={styles.stockRight}>
        <span className={styles.price} style={{ color: changeColor }}>
          {stock.price.toFixed(2)}
        </span>
        <span
          className={styles.percentBox}
          style={{ color: changeColor, backgroundColor: changeBg, border: `1px solid ${changeBorder}` }}
        >
          {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </span>
        <button className={styles.deleteBtn} onClick={() => onDelete(stock.id)} title="删除">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
