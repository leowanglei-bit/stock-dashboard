/**
 * 服务端持久化 — Supabase
 * 匿名访问，用户无感。页面打开即自动同步。
 * 数据存于 boards_data 表（单行 jsonb）。
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { compress, expand } from './boardsCompress';

const TABLE = 'boards_data';

export interface ServerData {
  boards: Record<string, any>;
  boardOrder: string[];
}

/** 从 Supabase 加载数据 */
export async function loadFromServer(): Promise<ServerData | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from(TABLE).select('data').limit(1);
    if (error || !data || data.length === 0) return null;
    return expand(data[0].data);
  } catch { return null; }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: ServerData | null = null;
let pendingResolves: Array<(ok: boolean) => void> = [];

async function doSave(data: ServerData): Promise<{ ok: boolean; msg: string }> {
  if (!isSupabaseConfigured) return { ok: false, msg: 'Supabase 未配置' };
  const compressed = compress(data.boards, data.boardOrder);
  try {
    const { data: existing, error: selErr } = await supabase.from(TABLE).select('id').limit(1);
    if (selErr) return { ok: false, msg: `查询失败: ${selErr.message}` };
    if (existing && existing.length > 0) {
      const { error } = await supabase.from(TABLE).update({ data: compressed }).eq('id', existing[0].id);
      if (error) return { ok: false, msg: `更新失败: ${error.message}` };
      return { ok: true, msg: '' };
    } else {
      const { error } = await supabase.from(TABLE).insert({ data: compressed });
      if (error) return { ok: false, msg: `插入失败: ${error.message}` };
      return { ok: true, msg: '' };
    }
  } catch (e: any) {
    const msg = e?.message || String(e);
    console.error('[apiClient] doSave error:', msg);
    return { ok: false, msg };
  }
}

/** 保存到 Supabase（防抖 2 秒），返回是否成功 */
export function saveToServer(data: ServerData): Promise<string> {
  if (!isSupabaseConfigured) return Promise.resolve('Supabase 未配置');
  pendingData = data;
  if (saveTimer) clearTimeout(saveTimer);
  return new Promise((resolve) => {
    pendingResolves.push(resolve);
    saveTimer = setTimeout(async () => {
      if (pendingData) {
        const { ok, msg } = await doSave(pendingData);
        pendingData = null;
        const resolves = pendingResolves.slice();
        pendingResolves = [];
        resolves.forEach((r) => r(ok ? '' : msg || '上传失败'));
      } else {
        const resolves = pendingResolves.slice();
        pendingResolves = [];
        resolves.forEach((r) => r('无数据'));
      }
    }, 2000);
  });
}

/** 判断是否启用服务端模式 */
export function isServerMode(): boolean {
  return isSupabaseConfigured;
}
