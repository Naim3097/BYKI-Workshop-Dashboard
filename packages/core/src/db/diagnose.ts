// Diagnose sessions, workshop-scoped. Service-role; server only.
// (Client-side logging from the scanner uses logDiagnoseSession in
// @byki/core/diagnose, which goes through the anon client + RLS.)

import { getAdminClient } from '../supabase/admin'
import type { DiagnoseSession, DiagnoseSource } from '../types'
import { diagnoseFromRow } from './mappers'

export async function listDiagnoseSessions(workshopId: string): Promise<DiagnoseSession[]> {
  const db = getAdminClient()
  const { data, error } = await db
    .from('diagnose_sessions')
    .select('*')
    .eq('workshop_id', workshopId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(diagnoseFromRow)
}

export async function createDiagnoseSession(
  workshopId: string,
  input: {
    source: DiagnoseSource
    vehicleModel?: string
    faultCodes?: string[]
    payload?: Record<string, unknown>
    bookingId?: string | null
  },
): Promise<DiagnoseSession> {
  const db = getAdminClient()
  const { data, error } = await db
    .from('diagnose_sessions')
    .insert({
      workshop_id: workshopId,
      source: input.source,
      vehicle_model: input.vehicleModel ?? '',
      fault_codes: input.faultCodes ?? [],
      payload: (input.payload ?? {}) as never,
      booking_id: input.bookingId ?? null,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return diagnoseFromRow(data)
}
