-- 灵犀茶馆 Supabase 数据库表
-- 创建 boards_data 表用于存储板块和股票数据

create table if not exists public.boards_data (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 插入初始空数据行（仅需执行一次）
insert into public.boards_data (data)
values ('{"boards":{},"boardOrder":[]}'::jsonb);

-- 允许所有匿名用户读取数据
create policy "anon_select"
  on public.boards_data
  for select
  using (true);

-- 允许所有匿名用户写入数据
create policy "anon_insert"
  on public.boards_data
  for insert
  with check (true);

-- 允许所有匿名用户更新数据
create policy "anon_update"
  on public.boards_data
  for update
  using (true);

-- 自动更新 updated_at 的触发器
create extension if not exists moddatetime;
create trigger set_updated_at
  before update on public.boards_data
  for each row
  execute function moddatetime(updated_at);
