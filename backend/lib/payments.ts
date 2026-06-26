import {
  getBookingByInvoiceRef,
  getOrderByInvoiceRef,
  recordMovement,
  updateBooking,
  updateOrder,
} from './store'
import type { PaymentStatus } from './types'

// Single source of truth for what happens when a payment result arrives. Used by
// both the real LeanX webhook (/api/payments/webhook) and the mock simulator
// (/api/payments/simulate), so live and demo behave identically.

export interface PaymentResultDetails {
  provider?: string
  method?: string
  transactionId?: string
  invoiceNo?: string
}

export interface ApplyResult {
  kind: 'order' | 'booking'
  id: string
  status: PaymentStatus
}

export async function applyPaymentResult(
  ref: string,
  status: PaymentStatus,
  details: PaymentResultDetails = {},
): Promise<ApplyResult | null> {
  const now = new Date().toISOString()

  // ----- Order ----------------------------------------------------------
  const order = await getOrderByInvoiceRef(ref)
  if (order) {
    const isSuccess = status === 'SUCCESS'
    await updateOrder(order.id, {
      status: isSuccess ? 'paid' : 'cancelled',
      paymentStatus: status,
      paymentProvider: details.provider ?? order.paymentProvider,
      paymentMethod: details.method ?? order.paymentMethod,
      paymentTransactionId: details.transactionId ?? order.paymentTransactionId,
      leanxInvoiceRef: details.invoiceNo ?? order.leanxInvoiceRef,
      paidAt: isSuccess ? now : order.paidAt,
    })

    // Decrement stock once, only on a successful payment. Each sold line is
    // recorded as a `sale` movement so the dashboard ledger stays complete.
    if (isSuccess && !order.stockApplied) {
      for (const item of order.items) {
        await recordMovement({
          productId: item.productId,
          type: 'sale',
          qty: -item.qty,
          reference: order.invoiceRef,
          note: `${item.name} (${item.pricing})`,
        })
      }
      await updateOrder(order.id, { stockApplied: true })
    }

    return { kind: 'order', id: order.id, status }
  }

  // ----- Booking --------------------------------------------------------
  const booking = await getBookingByInvoiceRef(ref)
  if (booking) {
    const isSuccess = status === 'SUCCESS'
    await updateBooking(booking.id, {
      status: isSuccess ? 'paid' : 'cancelled',
      paymentStatus: status,
      paymentTransactionId: details.transactionId ?? booking.paymentTransactionId,
      leanxInvoiceRef: details.invoiceNo ?? booking.leanxInvoiceRef,
      paidAt: isSuccess ? now : booking.paidAt,
    })
    return { kind: 'booking', id: booking.id, status }
  }

  return null
}
