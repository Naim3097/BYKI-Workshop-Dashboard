// Shared domain types. These mirror the Supabase tables defined in
// supabase/schema.sql so the file-backed store can be swapped for Supabase
// queries without touching the rest of the app.

// Categories mirror the existing bengkelgearbox.my storefront catalogue.
export type ProductCategory =
  | 'cvt_belt'
  | 'valve_body'
  | 'torque_conv'
  | 'clutch_plate'
  | 'steel_plate'
  | 'auto_filter'
  | 'forward_drum'
  | 'oil_pump'
  | 'piston_seal'
  | 'overhaul_kit'
  | 'lubricants'

export interface Product {
  id: string
  sku: string
  name: string
  category: ProductCategory
  brand: string
  description: string
  // Prices are stored in MYR (whole ringgit with sen as decimals).
  // priceRetail/priceBulk/bulkMinQty map to the storefront's
  // price/wholesalePrice/minWholesaleQty at the /api/catalog boundary.
  priceRetail: number
  priceBulk: number
  // Minimum quantity that unlocks bulk (wholesale) pricing.
  bulkMinQty: number
  active: boolean
  // Rich descriptive fields carried from the storefront catalogue. Optional so
  // products created from the dashboard need not supply them.
  slug?: string
  specifications?: Record<string, string>
  compatibleVehicles?: string[]
  compatibleGearboxes?: string[]
  tags?: string[]
  isFeatured?: boolean
}

export interface InventoryRecord {
  productId: string
  // Quantity physically available to sell or use.
  stockQty: number
  // Re-order threshold used to flag low stock on the dashboard.
  reorderLevel: number
  updatedAt: string
}

export type MovementType = 'restock' | 'sale' | 'workshop_use' | 'adjustment'

export interface StockMovement {
  id: string
  productId: string
  type: MovementType
  // Positive for restock, negative for sale / workshop_use.
  qty: number
  // Free-text reference: order id, workshop job ref, supplier note, etc.
  reference: string
  note: string
  createdAt: string
}

export type OrderChannel = 'retail' | 'bulk' | 'owner'

export type PaymentStatus =
  | 'pending'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'cancelled'
  | 'fulfilled'

export interface OrderItem {
  productId: string
  sku: string
  name: string
  unitPrice: number
  qty: number
  // Which price tier was applied at time of sale.
  pricing: 'retail' | 'bulk'
  lineTotal: number
}

export interface Order {
  id: string
  invoiceRef: string
  channel: OrderChannel
  customerName: string
  customerEmail: string
  customerPhone: string
  items: OrderItem[]
  amount: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  // LeanX references captured from the gateway (or simulated in mock mode).
  leanxBillNo: string | null
  leanxInvoiceRef: string | null
  paymentLink: string | null
  paymentProvider: string | null
  paymentMethod: string | null
  paymentTransactionId: string | null
  createdAt: string
  paidAt: string | null
  // True once the success webhook has decremented stock, so we never double-deduct.
  stockApplied: boolean
}

export type ServiceType =
  | 'transmission_inspection'
  | 'general_service'
  | 'diagnostic'
  | 'fluid_change'

export interface Booking {
  id: string
  invoiceRef: string
  serviceType: ServiceType
  customerName: string
  customerEmail: string
  customerPhone: string
  vehicleModel: string
  preferredDate: string
  timeSlot: string
  // Deposit collected up front (MYR).
  amount: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  leanxBillNo: string | null
  leanxInvoiceRef: string | null
  paymentLink: string | null
  paymentTransactionId: string | null
  createdAt: string
  paidAt: string | null
  notes: string
}

export interface StoreData {
  products: Product[]
  inventory: InventoryRecord[]
  movements: StockMovement[]
  orders: Order[]
  bookings: Booking[]
}
