import { getBillingMetrics, getWorkshopOptions } from '@byki/core/byki'
import { PageHeader, Section, DataTable, formatMYR, StatCard, Pill, type Column } from '@/components/ui'
import { FilterBar } from '@/components/filter-bar'
import { ExportCsv } from '@/components/export-csv'
import { parseFilter } from '@/lib/filters'

export const dynamic = 'force-dynamic'

type Row = Awaited<ReturnType<typeof getBillingMetrics>>[number]

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { filter, range, workshopId } = parseFilter(sp)
  const [metrics, options] = await Promise.all([getBillingMetrics(filter), getWorkshopOptions()])

  const totalGmv = metrics.reduce((n, m) => n + m.gmv, 0)
  const totalTxns = metrics.reduce((n, m) => n + m.paidTransactions, 0)
  const totalPending = metrics.reduce((n, m) => n + m.pending, 0)

  const columns: Column<Row>[] = [
    { key: 'name', label: 'Workshop', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'leanxConfigured', label: 'Payments', render: (r) => (r.leanxConfigured ? <Pill tone="green">live</Pill> : <Pill tone="muted">mock</Pill>) },
    { key: 'gmv', label: 'GMV (paid)', align: 'right', render: (r) => formatMYR(r.gmv) },
    { key: 'paidOrders', label: 'Paid orders', align: 'right' },
    { key: 'confirmedBookings', label: 'Bookings', align: 'right' },
    { key: 'paidTransactions', label: 'Billable txns', align: 'right' },
    { key: 'pending', label: 'Pending', align: 'right', render: (r) => formatMYR(r.pending) },
  ]

  return (
    <>
      <PageHeader title="Billing" subtitle="Billable metrics per workshop. The fee model is not set yet — these are the numbers any model would charge on." />
      <FilterBar workshops={options} range={range} workshopId={workshopId} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Network GMV (paid)" value={formatMYR(totalGmv)} />
        <StatCard label="Billable transactions" value={totalTxns} />
        <StatCard label="Pending (in flight)" value={formatMYR(totalPending)} />
      </div>

      <Section
        title="Per-workshop billable basis"
        right={
          <ExportCsv
            filename="byki-billing.csv"
            headers={['Workshop', 'Payments', 'GMV', 'Paid orders', 'Bookings', 'Billable txns', 'Pending']}
            rows={metrics.map((r) => [r.name, r.leanxConfigured ? 'live' : 'mock', r.gmv, r.paidOrders, r.confirmedBookings, r.paidTransactions, r.pending])}
          />
        }
      >
        <DataTable columns={columns} rows={metrics} empty="No billable activity yet." />
      </Section>

      <p className="mt-4 text-sm text-[var(--muted)]">
        Once a fee model is chosen (flat subscription, commission %, per-booking, or hybrid), the charging
        engine plugs in on top of these numbers — no data changes required.
      </p>
    </>
  )
}
