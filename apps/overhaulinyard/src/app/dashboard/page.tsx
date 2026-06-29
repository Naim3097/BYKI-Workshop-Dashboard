import { redirect } from 'next/navigation'
import { requireWorkshopAccess, AuthError } from '@byki/core/auth'
import { getDashboardData } from '@byki/core/admin/handlers'
import { OwnerDashboard } from '@byki/core/admin'
import { workshop } from '@/config/workshop'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Middleware ensures a session exists; this enforces the caller may access THIS
  // workshop (owner/staff of it, or a byki_admin).
  try {
    await requireWorkshopAccess(workshop.id)
  } catch (e) {
    if (e instanceof AuthError) redirect('/owner-login?next=/dashboard')
    throw e
  }

  const data = await getDashboardData(workshop.id)
  return <OwnerDashboard data={data} title={`${workshop.biz.name} — Dashboard`} />
}
