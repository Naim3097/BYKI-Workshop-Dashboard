'use client'

import Link from 'next/link'
import { lineTier, lineUnitPrice, useCart } from '@/components/CartProvider'
import { formatMYR } from '@/lib/format'

export default function CartPage() {
  const { lines, setQty, remove, subtotal, count } = useCart()

  if (lines.length === 0) {
    return (
      <div className="container-page py-12">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold text-ink">Your cart is empty</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Add parts from the shop to begin a retail or bulk order.
          </p>
          <Link href="/" className="btn-primary mt-5">
            Browse parts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-5 text-xl font-semibold text-ink">Your cart ({count})</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card divide-y divide-line">
          {lines.map((line) => {
            const unit = lineUnitPrice(line)
            const tier = lineTier(line)
            return (
              <div key={line.product.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{line.product.name}</p>
                  <p className="text-xs text-ink-muted">SKU {line.product.sku}</p>
                  <p className="mt-1 text-xs">
                    <span className={tier === 'bulk' ? 'text-positive' : 'text-ink-soft'}>
                      {formatMYR(unit)} each ({tier === 'bulk' ? 'bulk' : 'retail'})
                    </span>
                    {tier === 'retail' ? (
                      <span className="text-ink-muted">
                        {' '}
                        | bulk from {line.product.bulkMinQty}
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="flex items-center rounded-card border border-line">
                  <button
                    type="button"
                    aria-label="Decrease"
                    onClick={() => setQty(line.product.id, line.qty - 1)}
                    className="px-3 py-2 text-ink-soft hover:bg-white/5"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={line.qty}
                    onChange={(e) =>
                      setQty(line.product.id, Math.max(1, Math.floor(Number(e.target.value) || 1)))
                    }
                    className="w-12 border-x border-line bg-transparent py-2 text-center text-sm text-ink outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Increase"
                    onClick={() => setQty(line.product.id, line.qty + 1)}
                    className="px-3 py-2 text-ink-soft hover:bg-white/5"
                  >
                    +
                  </button>
                </div>

                <div className="w-24 text-right text-sm font-semibold text-ink">
                  {formatMYR(unit * line.qty)}
                </div>

                <button
                  type="button"
                  onClick={() => remove(line.product.id)}
                  className="text-xs text-danger hover:underline"
                >
                  Remove
                </button>
              </div>
            )
          })}
        </div>

        <div className="card h-fit p-5">
          <h2 className="text-sm font-semibold text-ink">Order summary</h2>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-ink-muted">Subtotal</span>
            <span className="font-semibold text-ink">{formatMYR(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Bulk pricing is already reflected per line where it applies.
          </p>
          <Link href="/checkout" className="btn-primary mt-4 w-full">
            Proceed to checkout
          </Link>
          <Link href="/" className="btn-secondary mt-2 w-full">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
