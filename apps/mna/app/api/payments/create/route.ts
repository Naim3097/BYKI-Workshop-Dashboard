import { NextRequest, NextResponse } from 'next/server'
import { createBookingPayment, createOrderPayment } from '@byki/core/payments'
import { depositForService } from '@byki/core/config'
import { corsHeaders, corsJson } from '@/lib/cors'
import { workshop } from '@/lib/workshop'

export const dynamic = 'force-dynamic'

// Created server-side by @byki/core (amount recomputed, customer upserted, BYKI
// connected). Same request/response shape the legacy shop pages already use.
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const proto = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`
    const returnPath = typeof body.returnPath === 'string' ? body.returnPath : '/result'

    if (body.type === 'booking') {
      const b = body.booking || {}
      const serviceType = b.serviceType || workshop.services[0]?.key || 'diagnostic'
      const result = await createBookingPayment(workshop.id, {
        customer: body.customer || {},
        serviceType,
        amount: depositForService(workshop, serviceType),
        vehicleModel: b.vehicleModel,
        preferredDate: b.preferredDate,
        timeSlot: b.timeSlot,
        notes: b.notes,
        baseUrl,
        returnPath,
        diagnoseSessionId: body.diagnoseSessionId,
      })
      return corsJson(result)
    }

    const result = await createOrderPayment(workshop.id, {
      customer: body.customer || {},
      items: body.items || [],
      baseUrl,
      returnUrl: typeof body.returnUrl === 'string' ? body.returnUrl : undefined,
      returnPath,
      diagnoseSessionId: body.diagnoseSessionId,
    })
    return corsJson(result)
  } catch (error) {
    return corsJson(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 400 },
    )
  }
}
