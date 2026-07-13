// ── JSON-LD structured data (local SEO) ─────────────────────────────
import { BIZ, SITE_URL } from './site-config';

export function autoRepairJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': `${SITE_URL}/#business`,
    name: BIZ.name,
    alternateName: BIZ.legalName,
    description:
      'Pusat servis & transmisi kereta. Pakar gearbox auto & CVT, towing dan servis harian. Imbas kod kerosakan kereta dan tempah slot pembaikan.',
    url: SITE_URL,
    image: `${SITE_URL}/logo.jpg`,
    logo: `${SITE_URL}/logo.jpg`,
    telephone: `+${BIZ.whatsapp}`,
    priceRange: 'RM',
    foundingDate: String(BIZ.since),
    address: {
      '@type': 'PostalAddress',
      streetAddress: BIZ.addressLine,
      addressLocality: BIZ.city,
      addressRegion: BIZ.state,
      addressCountry: BIZ.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BIZ.geo.lat,
      longitude: BIZ.geo.lng,
    },
    areaServed: { '@type': 'State', name: BIZ.state },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    makesOffer: {
      '@type': 'Offer',
      name: 'Pemeriksaan Diagnostik & Tempahan Slot',
      price: String(BIZ.feeRM),
      priceCurrency: 'MYR',
    },
  };
}
