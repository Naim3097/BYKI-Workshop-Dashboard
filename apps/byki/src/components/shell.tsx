'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getBrowserSupabase } from '@byki/core/auth/client'

const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/workshops', label: 'Workshops' },
  { href: '/customers', label: 'Customers' },
  { href: '/diagnose', label: 'Diagnose' },
  { href: '/commerce', label: 'Commerce' },
  { href: '/bookings', label: 'Bookings' },
  { href: '/billing', label: 'Billing' },
]

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

export function Shell({ email, children }: { email: string | null; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    await getBrowserSupabase().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const nav = (onNavigate?: () => void) => (
    <nav className="flex-1 px-3 py-2">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`mb-1 block rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active ? 'bg-white/12 font-semibold text-white' : 'font-medium text-white/65 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  const footer = (
    <div className="border-t border-white/10 px-4 py-4">
      {email && <p className="mb-2 truncate text-xs text-white/45">{email}</p>}
      <button onClick={logout} className="text-sm font-medium text-white/70 hover:text-white">
        Sign out
      </button>
    </div>
  )

  return (
    <div className="min-h-screen lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[var(--green-900)] lg:flex">
        <div className="px-5 py-6">
          <Image src="/byki-logo-white.png" alt="BYKI" width={88} height={30} className="h-7 w-auto" priority />
          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/45">Master Admin</p>
        </div>
        {nav()}
        {footer}
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-[var(--green-900)] px-4 py-3 lg:hidden">
        <Image src="/byki-logo-white.png" alt="BYKI" width={76} height={26} className="h-6 w-auto" priority />
        <button onClick={() => setOpen(true)} className="text-sm font-medium text-white">
          Menu
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[var(--green-900)]">
            <div className="flex items-center justify-between px-5 py-5">
              <Image src="/byki-logo-white.png" alt="BYKI" width={80} height={28} className="h-7 w-auto" />
              <button onClick={() => setOpen(false)} className="text-sm font-medium text-white/70">
                Close
              </button>
            </div>
            {nav(() => setOpen(false))}
            {footer}
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-10">{children}</main>
    </div>
  )
}
