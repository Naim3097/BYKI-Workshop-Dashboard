'use client'

// Mock LeanX bill page (PAYMENTS_MODE=mock). Stands in for the hosted gateway:
// "pay" fires the same webhook LeanX would, then returns the buyer to the app.
// Removed in production (live mode redirects to the real LeanX page instead).

import { useParams, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Button, Card } from '@/components/ui'

export default function MockPayPage() {
  return (
    <Suspense fallback={null}>
      <MockPay />
    </Suspense>
  )
}

function MockPay() {
  const params = useParams<{ ref: string }>()
  const search = useSearchParams()
  const ref = decodeURIComponent(params.ref)
  const returnUrl = search.get('return') || '/'
  const [busy, setBusy] = useState(false)

  async function settle(status: 'SUCCESS' | 'FAILED') {
    setBusy(true)
    await fetch('/api/payment-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_no: ref, invoice_status: status, amount: '0' }),
    }).catch(() => {})
    const sep = returnUrl.includes('?') ? '&' : '?'
    window.location.href = `${returnUrl}${returnUrl.includes('ref=') ? '' : `${sep}ref=${ref}`}`
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 text-white">
      <Card className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-wide text-white/40">Simulator pembayaran (mock)</p>
        <p className="font-mono text-sm">{ref}</p>
        <p className="text-sm text-white/60">
          Mod mock aktif — tiada bayaran sebenar. Pilih hasil untuk teruskan.
        </p>
        <div className="flex gap-3">
          <Button className="w-1/2" disabled={busy} onClick={() => settle('SUCCESS')}>
            Bayar (Berjaya)
          </Button>
          <Button variant="danger" className="w-1/2" disabled={busy} onClick={() => settle('FAILED')}>
            Gagal
          </Button>
        </div>
      </Card>
    </div>
  )
}
