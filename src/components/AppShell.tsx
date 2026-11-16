'use client';

/**
 * 应用外壳（对标 etf.maxmeng.top 的形态）：左侧固定导航 + 顶栏 + 内容区。
 *
 * 左侧栏承载三类入口：主菜单（自选 / 设置 / 关于）、板块快速定位、底部署名。
 * 右侧顶栏只服务「自选」页（行情状态 + 刷新间隔 + 手动刷新 + 新增板块），
 * 其余页面顶栏为空（桌面端不渲染，窄屏只留开合侧栏的汉堡按钮）。
 * 窄屏（≤900px）时侧栏改为抽屉，由顶栏的汉堡按钮开合。
 */

import { useSyncExternalStore, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ConfigProvider, Spin } from 'antd';
import styles from './AppShell.module.css';
import Navbar from './Navbar';
import Modal from './Modal';
import ToastContainer from './ToastContainer';
import { DashboardProvider } from '../App';
import { useDashboard } from '../store/context';
import { SITE_ICON } from '../lib/assets';

// 客户端标记：静态导出预渲染时返回 false（首屏只吐一个 loading 占位），水合后返回 true
const emptySubscribe = () => () => {};
const useIsClient = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

const NAV = [
  {
    href: '/',
    label: '自选',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: '设置',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    href: '/about',
    label: '关于',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
];

function Shell({ children }: { children: React.ReactNode }) {
  const d = useDashboard();
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [siderOpen, setSiderOpen] = useState(false);

  const current = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';

  const goBoard = (boardId: string) => {
    setSiderOpen(false);
    if (current !== '/') router.push('/');
    window.setTimeout(() => {
      document.getElementById(`board-${boardId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, current === '/' ? 0 : 260);
  };

  return (
    <ConfigProvider theme={d.antdThemeConfig}>
      <div className={styles.shell}>
        <aside className={`${styles.sider} ${siderOpen ? styles.siderOpen : ''}`}>
          <Link href="/" className={styles.brand}>
            <img src={SITE_ICON} alt="灵犀茶馆" className={styles.brandIcon} width={26} height={26} />
            <span>灵犀茶馆</span>
          </Link>

          <nav>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSiderOpen(false)}
                className={`${styles.navItem} ${current === item.href ? styles.navItemActive : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className={styles.navGroup}>我的板块</div>
          {d.boardOrder.length === 0 ? (
            <div className={styles.siderEmpty}>暂无板块</div>
          ) : (
            <div>
              {d.boardOrder.map((bid) => {
                const board = d.boards[bid];
                if (!board) return null;
                return (
                  <button
                    key={bid}
                    type="button"
                    className={styles.boardItem}
                    onClick={() => goBoard(bid)}
                    title={board.title}
                  >
                    {board.title}（{board.stocks.length}）
                  </button>
                );
              })}
            </div>
          )}

          <div className={styles.siderFoot}>藏经阁</div>
        </aside>

        {siderOpen && <div className={styles.backdrop} onClick={() => setSiderOpen(false)} />}

        <div className={styles.right}>
          <Navbar
            variant={current === '/' ? 'board' : 'bare'}
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
            onToggleSider={() => setSiderOpen((v) => !v)}
          />
          <div className={styles.content}>{children}</div>
          <div className={styles.footer}>
            <span className={styles.footerText}>心有灵犀 谈笑间 众生皆有回响</span>
            <span className={styles.footerSep}> ｜ </span>
            <span className={styles.footerText}>味归平淡 静思处 乾坤尽纳一盏</span>
          </div>
        </div>

        <ToastContainer toasts={d.toasts} />
        {d.modal && (
          <Modal
            title={d.modal.title}
            onCancel={() => d.setModal(null)}
            onConfirm={d.modal.onConfirm}
            confirmText="确定"
            danger
          >
            {d.modal.message}
          </Modal>
        )}
      </div>
    </ConfigProvider>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  // 业务状态直接读 localStorage（板块、主题、刷新间隔），只能等水合后再渲染
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <div className={styles.boot}>
        <Spin />
      </div>
    );
  }

  return (
    <DashboardProvider>
      <Shell>{children}</Shell>
    </DashboardProvider>
  );
}
