'use client'

// Order payment return page. LeanX (or the mock simulator) redirects here with
// ?ref=ORDER-xxx; we verify via /api/check-payment-status.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'

type Status = 'loading' | 'paid' | 'cancelled' | 'pending'

const COPY: Record<Status, { title: string; body: string; color: string }> = {
  loading: { title: 'Mengesahkan pembayaran…', body: 'Sila tunggu sebentar.', color: 'text-white' },
  paid: { title: 'Pembayaran berjaya', body: 'Terima kasih! Pesanan anda telah disahkan.', color: 'text-emerald-400' },
  cancelled: { title: 'Pembayaran dibatalkan', body: 'Pembayaran gagal atau dibatalkan.', color: 'text-red-400' },
  pending: { title: 'Pesanan dihantar', body: 'Kami masih mengesahkan pembayaran anda.', color: 'text-white' },
}

export default function ShopSuccessPage() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (!ref) return setStatus('pending')
    fetch(`/api/check-payment-status?ref=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === 'paid' || d.status === 'fulfilled') setStatus('paid')
        else if (d.status === 'cancelled') setStatus('cancelled')
        else setStatus('pending')
      })
      .catch(() => setStatus('pending'))
  }, [])

  const c = COPY[status]
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      {status === 'loading' && (
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      )}
      <h1 className={`text-2xl font-bold ${c.color}`}>{c.title}</h1>
      <p className="mt-2 text-sm text-white/50">{c.body}</p>
      <div className="mt-6 flex gap-3">
        <Link href="/#kedai"><Button variant="secondary">Kembali ke Kedai</Button></Link>
        <Link href="/"><Button variant="ghost">Laman Utama</Button></Link>
      </div>
    </div>
  )
}
