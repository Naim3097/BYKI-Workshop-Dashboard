import Image from 'next/image';
import { BIZ, waLink } from '@/lib/site-config';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div className="space-y-3">
          <Image src="/logo.png" alt={`${BIZ.name} logo`} width={160} height={35} className="h-8 w-auto" />
          <p className="text-sm text-white/45 leading-relaxed max-w-xs">
            {BIZ.legalName}. {BIZ.trustline}.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Hubungi</p>
          <a
            href={waLink('Hi Overhaul In Yard, saya nak tanya pasal servis.')}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-white/60 hover:text-[var(--accent)] transition-colors"
          >
            WhatsApp · {BIZ.phoneDisplay}
          </a>
          <p className="text-white/45">{BIZ.hours}</p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Lokasi</p>
          <p className="text-white/60 leading-relaxed">
            {BIZ.addressLine}<br />
            {BIZ.city}, {BIZ.state}
          </p>
        </div>
      </div>
      <div className="border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 text-[11px] text-white/30 flex flex-wrap items-center justify-between gap-2">
          <span>© {BIZ.since}–{BIZ.since + 7} {BIZ.name}. Hak cipta terpelihara.</span>
          <span className="font-mono">Pakar Servis &amp; Transmisi · {BIZ.state}</span>
        </div>
      </div>
    </footer>
  );
}
