/**
 * 数据集取数入口 —— 数据放服务器，不打包进构建产物
 *
 * 静态数据集（A 股清单、宽基估值）一律放在 public/data/ 下，由部署端（GitHub Pages）
 * 以静态文件形式提供，页面运行时 fetch 取用；构建产物里**不含**这些数据本身。
 * 好处：数据集更新不需要改前端代码/重新构建 JS，首屏 JS 体积也不再被数据撑大。
 *
 * 换服务器：把 NEXT_PUBLIC_DATA_BASE_URL 指向对象存储 / Supabase Storage / CDN 的公开
 * 目录即可（目录下需有同名文件），前端代码不动。
 */

import { BASE_PATH } from './assets';

export const DATA_BASE = process.env.NEXT_PUBLIC_DATA_BASE_URL || `${BASE_PATH}/data`;

const inflight = new Map<string, Promise<unknown>>();

/** 取一个 JSON 数据集；同一文件并发请求只发一次，失败不缓存（下次重试） */
export function fetchDataset<T>(file: string): Promise<T> {
  const url = `${DATA_BASE}/${file}`;
  const cached = inflight.get(url) as Promise<T> | undefined;
  if (cached) return cached;

  const task = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`${file} 加载失败：HTTP ${res.status}`);
      return res.json() as Promise<T>;
    })
    .catch((err) => {
      inflight.delete(url);
      throw err;
    });

  inflight.set(url, task);
  return task;
}
