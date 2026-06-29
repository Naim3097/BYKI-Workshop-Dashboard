'use client';

// ── OBD scanner (connect → detect → results) ────────────────────────
// Uses the proven Byki stores verbatim. Malay UI.

import { useState, useEffect } from 'react';
import {
  useBluetoothStore,
  useDtcStore,
  WebBluetoothService,
  DtcSource,
  type DtcCode,
} from '@byki/core/diagnose/obd';
import { logDiagnoseSession } from '@byki/core/diagnose';
import { Card, Button, Badge, severityColor } from '@/components/ui';
import { BIZ, COPY, waLink } from '@/lib/site-config';

export default function Scanner() {
  const bt = useBluetoothStore();
  const dtc = useDtcStore();
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(WebBluetoothService.isAvailable());
  }, []);

  // Record every completed scan as a diagnose_session (feeds bookings + BYKI).
  useEffect(() => {
    if (dtc.state !== 'complete') return;
    const codes = [...dtc.storedDtcs, ...dtc.pendingDtcs, ...dtc.permanentDtcs].map((d) => d.code);
    void logDiagnoseSession({
      source: 'obd',
      vehicleModel: bt.connectedAdapter?.deviceName ?? '',
      faultCodes: codes,
      payload: { totalCount: dtc.totalCount },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dtc.state]);

  const hasRead = dtc.state === 'complete';
  const c = COPY.scanner;

  if (!supported) {
    return (
      <Card className="text-center space-y-2 border-yellow-500/15">
        <h3 className="text-base font-bold text-yellow-400">{c.unsupportedTitle}</h3>
        <p className="text-sm text-white/50 max-w-sm mx-auto leading-relaxed">{c.unsupportedBody}</p>
        <a href="#tempah" className="inline-block pt-1">
          <Button size="sm" variant="secondary">Tempah Slot</Button>
        </a>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Step 1 — Connect */}
      <div className="space-y-2">
        <StepLabel n={1} done={bt.isConnected}>{c.step1}</StepLabel>
        {!bt.isConnected ? (
          <Card className="flex flex-col items-center gap-4 text-center">
            {bt.errorMessage && <p className="text-xs text-red-400">{bt.errorMessage}</p>}
            <Button size="lg" disabled={bt.state === 'connecting'} onClick={() => bt.connect()}>
              {bt.state === 'connecting' ? c.connecting : c.connect}
            </Button>
            <p className="text-[11px] text-white/30 max-w-xs leading-relaxed">{c.connectHint}</p>
          </Card>
        ) : (
          <Card className="flex items-center gap-3">
            <span className="text-sm text-emerald-400 font-medium">
              {bt.connectedAdapter?.deviceName ?? c.connected}
            </span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => bt.disconnect()}>
              {c.disconnect}
            </Button>
          </Card>
        )}
      </div>

      {/* Step 2 — Detect */}
      {bt.isConnected && (
        <div className="space-y-2">
          <StepLabel n={2} done={hasRead}>{c.step2}</StepLabel>
          <div className="flex items-center gap-3 glass rounded-2xl p-3">
            <Button disabled={dtc.state === 'reading'} onClick={() => dtc.readDtcs()}>
              {dtc.state === 'reading' ? c.detecting : hasRead ? c.rescan : c.detect}
            </Button>
            <div className="ml-auto flex gap-2">
              {dtc.storedDtcs.length > 0 && <Badge color="red">{dtc.storedDtcs.length} tersimpan</Badge>}
              {dtc.pendingDtcs.length > 0 && <Badge color="yellow">{dtc.pendingDtcs.length} menunggu</Badge>}
              {dtc.permanentDtcs.length > 0 && <Badge color="orange">{dtc.permanentDtcs.length} kekal</Badge>}
            </div>
          </div>
          {!hasRead && <p className="text-xs text-white/35 leading-relaxed">{c.detectHint}</p>}
          {dtc.errorMessage && (
            <Card className="border-red-500/15"><p className="text-sm text-red-400">{dtc.errorMessage}</p></Card>
          )}
        </div>
      )}

      {/* Results */}
      {hasRead && dtc.totalCount > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-white/60">
            {c.foundPre} <span className="text-white font-bold">{dtc.totalCount}</span> {c.foundPost}
          </p>
          {[...dtc.storedDtcs, ...dtc.pendingDtcs, ...dtc.permanentDtcs].map((code) => (
            <DtcRow key={`${code.source}-${code.code}`} dtc={code} />
          ))}
          <a href="#tempah" className="block pt-1">
            <Button size="lg" className="w-full">Tempah Slot untuk Baiki — RM{BIZ.feeRM}</Button>
          </a>
        </div>
      )}

      {hasRead && dtc.totalCount === 0 && (
        <Card className="text-center py-6">
          <p className="text-emerald-400 text-sm font-semibold mb-1">{c.clean}</p>
          <p className="text-xs text-white/40">{c.cleanSub}</p>
        </Card>
      )}
    </div>
  );
}

export function PrepGuide() {
  const p = COPY.prep;
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-base font-bold text-white">{p.title}</h3>
        <p className="text-sm text-white/50 leading-relaxed mt-1">{p.intro}</p>
      </div>
      <ol className="space-y-2.5">
        {p.steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm text-white/70 leading-relaxed">
            <span className="shrink-0 w-5 h-5 rounded-md bg-white/10 text-white/80 text-[11px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <div className="card-red rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white font-semibold">{p.noAdapter}</p>
          <p className="text-xs text-white/50">{p.noAdapterSub}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={waLink('Hi Overhaul In Yard, saya nak beli adapter OBD2 untuk imbas kereta.')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg text-xs font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] transition-colors"
          >
            {p.buyWorkshop}
          </a>
          <a
            href={BIZ.purchase.online}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg text-xs font-semibold glass text-white/70 hover:text-white"
          >
            {p.buyOnline}
          </a>
        </div>
      </div>
      <a href="#tempah" className="block text-center text-xs text-white/55 hover:text-white transition-colors">
        {p.orBook}
      </a>
    </div>
  );
}

function StepLabel({ n, done, children }: { n: number; done: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-[var(--accent)] text-white'}`}>
        {n}
      </span>
      <span className="text-sm font-semibold text-white/70">{children}</span>
    </div>
  );
}

function DtcRow({ dtc }: { dtc: DtcCode }) {
  return (
    <Card className="flex items-center gap-3">
      <span className="text-sm font-mono font-bold text-[var(--accent)]">{dtc.code}</span>
      <span className="flex-1 text-sm text-white/60 truncate">{dtc.description || 'Kod tidak dikenali'}</span>
      {dtc.severity && <Badge className={severityColor(dtc.severity)}>{dtc.severity}</Badge>}
      {dtc.source === DtcSource.PERMANENT && <Badge color="red">KEKAL</Badge>}
    </Card>
  );
}
