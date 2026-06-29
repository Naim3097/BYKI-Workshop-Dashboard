'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from './CartProvider'

const nav = [
  { href: '/', label: 'Shop' },
  { href: '/book', label: 'Book service' },
]

export function SiteHeader() {
  const { count } = useCart()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold tracking-tight text-ink sm:text-base">
            MNA Dynamic Torque
          </span>
          <span className="hidden text-xs text-ink-muted sm:block">
            Spare parts and workshop service
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {nav.map((item) => {
            const active =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-card px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
                  active ? 'bg-brand-soft text-brand-dark' : 'text-ink-soft hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
          <Link
            href="/cart"
            className="relative whitespace-nowrap rounded-card px-2.5 py-2 text-sm font-medium text-ink-soft hover:bg-white/5 sm:px-3"
          >
            Cart
            {count > 0 ? (
              <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-xs font-semibold text-white">
                {count}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  )
}
