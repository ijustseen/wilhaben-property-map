-- StudiWohnkarte initial schema
-- Run in Supabase SQL editor or via supabase db push

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  plan text not null default 'free' check (plan in ('free', 'plus')),
  lemon_subscription_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
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

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  city_id text not null,
  university_id text,
  filters jsonb not null default '{}',
  notify_email boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_searches enable row level security;

create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id);

create policy "favorites_own" on public.favorites
  for all using (auth.uid() = user_id);

create policy "saved_searches_own" on public.saved_searches
  for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
