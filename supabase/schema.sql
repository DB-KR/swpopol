-- Supabase SQL Editor에서 이 파일 전체를 복사해 붙여넣고 Run 하세요.
-- 이 파일은 몇 번을 다시 실행해도 안전합니다 (이미 있는 테이블/컬럼/정책은 건드리지 않아요).
-- 앞으로 기능이 추가될 때마다 이 파일 전체를 그대로 다시 실행하시면 됩니다.

create extension if not exists "pgcrypto";

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  name text not null,
  value numeric not null default 0,
  memo text default '',
  created_at timestamptz not null default now()
);

-- 매수가/매도가/환율/매수일/수량 컬럼 (없으면 추가, 있으면 건너뜀)
alter table public.assets add column if not exists currency text not null default 'KRW';
alter table public.assets add column if not exists buy_price numeric;
alter table public.assets add column if not exists sell_price numeric;
alter table public.assets add column if not exists buy_fx_rate numeric;
alter table public.assets add column if not exists buy_date date;
alter table public.assets add column if not exists quantity numeric;

create table if not exists public.liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null default 'other',
  name text not null,
  amount numeric not null default 0,
  interest_rate numeric,
  memo text default '',
  created_at timestamptz not null default now()
);

-- 자산군별 목표 비중 (리밸런싱용)
create table if not exists public.allocation_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  target_pct numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

-- 시장지수(S&P500/KOSPI) 일별 기록. 개인 데이터가 아니라 GitHub Actions가
-- service_role 키로 매일 자동으로 채워넣습니다 (일반 로그인 사용자는 읽기만 가능).
create table if not exists public.market_indices (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  symbol text not null,
  value numeric not null,
  created_at timestamptz not null default now(),
  unique (date, symbol)
);

create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month text not null,
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

-- 연도별 부동산/금융자산 게이지를 위해 스냅샷에도 카테고리별 합계를 남깁니다.
alter table public.snapshots add column if not exists real_estate_total numeric not null default 0;
alter table public.snapshots add column if not exists financial_total numeric not null default 0;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null default '자산 목표',
  target_amount numeric not null default 0,
  target_date date,
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- 부동산/금융자산 목표를 따로 설정할 수 있도록 분리 (target_amount는 더 이상 앱에서 쓰지 않지만 남겨둡니다)
alter table public.goals add column if not exists real_estate_target numeric not null default 0;
alter table public.goals add column if not exists financial_target numeric not null default 0;

-- 더 이상 앱에서 쓰지 않지만(현금흐름은 cashflow_items로 대체됨) 기존 데이터 보존을 위해 남겨둡니다.
create table if not exists public.cashflow (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month text not null,
  income numeric not null default 0,
  expense numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

-- 카테고리별 항목 단위 현금흐름 (월급/생활비/통신비/보험비 등)
create table if not exists public.cashflow_items (
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
alter table public.liabilities enable row level security;
alter table public.allocation_targets enable row level security;
alter table public.market_indices enable row level security;
alter table public.snapshots enable row level security;
alter table public.goals enable row level security;
alter table public.cashflow enable row level security;
alter table public.cashflow_items enable row level security;

-- 본인 데이터만 읽고 쓸 수 있도록 제한 (다른 사람은 로그인해도 서로의 데이터를 볼 수 없습니다)
-- drop 후 다시 만드는 방식이라 몇 번을 재실행해도 안전합니다.
drop policy if exists "individual access" on public.assets;
create policy "individual access" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "individual access" on public.liabilities;
create policy "individual access" on public.liabilities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "individual access" on public.allocation_targets;
create policy "individual access" on public.allocation_targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- market_indices는 개인 데이터가 아니라 시장 전체 데이터라 정책이 다릅니다:
-- 로그인한 사용자는 누구나 읽을 수 있고, 쓰기는 service_role(=GitHub Actions)만 가능합니다.
drop policy if exists "read only" on public.market_indices;
create policy "read only" on public.market_indices
  for select using (auth.role() = 'authenticated');

drop policy if exists "individual access" on public.snapshots;
create policy "individual access" on public.snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "individual access" on public.goals;
create policy "individual access" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "individual access" on public.cashflow;
create policy "individual access" on public.cashflow
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "individual access" on public.cashflow_items;
create policy "individual access" on public.cashflow_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
