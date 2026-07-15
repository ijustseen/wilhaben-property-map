# Supabase для StudiWohnkarte

## Подходит ли Supabase?

**Да** — для этого проекта Supabase хороший выбор:

| Задача | Supabase |
|--------|----------|
| PostgreSQL (пользователи, избранное, подписки) | ✓ |
| Auth (email, Google OAuth) | ✓ — заменит `data/users.json` + самописные cookie |
| Row Level Security | ✓ — избранное только своему user_id |
| Vercel | ✓ — serverless-friendly, `@supabase/ssr` |
| Lemon Squeezy webhooks | ✓ — писать `subscriptions` в Postgres |
| Realtime (алерты Plus) | ✓ — позже, для saved searches |

**Альтернативы:** Neon + Clerk, PlanetScale + Auth.js — тоже рабочие, но Supabase даёт **одну** панель для auth + DB + (опционально) storage.

## Текущее состояние

Сейчас:

- `lib/auth.ts` — scrypt + HMAC cookie + `data/users.json`
- `lib/favorites.ts` — `data/favorites.json`
- На Vercel **файловая система не персистентна** → auth/favorites в проде **не работают надёжно**

**Вывод:** переход на Supabase не «nice to have», а **нужен для продакшена на Vercel**.

## Рекомендуемая схема

SQL-миграция: `supabase/migrations/001_initial.sql`

```sql
-- profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  plan text not null default 'free' check (plan in ('free', 'plus')),
  lemon_subscription_id text,
  created_at timestamptz not null default now()
);

-- favorites
create table public.favorites (
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

-- saved searches (Plus)
create table public.saved_searches (
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

create policy "profiles: own row" on public.profiles
  for all using (auth.uid() = id);

create policy "favorites: own rows" on public.favorites
  for all using (auth.uid() = user_id);

create policy "saved_searches: own rows" on public.saved_searches
  for all using (auth.uid() = user_id);
```

## План миграции (по шагам)

1. **Supabase project** → скопировать `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` в Vercel.
2. Выполнить SQL из `supabase/migrations/001_initial.sql` и **`002_app_users.sql`** (обязательно для auth на Vercel).
3. Google OAuth в Supabase Dashboard (те же redirect URLs, что сейчас).
4. Заменить `lib/auth.ts` на `@supabase/ssr` (`lib/supabase/server.ts`, `lib/supabase/client.ts`).
5. Переписать `/api/favorites` на Postgres.
6. Webhook Lemon Squeezy → `profiles.plan = 'plus'`.
7. Удалить `data/*.json` из runtime-зависимостей.

## Env

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # только server / webhooks
```

## Лимиты Free tier

- Free: max 10 favourites (проверка в API)
- Plus: unlimited + `saved_searches`

Реализация Plus-лимитов — после webhook; карта остаётся бесплатной.
