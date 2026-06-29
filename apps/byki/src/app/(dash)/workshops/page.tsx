import Link from 'next/link'
import { getWorkshopStats, getWorkshopOptions } from '@byki/core/byki'
import { PageHeader, Section, DataTable, formatMYR, Pill, type Column } from '@/components/ui'
import { FilterBar } from '@/components/filter-bar'
import { ExportCsv } from '@/components/export-csv'
import { parseFilter } from '@/lib/filters'

export const dynamic = 'force-dynamic'

type Row = Awaited<ReturnType<typeof getWorkshopStats>>[number]

export default async function WorkshopsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { filter, range, workshopId } = parseFilter(sp)
  const [workshops, options] = await Promise.all([getWorkshopStats(filter), getWorkshopOptions()])

  const columns: Column<Row>[] = [
    { key: 'name', label: 'Workshop', render: (r) => (
      <Link href={`/workshops/${r.id}`} className="font-medium text-[var(--green-900)] hover:underline">{r.name}</Link>
    ) },
    { key: 'active', label: 'Status', render: (r) => (r.active ? <Pill tone="green">active</Pill> : <Pill tone="muted">inactive</Pill>) },
    { key: 'leanxConfigured', label: 'Payments', render: (r) => (r.leanxConfigured ? <Pill tone="green">live</Pill> : <Pill tone="muted">mock</Pill>) },
    { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => formatMYR(r.revenue) },
    { key: 'ordersPaid', label: 'Paid orders', align: 'right' },
    { key: 'bookingsConfirmed', label: 'Bookings', align: 'right' },
    { key: 'customers', label: 'Customers', align: 'right' },
    { key: 'scans', label: 'Scans', align: 'right' },
    { key: 'lastActivity', label: 'Last activity', align: 'right', render: (r) => (r.lastActivity ? new Date(r.lastActivity).toLocaleDateString() : '—') },
  ]

  return (
    <>
      <PageHeader title="Workshops" subtitle="Every workshop on the platform, ranked by revenue." />
      <FilterBar workshops={options} range={range} workshopId={workshopId} />
      <Section
        title={`${workshops.length} workshops`}
        right={
          <ExportCsv
            filename="byki-workshops.csv"
            headers={['Workshop', 'Active', 'Payments', 'Revenue', 'Paid orders', 'Bookings', 'Customers', 'Scans', 'Last activity']}
            rows={workshops.map((r) => [r.name, r.active ? 'yes' : 'no', r.leanxConfigured ? 'live' : 'mock', r.revenue, r.ordersPaid, r.bookingsConfirmed, r.customers, r.scans, r.lastActivity ?? ''])}
          />
        }
      >
        <DataTable columns={columns} rows={workshops} empty="No workshops yet." />
      </Section>
    </>
  )
}
