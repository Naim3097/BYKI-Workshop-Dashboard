'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/portal', label: 'Sales portal' },
]

export function OwnerNav() {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/owner/login', { method: 'DELETE' })
    router.push('/owner-login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-night/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex flex-col leading-tight">
            <span className="font-head text-base font-bold tracking-tight text-white">
              MNA Dynamic Torque
            </span>
            <span className="eyebrow">Owner workspace</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-card px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-soft text-brand-bright'
                      : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="hidden text-sm text-ink-muted hover:text-ink sm:block">
            View shop
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-card border border-line px-3 py-1.5 text-sm text-ink-soft hover:border-brand hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>
      <nav className="container-page flex gap-1 pb-2 sm:hidden">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 rounded-card px-3 py-2 text-center text-sm font-medium ${
                active ? 'bg-brand-soft text-brand-bright' : 'text-ink-muted'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
