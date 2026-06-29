// Data layer — now an ADAPTER over @byki/core (Supabase, shared multi-tenant DB
// scoped to this workshop). Keeps the SAME function signatures + legacy types the
// rest of the app already imports, so pages/components/API routes are unchanged.
// This is what connects MNA to BYKI: every write lands in the shared collections.

import * as core from '@byki/core/db'
import type * as ct from '@byki/core/types'
import { getWorkshopId } from '@byki/core/config'
import type {
  Booking,
  InventoryRecord,
  MovementType,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductCategory,
  ServiceType,
  StockMovement,
} from './types'

const ws = () => getWorkshopId()

// ── core → legacy mappers ───────────────────────────────────────────────────
function toProduct(p: ct.Product): Product {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category as ProductCategory,
    brand: '',
    description: p.description,
    priceRetail: p.priceRetail,
    priceBulk: p.priceBulk ?? p.priceRetail,
    bulkMinQty: p.bulkMinQty,
    active: p.active,
    slug: p.slug,
    specifications: p.specifications,
    compatibleVehicles: p.compatibleVehicles,
    compatibleGearboxes: p.compatibleGearboxes,
    tags: p.tags,
    isFeatured: p.isFeatured,
  }
}

export interface ProductWithStock extends Product {
  stockQty: number
  reorderLevel: number
}

function toProductWithStock(p: ct.ProductWithStock): ProductWithStock {
  return { ...toProduct(p), stockQty: p.stockQty, reorderLevel: p.reorderLevel }
}

function toInventory(i: ct.InventoryRecord): InventoryRecord {
  return { productId: i.productId, stockQty: i.stockQty, reorderLevel: i.reorderLevel, updatedAt: i.updatedAt }
}

function toMovement(m: ct.StockMovement): StockMovement {
  return { id: m.id, productId: m.productId, type: m.type, qty: m.qty, reference: m.reference, note: m.note, createdAt: m.createdAt }
}

function toOrderItem(i: ct.OrderItem): OrderItem {
  return { productId: i.productId, sku: i.sku, name: i.name, unitPrice: i.unitPrice, qty: i.qty, pricing: i.pricing, lineTotal: i.lineTotal }
}

function toOrder(o: ct.Order): Order {
  return {
    id: o.id,
    invoiceRef: o.invoiceRef,
    channel: o.channel,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    items: (o.items ?? []).map(toOrderItem),
    amount: o.amount,
    status: o.status,
    paymentStatus: o.paymentStatus,
    leanxBillNo: o.leanxBillNo,
    leanxInvoiceRef: o.leanxInvoiceRef,
    paymentLink: o.paymentLink,
    paymentProvider: o.paymentProvider,
    paymentMethod: o.paymentMethod,
    paymentTransactionId: o.paymentTransactionId,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    stockApplied: o.stockApplied,
  }
}

// Bookings: legacy uses OrderStatus; core uses booking_status. Map both ways.
function bookingStatusToLegacy(s: ct.Booking['status']): OrderStatus {
  return s === 'confirmed' ? 'paid' : s === 'completed' ? 'fulfilled' : (s as OrderStatus)
}
function bookingStatusToCore(s: OrderStatus): ct.Booking['status'] {
  return s === 'paid' ? 'confirmed' : s === 'fulfilled' ? 'completed' : (s as ct.Booking['status'])
}

function toBooking(b: ct.Booking): Booking {
  return {
    id: b.id,
    invoiceRef: b.invoiceRef,
    serviceType: b.serviceType as ServiceType,
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    customerPhone: b.customerPhone,
    vehicleModel: b.vehicleModel,
    preferredDate: b.preferredDate ?? '',
    timeSlot: b.timeSlot,
    amount: b.amount,
    status: bookingStatusToLegacy(b.status),
    paymentStatus: b.paymentStatus,
    leanxBillNo: b.leanxBillNo,
    leanxInvoiceRef: b.leanxInvoiceRef,
    paymentLink: b.paymentLink,
    paymentTransactionId: b.paymentTransactionId,
    createdAt: b.createdAt,
    paidAt: b.paidAt,
    notes: b.notes,
  }
}

// ── Products & inventory ────────────────────────────────────────────────────
export async function listProducts(): Promise<Product[]> {
  return (await core.listProducts(ws())).map(toProduct)
}
export async function getProduct(id: string): Promise<Product | undefined> {
  const p = await core.getProduct(ws(), id)
  return p ? toProduct(p) : undefined
}
export async function listProductsWithStock(): Promise<ProductWithStock[]> {
  return (await core.listProductsWithStock(ws())).map(toProductWithStock)
}
export async function getInventory(): Promise<InventoryRecord[]> {
  return (await core.getInventory(ws())).map(toInventory)
}

export interface NewProductInput {
  sku: string
  name: string
  category: ProductCategory
  brand: string
  description: string
  priceRetail: number
  priceBulk: number
  bulkMinQty: number
  active: boolean
  initialStock: number
  reorderLevel: number
}

export async function createProduct(input: NewProductInput): Promise<Product> {
  const p = await core.createProduct(ws(), {
    sku: input.sku,
    name: input.name,
    kind: 'part',
    category: input.category,
    description: input.description,
    priceRetail: input.priceRetail,
    priceBulk: input.priceBulk,
    bulkMinQty: input.bulkMinQty,
    active: input.active,
    initialStock: input.initialStock,
    reorderLevel: input.reorderLevel,
  })
  return toProduct(p)
}

export async function updateProductDetails(
  id: string,
  patch: Partial<Omit<Product, 'id'>> & { reorderLevel?: number },
): Promise<Product | undefined> {
  const p = await core.updateProductDetails(ws(), id, {
    name: patch.name,
    sku: patch.sku,
    category: patch.category,
    description: patch.description,
    priceRetail: patch.priceRetail,
    priceBulk: patch.priceBulk,
    bulkMinQty: patch.bulkMinQty,
    active: patch.active,
    isFeatured: patch.isFeatured,
    reorderLevel: patch.reorderLevel,
  })
  return p ? toProduct(p) : undefined
}

export async function listMovements(): Promise<StockMovement[]> {
  return (await core.listMovements(ws())).map(toMovement)
}
export async function recordMovement(input: {
  productId: string
  type: MovementType
  qty: number
  reference?: string
  note?: string
}): Promise<StockMovement> {
  return toMovement(await core.recordMovement(ws(), input))
}

// ── Orders ──────────────────────────────────────────────────────────────────
export async function listOrders(): Promise<Order[]> {
  return (await core.listOrders(ws())).map(toOrder)
}
export async function getOrder(id: string): Promise<Order | undefined> {
  const o = await core.getOrder(ws(), id)
  return o ? toOrder(o) : undefined
}
export async function getOrderByInvoiceRef(ref: string): Promise<Order | undefined> {
  const o = await core.getOrderByInvoiceRef(ws(), ref)
  return o ? toOrder(o) : undefined
}
export async function createOrder(order: Order): Promise<Order> {
  const created = await core.createOrder(ws(), {
    invoiceRef: order.invoiceRef,
    channel: order.channel,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    amount: order.amount,
    items: order.items.map((i) => ({ ...i })),
    leanxBillNo: order.leanxBillNo,
    leanxInvoiceRef: order.leanxInvoiceRef,
    paymentLink: order.paymentLink,
  })
  return toOrder(created)
}
export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined> {
  const o = await core.updateOrder(ws(), id, {
    status: patch.status,
    paymentStatus: patch.paymentStatus,
    paymentProvider: patch.paymentProvider,
    paymentMethod: patch.paymentMethod,
    paymentTransactionId: patch.paymentTransactionId,
    leanxBillNo: patch.leanxBillNo,
    leanxInvoiceRef: patch.leanxInvoiceRef,
    stockApplied: patch.stockApplied,
    paidAt: patch.paidAt,
  })
  return o ? toOrder(o) : undefined
}

// ── Bookings ────────────────────────────────────────────────────────────────
export async function listBookings(): Promise<Booking[]> {
  return (await core.listBookings(ws())).map(toBooking)
}
export async function getBooking(id: string): Promise<Booking | undefined> {
  const b = await core.getBooking(ws(), id)
  return b ? toBooking(b) : undefined
}
export async function getBookingByInvoiceRef(ref: string): Promise<Booking | undefined> {
  const b = await core.getBookingByInvoiceRef(ws(), ref)
  return b ? toBooking(b) : undefined
}
export async function createBooking(booking: Booking): Promise<Booking> {
  const created = await core.createBooking(ws(), {
    invoiceRef: booking.invoiceRef,
    serviceType: booking.serviceType,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    vehicleModel: booking.vehicleModel,
    preferredDate: booking.preferredDate || null,
    timeSlot: booking.timeSlot,
    amount: booking.amount,
    notes: booking.notes,
    leanxBillNo: booking.leanxBillNo,
    leanxInvoiceRef: booking.leanxInvoiceRef,
    paymentLink: booking.paymentLink,
  })
  return toBooking(created)
}
export async function updateBooking(id: string, patch: Partial<Booking>): Promise<Booking | undefined> {
  const b = await core.updateBooking(ws(), id, {
    status: patch.status ? bookingStatusToCore(patch.status) : undefined,
    paymentStatus: patch.paymentStatus,
    paymentTransactionId: patch.paymentTransactionId,
    leanxBillNo: patch.leanxBillNo,
    leanxInvoiceRef: patch.leanxInvoiceRef,
    paidAt: patch.paidAt,
  })
  return b ? toBooking(b) : undefined
}
