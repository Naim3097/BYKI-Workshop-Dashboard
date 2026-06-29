'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { formatMYR } from '@/lib/format'

interface StatusInfo {
  found: boolean
  amount?: number
  customerName?: string
  invoiceRef?: string
  type?: 'order' | 'booking'
}

// Stand-in for the LeanX hosted bill page. Active only while PAYMENTS_MODE=mock.
// Once the real LeanX UUID is supplied, create-bill returns LeanX's own URL and
// this page is never reached.
function SimulatedPaymentInner() {
  const params = useParams<{ ref: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const ref = decodeURIComponent(params.ref)
  // Where to send the buyer after paying (may be the static storefront). Falls
  // back to the backend result page.
  const returnTarget = search.get('return')
  const [info, setInfo] = useState<StatusInfo | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    fetch(`/api/payments/status?ref=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch(() => setInfo({ found: false }))
  }, [ref])

  const pay = async (outcome: 'success' | 'fail') => {
    setWorking(true)
    await fetch('/api/payments/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, outcome }),
    })
    if (returnTarget) {
      // Absolute URL already includes ?ref=...; send the buyer back to it.
      window.location.href = returnTarget
    } else {
      router.push(`/result?ref=${encodeURIComponent(ref)}`)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Secure payment (simulated gateway)
        </div>
        <h1 className="text-lg font-semibold text-ink">MNA Dynamic Torque</h1>

        <div className="mt-5 rounded-card bg-canvas p-4">
          <Row label="Reference" value={ref} />
          {info?.customerName ? <Row label="Payer" value={info.customerName} /> : null}
          <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
            <span className="text-sm text-ink-muted">Amount due</span>
            <span className="text-xl font-semibold text-ink">
              {info?.amount != null ? formatMYR(info.amount) : '-'}
            </span>
          </div>
        </div>

        {info && !info.found ? (
          <p className="mt-4 text-sm text-danger">Payment reference not found.</p>
        ) : (
          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={() => pay('success')}
              disabled={working}
              className="btn-primary w-full"
            >
              {working ? 'Processing...' : 'Pay now'}
            </button>
            <button
              type="button"
              onClick={() => pay('fail')}
              disabled={working}
              className="btn-secondary w-full"
            >
              Cancel payment
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-ink-muted">
          This screen replaces the LeanX payment page until the live collection
          UUID is configured.
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  )
}

export default function SimulatedPaymentPage() {
  return (
    <Suspense fallback={null}>
      <SimulatedPaymentInner />
    </Suspense>
  )
}
