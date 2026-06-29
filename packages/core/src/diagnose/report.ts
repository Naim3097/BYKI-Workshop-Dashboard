'use client'

// Client-side diagnose-session logger. Runs after a scan (OBD) or sim run and
// records a row in diagnose_sessions via the anon client (RLS allows anon
// insert). No-ops gracefully when Supabase isn't configured so the diagnose
// feature works standalone. Returns the new session id, or null.

import { supabase } from '../supabase/client'
import { getWorkshopId } from '../config'
import type { DiagnoseResult } from './types'

export async function logDiagnoseSession(result: DiagnoseResult): Promise<string | null> {
  if (!supabase) return null
  let workshopId: string
  try {
    workshopId = getWorkshopId()
  } catch {
    return null
  }
  const { data, error } = await supabase
    .from('diagnose_sessions')
    .insert({
      workshop_id: workshopId,
      source: result.source,
      vehicle_model: result.vehicleModel ?? '',
      fault_codes: result.faultCodes,
      payload: (result.payload ?? {}) as never,
    })
    .select('id')
    .single()
  if (error || !data) return null
  const id = data.id as string
  // Remember the scan so a later checkout/booking can attribute it to the customer.
  try {
    window.localStorage.setItem('byki_last_scan', id)
  } catch {
    // ignore (private mode / unavailable)
  }
  return id
}

// The id of the most recent scan in this browser, or null. Checkout/booking
// forms pass this so the scan gets linked to the customer.
export function lastScanId(): string | null {
  try {
    return window.localStorage.getItem('byki_last_scan')
  } catch {
    return null
  }
}
