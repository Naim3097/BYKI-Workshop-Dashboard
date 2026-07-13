// IM Dynamic Torque — WorkshopConfig (the standardized identity @byki/core reads).
// Display copy still lives in src/lib/site-config.ts (BIZ/COPY); this file holds
// the platform-level identity: workshop id (from env), services, slots.

import { defineWorkshopConfig, getWorkshopId } from '@byki/core/config'
import { BIZ, SITE_URL } from '@/lib/site-config'

export const workshop = defineWorkshopConfig({
  id: getWorkshopId(),
  slug: process.env.NEXT_PUBLIC_WORKSHOP_SLUG ?? 'imdt',
  siteUrl: SITE_URL,
  locale: 'ms',
  currency: 'MYR',
  biz: {
    name: BIZ.name,
    legalName: BIZ.legalName,
    tagline: BIZ.tagline,
    trustline: BIZ.trustline,
    since: BIZ.since,
    bookingFeeRM: BIZ.feeRM,
    whatsapp: BIZ.whatsapp,
    phoneDisplay: BIZ.phoneDisplay,
    addressLine: BIZ.addressLine,
    city: BIZ.city,
    state: BIZ.state,
    country: BIZ.country,
    geo: BIZ.geo,
    hours: BIZ.hours,
  },
  services: [
    { key: 'inspection', label: 'Pemeriksaan / Diagnosis', depositRM: BIZ.feeRM },
    { key: 'gearbox', label: 'Baik Pulih Gearbox', depositRM: BIZ.feeRM },
    { key: 'service', label: 'Servis Berkala', depositRM: BIZ.feeRM },
  ],
  slots: BIZ.slots,
})
