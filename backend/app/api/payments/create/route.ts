import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createBill, isValidEmail, isValidMalaysianPhone } from '@/lib/leanx'
import { createBooking, createOrder, getProduct } from '@/lib/store'
import { serviceDeposits } from '@/lib/labels'
import { corsHeaders, corsJson } from '@/lib/cors'
import type {
  Booking,
  Order,
  OrderChannel,
  OrderItem,
  ServiceType,
} from '@/lib/types'

export const dynamic = 'force-dynamic'

// Called cross-origin by the static storefront, so it needs CORS + preflight.
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

function shortRef(): string {
  return randomUUID().split('-')[0].toUpperCase()
}

interface CreateBody {
  type: 'order' | 'booking'
  customer: { name?: string; email?: string; phone?: string }
  // order
  channel?: OrderChannel
  items?: { productId: string; qty: number }[]
  // booking
  booking?: {
    serviceType?: ServiceType
    vehicleModel?: string
    preferredDate?: string
    timeSlot?: string
    notes?: string
  }
  returnPath?: string
  returnUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateBody
    const customer = body.customer || {}
    const name = (customer.name || '').trim()
    const email = (customer.email || '').trim()
    const phone = (customer.phone || '').trim()

    if (!name || !email || !phone) {
      return corsJson({ error: 'Name, email and phone are required.' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return corsJson({ error: 'Invalid email format.' }, { status: 400 })
    }
    if (!isValidMalaysianPhone(phone)) {
      return corsJson(
        { error: 'Invalid phone. Use a Malaysian mobile number, e.g. 0123456789.' },
        { status: 400 },
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://${request.headers.get('host')}`
    const callbackUrl = `${baseUrl}/api/payments/webhook`
    const safeReturn =
      typeof body.returnPath === 'string' && /^\/[A-Za-z0-9/_-]*$/.test(body.returnPath)
        ? body.returnPath
        : '/result'
    // The storefront (a different origin) can pass an absolute returnUrl so the
    // buyer comes back to the static site after paying. Otherwise we return to
    // the backend's own /result page.
    const returnUrl = typeof body.returnUrl === 'string' ? body.returnUrl : ''
    const redirectBase = /^https?:\/\//i.test(returnUrl)
      ? returnUrl
      : `${baseUrl}${safeReturn}`
    const withRef = (ref: string) =>
      `${redirectBase}${redirectBase.includes('?') ? '&' : '?'}ref=${ref}`

    // ----- Order branch -----------------------------------------------
    if (body.type === 'order') {
      const reqItems = body.items || []
      if (reqItems.length === 0) {
        return corsJson({ error: 'Cart is empty.' }, { status: 400 })
      }

      const items: OrderItem[] = []
      for (const reqItem of reqItems) {
        const product = await getProduct(reqItem.productId)
        const qty = Math.floor(Number(reqItem.qty))
        if (!product || qty <= 0) {
          return corsJson({ error: 'Invalid item in cart.' }, { status: 400 })
        }
        const pricing = qty >= product.bulkMinQty ? 'bulk' : 'retail'
        const unitPrice = pricing === 'bulk' ? product.priceBulk : product.priceRetail
        items.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          unitPrice,
          qty,
          pricing,
          lineTotal: Number((unitPrice * qty).toFixed(2)),
        })
      }

      const amount = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2))
      const invoiceRef = `ORDER-${shortRef()}`
      const redirectUrl = withRef(invoiceRef)

      const bill = await createBill({
        amount,
        invoiceRef,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        redirectUrl,
        callbackUrl,
      })

      const order: Order = {
        id: randomUUID(),
        invoiceRef,
        channel: body.channel === 'bulk' || body.channel === 'owner' ? body.channel : 'retail',
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        items,
        amount,
        status: 'pending_payment',
        paymentStatus: 'pending',
        leanxBillNo: bill.billNo,
        leanxInvoiceRef: bill.invoiceRef,
        paymentLink: bill.redirectUrl,
        paymentProvider: null,
        paymentMethod: null,
        paymentTransactionId: null,
        createdAt: new Date().toISOString(),
        paidAt: null,
        stockApplied: false,
      }
      await createOrder(order)

      return corsJson({
        success: true,
        type: 'order',
        id: order.id,
        invoiceRef,
        amount,
        paymentLink: bill.redirectUrl,
      })
    }

    // ----- Booking branch ---------------------------------------------
    const b = body.booking || {}
    const serviceType = b.serviceType
    if (!serviceType || !(serviceType in serviceDeposits)) {
      return corsJson({ error: 'Select a valid service.' }, { status: 400 })
    }
    if (!b.preferredDate || !b.timeSlot) {
      return corsJson({ error: 'Select a date and time slot.' }, { status: 400 })
    }

    const amount = serviceDeposits[serviceType]
    const invoiceRef = `BOOKING-${shortRef()}`
    const redirectUrl = `${baseUrl}${safeReturn}?ref=${invoiceRef}`

    const bill = await createBill({
      amount,
      invoiceRef,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      redirectUrl,
      callbackUrl,
    })

    const booking: Booking = {
      id: randomUUID(),
      invoiceRef,
      serviceType,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      vehicleModel: (b.vehicleModel || '').trim(),
      preferredDate: b.preferredDate,
      timeSlot: b.timeSlot,
      amount,
      status: 'pending_payment',
      paymentStatus: 'pending',
      leanxBillNo: bill.billNo,
      leanxInvoiceRef: bill.invoiceRef,
      paymentLink: bill.redirectUrl,
      paymentTransactionId: null,
      createdAt: new Date().toISOString(),
      paidAt: null,
      notes: (b.notes || '').trim(),
    }
    await createBooking(booking)

    return corsJson({
      success: true,
      type: 'booking',
      id: booking.id,
      invoiceRef,
      amount,
      paymentLink: bill.redirectUrl,
    })
  } catch (error) {
    console.error('create payment error', error)
    return corsJson(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
