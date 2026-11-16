import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import './globals.css';

// Inter 自托管（原 index.css 从 Google Fonts 远程引，改为本地 woff2，构建与运行都不依赖外网）
const inter = localFont({
  src: [
    { path: './fonts/inter-latin.woff2', weight: '100 900', style: 'normal' },
    { path: './fonts/inter-latin-ext.woff2', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '灵犀茶馆 - 藏经阁',
  description:
    '灵犀茶馆 - 实时多板块股票同列分析系统。高颜值、多板同列的股票自选分析工具，支持自定义板块、股票拖拽排序、实时价格模拟更新。',
  keywords: ['股票', '板块同列', '拖动排序', '自选股', '股票分析', '实时价格'],
  authors: [{ name: 'Antigravity Dev' }],
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/favicon.svg` },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body>
        {/* antd cssinjs 样式在 SSR 阶段抽出，静态导出后首屏不掉样式 */}
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
