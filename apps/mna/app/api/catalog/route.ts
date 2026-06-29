import { NextResponse } from 'next/server'
import { listProductsWithStock } from '@/lib/store'
import { corsHeaders } from '@/lib/cors'

export const dynamic = 'force-dynamic'

// Public catalogue for the static storefront. Returns products in the exact shape
// the existing window.MNACatalog expects, so assets/catalog.js only needs to
// change its data SOURCE (fetch this) and keep all its helpers untouched.
export async function GET() {
  const products = await listProductsWithStock()

  const payload = products
    .filter((p) => p.active)
    .map((p) => {
      const stockStatus =
        p.stockQty <= 0
          ? 'out_of_stock'
          : p.stockQty <= p.reorderLevel
            ? 'low_stock'
            : 'in_stock'
      return {
        id: p.id,
        name: p.name,
        slug: p.slug ?? p.id,
        sku: p.sku,
        category: p.category,
        description: p.description,
        specifications: p.specifications ?? {},
        compatibleVehicles: p.compatibleVehicles ?? [],
        compatibleGearboxes: p.compatibleGearboxes ?? [],
        // Storefront field names:
        price: p.priceRetail,
        wholesalePrice: p.priceBulk,
        minWholesaleQty: p.bulkMinQty,
        stockQty: p.stockQty,
        lowStockThreshold: p.reorderLevel,
        stockStatus,
        tags: p.tags ?? [],
        isFeatured: p.isFeatured ?? false,
      }
    })

  return NextResponse.json({ products: payload }, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}
