'use client';

import dynamic from 'next/dynamic';
import { Spin } from 'antd';

/**
 * 看板是纯客户端应用：数据全在 localStorage + Supabase + 新浪/腾讯行情，
 * 没有可预渲染的服务端数据。用 ssr:false 保持与迁移前完全一致的运行语义
 * （渲染期直接读 localStorage 的旧逻辑一行不改）。
 */
const Dashboard = dynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full items-center justify-center bg-bg">
      <Spin size="large" />
    </div>
  ),
});

export default function Page() {
  return <Dashboard />;
}
