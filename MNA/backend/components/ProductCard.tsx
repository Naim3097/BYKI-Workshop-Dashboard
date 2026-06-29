'use client'

import { useState } from 'react'
import type { Product } from '@/lib/types'
import { categoryLabels } from '@/lib/labels'
import { formatMYR } from '@/lib/format'
import { useCart } from './CartProvider'
import { StockBadge } from './ui'

export interface StoreProduct extends Product {
  stockQty: number
  reorderLevel: number
}

export function ProductCard({ product }: { product: StoreProduct }) {
  const { add } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const bulkActive = qty >= product.bulkMinQty
  const unitPrice = bulkActive ? product.priceBulk : product.priceRetail
  const outOfStock = product.stockQty <= 0

  const onAdd = () => {
    add(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            {categoryLabels[product.category]}
            {product.brand ? ` | ${product.brand}` : ''}
          </p>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-ink">
            {product.name}
          </h3>
          <p className="mt-0.5 text-xs text-ink-muted">SKU {product.sku}</p>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{product.description}</p>

      <div className="mt-3">
        <StockBadge stockQty={product.stockQty} reorderLevel={product.reorderLevel} />
      </div>

      <div className="mt-4 rounded-card bg-canvas p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-ink-muted">Retail (each)</span>
          <span
            className={`text-sm font-semibold ${
              bulkActive ? 'text-ink-muted line-through' : 'text-ink'
            }`}
          >
            {formatMYR(product.priceRetail)}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xs text-ink-muted">
            Bulk (from {product.bulkMinQty})
          </span>
          <span
            className={`text-sm font-semibold ${
              bulkActive ? 'text-positive' : 'text-ink-soft'
            }`}
          >
            {formatMYR(product.priceBulk)}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-card border border-line">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-ink-soft hover:bg-white/5"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              className="w-12 border-x border-line bg-transparent py-2 text-center text-sm text-ink outline-none"
            />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => q + 1)}
              className="px-3 py-2 text-ink-soft hover:bg-white/5"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={outOfStock}
            className="btn-primary flex-1"
          >
            {outOfStock ? 'Out of stock' : added ? 'Added' : 'Add to cart'}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-ink-muted">
          Line total {formatMYR(unitPrice * qty)}
          {bulkActive ? ' (bulk price applied)' : ''}
        </p>
      </div>
    </div>
  )
}
