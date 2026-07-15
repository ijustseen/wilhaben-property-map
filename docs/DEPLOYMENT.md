# Деплой на Vercel и домен

## Субдомен `studiwohnkarte.intruct.com`

**Да, это нормальная и распространённая схема.** Домен `intruct.com` остаётся у вас в DNS; приложение живёт на поддомене.

### Шаги

1. **Vercel** → Project → Settings → Domains → Add  
   `studiwohnkarte.intruct.com`

2. **DNS** у регистратора `intruct.com` (или Cloudflare):

   | Тип | Имя | Значение |
   |-----|-----|----------|
   | CNAME | `studiwohnkarte` | `cname.vercel-dns.com` |

   Либо используйте A-record, если Vercel покажет IP (обычно достаточно CNAME).

3. Дождаться SSL (Let's Encrypt) — Vercel выпустит сертификат автоматически.

4. **OAuth / env** — обновить redirect URLs:

   - Google Console: `https://studiwohnkarte.intruct.com/api/auth/google/callback`
   - Supabase (после миграции): Site URL + redirect allow list
   - Lemon Squeezy: success/cancel URLs на production domain

5. **Опционально:** редирект `www` или apex `intruct.com` на поддомен — отдельная настройка, если нужен маркетинговый лендинг на корне.

### Имя поддомена

DNS не чувствителен к регистру; лучше использовать **строчные** буквы в панели: `studiwohnkarte.intruct.com` (не `StudiWohnkarte` — так проще для сертификатов и документации).

### Переменные на Vercel

Скопировать из `.env.local`:

- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `LEMONSQUEEZY_*` (checkout URLs + `LEMONSQUEEZY_WEBHOOK_SECRET`)
- `NEXT_PUBLIC_SITE_URL`, `LEGAL_*`
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` (optional)
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Lemon Squeezy webhook

URL: `https://studiwohnkarte.intruct.com/api/webhooks/lemonsqueezy`

Events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, `subscription_resumed`.

Updates `profiles.plan` in Supabase by email from checkout, or `custom_data.user_id` if you pass the Supabase user UUID in Lemon Squeezy checkout custom data.

`AUTH_SECRET` и `SUPABASE_SERVICE_ROLE_KEY` — только в Environment Variables Vercel, не в git.
