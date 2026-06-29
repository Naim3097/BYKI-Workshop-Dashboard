// Supabase admin client (SERVICE ROLE key — bypasses RLS). Server-only: used by
// the payment routes (create/webhook/status), the db layer's writes, and admin
// handlers. NEVER import this from a client component.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function adminConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

let _admin: SupabaseClient<Database> | null = null

export function getAdminClient(): SupabaseClient<Database> {
  if (_admin) return _admin
  if (!adminConfigured()) {
    throw new Error(
      'Supabase admin not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }
  _admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  return _admin
}
