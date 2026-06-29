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
