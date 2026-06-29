// Bookings, workshop-scoped. Service-role; server only.

import { getAdminClient } from '../supabase/admin'
import type { Database } from '../supabase/database.types'
import type { Booking, BookingStatus, PaymentStatus } from '../types'
import { bookingFromRow } from './mappers'

export async function listBookings(workshopId: string): Promise<Booking[]> {
  const db = getAdminClient()
  const { data, error } = await db
    .from('bookings')
    .select('*')
    .eq('workshop_id', workshopId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(bookingFromRow)
}

export async function getBooking(workshopId: string, id: string): Promise<Booking | undefined> {
  const db = getAdminClient()
  const { data } = await db
    .from('bookings')
    .select('*')
    .eq('workshop_id', workshopId)
    .eq('id', id)
    .maybeSingle()
  return data ? bookingFromRow(data) : undefined
}

export async function getBookingByInvoiceRef(
  workshopId: string,
  ref: string,
): Promise<Booking | undefined> {
  const db = getAdminClient()
  const { data } = await db
    .from('bookings')
    .select('*')
    .eq('workshop_id', workshopId)
    .or(`invoice_ref.eq.${ref},leanx_bill_no.eq.${ref},leanx_invoice_ref.eq.${ref}`)
    .maybeSingle()
  return data ? bookingFromRow(data) : undefined
}

export interface CreateBookingInput {
  invoiceRef: string
  serviceType: string
  customerName: string
  customerEmail: string
  customerPhone: string
  vehicleModel?: string
  preferredDate?: string | null
  timeSlot?: string
  amount: number
  faultCodes?: string[]
  notes?: string
  customerId?: string | null
  leanxBillNo?: string | null
  leanxInvoiceRef?: string | null
  paymentLink?: string | null
}

export async function createBooking(
  workshopId: string,
  input: CreateBookingInput,
): Promise<Booking> {
  const db = getAdminClient()
  const { data, error } = await db
    .from('bookings')
    .insert({
      workshop_id: workshopId,
      customer_id: input.customerId ?? null,
      invoice_ref: input.invoiceRef,
      service_type: input.serviceType,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      vehicle_model: input.vehicleModel ?? '',
      preferred_date: input.preferredDate ?? null,
      time_slot: input.timeSlot ?? '',
      amount: input.amount,
      status: 'pending_payment',
      payment_status: 'pending',
      fault_codes: input.faultCodes ?? [],
      notes: input.notes ?? '',
      leanx_bill_no: input.leanxBillNo ?? null,
      leanx_invoice_ref: input.leanxInvoiceRef ?? null,
      payment_link: input.paymentLink ?? null,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return bookingFromRow(data)
}

export async function updateBooking(
  workshopId: string,
  id: string,
  patch: Partial<{
    status: BookingStatus
    paymentStatus: PaymentStatus
    paymentProvider: string | null
    paymentMethod: string | null
    paymentTransactionId: string | null
    leanxBillNo: string | null
    leanxInvoiceRef: string | null
    paidAt: string | null
  }>,
): Promise<Booking | undefined> {
  const db = getAdminClient()
  const row: Database['public']['Tables']['bookings']['Update'] = {}
  if (patch.status !== undefined) row.status = patch.status
  if (patch.paymentStatus !== undefined) row.payment_status = patch.paymentStatus
  if (patch.paymentProvider !== undefined) row.payment_provider = patch.paymentProvider
  if (patch.paymentMethod !== undefined) row.payment_method = patch.paymentMethod
  if (patch.paymentTransactionId !== undefined) row.payment_transaction_id = patch.paymentTransactionId
  if (patch.leanxBillNo !== undefined) row.leanx_bill_no = patch.leanxBillNo
  if (patch.leanxInvoiceRef !== undefined) row.leanx_invoice_ref = patch.leanxInvoiceRef
  if (patch.paidAt !== undefined) row.paid_at = patch.paidAt

  const { error } = await db.from('bookings').update(row).eq('workshop_id', workshopId).eq('id', id)
  if (error) throw new Error(error.message)
  return getBooking(workshopId, id)
}
