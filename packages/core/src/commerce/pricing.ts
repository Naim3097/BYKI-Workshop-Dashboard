// Pricing + order-line construction. Pure + server-safe. The charged amount is
// ALWAYS recomputed here from the catalogue — never trust prices from the client
// (see docs/STANDARD.md and the MNA integration mandate).

import type { OrderItem, PricingTier, Product } from '../types'

export interface PriceResult {
  tier: PricingTier
  unitPrice: number
}

// Bulk pricing applies only when a bulk tier exists and the qty reaches the
// minimum; otherwise retail. Mirrors MNA's wholesale model.
export function priceFor(product: Product, qty: number): PriceResult {
  const canBulk = product.priceBulk != null && qty >= product.bulkMinQty
  return canBulk
    ? { tier: 'bulk', unitPrice: product.priceBulk! }
    : { tier: 'retail', unitPrice: product.priceRetail }
}

export interface RequestedItem {
  productId: string
  qty: number
}

export interface BuiltCart {
  items: Omit<OrderItem, 'id' | 'workshopId' | 'orderId'>[]
  amount: number
}

// Builds priced order lines from a list of resolved products keyed by id.
// Throws on any invalid / unknown / out-of-stock item.
export function buildCart(
  requested: RequestedItem[],
  productsById: Map<string, Product>,
): BuiltCart {
  const items: BuiltCart['items'] = []
  for (const req of requested) {
    const product = productsById.get(req.productId)
    const qty = Math.floor(Number(req.qty))
    if (!product || qty <= 0) throw new Error('Invalid item in cart.')
    if (!product.active || product.comingSoon) throw new Error(`${product.name} is not available.`)
    const { tier, unitPrice } = priceFor(product, qty)
    items.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      unitPrice,
      qty,
      pricing: tier,
      lineTotal: Number((unitPrice * qty).toFixed(2)),
    })
  }
  if (items.length === 0) throw new Error('Cart is empty.')
  const amount = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2))
  return { items, amount }
}

// retail/bulk/owner channel inferred from whether any line used the bulk tier.
export function inferChannel(items: BuiltCart['items']): 'retail' | 'bulk' {
  return items.some((i) => i.pricing === 'bulk') ? 'bulk' : 'retail'
}
