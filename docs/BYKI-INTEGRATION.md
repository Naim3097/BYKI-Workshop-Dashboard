# BYKI integration contract

BYKI is the central dashboard that oversees the performance of **every** workshop
built on this platform. This document is the contract that makes that possible.
(The BYKI dashboard app itself is out of scope here; the schema + roles below make
it a straight read.)

## One database, multi-tenant

All workshops share **one Supabase project**. Every domain row carries a
`workshop_id` and is isolated by Row Level Security. BYKI therefore reads one
database to see all workshops — no per-workshop connections to fan out across.

Tenanted tables (all have `workshop_id`): `products`, `inventory`,
`stock_movements`, `orders`, `order_items`, `bookings`, `diagnose_sessions`.
Tenant root: `workshops`. Identity/roles: `profiles`.

## Roles (`profiles.role`)

| Role | Scope |
|---|---|
| `owner` / `staff` | their own `workshop_id` only (enforced by RLS) |
| `byki_admin` | **cross-workshop** read on every table (`public.is_byki_admin()`) |

Create a BYKI super-admin:

```sql
insert into profiles (id, workshop_id, role, full_name)
values ('<byki-auth-user-uuid>', null, 'byki_admin', 'BYKI Admin');
```

Authenticated as a `byki_admin`, the existing RLS `select` policies already return
rows across all workshops — no schema changes needed.

## Metrics BYKI can derive (per workshop, via `workshop_id`)

- **Revenue** — `orders` + `bookings` where `payment_status = 'SUCCESS'`, summed by `amount`.
- **Pipeline** — counts by `status` (`pending_payment`, `paid`/`confirmed`, `cancelled`, `fulfilled`/`completed`).
- **Inventory health** — `inventory.stock_qty` vs `reorder_level`; consumption via `stock_movements` (`sale` vs `workshop_use`).
- **Bookings** — volume, services, slots, lead time (`preferred_date` − `created_at`).
- **Diagnose activity** — `diagnose_sessions` by `source` (`obd` / `cvt_sim`) and fault-code frequency.

These mirror the per-workshop owner dashboard (`@byki/core/admin`); BYKI is the
same data aggregated across `workshop_id`.

## Stable contracts BYKI relies on

- **Enums** are fixed platform-wide (payment/order/booking status, movement type,
  product kind, diagnose source) — see `supabase/migrations/0001_init.sql`.
- **Invoice refs**: `ORDER-<short>` / `BOOKING-<short>`; tenancy is the
  `workshop_id` column, never the ref string.
- **Money** is MYR `numeric(10,2)`.
- Schema changes are **additive** and shipped as new `supabase/migrations/*.sql`
  applied to the shared project, so every workshop and BYKI move in lockstep.

## Provisioning a workshop (BYKI's job, eventually)

Insert a `workshops` row (+ `leanx_collection_uuid`), seed products, create the
owner `profiles` row. The workshop app only needs `NEXT_PUBLIC_WORKSHOP_ID` to
come online. See [ADDING-A-WORKSHOP.md](ADDING-A-WORKSHOP.md).
