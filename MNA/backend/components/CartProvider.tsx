'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Product } from '@/lib/types'

// A line in the cart references the product and a quantity. The pricing tier
// (retail vs bulk) is derived from the quantity against the product's
// bulkMinQty, so the storefront and owner portal price identically.

export interface CartLine {
  product: Product
  qty: number
}

interface CartContextValue {
  lines: CartLine[]
  add: (product: Product, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  remove: (productId: string) => void
  clear: () => void
  count: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'mna-cart-v1'

export function lineUnitPrice(line: CartLine): number {
  return line.qty >= line.product.bulkMinQty
    ? line.product.priceBulk
    : line.product.priceRetail
}

export function lineTier(line: CartLine): 'retail' | 'bulk' {
  return line.qty >= line.product.bulkMinQty ? 'bulk' : 'retail'
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setLines(JSON.parse(raw))
    } catch {
      // ignore malformed storage
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines, hydrated])

  const add = (product: Product, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, qty: l.qty + qty } : l,
        )
      }
      return [...prev, { product, qty }]
    })
  }

  const setQty = (productId: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, qty } : l))
        .filter((l) => l.qty > 0),
    )
  }

  const remove = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId))
  }

  const clear = () => setLines([])

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines])
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + lineUnitPrice(l) * l.qty, 0),
    [lines],
  )

  const value: CartContextValue = {
    lines,
    add,
    setQty,
    remove,
    clear,
    count,
    subtotal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
