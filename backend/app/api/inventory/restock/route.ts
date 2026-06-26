import { NextRequest, NextResponse } from 'next/server'
import { recordMovement } from '@/lib/store'

export const dynamic = 'force-dynamic'

// Add stock (deliveries from suppliers). Recorded as a positive `restock`
// movement so the ledger always explains the on-hand quantity.
export async function POST(request: NextRequest) {
  try {
    const { productId, qty, note } = (await request.json()) as {
      productId?: string
      qty?: number
      note?: string
    }
    const amount = Math.floor(Number(qty))
    if (!productId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Provide a product and a positive quantity.' }, { status: 400 })
    }

    const movement = await recordMovement({
      productId,
      type: 'restock',
      qty: amount,
      reference: 'manual-restock',
      note: note || '',
    })
    return NextResponse.json({ success: true, movement })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
