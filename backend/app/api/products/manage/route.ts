import { NextRequest, NextResponse } from 'next/server'
import { createProduct, updateProductDetails } from '@/lib/store'
import { categoryLabels } from '@/lib/labels'
import type { ProductCategory } from '@/lib/types'

export const dynamic = 'force-dynamic'

const categories = Object.keys(categoryLabels) as ProductCategory[]

function parseNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : NaN
}

// Create a new product (POST) or update an existing one (PUT). Owner-only:
// gated by middleware. The public GET /api/products is unaffected.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sku = String(body.sku || '').trim()
    const name = String(body.name || '').trim()
    const category = body.category as ProductCategory

    if (!sku || !name) {
      return NextResponse.json({ error: 'SKU and name are required.' }, { status: 400 })
    }
    if (!categories.includes(category)) {
      return NextResponse.json({ error: 'Choose a valid category.' }, { status: 400 })
    }

    const priceRetail = parseNumber(body.priceRetail)
    const priceBulk = parseNumber(body.priceBulk)
    const bulkMinQty = Math.floor(parseNumber(body.bulkMinQty))
    if (!(priceRetail > 0) || !(priceBulk > 0)) {
      return NextResponse.json({ error: 'Retail and bulk prices must be above zero.' }, { status: 400 })
    }
    if (!(bulkMinQty >= 1)) {
      return NextResponse.json({ error: 'Bulk minimum quantity must be at least 1.' }, { status: 400 })
    }

    const product = await createProduct({
      sku,
      name,
      category,
      brand: String(body.brand || '').trim(),
      description: String(body.description || '').trim(),
      priceRetail,
      priceBulk,
      bulkMinQty,
      active: body.active !== false,
      initialStock: Math.max(0, Math.floor(parseNumber(body.initialStock) || 0)),
      reorderLevel: Math.max(0, Math.floor(parseNumber(body.reorderLevel) || 0)),
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) {
      return NextResponse.json({ error: 'Missing product id.' }, { status: 400 })
    }

    const patch: Record<string, unknown> = {}
    if (body.sku != null) patch.sku = String(body.sku).trim()
    if (body.name != null) patch.name = String(body.name).trim()
    if (body.category != null) {
      if (!categories.includes(body.category)) {
        return NextResponse.json({ error: 'Choose a valid category.' }, { status: 400 })
      }
      patch.category = body.category
    }
    if (body.brand != null) patch.brand = String(body.brand).trim()
    if (body.description != null) patch.description = String(body.description).trim()
    if (body.priceRetail != null) {
      const v = parseNumber(body.priceRetail)
      if (!(v > 0)) return NextResponse.json({ error: 'Invalid retail price.' }, { status: 400 })
      patch.priceRetail = v
    }
    if (body.priceBulk != null) {
      const v = parseNumber(body.priceBulk)
      if (!(v > 0)) return NextResponse.json({ error: 'Invalid bulk price.' }, { status: 400 })
      patch.priceBulk = v
    }
    if (body.bulkMinQty != null) {
      const v = Math.floor(parseNumber(body.bulkMinQty))
      if (!(v >= 1)) return NextResponse.json({ error: 'Invalid bulk minimum.' }, { status: 400 })
      patch.bulkMinQty = v
    }
    if (body.reorderLevel != null) patch.reorderLevel = Math.max(0, Math.floor(parseNumber(body.reorderLevel)))
    if (body.active != null) patch.active = Boolean(body.active)

    const product = await updateProductDetails(id, patch)
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }
    return NextResponse.json({ success: true, product })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
