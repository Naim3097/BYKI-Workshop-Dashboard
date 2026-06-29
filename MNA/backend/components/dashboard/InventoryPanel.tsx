'use client'

import { useMemo, useState } from 'react'
import { formatDateTime } from '@/lib/format'
import { StockBadge } from '@/components/ui'
import { ProductFormModal } from './ProductFormModal'
import type { DashboardData, DashboardProduct } from './types'

type ActionMode = 'restock' | 'workshop_use'

export function InventoryPanel({
  data,
  onChanged,
}: {
  data: DashboardData
  onChanged: () => void
}) {
  const [action, setAction] = useState<{ product: DashboardProduct; mode: ActionMode } | null>(null)
  // null = closed; { product: undefined } = add; { product } = edit
  const [productForm, setProductForm] = useState<{ product?: DashboardProduct } | null>(null)

  const productMap = useMemo(
    () => new Map(data.products.map((p) => [p.id, p])),
    [data.products],
  )

  const workshopMovements = data.movements
    .filter((m) => m.type === 'workshop_use')
    .slice(0, 12)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="card overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-line p-4">
          <div>
            <h3 className="text-sm font-semibold text-ink">Inventory</h3>
            <p className="mt-0.5 text-xs text-ink-muted">
              Add products, take in deliveries, or consume stock for the workshop.
              Every change is recorded and reflected here immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setProductForm({})}
            className="btn-primary shrink-0 px-3 py-2 text-xs"
          >
            Add product
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-2.5 font-medium">Part</th>
                <th className="px-4 py-2.5 font-medium">Stock</th>
                <th className="px-4 py-2.5 font-medium">Reorder at</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.products.map((p) => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">
                      {p.name}
                      {!p.active ? (
                        <span className="badge ml-2 bg-ink/10 text-ink-muted">Hidden</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-ink-muted">SKU {p.sku}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge stockQty={p.stockQty} reorderLevel={p.reorderLevel} />
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{p.reorderLevel}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setProductForm({ product: p })}
                        className="rounded-card border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-white/5"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setAction({ product: p, mode: 'restock' })}
                        className="rounded-card border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-white/5"
                      >
                        Add stock
                      </button>
                      <button
                        type="button"
                        onClick={() => setAction({ product: p, mode: 'workshop_use' })}
                        className="rounded-card border border-warning/40 bg-warning/5 px-2.5 py-1.5 text-xs font-medium text-warning hover:bg-warning/10"
                      >
                        Use in workshop
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distinct panel so own-workshop consumption is never hidden in sales. */}
      <div className="card h-fit border-warning/30 bg-warning/5 p-4">
        <h3 className="text-sm font-semibold text-warning">Workshop usage</h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          Stock consumed by the owner's own workshop, kept separate from sales.
        </p>
        <div className="mt-3 space-y-2">
          {workshopMovements.length === 0 ? (
            <p className="text-sm text-ink-muted">No workshop usage recorded yet.</p>
          ) : (
            workshopMovements.map((m) => {
              const product = productMap.get(m.productId)
              return (
                <div key={m.id} className="rounded-card border border-warning/20 bg-surface p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">
                      {product?.name ?? m.productId}
                    </span>
                    <span className="text-sm font-semibold text-warning">{m.qty}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {m.reference}
                    {m.note ? ` | ${m.note}` : ''} | {formatDateTime(m.createdAt)}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>

      {action ? (
        <StockActionModal
          product={action.product}
          mode={action.mode}
          onClose={() => setAction(null)}
          onDone={() => {
            setAction(null)
            onChanged()
          }}
        />
      ) : null}

      {productForm ? (
        <ProductFormModal
          product={productForm.product}
          onClose={() => setProductForm(null)}
          onDone={() => {
            setProductForm(null)
            onChanged()
          }}
        />
      ) : null}
    </div>
  )
}

function StockActionModal({
  product,
  mode,
  onClose,
  onDone,
}: {
  product: DashboardProduct
  mode: ActionMode
  onClose: () => void
  onDone: () => void
}) {
  const [qty, setQty] = useState(1)
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isRestock = mode === 'restock'

  const submit = async () => {
    setError('')
    if (qty <= 0) {
      setError('Enter a quantity above zero.')
      return
    }
    if (!isRestock && qty > product.stockQty) {
      setError(`Only ${product.stockQty} in stock.`)
      return
    }
    setSubmitting(true)
    const url = isRestock ? '/api/inventory/restock' : '/api/inventory/workshop-use'
    const body = isRestock
      ? { productId: product.id, qty, note }
      : { productId: product.id, qty, reference, note }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      onDone()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Could not save.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-sm bg-surface p-5">
        <h3 className="text-base font-semibold text-ink">
          {isRestock ? 'Add stock' : 'Use in workshop'}
        </h3>
        <p className="mt-0.5 text-sm text-ink-muted">{product.name}</p>
        <p className="mt-0.5 text-xs text-ink-muted">Current stock: {product.stockQty}</p>

        <div className="mt-4">
          <label className="label" htmlFor="qty">Quantity</label>
          <input
            id="qty"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            className="input"
          />
        </div>

        {!isRestock ? (
          <div className="mt-3">
            <label className="label" htmlFor="ref">Job reference</label>
            <input
              id="ref"
              className="input"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. WS-1042 (Golf Mk7 gearbox)"
            />
          </div>
        ) : null}

        <div className="mt-3">
          <label className="label" htmlFor="note">Note (optional)</label>
          <input
            id="note"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isRestock ? 'Supplier / delivery note' : 'Reason'}
          />
        </div>

        {error ? (
          <p className="mt-3 rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Saving...' : isRestock ? 'Add stock' : 'Record usage'}
          </button>
        </div>
      </div>
    </div>
  )
}
