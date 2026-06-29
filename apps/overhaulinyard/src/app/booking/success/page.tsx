'use client';

// ── Payment return page (Malay) ─────────────────────────────────────
// LeanX redirects here after checkout. Verifies via /api/check-payment-status.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { BIZ, waLink } from '@/lib/site-config';

type Status = 'loading' | 'confirmed' | 'cancelled' | 'pending';

const COPY: Record<Status, { title: string; body: string }> = {
  loading: { title: 'Mengesahkan pembayaran…', body: 'Sila tunggu sementara kami menyemak status pembayaran anda.' },
  confirmed: { title: 'Tempahan disahkan', body: `Deposit RM${BIZ.feeRM} anda telah diterima. Kami akan hubungi anda tidak lama lagi untuk sahkan temujanji.` },
  cancelled: { title: 'Pembayaran dibatalkan', body: 'Pembayaran anda dibatalkan atau gagal, jadi slot belum disahkan. Anda boleh cuba semula bila-bila masa.' },
  pending: { title: 'Tempahan dihantar', body: 'Kami masih mengesahkan pembayaran anda. Jika berjaya, kami akan hubungi anda. Anda juga boleh sahkan melalui WhatsApp.' },
};

const TITLE_COLOR: Record<Status, string> = {
  loading: 'text-white',
  confirmed: 'text-emerald-400',
  cancelled: 'text-red-400',
  pending: 'text-white',
};

export default function BookingSuccessPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [detail, setDetail] = useState<{ vehicle?: string; slot?: string } | null>(null);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref) {
      setStatus('pending');
      return;
    }
    fetch(`/api/check-payment-status?ref=${encodeURIComponent(ref)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'confirmed' || data.status === 'completed') {
          setStatus('confirmed');
          setDetail({ vehicle: data.vehicleModel, slot: data.timeSlot });
        } else if (data.status === 'cancelled') {
          setStatus('cancelled');
        } else {
          setStatus('pending');
        }
      })
      .catch(() => setStatus('pending'));
  }, []);

  const copy = COPY[status];
  const waText =
    status === 'confirmed'
      ? `Hi Overhaul In Yard, saya dah bayar deposit RM${BIZ.feeRM} untuk tempah slot. Mohon sahkan temujanji saya.`
      : `Hi Overhaul In Yard, saya cuba tempah slot tapi tak pasti pembayaran berjaya. Boleh tolong semak?`;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-16">
      <div className="max-w-md w-full text-center space-y-5 animate-fade-up">
        {status === 'loading' && (
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
        )}

        <div className="space-y-1.5">
          <h1 className={`text-2xl font-bold ${TITLE_COLOR[status]}`}>{copy.title}</h1>
          <p className="text-sm text-white/50 leading-relaxed">{copy.body}</p>
          {detail?.slot && (
            <p className="text-sm text-white/70 pt-1">{detail.slot}{detail.vehicle ? ` · ${detail.vehicle}` : ''}</p>
          )}
        </div>

        {status !== 'loading' && (
          <div className="space-y-2 pt-2">
            <a href={waLink(waText)} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full">Sahkan melalui WhatsApp</Button>
            </a>
            <Link href="/" className="block">
              <Button variant="ghost" className="w-full">Kembali ke laman utama</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
