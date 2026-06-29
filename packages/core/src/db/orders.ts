// Orders + order_items, workshop-scoped. Service-role; server only.

import { getAdminClient } from '../supabase/admin'
import type { Database } from '../supabase/database.types'
import type { Order, OrderChannel, OrderItem, OrderStatus, PaymentStatus } from '../types'
import { orderFromRow } from './mappers'

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderItemRow = Database['public']['Tables']['order_items']['Row']

async function itemsForOrders(orderIds: string[]): Promise<Map<string, OrderItemRow[]>> {
  const map = new Map<string, OrderItemRow[]>()
  if (orderIds.length === 0) return map
  const db = getAdminClient()
  const { data } = await db.from('order_items').select('*').in('order_id', orderIds)
  for (const item of data ?? []) {
    const list = map.get(item.order_id) ?? []
    list.push(item)
    map.set(item.order_id, list)
  }
  return map
}

export async function listOrders(workshopId: string): Promise<Order[]> {
  const db = getAdminClient()
  const { data, error } = await db
    .from('orders')
    .select('*')
    .eq('workshop_id', workshopId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as OrderRow[]
  const items = await itemsForOrders(rows.map((r) => r.id))
  return rows.map((r) => orderFromRow(r, items.get(r.id) ?? []))
}

export async function getOrder(workshopId: string, id: string): Promise<Order | undefined> {
  const db = getAdminClient()
  const { data } = await db
    .from('orders')
    .select('*')
    .eq('workshop_id', workshopId)
    .eq('id', id)
    .maybeSingle()
  if (!data) return undefined
  const items = await itemsForOrders([data.id])
  return orderFromRow(data, items.get(data.id) ?? [])
}

export async function getOrderByInvoiceRef(
  workshopId: string,
  ref: string,
): Promise<Order | undefined> {
  const db = getAdminClient()
  const { data } = await db
    .from('orders')
    .select('*')
    .eq('workshop_id', workshopId)
    .or(`invoice_ref.eq.${ref},leanx_bill_no.eq.${ref},leanx_invoice_ref.eq.${ref}`)
    .maybeSingle()
  if (!data) return undefined
  const items = await itemsForOrders([data.id])
  return orderFromRow(data, items.get(data.id) ?? [])
}

export interface CreateOrderInput {
  invoiceRef: string
  channel: OrderChannel
  customerName: string
  customerEmail: string
  customerPhone: string
  amount: number
  items: Omit<OrderItem, 'id' | 'workshopId' | 'orderId'>[]
  customerId?: string | null
  leanxBillNo?: string | null
  leanxInvoiceRef?: string | null
  paymentLink?: string | null
}

export async function createOrder(workshopId: string, input: CreateOrderInput): Promise<Order> {
  const db = getAdminClient()
  const { data: order, error } = await db
    .from('orders')
    .insert({
      workshop_id: workshopId,
      customer_id: input.customerId ?? null,
      invoice_ref: input.invoiceRef,
      channel: input.channel,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      amount: input.amount,
      status: 'pending_payment',
      payment_status: 'pending',
      leanx_bill_no: input.leanxBillNo ?? null,
      leanx_invoice_ref: input.leanxInvoiceRef ?? null,
      payment_link: input.paymentLink ?? null,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  if (input.items.length > 0) {
    const { error: itemsErr } = await db.from('order_items').insert(
      input.items.map((i) => ({
        workshop_id: workshopId,
        order_id: order.id,
        product_id: i.productId,
        sku: i.sku,
        name: i.name,
        unit_price: i.unitPrice,
        qty: i.qty,
        pricing: i.pricing,
        line_total: i.lineTotal,
      })),
    )
    if (itemsErr) throw new Error(itemsErr.message)
  }
  return (await getOrder(workshopId, order.id))!
}

export async function updateOrder(
  workshopId: string,
  id: string,
  patch: Partial<{
    status: OrderStatus
    paymentStatus: PaymentStatus
    paymentProvider: string | null
    paymentMethod: string | null
    paymentTransactionId: string | null
    leanxBillNo: string | null
    leanxInvoiceRef: string | null
    stockApplied: boolean
    paidAt: string | null
  }>,
): Promise<Order | undefined> {
  const db = getAdminClient()
  const row: Database['public']['Tables']['orders']['Update'] = {}
  if (patch.status !== undefined) row.status = patch.status
  if (patch.paymentStatus !== undefined) row.payment_status = patch.paymentStatus
  if (patch.paymentProvider !== undefined) row.payment_provider = patch.paymentProvider
  if (patch.paymentMethod !== undefined) row.payment_method = patch.paymentMethod
  if (patch.paymentTransactionId !== undefined) row.payment_transaction_id = patch.paymentTransactionId
  if (patch.leanxBillNo !== undefined) row.leanx_bill_no = patch.leanxBillNo
  if (patch.leanxInvoiceRef !== undefined) row.leanx_invoice_ref = patch.leanxInvoiceRef
  if (patch.stockApplied !== undefined) row.stock_applied = patch.stockApplied
  if (patch.paidAt !== undefined) row.paid_at = patch.paidAt

  const { error } = await db.from('orders').update(row).eq('workshop_id', workshopId).eq('id', id)
  if (error) throw new Error(error.message)
  return getOrder(workshopId, id)
}
