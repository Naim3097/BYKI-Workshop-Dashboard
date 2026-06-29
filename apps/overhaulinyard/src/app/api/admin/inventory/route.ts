import { NextRequest, NextResponse } from 'next/server'
import { AuthError, requireWorkshopAccess } from '@byki/core/auth'
import { recordMovement } from '@byki/core/admin/handlers'
import { workshop } from '@/config/workshop'

export const dynamic = 'force-dynamic'

// Record a stock movement (restock / workshop_use / adjustment), workshop-scoped.
// Gated by middleware + requireWorkshopAccess. The UI sends a positive qty + a
// type; we sign it here (restock = +, workshop_use = -, adjustment = as given).
export async function POST(request: NextRequest) {
  try {
    const { workshopId } = await requireWorkshopAccess(workshop.id)
    const body = await request.json()
    const productId: string = body.productId
    const type: 'restock' | 'workshop_use' | 'adjustment' = body.type
    const rawQty = Math.floor(Number(body.qty))

    if (!productId || !rawQty) {
      return NextResponse.json({ error: 'productId and qty are required.' }, { status: 400 })
    }
    const qty =
      type === 'restock' ? Math.abs(rawQty)
      : type === 'workshop_use' ? -Math.abs(rawQty)
      : rawQty // adjustment keeps the sign

    const movement = await recordMovement(workshopId, {
      productId,
      type,
      qty,
      reference: body.reference ?? '',
      note: body.note ?? '',
    })
    return NextResponse.json({ success: true, movement })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 },
    )
  }
}
