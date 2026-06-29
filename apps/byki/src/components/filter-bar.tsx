'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { RANGES } from '@/lib/filters'

// Workshop + time-range filter. URL-driven (?workshop=&range=) so pages stay
// server-rendered and links/refreshes preserve the view.
export function FilterBar({
  workshops,
  range,
  workshopId,
}: {
  workshops: { id: string; name: string }[]
  range: string
  workshopId: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`${pathname}?${next.toString()}`)
  }

  const select =
    'byki-select rounded-lg border border-[#e0e0e0] bg-white py-2 pl-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--green-500)]'

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <select className={select} value={workshopId ?? ''} onChange={(e) => setParam('workshop', e.target.value)}>
        <option value="">All workshops</option>
        {workshops.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <select className={select} value={range} onChange={(e) => setParam('range', e.target.value)}>
        {RANGES.map((r) => (
          <option key={r.key} value={r.key}>
            {r.label}
          </option>
        ))}
      </select>
    </div>
  )
}
