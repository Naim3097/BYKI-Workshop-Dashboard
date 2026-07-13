// ─────────────────────────────────────────────────────────────────────
// IM Dynamic Torque — single landing page (Malay)
// Editorial layout: full-bleed hero, serif-italic accents, tinted gradient
// cards, asymmetric image-in-box feature, smooth scroll reveals.
// Hero → Scan → Specialties → Feature → Trust → Book → Location
// Server component; only <Scanner/> and <BookingSection/> are client.
// ─────────────────────────────────────────────────────────────────────

import Scanner, { PrepGuide } from '@/components/scanner';
import BookingSection from '@/components/booking-section';
import { ProductGrid } from '@byki/core/commerce';
import { listProductsWithStock } from '@byki/core/db';
import { BIZ, COPY, waLink } from '@/lib/site-config';
import { workshop } from '@/config/workshop';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // Products sold inline on the single buyer page (e.g. the OBD2 Device).
  const products = (await listProductsWithStock(workshop.id).catch(() => []))
    .filter((p) => p.active);

  return (
    <main id="top">
      {/* ═══ HERO — full-bleed photo ═══ */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        {BIZ.heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={BIZ.heroImage} alt="Bengkel IM Dynamic Torque" fetchPriority="high" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {/* Overlays: darken for legibility + brand glow + fade into page */}
        <div className="absolute inset-0 bg-[var(--bg)]/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/50 via-[var(--bg)]/55 to-[var(--bg)]" />
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[11px] font-semibold text-[var(--accent)] tracking-wider uppercase mb-6">
            {COPY.hero.eyebrow}
          </div>
          <h1 className="display text-4xl sm:text-6xl text-white max-w-2xl mx-auto">
            Kenapa lampu <span className="accent-serif text-[var(--accent)]">enjin</span> anda menyala?
          </h1>
          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto mt-5 leading-relaxed">
            {COPY.hero.sub}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <a href="#imbas" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] transition-colors shadow-[0_0_24px_var(--accent-glow)] active:scale-[0.98]">
              {COPY.hero.cta}
            </a>
            <a href={waLink('Hi IM Dynamic Torque, saya nak tanya pasal servis.')} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold glass glass-hover text-white/90">
              WhatsApp Kami
            </a>
          </div>
          <p className="text-[11px] text-white/45 mt-4 font-mono">{COPY.hero.ctaSub}</p>
        </div>
      </section>

      {/* ═══ SCANNER — top: image + intro (equal height); steps below, centered ═══ */}
      <section id="imbas" className="reveal scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-16">
        {/* Top row — image LEFT, title + prep RIGHT, equal height */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Visual — left (stretches to match the intro height) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[340px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/scan-feature.jpg" alt="Paparan diagnostik kereta" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            </div>
          </div>
          {/* Title + preparation guide — right */}
          <div className="lg:col-span-7">
            <SectionTitle kicker="Diagnostik Percuma" title={<>Imbas <Em>Kereta</Em> Anda</>} />
            <div className="mt-6">
              <PrepGuide />
            </div>
          </div>
        </div>

        {/* Steps — below, centered */}
        <div className="max-w-2xl mx-auto mt-10 lg:mt-14">
          <Scanner />
        </div>
      </section>

      {/* ═══ SPECIALTIES — tinted gradient boxes ═══ */}
      <section id="kepakaran" className="reveal scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <SectionTitle kicker="Servis Kami" title={<>Kepakaran <Em>Kami</Em></>} center />
        <div className="grid gap-4 sm:grid-cols-3 mt-8">
          {COPY.specialties.items.map((s, i) => (
            <div key={s.name} className={`rounded-2xl border overflow-hidden flex flex-col ${TINTS[i]}`}>
              <div className="relative aspect-[4/3] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-white mb-1.5">{s.name}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SHOP — products sold inline on this page (cart drawer handles the rest) ═══ */}
      {products.length > 0 && (
        <section id="kedai" className="reveal scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <SectionTitle kicker="Kedai" title={<>Peranti <Em>Pilihan</Em></>} center />
          <div className="mt-8">
            <ProductGrid products={products} />
          </div>
        </section>
      )}

      {/* ═══ FEATURE — asymmetric, image-in-box ═══ */}
      <section className="reveal max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5">
            <p className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-widest mb-2">{COPY.feature.kicker}</p>
            <h2 className="display text-2xl sm:text-4xl text-white leading-tight">
              Kepakaran yang anda boleh <Em>percaya</Em>
            </h2>
            <p className="text-sm sm:text-base text-white/55 mt-4 leading-relaxed">{COPY.feature.body}</p>
            <ul className="mt-5 space-y-2.5">
              {COPY.feature.points.map((p) => (
                <li key={p} className="border-l-2 border-[var(--accent)]/50 pl-3 text-sm text-white/75 leading-relaxed">{p}</li>
              ))}
            </ul>
            <a href="#tempah" className="inline-flex items-center justify-center px-7 py-3 rounded-xl text-sm font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] transition-colors mt-7">
              Tempah Slot Anda
            </a>
          </div>
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 aspect-[4/3] shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/feature-service.jpg" alt="Kereta di atas lif di bengkel" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHY US (trust before the ask) ═══ */}
      <section id="kenapa" className="reveal scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <SectionTitle kicker="Boleh Dipercayai" title={<>Kenapa <Em>Pilih</Em> Kami</>} center />
        <div className="grid gap-4 sm:grid-cols-2 mt-8">
          {TRUST.map((t) => (
            <div key={t.t} className="glass rounded-2xl p-5">
              <h3 className="text-base font-bold text-white">{t.t}</h3>
              <p className="text-sm text-white/50 leading-relaxed mt-1">{t.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BOOKING ═══ */}
      <section id="tempah" className="reveal scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <BookingSection />
      </section>

      {/* ═══ GALLERY (renders only when real photos are provided) ═══ */}
      {BIZ.gallery.length > 0 && (
        <section id="galeri" className="reveal scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <SectionTitle kicker="Hasil Kerja Sebenar" title={<>Galeri <Em>Bengkel</Em></>} center />
          <div className="grid gap-3 sm:grid-cols-3 mt-8">
            {BIZ.gallery.map((g) => (
              <figure key={g.src} className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={g.caption} loading="lazy" className="w-full h-full object-cover" />
                <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-xs text-white/85">
                  {g.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ═══ LOCATION ═══ */}
      <section id="lokasi" className="reveal scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <SectionTitle kicker="Jumpa Kami" title={<>Lokasi <Em>Kami</Em></>} center />
        <div className="grid gap-5 md:grid-cols-2 mt-8 items-stretch">
          <div className="glass rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Alamat</p>
              <p className="text-white/80">{BIZ.addressLine}, {BIZ.city}, {BIZ.state}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Waktu Operasi</p>
              <p className="text-white/80">{BIZ.hours}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Hubungi</p>
              <a href={waLink('Hi IM Dynamic Torque, saya nak tempah slot.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-2)] transition-colors">
                WhatsApp · {BIZ.phoneDisplay}
              </a>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/10 min-h-[260px]">
            <iframe
              title="Lokasi IM Dynamic Torque"
              src={`https://www.google.com/maps?q=${encodeURIComponent(`${BIZ.city}, ${BIZ.state}`)}&output=embed`}
              className="w-full h-full min-h-[260px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* ═══ STICKY MOBILE CTA ═══ */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 safe-bottom">
        <div className="m-3 rounded-2xl border border-white/10 bg-[var(--bg-raised)]/95 backdrop-blur-xl p-2 flex gap-2 shadow-2xl">
          <a href="#imbas" className="flex-1 text-center py-3 rounded-xl text-sm font-bold bg-[var(--accent)] text-white">
            {COPY.hero.cta}
          </a>
          <a href={waLink('Hi IM Dynamic Torque, saya nak tanya pasal servis.')} target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-xl text-sm font-semibold glass text-white/80">
            WhatsApp
          </a>
        </div>
      </div>
      <div className="h-20 sm:hidden" />
    </main>
  );
}

// Serif-italic accent word.
function Em({ children }: { children: React.ReactNode }) {
  return <span className="accent-serif text-[var(--accent)]">{children}</span>;
}

function SectionTitle({ kicker, title, center = false }: { kicker: string; title: React.ReactNode; center?: boolean }) {
  return (
    <div className={`mb-2 ${center ? 'text-center' : ''}`}>
      <p className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-widest mb-1">{kicker}</p>
      <h2 className="display text-2xl sm:text-3xl text-white">{title}</h2>
    </div>
  );
}

// Subtle per-card tints (coloured boxes + gradient) over the dark base.
const TINTS = [
  'bg-gradient-to-br from-[#e01f2b]/12 to-transparent border-[#e01f2b]/20',
  'bg-gradient-to-br from-[#3B6EA5]/12 to-transparent border-[#3B6EA5]/20',
  'bg-gradient-to-br from-[#C9892E]/12 to-transparent border-[#C9892E]/20',
];

// Factual, verifiable points — no fabricated testimonials.
const TRUST = [
  { t: 'Pakar Transmisi Auto & CVT', d: 'Tumpuan penuh pada baik pulih gearbox auto & CVT — bukan bengkel serba boleh biasa.' },
  { t: 'Diagnosis Telus', d: 'Imbas kod kerosakan sendiri dahulu — anda nampak masalah sebenar sebelum bayar.' },
  { t: 'Khidmat Towing', d: 'Kereta tak boleh bergerak? Kami tunda dan bawa terus ke bengkel.' },
  { t: 'Kerja Bergaransi', d: 'Setiap pembaikan disiapkan dengan betul dan diberi jaminan kerja.' },
];
