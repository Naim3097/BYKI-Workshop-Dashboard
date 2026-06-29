// BYKI master-admin aggregates — read ACROSS ALL workshops, with optional
// Workshop + time-range filters. Server only. Uses the service-role client
// (bypasses RLS); callers MUST gate with requireBykiAdmin() first. Aggregation
// is in JS (fine at current scale; move to SQL views/RPC if data grows large).

import { getAdminClient } from '../supabase/admin'

const num = (v: unknown) => Number(v ?? 0)
const PAID_BOOKING = (s: string) => s === 'confirmed' || s === 'completed'

export interface Filter {
  workshopId?: string | null
  from?: string | null // ISO inclusive
  to?: string | null // ISO inclusive
}

// Degrade gracefully: a missing table/column (migration not applied, stale
// PostgREST cache) shows empty metrics, never crashes a screen.
async function rows<T = Record<string, unknown>>(
  table: string,
  columns: string,
  filter?: Filter,
  dateColumn: string = 'created_at',
): Promise<T[]> {
  try {
    let q = getAdminClient().from(table).select(columns)
    if (filter?.workshopId) q = q.eq('workshop_id', filter.workshopId)
    if (filter?.from) q = q.gte(dateColumn, filter.from)
    if (filter?.to) q = q.lte(dateColumn, filter.to)
    const { data, error } = await q
    if (error) {
      console.error(`[byki] ${table}: ${error.message}`)
      return []
    }
    return (data ?? []) as T[]
  } catch (e) {
    console.error(`[byki] ${table}:`, e instanceof Error ? e.message : e)
    return []
  }
}

// All workshops (for the filter dropdown). Never time/tenant filtered.
export async function getWorkshopOptions(): Promise<{ id: string; name: string }[]> {
  const ws = await rows<any>('workshops', 'id, name')
  return ws.map((w) => ({ id: w.id, name: w.name })).sort((a, b) => a.name.localeCompare(b.name))
}

export interface WorkshopStat {
  id: string
  slug: string
  name: string
  active: boolean
  leanxConfigured: boolean
  revenue: number
  ordersPaid: number
  bookingsConfirmed: number
  customers: number
  scans: number
  pending: number
  lastActivity: string | null
}

export async function getWorkshopStats(filter: Filter = {}): Promise<WorkshopStat[]> {
  const [workshops, orders, bookings, customers, scans] = await Promise.all([
    rows<any>('workshops', 'id, slug, name, active, leanx_collection_uuid'),
    rows<any>('orders', 'workshop_id, amount, payment_status, status, created_at', filter),
    rows<any>('bookings', 'workshop_id, amount, status, created_at', filter),
    rows<any>('customers', 'workshop_id, created_at', filter),
    rows<any>('diagnose_sessions', 'workshop_id, created_at', filter),
  ])
  const byId = new Map<string, WorkshopStat>()
  for (const w of workshops) {
    if (filter.workshopId && w.id !== filter.workshopId) continue
    byId.set(w.id, {
      id: w.id, slug: w.slug, name: w.name, active: w.active,
      leanxConfigured: !!w.leanx_collection_uuid,
      revenue: 0, ordersPaid: 0, bookingsConfirmed: 0, customers: 0, scans: 0,
      pending: 0, lastActivity: null,
    })
  }
  const touch = (s: WorkshopStat, at: string) => {
    if (!s.lastActivity || at > s.lastActivity) s.lastActivity = at
  }
  for (const o of orders) {
    const s = byId.get(o.workshop_id); if (!s) continue
    touch(s, o.created_at)
    if (o.payment_status === 'SUCCESS') { s.revenue += num(o.amount); s.ordersPaid += 1 }
    else if (o.status === 'pending_payment') s.pending += num(o.amount)
  }
  for (const b of bookings) {
    const s = byId.get(b.workshop_id); if (!s) continue
    touch(s, b.created_at)
    if (PAID_BOOKING(b.status)) { s.revenue += num(b.amount); s.bookingsConfirmed += 1 }
    else if (b.status === 'pending_payment') s.pending += num(b.amount)
  }
  for (const c of customers) { const s = byId.get(c.workshop_id); if (s) s.customers += 1 }
  for (const d of scans) { const s = byId.get(d.workshop_id); if (s) s.scans += 1 }
  return Array.from(byId.values()).sort((a, b) => b.revenue - a.revenue)
}

export interface NetworkOverview {
  workshops: number
  activeWorkshops: number
  revenue: number
  ordersTotal: number
  ordersPaid: number
  bookingsTotal: number
  bookingsConfirmed: number
  customers: number
  scans: number
  aov: number
  pendingValue: number
  failedRate: number
}

export async function getNetworkOverview(filter: Filter = {}): Promise<NetworkOverview> {
  const stats = await getWorkshopStats(filter)
  const [orders, bookings] = await Promise.all([
    rows<any>('orders', 'payment_status, status', filter),
    rows<any>('bookings', 'payment_status, status', filter),
  ])
  const revenue = stats.reduce((n, s) => n + s.revenue, 0)
  const ordersPaid = stats.reduce((n, s) => n + s.ordersPaid, 0)
  const bookingsConfirmed = stats.reduce((n, s) => n + s.bookingsConfirmed, 0)
  const attempts = [...orders, ...bookings]
  const failed = attempts.filter((r) => r.payment_status === 'FAILED' || r.payment_status === 'CANCELLED').length
  const settled = attempts.filter((r) => r.payment_status === 'SUCCESS').length + failed
  return {
    workshops: stats.length,
    activeWorkshops: stats.filter((s) => s.active).length,
    revenue,
    ordersTotal: orders.length,
    ordersPaid,
    bookingsTotal: bookings.length,
    bookingsConfirmed,
    customers: stats.reduce((n, s) => n + s.customers, 0),
    scans: stats.reduce((n, s) => n + s.scans, 0),
    aov: ordersPaid + bookingsConfirmed ? revenue / (ordersPaid + bookingsConfirmed) : 0,
    pendingValue: stats.reduce((n, s) => n + s.pending, 0),
    failedRate: settled ? failed / settled : 0,
  }
}

// Revenue grouped by calendar month (paid orders + confirmed bookings), last 12
// buckets within the filter window.
export async function getRevenueByMonth(filter: Filter = {}): Promise<{ month: string; revenue: number }[]> {
  const [orders, bookings] = await Promise.all([
    rows<any>('orders', 'amount, payment_status, paid_at, created_at', filter),
    rows<any>('bookings', 'amount, status, paid_at, created_at', filter),
  ])
  const buckets = new Map<string, number>()
  const add = (when: string, amt: number) => {
    const m = (when || '').slice(0, 7) // YYYY-MM
    if (m) buckets.set(m, (buckets.get(m) ?? 0) + amt)
  }
  for (const o of orders) if (o.payment_status === 'SUCCESS') add(o.paid_at || o.created_at, num(o.amount))
  for (const b of bookings) if (PAID_BOOKING(b.status)) add(b.paid_at || b.created_at, num(b.amount))
  return Array.from(buckets.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)
}

export interface ActivityItem {
  kind: 'order' | 'booking' | 'scan'
  workshopName: string
  label: string
  amount: number | null
  status: string
  at: string
}

export async function getRecentActivity(filter: Filter = {}, limit = 15): Promise<ActivityItem[]> {
  const [workshops, orders, bookings, scans] = await Promise.all([
    rows<any>('workshops', 'id, name'),
    rows<any>('orders', 'workshop_id, invoice_ref, amount, status, customer_name, created_at', filter),
    rows<any>('bookings', 'workshop_id, invoice_ref, amount, status, customer_name, service_type, created_at', filter),
    rows<any>('diagnose_sessions', 'workshop_id, source, fault_codes, created_at', filter),
  ])
  const wn = new Map(workshops.map((w) => [w.id, w.name]))
  const items: ActivityItem[] = [
    ...orders.map((o): ActivityItem => ({ kind: 'order', workshopName: wn.get(o.workshop_id) ?? '—', label: `${o.customer_name || 'Order'} · ${o.invoice_ref}`, amount: num(o.amount), status: o.status, at: o.created_at })),
    ...bookings.map((b): ActivityItem => ({ kind: 'booking', workshopName: wn.get(b.workshop_id) ?? '—', label: `${b.customer_name || 'Booking'} · ${b.service_type || 'service'}`, amount: num(b.amount), status: b.status, at: b.created_at })),
    ...scans.map((d): ActivityItem => ({ kind: 'scan', workshopName: wn.get(d.workshop_id) ?? '—', label: `${d.source === 'obd' ? 'OBD scan' : 'CVT sim'} · ${(d.fault_codes ?? []).length} codes`, amount: null, status: '', at: d.created_at })),
  ]
  return items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit)
}

export interface CustomerWithWorkshop {
  id: string
  workshopName: string
  name: string
  phone: string
  email: string
  totalSpent: number
  ordersCount: number
  bookingsCount: number
  vehicles: string[]
  lastSeen: string
}

export async function getAllCustomers(filter: Filter = {}): Promise<CustomerWithWorkshop[]> {
  const [customers, workshops] = await Promise.all([
    rows<any>('customers', '*', filter),
    rows<any>('workshops', 'id, name'),
  ])
  const wname = new Map(workshops.map((w) => [w.id, w.name]))
  return customers
    .map((c) => ({
      id: c.id,
      workshopName: wname.get(c.workshop_id) ?? '—',
      name: c.name,
      phone: c.phone,
      email: c.email,
      totalSpent: num(c.total_spent),
      ordersCount: c.orders_count,
      bookingsCount: c.bookings_count,
      vehicles: c.vehicles ?? [],
      lastSeen: c.last_seen,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
}

export interface DiagnoseAnalytics {
  totalScans: number
  obd: number
  cvtSim: number
  linkedToCustomer: number
  convertedToBooking: number
  conversionRate: number
  topFaultCodes: { code: string; count: number }[]
}

export async function getDiagnoseAnalytics(filter: Filter = {}): Promise<DiagnoseAnalytics> {
  const scans = await rows<any>('diagnose_sessions', 'source, fault_codes, customer_id, booking_id, created_at', filter)
  const counts = new Map<string, number>()
  let obd = 0, cvtSim = 0, linked = 0, converted = 0
  for (const s of scans) {
    if (s.source === 'obd') obd += 1; else cvtSim += 1
    if (s.customer_id) linked += 1
    if (s.booking_id) converted += 1
    for (const code of s.fault_codes ?? []) counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  return {
    totalScans: scans.length, obd, cvtSim, linkedToCustomer: linked, convertedToBooking: converted,
    conversionRate: scans.length ? converted / scans.length : 0,
    topFaultCodes: Array.from(counts.entries()).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count).slice(0, 12),
  }
}

export async function getTopProducts(filter: Filter = {}): Promise<{ name: string; units: number; revenue: number }[]> {
  // Only count items from PAID orders within the window.
  const paidOrders = (await rows<any>('orders', 'id, payment_status', filter)).filter((o) => o.payment_status === 'SUCCESS')
  const ids = new Set(paidOrders.map((o) => o.id))
  const items = await rows<any>('order_items', 'order_id, name, qty, line_total', filter.workshopId ? { workshopId: filter.workshopId } : {})
  const agg = new Map<string, { units: number; revenue: number }>()
  for (const i of items) {
    if (ids.size && !ids.has(i.order_id)) continue
    const cur = agg.get(i.name) ?? { units: 0, revenue: 0 }
    cur.units += i.qty
    cur.revenue += num(i.line_total)
    agg.set(i.name, cur)
  }
  return Array.from(agg.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 20)
}

export async function getBookingStats(filter: Filter = {}): Promise<{
  total: number
  confirmed: number
  deposits: number
  byService: { service: string; count: number }[]
}> {
  const bookings = await rows<any>('bookings', 'service_type, status, amount', filter)
  const byService = new Map<string, number>()
  let confirmed = 0, deposits = 0
  for (const b of bookings) {
    byService.set(b.service_type || '—', (byService.get(b.service_type || '—') ?? 0) + 1)
    if (PAID_BOOKING(b.status)) { confirmed += 1; deposits += num(b.amount) }
  }
  return {
    total: bookings.length, confirmed, deposits,
    byService: Array.from(byService.entries()).map(([service, count]) => ({ service, count })).sort((a, b) => b.count - a.count),
  }
}

export interface BillingMetric {
  workshopId: string
  name: string
  gmv: number
  paidTransactions: number
  paidOrders: number
  confirmedBookings: number
  pending: number
  leanxConfigured: boolean
}

export async function getBillingMetrics(filter: Filter = {}): Promise<BillingMetric[]> {
  const stats = await getWorkshopStats(filter)
  return stats.map((s) => ({
    workshopId: s.id,
    name: s.name,
    gmv: s.revenue,
    paidTransactions: s.ordersPaid + s.bookingsConfirmed,
    paidOrders: s.ordersPaid,
    confirmedBookings: s.bookingsConfirmed,
    pending: s.pending,
    leanxConfigured: s.leanxConfigured,
  }))
}

// ── Workshop drill-down ──────────────────────────────────────────────────────
export interface WorkshopDetail {
  stat: WorkshopStat | null
  revenueByMonth: { month: string; revenue: number }[]
  recent: ActivityItem[]
  topProducts: { name: string; units: number; revenue: number }[]
}

export async function getWorkshopDetail(workshopId: string, filter: Filter = {}): Promise<WorkshopDetail> {
  const scoped: Filter = { ...filter, workshopId }
  const [stats, revenueByMonth, recent, topProducts] = await Promise.all([
    getWorkshopStats(scoped),
    getRevenueByMonth(scoped),
    getRecentActivity(scoped, 12),
    getTopProducts(scoped),
  ])
  return { stat: stats[0] ?? null, revenueByMonth, recent, topProducts }
}
