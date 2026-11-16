'use client';

/**
 * 全局业务状态（Provider）
 *
 * 多路由（看板 / 设置 / 关于）共享同一份板块数据、行情轮询与云端同步，状态必须活在路由之上，
 * 否则切页会重建 state、重复拉行情。业务逻辑与迁移前逐行一致，只是 JSX 骨架搬到了
 * src/components/AppShell.tsx 与 app/ 下的页面。
 * context 与 hook 在 src/store/context.ts（拆开是为了 Fast Refresh 生效）。
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useRealtimePrices } from './hooks/useRealtimePrices';
import { useToast } from './hooks/useToast';
import { genId } from './data/utils';
import { loadFromServer, saveToServer, isServerMode } from './data/apiClient';
import { DashboardContext } from './store/context';
import type { DashboardContextValue, ModalState } from './store/context';
import type { Board, Stock, ThemeMode, ToastItem } from './types';

// 数据版本 — 每次重大变更时递增，自动重置旧缓存
const DATA_VERSION = 'v3';
const VERSION_KEY = 'stock_data_version';

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  // 检查版本，不一致则清除旧数据
  if (typeof window !== 'undefined' && localStorage.getItem(VERSION_KEY) !== DATA_VERSION) {
    localStorage.removeItem('stock_boards');
    localStorage.removeItem('stock_board_order');
    localStorage.setItem(VERSION_KEY, DATA_VERSION);
  }

  const [theme, setTheme] = useLocalStorage<ThemeMode>('stock_theme_mode', 'dark');
  const [intervalMs, setIntervalMs] = useLocalStorage('stock_interval', 3000);
  const [simulationActive, setSimulationActive] = useState(true);
  const [boards, setBoards] = useLocalStorage<Record<string, Board>>('stock_boards', {});
  const [boardOrder, setBoardOrder] = useLocalStorage<string[]>('stock_board_order', []);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<'fetching' | 'ok' | 'unavailable'>('fetching');
  const toast = useToast(setToasts);

  // 判断是否启用服务端模式
  const serverMode = isServerMode();
  const boardOrderRef = useRef(boardOrder);

  useEffect(() => {
    boardOrderRef.current = boardOrder;
  }, [boardOrder]);

  useEffect(() => {
    if (serverMode) {
      loadFromServer().then((data) => {
        if (data && Object.keys(data.boards).length > 0) {
          setBoards(data.boards as Record<string, Board>);
          if (data.boardOrder?.length > 0) setBoardOrder(data.boardOrder);
          toast('已从云端加载数据', 'info');
        }
      });
    }
  }, []); // eslint-disable-line

  // 自动保存到 Supabase（数据变化时防抖保存）
  useEffect(() => {
    if (serverMode && Object.keys(boards).length > 0) {
      saveToServer({ boards, boardOrder });
    }
  }, [boards, boardOrder, serverMode]);

  // 定时轮询云端，自动同步其他设备的变更
  useEffect(() => {
    if (!serverMode) return;
    let mounted = true;
    const poll = async () => {
      const remote = await loadFromServer();
      if (!mounted || !remote || Object.keys(remote.boards).length === 0) return;
      setBoards((prev) => {
        // 检查远程是否有新数据
        const curOrder = boardOrderRef.current;
        const prevStr = JSON.stringify({ boards: prev, boardOrder: curOrder });
        const remoteStr = JSON.stringify(remote);
        if (prevStr === remoteStr) return prev; // 无变化

        // 合并：本地为主，远程补充
        const merged = { ...prev };
        for (const [bid, rBoard] of Object.entries(remote.boards)) {
          const lBoard = merged[bid];
          if (!lBoard) {
            merged[bid] = rBoard;
          } else {
            const localCodes = new Set(lBoard.stocks.map((s: Stock) => s.code));
            const mergedStocks = [...lBoard.stocks];
            for (const rs of rBoard.stocks) {
              if (!localCodes.has(rs.code)) mergedStocks.push(rs);
            }
            merged[bid] = { ...lBoard, stocks: mergedStocks };
          }
        }
        return merged;
      });
      setBoardOrder((prev) => {
        const remoteOrder = remote.boardOrder || [];
        const added = prev.filter((id) => !remoteOrder.includes(id));
        return [...new Set([...remoteOrder, ...added])];
      });
    };
    poll(); // 立即执行一次
    const timer = setInterval(poll, 15000); // 每 15 秒轮询
    return () => { mounted = false; clearInterval(timer); };
  }, [serverMode]); // eslint-disable-line

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

  const handleDragOverBoard = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragOverStock = useCallback((e: React.DragEvent) => {
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

  // === 数据管理（设置页） ===
  const pullFromServer = useCallback(async () => {
    if (!serverMode) {
      toast('未配置云端同步（缺少 Supabase 环境变量）', 'error');
      return false;
    }
    const data = await loadFromServer();
    if (!data || Object.keys(data.boards).length === 0) {
      toast('云端暂无数据', 'info');
      return false;
    }
    setBoards(data.boards as Record<string, Board>);
    if (data.boardOrder?.length > 0) setBoardOrder(data.boardOrder);
    toast('已从云端加载数据', 'success');
    return true;
  }, [serverMode, setBoards, setBoardOrder, toast]);

  const clearLocalData = useCallback(() => {
    setModal({
      title: '清空本地数据',
      message: '将删除本机保存的全部板块与股票。云端数据不受影响，刷新后可能被重新拉回。确定继续？',
      onConfirm: () => {
        setBoards({});
        setBoardOrder([]);
        setModal(null);
        toast('本地数据已清空', 'info');
      },
    });
  }, [setBoards, setBoardOrder, toast]);

  // antd 主题：跟随应用自身的 dark/light 模式，主色对齐 CSS 变量 --primary
  const antdThemeConfig: ThemeConfig = {
    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#6366f1',
      colorInfo: '#6366f1',
      borderRadius: 8,
      fontFamily: 'var(--font-family)',
      colorBgElevated: theme === 'dark' ? '#0d1426' : '#ffffff',
      colorBgContainer: theme === 'dark' ? '#0d1426' : '#ffffff',
    },
  };

  const value: DashboardContextValue = {
    boards,
    boardOrder,
    serverMode,
    intervalMs,
    setIntervalMs,
    simulationActive,
    toggleSimulation,
    lastUpdateTime,
    apiStatus,
    refreshPrices,
    theme,
    setTheme,
    toggleTheme,
    antdThemeConfig,
    toasts,
    toast,
    modal,
    setModal,
    addBoard,
    renameBoard,
    deleteBoard,
    addStock,
    deleteStock,
    draggingStockId,
    handleDragStart,
    handleDragOverBoard,
    handleDragOverStock,
    handleDropOnBoard,
    handleDropOnStock,
    handleBoardDragStart,
    handleBoardDropOnReorder,
    handleBoardDragOver,
    pullFromServer,
    clearLocalData,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export default DashboardProvider;
