# Deploying on Vercel

This is a **pnpm + Turborepo monorepo**. Each app is deployed as its **own Vercel
project** from the **same GitHub repo** (`Naim3097/BYKI-Workshop-Dashboard`).

Node is pinned to **22.x** (root `package.json` → `engines`) and each app pins the
framework via `apps/<app>/vercel.json` (`{ "framework": "nextjs" }`), so Vercel
always detects Next.js (avoids the "No Output Directory named public" error).

## One-time, per app

Create a Vercel project for each of `apps/mna`, `apps/overhaulinyard`, `apps/byki`:

1. **Add New → Project** → import `Naim3097/BYKI-Workshop-Dashboard`.
2. **Root Directory** → *Edit* → select the app folder (e.g. `apps/mna`).
3. **Framework**: Next.js (auto — pinned by the app's `vercel.json`).
4. **Build / Install / Output**: leave **default** (do NOT set Output Directory to
   `public`). Vercel installs the pnpm workspace and builds `.next`; `@byki/core`
   compiles via `transpilePackages`.
5. Add **Environment Variables** (see below), then **Deploy** and assign a domain.

## Environment variables

Copy values from each app's local `.env.local` (git-ignored; not in the repo).

**All apps (same shared Supabase project):**

| Key | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | shared project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | secret — server only |

**Workshop apps (`mna`, `overhaulinyard`) also:**

| Key | Notes |
| --- | --- |
| `NEXT_PUBLIC_WORKSHOP_ID` | that workshop's UUID (row in `workshops`) |
| `NEXT_PUBLIC_WORKSHOP_SLUG` | e.g. `mna` |
| `PAYMENTS_MODE` | `mock` (built-in simulator) or `live` |
| `NEXT_PUBLIC_BASE_URL` | set to the project's domain after first deploy |
| `LEANX_AUTH_TOKEN`, `LEANX_COLLECTION_UUID`, `LEANX_API_HOST` | only when `PAYMENTS_MODE=live` |

**BYKI (`apps/byki`)**: only the three shared Supabase vars (it reads across all
workshops; no workshop id).

## Adding a new workshop later

1. `apps/<slug>/` — its config + design + `vercel.json` (copy an existing app's).
2. Insert a `workshops` row + seed products in the shared Supabase.
3. New Vercel project → Root Directory `apps/<slug>` → env vars → Deploy.

It automatically feeds BYKI (every write carries `workshop_id`).
