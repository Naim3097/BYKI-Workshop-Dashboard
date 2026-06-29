// Time-range presets + parsing for the dashboard filter bar. Server-safe.
import type { Filter } from '@byki/core/byki'

export const RANGES = [
  { key: 'all', label: 'All time' },
  { key: 'mtd', label: 'This month' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'qtd', label: 'This quarter' },
  { key: 'ytd', label: 'This year' },
] as const

export type RangeKey = (typeof RANGES)[number]['key']

export function resolveRange(key: string): { from?: string } {
  const now = new Date()
  switch (key) {
    case 'mtd':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() }
    case '30d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      return { from: d.toISOString() }
    }
    case 'qtd': {
      const q = Math.floor(now.getMonth() / 3) * 3
      return { from: new Date(now.getFullYear(), q, 1).toISOString() }
    }
    case 'ytd':
      return { from: new Date(now.getFullYear(), 0, 1).toISOString() }
    default:
      return {}
  }
}

export interface ParsedFilter {
  filter: Filter
  range: RangeKey
  workshopId: string | null
}

export function parseFilter(sp: Record<string, string | string[] | undefined>): ParsedFilter {
  const range = (typeof sp.range === 'string' ? sp.range : 'all') as RangeKey
  const workshopId = typeof sp.workshop === 'string' && sp.workshop ? sp.workshop : null
  const { from } = resolveRange(range)
  return { filter: { workshopId, from }, range, workshopId }
}
