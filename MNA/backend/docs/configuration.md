# Configuration

All configuration is via environment variables. For local development, copy
`.env.local.example` to `.env.local`. For production, set these in the host
(Vercel project settings, server env, etc.).

## Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PAYMENTS_MODE` | yes | `mock` | `mock` uses the built-in simulator; `live` calls LeanX |
| `LEANX_AUTH_TOKEN` | live only | - | LeanX API auth token (client provides) |
| `LEANX_COLLECTION_UUID` | live only | - | LeanX collection UUID (client provides; pending) |
| `LEANX_API_HOST` | no | `https://api.leanx.io` | LeanX API base URL |
| `NEXT_PUBLIC_BASE_URL` | yes | `http://localhost:3000` | Public base URL for redirect/callback URLs |
| `OWNER_ACCESS_CODE` | yes (mockup) | `mna-owner` | Owner area access code (replaced by Supabase Auth) |
| `NEXT_PUBLIC_SUPABASE_URL` | prod | - | Supabase project URL (blank = file store) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod | - | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | prod | - | Supabase service role key (server only, never exposed) |

## Notes

- `NEXT_PUBLIC_BASE_URL` must be the real public HTTPS domain in production. It is
  used to build the `redirect_url` and `callback_url` sent to LeanX, and the mock
  payment link. A wrong value breaks the post-payment redirect and the webhook.
- `NEXT_PUBLIC_*` variables are exposed to the browser by Next.js. Never put
  secrets (auth token, service role key) behind a `NEXT_PUBLIC_` prefix.
- `LEANX_AUTH_TOKEN`, `LEANX_COLLECTION_UUID`, and `SUPABASE_SERVICE_ROLE_KEY` are
  server-only and must not be exposed to the client.

## Local development (.env.local)

```
PAYMENTS_MODE=mock
LEANX_AUTH_TOKEN=
LEANX_COLLECTION_UUID=
LEANX_API_HOST=https://api.leanx.io
NEXT_PUBLIC_BASE_URL=http://localhost:3000
OWNER_ACCESS_CODE=mna-owner
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Production (live LeanX + Supabase)

```
PAYMENTS_MODE=live
LEANX_AUTH_TOKEN=<from client>
LEANX_COLLECTION_UUID=<from client>
LEANX_API_HOST=https://api.leanx.io
NEXT_PUBLIC_BASE_URL=https://your-domain
OWNER_ACCESS_CODE=<strong code, or remove once Supabase Auth is in>
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```
