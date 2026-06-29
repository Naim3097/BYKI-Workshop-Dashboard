-- ============================================================================
-- Customers — first-class, workshop-scoped, deduplicated by phone.
-- Populated automatically from orders & bookings (name/email/phone already
-- collected). Links orders, bookings and diagnose_sessions to a customer so
-- BYKI can see lifetime value, repeat rate, and scan -> purchase journeys.
-- ============================================================================

create table if not exists customers (
  id             uuid primary key default gen_random_uuid(),
  workshop_id    uuid not null references workshops(id) on delete cascade,
  name           text not null default '',
  phone          text not null,
  email          text not null default '',
  vehicles       text[] not null default array[]::text[],
  total_spent    numeric(12,2) not null default 0,
  orders_count   integer not null default 0,
  bookings_count integer not null default 0,
  first_seen     timestamptz not null default now(),
  last_seen      timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (workshop_id, phone)
);
create index if not exists customers_workshop_idx on customers (workshop_id);
create index if not exists customers_phone_idx on customers (phone);

-- Link transactions + scans to a customer (nullable; set when known).
alter table orders            add column if not exists customer_id uuid references customers(id) on delete set null;
alter table bookings          add column if not exists customer_id uuid references customers(id) on delete set null;
alter table diagnose_sessions add column if not exists customer_id uuid references customers(id) on delete set null;

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Writes happen server-side via the service role (payment flow). Owners read
-- their own customers; byki_admin reads across all workshops.
alter table customers enable row level security;

create policy customers_owner_read on customers for select to authenticated
  using (workshop_id = public.current_workshop_id() or public.is_byki_admin());
