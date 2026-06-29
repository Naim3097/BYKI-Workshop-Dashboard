import type { OrderStatus, PaymentStatus } from '@/lib/types'
import { orderStatusLabels, paymentStatusLabels } from '@/lib/labels'

// Small presentational helpers shared across pages. No icon fonts or emojis;
// status is communicated with text and colour only.

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone: Record<OrderStatus, string> = {
    pending_payment: 'bg-brand-soft text-brand-bright',
    paid: 'bg-positive/15 text-positive',
    fulfilled: 'bg-positive/15 text-positive',
    cancelled: 'bg-danger/15 text-danger',
  }
  return <span className={`badge ${tone[status]}`}>{orderStatusLabels[status]}</span>
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const tone: Record<PaymentStatus, string> = {
    pending: 'bg-warning/15 text-warning',
    SUCCESS: 'bg-positive/15 text-positive',
    FAILED: 'bg-danger/15 text-danger',
    CANCELLED: 'bg-danger/15 text-danger',
  }
  return <span className={`badge ${tone[status]}`}>{paymentStatusLabels[status]}</span>
}

export function StockBadge({
  stockQty,
  reorderLevel,
}: {
  stockQty: number
  reorderLevel: number
}) {
  if (stockQty <= 0) {
    return <span className="badge bg-danger/15 text-danger">Out of stock</span>
  }
  if (stockQty <= reorderLevel) {
    return <span className="badge bg-warning/15 text-warning">Low: {stockQty} left</span>
  }
  return <span className="badge bg-positive/15 text-positive">In stock: {stockQty}</span>
}

export function SectionTitle({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
    </div>
  )
}
