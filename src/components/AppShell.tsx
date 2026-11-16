'use client';

/**
 * 应用外壳，布局关系对标 etf.maxmeng.top：
 *
 *   shell（纵向）
 *   ├─ SiteHeader：顶栏横贯整宽，永远在最上面
 *   └─ body（横向）
 *      ├─ aside：侧栏从顶栏下沿开始，只占下半屏高度
 *      └─ right：内容区 + 页脚（自身滚动）
 *
 * 左侧栏承载两类入口：主菜单（自选 / 设置 / 关于）、板块快速定位、底部署名。
 * 「自选」页的行情操作条由 app/page.tsx 自己在内容区渲染，不进顶栏。
 * 汉堡按钮：桌面端折叠/展开侧栏，窄屏（≤900px）时侧栏改为抽屉。
 */

import { useEffect, useSyncExternalStore, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ConfigProvider, Spin } from 'antd';
import styles from './AppShell.module.css';
import SiteHeader from './SiteHeader';
import Modal from './Modal';
import ToastContainer from './ToastContainer';
import { DashboardProvider } from '../App';
import { useDashboard } from '../store/context';

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
    href: '/broad',
    label: '宽基',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 20h18" />
        <rect x="5" y="11" width="3.6" height="6" rx="1" />
        <rect x="10.2" y="7" width="3.6" height="10" rx="1" />
        <rect x="15.4" y="13" width="3.6" height="4" rx="1" />
      </svg>
    ),
  },
];

function Shell({ children }: { children: React.ReactNode }) {
  const d = useDashboard();
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [siderOpen, setSiderOpen] = useState(false);
  // 桌面端折叠侧栏（汉堡按钮在两种宽度下语义不同：宽屏折叠、窄屏开抽屉）
  const [collapsed, setCollapsed] = useState(false);
  // 窄屏判定放在 JS 里：折叠＝直接不渲染侧栏，避免再和 .sider 的宽度打架
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const hideSider = collapsed && !narrow;

  const toggleSider = () => {
    if (narrow) setSiderOpen((v) => !v);
    else setCollapsed((v) => !v);
  };

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
        {/* 第一行：顶栏横贯整宽 */}
        <SiteHeader
          theme={d.theme}
          onToggleTheme={d.toggleTheme}
          serverMode={d.serverMode}
          onToggleSider={toggleSider}
        />

        {/* 第二行：侧栏 + 内容区，侧栏从顶栏下沿开始 */}
        <div className={styles.body}>
          {!hideSider && (
            <aside className={`${styles.sider} ${siderOpen ? styles.siderOpen : ''}`}>
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

              {/* 设置 / 关于下沉到侧栏底部，主菜单只留内容入口 */}
              <div className={styles.siderFoot}>
                <Link
                  href="/settings"
                  onClick={() => setSiderOpen(false)}
                  className={`${styles.siderFootLink} ${current === '/settings' ? styles.siderFootLinkActive : ''}`}
                >
                  设置
                </Link>
                <span className={styles.siderFootDot}>·</span>
                <Link
                  href="/about"
                  onClick={() => setSiderOpen(false)}
                  className={`${styles.siderFootLink} ${current === '/about' ? styles.siderFootLinkActive : ''}`}
                >
                  关于
                </Link>
              </div>
            </aside>
          )}

          {siderOpen && <div className={styles.backdrop} onClick={() => setSiderOpen(false)} />}

          <div className={styles.right}>
            <div className={styles.content}>{children}</div>
            <div className={styles.footer}>
              <span className={styles.footerText}>心有灵犀 谈笑间 众生皆有回响</span>
              <span className={styles.footerSep}> ｜ </span>
              <span className={styles.footerText}>味归平淡 静思处 乾坤尽纳一盏</span>
            </div>
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
