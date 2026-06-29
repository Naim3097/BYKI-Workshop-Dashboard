'use client'

// Browser Supabase client for the owner login form (signInWithPassword,
// signOut). Session is persisted to cookies via @supabase/ssr so the server
// helpers + middleware can read it.

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../supabase/database.types'

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getBrowserSupabase() {
  if (_client) return _client
  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return _client
}
