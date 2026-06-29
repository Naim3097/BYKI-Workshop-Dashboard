import { NextRequest, NextResponse } from 'next/server'
import { createBookingPayment, createOrderPayment } from '@byki/core/payments'
import { depositForService } from '@byki/core/config'
import { workshop } from '@/config/workshop'

export const dynamic = 'force-dynamic'

// Unified payment entry: { type: 'order' | 'booking', ... }. Orders and bookings
// are created server-side by @byki/core with the amount recomputed there.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host')
    const baseUrl = `${protocol}://${host}`

    if (body.type === 'order') {
      const result = await createOrderPayment(workshop.id, {
        customer: body.customer,
        items: body.items ?? [],
        baseUrl,
        returnPath: '/shop/success',
        diagnoseSessionId: body.diagnoseSessionId,
      })
      return NextResponse.json(result)
    }

    // booking
    const b = body.booking ?? {}
    const serviceType = b.serviceType || workshop.services[0]?.key || 'inspection'
    const amount = depositForService(workshop, serviceType)
    const result = await createBookingPayment(workshop.id, {
      customer: body.customer,
      serviceType,
      amount,
      vehicleModel: b.vehicleModel,
      preferredDate: b.preferredDate,
      timeSlot: b.timeSlot,
      faultCodes: b.faultCodes,
      notes: b.notes,
      baseUrl,
      returnPath: '/booking/success',
      diagnoseSessionId: body.diagnoseSessionId,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 400 },
    )
  }
}
