import styles from './Navbar.module.css';
import type { ThemeMode } from '../types';

interface NavbarProps {
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
  onUploadData: () => void;
  onDownloadData: () => void;
}

export default function Navbar({
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
  onUploadData,
  onDownloadData,
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
              `${apiStatus === 'fetching' ? '加载中' : '实时'}`
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

          {/* 从云端下载 */}
          <button className={styles.iconBtn} onClick={onDownloadData} title="从云端下载数据">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-5h1.79a4.5 4.5 0 1 1 0 9H17" />
              <polyline points="14 14 17 17 20 14" />
              <line x1="17" y1="17" x2="17" y2="10" />
            </svg>
          </button>

          {/* 上传到云端 */}
          <button className={styles.iconBtn} onClick={onUploadData} title="上传数据到云端">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-5h1.79a4.5 4.5 0 1 1 0 9H17" />
              <polyline points="14 8 17 5 20 8" />
              <line x1="17" y1="5" x2="17" y2="14" />
            </svg>
          </button>

          {/* 手动刷新行情 */}
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
