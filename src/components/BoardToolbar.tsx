'use client';

/**
 * 「自选」页专属工具条：行情状态 + 刷新间隔 + 暂停/继续 + 主题 + 手动刷新 + 新增板块。
 * 全局顶栏（SiteHeader）只放站点级入口（消息 / 个人中心），本工具条不进全局外壳，
 * 只由 app/page.tsx 渲染 —— 设置页、关于页不应出现任何一个按钮。
 */

import { Button, Select, Tooltip } from 'antd';
import styles from './BoardToolbar.module.css';
import type { ThemeMode } from '../types';

interface BoardToolbarProps {
  theme: ThemeMode;
  intervalMs: number;
  simulationActive: boolean;
  lastUpdateTime: string;
  apiStatus: 'fetching' | 'ok' | 'unavailable';
  onToggleTheme: () => void;
  onIntervalChange: (ms: number) => void;
  onToggleSimulation: () => void;
  onAddBoard: () => void;
  onRefreshPrices: () => void;
}

export default function BoardToolbar({
  theme,
  intervalMs,
  simulationActive,
  lastUpdateTime,
  apiStatus,
  onToggleTheme,
  onIntervalChange,
  onToggleSimulation,
  onAddBoard,
  onRefreshPrices,
}: BoardToolbarProps) {
  const intervals = [
    { label: '1s', value: 1000 },
    { label: '3s', value: 3000 },
    { label: '5s', value: 5000 },
    { label: '10s', value: 10000 },
    { label: '30s', value: 30000 },
  ];

  return (
    <div className={styles.toolbar}>
      <div className={styles.status}>
        <span
          className={`${styles.pulseDot} ${simulationActive ? styles.pulseDotActive : styles.pulseDotPaused}`}
        />
        <span>
          {apiStatus === 'unavailable' ? (
            <span style={{ color: 'var(--fall-color)' }}>网络不可用！</span>
          ) : simulationActive ? (
            `${apiStatus === 'fetching' ? '加载中' : '实时'}`
          ) : '已暂停'}
          {lastUpdateTime && simulationActive && apiStatus === 'ok' && (
            <span className={styles.updateTime}> | {lastUpdateTime}</span>
          )}
        </span>
      </div>

      <div className={styles.actions}>
        <div className={styles.controls}>
          {/* 刷新间隔 */}
          <Select
            size="small"
            value={intervalMs}
            onChange={onIntervalChange}
            options={intervals.map((i) => ({ label: `每${i.label}`, value: i.value }))}
            popupMatchSelectWidth={false}
            style={{ minWidth: 88 }}
          />

          {/* 暂停/继续 */}
          <Tooltip title={simulationActive ? '暂停更新' : '继续更新'}>
            <Button
              type="text"
              onClick={onToggleSimulation}
              aria-label={simulationActive ? '暂停更新' : '继续更新'}
              icon={
                simulationActive ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                )
              }
            />
          </Tooltip>

          {/* 主题切换 */}
          <Tooltip title={theme === 'dark' ? '切换亮色主题' : '切换暗色主题'}>
            <Button
              type="text"
              onClick={onToggleTheme}
              aria-label="切换主题"
              icon={
                theme === 'dark' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" /><path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" /><path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )
              }
            />
          </Tooltip>

          {/* 手动刷新行情 */}
          <Tooltip title="手动刷新行情">
            <Button
              type="text"
              onClick={onRefreshPrices}
              aria-label="手动刷新行情"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
              }
            />
          </Tooltip>
        </div>

        <Button
          type="primary"
          onClick={onAddBoard}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" /><path d="M12 5v14" />
            </svg>
          }
        >
          新增板块
        </Button>
      </div>
    </div>
  );
}
