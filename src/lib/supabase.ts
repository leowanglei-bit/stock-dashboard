/**
 * Supabase 客户端
 * 匿名访问，无需用户登录。Token 在构建时注入。
 * 数据存于 boards_data 表（单行 jsonb）。
 */

import { createClient } from '@supabase/supabase-js';

const SUPA_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) as string || '';
const SUPA_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) as string || '';

export const isSupabaseConfigured = Boolean(SUPA_URL && SUPA_ANON_KEY);

// 未配置时返回 noop 对象，避免页面崩溃
const noopTable: any = {
  select: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  upsert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  update: () => noopTable,
  delete: () => noopTable,
  eq: () => noopTable,
  limit: () => noopTable,
  single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  maybeSingle: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
};

const noop = {
  from: () => noopTable,
};

export const supabase = isSupabaseConfigured
  ? createClient(SUPA_URL, SUPA_ANON_KEY)
  : noop;
