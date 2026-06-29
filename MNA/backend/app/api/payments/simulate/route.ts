import { NextRequest, NextResponse } from 'next/server'
import { applyPaymentResult } from '@/lib/payments'
import { paymentsMode } from '@/lib/leanx'

export const dynamic = 'force-dynamic'

// Mock-only endpoint. The simulator page (/pay/[ref]) posts here to drive the
// same payment-result logic the real LeanX webhook would trigger. Disabled when
// PAYMENTS_MODE=live so it can never affect real transactions.
export async function POST(request: NextRequest) {
  if (paymentsMode() === 'live') {
    return NextResponse.json({ error: 'Simulator disabled in live mode' }, { status: 403 })
  }

  try {
    const { ref, outcome } = (await request.json()) as {
      ref?: string
      outcome?: 'success' | 'fail'
    }
    if (!ref) {
      return NextResponse.json({ error: 'Missing ref' }, { status: 400 })
    }

    const status = outcome === 'success' ? 'SUCCESS' : 'FAILED'
    const result = await applyPaymentResult(ref, status, {
      provider: 'Simulated Bank',
      method: 'FPX',
      transactionId: `SIM-${ref}`,
      invoiceNo: ref,
    })

    if (!result) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
