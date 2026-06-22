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
import type { Board, Stock, ThemeMode, ColorMode, ToastItem } from './types';

function createInitialBoard(title: string, stockNames: string[]): Board {
  const stocks: Stock[] = stockNames
    .map((name) => {
      const stock = INITIAL_STOCK_DATA.find((s) => s.name === name);
      return stock ? entryToStock(stock) : null;
    })
    .filter(Boolean) as Stock[];

  return {
    id: genId('brd'),
    title,
    stocks,
  };
}

/** 初始化用的小型股票数据（代码 + 名称 + 市场） */
const INITIAL_STOCK_DATA: { code: string; name: string; market: 'sh' | 'sz' | 'star' | 'chinext' | 'bse' }[] = [
  { code: '300308', name: '中际旭创', market: 'chinext' },
  { code: '300394', name: '天孚通信', market: 'chinext' },
  { code: '300502', name: '新易盛', market: 'chinext' },
  { code: '301205', name: '联特科技', market: 'chinext' },
  { code: '688981', name: '中芯国际', market: 'star' },
  { code: '002371', name: '北方华创', market: 'sz' },
  { code: '603986', name: '兆易创新', market: 'sh' },
  { code: '688012', name: '中微公司', market: 'star' },
  { code: '603501', name: '韦尔股份', market: 'sh' },
  { code: '002230', name: '科大讯飞', market: 'sz' },
  { code: '603019', name: '中科曙光', market: 'sh' },
  { code: '688111', name: '金山办公', market: 'star' },
  { code: '300418', name: '昆仑万维', market: 'chinext' },
];

const INITIAL_BOARDS: Record<string, Board> = {
  'brd-init-1': createInitialBoard('光模块核心股', ['中际旭创', '天孚通信', '新易盛', '联特科技']),
  'brd-init-2': createInitialBoard('芯片半导体', ['中芯国际', '北方华创', '兆易创新', '中微公司', '韦尔股份']),
  'brd-init-3': createInitialBoard('AI 概念', ['科大讯飞', '中科曙光', '金山办公', '昆仑万维']),
};

export default function App() {
  const [theme, setTheme] = useLocalStorage<ThemeMode>('stock_theme_mode', 'dark');
  const [colorMode, setColorMode] = useLocalStorage<ColorMode>('stock_color_mode', 'cn');
  const [intervalMs, setIntervalMs] = useLocalStorage('stock_interval', 3000);
  const [simulationActive, setSimulationActive] = useState(true);
  const [boards, setBoards] = useLocalStorage<Record<string, Board>>('stock_boards', INITIAL_BOARDS);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<'fetching' | 'ok' | 'unavailable'>('fetching');
  const toast = useToast(setToasts);

  // Drag state — stocks
  const stockDragRef = useRef<{ stockId: string; boardId: string } | null>(null);
  const [draggingStockId, setDraggingStockId] = useState<string | null>(null);

  // Apply theme
  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light');
  }, [theme]);

  // Apply color mode
  useEffect(() => {
    document.body.classList.toggle('color-mode-us', colorMode === 'us');
  }, [colorMode]);

  // Realtime prices — 绝不虚构数据
  useRealtimePrices({
    _boards: boards,
    setBoards,
    intervalMs,
    active: simulationActive,
    onUpdateTime: setLastUpdateTime,
    onApiStatus: setApiStatus,
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
        setModal(null);
        toast('板块已删除', 'info');
      },
    });
  }, [setBoards, toast]);

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

  // === STOCK DRAG & DROP ===
  const handleDragStart = useCallback((e: React.DragEvent, stockId: string, boardId: string) => {
    stockDragRef.current = { stockId, boardId };
    setDraggingStockId(stockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'stock', stockId, boardId }));
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
        const without = fromBoard.stocks.filter((s) => s.id !== stockId);
        const idx = targetStockId ? without.findIndex((s) => s.id === targetStockId) : -1;
        const arr = [...without];
        arr.splice(idx >= 0 ? idx : arr.length, 0, stock);
        newToStocks = arr;
        return { ...prev, [toBoardId]: { ...toBoard, stocks: newToStocks } };
      } else {
        const idx = targetStockId ? toBoard.stocks.findIndex((s) => s.id === targetStockId) : -1;
        const arr = [...toBoard.stocks];
        arr.splice(idx >= 0 ? idx : arr.length, 0, stock);
        newToStocks = arr;
        return { ...prev, [fromBoardId]: newFrom, [toBoardId]: { ...toBoard, stocks: newToStocks } };
      }
    });
  }, [setBoards]);

  const handleDropOnBoard = useCallback((e: React.DragEvent, boardId: string) => {
    e.preventDefault();
    setDraggingStockId(null);
    const data = stockDragRef.current;
    if (!data) return;
    stockDragRef.current = null;
    if (data.boardId !== boardId) {
      moveStock(data.stockId, data.boardId, boardId);
      toast('已移动股票', 'info');
    }
  }, [moveStock, toast]);

  const handleDropOnStock = useCallback((e: React.DragEvent, targetStockId: string, boardId: string) => {
    e.preventDefault();
    setDraggingStockId(null);
    const data = stockDragRef.current;
    if (!data) return;
    stockDragRef.current = null;
    moveStock(data.stockId, data.boardId, boardId, targetStockId);
  }, [moveStock]);

  // === RESET ===
  const resetAll = useCallback(() => {
    setModal({
      title: '重置所有数据',
      message: '确定要重置所有数据吗？所有板块和股票信息将被清空，恢复为默认初始状态。',
      onConfirm: () => {
        setBoards(INITIAL_BOARDS);
        setModal(null);
        toast('已重置为默认状态', 'info');
      },
    });
  }, [setBoards, toast]);

  return (
    <div className={styles.appContainer}>
      <Navbar
        theme={theme}
        colorMode={colorMode}
        intervalMs={intervalMs}
        simulationActive={simulationActive}
        boardCount={Object.keys(boards).length}
        lastUpdateTime={lastUpdateTime}
        apiStatus={apiStatus}
        onToggleTheme={toggleTheme}
        onToggleColorMode={toggleColorMode}
        onIntervalChange={setIntervalMs}
        onToggleSimulation={toggleSimulation}
        onAddBoard={addBoard}
        onResetAll={resetAll}
      />
      <div className={styles.mainContent}>
        <SectionGroup
          boards={boards}
          draggingStockId={draggingStockId}
          onRenameBoard={renameBoard}
          onDeleteBoard={deleteBoard}
          onAddStock={addStock}
          onDeleteStock={deleteStock}
          onDragStart={handleDragStart}
          onDragOverBoard={handleDragOverBoard}
          onDragOverStock={handleDragOverStock}
          onDropOnBoard={handleDropOnBoard}
          onDropOnStock={handleDropOnStock}
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
