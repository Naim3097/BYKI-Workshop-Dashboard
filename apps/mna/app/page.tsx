// ─────────────────────────────────────────────────────────────────────
// MNA Dynamic Torque — single landing page (React, standardized build).
// Same build as Overhaulinyard: server component pulls products via @byki/core,
// uses core commerce (ProductGrid + CartDrawer) and the shared OBD engine; only
// the design/copy is MNA's. Hero → CVT sim → Fault scan → Services → Shop →
// Why → Process → Contact.
// ─────────────────────────────────────────────────────────────────────

import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { Honeycomb } from '@/components/Honeycomb'
import { CvtSim } from '@/components/CvtSim'
import { Scanner } from '@/components/Scanner'
import { CartDrawer } from '@byki/core/commerce'
import { ShopSection } from '@/components/ShopSection'
import { BookingForm } from '@/components/BookingForm'
import { listProductsWithStock } from '@byki/core/db'
import { workshop } from '@/lib/workshop'
import { PHONE_DISPLAY, WA, waLink } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const products = (await listProductsWithStock(workshop.id).catch(() => [])).filter((p) => p.active)

  return (
    <div id="top" className="relative">
      <Honeycomb />
      <Header />

      <main className="relative z-[1] pt-16">
        {/* ═══ HERO ═══ */}
        <section className="relative px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="container-page">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/mna-logo.png"
              alt="MNA Dynamic Torque — Drive Beyond Limit"
              className="mx-auto mb-4 h-24 w-auto sm:h-36"
            />
            <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-brand-soft px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-danger" /> World-first · interactive 3D gearbox
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-head text-4xl font-extrabold leading-[1.04] text-white sm:text-6xl">
              See <span className="mna-chrome">inside your gearbox</span> before we touch a single bolt.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
              MNA Dynamic Torque is the workshop where you drive, explode and inspect a real CVT in 3D —
              right here in your browser. Then we diagnose yours with the same precision, and fix it with
              a warranty.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#book"
                className="inline-flex w-full items-center justify-center rounded-card bg-gradient-to-br from-brand-bright to-brand-dark px-7 py-3.5 font-head font-bold text-[#031018] shadow-[0_8px_30px_rgba(52,185,240,0.34)] transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Book a Diagnostic
              </a>
              <a
                href="#experience"
                className="inline-flex w-full items-center justify-center rounded-card border border-line bg-brand-soft px-7 py-3.5 font-head font-semibold text-ink transition-colors hover:border-brand sm:w-auto"
              >
                Try the 3D Simulator
              </a>
            </div>
            <p className="mt-4 font-mono text-[10.5px] uppercase tracking-widest text-ink-muted">
              Drive beyond limit · no app · no login · works on your phone
            </p>
          </div>
        </section>

        {/* ═══ 3D EXPERIENCE ═══ */}
        <section id="experience" className="scroll-mt-20 px-4 pb-20 sm:px-6">
          <div className="container-page max-w-5xl">
            <CvtSim />
          </div>
        </section>

        {/* ═══ FREE OBD2 FAULT SCAN ═══ */}
        <section id="scan" className="scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="container-page max-w-2xl">
            <SectionHead kicker="Free OBD2 diagnostic" title={<>Read your own <Red>fault codes</Red></>} center>
              Plug a Bluetooth OBD2 adapter into your car and scan your engine &amp; transmission fault
              codes right here — free, no app. Then book us to fix them properly.
            </SectionHead>
            <div className="mt-8">
              <Scanner />
            </div>
          </div>
        </section>

        {/* ═══ TRUST ═══ */}
        <div className="border-y border-line-soft bg-gradient-to-b from-surface/60 to-night/40">
          <div className="container-page grid grid-cols-2 gap-6 py-9 sm:grid-cols-4">
            {TRUST.map((s) => (
              <div key={s.l} className="text-center">
                <div className="bg-gradient-to-b from-white to-brand bg-clip-text font-head text-3xl font-extrabold italic text-transparent sm:text-4xl">
                  {s.n}
                </div>
                <div className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-muted">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SERVICES ═══ */}
        <section id="services" className="scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="container-page max-w-5xl">
            <SectionHead kicker="What we do" title={<>CVT &amp; automatic gearbox, <Red>done right</Red></>} center>
              We specialise in continuously-variable and automatic transmissions — Proton, Perodua, Honda,
              Nissan, Toyota and more. Not a general mechanic guessing; a transmission specialist diagnosing.
            </SectionHead>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((s) => (
                <div key={s.t} className="rounded-2xl border border-line-soft bg-gradient-to-b from-surface/55 to-night/40 p-6 transition-transform hover:-translate-y-1">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-card border border-line bg-brand-soft">
                    <span className="h-4 w-4 rounded-sm bg-brand" />
                  </div>
                  <h3 className="font-head text-lg font-bold text-white">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SHOP ═══ */}
        {products.length > 0 && (
          <section id="parts" className="scroll-mt-20 px-4 py-16 sm:px-6">
            <div className="container-page max-w-5xl">
              <SectionHead kicker="Spare parts supply" title={<>The same parts we trust, <Red>now yours to buy</Red></>} center>
                Genuine-spec CVT and automatic transmission parts — retail and wholesale. Bulk pricing
                applies automatically at checkout when you reach a part&apos;s wholesale quantity.
              </SectionHead>
              <div className="mt-8">
                <ShopSection products={products} />
              </div>
            </div>
          </section>
        )}

        {/* ═══ WHY MNA ═══ */}
        <section id="why" className="scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="container-page grid max-w-5xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="eyebrow">Why MNA Dynamic Torque</p>
              <h2 className="mt-3 font-head text-3xl font-extrabold text-white sm:text-4xl">
                Specialists, <Red>not guesswork.</Red>
              </h2>
              <div className="mt-7 space-y-5">
                {WHY.map((f) => (
                  <div key={f.t} className="border-l-2 border-danger/50 pl-4">
                    <h3 className="font-head text-base font-bold text-white">{f.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">{f.d}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-gradient-to-b from-surface/65 to-night/50 p-7 shadow-[0_0_40px_rgba(52,185,240,0.08)]">
              <span className="badge border border-line bg-transparent font-mono text-[10px] uppercase tracking-widest text-brand">● The MNA promise</span>
              <h3 className="mt-4 font-head text-2xl font-extrabold text-white">
                Your gearbox, <Red>fixed once.</Red>
              </h3>
              <p className="mt-2 text-sm text-ink-muted">Every job includes the things that should be standard everywhere:</p>
              <ul className="mt-4 space-y-0">
                {PROMISE.map((p) => (
                  <li key={p} className="flex gap-3 border-b border-line-soft py-2.5 text-sm text-ink-soft last:border-0">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="#34b9f0" strokeWidth="2"><path d="M5 12l4 4L19 6" /></svg>
                    {p}
                  </li>
                ))}
              </ul>
              <a
                href={waLink("Hi, I'd like a CVT quote.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center rounded-card bg-gradient-to-br from-danger to-[#b3141b] px-6 py-3 font-head font-bold text-white"
              >
                Get my quote on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* ═══ PROCESS ═══ */}
        <section id="process" className="scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="container-page max-w-5xl">
            <SectionHead kicker="How it works" title={<>From symptom to <Red>solved</Red> — in four steps</>} center />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PROCESS.map((s, i) => (
                <div key={s.t} className="rounded-2xl border border-line-soft bg-gradient-to-b from-surface/40 to-night/40 p-6">
                  <div className="font-head text-3xl font-extrabold italic text-transparent [-webkit-text-stroke:1px_#34b9f0]">0{i + 1}</div>
                  <h3 className="mt-3 font-head text-base font-bold text-white">{s.t}</h3>
                  <p className="mt-1.5 text-sm text-ink-muted">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ BOOK (recorded — deposit → Supabase/BYKI) ═══ */}
        <section id="book" className="scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="container-page max-w-2xl">
            <SectionHead kicker="Book a slot" title={<>Tempah your <Red>inspection</Red></>} center>
              Reserve a workshop slot with a small deposit — collected now and credited toward your final
              bill. If you just ran a fault scan, it&apos;s attached to your booking automatically.
            </SectionHead>
            <div className="mt-8">
              <BookingForm />
            </div>
          </div>
        </section>

        {/* ═══ CONTACT ═══ */}
        <section id="contact" className="scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="container-page max-w-5xl">
            <div className="rounded-3xl border border-line bg-[radial-gradient(720px_340px_at_50%_0%,rgba(52,185,240,0.18),transparent_60%),radial-gradient(600px_320px_at_100%_100%,rgba(236,28,36,0.14),transparent_60%)] bg-surface/70 px-6 py-14 text-center">
              <h2 className="mx-auto max-w-2xl font-head text-3xl font-extrabold text-white sm:text-4xl">
                Your gearbox is talking. <Red>Let&apos;s listen properly.</Red>
              </h2>
              <p className="mx-auto mt-3 max-w-md text-ink-muted">
                Book a 3D diagnostic today — message us on WhatsApp and we&apos;ll get you sorted, fast.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={waLink("Hi MNA Dynamic Torque, I'd like to book a diagnostic.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-card bg-[#25d366] px-7 py-3.5 font-head font-bold text-[#04140a] sm:w-auto"
                >
                  Chat on WhatsApp
                </a>
                <a href={`tel:+${WA}`} className="inline-flex w-full items-center justify-center rounded-card border border-line bg-brand-soft px-7 py-3.5 font-head font-semibold text-ink sm:w-auto">
                  Call {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Floating WhatsApp */}
      <a
        href={waLink('Hi MNA Dynamic Torque!')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp us"
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] shadow-[0_10px_30px_rgba(37,211,102,0.5)]"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden="true">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.519 5.262l-.999 3.648 3.969-1.04z" />
        </svg>
      </a>

      {/* Shared cart drawer (core) */}
      <CartDrawer />
    </div>
  )
}

function Red({ children }: { children: React.ReactNode }) {
  return <span className="mna-red-italic">{children}</span>
}

function SectionHead({
  kicker,
  title,
  center = false,
  children,
}: {
  kicker: string
  title: React.ReactNode
  center?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <div className={`mb-3.5 h-[3px] w-20 rounded bg-gradient-to-r from-transparent via-danger to-transparent ${center ? 'mx-auto' : ''}`} />
      <p className="eyebrow">{kicker}</p>
      <h2 className="mt-2 font-head text-3xl font-extrabold text-white sm:text-4xl">{title}</h2>
      {children ? <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">{children}</p> : null}
    </div>
  )
}

const TRUST = [
  { n: '12+', l: 'Years on CVTs' },
  { n: '8,000+', l: 'Gearboxes Serviced' },
  { n: '12-mo', l: 'Workmanship Warranty' },
  { n: '4.9★', l: 'Customer Rating' },
]

const SERVICES = [
  { t: '3D Diagnostic Health Check', d: "We read the live data, map it onto the 3D unit, and show you exactly what's happening inside — pressures, ratio, belt slip, solenoid currents." },
  { t: 'CVT Repair & Rebuild', d: 'Belt/chain, pulleys, valve body, solenoids, bearings — repaired or fully rebuilt to spec with genuine and OEM-grade parts.' },
  { t: 'CVT Fluid Service', d: 'The right fluid, the right interval, done properly with a full flush — the single biggest thing that keeps a CVT alive.' },
  { t: 'Judder & Slip Fixes', d: 'Shudder on take-off, RPM flare, hesitation, jerking — we trace the root cause instead of throwing parts at it.' },
  { t: 'DTC & Limp-Mode Scan', d: 'Stuck in limp mode or a warning light on? Full fault-code read with a plain-language explanation of what each one means.' },
  { t: 'Pre-Purchase Inspection', d: "Buying a used CVT car? We inspect the transmission first so you don't inherit a RM8,000 surprise." },
]

const WHY = [
  { t: 'Diagnostics-first', d: 'We prove the fault before we quote. You see the data and the 3D — no blind part-swapping.' },
  { t: 'Genuine & OEM-grade parts', d: 'Real parts with real life in them — backed by a written 12-month workmanship warranty.' },
  { t: 'Transparent pricing', d: 'A clear quote before any work starts. No surprises when you collect the car.' },
  { t: 'We only do transmissions', d: 'Day in, day out. That focus is why our rebuilds last — and why other workshops send us their hard cases.' },
]

const PROMISE = [
  'Free 3D diagnostic summary you can keep',
  'Written quote before any work begins',
  '12-month workmanship warranty',
  'Genuine / OEM-grade parts only',
  'Old parts returned to you on request',
]

const PROCESS = [
  { t: 'Message us', d: "Tell us the car and the symptom on WhatsApp. We'll advise if it's worth a check." },
  { t: '3D Diagnostic', d: 'We scan it, map the live data to the 3D unit, and pinpoint the real fault.' },
  { t: 'Clear quote', d: 'You get a transparent, itemised quote — and we explain it in plain language.' },
  { t: 'Repaired + warranty', d: 'We fix it properly, test-drive it, and hand it back with a 12-month warranty.' },
]
