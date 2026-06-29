# Adding a new workshop

A workshop = a thin app under `apps/` + a `workshops` row + product seed + env.
All behaviour comes from `@byki/core`. Budget ~30 minutes.

## 1. Create the app

Copy `apps/overhaulinyard` to `apps/<workshop>` and change only the per-workshop
parts:

- `package.json` → `"name": "<workshop>"`.
- `src/config/workshop.ts` → the `WorkshopConfig` (id, slug, services, slots).
- `src/lib/site-config.ts` → branding + copy (name, colours, hero, contact).
- `src/app/globals.css` → `--accent` and brand variables.
- `public/` → the workshop's images (logo, hero, product photos).

The pages, API routes, diagnose, commerce, and dashboard are unchanged — they
all live in `@byki/core`.

## 2. Register the workshop in Supabase

In the shared Supabase project, insert a `workshops` row (use a fresh UUID) and
seed products. Copy `supabase/seed/overhaulinyard.sql` to
`supabase/seed/<workshop>.sql`, change the ids/slug/products, and run it.

```sql
insert into workshops (id, slug, name, leanx_collection_uuid)
values ('<uuid>', '<slug>', '<Name>', '<leanx-collection-uuid-or-null>');
```

## 3. Create the owner account

1. Supabase → Authentication → add the owner user (email + password).
2. Map them to the workshop:

```sql
insert into profiles (id, workshop_id, role, full_name)
values ('<auth-user-uuid>', '<workshop-uuid>', 'owner', 'Owner Name');
```

## 4. Environment (`.env.local`, see `.env.local.example`)

```
NEXT_PUBLIC_WORKSHOP_ID=<workshop-uuid>
NEXT_PUBLIC_WORKSHOP_SLUG=<slug>
NEXT_PUBLIC_SUPABASE_URL=...           # shared project
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PAYMENTS_MODE=mock                     # or 'live'
LEANX_AUTH_TOKEN=...                   # platform secret (live only)
LEANX_COLLECTION_UUID=...              # this workshop's UUID (or set in workshops row)
```

## 5. Run / deploy

```
pnpm --filter <workshop> dev        # local
pnpm --filter <workshop> build      # production
```

Deploy each app as its own Vercel project + domain, all pointing at the **shared
Supabase project**. Set `PAYMENTS_MODE=live` + the LeanX credentials when ready;
the mock `/pay/[ref]` simulator is for development only.

## 6. Smoke test

- The workshop's product(s) render inline on the landing page `/`.
- Add to cart → cart drawer → checkout → mock pay → order confirmed, stock decremented, shows in `/dashboard`.
- In `/dashboard` → Inventory: "Add product", "Add stock", and "Use in workshop" all work.
- Booking → deposit → confirmed in `/dashboard`.
- `/dashboard` rejects unauthenticated and cross-workshop access.
