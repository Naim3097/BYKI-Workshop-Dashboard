import Link from 'next/link'
import { CartProvider } from '@/components/CartProvider'
import { SiteHeader } from '@/components/SiteHeader'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line bg-surface">
          <div className="container-page flex flex-col gap-2 py-6 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
            <span>MNA Dynamic Torque. Proof-of-concept commerce system.</span>
            <Link href="/dashboard" className="text-ink-soft hover:text-brand">
              Owner area
            </Link>
          </div>
        </footer>
      </div>
    </CartProvider>
  )
}
