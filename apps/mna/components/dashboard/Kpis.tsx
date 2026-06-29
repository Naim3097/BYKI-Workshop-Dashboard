'use client'

import { formatMYR } from '@/lib/format'
import type { DashboardData } from './types'

export function Kpis({ data }: { data: DashboardData }) {
  const priceMap = new Map(data.products.map((p) => [p.id, p]))

  const paidOrders = data.orders.filter((o) => o.paymentStatus === 'SUCCESS')
  const paidBookings = data.bookings.filter((b) => b.paymentStatus === 'SUCCESS')
  const revenue =
    paidOrders.reduce((s, o) => s + o.amount, 0) +
    paidBookings.reduce((s, b) => s + b.amount, 0)

  const pending =
    data.orders.filter((o) => o.status === 'pending_payment').length +
    data.bookings.filter((b) => b.status === 'pending_payment').length

  // Indicative value of stock consumed by the owner's own workshop.
  const workshopValue = data.movements
    .filter((m) => m.type === 'workshop_use')
    .reduce((sum, m) => {
      const product = priceMap.get(m.productId)
      return sum + Math.abs(m.qty) * (product?.priceRetail ?? 0)
    }, 0)

  const lowStock = data.products.filter(
    (p) => p.stockQty > 0 && p.stockQty <= p.reorderLevel,
  ).length
  const outStock = data.products.filter((p) => p.stockQty <= 0).length

  const cards = [
    { label: 'Paid revenue', value: formatMYR(revenue) },
    { label: 'Awaiting payment', value: String(pending) },
    { label: 'Workshop stock used (value)', value: formatMYR(workshopValue) },
    { label: 'Low / out of stock', value: `${lowStock} low, ${outStock} out` },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="card p-4">
          <p className="text-xs text-ink-muted">{c.label}</p>
          <p className="mt-1 text-lg font-semibold text-ink">{c.value}</p>
        </div>
      ))}
    </div>
  )
}
