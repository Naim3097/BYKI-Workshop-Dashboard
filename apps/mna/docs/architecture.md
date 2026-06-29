# Architecture

## Overview

The system is a single Next.js App Router application split into two areas by
route group:

- `app/(shop)` - the public storefront and customer flows.
- `app/(owner)` - the owner-only portal and dashboard.

Both areas share one backend made of API route handlers under `app/api`, a single
data-access layer in `lib/store.ts`, and a payment layer in `lib/leanx.ts` +
`lib/payments.ts`.

The two areas are deliberately isolated. The owner area can later be split onto
its own subdomain (for the app-widget shortcut) by moving `app/(owner)` and its
APIs into a separate deployment that talks to the same database.

```
                    Public customers                 Owner
                          |                            |
                   app/(shop)/*                  app/(owner)/*
                   /, /cart, /checkout,          /portal, /dashboard
                   /book, /result, /pay/[ref]    (gated by middleware)
                          |                            |
                          +------------+---------------+
                                       |
                                  app/api/*            <- route handlers
                                       |
                        lib/leanx.ts + lib/payments.ts <- payment logic
                                       |
                                  lib/store.ts         <- data access (swap to Supabase)
                                       |
                          .data/store.json  (mockup)  /  Supabase (production)
```

## Modules

| Module | Public/Owner | Entry route | Key files |
|---|---|---|---|
| Storefront | Public | `/` | `app/(shop)/page.tsx`, `components/ProductCard.tsx` |
| Cart | Public | `/cart` | `app/(shop)/cart/page.tsx`, `components/CartProvider.tsx` |
| Checkout | Public | `/checkout` | `app/(shop)/checkout/page.tsx` |
| Service booking | Public | `/book` | `app/(shop)/book/page.tsx` |
| Payment result | Public | `/result` | `app/(shop)/result/page.tsx` |
| Payment simulator | Public (mock only) | `/pay/[ref]` | `app/pay/[ref]/page.tsx` |
| Owner login | - | `/owner-login` | `app/owner-login/page.tsx` |
| Sales portal | Owner | `/portal` | `app/(owner)/portal/page.tsx` |
| Dashboard | Owner | `/dashboard` | `app/(owner)/dashboard/page.tsx`, `components/dashboard/*` |

## Full file map

### App routes

```
app/
  layout.tsx                      Root layout (html/body, metadata)
  globals.css                     Tailwind layers + component classes
  (shop)/
    layout.tsx                    CartProvider + SiteHeader + footer
    page.tsx                      Storefront (product grid, category filter)
    cart/page.tsx                 Cart
    checkout/page.tsx             Customer details + pay
    book/page.tsx                 Service booking + deposit
    result/page.tsx               Post-payment result (polls status)
  pay/[ref]/page.tsx              Simulated LeanX bill page (mock mode only)
  owner-login/page.tsx           Owner access-code login
  (owner)/
    layout.tsx                    OwnerNav
    portal/page.tsx               Build order/booking, generate payment link
    dashboard/page.tsx            KPIs + transactions + inventory + bookings
  api/
    products/route.ts             GET active products with stock
    products/manage/route.ts      POST create / PUT update product (gated)
    dashboard/route.ts            GET aggregate dashboard data (gated)
    inventory/restock/route.ts    POST add stock (gated)
    inventory/workshop-use/route.ts POST consume stock for workshop (gated)
    owner/login/route.ts          POST/DELETE owner session cookie
    payments/create/route.ts      POST create order/booking + LeanX bill
    payments/webhook/route.ts     POST LeanX callback; GET health
    payments/simulate/route.ts    POST drive mock payment result (mock only)
    payments/status/route.ts      GET latest status for a reference
```

### Libraries

```
lib/
  types.ts        Domain types mirroring the Supabase tables
  labels.ts       Display labels + service deposits + time slots
  seed.ts         Mock catalogue and starting inventory
  store.ts        Data-access layer (the only file that touches storage)
  format.ts       MYR currency and date formatting
  leanx.ts        Create-bill (mock + live), validators, mode switch
  payments.ts     applyPaymentResult: confirm + stock decrement (shared)
middleware.ts     Gate for owner pages and their data APIs
supabase/
  schema.sql      Production schema mirroring lib/types.ts
```

### Components

```
components/
  CartProvider.tsx       Cart context (localStorage), pricing-tier helpers
  SiteHeader.tsx         Public header with cart count
  OwnerNav.tsx           Owner header with sign-out
  ProductCard.tsx        Storefront product card with quantity + pricing
  CustomerFields.tsx     Reusable name/email/phone fieldset
  ui.tsx                 StatusBadge, PaymentBadge, StockBadge, SectionTitle
  dashboard/
    types.ts             DashboardData type
    Kpis.tsx             Revenue, pending, workshop value, low stock
    TransactionsPanel.tsx Unified orders + bookings table with channel filter
    InventoryPanel.tsx   Stock table + actions + distinct workshop-usage panel
    ProductFormModal.tsx Add / edit product form (create + update)
    BookingsPanel.tsx    Bookings table
```

## Request flow: a self-serve purchase

```
Customer (browser)                 Server                         Storage
------------------                 ------                         -------
Add to cart (localStorage)
Checkout: POST /api/payments/create
                                   validate customer
                                   recompute prices from catalogue
                                   create Order (pending_payment)
                                   leanx.createBill()
                                     mock: link to /pay/[ref]
                                     live: call LeanX create-bill-page
                                   persist order ------------------> write
   <-- { paymentLink }
redirect to paymentLink
(pay on gateway)
                                   POST /api/payments/webhook  (or simulate)
                                   applyPaymentResult():
                                     order -> paid
                                     record sale movements ------> write
                                     decrement stock
redirect to /result?ref=...
GET /api/payments/status (poll) -> read order ------------------> read
   <-- SUCCESS
```

## Why prices are recomputed server-side

`/api/payments/create` ignores any price sent from the client. It looks up each
product in the catalogue and applies retail or bulk pricing based on the
quantity against `bulkMinQty`. The cart and portal compute the same numbers for
display, but the server is the source of truth for the amount charged.

## Data-access boundary

Only `lib/store.ts` reads or writes storage. Every API route and server
component calls store functions; no component imports `fs` or a database client
directly. This is what makes the Supabase swap a single-file change. See
[Supabase migration](supabase-migration.md).
