-- Custom auth storage (cookie sessions) for Vercel — not tied to auth.users
-- Run after 001_initial.sql in Supabase SQL editor

create table if not exists public.app_users (
  id text primary key,
  email text not null,
  name text not null,
  provider text not null check (provider in ('password', 'google')),
  password_hash text,
  password_salt text,
  google_id text,
  plan text not null default 'free' check (plan in ('free', 'plus')),
  lemon_subscription_id text,
  created_at timestamptz not null default now(),
  constraint app_users_email_unique unique (email),
  constraint app_users_google_id_unique unique (google_id)
);

create table if not exists public.app_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.app_users(id) on delete cascade,
  listing_id text not null,
  source text not null check (source in ('apartments', 'shared', 'dorms')),
  city_id text not null,
  title text not null,
  price_display text,
  address text,
  url text,
  image_url text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id, source)
);

create index if not exists app_favorites_user_created_idx
  on public.app_favorites (user_id, created_at desc);

alter table public.app_users enable row level security;
alter table public.app_favorites enable row level security;

-- No public policies: only service role (server) accesses these tables.
