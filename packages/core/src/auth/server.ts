// Server-side Supabase Auth helpers (App Router). Uses @supabase/ssr so the
// session is read from cookies in Server Components, Route Handlers, and the
// middleware. Roles + workshop scoping come from public.profiles.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '../supabase/database.types'
import type { Profile, UserRole } from '../types'

export async function getServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Record<string, unknown>),
            )
          } catch {
            // Called from a Server Component — middleware refreshes the session.
          }
        },
      },
    },
  )
}

export interface AuthContext {
  userId: string
  email: string | null
  profile: Profile | null
}

// Returns the signed-in user + their profile (role + workshop), or null.
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const result = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  const data = result.data as Database['public']['Tables']['profiles']['Row'] | null

  const profile: Profile | null = data
    ? {
        id: data.id,
        workshopId: data.workshop_id,
        role: data.role,
        fullName: data.full_name,
        createdAt: data.created_at,
      }
    : null

  return { userId: user.id, email: user.email ?? null, profile }
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

// Guards an owner/staff (or byki_admin) action and returns the workshop_id the
// caller may act on. byki_admin may target any workshop via `requestedWorkshopId`.
export async function requireWorkshopAccess(requestedWorkshopId?: string): Promise<{
  workshopId: string
  role: UserRole
  userId: string
}> {
  const ctx = await getAuthContext()
  if (!ctx || !ctx.profile) throw new AuthError('Unauthorized', 401)

  const { role, workshopId } = ctx.profile
  if (role === 'byki_admin') {
    const target = requestedWorkshopId ?? workshopId
    if (!target) throw new AuthError('Workshop id required for byki_admin', 400)
    return { workshopId: target, role, userId: ctx.userId }
  }
  if (!workshopId) throw new AuthError('No workshop assigned', 403)
  if (requestedWorkshopId && requestedWorkshopId !== workshopId) {
    throw new AuthError('Forbidden: cross-workshop access', 403)
  }
  return { workshopId, role, userId: ctx.userId }
}

// Guards the BYKI master-admin app: the signed-in user must have role byki_admin.
export async function requireBykiAdmin(): Promise<{ userId: string; email: string | null }> {
  const ctx = await getAuthContext()
  if (!ctx) throw new AuthError('Unauthorized', 401)
  if (ctx.profile?.role !== 'byki_admin') throw new AuthError('Forbidden: BYKI admin only', 403)
  return { userId: ctx.userId, email: ctx.email }
}
