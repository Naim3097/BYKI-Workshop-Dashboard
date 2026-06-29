// Shared diagnose types that bridge BOTH engines (real OBD + CVT sim) into the
// booking flow and BYKI analytics. A scan/sim run yields fault codes + a report
// payload; both are carried into a booking and recorded in diagnose_sessions.

import type { DiagnoseSource } from '../types'

export interface DiagnoseResult {
  source: DiagnoseSource
  vehicleModel?: string
  /** Normalised DTC codes (e.g. "P0700"). Empty array = clean / no codes. */
  faultCodes: string[]
  /** Free-form engine output (analysis summary, findings, signals). */
  payload?: Record<string, unknown>
}

export interface DiagnoseSummary {
  hasFaults: boolean
  count: number
  codes: string[]
}

export function summarize(result: DiagnoseResult): DiagnoseSummary {
  return {
    hasFaults: result.faultCodes.length > 0,
    count: result.faultCodes.length,
    codes: result.faultCodes,
  }
}
