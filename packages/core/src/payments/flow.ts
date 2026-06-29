// High-level payment flows shared by every workshop's API routes. Server only.
// Orders and bookings are created HERE (service role) with the amount recomputed
// server-side, then a LeanX bill is created and the record updated with its refs.

import { getAdminClient } from '../supabase/admin'
import { createBooking, updateBooking } from '../db/bookings'
import { createOrder, updateOrder } from '../db/orders'
import { getProduct } from '../db/products'
import { recordMovement } from '../db/inventory'
import { bumpCustomerTotals, linkDiagnoseSession, upsertCustomer } from '../db/customers'
import { buildCart, inferChannel, type RequestedItem } from '../commerce/pricing'
import type { Customer, Product } from '../types'
import {
  checkTransaction,
  createBill,
  isValidEmail,
  isValidMalaysianPhone,
  statusFromLeanX,
  type LeanXTransaction,
} from './leanx'

function shortRef(): string {
  return globalThis.crypto.randomUUID().split('-')[0]!.toUpperCase()
}

function assertCustomer(c: Customer): void {
  if (!c.name?.trim() || !c.email?.trim() || !c.phone?.trim()) {
    throw new Error('Name, email and phone are required.')
  }
  if (!isValidEmail(c.email)) throw new Error('Invalid email format.')
  if (!isValidMalaysianPhone(c.phone)) {
    throw new Error('Invalid phone. Use a Malaysian mobile number, e.g. 0123456789.')
  }
}

function withRef(base: string, ref: string): string {
  return `${base}${base.includes('?') ? '&' : '?'}ref=${ref}`
}

export interface PaymentResult {
  success: true
  type: 'order' | 'booking'
  id: string
  invoiceRef: string
  amount: number
  paymentLink: string
}

export interface OrderPaymentInput {
  customer: Customer
  items: RequestedItem[]
  baseUrl: string
  /** Absolute URL or internal path the buyer returns to after paying. */
  returnUrl?: string
  returnPath?: string
  /** Optional id of a prior diagnose scan to attribute to this customer. */
  diagnoseSessionId?: string
}

export async function createOrderPayment(
  workshopId: string,
  input: OrderPaymentInput,
): Promise<PaymentResult> {
  assertCustomer(input.customer)

  // Resolve + price server-side.
  const resolved = await Promise.all(input.items.map((i) => getProduct(workshopId, i.productId)))
  const productsById = new Map<string, Product>()
  resolved.forEach((p) => p && productsById.set(p.id, p))
  const { items, amount } = buildCart(input.items, productsById)

  const invoiceRef = `ORDER-${shortRef()}`
  const callbackUrl = `${input.baseUrl}/api/payment-webhook`
  const safePath = /^\/[A-Za-z0-9/_-]*$/.test(input.returnPath ?? '') ? input.returnPath! : '/shop/success'
  const redirectBase = /^https?:\/\//i.test(input.returnUrl ?? '')
    ? input.returnUrl!
    : `${input.baseUrl}${safePath}`
  const redirectUrl = withRef(redirectBase, invoiceRef)

  const customerId = await upsertCustomer(workshopId, {
    name: input.customer.name.trim(),
    phone: input.customer.phone.trim(),
    email: input.customer.email.trim(),
  })
  if (customerId && input.diagnoseSessionId) {
    await linkDiagnoseSession(workshopId, input.diagnoseSessionId, customerId)
  }

  const order = await createOrder(workshopId, {
    invoiceRef,
    channel: inferChannel(items),
    customerName: input.customer.name.trim(),
    customerEmail: input.customer.email.trim(),
    customerPhone: input.customer.phone.trim(),
    amount,
    items,
    customerId,
  })

  const bill = await createBill({
    workshopId,
    amount,
    invoiceRef,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    redirectUrl,
    callbackUrl,
    baseUrl: input.baseUrl,
  })

  await updateOrder(workshopId, order.id, {
    leanxBillNo: bill.billNo,
    leanxInvoiceRef: bill.invoiceRef,
  })

  return {
    success: true,
    type: 'order',
    id: order.id,
    invoiceRef,
    amount,
    paymentLink: bill.redirectUrl,
  }
}

export interface BookingPaymentInput {
  customer: Customer
  serviceType: string
  amount: number
  vehicleModel?: string
  preferredDate?: string | null
  timeSlot?: string
  faultCodes?: string[]
  notes?: string
  baseUrl: string
  returnPath?: string
  /** Optional id of a prior diagnose scan to attribute to this customer + booking. */
  diagnoseSessionId?: string
}

export async function createBookingPayment(
  workshopId: string,
  input: BookingPaymentInput,
): Promise<PaymentResult> {
  assertCustomer(input.customer)
  if (!(input.amount > 0)) throw new Error('Invalid deposit amount.')

  const invoiceRef = `BOOKING-${shortRef()}`
  const callbackUrl = `${input.baseUrl}/api/payment-webhook`
  const safePath = /^\/[A-Za-z0-9/_-]*$/.test(input.returnPath ?? '') ? input.returnPath! : '/booking/success'
  const redirectUrl = withRef(`${input.baseUrl}${safePath}`, invoiceRef)

  const customerId = await upsertCustomer(workshopId, {
    name: input.customer.name.trim(),
    phone: input.customer.phone.trim(),
    email: input.customer.email.trim(),
    vehicle: input.vehicleModel,
  })

  const booking = await createBooking(workshopId, {
    invoiceRef,
    serviceType: input.serviceType,
    customerName: input.customer.name.trim(),
    customerEmail: input.customer.email.trim(),
    customerPhone: input.customer.phone.trim(),
    vehicleModel: input.vehicleModel,
    preferredDate: input.preferredDate,
    timeSlot: input.timeSlot,
    amount: input.amount,
    faultCodes: input.faultCodes,
    notes: input.notes,
    customerId,
  })

  if (customerId && input.diagnoseSessionId) {
    await linkDiagnoseSession(workshopId, input.diagnoseSessionId, customerId, booking.id)
  }

  const bill = await createBill({
    workshopId,
    amount: input.amount,
    invoiceRef,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    redirectUrl,
    callbackUrl,
    baseUrl: input.baseUrl,
  })

  await updateBooking(workshopId, booking.id, {
    leanxBillNo: bill.billNo,
    leanxInvoiceRef: bill.invoiceRef,
  })

  return {
    success: true,
    type: 'booking',
    id: booking.id,
    invoiceRef,
    amount: input.amount,
    paymentLink: bill.redirectUrl,
  }
}

// ── Webhook + status: find the record across workshops by any LeanX ref ──────

async function findOrderByAnyRef(ref: string) {
  const { data } = await getAdminClient()
    .from('orders')
    .select('*')
    .or(`invoice_ref.eq.${ref},leanx_bill_no.eq.${ref},leanx_invoice_ref.eq.${ref}`)
    .maybeSingle()
  return data
}

async function findBookingByAnyRef(ref: string) {
  const { data } = await getAdminClient()
    .from('bookings')
    .select('*')
    .or(`invoice_ref.eq.${ref},leanx_bill_no.eq.${ref},leanx_invoice_ref.eq.${ref}`)
    .maybeSingle()
  return data
}

export interface WebhookPayload {
  invoice_no: string
  amount?: string
  invoice_status: string
  providerTypeReference?: string
  bank_provider?: string
  fpx_invoice_no?: string
}

export interface WebhookResult {
  ok: boolean
  type?: 'order' | 'booking'
  id?: string
  status?: string
  error?: string
}

// Confirms/cancels the matching order or booking. For paid orders it decrements
// stock exactly once (guarded by orders.stock_applied).
export async function handlePaymentWebhook(payload: WebhookPayload): Promise<WebhookResult> {
  if (!payload.invoice_no || !payload.invoice_status) {
    return { ok: false, error: 'Invalid payload' }
  }
  const ref = payload.invoice_no
  const { paymentStatus, isSuccess, isFailure } = statusFromLeanX(payload.invoice_status)

  const isBooking = ref.startsWith('BOOKING-')
  const order = isBooking ? null : await findOrderByAnyRef(ref)
  const booking = order ? null : await findBookingByAnyRef(ref)

  if (order) {
    const status = isSuccess ? 'paid' : isFailure ? 'cancelled' : order.status
    await updateOrder(order.workshop_id, order.id, {
      status,
      paymentStatus,
      paymentProvider: payload.bank_provider ?? null,
      paymentMethod: payload.providerTypeReference ?? 'FPX',
      paymentTransactionId: payload.fpx_invoice_no ?? null,
      paidAt: isSuccess ? new Date().toISOString() : null,
    })
    if (isSuccess && !order.stock_applied) {
      await applyOrderStock(order.workshop_id, order.id, order.invoice_ref)
      if (order.customer_id) {
        await bumpCustomerTotals(order.customer_id, { spent: Number(order.amount), orders: 1 })
      }
    }
    return { ok: true, type: 'order', id: order.id, status }
  }

  if (booking) {
    const status = isSuccess ? 'confirmed' : isFailure ? 'cancelled' : booking.status
    await updateBooking(booking.workshop_id, booking.id, {
      status,
      paymentStatus,
      paymentProvider: payload.bank_provider ?? null,
      paymentMethod: payload.providerTypeReference ?? 'FPX',
      paymentTransactionId: payload.fpx_invoice_no ?? null,
      paidAt: isSuccess ? new Date().toISOString() : null,
    })
    // Count once on the pending -> confirmed transition.
    if (isSuccess && booking.status !== 'confirmed' && booking.customer_id) {
      await bumpCustomerTotals(booking.customer_id, { spent: Number(booking.amount), bookings: 1 })
    }
    return { ok: true, type: 'booking', id: booking.id, status }
  }

  return { ok: false, error: 'Record not found' }
}

async function applyOrderStock(workshopId: string, orderId: string, invoiceRef: string): Promise<void> {
  const db = getAdminClient()
  const { data: items } = await db
    .from('order_items')
    .select('product_id, qty')
    .eq('order_id', orderId)
  for (const item of items ?? []) {
    await recordMovement(workshopId, {
      productId: item.product_id,
      type: 'sale',
      qty: -Math.abs(item.qty),
      reference: invoiceRef,
      note: 'Auto deduction on paid order',
    })
  }
  await updateOrder(workshopId, orderId, { stockApplied: true })
}

// Used by /booking/success and /shop/success to verify a record on return.
export async function refreshPaymentStatus(
  type: 'order' | 'booking',
  workshopId: string,
  id: string,
): Promise<{ status: string; paymentStatus: string } | null> {
  const db = getAdminClient()
  const table = type === 'order' ? 'orders' : 'bookings'
  const { data } = await db.from(table).select('*').eq('workshop_id', workshopId).eq('id', id).maybeSingle()
  if (!data) return null

  const settled = type === 'order' ? data.status === 'paid' : data.status === 'confirmed'
  if (settled) return { status: data.status, paymentStatus: data.payment_status }

  // Still pending — ask LeanX directly (live mode only).
  const invoiceNo = data.leanx_bill_no || data.leanx_invoice_ref || data.invoice_ref
  const txn: LeanXTransaction | null = await checkTransaction(invoiceNo)
  if (!txn) return { status: data.status, paymentStatus: data.payment_status }

  await handlePaymentWebhook({
    invoice_no: invoiceNo,
    amount: txn.amount,
    invoice_status: txn.invoice_status,
    providerTypeReference: txn.providerTypeReference,
    bank_provider: txn.bank_provider,
    fpx_invoice_no: txn.fpx_invoice_no,
  })

  const { data: fresh } = await db.from(table).select('status, payment_status').eq('id', id).maybeSingle()
  return fresh ? { status: fresh.status, paymentStatus: fresh.payment_status } : null
}
