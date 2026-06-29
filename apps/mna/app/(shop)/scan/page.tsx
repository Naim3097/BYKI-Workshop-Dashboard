'use client'

// Free OBD2 fault-code reader — MNA's design (card/btn-primary/brand), powered by
// the SAME shared engine as Overhaulinyard (@byki/core/diagnose/obd). Each scan
// is logged to diagnose_sessions, so it shows up in BYKI.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  useBluetoothStore,
  useDtcStore,
  WebBluetoothService,
  DtcSource,
  type DtcCode,
} from '@byki/core/diagnose/obd'
import { logDiagnoseSession } from '@byki/core/diagnose'

export default function ScanPage() {
  const bt = useBluetoothStore()
  const dtc = useDtcStore()
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    setSupported(WebBluetoothService.isAvailable())
  }, [])

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

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Free diagnostic</p>
        <h1 className="mt-1 text-3xl">Fault-Code Reader</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Plug in a Bluetooth OBD2 adapter and read your engine &amp; transmission fault codes here —
          free, no app. Works in Chrome on Android or desktop.
        </p>

        {!supported ? (
          <div className="card mt-6 p-5">
            <h3 className="text-base font-semibold text-warning">Scanning needs Chrome on Android or desktop</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Live code scanning uses Web Bluetooth, which iPhone/Safari does not support. You can
              still book a service and we will scan it for you.
            </p>
            <Link href="/book" className="btn-primary mt-4">Book a service</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {/* Step 1 — connect */}
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <span className={`badge ${bt.isConnected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-brand-soft text-brand-dark'}`}>1</span>
                <span className="text-sm font-semibold text-ink-soft">Connect your adapter</span>
              </div>
              {!bt.isConnected ? (
                <div className="mt-4 flex flex-col items-start gap-3">
                  {bt.errorMessage ? <p className="text-xs text-danger">{bt.errorMessage}</p> : null}
                  <button className="btn-primary" disabled={bt.state === 'connecting'} onClick={() => bt.connect()}>
                    {bt.state === 'connecting' ? 'Connecting…' : 'Connect OBD2 Adapter'}
                  </button>
                  <p className="text-xs text-ink-muted">
                    Your browser opens a Bluetooth picker — choose your ELM327 / Vgate adapter, plugged
                    into the car OBD2 port with the ignition on.
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm font-medium text-emerald-300">
                    {bt.connectedAdapter?.deviceName ?? 'Adapter connected'}
                  </span>
                  <button className="btn-secondary ml-auto" onClick={() => bt.disconnect()}>Disconnect</button>
                </div>
              )}
            </div>

            {/* Step 2 — scan */}
            {bt.isConnected ? (
              <div className="card p-5">
                <div className="flex items-center gap-2">
                  <span className={`badge ${hasRead ? 'bg-emerald-500/15 text-emerald-300' : 'bg-brand-soft text-brand-dark'}`}>2</span>
                  <span className="text-sm font-semibold text-ink-soft">Scan fault codes</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button className="btn-primary" disabled={dtc.state === 'reading'} onClick={() => dtc.readDtcs()}>
                    {dtc.state === 'reading' ? 'Scanning…' : hasRead ? 'Scan again' : 'Scan fault codes'}
                  </button>
                  <div className="ml-auto flex gap-2">
                    {dtc.storedDtcs.length > 0 ? <span className="badge bg-red-500/15 text-red-300">{dtc.storedDtcs.length} stored</span> : null}
                    {dtc.pendingDtcs.length > 0 ? <span className="badge bg-yellow-500/15 text-yellow-300">{dtc.pendingDtcs.length} pending</span> : null}
                    {dtc.permanentDtcs.length > 0 ? <span className="badge bg-orange-500/15 text-orange-300">{dtc.permanentDtcs.length} permanent</span> : null}
                  </div>
                </div>
                {dtc.errorMessage ? <p className="mt-3 text-sm text-danger">{dtc.errorMessage}</p> : null}
              </div>
            ) : null}

            {/* Results */}
            {hasRead && dtc.totalCount > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-ink-soft">
                  We found <span className="font-semibold text-ink">{dtc.totalCount}</span> fault code(s):
                </p>
                {[...dtc.storedDtcs, ...dtc.pendingDtcs, ...dtc.permanentDtcs].map((code) => (
                  <DtcRow key={`${code.source}-${code.code}`} dtc={code} />
                ))}
                <Link href="/book" className="btn-primary mt-2 w-full">Book a service to repair</Link>
              </div>
            ) : null}

            {hasRead && dtc.totalCount === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-sm font-semibold text-emerald-300">No fault codes — your car is clean.</p>
                <p className="mt-1 text-xs text-ink-muted">Want a full inspection? Book a service below.</p>
                <Link href="/book" className="btn-secondary mt-3">Book a service</Link>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

function DtcRow({ dtc }: { dtc: DtcCode }) {
  return (
    <div className="card flex items-center gap-3 p-3">
      <span className="font-mono text-sm font-bold text-brand">{dtc.code}</span>
      <span className="flex-1 truncate text-sm text-ink-soft">{dtc.description || 'Unknown code'}</span>
      {dtc.severity ? <span className="badge bg-white/5 text-ink-soft">{dtc.severity}</span> : null}
      {dtc.source === DtcSource.PERMANENT ? <span className="badge bg-red-500/15 text-red-300">PERMANENT</span> : null}
    </div>
  )
}
