import type { Booking, Order, Product, StockMovement } from '@/lib/types'

export interface DashboardProduct extends Product {
  stockQty: number
  reorderLevel: number
}

export interface DashboardData {
  orders: Order[]
  bookings: Booking[]
  products: DashboardProduct[]
  movements: StockMovement[]
}
