'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { formatMYR } from '@/lib/format'

interface StatusInfo {
  found: boolean
  type?: 'order' | 'booking'
  invoiceRef?: string
  status?: string
  paymentStatus?: string
  amount?: number
  customerName?: string
}

function ResultInner() {
  const search = useSearchParams()
  const ref = search.get('ref') || ''
  const [info, setInfo] = useState<StatusInfo | null>(null)
  const [tries, setTries] = useState(0)

  // Poll briefly: the webhook may land a moment after redirect.
  useEffect(() => {
    if (!ref) return
    let active = true
    const load = () =>
      fetch(`/api/payments/status?ref=${encodeURIComponent(ref)}`)
        .then((r) => r.json())
        .then((d) => {
          if (active) setInfo(d)
        })
        .catch(() => {})
    load()
    const id = setInterval(() => {
      setTries((t) => t + 1)
      load()
    }, 1500)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [ref])

  // Stop polling once resolved (handled implicitly: UI just reflects latest).
  const paid = info?.paymentStatus === 'SUCCESS'
  const failed = info?.paymentStatus === 'FAILED' || info?.paymentStatus === 'CANCELLED'

  return (
    <div className="container-page py-12">
      <div className="card mx-auto max-w-md p-8 text-center">
        {paid ? (
          <>
            <div className="badge mx-auto bg-positive/10 text-positive">Payment successful</div>
            <h1 className="mt-3 text-lg font-semibold text-ink">Thank you</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Your {info?.type === 'booking' ? 'booking deposit' : 'order'} of{' '}
              {info?.amount != null ? formatMYR(info.amount) : ''} is confirmed.
            </p>
          </>
        ) : failed ? (
          <>
            <div className="badge mx-auto bg-danger/10 text-danger">Payment not completed</div>
            <h1 className="mt-3 text-lg font-semibold text-ink">Something went wrong</h1>
            <p className="mt-2 text-sm text-ink-soft">
              The payment was cancelled or failed. You can try again from your cart.
            </p>
          </>
        ) : (
          <>
            <div className="badge mx-auto bg-warning/10 text-warning">Checking payment</div>
            <h1 className="mt-3 text-lg font-semibold text-ink">Confirming your payment</h1>
            <p className="mt-2 text-sm text-ink-muted">
              This usually takes a few seconds{tries > 4 ? '. Still checking...' : '...'}
            </p>
          </>
        )}

        {info?.invoiceRef ? (
          <p className="mt-4 text-xs text-ink-muted">Reference {info.invoiceRef}</p>
        ) : null}

        <Link href="/" className="btn-primary mt-6">
          Back to shop
        </Link>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="container-page py-12 text-sm text-ink-muted">Loading...</div>}>
      <ResultInner />
    </Suspense>
  )
}
