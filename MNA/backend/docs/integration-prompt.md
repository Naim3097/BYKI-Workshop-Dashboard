# Integration prompt (bengkelgearbox.my)

This prompt is tailored to the ACTUAL target site after inspecting the repo. The
existing site is a static HTML/CSS + vanilla-JS site on GitHub Pages (not
Next.js). The confirmed plan:

- Keep the static storefront on GitHub Pages.
- Add the backend (this Next.js system) on Vercel + Supabase.
- Make Supabase the catalog/inventory source of truth; the static shop fetches it.
- Replace the WhatsApp checkout with LeanX online payment.

Copy everything in the block below into a coding-agent session that can see BOTH
repos. Fill in the bracketed placeholders first.

---

You are integrating a hosted commerce backend into an existing static website.
The website must keep working as a static site on GitHub Pages; you are adding a
backend it calls. Work incrementally and do not break the live site.

## Repos and inputs

- Static frontend (keep, deploy stays on GitHub Pages): `[PATH_TO_bengkelgearbox]`
  (github.com/Naim3097/bengkelgearbox.my). Static HTML + vanilla JS, three.js via
  CDN, no build step. Storefront already exists: `shop.html`, `product.html`,
  `cart.html`, `assets/catalog.js` (`window.MNACatalog`), `assets/shop.js`
  (`window.MNAShop`). Checkout currently builds a WhatsApp message.
- Backend to deploy on Vercel (port from here): `[PATH_TO_MNA_SYSTEM]`. Next.js 15
  app with the LeanX flow, inventory, bookings, owner portal, and dashboard. Read
  its docs first: `[PATH_TO_MNA_SYSTEM]/docs/README.md` and everything it links,
  especially `payments-leanx.md`, `data-model.md`, `supabase-migration.md`,
  `api-reference.md`.
- Backend public URL (after deploy): `[BACKEND_URL]` (e.g. https://api.mna...vercel.app)
- Frontend origin(s) for CORS: `https://bengkelgearbox.my` and the GitHub Pages
  origin `https://[user].github.io` if used.
- Supabase: `[SUPABASE_URL]`, `[SUPABASE_ANON_KEY]`, `[SUPABASE_SERVICE_ROLE_KEY]`
- LeanX: `LEANX_AUTH_TOKEN=[...]`, `LEANX_COLLECTION_UUID=[...]` (if not yet
  provided, keep PAYMENTS_MODE=mock and finish everything else).

## Hard constraints

1. The static site stays static. No build step, no framework added to the
   frontend repo. Frontend changes are plain JS additions to existing files.
2. The charged amount is always recomputed server-side from the Supabase
   catalogue. Never trust prices sent from the browser.
3. Stock only changes through movements on the backend (`recordMovement`), and
   only on a successful payment webhook. Workshop usage stays a separate movement
   type, shown separately on the dashboard.
4. LeanX secrets live only on the backend. The frontend never sees the auth token
   or collection UUID; it only calls backend endpoints.
5. Keep the LeanX request/response contract as documented. Going live is env-only.
6. Match the existing site's visual style (it uses its own icons/emojis and
   `assets/shop.css`); do not impose the mockup's no-icon styling on the
   storefront. The owner dashboard can keep the mockup styling.

## Phase 0 - understand both sides (read only)

- Backend: skim `lib/`, `app/api/*`, `middleware.ts`, `supabase/schema.sql`.
- Frontend: read `assets/catalog.js` (product schema + `window.MNACatalog`
  helpers: `products`, `byId`, `bySlug`, `inCategory`, `featured`, `search`,
  `formatPrice`, `thumbFor`), `assets/shop.js` (`window.MNAShop` cart + the
  WhatsApp `orderUrl`), and the checkout submit in `cart.html` (it builds a
  `customer` object and calls `S.orderUrl(customer)` — this is the hook to
  replace). Note the storefront product fields:
  `id, name, slug, sku, category, description, specifications,
  compatibleVehicles, compatibleGearboxes, price, wholesalePrice,
  minWholesaleQty, stockQty, stockStatus, lowStockThreshold, tags, isFeatured`.

## Phase 1 - Supabase as catalog source of truth

- Extend the backend schema (`supabase/schema.sql`) and `lib/types.ts` to hold the
  RICHER storefront product shape, not just the mockup's. Add columns: `slug`,
  `specifications jsonb`, `compatible_vehicles text[]`, `compatible_gearboxes
  text[]`, `tags text[]`, `is_featured boolean`, `stock_status`,
  `low_stock_threshold`. Align price naming: the storefront uses
  `price`/`wholesalePrice`/`minWholesaleQty`; map these to the backend
  (`price_retail`/`price_bulk`/`bulk_min_qty`) at the API boundary, OR rename the
  backend fields to match the storefront. Pick one and be consistent.
- Write a one-off seed script that imports the existing curated catalogue from
  `assets/catalog.js` (the `PRODUCTS` array and `CATEGORIES`) into Supabase. Do
  not lose this data; it is the real catalogue.
- Follow `docs/supabase-migration.md` to rewrite `lib/store.ts` against Supabase,
  keeping function signatures. Make `recordMovement`/`createProduct` atomic.
- Enable RLS: public read on `products`/`inventory`; writes via service role only.

## Phase 2 - deploy the backend on Vercel

- Deploy the Next.js app to Vercel with the env vars above.
- Add CORS headers to the API routes (or via `next.config`/middleware) allowing
  the frontend origin(s) for `GET /api/products`, `POST /api/payments/create`,
  `GET /api/payments/status`. The webhook (`/api/payments/webhook`) is called by
  LeanX, not the browser, so it needs no CORS.
- Confirm `GET /api/products` returns the catalogue in the shape the storefront
  expects (the `window.MNACatalog` product fields). Keep `thumbFor` on the client
  (thumbnails are generated, not stored).

## Phase 3 - wire the static frontend to the backend (surgical)

- `assets/catalog.js`: replace the hardcoded `PRODUCTS` with an async load from
  `[BACKEND_URL]/api/products`, populating `window.MNACatalog.products` and
  keeping ALL existing helpers working. Provide an `MNACatalog.ready` promise the
  pages await before rendering. Keep the current static array as an offline
  fallback if the fetch fails.
- `cart.html`: replace the checkout submit that calls `S.orderUrl(customer)` with
  a `fetch('[BACKEND_URL]/api/payments/create', { method:'POST', ... })` sending
  `{ type:'order', channel: <retail|bulk by cart tiers>, customer,
  items: cart items as { productId, qty } }`, then redirect to the returned
  `paymentLink`. Remove or hide the WhatsApp checkout (client chose LeanX).
- Add `success.html` (static) that reads `?ref=` and polls
  `[BACKEND_URL]/api/payments/status?ref=...` to show paid/failed, with a link
  back to the shop. Set the backend `returnPath`/redirect to this page.
- Keep cart state in `window.MNAShop` (localStorage) as-is; only the checkout
  destination changes.

## Phase 4 - owner portal and dashboard

- These run on the Vercel backend (e.g. `[BACKEND_URL]/dashboard` and `/portal`,
  or an `admin.` subdomain). They already exist in the system. Replace the
  access-code gate with Supabase Auth and gate on an owner role. Keep the same
  protected routes (`/portal`, `/dashboard`, `/api/dashboard`, `/api/inventory`,
  `/api/products/manage`).
- The dashboard reflects every order (retail/bulk/owner) and booking, and manages
  inventory including the separate workshop-usage panel and add/edit product.

## Phase 5 - bookings (optional, if in scope now)

- The site's "Book a Diagnostic" currently goes to WhatsApp/contact. Optionally
  wire it to the backend booking flow (`/api/payments/create` with
  `type:'booking'`) to take a deposit via LeanX, mirroring the parts checkout.

## Phase 6 - LeanX live

- Set `PAYMENTS_MODE=live`, `LEANX_AUTH_TOKEN`, `LEANX_COLLECTION_UUID`,
  `LEANX_API_HOST=https://api.leanx.io`, and `NEXT_PUBLIC_BASE_URL=[BACKEND_URL]`.
- Ensure `[BACKEND_URL]/api/payments/webhook` is reachable and registered with
  LeanX. Remove `/api/payments/simulate` and `/pay/[ref]` in production.

## Phase 7 - verify end to end (desktop and mobile)

1. Static shop loads the catalogue from Supabase; categories, search, featured,
   product pages, and stock all render from live data.
2. Cart applies wholesale pricing past `minWholesaleQty`.
3. Checkout creates an order on the backend and redirects to the LeanX link.
4. Paying confirms the order via webhook, decrements stock, and the new stock
   shows on the static shop after reload.
5. The order appears on the dashboard as retail or bulk.
6. Sales portal builds an order, produces a shareable link; paying shows as
   owner-channel.
7. Inventory add/edit product and workshop usage work; workshop usage is separate
   from sales.
8. Owner pages and owner APIs reject unauthenticated access.
9. CORS works from the real frontend origin; no mixed-content or CORS errors.

## Report back

- Supabase migration status (schema extended, catalogue seeded from catalog.js,
  RLS).
- Backend deploy URL and CORS config.
- The exact frontend edits (files and lines) in the bengkelgearbox repo.
- Whether LeanX is live or mock, and why.
- Result of each verification step.

Work in small, reviewable commits in each repo separately. Do not delete existing
storefront functionality without flagging it first.
