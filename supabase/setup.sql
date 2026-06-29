-- ============================================================================
-- BYKI Workshop Platform — ONE-SHOT SETUP
-- Paste this whole file into the Supabase SQL Editor and Run, ONCE per project.
-- It applies: 0001 schema+RLS, 0002 stock function, and the Overhaulinyard seed.
-- After running, create the owner login (see the final section of this file).
-- (Source of truth = migrations/*.sql + seed/*.sql; this is a convenience bundle.)
-- ============================================================================

-- ▼▼▼ 1/3 — migrations/0001_init.sql ▼▼▼
-- ============================================================================
-- BYKI Workshop Platform — canonical multi-tenant schema
-- ----------------------------------------------------------------------------
-- ONE Supabase project serves EVERY workshop. Every domain row carries a
-- workshop_id, isolated by Row Level Security, so a central BYKI dashboard can
-- read across all workshops from a single database.
--
-- Roles (see public.profiles.role):
--   owner / staff  -> scoped to their own workshop_id
--   byki_admin     -> cross-workshop super-admin (read everything)
--
-- Apply once per environment in the Supabase SQL editor (or via the Supabase
-- CLI). Idempotent-ish: uses `if not exists` where Postgres allows it.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type product_kind   as enum ('service', 'device', 'part');
exception when duplicate_object then null; end $$;

do $$ begin
  create type movement_type  as enum ('restock', 'sale', 'workshop_use', 'adjustment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_channel  as enum ('retail', 'bulk', 'owner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'SUCCESS', 'FAILED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status   as enum ('pending_payment', 'paid', 'cancelled', 'fulfilled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending_payment', 'confirmed', 'cancelled', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role      as enum ('owner', 'staff', 'byki_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type diagnose_source as enum ('obd', 'cvt_sim');
exception when duplicate_object then null; end $$;

-- ── Tenant root ─────────────────────────────────────────────────────────────
-- Per-workshop LeanX collection UUID lives here (the platform-level
-- LEANX_AUTH_TOKEN stays an env secret). Not readable by anon — the storefront
-- knows its own id via NEXT_PUBLIC_WORKSHOP_ID and never queries this table.
create table if not exists workshops (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text unique not null,
  name                   text not null,
  leanx_collection_uuid  text,
  settings               jsonb not null default '{}'::jsonb,
  active                 boolean not null default true,
  created_at             timestamptz not null default now()
);

-- ── Auth profile → workshop + role ──────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  workshop_id uuid references workshops(id) on delete cascade,
  role        user_role not null default 'staff',
  full_name   text not null default '',
  created_at  timestamptz not null default now()
);

-- ── RLS helper functions ────────────────────────────────────────────────────
-- SECURITY DEFINER so policies can read profiles without recursing into RLS.
create or replace function public.current_workshop_id()
returns uuid language sql stable security definer set search_path = public as $$
  select workshop_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_byki_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'byki_admin'
  );
$$;

-- ── Products ────────────────────────────────────────────────────────────────
-- pricing: price_retail is required. If price_bulk is set and qty >= bulk_min_qty
-- the bulk tier applies (MNA wholesale model); leave price_bulk null for a simple
-- single-price product (One X model). deposit_amount drives service bookings.
create table if not exists products (
  id                   uuid primary key default gen_random_uuid(),
  workshop_id          uuid not null references workshops(id) on delete cascade,
  slug                 text not null,
  sku                  text not null,
  kind                 product_kind not null default 'part',
  category             text not null default '',
  name                 text not null,
  description          text not null default '',
  short_description    text not null default '',
  image                text,
  price_retail         numeric(10,2) not null,
  price_bulk           numeric(10,2),
  bulk_min_qty         integer not null default 1,
  original_price       numeric(10,2),
  deposit_amount       numeric(10,2),
  specifications       jsonb not null default '{}'::jsonb,
  compatible_vehicles  text[] not null default array[]::text[],
  compatible_gearboxes text[] not null default array[]::text[],
  tags                 text[] not null default array[]::text[],
  in_stock             boolean not null default true,
  coming_soon          boolean not null default false,
  is_featured          boolean not null default false,
  active               boolean not null default true,
  created_at           timestamptz not null default now(),
  unique (workshop_id, sku),
  unique (workshop_id, slug)
);
create index if not exists products_workshop_idx on products (workshop_id);

-- ── Inventory (one row per product) ─────────────────────────────────────────
create table if not exists inventory (
  workshop_id   uuid not null references workshops(id) on delete cascade,
  product_id    uuid not null references products(id) on delete cascade,
  stock_qty     integer not null default 0,
  reorder_level integer not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (workshop_id, product_id)
);

-- ── Stock movements (ledger; workshop_use kept separate from sales) ─────────
create table if not exists stock_movements (
  id          uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  type        movement_type not null,
  qty         integer not null, -- positive restock, negative sale/workshop_use
  reference   text not null default '',
  note        text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists stock_movements_workshop_idx on stock_movements (workshop_id);
create index if not exists stock_movements_product_idx on stock_movements (product_id);

-- ── Orders ──────────────────────────────────────────────────────────────────
create table if not exists orders (
  id                     uuid primary key default gen_random_uuid(),
  workshop_id            uuid not null references workshops(id) on delete cascade,
  invoice_ref            text not null,
  channel                order_channel not null default 'retail',
  customer_name          text not null,
  customer_email         text not null,
  customer_phone         text not null,
  amount                 numeric(10,2) not null,
  status                 order_status not null default 'pending_payment',
  payment_status         payment_status not null default 'pending',
  leanx_bill_no          text,
  leanx_invoice_ref      text,
  payment_link           text,
  payment_provider       text,
  payment_method         text,
  payment_transaction_id text,
  stock_applied          boolean not null default false,
  created_at             timestamptz not null default now(),
  paid_at                timestamptz,
  unique (workshop_id, invoice_ref)
);
create index if not exists orders_workshop_idx on orders (workshop_id);
create index if not exists orders_status_idx on orders (status);

create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid not null references products(id),
  sku         text not null,
  name        text not null,
  unit_price  numeric(10,2) not null,
  qty         integer not null,
  pricing     text not null, -- 'retail' | 'bulk'
  line_total  numeric(10,2) not null
);
create index if not exists order_items_order_idx on order_items (order_id);

-- ── Bookings ────────────────────────────────────────────────────────────────
-- service_type is free text (each workshop defines its own services).
-- fault_codes carries diagnose results (OBD or CVT sim) into the booking.
create table if not exists bookings (
  id                     uuid primary key default gen_random_uuid(),
  workshop_id            uuid not null references workshops(id) on delete cascade,
  invoice_ref            text not null,
  service_type           text not null default '',
  customer_name          text not null,
  customer_email         text not null,
  customer_phone         text not null,
  vehicle_model          text not null default '',
  preferred_date         date,
  time_slot              text not null default '',
  amount                 numeric(10,2) not null,
  status                 booking_status not null default 'pending_payment',
  payment_status         payment_status not null default 'pending',
  leanx_bill_no          text,
  leanx_invoice_ref      text,
  payment_link           text,
  payment_provider       text,
  payment_method         text,
  payment_transaction_id text,
  fault_codes            text[] not null default array[]::text[],
  notes                  text not null default '',
  created_at             timestamptz not null default now(),
  paid_at                timestamptz,
  unique (workshop_id, invoice_ref)
);
create index if not exists bookings_workshop_idx on bookings (workshop_id);
create index if not exists bookings_status_idx on bookings (status);

-- ── Diagnose sessions (feeds booking + BYKI analytics) ──────────────────────
create table if not exists diagnose_sessions (
  id            uuid primary key default gen_random_uuid(),
  workshop_id   uuid not null references workshops(id) on delete cascade,
  booking_id    uuid references bookings(id) on delete set null,
  source        diagnose_source not null,
  vehicle_model text not null default '',
  fault_codes   text[] not null default array[]::text[],
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists diagnose_sessions_workshop_idx on diagnose_sessions (workshop_id);

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- The service-role key (used by API routes: create-payment, webhook, status,
-- admin) BYPASSES RLS entirely. Policies below govern the anon (public
-- storefront) and authenticated (owner/staff/byki_admin) roles only.
-- ============================================================================
alter table workshops        enable row level security;
alter table profiles         enable row level security;
alter table products         enable row level security;
alter table inventory        enable row level security;
alter table stock_movements  enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table bookings         enable row level security;
alter table diagnose_sessions enable row level security;

-- workshops: owners read their own; byki_admin reads all. (No anon access.)
create policy workshops_select on workshops for select to authenticated
  using (id = public.current_workshop_id() or public.is_byki_admin());

-- profiles: a user reads their own row; byki_admin reads all.
create policy profiles_select on profiles for select to authenticated
  using (id = auth.uid() or public.is_byki_admin());

-- products: PUBLIC catalogue — anyone may read active products (the storefront
-- filters by its own workshop_id). Owners manage their own workshop's products.
create policy products_public_read on products for select to anon, authenticated
  using (active = true or workshop_id = public.current_workshop_id() or public.is_byki_admin());
create policy products_owner_write on products for all to authenticated
  using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

-- inventory: public read (stock display); owners manage their own.
create policy inventory_public_read on inventory for select to anon, authenticated
  using (true);
create policy inventory_owner_write on inventory for all to authenticated
  using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

-- stock_movements: owners read/write their own; byki_admin reads all.
create policy movements_owner_all on stock_movements for all to authenticated
  using (workshop_id = public.current_workshop_id() or public.is_byki_admin())
  with check (workshop_id = public.current_workshop_id());

-- orders / order_items / bookings: owners read+update their own; byki_admin
-- reads all. Inserts happen server-side via the service role (price recomputed
-- there), so there is intentionally NO anon insert policy.
create policy orders_owner_rw on orders for select to authenticated
  using (workshop_id = public.current_workshop_id() or public.is_byki_admin());
create policy orders_owner_update on orders for update to authenticated
  using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

create policy order_items_owner_read on order_items for select to authenticated
  using (workshop_id = public.current_workshop_id() or public.is_byki_admin());

create policy bookings_owner_rw on bookings for select to authenticated
  using (workshop_id = public.current_workshop_id() or public.is_byki_admin());
create policy bookings_owner_update on bookings for update to authenticated
  using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

-- diagnose_sessions: the public scanner may log a session (no PII beyond codes +
-- vehicle); owners read their own; byki_admin reads all.
create policy diagnose_anon_insert on diagnose_sessions for insert to anon, authenticated
  with check (true);
create policy diagnose_owner_read on diagnose_sessions for select to authenticated
  using (workshop_id = public.current_workshop_id() or public.is_byki_admin());


-- ▼▼▼ 2/3 — migrations/0002_stock_fn.sql ▼▼▼
-- ============================================================================
-- apply_stock_movement — atomic ledger + on-hand adjustment in one statement.
-- Positive qty = restock; negative = sale / workshop_use / adjustment-down.
-- Stock is floored at 0. Upserts the inventory row if missing.
-- ============================================================================
create or replace function public.apply_stock_movement(
  p_workshop  uuid,
  p_product   uuid,
  p_type      movement_type,
  p_qty       integer,
  p_reference text default '',
  p_note      text default ''
)
returns stock_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_movement stock_movements;
begin
  insert into inventory (workshop_id, product_id, stock_qty, reorder_level, updated_at)
  values (p_workshop, p_product, greatest(0, p_qty), 0, now())
  on conflict (workshop_id, product_id) do update
    set stock_qty = greatest(0, inventory.stock_qty + p_qty),
        updated_at = now();

  insert into stock_movements (workshop_id, product_id, type, qty, reference, note)
  values (p_workshop, p_product, p_type, p_qty, coalesce(p_reference, ''), coalesce(p_note, ''))
  returning * into v_movement;

  return v_movement;
end;
$$;


-- ▼▼▼ 3/3 — seed/overhaulinyard.sql ▼▼▼
-- ============================================================================
-- Seed: Overhaul In Yard (reference workshop)
-- ----------------------------------------------------------------------------
-- Run AFTER 0001_init.sql. The workshop id below is fixed so the app can
-- reference it via NEXT_PUBLIC_WORKSHOP_ID without a lookup. Replace the LeanX
-- collection UUID with the workshop's real one (or leave null for mock mode).
--
-- Idempotent: re-running upserts the workshop, product, and inventory.
-- ============================================================================

insert into workshops (id, slug, name, leanx_collection_uuid, settings, active)
values (
  'a0000000-0000-4000-8000-000000000001',
  'overhaulinyard',
  'Overhaul In Yard',
  null, -- TODO: set the workshop's LeanX collection UUID
  jsonb_build_object(
    'currency', 'MYR',
    'locale', 'ms',
    'bookingFeeRM', 10
  ),
  true
)
on conflict (id) do update
  set slug = excluded.slug,
      name = excluded.name,
      settings = excluded.settings;

-- ── The one product for now: the OBD2 Diagnostic Device ──────────────────────
insert into products (
  id, workshop_id, slug, sku, kind, category, name, description, short_description,
  image, price_retail, price_bulk, bulk_min_qty, deposit_amount,
  tags, in_stock, coming_soon, is_featured, active
)
values (
  'b0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'obd2-diagnostic-device',
  'OBD2-BLE-001',
  'device',
  'diagnostic',
  'Peranti Diagnostik OBD2',
  'Pengimbas OBD2 plug-and-play yang bersambung ke telefon anda melalui Bluetooth. Baca kod ralat enjin dan transmisi, pantau data masa nyata, dan kesan masalah sebelum menjadi mahal. Serasi dengan semua kenderaan yang mematuhi OBD2 (1996+).',
  'Pengimbas OBD2 Bluetooth — baca kod dari telefon anda',
  '/products/obd2.png',
  50.00,
  null,
  1,
  null,
  array['obd2', 'bluetooth', 'diagnostic']::text[],
  true,
  false,
  true,
  true
)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      short_description = excluded.short_description,
      price_retail = excluded.price_retail,
      image = excluded.image,
      is_featured = excluded.is_featured;

insert into inventory (workshop_id, product_id, stock_qty, reorder_level)
values (
  'a0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  25,
  5
)
on conflict (workshop_id, product_id) do update
  set stock_qty = excluded.stock_qty,
      reorder_level = excluded.reorder_level,
      updated_at = now();

-- ── Owner account wiring (run after creating the auth user) ──────────────────
-- 1. Create the owner in Supabase Auth (Dashboard → Authentication → Add user).
-- 2. Map that user to this workshop with the owner role:
--
--   insert into profiles (id, workshop_id, role, full_name)
--   values ('<auth-user-uuid>', 'a0000000-0000-4000-8000-000000000001', 'owner', 'Owner');
--
-- For a BYKI super-admin, use role = 'byki_admin' and workshop_id = null.
