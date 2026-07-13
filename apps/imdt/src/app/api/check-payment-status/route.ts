import { NextRequest, NextResponse } from 'next/server'
import { refreshPaymentStatus } from '@byki/core/payments'
import { getBookingByInvoiceRef, getOrderByInvoiceRef } from '@byki/core/db'
import { workshop } from '@/config/workshop'

export const dynamic = 'force-dynamic'

// Verifies a record on return from LeanX. Call with ?ref=ORDER-xxx (or BOOKING-)
// and optional &type=. Falls back to inferring type from the ref prefix.
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'Missing ref' }, { status: 400 })

  const type = ref.startsWith('BOOKING-') ? 'booking' : 'order'
  const record =
    type === 'booking'
      ? await getBookingByInvoiceRef(workshop.id, ref)
      : await getOrderByInvoiceRef(workshop.id, ref)
  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

  const status = await refreshPaymentStatus(type, workshop.id, record.id)
  return NextResponse.json({
    success: true,
    type,
    ref,
    customerName: record.customerName,
    amount: record.amount,
    ...status,
  })
}
