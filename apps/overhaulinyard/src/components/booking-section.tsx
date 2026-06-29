'use client';

// ── Booking section ─────────────────────────────────────────────────
// Reads detected fault codes from the shared DTC store and feeds them
// into the booking form, so the workshop knows what's coming in.

import { useDtcStore } from '@byki/core/diagnose/obd';
import { Card } from '@/components/ui';
import BookingForm from '@/components/booking-form';
import { BIZ } from '@/lib/site-config';

export default function BookingSection() {
  const dtc = useDtcStore();
  const codes = [...dtc.storedDtcs, ...dtc.pendingDtcs, ...dtc.permanentDtcs].map((c) => c.code);

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      <div className="text-center space-y-1">
        <h2 className="display text-2xl sm:text-3xl text-white">
          Tempah <span className="accent-serif text-[var(--accent)]">Slot</span> Pemeriksaan
        </h2>
        <p className="text-sm text-white/50">
          Deposit <span className="text-[var(--accent)] font-bold">RM{BIZ.feeRM}</span> — ditolak sepenuhnya dari kos servis anda.
        </p>
      </div>
      <Card><BookingForm faultCodes={codes} /></Card>
    </div>
  );
}
