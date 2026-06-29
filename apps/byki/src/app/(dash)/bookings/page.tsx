import { getBookingStats, getWorkshopOptions } from '@byki/core/byki'
import { PageHeader, StatCard, Section, DataTable, formatMYR, type Column } from '@/components/ui'
import { FilterBar } from '@/components/filter-bar'
import { parseFilter } from '@/lib/filters'

export const dynamic = 'force-dynamic'

type Row = { service: string; count: number }

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { filter, range, workshopId } = parseFilter(sp)
  const [stats, options] = await Promise.all([getBookingStats(filter), getWorkshopOptions()])
  const columns: Column<Row>[] = [
    { key: 'service', label: 'Service', render: (r) => <span className="font-medium">{r.service}</span> },
    { key: 'count', label: 'Bookings', align: 'right' },
  ]
  return (
    <>
      <PageHeader title="Bookings" subtitle="Service bookings across all workshops." />
      <FilterBar workshops={options} range={range} workshopId={workshopId} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total bookings" value={stats.total} />
        <StatCard label="Confirmed" value={stats.confirmed} />
        <StatCard label="Deposits collected" value={formatMYR(stats.deposits)} />
        <StatCard label="Services offered" value={stats.byService.length} />
      </div>
      <div className="mt-8">
        <Section title="Bookings by service">
          <DataTable columns={columns} rows={stats.byService} empty="No bookings yet." />
        </Section>
      </div>
    </>
  )
}
