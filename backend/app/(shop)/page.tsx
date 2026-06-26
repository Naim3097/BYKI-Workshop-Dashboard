'use client'

import { useEffect, useMemo, useState } from 'react'
import { ProductCard, type StoreProduct } from '@/components/ProductCard'
import { categoryLabels } from '@/lib/labels'
import type { ProductCategory } from '@/lib/types'

type Filter = 'all' | ProductCategory

export default function StorefrontPage() {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const set = new Set<ProductCategory>(products.map((p) => p.category))
    return Array.from(set)
  }, [products])

  const visible = useMemo(
    () => (filter === 'all' ? products : products.filter((p) => p.category === filter)),
    [products, filter],
  )

  return (
    <div className="container-page py-8">
      <section className="card mb-6 p-6">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">
          Vehicle spare parts, retail and bulk supply
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Buy single units at retail, or reach the bulk quantity on any part to
          unlock trade pricing automatically. Bulk pricing applies at checkout the
          moment your quantity meets the threshold shown on each part.
        </p>
      </section>

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          All parts
        </FilterChip>
        {categories.map((c) => (
          <FilterChip key={c} active={filter === c} onClick={() => setFilter(c)}>
            {categoryLabels[c]}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading parts...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-brand bg-brand text-white'
          : 'border-line bg-surface text-ink-soft hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  )
}
