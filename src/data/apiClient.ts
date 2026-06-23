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

async function doSave(data: ServerData): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const compressed = compress(data.boards, data.boardOrder);
  try {
    // 取第一行数据 upsert（始终只有一行，id 固定）
    const { data: existing } = await supabase.from(TABLE).select('id').limit(1);
    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from(TABLE)
        .update({ data: compressed })
        .eq('id', existing[0].id);
      return !error;
    } else {
      const { error } = await supabase
        .from(TABLE)
        .insert({ data: compressed });
      return !error;
    }
  } catch { return false; }
}

/** 保存到 Supabase（防抖 2 秒），返回是否成功 */
export function saveToServer(data: ServerData): Promise<boolean> {
  if (!isSupabaseConfigured) return Promise.resolve(false);
  pendingData = data;
  if (saveTimer) clearTimeout(saveTimer);
  return new Promise((resolve) => {
    saveTimer = setTimeout(async () => {
      if (pendingData) {
        const ok = await doSave(pendingData);
        pendingData = null;
        resolve(ok);
      } else {
        resolve(false);
      }
    }, 2000);
  });
}

/** 判断是否启用服务端模式 */
export function isServerMode(): boolean {
  return isSupabaseConfigured;
}
