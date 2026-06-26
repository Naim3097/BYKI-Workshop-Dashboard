# MNA Dynamic Torque - System Documentation

This is the full documentation for the MNA Dynamic Torque commerce system. It is
written to support **porting the proven system onto the existing MNA website**,
not just running the mockup.

The system covers retail and bulk (B2B) parts commerce, owner-generated payment
links, service/inspection bookings, inventory with workshop-usage tracking, and
an owner dashboard. Payments use the LeanX gateway (the same flow proven in the
One X Transmission project), with a built-in simulator so everything works before
the live LeanX credentials exist.

## Read in this order

1. [Architecture](architecture.md) - modules, routes, file map, request/data flow.
2. [Data model](data-model.md) - entities, fields, relationships, seed data.
3. [Payments (LeanX)](payments-leanx.md) - the gateway flow, mock vs live, webhook.
4. [Inventory](inventory.md) - the stock movement model and workshop-usage rule.
5. [API reference](api-reference.md) - every endpoint with request/response.
6. [Configuration](configuration.md) - all environment variables.
7. [Supabase migration](supabase-migration.md) - swapping the file store for Supabase.
8. [Integration guide](integration-guide.md) - **applying this to the existing website**.
9. [UX guidelines](ux-guidelines.md) - design tokens, components, conventions.
10. [Integration prompt](integration-prompt.md) - copy-paste prompt for a coding agent to do the integration.
11. [Integration status](integration-status.md) - what is wired up so far and what remains for production.

## Quick facts

| Item | Value |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 3.4 |
| Data (mockup) | File-backed JSON store at `.data/store.json` |
| Data (production) | Supabase (schema in `supabase/schema.sql`) |
| Payments | LeanX (`leanx.io`), with mock simulator |
| Currency | MYR |
| Owner auth (mockup) | Access code gate, replaced by Supabase Auth |

## Run the mockup

```
npm install
npm run dev
```

Open http://localhost:3000. Owner login at `/owner-login` (access code `mna-owner`).

## Status of external dependencies

- **LeanX collection UUID**: not yet provided by the client. The system runs in
  `PAYMENTS_MODE=mock` until it is. See [Payments](payments-leanx.md).
- **Supabase project**: not yet created. The system runs on the file store until
  Supabase env vars are set. See [Supabase migration](supabase-migration.md).
