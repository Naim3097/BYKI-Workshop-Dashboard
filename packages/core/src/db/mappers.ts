// Row (snake_case) <-> domain (camelCase) mappers. The rest of the platform only
// ever sees domain types from @byki/core/types.

import type { Database } from '../supabase/database.types'
import type {
  Booking,
  DiagnoseSession,
  Order,
  OrderItem,
  Product,
  StockMovement,
} from '../types'

type Tables = Database['public']['Tables']
type ProductRow = Tables['products']['Row']
type OrderRow = Tables['orders']['Row']
type OrderItemRow = Tables['order_items']['Row']
type BookingRow = Tables['bookings']['Row']
type MovementRow = Tables['stock_movements']['Row']
type DiagnoseRow = Tables['diagnose_sessions']['Row']

export function productFromRow(r: ProductRow): Product {
  return {
    id: r.id,
    workshopId: r.workshop_id,
    slug: r.slug,
    sku: r.sku,
    kind: r.kind,
    category: r.category,
    name: r.name,
    description: r.description,
    shortDescription: r.short_description,
    image: r.image,
    priceRetail: Number(r.price_retail),
    priceBulk: r.price_bulk == null ? null : Number(r.price_bulk),
    bulkMinQty: r.bulk_min_qty,
    originalPrice: r.original_price == null ? null : Number(r.original_price),
    depositAmount: r.deposit_amount == null ? null : Number(r.deposit_amount),
    specifications: (r.specifications as Record<string, string>) ?? {},
    compatibleVehicles: r.compatible_vehicles ?? [],
    compatibleGearboxes: r.compatible_gearboxes ?? [],
    tags: r.tags ?? [],
    inStock: r.in_stock,
    comingSoon: r.coming_soon,
    isFeatured: r.is_featured,
    active: r.active,
    createdAt: r.created_at,
  }
}

export function orderItemFromRow(r: OrderItemRow): OrderItem {
  return {
    id: r.id,
    workshopId: r.workshop_id,
    orderId: r.order_id,
    productId: r.product_id,
    sku: r.sku,
    name: r.name,
    unitPrice: Number(r.unit_price),
    qty: r.qty,
    pricing: r.pricing === 'bulk' ? 'bulk' : 'retail',
    lineTotal: Number(r.line_total),
  }
}

export function orderFromRow(r: OrderRow, items?: OrderItemRow[]): Order {
  return {
    id: r.id,
    workshopId: r.workshop_id,
    invoiceRef: r.invoice_ref,
    channel: r.channel,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    amount: Number(r.amount),
    status: r.status,
    paymentStatus: r.payment_status,
    leanxBillNo: r.leanx_bill_no,
    leanxInvoiceRef: r.leanx_invoice_ref,
    paymentLink: r.payment_link,
    paymentProvider: r.payment_provider,
    paymentMethod: r.payment_method,
    paymentTransactionId: r.payment_transaction_id,
    stockApplied: r.stock_applied,
    createdAt: r.created_at,
    paidAt: r.paid_at,
    items: items?.map(orderItemFromRow),
  }
}

export function bookingFromRow(r: BookingRow): Booking {
  return {
    id: r.id,
    workshopId: r.workshop_id,
    invoiceRef: r.invoice_ref,
    serviceType: r.service_type,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    vehicleModel: r.vehicle_model,
    preferredDate: r.preferred_date,
    timeSlot: r.time_slot,
    amount: Number(r.amount),
    status: r.status,
    paymentStatus: r.payment_status,
    leanxBillNo: r.leanx_bill_no,
    leanxInvoiceRef: r.leanx_invoice_ref,
    paymentLink: r.payment_link,
    paymentProvider: r.payment_provider,
    paymentMethod: r.payment_method,
    paymentTransactionId: r.payment_transaction_id,
    faultCodes: r.fault_codes ?? [],
    notes: r.notes,
    createdAt: r.created_at,
    paidAt: r.paid_at,
  }
}

export function movementFromRow(r: MovementRow): StockMovement {
  return {
    id: r.id,
    workshopId: r.workshop_id,
    productId: r.product_id,
    type: r.type,
    qty: r.qty,
    reference: r.reference,
    note: r.note,
    createdAt: r.created_at,
  }
}

export function diagnoseFromRow(r: DiagnoseRow): DiagnoseSession {
  return {
    id: r.id,
    workshopId: r.workshop_id,
    bookingId: r.booking_id,
    source: r.source,
    vehicleModel: r.vehicle_model,
    faultCodes: r.fault_codes ?? [],
    payload: (r.payload as Record<string, unknown>) ?? {},
    createdAt: r.created_at,
  }
}
