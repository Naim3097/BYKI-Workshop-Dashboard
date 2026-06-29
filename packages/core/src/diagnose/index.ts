// Shared diagnose surface. Engine-specific entry points are deliberately on
// their own subpaths so client bundles only pull what they use:
//   @byki/core/diagnose/obd      — real OBD2 Web Bluetooth scanning
//   @byki/core/diagnose/cvt-sim  — CVT simulation engine
export * from './types'
export { logDiagnoseSession, lastScanId } from './report'
