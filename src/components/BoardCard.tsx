import React, { useState } from 'react';
import styles from './BoardCard.module.css';
import StockRow from './StockRow';
import AddStockForm from './AddStockForm';
import type { Stock, Board } from '../types';

interface BoardCardProps {
  board: Board;
  onRename: (boardId: string, title: string) => void;
  onDelete: (boardId: string) => void;
  onAddStock: (boardId: string, stock: Stock) => void;
  onDeleteStock: (boardId: string, stockId: string) => void;
  onDragStart: (e: React.DragEvent, stockId: string, boardId: string) => void;
  onDragOverBoard: (e: React.DragEvent, boardId: string) => void;
  onDragOverStock: (e: React.DragEvent, stockId: string, boardId: string) => void;
  onDropOnBoard: (e: React.DragEvent, boardId: string) => void;
  onDropOnStock: (e: React.DragEvent, targetStockId: string, boardId: string) => void;
  draggingStockId: string | null;
  onBoardDragStart?: (e: React.DragEvent, boardId: string) => void;
}

export default function BoardCard({
  board,
  onRename,
  onDelete,
  onAddStock,
  onDeleteStock,
  onDragStart,
  onDragOverBoard,
  onDragOverStock,
  onDropOnBoard,
  onDropOnStock,
  draggingStockId,
  onBoardDragStart,
}: BoardCardProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(board.title);
  const [showForm, setShowForm] = useState(false);

  const avgChange = board.stocks.length > 0
    ? board.stocks.reduce((s, st) => s + st.changePercent, 0) / board.stocks.length
    : 0;

  const handleRename = () => {
    if (editValue.trim() && editValue !== board.title) {
      onRename(board.id, editValue.trim());
    }
    setEditing(false);
  };

  return (
    <div
      className={styles.boardCard}
      onDragOver={(e) => onDragOverBoard(e, board.id)}
      onDrop={(e) => onDropOnBoard(e, board.id)}
    >
      {/* Header — draggable to move between sections */}
      <div
        className={styles.header}
        draggable={!!onBoardDragStart}
        onDragStart={(e) => onBoardDragStart?.(e, board.id)}
        style={{ cursor: onBoardDragStart ? 'grab' : undefined }}
      >
        <div className={styles.titleWrapper}>
          {editing ? (
            <input
              className={styles.titleInput}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
          ) : (
            <span className={styles.title} onClick={() => { setEditValue(board.title); setEditing(true); }}>
              {board.title}
            </span>
          )}
        </div>
        <div className={styles.headerRight}>
          {board.stocks.length > 0 && (
            <span
              className={styles.avgChange}
              style={{
                color: avgChange >= 0 ? 'var(--rise-color)' : 'var(--fall-color)',
                backgroundColor: avgChange >= 0 ? 'var(--rise-bg)' : 'var(--fall-bg)',
              }}
            >
              {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
            </span>
          )}
          <button className={styles.actionBtn} onClick={() => onDelete(board.id)} title="删除板块">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stock List */}
      <div className={styles.stockList}>
        {board.stocks.length === 0 ? (
          <div className={styles.emptyHint}>暂无股票，点击下方添加</div>
        ) : (
          board.stocks.map((stock) => (
            <StockRow
              key={stock.id}
              stock={stock}
              boardId={board.id}
              isDragging={draggingStockId === stock.id}
              onDragStart={onDragStart}
              onDragOver={onDragOverStock}
              onDrop={onDropOnStock}
              onDelete={(stockId) => onDeleteStock(board.id, stockId)}
            />
          ))
        )}
      </div>

      {/* Add Stock Toggle */}
      <button className={styles.toggleForm} onClick={() => setShowForm(!showForm)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {showForm ? (
            <><path d="M5 12h14" /></>
          ) : (
            <><path d="M5 12h14" /><path d="M12 5v14" /></>
          )}
        </svg>
        {showForm ? '收起' : '添加股票'}
      </button>

      {showForm && <AddStockForm onAddStock={(stock) => { onAddStock(board.id, stock); setShowForm(false); }} />}
    </div>
  );
}
