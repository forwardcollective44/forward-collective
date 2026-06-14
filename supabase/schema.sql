-- Forward Collective — Supabase schema
-- Run in the Supabase SQL editor, or via `supabase db push`.

-- =========================================================
-- Users
-- =========================================================
create table if not exists users (
  id uuid primary key references auth.users,
  email text,
  phone text,
  name text,
  points_total int default 0,
  collective_member boolean default false,
  early_access boolean default false,
  member_since timestamptz,
  last_purchase_date timestamptz,
  purchase_count int default 0,
  current_streak_months int default 0,
  longest_streak_months int default 0,
  lifetime_spend numeric default 0,
  referral_code text unique,
  referred_by uuid references users(id),
  created_at timestamptz default now()
);

-- =========================================================
-- Point events  (positive = earned, negative = redeemed)
-- =========================================================
create table if not exists point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  order_id text,
  type text,
  -- 'purchase_base' | 'order_size_bonus' | 'quantity_bonus' |
  -- 'recurring_bonus' | 'streak_bonus' | 'anniversary_bonus' |
  -- 'referral_bonus' | 'welcome_bonus' | 'redemption'
  description text,
  points int,
  created_at timestamptz default now()
);
create index if not exists point_events_user_idx on point_events (user_id, created_at desc);

-- =========================================================
-- Drops (Archives page)
-- =========================================================
create table if not exists drops (
  id uuid primary key default gen_random_uuid(),
  name text,
  season text,
  status text default 'archived',
  early_access_date timestamptz,
  public_release_date timestamptz,
  image_url text,
  created_at timestamptz default now()
);

-- =========================================================
-- Redemptions
-- =========================================================
create table if not exists redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  points_spent int,
  reward_description text,
  discount_code text,
  status text default 'active', -- 'active' | 'used' | 'pending_fulfillment'
  created_at timestamptz default now()
);
create index if not exists redemptions_user_idx on redemptions (user_id, created_at desc);

-- =========================================================
-- Products
-- =========================================================
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text,
  category text,
  price numeric,
  image_url text,
  tag text, -- 'staple' | 'archive'
  active boolean default true
);

-- =========================================================
-- Row Level Security
-- A member may read/update only their own row and their own events.
-- The service-role key (server side) bypasses RLS for writes such as
-- crediting points after a fulfilled order.
-- =========================================================
alter table users enable row level security;
alter table point_events enable row level security;
alter table redemptions enable row level security;

create policy "users read self" on users
  for select using (auth.uid() = id);
create policy "users update self" on users
  for update using (auth.uid() = id);

create policy "events read own" on point_events
  for select using (auth.uid() = user_id);

create policy "redemptions read own" on redemptions
  for select using (auth.uid() = user_id);

-- Drops and products are public catalog data.
alter table drops enable row level security;
alter table products enable row level security;
create policy "drops public read" on drops for select using (true);
create policy "products public read" on products for select using (true);
