// LeanX payment gateway integration.
//
// This is a direct port of the flow proven in the One X Transmission project:
//   POST {apiHost}/api/v1/merchant/create-bill-page  with an `auth-token` header
//   -> returns data.redirect_url (the payment link) and data.bill_no
//
// In "mock" mode (no LeanX UUID yet) we skip the network call and return a link
// to the built-in simulator at /pay/[ref], so the entire flow is demoable now.
// Set PAYMENTS_MODE=live and provide LEANX_AUTH_TOKEN + LEANX_COLLECTION_UUID to
// switch to the real gateway with no other code changes.

export type PaymentsMode = 'mock' | 'live'

export function paymentsMode(): PaymentsMode {
  return process.env.PAYMENTS_MODE === 'live' ? 'live' : 'mock'
}

export interface CreateBillInput {
  amount: number
  invoiceRef: string
  customerName: string
  customerEmail: string
  customerPhone: string
  redirectUrl: string
  callbackUrl: string
}

export interface CreateBillResult {
  redirectUrl: string
  billNo: string
  invoiceRef: string
}

interface LeanXBillResponse {
  response_code: number
  description: string
  data: {
    collection_uuid: string
    redirect_url: string
    bill_no: string
    invoice_ref: string
  }
  breakdown_errors: string
}

export async function createBill(input: CreateBillInput): Promise<CreateBillResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  if (paymentsMode() === 'mock') {
    // The simulator stands in for LeanX's hosted bill page. The post-payment
    // destination (input.redirectUrl, which may be back on the static site) is
    // passed through so the simulator can return the buyer there.
    const ret = encodeURIComponent(input.redirectUrl)
    return {
      redirectUrl: `${baseUrl}/pay/${encodeURIComponent(input.invoiceRef)}?return=${ret}`,
      billNo: `MOCK-${input.invoiceRef}`,
      invoiceRef: input.invoiceRef,
    }
  }

  const authToken = process.env.LEANX_AUTH_TOKEN?.trim()
  const collectionUuid = process.env.LEANX_COLLECTION_UUID?.trim()
  const apiHost = process.env.LEANX_API_HOST || 'https://api.leanx.io'

  if (!authToken || !collectionUuid) {
    throw new Error('LeanX credentials missing. Set LEANX_AUTH_TOKEN and LEANX_COLLECTION_UUID.')
  }

  const payload = {
    collection_uuid: collectionUuid,
    amount: parseFloat(input.amount.toFixed(2)),
    invoice_ref: input.invoiceRef,
    redirect_url: input.redirectUrl,
    callback_url: input.callbackUrl,
    full_name: input.customerName,
    email: input.customerEmail,
    phone_number: input.customerPhone.replace(/[\s-]/g, ''),
  }

  const res = await fetch(`${apiHost}/api/v1/merchant/create-bill-page`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'auth-token': authToken,
    },
    body: JSON.stringify(payload),
  })

  const data: LeanXBillResponse = await res.json()

  if (!res.ok || data.response_code !== 2000) {
    throw new Error(data.description || 'LeanX create-bill failed')
  }

  return {
    redirectUrl: data.data.redirect_url,
    billNo: data.data.bill_no,
    invoiceRef: data.data.invoice_ref,
  }
}

// Basic Malaysian-format validators reused from the proven project.
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidMalaysianPhone(phone: string): boolean {
  return /^(\+?6?01)[0-9]{8,9}$/.test(phone.replace(/[\s-]/g, ''))
}
