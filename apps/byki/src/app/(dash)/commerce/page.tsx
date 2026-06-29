import { getTopProducts, getWorkshopOptions } from '@byki/core/byki'
import { PageHeader, Section, DataTable, formatMYR, type Column } from '@/components/ui'
import { FilterBar } from '@/components/filter-bar'
import { ExportCsv } from '@/components/export-csv'
import { parseFilter } from '@/lib/filters'

export const dynamic = 'force-dynamic'

type Row = { name: string; units: number; revenue: number }

export default async function CommercePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { filter, range, workshopId } = parseFilter(sp)
  const [products, options] = await Promise.all([getTopProducts(filter), getWorkshopOptions()])
  const columns: Column<Row>[] = [
    { key: 'name', label: 'Product', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'units', label: 'Units sold', align: 'right' },
    { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => formatMYR(r.revenue) },
  ]
  return (
    <>
      <PageHeader title="Commerce" subtitle="Best-selling products across the network (paid orders)." />
      <FilterBar workshops={options} range={range} workshopId={workshopId} />
      <Section
        title="Top products"
        right={
          <ExportCsv
            filename="byki-products.csv"
            headers={['Product', 'Units', 'Revenue']}
            rows={products.map((r) => [r.name, r.units, r.revenue])}
          />
        }
      >
        <DataTable columns={columns} rows={products} empty="No sales yet." />
      </Section>
    </>
  )
}
