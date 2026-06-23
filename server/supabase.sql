-- 灵犀茶馆 Supabase 数据库表
-- 单用户工具，RLS 全开放（仅 anon key 持有者可访问）

create table if not exists public.boards_data (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 插入初始空数据行（首次部署时执行一次）
insert into public.boards_data (data)
values ('{"b":{},"o":[]}'::jsonb);

-- 允许所有匿名用户读写（单用户个人工具）
create policy "allow_all"
  on public.boards_data
  for all
  using (true)
  with check (true);

-- 自动更新 updated_at
create extension if not exists moddatetime;
create trigger set_updated_at
  before update on public.boards_data
  for each row
  execute function moddatetime(updated_at);
