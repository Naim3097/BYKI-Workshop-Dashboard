import { NextResponse } from 'next/server'
import { listProductsWithStock } from '@byki/core/db'
import { workshop } from '@/config/workshop'

export const dynamic = 'force-dynamic'

// Public catalogue for this workshop (used by the cart to resolve names/prices
// for display; the charged amount is always recomputed server-side at checkout).
export async function GET() {
  const products = await listProductsWithStock(workshop.id)
  return NextResponse.json({ products: products.filter((p) => p.active) })
}
