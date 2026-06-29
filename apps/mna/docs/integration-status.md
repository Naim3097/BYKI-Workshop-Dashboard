# Integration status (bengkelgearbox.my)

Live progress on connecting the static storefront to this backend. Confirmed
architecture: static site stays on GitHub Pages; this Next.js app is the backend
on Vercel + Supabase; Supabase is the catalogue source of truth; checkout uses
LeanX.

## Done and verified locally

Verified end to end with the static site (Node static server on :5190) calling
the backend (:3000) in mock payment mode:

- Backend serves the real curated catalogue (21 products) imported from the
  static `assets/catalog.js` via `scripts/import-catalog.mjs`.
- New endpoint `GET /api/catalog` returns the exact storefront shape, CORS-enabled.
- Backend product model + `supabase/schema.sql` extended to the richer storefront
  fields (slug, specifications, compatible vehicles/gearboxes, tags, featured,
  wholesale pricing). `supabase/seed.sql` generated from the catalogue.
- Static frontend wired (surgical edits, still no build step):
  - `assets/catalog.js` loads the live catalogue from the backend, falls back to
    the bundled data offline, exposes `MNACatalog.ready` and `backendUrl`.
  - `index.html`, `shop.html`, `product.html` render after the catalogue loads.
  - `cart.html` checkout now collects email and pays via LeanX
    (`POST /api/payments/create`), replacing the WhatsApp order.
  - `success.html` added; buyers return here and it polls payment status.
- `/api/payments/create` accepts an absolute `returnUrl` and CORS preflight; the
  mock simulator returns the buyer to the static success page.
- Verified flow: add to cart (wholesale pricing applied) → checkout →
  payment → success page → order shows as paid on the backend and stock
  decremented (c1: 12 to 9).

## Remaining to go to production

1. Create the Supabase project; run `supabase/schema.sql` then `supabase/seed.sql`.
   Rewrite `lib/store.ts` against Supabase (see supabase-migration.md).
2. Deploy the backend to Vercel. Set env (configuration.md), including
   `NEXT_PUBLIC_BASE_URL` = the Vercel URL and `ALLOWED_ORIGIN` =
   `https://bengkelgearbox.my`.
3. In `assets/catalog.js`, set `BACKEND_URL` (or `window.MNA_BACKEND_URL`) to the
   Vercel URL. Commit and let GitHub Pages publish.
4. Add LeanX credentials and set `PAYMENTS_MODE=live`. Register the webhook URL
   `<backend>/api/payments/webhook` with LeanX. Remove the mock simulator
   (`/pay/[ref]`, `/api/payments/simulate`) for production.
5. Replace the owner access-code gate with Supabase Auth.
6. Optional: wire the site's "Book a Diagnostic" to the booking deposit flow.

## How to re-run the local test

```
# backend
npm run dev                      # http://localhost:3000 (PAYMENTS_MODE=mock)

# static site (separate shell)
node scripts/static-server.mjs ../bengkelgearbox 5190
# open http://localhost:5190/shop.html
```

Re-import the catalogue after the static catalogue changes:
```
node scripts/import-catalog.mjs
```
