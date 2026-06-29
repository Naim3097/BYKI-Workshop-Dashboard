import Image from 'next/image'
import { PHONE_DISPLAY, WA, waLink } from '@/lib/site'

export function Footer() {
  return (
    <footer className="relative z-[1] mt-20 border-t border-line-soft bg-night/70 pb-8 pt-14">
      <div className="container-page">
        <div className="grid gap-9 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Image src="/assets/mna-logo.png" alt="MNA Dynamic Torque" width={180} height={52} className="h-12 w-auto" />
            <p className="mt-4 max-w-sm text-sm text-ink-muted">
              Malaysia&apos;s first 3D-diagnostic gearbox specialist. We diagnose with data, fix with
              genuine parts, and back it with a real warranty. <b className="text-ink-soft">Drive Beyond Limit.</b>
            </p>
          </div>
          <div>
            <h4 className="eyebrow mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li><a href="#experience" className="hover:text-ink">3D Simulator</a></li>
              <li><a href="#scan" className="hover:text-ink">Fault Scan</a></li>
              <li><a href="#services" className="hover:text-ink">Services</a></li>
              <li><a href="#parts" className="hover:text-ink">Spare Parts</a></li>
            </ul>
          </div>
          <div>
            <h4 className="eyebrow mb-4">Visit / Contact</h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li><a href={waLink('Hi MNA Dynamic Torque!')} target="_blank" rel="noopener noreferrer" className="hover:text-ink">WhatsApp {PHONE_DISPLAY}</a></li>
              <li><a href={`tel:+${WA}`} className="hover:text-ink">Call {PHONE_DISPLAY}</a></li>
              <li className="text-ink-muted">Mon–Sat 9:00–18:00</li>
            </ul>
          </div>
        </div>
        <div className="mt-9 flex flex-wrap justify-between gap-3 border-t border-line-soft pt-6 text-xs text-ink-muted">
          <span>© {new Date().getFullYear()} MNA Dynamic Torque. All rights reserved.</span>
          <span className="font-mono uppercase tracking-widest text-brand">CVT · DSG · AT · Rebuild · Malaysia</span>
        </div>
      </div>
    </footer>
  )
}
