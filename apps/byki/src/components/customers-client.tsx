'use client'

import { useMemo, useState } from 'react'
import { DataTable, formatMYR, type Column } from '@/components/ui'
import { ExportCsv } from '@/components/export-csv'
import type { CustomerWithWorkshop } from '@byki/core/byki'

export function CustomersClient({ rows }: { rows: CustomerWithWorkshop[] }) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      !query
        ? rows
        : rows.filter(
            (r) =>
              r.name.toLowerCase().includes(query) ||
              r.phone.toLowerCase().includes(query) ||
              r.workshopName.toLowerCase().includes(query),
          ),
    [rows, query],
  )

  const columns: Column<CustomerWithWorkshop>[] = [
    { key: 'name', label: 'Customer', render: (r) => <span className="font-medium">{r.name || '—'}</span> },
    { key: 'phone', label: 'Phone' },
    { key: 'workshopName', label: 'Workshop', render: (r) => <span className="text-[var(--muted)]">{r.workshopName}</span> },
    { key: 'totalSpent', label: 'Lifetime spend', align: 'right', render: (r) => formatMYR(r.totalSpent) },
    { key: 'ordersCount', label: 'Orders', align: 'right' },
    { key: 'bookingsCount', label: 'Bookings', align: 'right' },
    { key: 'lastSeen', label: 'Last seen', align: 'right', render: (r) => new Date(r.lastSeen).toLocaleDateString() },
  ]

  return (
    <div className="byki-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#efefef] px-4 py-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone, workshop"
          className="w-64 max-w-full rounded-lg border border-[#e0e0e0] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--green-500)]"
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted)]">{filtered.length} of {rows.length}</span>
          <ExportCsv
            filename="byki-customers.csv"
            headers={['Customer', 'Phone', 'Email', 'Workshop', 'Lifetime spend', 'Orders', 'Bookings', 'Last seen']}
            rows={filtered.map((r) => [r.name, r.phone, r.email, r.workshopName, r.totalSpent, r.ordersCount, r.bookingsCount, new Date(r.lastSeen).toISOString().slice(0, 10)])}
          />
        </div>
      </div>
      <div className="p-2 sm:p-3">
        <DataTable columns={columns} rows={filtered} empty="No customers match." />
      </div>
    </div>
  )
}
