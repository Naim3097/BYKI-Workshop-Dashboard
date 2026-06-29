// LeanX payment gateway. Unifies the proven flow from MNA (mock mode + simulator)
// and the live One X / Overhaulinyard routes. Per-workshop collection UUID is
// resolved from the env first, then the workshops table.
//
//   POST {apiHost}/api/v1/merchant/create-bill-page   (auth-token header)
//     -> data.redirect_url (payment link) + data.bill_no
//   POST {apiHost}/api/v1/merchant/manual-checking-transaction?invoice_no=...
//     -> data.transaction_details (status check)
//
// Set PAYMENTS_MODE=live + LEANX_AUTH_TOKEN to hit the real gateway; otherwise
// mock mode returns a link to the built-in /pay/[ref] simulator.

import { getAdminClient } from '../supabase/admin'

export type PaymentsMode = 'mock' | 'live'

export function paymentsMode(): PaymentsMode {
  return process.env.PAYMENTS_MODE === 'live' ? 'live' : 'mock'
}

function apiHost(): string {
  return process.env.LEANX_API_HOST || 'https://api.leanx.io'
}

// Per-workshop collection UUID: env override (single-tenant deploy) wins, else
// the workshops table (central BYKI provisioning).
export async function resolveCollectionUuid(workshopId: string): Promise<string | null> {
  const fromEnv = process.env.LEANX_COLLECTION_UUID?.trim()
  if (fromEnv) return fromEnv
  try {
    const { data } = await getAdminClient()
      .from('workshops')
      .select('leanx_collection_uuid')
      .eq('id', workshopId)
      .maybeSingle()
    return data?.leanx_collection_uuid ?? null
  } catch {
    return null
  }
}

export interface CreateBillInput {
  workshopId: string
  amount: number
  invoiceRef: string
  customerName: string
  customerEmail: string
  customerPhone: string
  redirectUrl: string
  callbackUrl: string
  baseUrl: string
}

export interface CreateBillResult {
  redirectUrl: string
  billNo: string
  invoiceRef: string
}

interface LeanXBillResponse {
  response_code: number
  description: string
  data: { collection_uuid: string; redirect_url: string; bill_no: string; invoice_ref: string }
  breakdown_errors: string
}

export async function createBill(input: CreateBillInput): Promise<CreateBillResult> {
  if (paymentsMode() === 'mock') {
    const ret = encodeURIComponent(input.redirectUrl)
    return {
      redirectUrl: `${input.baseUrl}/pay/${encodeURIComponent(input.invoiceRef)}?return=${ret}`,
      billNo: `MOCK-${input.invoiceRef}`,
      invoiceRef: input.invoiceRef,
    }
  }

  const authToken = process.env.LEANX_AUTH_TOKEN?.trim()
  const collectionUuid = await resolveCollectionUuid(input.workshopId)
  if (!authToken || !collectionUuid) {
    throw new Error(
      'LeanX not configured. Set LEANX_AUTH_TOKEN and a collection UUID (env LEANX_COLLECTION_UUID or workshops.leanx_collection_uuid).',
    )
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

  const res = await fetch(`${apiHost()}/api/v1/merchant/create-bill-page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'auth-token': authToken },
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

export interface LeanXTransaction {
  invoice_no: string
  fpx_invoice_no: string
  amount: string
  invoice_status: string
  providerTypeReference: string
  bank_provider: string
}

interface LeanXTxnResponse {
  response_code: number
  description: string
  data: { transaction_details: LeanXTransaction }
}

// Queries LeanX for the latest status of a bill. Returns null in mock mode or
// when the gateway can't confirm yet.
export async function checkTransaction(invoiceNo: string): Promise<LeanXTransaction | null> {
  if (paymentsMode() === 'mock') return null
  const authToken = process.env.LEANX_AUTH_TOKEN?.trim()
  if (!authToken) return null

  const res = await fetch(
    `${apiHost()}/api/v1/merchant/manual-checking-transaction?invoice_no=${encodeURIComponent(invoiceNo)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json', 'auth-token': authToken } },
  )
  const data: LeanXTxnResponse = await res.json()
  if (!res.ok || data.response_code !== 2000) return null
  return data.data?.transaction_details ?? null
}

// ── Malaysian-format validators (shared) ──
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidMalaysianPhone(phone: string): boolean {
  return /^(\+?6?01)[0-9]{8,9}$/.test(phone.replace(/[\s-]/g, ''))
}

// Maps a LeanX invoice_status to our internal payment + record statuses.
export function statusFromLeanX(invoiceStatus: string): {
  paymentStatus: 'pending' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  isSuccess: boolean
  isFailure: boolean
} {
  const s = invoiceStatus?.toUpperCase()
  return {
    paymentStatus: s === 'SUCCESS' ? 'SUCCESS' : s === 'FAILED' ? 'FAILED' : s === 'CANCELLED' ? 'CANCELLED' : 'pending',
    isSuccess: s === 'SUCCESS',
    isFailure: s === 'FAILED' || s === 'CANCELLED',
  }
}
