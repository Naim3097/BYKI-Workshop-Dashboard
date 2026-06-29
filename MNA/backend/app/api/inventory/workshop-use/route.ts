import { NextRequest, NextResponse } from 'next/server'
import { getProduct, recordMovement } from '@/lib/store'

export const dynamic = 'force-dynamic'

// Consume stock for the owner's own workshop. This is deliberately a separate
// movement type (`workshop_use`) from a sale, so own-shop consumption is always
// reflected in stock counts and shown in its own panel on the dashboard rather
// than being hidden inside sales figures.
export async function POST(request: NextRequest) {
  try {
    const { productId, qty, reference, note } = (await request.json()) as {
      productId?: string
      qty?: number
      reference?: string
      note?: string
    }
    const amount = Math.floor(Number(qty))
    if (!productId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Provide a product and a positive quantity.' }, { status: 400 })
    }

    const product = await getProduct(productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }

    const movement = await recordMovement({
      productId,
      type: 'workshop_use',
      qty: -amount,
      reference: (reference || '').trim() || 'workshop-job',
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
