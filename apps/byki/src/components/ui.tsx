// Presentational primitives for the BYKI dashboard. Light, minimal, no icons.
// Server-compatible (no client state).

import React from 'react'
import { formatMYR } from '@byki/core/format'

export { formatMYR }

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-bold tracking-[-0.01em] text-[var(--ink)]">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
    </div>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`byki-card p-6 ${className}`}>{children}</div>
}

export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="byki-card min-w-0 p-5">
      <p className="truncate text-[13px] font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-[22px] font-bold leading-tight tracking-[-0.02em] text-[var(--ink)] tabular-nums [overflow-wrap:anywhere] sm:text-[26px]">
        {value}
      </p>
      {sub && <p className="mt-1.5 truncate text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  )
}

export function Section({
  title,
  children,
  right,
}: {
  title: string
  children: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="byki-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#efefef] px-6 py-4">
        <h2 className="text-sm font-bold text-[var(--ink)]">{title}</h2>
        {right}
      </div>
      <div className="p-2 sm:p-3">{children}</div>
    </div>
  )
}

export interface Column<T> {
  key: string
  label: string
  align?: 'left' | 'right'
  render?: (row: T) => React.ReactNode
}

export function DataTable<T>({
  columns,
  rows,
  empty = 'Nothing to show yet.',
}: {
  columns: Column<T>[]
  rows: T[]
  empty?: string
}) {
  if (!rows.length) {
    return <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">{empty}</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] ${c.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[#f0f0f0]">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-3 text-[var(--ink)] ${c.align === 'right' ? 'text-right tabular-nums' : 'text-left'}`}
                >
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'green' | 'neutral' | 'muted' }) {
  const tones = {
    green: 'bg-[#e7f6ee] text-[#1c7a43]',
    neutral: 'bg-[#eef0f2] text-[#3a3a3a]',
    muted: 'bg-[#f2f2f2] text-[var(--muted)]',
  }
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}
