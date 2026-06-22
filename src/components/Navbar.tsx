import styles from './Navbar.module.css';
import type { ThemeMode, ColorMode } from '../types';

interface NavbarProps {
  theme: ThemeMode;
  colorMode: ColorMode;
  intervalMs: number;
  simulationActive: boolean;
  boardCount: number;
  lastUpdateTime: string;
  apiStatus: 'fetching' | 'ok' | 'unavailable';
  onToggleTheme: () => void;
  onToggleColorMode: () => void;
  onIntervalChange: (ms: number) => void;
  onToggleSimulation: () => void;
  onAddBoard: () => void;
  onRefreshPrices: () => void;
}

export default function Navbar({
  theme,
  colorMode,
  intervalMs,
  simulationActive,
  boardCount,
  lastUpdateTime,
  apiStatus,
  onToggleTheme,
  onToggleColorMode,
  onIntervalChange,
  onToggleSimulation,
  onAddBoard,
  onRefreshPrices,
}: NavbarProps) {
  const intervals = [
    { label: '1s', value: 1000 },
    { label: '3s', value: 3000 },
    { label: '5s', value: 5000 },
    { label: '10s', value: 10000 },
    { label: '30s', value: 30000 },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 3v16a2 2 0 0 0 2 2h16" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
          </span>
          <span>灵犀茶馆</span>
        </div>
        <div className={styles.status}>
          <span
            className={`${styles.pulseDot} ${simulationActive ? styles.pulseDotActive : styles.pulseDotPaused}`}
          />
          <span>
            {apiStatus === 'unavailable' ? (
              <span style={{ color: 'var(--fall-color)' }}>网络不可用！</span>
            ) : simulationActive ? (
              `${apiStatus === 'fetching' ? '加载中' : '实时'} · ${boardCount}个板块`
            ) : '已暂停'}
            {lastUpdateTime && simulationActive && apiStatus === 'ok' && (
              <span className={styles.updateTime}> | {lastUpdateTime}</span>
            )}
          </span>
        </div>
      </div>

      <div className={styles.navRight}>
        <div className={styles.controls}>
          {/* 时间间隔 */}
          <select
            className={styles.select}
            value={intervalMs}
            onChange={(e) => onIntervalChange(Number(e.target.value))}
          >
            {intervals.map((i) => (
              <option key={i.value} value={i.value}>
                每{i.label}
              </option>
            ))}
          </select>

          {/* 暂停/继续 */}
          <button className={styles.iconBtn} onClick={onToggleSimulation} title={simulationActive ? '暂停更新' : '继续更新'}>
            {simulationActive ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            )}
          </button>

          {/* 主题切换 */}
          <button className={styles.iconBtn} onClick={onToggleTheme} title={theme === 'dark' ? '切换亮色主题' : '切换暗色主题'}>
            {theme === 'dark' ? (
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
            )}
          </button>

          {/* 颜色模式切换 */}
          <button className={styles.iconBtn} onClick={onToggleColorMode} title={colorMode === 'cn' ? '切换为美股配色' : '切换为A股配色'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20z" />
            </svg>
          </button>

          {/* 手动刷新 */}
          <button className={styles.iconBtn} onClick={onRefreshPrices} title="手动刷新行情">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
        </div>

        <button className={styles.addBtn} onClick={onAddBoard}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" /><path d="M12 5v14" />
          </svg>
          新增板块
        </button>
      </div>
    </nav>
  );
}
