'use client';

// ── Booking + RM10 deposit form (Malay) ─────────────────────────────
// Step 1: maklumat + tarikh + slot · Step 2: semak, bayar (LeanX).
// Carries detected OBD fault codes into the booking. Degrades gracefully
// when Supabase/LeanX aren't configured yet.

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';
import { Button } from '@/components/ui';
import { lastScanId } from '@byki/core/diagnose';
import { BIZ } from '@/lib/site-config';

interface BookingFormProps {
  faultCodes: string[];
  defaultVehicle?: string;
}

export default function BookingForm({ faultCodes, defaultVehicle = '' }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState(defaultVehicle);
  const [issues, setIssues] = useState(
    faultCodes.length ? `Kod dikesan: ${faultCodes.join(', ')}` : ''
  );
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string | undefined>(undefined);

  // Next 12 working days (skip Ahad / Sunday).
  const days = useMemo(() => {
    const out: Date[] = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (out.length < 12) {
      if (d.getDay() !== 0) out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, []);

  const inputClasses =
    'w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:border-[var(--accent)]/50 focus:ring-0 outline-none transition-colors';

  const canProceed = name && phone && vehicle && date && timeSlot;

  async function handleSubmit() {
    if (!date || !timeSlot) return;
    setLoading(true);
    setError(null);

    try {
      // LeanX requires an email; generate a guest address from the phone (no UI field).
      const guestEmail = `guest${phone.replace(/\D/g, '').slice(-6)}@workshop-booking.my`;

      // The booking is created server-side (price recomputed, secrets server-only)
      // by @byki/core's payment flow. We just hand over the details.
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking',
          customer: { name, email: guestEmail, phone },
          diagnoseSessionId: lastScanId() ?? undefined,
          booking: {
            serviceType: 'inspection',
            vehicleModel: vehicle,
            preferredDate: format(date, 'yyyy-MM-dd'),
            timeSlot,
            notes: issues,
            faultCodes,
          },
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API pembayaran tidak tersedia.');
      }

      const paymentData = await response.json();
      if (!response.ok) {
        throw new Error(paymentData.message || paymentData.error || 'Gagal memulakan pembayaran');
      }

      if (paymentData.success && paymentData.paymentLink) {
        window.location.href = paymentData.paymentLink;
      } else {
        throw new Error('Respons tidak sah daripada gerbang pembayaran');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses tempahan. Sila cuba lagi.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg border transition-all ${step >= i ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-transparent text-white/40 border-white/15'}`}>
              {i}
            </div>
            <span className={`text-xs font-medium uppercase tracking-wide ${step >= i ? 'text-white/80' : 'text-white/30'}`}>
              {i === 1 ? 'Maklumat' : 'Semak'}
            </span>
            {i < 2 && <div className={`flex-1 h-px ${step > i ? 'bg-[var(--accent)]' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-up">
          <input className={inputClasses} placeholder="Nama anda" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={inputClasses} type="tel" placeholder="No. telefon (cth. 012-3456789)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className={inputClasses} placeholder="Kereta (cth. Perodua Myvi 2019)" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
          <textarea className={`${inputClasses} resize-none`} rows={3} placeholder="Terangkan masalah (pilihan)" value={issues} onChange={(e) => setIssues(e.target.value)} />

          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Pilih tarikh</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
              {days.map((d) => {
                const sel = !!date && d.toDateString() === date.toDateString();
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => { setDate(d); setTimeSlot(undefined); }}
                    className={`flex flex-col items-center py-2.5 rounded-xl border transition-all ${sel ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-white/[0.03] border-white/10 text-white/55 hover:text-white hover:border-white/20'}`}
                  >
                    <span className="text-[10px] uppercase tracking-wide opacity-70">{format(d, 'EEE', { locale: ms })}</span>
                    <span className="text-sm font-bold mt-0.5">{format(d, 'd MMM', { locale: ms })}</span>
                  </button>
                );
              })}
            </div>

            {date && (
              <>
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Pilih masa</p>
                <div className="grid grid-cols-2 gap-2">
                  {BIZ.slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${timeSlot === slot ? 'bg-[var(--accent)]/15 border-[var(--accent)]/50 text-white' : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white/80'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Button size="lg" className="w-full" disabled={!canProceed} onClick={() => setStep(2)}>
            Teruskan
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-up">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3 text-sm">
            {[
              { label: 'Pelanggan', value: name },
              { label: 'Hubungi', value: phone },
              { label: 'Kereta', value: vehicle },
              { label: 'Tarikh', value: date ? format(date, 'PPP', { locale: ms }) : '-' },
              { label: 'Masa', value: timeSlot || '-' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-white/40 text-xs uppercase tracking-wider">{label}</span>
                <span className="font-medium text-white/90">{value}</span>
              </div>
            ))}
            {faultCodes.length > 0 && (
              <div className="pt-1">
                <span className="text-white/40 text-xs uppercase tracking-wider">Kod kerosakan</span>
                <p className="text-white/70 font-mono text-xs mt-1">{faultCodes.join(', ')}</p>
              </div>
            )}
          </div>

          <div className="card-red rounded-xl p-4 text-center">
            <p className="text-sm text-white/80">
              Deposit <span className="font-bold text-[var(--accent)]">RM{BIZ.feeRM}</span> — ditolak sepenuhnya dari kos servis anda.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-950/40 text-red-300 text-sm border border-red-900/40 rounded-xl break-words">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" className="w-1/3" disabled={loading} onClick={() => setStep(1)}>
              Kembali
            </Button>
            <Button className="w-2/3" disabled={loading} onClick={handleSubmit}>
              {loading ? 'Memproses…' : `Bayar RM${BIZ.feeRM} & Sahkan`}
            </Button>
          </div>
          <p className="text-[10px] text-center text-white/25">
            Pembayaran selamat melalui LeanX · perbankan online &amp; e-wallet
          </p>
        </div>
      )}
    </div>
  );
}
