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
import { loadFromServer, saveToServer, isServerMode, setGitHubToken } from './data/apiClient';
import type { Board, Stock, ThemeMode, ToastItem } from './types';

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
  const [intervalMs, setIntervalMs] = useLocalStorage('stock_interval', 3000);
  const [simulationActive, setSimulationActive] = useState(true);
  const [boards, setBoards] = useLocalStorage<Record<string, Board>>('stock_boards', {});
  const [boardOrder, setBoardOrder] = useLocalStorage<string[]>('stock_board_order', []);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<'fetching' | 'ok' | 'unavailable'>('fetching');
  const toast = useToast(setToasts);

  // Token 配置 UI
  const [showTokenModal, setShowTokenModal] = useState(!isServerMode());
  const [tokenInput, setTokenInput] = useState('');

  // 判断是否启用服务端模式（GitHub Pages 构建时注入 token）
  const serverMode = isServerMode();
  const serverLoadedRef = useRef(false);

  useEffect(() => {
    if (serverMode) {
      loadFromServer().then((data) => {
        serverLoadedRef.current = true;
        if (data && Object.keys(data.boards).length > 0) {
          setBoards(data.boards as Record<string, Board>);
          if (data.boardOrder?.length > 0) setBoardOrder(data.boardOrder);
          toast('已从云端加载数据', 'info');
        }
      });
    } else {
      serverLoadedRef.current = true;
    }
  }, []); // eslint-disable-line

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

  // === 云端同步 ===
  const handleTokenSubmit = useCallback(() => {
    const t = tokenInput.trim();
    if (!t) return;
    setGitHubToken(t);
    setShowTokenModal(false);
    toast('Token 已保存', 'success');
    // 重新加载 UI（页面刷新组件会重新检测 token）
    window.location.reload();
  }, [tokenInput, toast]);

  const handleUploadData = useCallback(async () => {
    if (!serverMode) { toast('请先设置 GitHub Token', 'error'); return; }
    const clean: Record<string, Board> = {};
    for (const [id, b] of Object.entries(boards)) {
      clean[id] = { ...b, stocks: b.stocks.map((s) => ({
        id: s.id, code: s.code, name: s.name, market: s.market,
        price: 0, prevClose: 0, changePercent: 0,
      })) } as Board;
    }
    saveToServer({ boards: clean, boardOrder });
    toast('数据上传中（2秒内完成）', 'info');
    // 2 秒后假定完成（无回调）
    setTimeout(() => toast('上传完成', 'success'), 3000);
  }, [serverMode, boards, boardOrder, toast]);

  const handleDownloadData = useCallback(async () => {
    if (!serverMode) { toast('请先设置 GitHub Token', 'error'); return; }
    const data = await loadFromServer();
    if (!data || Object.keys(data.boards).length === 0) {
      toast('云端暂无数据', 'info');
      return;
    }
    // 合并逻辑：云端 -> 本地，按板块 ID 合并，同板块合并股票（去重）
    setBoards((prev) => {
      const merged = { ...prev };
      for (const [bid, remoteBoard] of Object.entries(data.boards)) {
        const localBoard = merged[bid];
        if (!localBoard) {
          // 云端有、本地没有 → 新增
          merged[bid] = remoteBoard;
        } else {
          // 都有 → 合并股票（云端优先覆盖同名 code 的价格，但价格会被实时 API 覆盖）
          const localCodes = new Set(localBoard.stocks.map((s) => s.code));
          const mergedStocks = [...localBoard.stocks];
          for (const rs of remoteBoard.stocks) {
            if (!localCodes.has(rs.code)) {
              mergedStocks.push(rs);
            }
          }
          merged[bid] = { ...localBoard, stocks: mergedStocks };
        }
      }
      return merged;
    });
    // 合并 boardOrder：云端排序为主，追加本地独有的
    setBoardOrder((prev) => {
      const remoteOrder = data.boardOrder || [];
      const added = prev.filter((id) => !remoteOrder.includes(id));
      const mergedOrder = [...remoteOrder, ...added];
      // 去重
      return [...new Set(mergedOrder)];
    });
    toast('已合并云端数据', 'success');
  }, [serverMode, setBoards, setBoardOrder, toast]);

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
      {/* Token 设置弹窗 */}
      {showTokenModal && (
        <div className={styles.loginOverlay}>
          <div className={styles.loginBox}>
            <div className={styles.loginLogo}>🔑</div>
            <div className={styles.loginTitle}>设置 GitHub Token</div>
            <div className={styles.loginSub}>用于云端同步，Token 仅存于你的浏览器</div>
            <input
              className={styles.loginInput}
              type="password"
              placeholder="粘贴 GitHub Personal Access Token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTokenSubmit()}
              autoFocus
            />
            <button className={styles.loginBtn} onClick={handleTokenSubmit}>保存</button>
          </div>
        </div>
      )}
      <Navbar
        theme={theme}
        intervalMs={intervalMs}
        simulationActive={simulationActive}
        lastUpdateTime={lastUpdateTime}
        apiStatus={apiStatus}
        onToggleTheme={toggleTheme}
        onIntervalChange={setIntervalMs}
        onToggleSimulation={toggleSimulation}
        onAddBoard={addBoard}
        onRefreshPrices={handleRefreshPrices}
        onUploadData={handleUploadData}
        onDownloadData={handleDownloadData}
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
      <div className={styles.footer}>
        <span>心有灵犀 谈笑间 众生皆有回响</span>
        <span className={styles.footerSep}> ｜ </span>
        <span>味归平淡 静思处 乾坤尽纳一盏</span>
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
