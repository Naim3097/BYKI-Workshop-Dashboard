import Link from 'next/link'
import { getWorkshopDetail } from '@byki/core/byki'
import { PageHeader, StatCard, Section, DataTable, formatMYR, Pill, type Column } from '@/components/ui'
import { MiniBars } from '@/components/mini-bars'
import { parseFilter } from '@/lib/filters'

export const dynamic = 'force-dynamic'

export default async function WorkshopDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams
  const { filter } = parseFilter(sp)
  const detail = await getWorkshopDetail(id, filter)
  const s = detail.stat

  if (!s) {
    return (
      <>
        <PageHeader title="Workshop" />
        <p className="text-sm text-[var(--muted)]">Workshop not found, or no data in this period.</p>
        <Link href="/workshops" className="mt-4 inline-block text-sm font-medium text-[var(--green-900)] hover:underline">← Back to workshops</Link>
      </>
    )
  }

  type Act = (typeof detail.recent)[number]
  type Prod = (typeof detail.topProducts)[number]
  const actCols: Column<Act>[] = [
    { key: 'kind', label: 'Type', render: (r) => <Pill tone={r.kind === 'order' ? 'green' : 'neutral'}>{r.kind}</Pill> },
    { key: 'label', label: 'Detail', render: (r) => <span className="font-medium">{r.label}</span> },
    { key: 'amount', label: 'Amount', align: 'right', render: (r) => (r.amount != null ? formatMYR(r.amount) : '—') },
    { key: 'at', label: 'When', align: 'right', render: (r) => new Date(r.at).toLocaleString() },
  ]
  const prodCols: Column<Prod>[] = [
    { key: 'name', label: 'Product', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'units', label: 'Units', align: 'right' },
    { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => formatMYR(r.revenue) },
  ]

  return (
    <>
      <Link href="/workshops" className="mb-3 inline-block text-sm font-medium text-[var(--green-900)] hover:underline">← Workshops</Link>
      <PageHeader title={s.name} subtitle={`${s.slug} · ${s.active ? 'active' : 'inactive'} · payments ${s.leanxConfigured ? 'live' : 'mock'}`} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Revenue" value={formatMYR(s.revenue)} />
        <StatCard label="Pending (in flight)" value={formatMYR(s.pending)} />
        <StatCard label="Paid orders" value={s.ordersPaid} />
        <StatCard label="Bookings" value={s.bookingsConfirmed} />
        <StatCard label="Customers" value={s.customers} />
        <StatCard label="Diagnostic scans" value={s.scans} />
        <StatCard label="Last activity" value={s.lastActivity ? new Date(s.lastActivity).toLocaleDateString() : '—'} />
      </div>

      <div className="mt-8">
        <Section title="Revenue by month">
          <MiniBars data={detail.revenueByMonth} />
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Recent activity">
          <DataTable columns={actCols} rows={detail.recent} empty="No activity yet." />
        </Section>
        <Section title="Top products">
          <DataTable columns={prodCols} rows={detail.topProducts} empty="No sales yet." />
        </Section>
      </div>
    </>
  )
}
