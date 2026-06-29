// Real OBD2 fault-code reading via Web Bluetooth (lifted from Overhaulinyard).
// Client-only (navigator.bluetooth). Reads live DTCs from an ELM327/Vgate
// adapter and exposes zustand stores the scanner UI binds to.

export * from './models'
export { WebBluetoothService } from './core/web-bluetooth-service'
export { OBDScanService } from './core/obd-scan-service'
export { AnalysisEngine } from './core/analysis-engine'
export { DtcLookupService } from './core/dtc-lookup-service'
export { useBluetoothStore, type BleConnectionState } from './stores/bluetooth-store'
export { useDtcStore, type DtcState } from './stores/dtc-store'
