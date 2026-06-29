import Image from 'next/image';
import { CartButton } from '@byki/core/commerce';
import { BIZ, COPY, waLink } from '@/lib/site-config';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[var(--bg)]/85 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <a href="#top" className="flex items-center gap-2 shrink-0" aria-label={BIZ.name}>
          <Image src="/logo.png" alt={`${BIZ.name} logo`} width={150} height={33} priority className="h-7 w-auto" />
        </a>

        <div className="ml-auto flex items-center gap-2">
          <a
            href="#kedai"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
          >
            Kedai
          </a>
          <a
            href="#tempah"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
          >
            {COPY.nav.book}
          </a>
          <CartButton />
          <a
            href={waLink('Hi Overhaul In Yard, saya nak tanya pasal servis.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] transition-colors shadow-[0_0_18px_var(--accent-glow)]"
          >
            {COPY.nav.whatsapp}
          </a>
        </div>
      </div>
    </header>
  );
}
