# MNA Dynamic Torque - Commerce System (Mockup)

A proof-of-concept commerce system for vehicle spare parts. It demonstrates the
full flow end to end so it can later be applied to the live website.

Built with Next.js 15 (App Router), React 19, TypeScript and Tailwind. Data runs
on a file-backed store for the mockup and is structured to swap to Supabase with
minimal changes. Payments use the LeanX flow proven in the One X Transmission
project, with a built-in simulator standing in until the live LeanX UUID is set.

## Documentation

Full documentation for understanding and porting the system lives in [docs/](docs/README.md):

- [Architecture](docs/architecture.md) - modules, routes, file map, data flow
- [Data model](docs/data-model.md) - entities, fields, relationships, seed data
- [Payments (LeanX)](docs/payments-leanx.md) - gateway flow, mock vs live, webhook
- [API reference](docs/api-reference.md) - every endpoint
- [Inventory](docs/inventory.md) - stock movements and workshop-usage rule
- [Configuration](docs/configuration.md) - environment variables
- [Supabase migration](docs/supabase-migration.md) - swapping the file store
- [Integration guide](docs/integration-guide.md) - applying this to the existing website
- [UX guidelines](docs/ux-guidelines.md) - design tokens and conventions

## What it covers

- Storefront with retail and bulk pricing. Bulk pricing applies automatically
  once a part's bulk quantity is reached.
- Cart and self-serve checkout (retail and bulk) that creates a LeanX payment.
- Service / inspection booking with a deposit paid up front.
- Sales portal (owner only): build an order or booking for a buyer and generate
  a payment link to share by copy or WhatsApp.
- Owner dashboard (owner only): every transaction across all channels, plus
  inventory management.
- Inventory: each change is a recorded movement (restock, sale, workshop use).
  Stock used by the owner's own workshop has its own distinct panel so it is
  never hidden inside sales.

## Running it

```
npm install
npm run dev
```

Then open http://localhost:3000

- Shop: `/`
- Book a service: `/book`
- Owner login: `/owner-login` (access code in `.env.local`, default `mna-owner`)
- Sales portal: `/portal`
- Dashboard: `/dashboard`

The owner areas are gated by a simple access code for the mockup. The footer of
the shop links to the owner area.

## Demonstrating the full flow

1. Add parts to the cart (raise quantity past the bulk threshold to see bulk
   pricing), check out, and pay on the simulated gateway.
2. Open the dashboard: the order appears, and on success the sold quantities are
   deducted from inventory.
3. In the dashboard inventory tab, use a part in the workshop. It appears in the
   separate Workshop usage panel and reduces stock.
4. In the sales portal, build an order for a buyer, create a payment link, open
   it, and pay. It shows on the dashboard as an owner-channel transaction.

## Payments: mock to live

The mockup uses a built-in simulator. To go live with LeanX, set these in
`.env.local` and no code changes are needed:

```
PAYMENTS_MODE=live
LEANX_AUTH_TOKEN=...        # provided by client
LEANX_COLLECTION_UUID=...   # provided by client (pending)
LEANX_API_HOST=https://api.leanx.io
NEXT_PUBLIC_BASE_URL=https://your-deployed-domain
```

The integration matches the One X Transmission project:
`POST /api/v1/merchant/create-bill-page` returns the payment link;
`/api/payments/webhook` receives the callback and confirms the order.

## Moving to Supabase

`supabase/schema.sql` creates tables that mirror the TypeScript types in
`lib/types.ts`. The data access functions live in `lib/store.ts`; replacing their
bodies with Supabase queries (and setting the Supabase env vars) switches the
backend without touching the UI or API routes.

## Notes for production

- Replace the access-code gate with Supabase Auth.
- Add Row Level Security policies before exposing Supabase.
- The dashboard can be split onto its own subdomain (it is already an isolated
  route group, `app/(owner)`).
