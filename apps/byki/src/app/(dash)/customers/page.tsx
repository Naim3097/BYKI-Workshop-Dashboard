import { getAllCustomers, getWorkshopOptions } from '@byki/core/byki'
import { PageHeader } from '@/components/ui'
import { FilterBar } from '@/components/filter-bar'
import { CustomersClient } from '@/components/customers-client'
import { parseFilter } from '@/lib/filters'

export const dynamic = 'force-dynamic'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { filter, range, workshopId } = parseFilter(sp)
  const [customers, options] = await Promise.all([getAllCustomers(filter), getWorkshopOptions()])
  return (
    <>
      <PageHeader title="Customers" subtitle="Customers across all workshops, by lifetime spend. Deduplicated by phone per workshop." />
      <FilterBar workshops={options} range={range} workshopId={workshopId} />
      <CustomersClient rows={customers} />
    </>
  )
}
