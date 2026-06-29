// Supabase browser client (anon key). Used for the public catalogue read and
// the public diagnose-session log. Guarded by RLS. No-ops gracefully when not
// configured so the diagnose feature works before Supabase is wired.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseConfigured = !!url && !!anonKey

let _client: SupabaseClient<Database> | null = null
if (supabaseConfigured) {
  _client = createClient<Database>(url!, anonKey!)
}

export const supabase = _client
