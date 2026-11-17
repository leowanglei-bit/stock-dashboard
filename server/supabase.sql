-- 灵犀茶馆 · 藏经阁（stock-dashboard）Supabase 表
-- 单用户工具：RLS 开启 + 全开放策略，持有 anon / publishable key 即可读写
-- 幂等：可重复执行，不报错、不重复插行
-- 依赖：无（不用 moddatetime 触发器，updated_at 由客户端 update 时自然不需要）

create table if not exists public.boards_data (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 初始空行：仅在表为空时插入
insert into public.boards_data (data)
select '{"b":{},"o":[]}'::jsonb
where not exists (select 1 from public.boards_data);

-- 允许匿名/已登录角色读写（单用户个人工具）
alter table public.boards_data enable row level security;

drop policy if exists "allow_all" on public.boards_data;
create policy "allow_all"
  on public.boards_data
  for all
  to anon, authenticated
  using (true)
  with check (true);
