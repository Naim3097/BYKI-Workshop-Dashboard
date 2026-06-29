'use client'

// Standardized SINGLE-PAGE commerce UI shared by every workshop:
//   <ProductGrid/>   products shown inline (no separate product page)
//   <CartButton/>     header cart icon + badge -> opens the drawer
//   <CartDrawer/>     slide-over with line items + inline checkout (LeanX)
//
// All state is the shared cart store; the charged amount is recomputed
// server-side at /api/create-payment. Pricing tiers mirror commerce/pricing.

import { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui'
import { formatMYR } from '../format'
import { priceFor } from './pricing'
import { useCart, useCartUI } from './cart-store'
import { lastScanId } from '../diagnose/report'
import type { ProductWithStock } from '../types'

// ── Add to cart (opens the drawer) ──
export function AddToCartButton({
  productId,
  disabled,
  label = 'Tambah ke Troli',
  className = '',
}: {
  productId: string
  disabled?: boolean
  label?: string
  className?: string
}) {
  const add = useCart((s) => s.add)
  const openCart = useCartUI((s) => s.openCart)
  return (
    <Button
      disabled={disabled}
      className={className}
      onClick={() => {
        add(productId, 1)
        openCart()
      }}
    >
      {label}
    </Button>
  )
}

// ── Inline product grid (single page; no detail route) ──
export function ProductGrid({ products }: { products: ProductWithStock[] }) {
  if (!products.length) {
    return <p className="py-12 text-center text-white/40">Tiada produk buat masa ini.</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const soldOut = p.comingSoon || !p.inStock || p.stockQty <= 0
        return (
          <div key={p.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            {p.image && (
              <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
            )}
            <h3 className="font-semibold text-white">{p.name}</h3>
            <p className="mt-1 line-clamp-2 flex-1 text-sm text-white/50">{p.shortDescription || p.description}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-lg font-bold text-[var(--accent)]">{formatMYR(p.priceRetail)}</span>
              {soldOut ? (
                <span className="text-xs text-white/40">{p.comingSoon ? 'Akan datang' : 'Habis stok'}</span>
              ) : (
                <AddToCartButton productId={p.id} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Cart button (header) ──
export function CartButton({ className = '' }: { className?: string }) {
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0))
  const openCart = useCartUI((s) => s.openCart)
  return (
    <button
      onClick={openCart}
      aria-label="Troli"
      className={`relative inline-flex items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-white/80 hover:text-white ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  )
}

interface Line {
  product: ProductWithStock
  qty: number
  unit: number
  tier: 'retail' | 'bulk'
  subtotal: number
  retailSubtotal: number
}

// ── Cart drawer (slide-over) with inline checkout ──
export function CartDrawer() {
  const open = useCartUI((s) => s.open)
  const closeCart = useCartUI((s) => s.closeCart)
  const { lines, setQty, remove, clear } = useCart()
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [step, setStep] = useState<'cart' | 'checkout'>('cart')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    fetch('/api/catalog')
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]))
  }, [open])

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const rows: Line[] = lines
    .map((l) => {
      const product = byId.get(l.productId)
      if (!product) return null
      const { tier, unitPrice } = priceFor(product, l.qty)
      return {
        product,
        qty: l.qty,
        unit: unitPrice,
        tier,
        subtotal: Number((unitPrice * l.qty).toFixed(2)),
        retailSubtotal: Number((product.priceRetail * l.qty).toFixed(2)),
      }
    })
    .filter((x): x is Line => x !== null)

  const subtotal = rows.reduce((s, r) => s + r.subtotal, 0)
  const retail = rows.reduce((s, r) => s + r.retailSubtotal, 0)
  const savings = retail - subtotal

  const inputCls =
    'w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:border-[var(--accent)]/50 outline-none'

  async function pay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order',
          customer: { name, email, phone },
          items: lines,
          diagnoseSessionId: lastScanId() ?? undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memulakan pembayaran')
      if (data.paymentLink) {
        clear()
        window.location.href = data.paymentLink
      } else {
        throw new Error('Respons tidak sah daripada gerbang pembayaran')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ralat tidak diketahui')
      setLoading(false)
    }
  }

  return (
    <>
      {/* overlay */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      {/* panel */}
      <aside
        className={`fixed right-0 top-0 z-[61] flex h-full w-full max-w-md flex-col bg-[var(--bg-raised,#121214)] text-white shadow-2xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-lg font-bold">{step === 'cart' ? 'Troli Anda' : 'Pembayaran'}</h2>
          <button onClick={closeCart} aria-label="Tutup" className="text-white/50 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {rows.length === 0 ? (
            <p className="py-12 text-center text-white/40">Troli anda kosong.</p>
          ) : step === 'cart' ? (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.product.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  {r.product.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.product.image} alt={r.product.name} className="h-14 w-14 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.product.name}</p>
                    <p className="text-xs text-white/50">
                      {formatMYR(r.unit)} {r.tier === 'bulk' && <span className="text-emerald-400">(borong)</span>}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={r.qty}
                    onChange={(e) => setQty(r.product.id, parseInt(e.target.value, 10) || 1)}
                    className="w-14 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-center text-sm"
                  />
                  <button onClick={() => remove(r.product.id)} className="text-white/40 hover:text-red-400">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <input className={inputCls} placeholder="Nama penuh" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={inputCls} type="email" placeholder="E-mel" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={inputCls} type="tel" placeholder="No. telefon (cth. 0123456789)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              {error && <p className="rounded-xl border border-red-900/40 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <div className="space-y-3 border-t border-white/10 p-4">
            {savings > 0.005 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Jimat borong</span>
                <span>-{formatMYR(savings)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span>Jumlah</span>
              <span>{formatMYR(subtotal)}</span>
            </div>
            {step === 'cart' ? (
              <Button size="lg" className="w-full" onClick={() => setStep('checkout')}>
                Teruskan ke Pembayaran
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" className="w-1/3" disabled={loading} onClick={() => setStep('cart')}>
                  Kembali
                </Button>
                <Button
                  className="w-2/3"
                  disabled={loading || !name || !email || !phone}
                  onClick={pay}
                >
                  {loading ? 'Memproses…' : `Bayar ${formatMYR(subtotal)}`}
                </Button>
              </div>
            )}
            <p className="text-center text-[10px] text-white/25">Pembayaran selamat melalui LeanX</p>
          </div>
        )}
      </aside>
    </>
  )
}
