import Link from 'next/link'
import {
  getNetworkOverview,
  getWorkshopStats,
  getDiagnoseAnalytics,
  getRevenueByMonth,
  getRecentActivity,
  getWorkshopOptions,
} from '@byki/core/byki'
import { PageHeader, StatCard, Section, DataTable, formatMYR, Pill, type Column } from '@/components/ui'
import { FilterBar } from '@/components/filter-bar'
import { MiniBars } from '@/components/mini-bars'
import { parseFilter } from '@/lib/filters'

export const dynamic = 'force-dynamic'

type Ws = Awaited<ReturnType<typeof getWorkshopStats>>[number]
type Act = Awaited<ReturnType<typeof getRecentActivity>>[number]

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { filter, range, workshopId } = parseFilter(sp)

  const [overview, workshops, diag, trend, activity, options] = await Promise.all([
    getNetworkOverview(filter),
    getWorkshopStats(filter),
    getDiagnoseAnalytics(filter),
    getRevenueByMonth(filter),
    getRecentActivity(filter),
    getWorkshopOptions(),
  ])

  const wsCols: Column<Ws>[] = [
    { key: 'name', label: 'Workshop', render: (r) => (
      <Link href={`/workshops/${r.id}`} className="font-medium text-[var(--green-900)] hover:underline">{r.name}</Link>
    ) },
    { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => formatMYR(r.revenue) },
    { key: 'ordersPaid', label: 'Paid orders', align: 'right' },
    { key: 'bookingsConfirmed', label: 'Bookings', align: 'right' },
    { key: 'customers', label: 'Customers', align: 'right' },
    { key: 'scans', label: 'Scans', align: 'right' },
  ]

  const actCols: Column<Act>[] = [
    { key: 'kind', label: 'Type', render: (r) => <Pill tone={r.kind === 'order' ? 'green' : 'neutral'}>{r.kind}</Pill> },
    { key: 'label', label: 'Detail', render: (r) => <span className="font-medium">{r.label}</span> },
    { key: 'workshopName', label: 'Workshop', render: (r) => <span className="text-[var(--muted)]">{r.workshopName}</span> },
    { key: 'amount', label: 'Amount', align: 'right', render: (r) => (r.amount != null ? formatMYR(r.amount) : '—') },
    { key: 'at', label: 'When', align: 'right', render: (r) => new Date(r.at).toLocaleString() },
  ]

  return (
    <>
      <PageHeader title="Network Overview" subtitle="Performance across all workshops on the BYKI platform." />
      <FilterBar workshops={options} range={range} workshopId={workshopId} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Network revenue" value={formatMYR(overview.revenue)} />
        <StatCard label="Avg order value" value={formatMYR(overview.aov)} />
        <StatCard label="Pending (in flight)" value={formatMYR(overview.pendingValue)} />
        <StatCard label="Failed payments" value={`${Math.round(overview.failedRate * 100)}%`} />
        <StatCard label="Paid orders" value={overview.ordersPaid} sub={`${overview.ordersTotal} total`} />
        <StatCard label="Bookings" value={overview.bookingsConfirmed} sub={`${overview.bookingsTotal} total`} />
        <StatCard label="Customers" value={overview.customers} />
        <StatCard label="Diagnostic scans" value={overview.scans} />
      </div>

      <div className="mt-8">
        <Section title="Revenue by month">
          <MiniBars data={trend} />
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Workshop leaderboard">
          <DataTable columns={wsCols} rows={workshops} empty="No workshops yet." />
        </Section>
        <Section title="Recent activity">
          <DataTable columns={actCols} rows={activity} empty="No activity yet." />
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="OBD scans" value={diag.obd} />
        <StatCard label="CVT simulator runs" value={diag.cvtSim} />
        <StatCard label="Scan to booking" value={`${Math.round(diag.conversionRate * 100)}%`} />
        <StatCard label="Scans linked to customer" value={diag.linkedToCustomer} />
      </div>
    </>
  )
}
