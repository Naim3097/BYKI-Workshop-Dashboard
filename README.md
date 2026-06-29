# Workshop Commerce Platform

A standardized platform for building car-workshop sites — **landing page +
diagnose + commerce** — that all feed one central **BYKI** dashboard.

Each workshop gets its own frontend, but every workshop shares the **same
backend, database schema, and API contracts**. Shared logic lives once in
`@byki/core`; an app only supplies its branding, config, and product seed.

## Structure

```
packages/core      @byki/core  — shared backend, diagnose engines, admin, UI
packages/config    @byki/config — shared tsconfig + Tailwind preset
apps/overhaulinyard            — reference workshop (landing + diagnose + commerce)
apps/mna                       — MNA Dynamic Torque (CVT/transmission parts + CVT simulator)
supabase/          migrations + per-workshop seeds (one shared multi-tenant DB)
docs/              the standard, how to add a workshop, BYKI contract
```

## Quick start

```bash
pnpm install
# apply supabase/migrations/*.sql + a seed to your Supabase project
cp apps/overhaulinyard/.env.local.example apps/overhaulinyard/.env.local   # fill in
pnpm --filter overhaulinyard dev
```

## Docs

- **[docs/STANDARD.md](docs/STANDARD.md)** — the architecture, stack, and rules every workshop follows.
- **[docs/ADDING-A-WORKSHOP.md](docs/ADDING-A-WORKSHOP.md)** — spin up a new workshop in ~30 min.
- **[docs/BYKI-INTEGRATION.md](docs/BYKI-INTEGRATION.md)** — the multi-tenant contract BYKI reads.

## Highlights

- **One Supabase project, multi-tenant** — every row carries `workshop_id`,
  isolated by RLS; BYKI reads all workshops from one DB.
- **Full commerce** — products, inventory, stock movements, orders, order items,
  bookings — applied to every workshop.
- **LeanX payments** — per-workshop collection UUID, server-side amount recompute,
  mock simulator for local dev.
- **Two diagnose engines** — real OBD2 (Web Bluetooth) **and** the CVT simulation,
  both recording `diagnose_sessions` and feeding bookings.
- **Owner dashboard** — Supabase Auth, workshop-scoped (`owner`/`staff`), with a
  `byki_admin` super-admin role for BYKI.

> Both **Overhaulinyard** and **MNA** now run on the standard (`apps/*` on
> `@byki/core`, one shared Supabase project). MNA's CVT simulator is preserved
> verbatim as a static page at `/sim/`. The old root `backend/` + `storefront/`
> are the original MNA template, kept for reference only.
