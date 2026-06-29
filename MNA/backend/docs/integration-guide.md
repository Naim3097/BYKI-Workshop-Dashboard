# Integration guide: applying this to the existing website

> Confirmed target (verified by cloning the repo, June 2026): the live site
> github.com/Naim3097/bengkelgearbox.my is a **static HTML + vanilla-JS site on
> GitHub Pages**, NOT Next.js. The agreed plan is: keep the static storefront,
> add this system as a **Vercel + Supabase backend** it calls, make Supabase the
> catalogue source of truth, and replace the WhatsApp checkout with LeanX. For the
> exact, tailored steps and hook points use **[integration-prompt.md](integration-prompt.md)**.
> The generic guidance below still applies to the backend and to any future
> Next.js target; the "not Next.js" section covers the static-site case.

This guide explains how to take the proven system and apply it to the existing
MNA Dynamic Torque website. The section
[If the existing site is not Next.js](#if-the-existing-site-is-not-nextjs) is the
relevant path for the confirmed static target.

## Decide the topology first

There are two clean ways to apply this. Pick one before copying anything.

### Option A - One app (storefront + owner area together)

Merge the storefront, booking, payments, and owner area into the existing Next.js
app. Simplest to operate; the owner area is a route group gated by auth.

### Option B - Two apps (recommended for the dashboard-as-app-widget plan)

- Keep the storefront + booking + payments in the existing site.
- Deploy the owner area (`portal`, `dashboard`, owner APIs) as a **separate app on
  a subdomain** (e.g. `admin.mna...`). This matches the plan to shortcut the
  dashboard into an app widget, and isolates owner code from the public site.
- Both apps talk to the **same Supabase database**.

The codebase is already structured for Option B: `app/(owner)` and its APIs
(`/api/dashboard`, `/api/inventory/*`, `/api/owner/*`) are self-contained, and the
shared logic lives in `lib/`. To split, move `app/(owner)`, the owner APIs, and
`lib/` into the second app; the payment webhook can live in either app as long as
it writes to the shared database.

## What to port

| Area | Files | Notes |
|---|---|---|
| Domain types | `lib/types.ts` | Keep as-is |
| Data access | `lib/store.ts` | Replace bodies with Supabase ([migration](supabase-migration.md)) |
| Labels/seed | `lib/labels.ts`, `lib/seed.ts` | Seed becomes SQL inserts |
| Formatting | `lib/format.ts` | Keep |
| Payments | `lib/leanx.ts`, `lib/payments.ts` | Keep; set env for live |
| Payment APIs | `app/api/payments/*` | Keep; remove `simulate` in prod |
| Inventory/dashboard APIs | `app/api/inventory/*`, `app/api/dashboard`, `app/api/products/manage` | Keep (gated) |
| Storefront | `app/(shop)/*`, `components/ProductCard.tsx`, `components/CartProvider.tsx`, `components/SiteHeader.tsx` | Reconcile with existing site chrome |
| Owner area | `app/(owner)/*`, `components/OwnerNav.tsx`, `components/dashboard/*` | Keep |
| Shared UI | `components/ui.tsx`, `components/CustomerFields.tsx` | Keep |
| Auth gate | `middleware.ts`, `app/owner-login`, `app/api/owner/login` | Replace with Supabase Auth |
| Schema | `supabase/schema.sql` | Run in Supabase |

## Step-by-step (Option A, existing Next.js app)

1. **Tailwind**: merge `tailwind.config.ts` `theme.extend` (colors `ink`, `line`,
   `surface`, `canvas`, `brand`, etc., and `borderRadius.card`, `maxWidth.page`)
   into the existing config. Merge the `@layer components` block from
   `app/globals.css` (the `.btn`, `.input`, `.card`, `.badge`, `.container-page`
   classes) into the existing global stylesheet. If the existing site uses a
   different design system, see [UX guidelines](ux-guidelines.md) for the tokens
   to remap.

2. **Libraries**: copy `lib/` in. Then follow
   [Supabase migration](supabase-migration.md) to rewrite `lib/store.ts`.

3. **API routes**: copy `app/api/payments/*`, `app/api/inventory/*`,
   `app/api/dashboard`, `app/api/owner/*`. If the existing app already has an
   `app/api`, just drop these folders alongside.

4. **Storefront**: copy `app/(shop)/*`. If the existing site already has a home
   page at `/`, decide whether the parts shop lives at `/` or under `/shop`. To
   move it, rename the route group folder contents accordingly (e.g. put the
   storefront under `app/shop/`). Reconcile `SiteHeader` with the existing
   navigation - either keep ours or wire the cart count into the existing header
   using `useCart()`.

5. **Cart**: `CartProvider` must wrap any route that uses `useCart()`
   (storefront, cart, checkout, the header). In the mockup this is the
   `(shop)/layout.tsx`. In the existing site, wrap the relevant subtree (or the
   root layout) with `CartProvider`.

6. **Owner area**: copy `app/(owner)/*` and `components/dashboard/*`.

7. **Auth**: replace the access-code gate. See [Replacing the auth gate](#replacing-the-auth-gate).

8. **Env**: set the variables from [Configuration](configuration.md).

9. **Webhook**: ensure `https://<domain>/api/payments/webhook` is reachable and
   register/confirm it with LeanX.

10. **Verify**: run the end-to-end checklist below.

## Replacing the auth gate

The mockup uses a cookie set after an access code matches, enforced by
`middleware.ts` on `/portal`, `/dashboard`, `/api/dashboard`, `/api/inventory`,
and `/api/products/manage`.

To use Supabase Auth:

1. Add Supabase Auth (email/password or magic link) and the
   `@supabase/ssr` helpers.
2. In `middleware.ts`, replace the `owner_session === 'ok'` check with a Supabase
   session check, and gate on a role/claim that marks the owner (e.g. an
   `is_owner` flag in a `profiles` table or a custom JWT claim).
3. Replace `app/owner-login` with the Supabase sign-in UI and remove
   `app/api/owner/login`.

Keep the same `matcher` list so the same routes stay protected.

## Routing and collision checklist

- `/` - the storefront. Move under `/shop` if the existing home page must stay.
- `/cart`, `/checkout`, `/book`, `/result` - public. Rename if they clash.
- `/pay/[ref]` - mock only; remove in production.
- `/portal`, `/dashboard`, `/owner-login` - owner. In Option B these live on the
  subdomain app instead.
- `/api/payments/*`, `/api/inventory/*`, `/api/dashboard`, `/api/products`,
  `/api/products/manage`, `/api/owner/*` - ensure no existing routes share these
  paths.

## If the existing site is not Next.js

The browser-facing pages are React/Next-specific, but the **system** is portable:

- The data model (`supabase/schema.sql`) and the LeanX flow are framework-neutral.
- Re-implement three server endpoints in the host stack: create-bill (port
  `app/api/payments/create`), webhook (port `app/api/payments/webhook` +
  `lib/payments.ts`), and status. The LeanX request/response contract is in
  [Payments](payments-leanx.md).
- The storefront/portal/dashboard UI can be rebuilt in the host's templating, or
  the owner area can be deployed as the separate Next.js app (Option B) while the
  public site stays as-is.

## End-to-end verification checklist

After integrating, confirm:

1. Storefront lists products with retail and bulk prices; raising quantity past
   `bulkMinQty` switches the line to bulk pricing.
2. Checkout creates an order and redirects to the payment link.
3. Paying confirms the order (webhook), and stock decrements by the sold
   quantities.
4. Booking takes a deposit and appears on the dashboard.
5. Sales portal creates an owner-channel order and produces a shareable link;
   paying it shows on the dashboard.
6. Inventory "Use in workshop" reduces stock and appears in the Workshop usage
   panel, separate from sales.
7. Owner pages and owner APIs reject unauthenticated access.
8. Layout is clean on mobile and desktop.
