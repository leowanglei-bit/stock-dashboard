import type { NextConfig } from 'next';

/**
 * GitHub Pages 项目站点部署在 /<repo>/ 子路径下，需要 basePath；
 * 本地 dev 不带前缀，所以用环境变量控制（CI 里注入 NEXT_PUBLIC_BASE_PATH=/stock-dashboard）。
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  // 纯静态导出：产物 out/ 直接交给 GitHub Pages，无需 Node 常驻进程
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
