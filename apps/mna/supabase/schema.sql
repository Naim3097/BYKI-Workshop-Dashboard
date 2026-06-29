-- MNA Dynamic Torque - Supabase schema
-- This mirrors the TypeScript types in lib/types.ts. Run this in the Supabase
-- SQL editor when the live project is ready. The mockup runs on a file-backed
-- store until NEXT_PUBLIC_SUPABASE_URL and keys are set.

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ---------------------------------------------------------------------
-- Categories mirror the bengkelgearbox.my storefront catalogue.
create type product_category as enum
  ('cvt_belt', 'valve_body', 'torque_conv', 'clutch_plate', 'steel_plate',
   'auto_filter', 'forward_drum', 'oil_pump', 'piston_seal', 'overhaul_kit',
   'lubricants');

create type movement_type as enum
  ('restock', 'sale', 'workshop_use', 'adjustment');

create type order_channel as enum ('retail', 'bulk', 'owner');

create type payment_status as enum ('pending', 'SUCCESS', 'FAILED', 'CANCELLED');

create type order_status as enum
  ('pending_payment', 'paid', 'cancelled', 'fulfilled');

create type service_type as enum
  ('transmission_inspection', 'general_service', 'diagnostic', 'fluid_change');

-- Products ------------------------------------------------------------------
create table products (
  id                   text primary key,
  sku                  text unique not null,
  name                 text not null,
  slug                 text unique,
  category             product_category not null,
  brand                text not null default '',
  description          text not null default '',
  price_retail         numeric(10,2) not null, -- storefront: price
  price_bulk           numeric(10,2) not null, -- storefront: wholesalePrice
  bulk_min_qty         integer not null default 1, -- storefront: minWholesaleQty
  specifications       jsonb not null default '{}'::jsonb,
  compatible_vehicles  text[] not null default array[]::text[],
  compatible_gearboxes text[] not null default array[]::text[],
  tags                 text[] not null default array[]::text[],
  is_featured          boolean not null default false,
  active               boolean not null default true,
  created_at           timestamptz not null default now()
);

-- Inventory (one row per product) -------------------------------------------
create table inventory (
  product_id    text primary key references products(id) on delete cascade,
  stock_qty     integer not null default 0,
  reorder_level integer not null default 0,
  updated_at    timestamptz not null default now()
);

-- Stock movements -----------------------------------------------------------
-- Every change to stock_qty is recorded here. workshop_use rows are how own-shop
-- consumption stays visible and separable from sales.
create table stock_movements (
  id         uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  type       movement_type not null,
  qty        integer not null, -- positive for restock, negative for sale/workshop_use
  reference  text not null default '',
  note       text not null default '',
  created_at timestamptz not null default now()
);
create index on stock_movements (product_id);
create index on stock_movements (type);

-- Orders --------------------------------------------------------------------
create table orders (
  id                     uuid primary key default gen_random_uuid(),
  invoice_ref            text unique not null,
  channel                order_channel not null,
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
  paid_at                timestamptz
);
create index on orders (status);
create index on orders (channel);

-- Order items ---------------------------------------------------------------
create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  sku        text not null,
  name       text not null,
  unit_price numeric(10,2) not null,
  qty        integer not null,
  pricing    text not null, -- 'retail' | 'bulk'
  line_total numeric(10,2) not null
);
create index on order_items (order_id);

-- Bookings ------------------------------------------------------------------
create table bookings (
  id                     uuid primary key default gen_random_uuid(),
  invoice_ref            text unique not null,
  service_type           service_type not null,
  customer_name          text not null,
  customer_email         text not null,
  customer_phone         text not null,
  vehicle_model          text not null default '',
  preferred_date         date not null,
  time_slot              text not null,
  amount                 numeric(10,2) not null,
  status                 order_status not null default 'pending_payment',
  payment_status         payment_status not null default 'pending',
  leanx_bill_no          text,
  leanx_invoice_ref      text,
  payment_link           text,
  payment_transaction_id text,
  notes                  text not null default '',
  created_at             timestamptz not null default now(),
  paid_at                timestamptz
);
create index on bookings (status);

-- Notes ---------------------------------------------------------------------
-- Row Level Security: enable RLS and add policies before going live. The
-- storefront should use the anon key for read + insert of pending orders; the
-- webhook and dashboard should use the service role key (server side only).
