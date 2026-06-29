'use client'

import { useMemo, useState } from 'react'
import { formatDateTime, formatMYR } from '@/lib/format'
import { channelLabels, serviceLabels } from '@/lib/labels'
import { PaymentBadge, StatusBadge } from '@/components/ui'
import type { OrderChannel, OrderStatus, PaymentStatus } from '@/lib/types'
import type { DashboardData } from './types'

// Unified ledger: parts orders (all channels), service booking deposits, and
// own-workshop stock usage. Workshop usage is internal consumption, not revenue,
// so it is shown distinctly and never counted as income.
type RowKind = 'order' | 'booking' | 'workshop'

interface Row {
  id: string
  ref: string
  source: string
  customer: string
  detail: string
  amount: number
  kind: RowKind
  status?: OrderStatus
  payment?: PaymentStatus
  createdAt: string
}

type ChannelFilter = 'all' | OrderChannel | 'booking' | 'workshop'
type Period = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom'

function periodStart(period: Period): number | null {
  if (period === 'all' || period === 'custom') return null
  const now = new Date()
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (period === 'week') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return d.getTime() - 6 * 24 * 60 * 60 * 1000
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  if (period === 'year') return new Date(now.getFullYear(), 0, 1).getTime()
  return null
}

export function TransactionsPanel({ data }: { data: DashboardData }) {
  const [filter, setFilter] = useState<ChannelFilter>('all')
  const [period, setPeriod] = useState<Period>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const priceMap = useMemo(
    () => new Map(data.products.map((p) => [p.id, p])),
    [data.products],
  )

  const rows = useMemo<Row[]>(() => {
    const orderRows: Row[] = data.orders.map((o) => ({
      id: o.id,
      ref: o.invoiceRef,
      source: channelLabels[o.channel],
      customer: o.customerName,
      detail: `${o.items.length} item${o.items.length === 1 ? '' : 's'}`,
      amount: o.amount,
      kind: 'order',
      status: o.status,
      payment: o.paymentStatus,
      createdAt: o.createdAt,
    }))
    const bookingRows: Row[] = data.bookings.map((b) => ({
      id: b.id,
      ref: b.invoiceRef,
      source: 'Service booking',
      customer: b.customerName,
      detail: serviceLabels[b.serviceType],
      amount: b.amount,
      kind: 'booking',
      status: b.status,
      payment: b.paymentStatus,
      createdAt: b.createdAt,
    }))
    const workshopRows: Row[] = data.movements
      .filter((m) => m.type === 'workshop_use')
      .map((m) => {
        const product = priceMap.get(m.productId)
        const units = Math.abs(m.qty)
        return {
          id: m.id,
          ref: m.reference || 'Workshop',
          source: 'Workshop use',
          customer: 'Internal',
          detail: `${product?.name ?? m.productId} x${units}`,
          amount: units * (product?.priceRetail ?? 0),
          kind: 'workshop' as RowKind,
          createdAt: m.createdAt,
        }
      })
    return [...orderRows, ...bookingRows, ...workshopRows].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
  }, [data, priceMap])

  const filtered = useMemo(() => {
    const start = periodStart(period)
    const customFrom = period === 'custom' && fromDate ? new Date(fromDate).getTime() : null
    const customTo = period === 'custom' && toDate ? new Date(toDate).getTime() + 24 * 60 * 60 * 1000 : null

    return rows.filter((r) => {
      // channel
      if (filter === 'booking' && r.kind !== 'booking') return false
      if (filter === 'workshop' && r.kind !== 'workshop') return false
      if (
        (filter === 'retail' || filter === 'bulk' || filter === 'owner') &&
        r.source !== channelLabels[filter]
      )
        return false
      // date
      const t = new Date(r.createdAt).getTime()
      if (start != null && t < start) return false
      if (customFrom != null && t < customFrom) return false
      if (customTo != null && t >= customTo) return false
      return true
    })
  }, [rows, filter, period, fromDate, toDate])

  // Revenue excludes workshop usage and only counts successful payments.
  const revenue = filtered
    .filter((r) => r.kind !== 'workshop' && r.payment === 'SUCCESS')
    .reduce((sum, r) => sum + r.amount, 0)

  const filters: { key: ChannelFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'retail', label: 'Retail' },
    { key: 'bulk', label: 'Bulk / B2B' },
    { key: 'owner', label: 'Owner portal' },
    { key: 'booking', label: 'Bookings' },
    { key: 'workshop', label: 'Workshop use' },
  ]

  const periods: { key: Period; label: string }[] = [
    { key: 'all', label: 'All time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Last 7 days' },
    { key: 'month', label: 'This month' },
    { key: 'year', label: 'This year' },
    { key: 'custom', label: 'Custom range' },
  ]

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                filter === f.key ? 'bg-brand text-night' : 'bg-surface-2 text-ink-soft hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="input w-auto py-1.5 text-xs"
          >
            {periods.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          {period === 'custom' ? (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input w-auto py-1.5 text-xs"
                aria-label="From date"
              />
              <span className="text-xs text-ink-muted">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input w-auto py-1.5 text-xs"
                aria-label="To date"
              />
            </>
          ) : null}
          <span className="ml-auto text-xs text-ink-muted">
            {filtered.length} record{filtered.length === 1 ? '' : 's'} | Revenue {formatMYR(revenue)}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="p-6 text-sm text-ink-muted">No transactions for this filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-2.5 font-medium">Reference</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Detail</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Payment</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-ink">{r.ref}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.source}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.customer}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.detail}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink">
                    {r.kind === 'workshop' ? (
                      <span className="text-ink-muted">({formatMYR(r.amount)})</span>
                    ) : (
                      formatMYR(r.amount)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.kind === 'workshop' ? (
                      <span className="badge bg-surface-2 text-ink-muted">Internal</span>
                    ) : r.payment ? (
                      <PaymentBadge status={r.payment} />
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {r.kind === 'workshop' ? (
                      <span className="badge bg-warning/15 text-warning">Workshop use</span>
                    ) : r.status ? (
                      <StatusBadge status={r.status} />
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
