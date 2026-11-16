'use client';

/**
 * 全局顶栏（形态对标 etf.maxmeng.top）：56px 高、贴顶、底边线，
 * 左侧「汉堡 + 站点 logo + 站点名」，右侧「消息 + 个人中心」。
 *
 * 这里只放站点级入口；行情状态、刷新间隔、手动刷新、新增板块属于「自选」页，
 * 由 BoardToolbar 在页面内渲染，不进全局外壳。
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Dropdown, Popover } from 'antd';
import type { MenuProps } from 'antd';
import styles from './SiteHeader.module.css';
import { SITE_ICON } from '../lib/assets';
import type { ThemeMode } from '../types';

interface SiteHeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  serverMode: boolean;
  /** 桌面端折叠侧栏，窄屏开合抽屉 */
  onToggleSider?: () => void;
  /** 未读消息数；本机没有消息后端，恒为 0，红点自然不显示 */
  unreadCount?: number;
}

export default function SiteHeader({
  theme,
  onToggleTheme,
  serverMode,
  onToggleSider,
  unreadCount = 0,
}: SiteHeaderProps) {
  const router = useRouter();
  // antd Dropdown 选完项不会自动收起，这里受控关闭，避免菜单挂在页面上
  const [profileOpen, setProfileOpen] = useState(false);

  const profileItems: MenuProps['items'] = [
    {
      key: 'identity',
      disabled: true,
      label: (
        <div className={styles.profileHead}>
          <span className={styles.profileName}>本地用户</span>
          <span className={styles.profileSub}>数据只存本机与自己的云端库</span>
        </div>
      ),
    },
    { type: 'divider' },
    { key: 'settings', label: '设置' },
    { key: 'about', label: '关于' },
    { key: 'theme', label: theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题' },
    { type: 'divider' },
    {
      key: 'sync',
      disabled: true,
      label: `云端同步：${serverMode ? '已启用（Supabase）' : '未配置'}`,
    },
  ];

  const onProfileClick: MenuProps['onClick'] = ({ key }) => {
    setProfileOpen(false);
    if (key === 'settings') router.push('/settings');
    else if (key === 'about') router.push('/about');
    else if (key === 'theme') onToggleTheme();
  };

  const messagePanel = (
    <div className={styles.msgPanel}>
      <p className={styles.msgEmpty}>暂无消息</p>
      <p className={styles.msgHint}>行情接口异常、云端同步结果会在这里提醒</p>
    </div>
  );

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {onToggleSider && (
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onToggleSider}
            aria-label="切换侧边栏"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" />
            </svg>
          </button>
        )}
        <Link href="/" className={styles.brand}>
          <img src={SITE_ICON} alt="灵犀茶馆" width={32} height={32} className={styles.logo} />
          <span className={styles.title}>灵犀茶馆</span>
        </Link>
      </div>

      <div className={styles.right}>
        <Popover
          trigger="click"
          placement="bottomRight"
          title="消息"
          content={messagePanel}
          arrow={false}
        >
          <button type="button" className={styles.iconBtn} aria-label="消息">
            <Badge dot={unreadCount > 0} offset={[-1, 1]}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </Badge>
          </button>
        </Popover>

        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          open={profileOpen}
          onOpenChange={setProfileOpen}
          menu={{ items: profileItems, onClick: onProfileClick }}
        >
          <button type="button" className={styles.avatar} aria-label="个人中心">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.4-8 5.4V21h16v-1.6c0-3-3.6-5.4-8-5.4Z" />
            </svg>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
