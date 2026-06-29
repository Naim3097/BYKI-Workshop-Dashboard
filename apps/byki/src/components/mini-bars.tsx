import { formatMYR } from '@byki/core/format'

// Minimal monthly bar chart (no chart library). Heights are proportional to the
// max value; labels are MM. Server-safe.
export function MiniBars({ data }: { data: { month: string; revenue: number }[] }) {
  if (!data.length) {
    return <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">No revenue in this period.</p>
  }
  const max = Math.max(...data.map((d) => d.revenue), 1)
  return (
    <div className="flex items-end gap-3 px-4 py-6" style={{ height: 200 }}>
      {data.map((d) => {
        const h = Math.max(4, Math.round((d.revenue / max) * 150))
        const [, mm] = d.month.split('-')
        return (
          <div key={d.month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <span className="text-[10px] tabular-nums text-[var(--muted)]">{formatMYR(d.revenue)}</span>
            <div
              className="w-full max-w-[44px] rounded-t-md bg-[var(--green-500)]"
              style={{ height: h }}
              title={`${d.month}: ${formatMYR(d.revenue)}`}
            />
            <span className="text-[11px] text-[var(--muted)]">{mm}</span>
          </div>
        )
      })}
    </div>
  )
}
