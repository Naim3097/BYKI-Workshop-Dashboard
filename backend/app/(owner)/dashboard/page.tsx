'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Kpis } from '@/components/dashboard/Kpis'
import { TransactionsPanel } from '@/components/dashboard/TransactionsPanel'
import { InventoryPanel } from '@/components/dashboard/InventoryPanel'
import { BookingsPanel } from '@/components/dashboard/BookingsPanel'
import type { DashboardData } from '@/components/dashboard/types'

type Tab = 'transactions' | 'inventory' | 'bookings'

const tabs: { key: Tab; label: string }[] = [
  { key: 'transactions', label: 'Transactions' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'bookings', label: 'Bookings' },
]

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [tab, setTab] = useState<Tab>('transactions')
  const [updatedAt, setUpdatedAt] = useState('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/dashboard', { cache: 'no-store' })
    if (res.ok) {
      const d = (await res.json()) as DashboardData
      setData(d)
      setUpdatedAt(new Date().toLocaleTimeString('en-MY'))
    }
  }, [])

  useEffect(() => {
    load()
    // Light polling so transactions and stock changes appear without a refresh.
    timer.current = setInterval(load, 5000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [load])

  return (
    <div className="container-page py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Every transaction across retail, bulk, the sales portal, and service
            bookings, plus live inventory.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-muted">
          {updatedAt ? <span>Updated {updatedAt}</span> : null}
          <button type="button" onClick={load} className="btn-secondary px-3 py-1.5 text-xs">
            Refresh
          </button>
        </div>
      </div>

      {!data ? (
        <p className="text-sm text-ink-muted">Loading dashboard...</p>
      ) : (
        <>
          <Kpis data={data} />

          <div className="mt-6 mb-4 flex gap-1 border-b border-line">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'border-brand text-brand'
                    : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'transactions' ? <TransactionsPanel data={data} /> : null}
          {tab === 'inventory' ? <InventoryPanel data={data} onChanged={load} /> : null}
          {tab === 'bookings' ? <BookingsPanel data={data} /> : null}
        </>
      )}
    </div>
  )
}
