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
