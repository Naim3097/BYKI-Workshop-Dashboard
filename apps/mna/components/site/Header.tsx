import Image from 'next/image'
import { CartButton } from '@byki/core/commerce'
import { waLink } from '@/lib/site'

const NAV = [
  { href: '#parts', label: 'Spare Parts' },
  { href: '#experience', label: '3D Experience' },
  { href: '#scan', label: 'Fault Scan' },
  { href: '#services', label: 'Services' },
  { href: '#book', label: 'Book' },
  { href: '#contact', label: 'Contact' },
]

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line-soft bg-night/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-4">
        <a href="#top" className="flex shrink-0 items-center" aria-label="MNA Dynamic Torque — home">
          <Image
            src="/assets/mna-logo.png"
            alt="MNA Dynamic Torque"
            width={160}
            height={46}
            priority
            className="h-9 w-auto sm:h-10"
          />
        </a>

        <nav className="ml-2 hidden items-center gap-6 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="font-head text-sm text-ink-muted transition-colors hover:text-ink"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <CartButton />
          <a
            href={waLink("Hi MNA Dynamic Torque, I'd like to book a CVT diagnostic.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-card bg-[#25d366] px-3.5 py-2 text-sm font-bold text-[#04140a] shadow-[0_8px_24px_rgba(37,211,102,0.32)] transition-transform hover:-translate-y-0.5 sm:px-4"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.519 5.262l-.999 3.648 3.969-1.04z" />
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </header>
  )
}
