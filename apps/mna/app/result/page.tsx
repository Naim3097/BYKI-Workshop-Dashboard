'use client'

// Post-payment landing for parts orders (the LeanX flow / mock simulator returns here).
import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function ResultInner() {
  const sp = useSearchParams()
  const status = (sp.get('status') || '').toLowerCase()
  const ref = sp.get('ref') || sp.get('invoiceRef') || sp.get('order') || ''
  const failed = ['failed', 'cancelled', 'canceled', 'error'].includes(status)

  return (
    <div className="container-page flex min-h-screen items-center justify-center py-16">
      <div className="card w-full max-w-md p-8 text-center">
        {failed ? (
          <>
            <h1 className="text-2xl font-semibold text-warning">Payment not completed</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Your payment didn&apos;t go through. Nothing was charged — you can try again from the shop.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-positive">Payment received</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Thank you — your order is confirmed. We&apos;ll be in touch on WhatsApp to arrange delivery.
            </p>
            {ref ? <p className="mt-3 font-mono text-xs text-ink-muted">Ref: {ref}</p> : null}
          </>
        )}
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Back to home
        </Link>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="container-page py-16 text-center text-ink-muted">Loading…</div>}>
      <ResultInner />
    </Suspense>
  )
}
