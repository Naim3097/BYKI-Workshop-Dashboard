import { NextRequest, NextResponse } from 'next/server'
import { handlePaymentWebhook, type WebhookPayload } from '@byki/core/payments'

export const dynamic = 'force-dynamic'

// LeanX server-to-server callback (and the mock simulator). Confirms the order
// or booking and decrements stock for paid orders. Accepts JSON or form bodies.
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' })
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let payload: WebhookPayload
    if (contentType.includes('application/json')) {
      payload = await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData()
      payload = Object.fromEntries(form.entries()) as unknown as WebhookPayload
    } else {
      const raw = await request.text()
      try {
        payload = JSON.parse(raw)
      } catch {
        payload = Object.fromEntries(new URLSearchParams(raw).entries()) as unknown as WebhookPayload
      }
    }

    const result = await handlePaymentWebhook(payload)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Record not found' ? 404 : 400 })
    }
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
