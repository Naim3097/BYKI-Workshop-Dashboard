'use client'

// Client-side cart (zustand + localStorage). Holds only product ids + qty; all
// pricing is recomputed server-side at checkout via commerce/pricing.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartLine {
  productId: string
  qty: number
}

interface CartState {
  lines: CartLine[]
  add: (productId: string, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  remove: (productId: string) => void
  clear: () => void
  count: () => number
}

// Drawer open/close state (ephemeral — not persisted). Lets the cart button and
// the cart drawer talk so add-to-cart can pop the drawer open on a single page.
interface CartUIState {
  open: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

export const useCartUI = create<CartUIState>((set) => ({
  open: false,
  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
  toggleCart: () => set((s) => ({ open: !s.open })),
}))

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (productId, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === productId)
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === productId ? { ...l, qty: l.qty + qty } : l,
              ),
            }
          }
          return { lines: [...state.lines, { productId, qty }] }
        }),
      setQty: (productId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((l) => l.productId !== productId)
              : state.lines.map((l) => (l.productId === productId ? { ...l, qty } : l)),
        })),
      remove: (productId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((n, l) => n + l.qty, 0),
    }),
    { name: 'byki-cart' },
  ),
)
