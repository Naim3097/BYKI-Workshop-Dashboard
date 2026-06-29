import { NextResponse } from 'next/server'
import {
  listBookings,
  listMovements,
  listOrders,
  listProductsWithStock,
} from '@/lib/store'

export const dynamic = 'force-dynamic'

// One call powering the owner dashboard so it can poll cheaply and stay current.
export async function GET() {
  const [orders, bookings, products, movements] = await Promise.all([
    listOrders(),
    listBookings(),
    listProductsWithStock(),
    listMovements(),
  ])
  return NextResponse.json({ orders, bookings, products, movements })
}
