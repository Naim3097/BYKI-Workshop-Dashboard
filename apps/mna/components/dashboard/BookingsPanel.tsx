'use client'

import { formatDate, formatDateTime, formatMYR } from '@/lib/format'
import { serviceLabels } from '@/lib/labels'
import { PaymentBadge, StatusBadge } from '@/components/ui'
import type { DashboardData } from './types'

export function BookingsPanel({ data }: { data: DashboardData }) {
  if (data.bookings.length === 0) {
    return (
      <div className="card p-6">
        <p className="text-sm text-ink-muted">No service bookings yet.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-2.5 font-medium">Reference</th>
              <th className="px-4 py-2.5 font-medium">Service</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Vehicle</th>
              <th className="px-4 py-2.5 font-medium">Slot</th>
              <th className="px-4 py-2.5 text-right font-medium">Deposit</th>
              <th className="px-4 py-2.5 font-medium">Payment</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.bookings.map((b) => (
              <tr key={b.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-ink">{b.invoiceRef}</td>
                <td className="px-4 py-3 text-ink-soft">{serviceLabels[b.serviceType]}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {b.customerName}
                  <span className="block text-xs text-ink-muted">{b.customerPhone}</span>
                </td>
                <td className="px-4 py-3 text-ink-soft">{b.vehicleModel || '-'}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {formatDate(b.preferredDate)}
                  <span className="block text-xs text-ink-muted">{b.timeSlot}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-ink">{formatMYR(b.amount)}</td>
                <td className="px-4 py-3">
                  <PaymentBadge status={b.paymentStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
