// Customers — workshop-scoped, deduped by phone. Service-role; server only.
// Populated from orders/bookings (we already collect name/phone/email).
//
// IMPORTANT: customer tracking must NEVER block a sale. Every write here degrades
// gracefully (logs + returns null/no-op) if the `customers` table is missing or a
// query fails — so orders/bookings still go through, and customers simply populate
// once migration 0003_customers.sql is applied.

import { getAdminClient } from '../supabase/admin'
import type { Database } from '../supabase/database.types'
import type { CustomerRecord } from '../types'

type CustomerRow = Database['public']['Tables']['customers']['Row']

export function customerFromRow(r: CustomerRow): CustomerRecord {
  return {
    id: r.id,
    workshopId: r.workshop_id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    vehicles: r.vehicles ?? [],
    totalSpent: Number(r.total_spent),
    ordersCount: r.orders_count,
    bookingsCount: r.bookings_count,
    firstSeen: r.first_seen,
    lastSeen: r.last_seen,
    createdAt: r.created_at,
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, '')
}

function warn(fn: string, e: unknown): void {
  console.warn(`[byki] ${fn} skipped:`, e instanceof Error ? e.message : e)
}

// Upsert by (workshop_id, phone): create or refresh name/email/last_seen and
// merge the vehicle. Returns the customer id, or null if phone is blank or the
// customers table is unavailable (never throws — a sale must not depend on this).
export async function upsertCustomer(
  workshopId: string,
  input: { name?: string; phone: string; email?: string; vehicle?: string },
): Promise<string | null> {
  const phone = normalizePhone(input.phone || '')
  if (!phone) return null
  try {
    const db = getAdminClient()
    const now = new Date().toISOString()

    const { data: existing, error: selErr } = await db
      .from('customers')
      .select('id, vehicles')
      .eq('workshop_id', workshopId)
      .eq('phone', phone)
      .maybeSingle()
    if (selErr) throw new Error(selErr.message)

    if (existing) {
      const vehicles = new Set(existing.vehicles ?? [])
      if (input.vehicle) vehicles.add(input.vehicle)
      await db
        .from('customers')
        .update({
          name: input.name || undefined,
          email: input.email || undefined,
          vehicles: Array.from(vehicles),
          last_seen: now,
        })
        .eq('id', existing.id)
      return existing.id
    }

    const { data: created, error } = await db
      .from('customers')
      .insert({
        workshop_id: workshopId,
        name: input.name ?? '',
        phone,
        email: input.email ?? '',
        vehicles: input.vehicle ? [input.vehicle] : [],
        first_seen: now,
        last_seen: now,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return created.id
  } catch (e) {
    warn('upsertCustomer', e)
    return null
  }
}

// Increment lifetime totals after a successful payment. No-op on failure.
export async function bumpCustomerTotals(
  customerId: string,
  delta: { spent?: number; orders?: number; bookings?: number },
): Promise<void> {
  try {
    const db = getAdminClient()
    const { data: c } = await db
      .from('customers')
      .select('total_spent, orders_count, bookings_count')
      .eq('id', customerId)
      .maybeSingle()
    if (!c) return
    await db
      .from('customers')
      .update({
        total_spent: Number(c.total_spent) + (delta.spent ?? 0),
        orders_count: c.orders_count + (delta.orders ?? 0),
        bookings_count: c.bookings_count + (delta.bookings ?? 0),
        last_seen: new Date().toISOString(),
      })
      .eq('id', customerId)
  } catch (e) {
    warn('bumpCustomerTotals', e)
  }
}

export async function listCustomers(workshopId: string): Promise<CustomerRecord[]> {
  try {
    const db = getAdminClient()
    const { data, error } = await db
      .from('customers')
      .select('*')
      .eq('workshop_id', workshopId)
      .order('last_seen', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(customerFromRow)
  } catch (e) {
    warn('listCustomers', e)
    return []
  }
}

// Link a (previously anonymous) diagnose session to a customer + booking. No-op on failure.
export async function linkDiagnoseSession(
  workshopId: string,
  sessionId: string,
  customerId: string,
  bookingId?: string,
): Promise<void> {
  try {
    const db = getAdminClient()
    await db
      .from('diagnose_sessions')
      .update({ customer_id: customerId, booking_id: bookingId ?? null })
      .eq('workshop_id', workshopId)
      .eq('id', sessionId)
  } catch (e) {
    warn('linkDiagnoseSession', e)
  }
}
