// Shared domain types. These mirror the Supabase tables in
// supabase/migrations/0001_init.sql. camelCase here; the db/ layer maps to/from
// the snake_case columns so the rest of the platform never touches raw rows.

export type ProductKind = 'service' | 'device' | 'part'
export type MovementType = 'restock' | 'sale' | 'workshop_use' | 'adjustment'
export type OrderChannel = 'retail' | 'bulk' | 'owner'
export type PaymentStatus = 'pending' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
export type OrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'fulfilled'
export type BookingStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'completed'
export type UserRole = 'owner' | 'staff' | 'byki_admin'
export type DiagnoseSource = 'obd' | 'cvt_sim'
export type PricingTier = 'retail' | 'bulk'

export interface Workshop {
  id: string
  slug: string
  name: string
  leanxCollectionUuid: string | null
  settings: Record<string, unknown>
  active: boolean
  createdAt: string
}

export interface Profile {
  id: string
  workshopId: string | null
  role: UserRole
  fullName: string
  createdAt: string
}

export interface Product {
  id: string
  workshopId: string
  slug: string
  sku: string
  kind: ProductKind
  category: string
  name: string
  description: string
  shortDescription: string
  image: string | null
  priceRetail: number
  priceBulk: number | null
  bulkMinQty: number
  originalPrice: number | null
  depositAmount: number | null
  specifications: Record<string, string>
  compatibleVehicles: string[]
  compatibleGearboxes: string[]
  tags: string[]
  inStock: boolean
  comingSoon: boolean
  isFeatured: boolean
  active: boolean
  createdAt: string
}

export interface InventoryRecord {
  workshopId: string
  productId: string
  stockQty: number
  reorderLevel: number
  updatedAt: string
}

export interface ProductWithStock extends Product {
  stockQty: number
  reorderLevel: number
}

export interface StockMovement {
  id: string
  workshopId: string
  productId: string
  type: MovementType
  qty: number
  reference: string
  note: string
  createdAt: string
}

export interface OrderItem {
  id?: string
  workshopId: string
  orderId?: string
  productId: string
  sku: string
  name: string
  unitPrice: number
  qty: number
  pricing: PricingTier
  lineTotal: number
}

export interface Order {
  id: string
  workshopId: string
  invoiceRef: string
  channel: OrderChannel
  customerName: string
  customerEmail: string
  customerPhone: string
  amount: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  leanxBillNo: string | null
  leanxInvoiceRef: string | null
  paymentLink: string | null
  paymentProvider: string | null
  paymentMethod: string | null
  paymentTransactionId: string | null
  stockApplied: boolean
  createdAt: string
  paidAt: string | null
  items?: OrderItem[]
}

export interface Booking {
  id: string
  workshopId: string
  invoiceRef: string
  serviceType: string
  customerName: string
  customerEmail: string
  customerPhone: string
  vehicleModel: string
  preferredDate: string | null
  timeSlot: string
  amount: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  leanxBillNo: string | null
  leanxInvoiceRef: string | null
  paymentLink: string | null
  paymentProvider: string | null
  paymentMethod: string | null
  paymentTransactionId: string | null
  faultCodes: string[]
  notes: string
  createdAt: string
  paidAt: string | null
}

export interface DiagnoseSession {
  id: string
  workshopId: string
  bookingId: string | null
  source: DiagnoseSource
  vehicleModel: string
  faultCodes: string[]
  payload: Record<string, unknown>
  createdAt: string
}

export interface Customer {
  name: string
  email: string
  phone: string
}

// First-class customer record (workshop-scoped, deduped by phone).
export interface CustomerRecord {
  id: string
  workshopId: string
  name: string
  phone: string
  email: string
  vehicles: string[]
  totalSpent: number
  ordersCount: number
  bookingsCount: number
  firstSeen: string
  lastSeen: string
  createdAt: string
}
