'use client'

// The Live CVT Simulator console — lazy-loads the self-contained sim (public/sim.html)
// in an iframe on intent, exactly like the storefront. The sim is a standalone
// physics/3D widget; embedding it keeps the page a standardized React build.

import { useState } from 'react'

export function CvtSim() {
  const [launched, setLaunched] = useState(false)

  return (
    <>
      <div className="relative aspect-video min-h-[420px] overflow-hidden rounded-2xl border border-line bg-[#03060f] shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
        <Corners />
        {launched ? (
          <iframe
            src="/sim.html"
            title="Interactive CVT Simulator"
            allow="camera; fullscreen"
            className="h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLaunched(true)}
            className="absolute inset-0 z-[5] flex cursor-pointer flex-col items-center justify-center gap-5 bg-[radial-gradient(720px_400px_at_50%_38%,rgba(52,185,240,0.18),transparent_60%)] text-center"
          >
            <span className="grid h-24 w-24 place-items-center rounded-full border border-line">
              <svg viewBox="0 0 48 48" className="h-11 w-11" fill="none" stroke="#34b9f0" strokeWidth="1.4">
                <circle cx="24" cy="24" r="9" />
                <circle cx="24" cy="24" r="20" strokeDasharray="4 6" />
              </svg>
            </span>
            <span className="max-w-md px-6">
              <span className="block font-head text-2xl font-extrabold text-white sm:text-3xl">The Live CVT Simulator</span>
              <span className="mt-2 block text-sm text-ink-muted">
                A full physics model of a Punch VT2/VT3 continuously-variable transmission. Drive it,
                slice it open, explode the compartments — even steer it with your hand.
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-card bg-gradient-to-br from-brand-bright to-brand-dark px-6 py-3 font-head font-bold text-[#031018] shadow-[0_8px_30px_rgba(52,185,240,0.34)]">
              Launch Simulator
            </span>
          </button>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-muted">
        <span><b className="text-brand">Drag</b> rotate</span>
        <span><b className="text-brand">Scroll</b> zoom</span>
        <span><b className="text-brand">P/R/N/D/S</b> drive</span>
        <span><b className="text-brand">Explode</b> teardown</span>
        <a
          href="/sim.html"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto rounded-card border border-line px-3 py-1.5 text-xs normal-case tracking-normal text-ink-soft hover:border-brand hover:text-ink"
        >
          Open fullscreen
        </a>
      </div>
    </>
  )
}

function Corners() {
  const base = 'pointer-events-none absolute z-[6] h-7 w-7 border-brand opacity-70'
  return (
    <>
      <span className={`${base} left-3 top-3 border-l-2 border-t-2`} />
      <span className={`${base} right-3 top-3 border-r-2 border-t-2`} />
      <span className={`${base} bottom-3 left-3 border-b-2 border-l-2`} />
      <span className={`${base} bottom-3 right-3 border-b-2 border-r-2`} />
    </>
  )
}
