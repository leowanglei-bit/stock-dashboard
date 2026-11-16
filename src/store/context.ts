'use client';

/**
 * 看板状态上下文（只有 context 与 hook，Provider 在 src/App.tsx）。
 * 拆开是为了让 Fast Refresh 生效：一个文件里既有组件又有 hook 导出会失效。
 */

import { createContext, useContext } from 'react';
import type { ThemeConfig } from 'antd';
import type { Board, Stock, ThemeMode, ToastItem } from '../types';

export interface ModalState {
  title: string;
  message: string;
  onConfirm: () => void;
}

export interface DashboardContextValue {
  // 数据
  boards: Record<string, Board>;
  boardOrder: string[];
  serverMode: boolean;
  // 行情
  intervalMs: number;
  setIntervalMs: (v: number) => void;
  simulationActive: boolean;
  toggleSimulation: () => void;
  lastUpdateTime: string;
  apiStatus: 'fetching' | 'ok' | 'unavailable';
  refreshPrices: () => void;
  // 外观
  theme: ThemeMode;
  setTheme: (v: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => void;
  toggleTheme: () => void;
  antdThemeConfig: ThemeConfig;
  // 交互反馈
  toasts: ToastItem[];
  toast: (message: string, type?: ToastItem['type']) => void;
  modal: ModalState | null;
  setModal: (m: ModalState | null) => void;
  // 板块 / 股票操作
  addBoard: () => void;
  renameBoard: (boardId: string, title: string) => void;
  deleteBoard: (boardId: string) => void;
  addStock: (boardId: string, stock: Stock) => void;
  deleteStock: (boardId: string, stockId: string) => void;
  // 拖拽
  draggingStockId: string | null;
  handleDragStart: (e: React.DragEvent, stockId: string, boardId: string) => void;
  handleDragOverBoard: (e: React.DragEvent, boardId: string) => void;
  handleDragOverStock: (e: React.DragEvent, stockId: string, boardId: string) => void;
  handleDropOnBoard: (e: React.DragEvent, boardId: string) => void;
  handleDropOnStock: (e: React.DragEvent, targetStockId: string, boardId: string) => void;
  handleBoardDragStart: (e: React.DragEvent, boardId: string) => void;
  handleBoardDropOnReorder: (e: React.DragEvent, targetBoardId: string) => void;
  handleBoardDragOver: (e: React.DragEvent) => void;
  // 数据管理（设置页用）
  pullFromServer: () => Promise<boolean>;
  clearLocalData: () => void;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard 必须在 <DashboardProvider> 内使用');
  return ctx;
}
