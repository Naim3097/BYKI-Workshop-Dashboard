# Workshop Commerce Platform

A reusable commerce + operations platform for car / transmission workshops. One
repo, two deployable parts that talk to one database:

- **`storefront/`** - the public website (static HTML/CSS/JS, no build step). A
  single landing page where customers browse parts, search, add to a cart drawer,
  and pay online. Hosts anywhere static (GitHub Pages, Netlify, Cloudflare Pages).
- **`backend/`** - the owner application (Next.js 15 + TypeScript). Owner
  dashboard (transactions, inventory, bookings), a sales portal for owner-created
  payment links, and the payment / catalogue APIs. Deploys to Vercel; data in
  Supabase.

Payments use the **LeanX** gateway (`leanx.io`). Until a workshop's LeanX
collection UUID is set, the backend runs a built-in payment simulator so the full
flow works end to end with no credentials.

```
 Customer (browser)                     Owner
        |                                 |
  storefront/ (static)            backend/ (Next.js on Vercel)
  index.html  --- fetch --->  GET /api/catalog          \
  cart drawer --- POST --->  /api/payments/create -> LeanX
  success.html <- redirect -  /api/payments/webhook <- LeanX
                              /dashboard /portal (owner, gated)
                                         |
                                     Supabase (catalogue, stock, orders, bookings)
```

## What it does

- Retail and bulk (wholesale) pricing, applied automatically by quantity.
- One-page buyer flow: browse, search, cart drawer, online payment.
- Owner sales portal: build an order or booking for a buyer and share a payment link.
- Owner dashboard: every transaction across channels, filterable by date; live
  inventory with add/edit product, restock, and a separate workshop-usage ledger.
- Service / inspection bookings with a deposit.

## Run locally

Backend (owner app + APIs):
```
cd backend
cp .env.local.example .env.local      # defaults run in mock payment mode
npm install
npm run dev                            # http://localhost:3000
```

Storefront (static site) - serve it on any static server, e.g.:
```
cd storefront
npx serve -l 5190                      # or: python -m http.server 5190
# open http://localhost:5190/index.html
```

By default the storefront calls the backend at `http://localhost:3000`
(`assets/catalog.js`, constant `BACKEND_URL`). Owner login code is set by
`OWNER_ACCESS_CODE` in `backend/.env.local`.

Demo data: the backend seeds an example catalogue (`backend/lib/catalog-seed.json`)
into a file-backed store at `backend/.data/store.json`. Delete that file to reseed.

## Deploy a workshop (production)

1. **Supabase** - create a project, run `backend/supabase/schema.sql`, then
   `backend/supabase/seed.sql`. Repoint `backend/lib/store.ts` to Supabase
   (see `backend/docs/supabase-migration.md`).
2. **Backend** - deploy `backend/` to Vercel. Set env (see
   `backend/docs/configuration.md`): `PAYMENTS_MODE=live`, the LeanX credentials,
   `NEXT_PUBLIC_BASE_URL` = the Vercel URL, `ALLOWED_ORIGIN` = the storefront
   origin, and the Supabase keys.
3. **Storefront** - set `BACKEND_URL` in `storefront/assets/catalog.js` (or define
   `window.MNA_BACKEND_URL` before that script) to the Vercel URL. Push
   `storefront/` to its static host.
4. **LeanX** - register the webhook `<backend>/api/payments/webhook` and confirm a
   test transaction. Remove the mock simulator (`backend/app/pay/[ref]` and
   `backend/app/api/payments/simulate`) in production.

## Customise for a new workshop

This repo is the template. For each new workshop:

- **Branding** - replace `storefront/assets/` logo/images, the palette tokens in
  `storefront/index.html` (`:root` variables) and `backend/tailwind.config.ts`,
  and the WhatsApp/phone placeholders (search `60123456789` and `data-edit` in the
  storefront).
- **Catalogue** - edit `storefront/assets/catalog.js` categories, then regenerate
  the backend seed: `cd backend && node scripts/import-catalog.mjs ../storefront/assets/catalog.js`
  (writes `lib/catalog-seed.json` and `supabase/seed.sql`). Or manage products
  live from the owner dashboard once Supabase is connected.
- **Content** - update the marketing copy, services, and the 3D simulator section
  in `storefront/index.html` (or remove the simulator if not relevant).
- **Config** - new Supabase project, new LeanX UUID, new domain.

## Documentation

Full docs live in **`backend/docs/`**: architecture, data model, payments (LeanX),
API reference, inventory, configuration, Supabase migration, integration guide,
integration status, and UX guidelines.

## Notes

- Owner areas are gated by a simple access code in the template; replace with
  Supabase Auth before production (`backend/docs/integration-guide.md`).
- No emojis or icon fonts in the owner app; the storefront uses a few small inline
  SVGs only where necessary.
- Currency is MYR throughout.
