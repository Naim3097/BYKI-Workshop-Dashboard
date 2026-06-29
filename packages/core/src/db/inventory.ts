// Inventory + stock-movement ledger, workshop-scoped. Service-role; server only.

import { getAdminClient } from '../supabase/admin'
import type { InventoryRecord, MovementType, StockMovement } from '../types'
import { movementFromRow } from './mappers'

export async function getInventory(workshopId: string): Promise<InventoryRecord[]> {
  const db = getAdminClient()
  const { data, error } = await db.from('inventory').select('*').eq('workshop_id', workshopId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({
    workshopId: r.workshop_id,
    productId: r.product_id,
    stockQty: r.stock_qty,
    reorderLevel: r.reorder_level,
    updatedAt: r.updated_at,
  }))
}

export async function listMovements(workshopId: string): Promise<StockMovement[]> {
  const db = getAdminClient()
  const { data, error } = await db
    .from('stock_movements')
    .select('*')
    .eq('workshop_id', workshopId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(movementFromRow)
}

// Atomic: adjusts on-hand stock and writes the ledger row in one DB call.
export async function recordMovement(
  workshopId: string,
  input: { productId: string; type: MovementType; qty: number; reference?: string; note?: string },
): Promise<StockMovement> {
  const db = getAdminClient()
  const { data, error } = await db.rpc('apply_stock_movement', {
    p_workshop: workshopId,
    p_product: input.productId,
    p_type: input.type,
    p_qty: input.qty,
    p_reference: input.reference ?? '',
    p_note: input.note ?? '',
  })
  if (error) throw new Error(error.message)
  return movementFromRow(data)
}
