import { NextRequest, NextResponse } from 'next/server'
import { getBookingByInvoiceRef, getOrderByInvoiceRef } from '@/lib/store'
import { corsHeaders, corsJson } from '@/lib/cors'

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// Polled by the result page to show the latest payment outcome. In live mode
// this could additionally call LeanX's manual-checking-transaction endpoint as a
// fallback, exactly as the One X Transmission project does.
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')
  if (!ref) {
    return corsJson({ error: 'Missing ref' }, { status: 400 })
  }

  const order = await getOrderByInvoiceRef(ref)
  if (order) {
    return corsJson({
      found: true,
      type: 'order',
      invoiceRef: order.invoiceRef,
      status: order.status,
      paymentStatus: order.paymentStatus,
      amount: order.amount,
      customerName: order.customerName,
    })
  }

  const booking = await getBookingByInvoiceRef(ref)
  if (booking) {
    return corsJson({
      found: true,
      type: 'booking',
      invoiceRef: booking.invoiceRef,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      amount: booking.amount,
      customerName: booking.customerName,
    })
  }

  return corsJson({ found: false }, { status: 404 })
}
