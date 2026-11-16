'use client';

import { Button, Empty } from 'antd';
import BoardToolbar from '@/src/components/BoardToolbar';
import SectionGroup from '@/src/components/SectionGroup';
import { useDashboard } from '@/src/store/context';

export default function BoardsPage() {
  const d = useDashboard();

  return (
    <>
      {/* 行情操作条只属于本页：全局顶栏（SiteHeader）不承载这些按钮 */}
      <BoardToolbar
        theme={d.theme}
        intervalMs={d.intervalMs}
        simulationActive={d.simulationActive}
        lastUpdateTime={d.lastUpdateTime}
        apiStatus={d.apiStatus}
        onToggleTheme={d.toggleTheme}
        onIntervalChange={d.setIntervalMs}
        onToggleSimulation={d.toggleSimulation}
        onAddBoard={d.addBoard}
        onRefreshPrices={d.refreshPrices}
      />

      {d.boardOrder.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <Empty description="还没有板块，先建一个吧" />
          <Button type="primary" onClick={d.addBoard}>
            新增板块
          </Button>
        </div>
      ) : (
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
      )}
    </>
  );
}
