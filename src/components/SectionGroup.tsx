import React, { useState } from 'react';
import styles from './SectionGroup.module.css';
import BoardCard from './BoardCard';
import type { Board, Stock } from '../types';

interface Props {
  boards: Record<string, Board>;
  boardOrder: string[];
  draggingStockId: string | null;
  onRenameBoard: (boardId: string, title: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onAddStock: (boardId: string, stock: Stock) => void;
  onDeleteStock: (boardId: string, stockId: string) => void;
  onDragStart: (e: React.DragEvent, stockId: string, boardId: string) => void;
  onDragOverBoard: (e: React.DragEvent, boardId: string) => void;
  onDragOverStock: (e: React.DragEvent, stockId: string, boardId: string) => void;
  onDropOnBoard: (e: React.DragEvent, boardId: string) => void;
  onDropOnStock: (e: React.DragEvent, targetStockId: string, boardId: string) => void;
  onBoardDragStart: (e: React.DragEvent, boardId: string) => void;
  onBoardDropOnReorder: (e: React.DragEvent, targetBoardId: string) => void;
  onBoardDragOver: (e: React.DragEvent) => void;
}

export default function SectionGroup({
  boards,
  boardOrder,
  draggingStockId,
  onRenameBoard,
  onDeleteBoard,
  onAddStock,
  onDeleteStock,
  onDragStart,
  onDragOverBoard,
  onDragOverStock,
  onDropOnBoard,
  onDropOnStock,
  onBoardDragStart,
  onBoardDropOnReorder,
  onBoardDragOver,
}: Props) {
  const [dragOverBoardId, setDragOverBoardId] = useState<string | null>(null);

  return (
    <div className={styles.boardsGrid}>
      {boardOrder.map((bid) => {
        const board = boards[bid];
        if (!board) return null;
        return (
          <div
            key={bid}
            className={`${styles.boardWrapper} ${dragOverBoardId === bid ? styles.boardDropTarget : ''}`}
            onDragOver={(e) => { onBoardDragOver(e); setDragOverBoardId(bid); }}
            onDragLeave={() => setDragOverBoardId(null)}
            onDrop={(e) => { setDragOverBoardId(null); onBoardDropOnReorder(e, bid); }}
          >
            <BoardCard
              board={board}
              draggingStockId={draggingStockId}
              onRename={onRenameBoard}
              onDelete={onDeleteBoard}
              onAddStock={onAddStock}
              onDeleteStock={onDeleteStock}
              onDragStart={onDragStart}
              onDragOverBoard={onDragOverBoard}
              onDragOverStock={onDragOverStock}
              onDropOnBoard={onDropOnBoard}
              onDropOnStock={onDropOnStock}
              onBoardDragStart={onBoardDragStart}
            />
          </div>
        );
      })}
    </div>
  );
}
