import React from 'react';
import styles from './SectionGroup.module.css';
import BoardCard from './BoardCard';
import type { Board, Stock } from '../types';

interface Props {
  boards: Record<string, Board>;
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
}

export default function SectionGroup({
  boards,
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
}: Props) {
  const boardList = Object.values(boards);

  return (
    <div className={styles.boardsGrid}>
      {boardList.map((board) => (
        <BoardCard
          key={board.id}
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
        />
      ))}
    </div>
  );
}
