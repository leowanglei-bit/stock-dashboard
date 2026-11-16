'use client';

import { Button, Empty } from 'antd';
import SectionGroup from '@/src/components/SectionGroup';
import { useDashboard } from '@/src/store/context';

export default function BoardsPage() {
  const d = useDashboard();

  if (d.boardOrder.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Empty description="还没有板块，先建一个吧" />
        <Button type="primary" onClick={d.addBoard}>
          新增板块
        </Button>
      </div>
    );
  }

  return (
    <SectionGroup
      boards={d.boards}
      boardOrder={d.boardOrder}
      draggingStockId={d.draggingStockId}
      onRenameBoard={d.renameBoard}
      onDeleteBoard={d.deleteBoard}
      onAddStock={d.addStock}
      onDeleteStock={d.deleteStock}
      onDragStart={d.handleDragStart}
      onDragOverBoard={d.handleDragOverBoard}
      onDragOverStock={d.handleDragOverStock}
      onDropOnBoard={d.handleDropOnBoard}
      onDropOnStock={d.handleDropOnStock}
      onBoardDragStart={d.handleBoardDragStart}
      onBoardDropOnReorder={d.handleBoardDropOnReorder}
      onBoardDragOver={d.handleBoardDragOver}
    />
  );
}
