'use client'

// Shared OBD2 fault-code reader UI (connect → scan → results). Wraps the core
// OBD engine (Web Bluetooth) + zustand stores, logs each scan as a
// diagnose_session, and renders results with a configurable call-to-action.
// Any workshop app can mount this — same engine, same UI.

import { useEffect, useState } from 'react'
import {
  useBluetoothStore,
  useDtcStore,
  WebBluetoothService,
  DtcSource,
  type DtcCode,
} from './obd'
import { logDiagnoseSession } from './report'
import { Badge, Button, Card, severityColor } from '../ui'

export interface ObdScannerProps {
  /** Where the results CTA links (e.g. a booking section/WhatsApp). */
  ctaHref?: string
  ctaLabel?: string
}

export function ObdScanner({ ctaHref = '#', ctaLabel = 'Book a repair slot' }: ObdScannerProps) {
  const bt = useBluetoothStore()
  const dtc = useDtcStore()
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    setSupported(WebBluetoothService.isAvailable())
  }, [])

  // Record every completed scan as a diagnose_session (feeds the workshop + BYKI).
  useEffect(() => {
    if (dtc.state !== 'complete') return
    const codes = [...dtc.storedDtcs, ...dtc.pendingDtcs, ...dtc.permanentDtcs].map((d) => d.code)
    void logDiagnoseSession({
      source: 'obd',
      vehicleModel: bt.connectedAdapter?.deviceName ?? '',
      faultCodes: codes,
      payload: { totalCount: dtc.totalCount },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dtc.state])

  const hasRead = dtc.state === 'complete'

  if (!supported) {
    return (
      <Card className="space-y-2 border-yellow-500/15 text-center">
        <h3 className="text-base font-bold text-yellow-400">Scanning needs Chrome on Android or desktop</h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-white/50">
          Live code scanning uses Web Bluetooth, which iPhone/Safari does not support. You can still
          book a slot and we will scan it for you.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <StepLabel n={1} done={bt.isConnected}>Connect your adapter</StepLabel>
        {!bt.isConnected ? (
          <Card className="flex flex-col items-center gap-4 text-center">
            {bt.errorMessage && <p className="text-xs text-red-400">{bt.errorMessage}</p>}
            <Button size="lg" disabled={bt.state === 'connecting'} onClick={() => bt.connect()}>
              {bt.state === 'connecting' ? 'Connecting…' : 'Connect OBD2 Adapter'}
            </Button>
            <p className="max-w-xs text-[11px] leading-relaxed text-white/30">
              Your browser will open a Bluetooth picker — choose your ELM327 / Vgate adapter. Plug it
              into the car OBD2 port with the ignition on.
            </p>
          </Card>
        ) : (
          <Card className="flex items-center gap-3">
            <span className="text-sm font-medium text-emerald-400">
              {bt.connectedAdapter?.deviceName ?? 'Adapter connected'}
            </span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => bt.disconnect()}>
              Disconnect
            </Button>
          </Card>
        )}
      </div>

      {bt.isConnected && (
        <div className="space-y-2">
          <StepLabel n={2} done={hasRead}>Scan fault codes</StepLabel>
          <div className="glass flex items-center gap-3 rounded-2xl p-3">
            <Button disabled={dtc.state === 'reading'} onClick={() => dtc.readDtcs()}>
              {dtc.state === 'reading' ? 'Scanning…' : hasRead ? 'Scan Again' : 'Scan Fault Codes'}
            </Button>
            <div className="ml-auto flex gap-2">
              {dtc.storedDtcs.length > 0 && <Badge color="red">{dtc.storedDtcs.length} stored</Badge>}
              {dtc.pendingDtcs.length > 0 && <Badge color="yellow">{dtc.pendingDtcs.length} pending</Badge>}
              {dtc.permanentDtcs.length > 0 && <Badge color="orange">{dtc.permanentDtcs.length} permanent</Badge>}
            </div>
          </div>
          {dtc.errorMessage && (
            <Card className="border-red-500/15"><p className="text-sm text-red-400">{dtc.errorMessage}</p></Card>
          )}
        </div>
      )}

      {hasRead && dtc.totalCount > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-white/60">
            We found <span className="font-bold text-white">{dtc.totalCount}</span> fault code(s):
          </p>
          {[...dtc.storedDtcs, ...dtc.pendingDtcs, ...dtc.permanentDtcs].map((code) => (
            <DtcRow key={`${code.source}-${code.code}`} dtc={code} />
          ))}
          <a href={ctaHref} className="block pt-1">
            <Button size="lg" className="w-full">{ctaLabel}</Button>
          </a>
        </div>
      )}

      {hasRead && dtc.totalCount === 0 && (
        <Card className="py-6 text-center">
          <p className="mb-1 text-sm font-semibold text-emerald-400">No fault codes — your car is clean.</p>
          <p className="text-xs text-white/40">Want a full inspection? {ctaLabel.toLowerCase()}.</p>
        </Card>
      )}
    </div>
  )
}

function StepLabel({ n, done, children }: { n: number; done: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-[var(--accent)] text-black'}`}>
        {n}
      </span>
      <span className="text-sm font-semibold text-white/70">{children}</span>
    </div>
  )
}

function DtcRow({ dtc }: { dtc: DtcCode }) {
  return (
    <Card className="flex items-center gap-3">
      <span className="font-mono text-sm font-bold text-[var(--accent)]">{dtc.code}</span>
      <span className="flex-1 truncate text-sm text-white/60">{dtc.description || 'Unknown code'}</span>
      {dtc.severity && <Badge className={severityColor(dtc.severity)}>{dtc.severity}</Badge>}
      {dtc.source === DtcSource.PERMANENT && <Badge color="red">PERMANENT</Badge>}
    </Card>
  )
}
