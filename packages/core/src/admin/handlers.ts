// Admin/owner data handlers. Server only. The dashboard (server component) and
// the /api/admin/* routes call these. Auth + workshop scoping are enforced by
// the caller via requireWorkshopAccess (@byki/core/auth); every function here is
// explicitly scoped by workshopId.

import { listBookings } from '../db/bookings'
import { listDiagnoseSessions } from '../db/diagnose'
import { getInventory, listMovements, recordMovement } from '../db/inventory'
import { listOrders } from '../db/orders'
import { createProduct, listProductsWithStock, updateProductDetails } from '../db/products'
import type {
  Booking,
  DiagnoseSession,
  Order,
  ProductWithStock,
  StockMovement,
} from '../types'

export interface DashboardData {
  orders: Order[]
  bookings: Booking[]
  products: ProductWithStock[]
  movements: StockMovement[]
  diagnoseSessions: DiagnoseSession[]
}

// One aggregate call powering the owner dashboard.
export async function getDashboardData(workshopId: string): Promise<DashboardData> {
  const [orders, bookings, products, movements, diagnoseSessions] = await Promise.all([
    listOrders(workshopId),
    listBookings(workshopId),
    listProductsWithStock(workshopId),
    listMovements(workshopId),
    listDiagnoseSessions(workshopId),
  ])
  return { orders, bookings, products, movements, diagnoseSessions }
}

// Re-exported admin actions (already workshop-scoped) so routes import one module.
export { createProduct, updateProductDetails, recordMovement, getInventory }
