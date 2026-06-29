import { NextResponse } from 'next/server'
import { listProductsWithStock } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const products = await listProductsWithStock()
  return NextResponse.json({ products: products.filter((p) => p.active) })
}
