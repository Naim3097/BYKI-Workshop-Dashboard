import { getDiagnoseAnalytics, getWorkshopOptions } from '@byki/core/byki'
import { PageHeader, StatCard, Section, DataTable, type Column } from '@/components/ui'
import { FilterBar } from '@/components/filter-bar'
import { parseFilter } from '@/lib/filters'

export const dynamic = 'force-dynamic'

type Fault = { code: string; count: number }

export default async function DiagnosePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { filter, range, workshopId } = parseFilter(sp)
  const [d, options] = await Promise.all([getDiagnoseAnalytics(filter), getWorkshopOptions()])
  const columns: Column<Fault>[] = [
    { key: 'code', label: 'Fault code', render: (r) => <span className="font-mono font-medium">{r.code}</span> },
    { key: 'count', label: 'Occurrences', align: 'right' },
  ]
  return (
    <>
      <PageHeader title="Diagnose Analytics" subtitle="Fault-code intelligence across the whole network." />
      <FilterBar workshops={options} range={range} workshopId={workshopId} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total scans" value={d.totalScans} />
        <StatCard label="OBD / CVT sim" value={`${d.obd} / ${d.cvtSim}`} />
        <StatCard label="Linked to a customer" value={d.linkedToCustomer} />
        <StatCard label="Scan to booking" value={`${Math.round(d.conversionRate * 100)}%`} sub={`${d.convertedToBooking} converted`} />
      </div>
      <div className="mt-8">
        <Section title="Most common fault codes">
          <DataTable columns={columns} rows={d.topFaultCodes} empty="No fault codes recorded yet." />
        </Section>
      </div>
    </>
  )
}
