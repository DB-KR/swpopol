-- Supabase SQL Editor에서 이 파일 전체를 붙여넣고 실행하세요.

create extension if not exists "pgcrypto";

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  name text not null,
  value numeric not null default 0,
  memo text default '',
  created_at timestamptz not null default now()
);

create table public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month text not null,
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null default '자산 목표',
  target_amount numeric not null default 0,
  target_date date,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table public.cashflow (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month text not null,
  income numeric not null default 0,
  expense numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

-- 카테고리별 항목 단위 현금흐름 (월급/생활비/통신비/보험비 등). 위 cashflow 테이블은 더 이상 앱에서 쓰지 않지만
-- 기존 데이터 보존을 위해 그대로 둡니다.
create table public.cashflow_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month text not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  amount numeric not null default 0,
  memo text default '',
  created_at timestamptz not null default now()
);

alter table public.assets enable row level security;
alter table public.snapshots enable row level security;
alter table public.goals enable row level security;
alter table public.cashflow enable row level security;
alter table public.cashflow_items enable row level security;

-- 본인 데이터만 읽고 쓸 수 있도록 제한 (다른 사람은 로그인해도 서로의 데이터를 볼 수 없습니다)
create policy "individual access" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "individual access" on public.snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "individual access" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "individual access" on public.cashflow
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "individual access" on public.cashflow_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
