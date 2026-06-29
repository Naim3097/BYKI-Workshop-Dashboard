import { NextResponse } from 'next/server'
import { listProductsWithStock } from '@byki/core/db'
import { corsHeaders } from '@/lib/cors'
import { workshop } from '@/lib/workshop'

export const dynamic = 'force-dynamic'

// Public catalogue (core ProductWithStock shape) — used by the shared cart drawer
// to resolve names/prices for display. The charged amount is always recomputed
// server-side at checkout.
export async function GET() {
  const products = await listProductsWithStock(workshop.id)
  return NextResponse.json({ products: products.filter((p) => p.active) }, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}
