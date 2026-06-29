import { NextRequest, NextResponse } from 'next/server'
import { applyPaymentResult } from '@/lib/payments'
import type { PaymentStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Health check.
export async function GET() {
  return NextResponse.json({ status: 'Webhook active', timestamp: new Date().toISOString() })
}

// LeanX callback. Mirrors the One X Transmission handler: accepts JSON or
// form-encoded bodies and maps invoice_status to our internal status.
interface LeanXWebhookPayload {
  invoice_no?: string
  amount?: string
  invoice_status?: string
  providerTypeReference?: string
  bank_provider?: string
  fpx_invoice_no?: string
}

export async function POST(request: NextRequest) {
  try {
    let payload: LeanXWebhookPayload
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      payload = await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData()
      payload = Object.fromEntries(form.entries()) as LeanXWebhookPayload
    } else {
      const raw = await request.text()
      try {
        payload = JSON.parse(raw)
      } catch {
        payload = Object.fromEntries(new URLSearchParams(raw).entries()) as LeanXWebhookPayload
      }
    }

    if (!payload.invoice_no || !payload.invoice_status) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const status: PaymentStatus =
      payload.invoice_status === 'SUCCESS'
        ? 'SUCCESS'
        : payload.invoice_status === 'FAILED'
          ? 'FAILED'
          : 'CANCELLED'

    const result = await applyPaymentResult(payload.invoice_no, status, {
      provider: payload.bank_provider,
      method: payload.providerTypeReference || 'FPX',
      transactionId: payload.fpx_invoice_no,
      invoiceNo: payload.invoice_no,
    })

    if (!result) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('webhook error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
