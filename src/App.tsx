import { useState, useCallback, useRef, useEffect } from 'react';
import styles from './App.module.css';
import Navbar from './components/Navbar';
import SectionGroup from './components/SectionGroup';
import Modal from './components/Modal';
import ToastContainer from './components/ToastContainer';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useRealtimePrices } from './hooks/useRealtimePrices';
import { useToast } from './hooks/useToast';
import { genId, entryToStock } from './data/utils';
import { STOCK_DATABASE } from './data/mockStocks';
import type { Section, Board, Stock, ThemeMode, ColorMode, ToastItem } from './types';

const INITIAL_SECTIONS: Section[] = [
  { id: 'sec-1', title: '科技成长', boards: [], collapsed: false },
  { id: 'sec-2', title: '核心资产', boards: [], collapsed: false },
];

function createInitialBoard(title: string, stockNames: string[]): Board {
  const stocks: Stock[] = stockNames
    .map((name) => {
      const entry = STOCK_DATABASE.find((s) => s.name === name);
      return entry ? entryToStock(entry) : null;
    })
    .filter(Boolean) as Stock[];

  return {
    id: genId('brd'),
    title,
    stocks,
  };
}

const INITIAL_BOARDS: Record<string, Board> = {
  'brd-init-1': createInitialBoard('光模块核心股', ['中际旭创', '天孚通信', '新易盛', '联特科技']),
  'brd-init-2': createInitialBoard('芯片半导体', ['中芯国际', '北方华创', '兆易创新', '中微公司', '韦尔股份']),
  'brd-init-3': createInitialBoard('AI 概念', ['科大讯飞', '中科曙光', '金山办公', '昆仑万维']),
};

// Section-board assignments are applied via INITIAL_BOARDS + sections above

export default function App() {
  const [theme, setTheme] = useLocalStorage<ThemeMode>('stock_theme_mode', 'dark');
  const [colorMode, setColorMode] = useLocalStorage<ColorMode>('stock_color_mode', 'cn');
  const [intervalMs, setIntervalMs] = useLocalStorage('stock_interval', 3000);
  const [simulationActive, setSimulationActive] = useState(true);
  const [sections, setSections] = useLocalStorage<Section[]>('stock_sections', INITIAL_SECTIONS);
  const [boards, setBoards] = useLocalStorage<Record<string, Board>>('stock_boards', INITIAL_BOARDS);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [dataSource, setDataSource] = useState<'realtime' | 'simulating' | 'fetching'>('fetching');
  const toast = useToast(setToasts);

  // Drag state
  const dragRef = useRef<{ stockId: string; boardId: string } | null>(null);
  const [draggingStockId, setDraggingStockId] = useState<string | null>(null);

  // Apply theme
  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light');
  }, [theme]);

  // Apply color mode
  useEffect(() => {
    document.body.classList.toggle('color-mode-us', colorMode === 'us');
  }, [colorMode]);

  // Realtime prices (falls back to simulation if API unavailable)
  useRealtimePrices({
    boards,
    setBoards,
    intervalMs,
    active: simulationActive,
    onUpdateTime: setLastUpdateTime,
    onStatusChange: (status) => {
      if (status === 'ok') setDataSource('realtime');
      else if (status === 'simulating' || status === 'error') setDataSource('simulating');
      else if (status === 'fetching') setDataSource('fetching');
    },
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => (prev === 'cn' ? 'us' : 'cn'));
  }, [setColorMode]);

  const toggleSimulation = useCallback(() => {
    setSimulationActive((prev) => !prev);
  }, []);

  // === BOARD OPERATIONS ===
  const addBoard = useCallback(() => {
    const id = genId('brd');
    const newBoard: Board = { id, title: `新板块 ${Object.keys(boards).length + 1}`, stocks: [] };
    setBoards((prev) => ({ ...prev, [id]: newBoard }));
    toast(`已创建板块「${newBoard.title}」`, 'success');
  }, [boards, setBoards, toast]);

  const renameBoard = useCallback((boardId: string, title: string) => {
    setBoards((prev) => {
      if (!prev[boardId]) return prev;
      return { ...prev, [boardId]: { ...prev[boardId], title } };
    });
  }, [setBoards]);

  const deleteBoard = useCallback((boardId: string) => {
    setModal({
      title: '删除板块',
      message: '确定要删除这个板块吗？板块内的股票不会被删除。',
      onConfirm: () => {
        setBoards((prev) => {
          const next = { ...prev };
          delete next[boardId];
          return next;
        });
        // Remove from sections
        setSections((prev) =>
          prev.map((s) => ({
            ...s,
            boards: s.boards.filter((bid) => bid !== boardId),
          }))
        );
        setModal(null);
        toast('板块已删除', 'info');
      },
    });
  }, [setBoards, setSections, toast]);

  // === STOCK OPERATIONS ===
  const addStock = useCallback((boardId: string, stock: Stock) => {
    setBoards((prev) => {
      const board = prev[boardId];
      if (!board) return prev;
      return {
        ...prev,
        [boardId]: { ...board, stocks: [...board.stocks, stock] },
      };
    });
    toast(`已添加 ${stock.name}`, 'success');
  }, [setBoards, toast]);

  const deleteStock = useCallback((boardId: string, stockId: string) => {
    setBoards((prev) => {
      const board = prev[boardId];
      if (!board) return prev;
      return {
        ...prev,
        [boardId]: { ...board, stocks: board.stocks.filter((s) => s.id !== stockId) },
      };
    });
  }, [setBoards]);

  // === DRAG & DROP ===
  const handleDragStart = useCallback((e: React.DragEvent, stockId: string, boardId: string) => {
    dragRef.current = { stockId, boardId };
    setDraggingStockId(stockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ stockId, boardId }));
  }, []);

  const handleDragOverBoard = useCallback((e: React.DragEvent, _boardId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragOverStock = useCallback((e: React.DragEvent, _stockId: string, _boardId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const moveStock = useCallback((stockId: string, fromBoardId: string, toBoardId: string, targetStockId?: string) => {
    setBoards((prev) => {
      const fromBoard = prev[fromBoardId];
      const toBoard = prev[toBoardId];
      if (!fromBoard || !toBoard) return prev;

      const stock = fromBoard.stocks.find((s) => s.id === stockId);
      if (!stock) return prev;

      const newFrom = { ...fromBoard, stocks: fromBoard.stocks.filter((s) => s.id !== stockId) };
      let newToStocks: Stock[];

      if (fromBoardId === toBoardId) {
        // Same board reorder
        const without = fromBoard.stocks.filter((s) => s.id !== stockId);
        if (!targetStockId) {
          newToStocks = [...without, stock];
        } else {
          const idx = without.findIndex((s) => s.id === targetStockId);
          const arr = [...without];
          arr.splice(idx >= 0 ? idx : arr.length, 0, stock);
          newToStocks = arr;
        }
        return { ...prev, [toBoardId]: { ...toBoard, stocks: newToStocks } };
      } else {
        // Cross-board move
        if (!targetStockId) {
          newToStocks = [...toBoard.stocks, stock];
        } else {
          const idx = toBoard.stocks.findIndex((s) => s.id === targetStockId);
          const arr = [...toBoard.stocks];
          arr.splice(idx >= 0 ? idx : arr.length, 0, stock);
          newToStocks = arr;
        }
        return { ...prev, [fromBoardId]: newFrom, [toBoardId]: { ...toBoard, stocks: newToStocks } };
      }
    });
  }, [setBoards]);

  const handleDropOnBoard = useCallback((e: React.DragEvent, boardId: string) => {
    e.preventDefault();
    setDraggingStockId(null);
    const data = dragRef.current;
    if (!data) return;
    dragRef.current = null;
    if (data.boardId !== boardId) {
      moveStock(data.stockId, data.boardId, boardId);
      toast('已移动股票', 'info');
    }
  }, [moveStock, toast]);

  const handleDropOnStock = useCallback((e: React.DragEvent, targetStockId: string, boardId: string) => {
    e.preventDefault();
    setDraggingStockId(null);
    const data = dragRef.current;
    if (!data) return;
    dragRef.current = null;
    moveStock(data.stockId, data.boardId, boardId, targetStockId);
  }, [moveStock]);

  // === SECTION OPERATIONS ===
  const addSection = useCallback(() => {
    const id = genId('sec');
    setSections((prev) => [...prev, { id, title: `新分组 ${prev.length + 1}`, boards: [], collapsed: false }]);
    toast('已创建新分组', 'success');
  }, [setSections, toast]);

  const renameSection = useCallback((sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
  }, [setSections]);

  const deleteSection = useCallback((sectionId: string) => {
    setModal({
      title: '删除分组',
      message: '确定要删除这个分组吗？分组内的板块将变为未分组状态。',
      onConfirm: () => {
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
        setModal(null);
        toast('分组已删除', 'info');
      },
    });
  }, [setSections, toast]);

  const toggleCollapse = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s))
    );
  }, [setSections]);

  // === RESET ===
  const resetAll = useCallback(() => {
    setModal({
      title: '重置所有数据',
      message: '确定要重置所有数据吗？所有板块、股票和分组信息将被清空，恢复为默认初始状态。',
      onConfirm: () => {
        setSections(INITIAL_SECTIONS);
        setBoards(INITIAL_BOARDS);
        setModal(null);
        toast('已重置为默认状态', 'info');
      },
    });
  }, [setSections, setBoards, toast]);

  return (
    <div className={styles.appContainer}>
      <Navbar
        theme={theme}
        colorMode={colorMode}
        intervalMs={intervalMs}
        simulationActive={simulationActive}
        boardCount={Object.keys(boards).length}
        lastUpdateTime={lastUpdateTime}
        dataSource={dataSource}
        onToggleTheme={toggleTheme}
        onToggleColorMode={toggleColorMode}
        onIntervalChange={setIntervalMs}
        onToggleSimulation={toggleSimulation}
        onAddBoard={addBoard}
        onResetAll={resetAll}
      />
      <div className={styles.mainContent}>
        <SectionGroup
          sections={sections}
          boards={boards}
          draggingStockId={draggingStockId}
          onRenameSection={renameSection}
          onDeleteSection={deleteSection}
          onToggleCollapse={toggleCollapse}
          onRenameBoard={renameBoard}
          onDeleteBoard={deleteBoard}
          onAddStock={addStock}
          onDeleteStock={deleteStock}
          onDragStart={handleDragStart}
          onDragOverBoard={handleDragOverBoard}
          onDragOverStock={handleDragOverStock}
          onDropOnBoard={handleDropOnBoard}
          onDropOnStock={handleDropOnStock}
          onAddSection={addSection}
        />
      </div>
      <ToastContainer toasts={toasts} />
      {modal && (
        <Modal
          title={modal.title}
          onCancel={() => setModal(null)}
          onConfirm={modal.onConfirm}
          confirmText="确定"
          danger
        >
          {modal.message}
        </Modal>
      )}
    </div>
  );
}
