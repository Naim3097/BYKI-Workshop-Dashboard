# The Workshop Platform Standard

Every car-workshop site (landing + diagnose + commerce) is built the same way so
that all of them can feed one central **BYKI** dashboard. Frontends differ per
workshop; the **backend, schema, and API contracts are identical**.

## Monorepo layout

```
workshop-commerce-platform/
  packages/
    config/        @byki/config   — shared tsconfig base + Tailwind v4 preset
    core/          @byki/core      — ALL shared backend, diagnose, admin, UI
  apps/
    overhaulinyard/                — reference workshop app (thin; consumes core)
    <next-workshop>/               — same shape
  supabase/
    migrations/    0001_init.sql, 0002_stock_fn.sql  — canonical schema (all workshops)
    seed/          <workshop>.sql                     — per-workshop workshops row + products
  docs/
```

Tooling: **pnpm workspaces + Turborepo**. Run `pnpm install` at the root.
Per app: `pnpm --filter <app> dev | build | typecheck`.

## Standard tech stack

Next.js 15.3+ (App Router) · React 19 · TypeScript 5.8 · Tailwind v4 ·
`@supabase/supabase-js` + `@supabase/ssr` · `zustand` · `date-fns` ·
`@types/web-bluetooth`. Apps consume `@byki/core` via `transpilePackages`.

## What lives in `@byki/core`

| Subpath | Purpose | Side |
|---|---|---|
| `@byki/core/types` | domain types (mirror the DB) | any |
| `@byki/core/config` | `WorkshopConfig`, `getWorkshopId()` | any |
| `@byki/core/supabase/client` | anon browser client (public reads, diagnose log) | client |
| `@byki/core/supabase/admin` | service-role client (bypasses RLS) | server |
| `@byki/core/db` | workshop-scoped data layer (products, inventory, orders, bookings, diagnose) | server |
| `@byki/core/payments` | LeanX (mock + live) + order/booking flow + webhook/status | server |
| `@byki/core/commerce` | server pricing (`pricing`) + client cart store (`useCart`) + single-page UI (`ProductGrid`, `CartButton`, `CartDrawer`) | mixed |
| `@byki/core/diagnose/obd` | real OBD2 Web Bluetooth scanning | client |
| `@byki/core/diagnose/cvt-sim` | CVT simulation engine | client |
| `@byki/core/diagnose` | shared result types + `logDiagnoseSession` | mixed |
| `@byki/core/auth` | Supabase Auth + workshop/role scoping | server |
| `@byki/core/auth/client` | browser auth (login form) | client |
| `@byki/core/auth/middleware` | route-guard middleware factory | edge |
| `@byki/core/admin` | `OwnerDashboard` component | client |
| `@byki/core/admin/handlers` | dashboard data + admin actions | server |
| `@byki/core/ui` | shared primitives (`Button`, `Card`, `Badge`, `formatMYR`) | client |

## Hard rules (carried from the MNA integration mandate)

1. The charged amount is **always recomputed server-side** from the catalogue
   (`commerce/pricing.buildCart`). Never trust client prices.
2. Stock only changes through **movements** (`db.recordMovement` → atomic
   `apply_stock_movement`), and only on a successful payment webhook
   (guarded by `orders.stock_applied`). `workshop_use` stays a separate movement type.
3. LeanX secrets live **server-side only**. The per-workshop collection UUID comes
   from env `LEANX_COLLECTION_UUID` or the `workshops` row; the merchant
   `LEANX_AUTH_TOKEN` is a platform env secret.
4. Orders and bookings are created **server-side** (service role) in the payment
   flow — never inserted from the browser.

## Buyer experience = ONE page

The buyer never leaves the landing page. Products are shown inline
(`<ProductGrid/>`), the cart is a slide-over (`<CartDrawer/>` mounted in the
layout, opened by `<CartButton/>` in the header), and checkout/payment happen
inside the drawer. There are **no** `/shop`, `/shop/[slug]`, `/cart`, or
`/checkout` routes — only the post-payment return pages (`/shop/success`,
`/booking/success`).

## Standard API routes (every app)

| Route | Calls into core | Auth |
|---|---|---|
| `POST /api/create-payment` | `createOrderPayment` / `createBookingPayment` | public |
| `POST /api/payment-webhook` | `handlePaymentWebhook` (confirm + decrement stock) | LeanX |
| `GET  /api/check-payment-status?ref=` | `refreshPaymentStatus` | public |
| `GET  /api/catalog` | public catalogue for the cart drawer | public |
| `/pay/[ref]` | mock LeanX simulator (mock mode only) | public |
| `POST/PATCH /api/admin/products` | `createProduct` / `updateProductDetails` | owner/byki_admin |
| `POST /api/admin/inventory` | `recordMovement` (restock / workshop_use / adjustment) | owner/byki_admin |

`/dashboard` + `/api/admin/*` are gated by the auth middleware and
`requireWorkshopAccess` (owner/staff scoped to their workshop; `byki_admin` any).

## Diagnose

Two engines, both standard:
- **OBD** (`diagnose/obd`) — real DTC reading over Web Bluetooth (Chrome/Android).
- **CVT sim** (`diagnose/cvt-sim`) — in-browser CVT simulation/analysis.

Both call `logDiagnoseSession({ source, faultCodes, ... })` → a `diagnose_sessions`
row, and fault codes flow into the booking form.

See [ADDING-A-WORKSHOP.md](ADDING-A-WORKSHOP.md) and
[BYKI-INTEGRATION.md](BYKI-INTEGRATION.md).
