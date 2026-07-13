import { NextRequest, NextResponse } from 'next/server'
import { AuthError, requireWorkshopAccess } from '@byki/core/auth'
import { createProduct, updateProductDetails } from '@byki/core/admin/handlers'
import { workshop } from '@/config/workshop'

export const dynamic = 'force-dynamic'

// Create a product (+ opening stock) — workshop-scoped, gated.
export async function POST(request: NextRequest) {
  try {
    const { workshopId } = await requireWorkshopAccess(workshop.id)
    const b = await request.json()
    if (!b.sku || !b.name || !(Number(b.priceRetail) > 0)) {
      return NextResponse.json({ error: 'sku, name and a retail price are required.' }, { status: 400 })
    }
    const product = await createProduct(workshopId, {
      sku: b.sku,
      name: b.name,
      kind: b.kind ?? 'part',
      category: b.category ?? '',
      description: b.description ?? '',
      shortDescription: b.shortDescription ?? '',
      image: b.image ?? null,
      priceRetail: Number(b.priceRetail),
      priceBulk: b.priceBulk != null && b.priceBulk !== '' ? Number(b.priceBulk) : null,
      bulkMinQty: b.bulkMinQty ? Number(b.bulkMinQty) : 1,
      depositAmount: b.depositAmount != null && b.depositAmount !== '' ? Number(b.depositAmount) : null,
      isFeatured: !!b.isFeatured,
      active: b.active ?? true,
      initialStock: b.initialStock ? Number(b.initialStock) : 0,
      reorderLevel: b.reorderLevel ? Number(b.reorderLevel) : 0,
    })
    return NextResponse.json({ success: true, product })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}

// Update editable product fields (+ reorder level).
export async function PATCH(request: NextRequest) {
  try {
    const { workshopId } = await requireWorkshopAccess(workshop.id)
    const { id, ...patch } = await request.json()
    if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })
    const product = await updateProductDetails(workshopId, id, patch)
    return NextResponse.json({ success: true, product })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
