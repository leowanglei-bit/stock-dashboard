import React, { useState } from 'react';
import styles from './SectionGroup.module.css';
import BoardCard from './BoardCard';
import type { Section, Board, Stock } from '../types';

interface Props {
  sections: Section[];
  boards: Record<string, Board>;
  draggingStockId: string | null;
  onRenameSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onToggleCollapse: (sectionId: string) => void;
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
  onBoardDropOnSection: (e: React.DragEvent, sectionId: string) => void;
  onBoardDropOnUngrouped: (e: React.DragEvent) => void;
  onAddSection: () => void;
}

export default function SectionGroup({
  sections,
  boards,
  draggingStockId,
  onRenameSection,
  onDeleteSection,
  onToggleCollapse,
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
  onBoardDropOnSection,
  onBoardDropOnUngrouped,
  onAddSection,
}: Props) {
  const allSectionBoardIds = new Set(sections.flatMap((s) => s.boards));
  const ungroupedBoardIds = Object.keys(boards).filter((id) => !allSectionBoardIds.has(id));

  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [dragOverUngrouped, setDragOverUngrouped] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Sections */}
      {sections.map((section) => {
        const sectionBoards = section.boards
          .map((bid) => boards[bid])
          .filter(Boolean);

        const avgChange = (() => {
          const allChanges = sectionBoards.flatMap((b) => b.stocks.map((s) => s.changePercent));
          if (allChanges.length === 0) return null;
          return allChanges.reduce((a, b) => a + b, 0) / allChanges.length;
        })();

        return (
          <SectionRow
            key={section.id}
            section={section}
            boards={sectionBoards}
            avgChange={avgChange}
            draggingStockId={draggingStockId}
            dragOverSectionId={dragOverSectionId}
            onSetDragOverSectionId={setDragOverSectionId}
            onRenameSection={onRenameSection}
            onDeleteSection={onDeleteSection}
            onToggleCollapse={onToggleCollapse}
            onRenameBoard={onRenameBoard}
            onDeleteBoard={onDeleteBoard}
            onAddStock={onAddStock}
            onDeleteStock={onDeleteStock}
            onDragStart={onDragStart}
            onDragOverBoard={onDragOverBoard}
            onDragOverStock={onDragOverStock}
            onDropOnBoard={onDropOnBoard}
            onDropOnStock={onDropOnStock}
            onBoardDragStart={onBoardDragStart}
            onBoardDropOnSection={onBoardDropOnSection}
          />
        );
      })}

      {/* Ungrouped Boards */}
      {ungroupedBoardIds.length > 0 && (
        <div
          className={`${styles.ungroupedArea} ${dragOverUngrouped ? styles.dropActive : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOverUngrouped(true); }}
          onDragLeave={() => setDragOverUngrouped(false)}
          onDrop={(e) => { setDragOverUngrouped(false); onBoardDropOnUngrouped(e); }}
        >
          <div className={styles.ungroupedTitle}>未分组板块</div>
          <div className={styles.ungroupedBoards}>
            {ungroupedBoardIds.map((bid) => {
              const board = boards[bid];
              if (!board) return null;
              return (
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
                  onBoardDragStart={onBoardDragStart}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Add Section */}
      <button className={styles.addSectionBtn} onClick={onAddSection}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14" /><path d="M12 5v14" />
        </svg>
        新建分组
      </button>
    </div>
  );
}

/** 单个 Section 行 */
function SectionRow({
  section,
  boards,
  avgChange,
  draggingStockId,
  dragOverSectionId,
  onSetDragOverSectionId,
  onRenameSection,
  onDeleteSection,
  onToggleCollapse,
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
  onBoardDropOnSection,
}: {
  section: Section;
  boards: Board[];
  avgChange: number | null;
  draggingStockId: string | null;
  dragOverSectionId: string | null;
  onSetDragOverSectionId: (id: string | null) => void;
  onRenameSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onToggleCollapse: (sectionId: string) => void;
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
  onBoardDropOnSection: (e: React.DragEvent, sectionId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(section.title);

  const handleRename = () => {
    if (editValue.trim() && editValue !== section.title) {
      onRenameSection(section.id, editValue.trim());
    }
    setEditing(false);
  };

  const isOver = dragOverSectionId === section.id;

  return (
    <div className={`${styles.section} ${section.collapsed ? styles.collapsed : ''}`}>
      <div
        className={`${styles.sectionHeader} ${isOver ? styles.sectionHeaderDropTarget : ''}`}
        onDragOver={(e) => { e.preventDefault(); onSetDragOverSectionId(section.id); }}
        onDragLeave={() => onSetDragOverSectionId(null)}
        onDrop={(e) => { onSetDragOverSectionId(null); onBoardDropOnSection(e, section.id); }}
      >
        <div className={styles.headerLeft}>
          {editing ? (
            <input
              className={styles.sectionTitleInput}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
          ) : (
            <span className={styles.sectionTitle} onClick={() => { setEditValue(section.title); setEditing(true); }}>
              {section.title}
            </span>
          )}
          <span className={styles.boardCount}>{boards.length}个板块</span>
        </div>
        <div className={styles.headerRight}>
          {avgChange !== null && (
            <span
              className={styles.sectionAvgChange}
              style={{
                color: avgChange >= 0 ? 'var(--rise-color)' : 'var(--fall-color)',
                backgroundColor: avgChange >= 0 ? 'var(--rise-bg)' : 'var(--fall-bg)',
              }}
            >
              {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
            </span>
          )}
          <button
            className={styles.collapseBtn}
            onClick={() => onToggleCollapse(section.id)}
            title={section.collapsed ? '展开' : '折叠'}
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: section.collapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <button className={styles.deleteSectionBtn} onClick={() => onDeleteSection(section.id)} title="删除分组">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {!section.collapsed && (
        <div className={styles.boardsGrid}>
          {boards.map((board) => (
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
              onBoardDragStart={onBoardDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
