// Payment result application — delegates to @byki/core so a settled payment
// confirms the order/booking, decrements stock once, and rolls up the customer's
// lifetime totals (which BYKI reads). Same signature the webhook/simulator use.

import { handlePaymentWebhook } from '@byki/core/payments'
import type { PaymentStatus } from './types'

export async function applyPaymentResult(
  ref: string,
  status: PaymentStatus,
  meta: { provider?: string; method?: string; transactionId?: string; invoiceNo?: string } = {},
): Promise<{ type: 'order' | 'booking'; id: string; status: string } | null> {
  const result = await handlePaymentWebhook({
    invoice_no: meta.invoiceNo || ref,
    invoice_status: status,
    bank_provider: meta.provider,
    providerTypeReference: meta.method,
    fpx_invoice_no: meta.transactionId,
  })
  if (!result.ok || !result.type || !result.id) return null
  return { type: result.type, id: result.id, status: result.status ?? '' }
}
