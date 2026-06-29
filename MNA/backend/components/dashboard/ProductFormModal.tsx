'use client'

import { useState } from 'react'
import { categoryLabels } from '@/lib/labels'
import type { ProductCategory } from '@/lib/types'
import type { DashboardProduct } from './types'

const categories = Object.keys(categoryLabels) as ProductCategory[]

interface FormState {
  sku: string
  name: string
  category: ProductCategory
  brand: string
  description: string
  priceRetail: string
  priceBulk: string
  bulkMinQty: string
  reorderLevel: string
  initialStock: string
  active: boolean
}

function initialState(product?: DashboardProduct): FormState {
  return {
    sku: product?.sku ?? '',
    name: product?.name ?? '',
    category: product?.category ?? 'cvt_belt',
    brand: product?.brand ?? '',
    description: product?.description ?? '',
    priceRetail: product ? String(product.priceRetail) : '',
    priceBulk: product ? String(product.priceBulk) : '',
    bulkMinQty: product ? String(product.bulkMinQty) : '1',
    reorderLevel: product ? String(product.reorderLevel) : '0',
    initialStock: '0',
    active: product ? product.active : true,
  }
}

// Add a new product (no product passed) or edit an existing one. Initial stock
// is only shown when creating; existing stock is changed via Add stock / Use in
// workshop so it always leaves a movement.
export function ProductFormModal({
  product,
  onClose,
  onDone,
}: {
  product?: DashboardProduct
  onClose: () => void
  onDone: () => void
}) {
  const isEdit = Boolean(product)
  const [form, setForm] = useState<FormState>(() => initialState(product))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const submit = async () => {
    setError('')
    setSubmitting(true)
    const payload = {
      ...(isEdit ? { id: product!.id } : {}),
      sku: form.sku,
      name: form.name,
      category: form.category,
      brand: form.brand,
      description: form.description,
      priceRetail: Number(form.priceRetail),
      priceBulk: Number(form.priceBulk),
      bulkMinQty: Number(form.bulkMinQty),
      reorderLevel: Number(form.reorderLevel),
      active: form.active,
      ...(isEdit ? {} : { initialStock: Number(form.initialStock) }),
    }
    const res = await fetch('/api/products/manage', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      onDone()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Could not save the product.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto bg-surface p-5">
        <h3 className="text-base font-semibold text-ink">
          {isEdit ? 'Edit product' : 'Add product'}
        </h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="f-sku">SKU</label>
            <input id="f-sku" className="input" value={form.sku}
              onChange={(e) => set({ sku: e.target.value })} placeholder="e.g. TRN-ATF-DQ200" />
          </div>
          <div>
            <label className="label" htmlFor="f-cat">Category</label>
            <select id="f-cat" className="input" value={form.category}
              onChange={(e) => set({ category: e.target.value as ProductCategory })}>
              {categories.map((c) => (
                <option key={c} value={c}>{categoryLabels[c]}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="f-name">Name</label>
            <input id="f-name" className="input" value={form.name}
              onChange={(e) => set({ name: e.target.value })} placeholder="Product name" />
          </div>
          <div>
            <label className="label" htmlFor="f-brand">Brand</label>
            <input id="f-brand" className="input" value={form.brand}
              onChange={(e) => set({ brand: e.target.value })} placeholder="e.g. Bosch" />
          </div>
          <div>
            <label className="label" htmlFor="f-reorder">Reorder level</label>
            <input id="f-reorder" type="number" min={0} className="input" value={form.reorderLevel}
              onChange={(e) => set({ reorderLevel: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="f-desc">Description</label>
            <textarea id="f-desc" className="input min-h-16" value={form.description}
              onChange={(e) => set({ description: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="f-retail">Retail price (MYR)</label>
            <input id="f-retail" type="number" min={0} step="0.01" className="input" value={form.priceRetail}
              onChange={(e) => set({ priceRetail: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <label className="label" htmlFor="f-bulk">Bulk price (MYR)</label>
            <input id="f-bulk" type="number" min={0} step="0.01" className="input" value={form.priceBulk}
              onChange={(e) => set({ priceBulk: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <label className="label" htmlFor="f-min">Bulk applies from (qty)</label>
            <input id="f-min" type="number" min={1} className="input" value={form.bulkMinQty}
              onChange={(e) => set({ bulkMinQty: e.target.value })} />
          </div>
          {!isEdit ? (
            <div>
              <label className="label" htmlFor="f-stock">Initial stock</label>
              <input id="f-stock" type="number" min={0} className="input" value={form.initialStock}
                onChange={(e) => set({ initialStock: e.target.value })} />
            </div>
          ) : null}
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={form.active}
            onChange={(e) => set({ active: e.target.checked })} />
          Show on storefront (active)
        </label>

        {error ? (
          <p className="mt-3 rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="button" onClick={submit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </div>
    </div>
  )
}
