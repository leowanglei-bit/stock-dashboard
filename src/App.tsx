import { useState, useCallback, useRef, useEffect } from 'react';
import styles from './App.module.css';
import Navbar from './components/Navbar';
import SectionGroup from './components/SectionGroup';
import Modal from './components/Modal';
import ToastContainer from './components/ToastContainer';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useRealtimePrices } from './hooks/useRealtimePrices';
import { useToast } from './hooks/useToast';
import { genId } from './data/utils';
import { tryRefreshStockDB } from './data/stockSearchDb';
import type { Board, Stock, ThemeMode, ColorMode, ToastItem } from './types';

// 数据版本 — 每次重大变更时递增，自动重置旧缓存
const DATA_VERSION = 'v3';
const VERSION_KEY = 'stock_data_version';

export default function App() {
  // 检查版本，不一致则清除旧数据
  if (localStorage.getItem(VERSION_KEY) !== DATA_VERSION) {
    localStorage.removeItem('stock_boards');
    localStorage.removeItem('stock_board_order');
    localStorage.setItem(VERSION_KEY, DATA_VERSION);
  }

  const [theme, setTheme] = useLocalStorage<ThemeMode>('stock_theme_mode', 'dark');
  const [colorMode, setColorMode] = useLocalStorage<ColorMode>('stock_color_mode', 'cn');
  const [intervalMs, setIntervalMs] = useLocalStorage('stock_interval', 3000);
  const [simulationActive, setSimulationActive] = useState(true);
  const [boards, setBoards] = useLocalStorage<Record<string, Board>>('stock_boards', {});
  const [boardOrder, setBoardOrder] = useLocalStorage<string[]>('stock_board_order', []);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<'fetching' | 'ok' | 'unavailable'>('fetching');
  const toast = useToast(setToasts);

  // 同步 boardOrder 和 boards（新增板块自动加入末尾，删除的自动移除）
  useEffect(() => {
    setBoardOrder((prev) => {
      const boardIds = new Set(Object.keys(boards));
      const filtered = prev.filter((id) => boardIds.has(id));
      // 新增的板块（不在 order 中）追加到末尾
      for (const id of boardIds) {
        if (!filtered.includes(id)) filtered.push(id);
      }
      return filtered;
    });
  }, [boards, setBoardOrder]);

  // Drag state — stocks
  const stockDragRef = useRef<{ stockId: string; boardId: string } | null>(null);
  const [draggingStockId, setDraggingStockId] = useState<string | null>(null);

  // Apply theme
  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light');
  }, [theme]);

  // 启动后尝试拉取全量股票数据
  useEffect(() => { tryRefreshStockDB(); }, []);

  // Apply color mode
  useEffect(() => {
    document.body.classList.toggle('color-mode-us', colorMode === 'us');
  }, [colorMode]);

  // Realtime prices — 绝不虚构数据
  const { refresh: refreshPrices } = useRealtimePrices({
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

  // === BOARD DRAG & DROP（拖拽重排） ===
  const boardDragRef = useRef<{ boardId: string } | null>(null);

  const handleBoardDragStart = useCallback((e: React.DragEvent, boardId: string) => {
    boardDragRef.current = { boardId };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'board', boardId }));
    // 让拖拽时鼠标显示为移动图标
    if (e.dataTransfer.setDragImage) {
      const el = e.currentTarget as HTMLElement;
      e.dataTransfer.setDragImage(el, el.offsetWidth / 2, 20);
    }
  }, []);

  const handleBoardDropOnReorder = useCallback((e: React.DragEvent, targetBoardId: string) => {
    e.preventDefault();
    const data = boardDragRef.current;
    if (!data) return;
    boardDragRef.current = null;
    if (data.boardId === targetBoardId) return;

    setBoardOrder((prev) => {
      const fromIdx = prev.indexOf(data.boardId);
      const toIdx = prev.indexOf(targetBoardId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const arr = [...prev];
      arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, data.boardId);
      return arr;
    });
    toast('板块已排序', 'info');
  }, [setBoardOrder, toast]);

  const handleBoardDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // === RESET ===
  const handleRefreshPrices = useCallback(() => {
    refreshPrices();
    toast('正在刷新行情...', 'info');
  }, [refreshPrices, toast]);

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
        onRefreshPrices={handleRefreshPrices}
      />
      <div className={styles.mainContent}>
        <SectionGroup
          boards={boards}
          boardOrder={boardOrder}
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
          onBoardDragStart={handleBoardDragStart}
          onBoardDropOnReorder={handleBoardDropOnReorder}
          onBoardDragOver={handleBoardDragOver}
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
