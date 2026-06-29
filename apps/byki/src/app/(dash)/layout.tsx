import { redirect } from 'next/navigation'
import { requireBykiAdmin, AuthError } from '@byki/core/auth'
import { Shell } from '@/components/shell'

export const dynamic = 'force-dynamic'

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  let email: string | null = null
  try {
    const ctx = await requireBykiAdmin()
    email = ctx.email
  } catch (e) {
    if (e instanceof AuthError) redirect('/login')
    throw e
  }
  return <Shell email={email}>{children}</Shell>
}
