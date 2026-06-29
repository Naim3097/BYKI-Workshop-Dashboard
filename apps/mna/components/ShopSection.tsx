'use client'

// Spare-parts shop — the storefront's `.scard` look, reproduced in React. Adds to
// the SHARED core cart store and opens the core CartDrawer (checkout → /api/create-
// payment → Supabase/BYKI). Search + category chips + show-all, like the storefront.

import { useMemo, useState } from 'react'
import { useCart, useCartUI } from '@byki/core/commerce'
import { formatMYR } from '@byki/core/format'
import { categoryLabels } from '@/lib/labels'
import type { ProductWithStock } from '@byki/core/types'

const TOP_N = 8

function catLabel(slug: string) {
  return (categoryLabels as Record<string, string>)[slug] ?? slug.replace(/_/g, ' ')
}

export function ShopSection({ products }: { products: ProductWithStock[] }) {
  const add = useCart((s) => s.add)
  const openCart = useCartUI((s) => s.openCart)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [showAll, setShowAll] = useState(false)

  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => p.category && set.add(p.category))
    return Array.from(set)
  }, [products])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return products.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false
      if (!query) return true
      const hay = [p.name, p.sku, p.category, (p.tags ?? []).join(' ')].join(' ').toLowerCase()
      return hay.includes(query)
    })
  }, [products, q, cat])

  const isDefault = !q && cat === 'all'
  const ordered = useMemo(() => {
    if (!isDefault) return filtered
    return [...filtered].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
  }, [filtered, isDefault])
  const shown = showAll ? ordered : ordered.slice(0, TOP_N)

  return (
    <div>
      {/* tools */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="relative">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 stroke-ink-muted" fill="none" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setShowAll(false) }}
            type="search"
            placeholder="Search parts, SKU, vehicle or gearbox"
            aria-label="Search spare parts"
            className="w-full rounded-card border border-line bg-night/55 py-3 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={cat === 'all'} onClick={() => { setCat('all'); setShowAll(false) }}>All parts</Chip>
          {categories.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => { setCat(c); setShowAll(false) }}>{catLabel(c)}</Chip>
          ))}
        </div>
      </div>

      {/* grid */}
      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-soft p-9 text-center text-sm text-ink-muted">
          No parts match your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <ProductCard key={p.id} p={p} onAdd={() => { add(p.id, 1); openCart() }} />
          ))}
        </div>
      )}

      {/* footer */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <span className="text-xs text-ink-muted">
          Showing {shown.length} of {isDefault ? products.length : filtered.length} {isDefault ? 'parts' : `result${filtered.length === 1 ? '' : 's'}`}
        </span>
        {isDefault && ordered.length > TOP_N ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-card border border-line bg-brand-soft px-5 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand"
          >
            {showAll ? 'Show fewer' : `Show all parts (${ordered.length})`}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
        active ? 'border-transparent bg-gradient-to-b from-brand-bright to-brand-dark text-[#02101f]' : 'border-line bg-surface/50 text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function ProductCard({ p, onAdd }: { p: ProductWithStock; onAdd: () => void }) {
  const out = p.comingSoon || p.inStock === false || p.stockQty <= 0
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line-soft bg-gradient-to-b from-surface/45 to-night/45 transition-transform hover:-translate-y-0.5 hover:border-line">
      <div className="aspect-[1.7] border-b border-line-soft bg-[#050b1c]">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[radial-gradient(120px_80px_at_50%_30%,rgba(52,185,240,0.16),transparent_70%)]">
            <svg viewBox="0 0 24 24" className="h-9 w-9 stroke-brand/70" fill="none" strokeWidth="1.4">
              <circle cx="12" cy="12" r="3.4" />
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-brand">{catLabel(p.category)}</span>
        <span className="font-head text-[15px] font-bold leading-tight text-white">{p.name}</span>
        {p.sku ? <span className="text-[11px] text-ink-muted">{p.sku}</span> : null}
        <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
          <b className="font-head text-[17px] text-white">{formatMYR(p.priceRetail)}</b>
          {p.priceBulk && p.bulkMinQty ? (
            <span className="text-[11px] text-positive">{formatMYR(p.priceBulk)} at {p.bulkMinQty}+</span>
          ) : null}
        </div>
        <span className={`text-[11px] ${out ? 'text-danger' : 'text-ink-muted'}`}>
          {p.comingSoon ? 'Coming soon' : out ? 'Out of stock' : `In stock${p.stockQty ? ` (${p.stockQty})` : ''}`}
        </span>
        <div className="mt-auto pt-2.5">
          {out ? (
            <button type="button" disabled className="w-full cursor-not-allowed rounded-card border border-line bg-surface/40 px-3 py-2 text-sm font-semibold text-ink-muted">
              {p.comingSoon ? 'Coming soon' : 'Out of stock'}
            </button>
          ) : (
            <button type="button" onClick={onAdd} className="btn-primary w-full">Add to cart</button>
          )}
        </div>
      </div>
    </article>
  )
}
