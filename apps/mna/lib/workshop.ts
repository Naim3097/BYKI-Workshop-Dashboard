// MNA Dynamic Torque — WorkshopConfig for the standardized backend (core flow,
// auth). The frontend/design stays the legacy app's own.

import { defineWorkshopConfig, getWorkshopId } from '@byki/core/config'

export const workshop = defineWorkshopConfig({
  id: getWorkshopId(),
  slug: process.env.NEXT_PUBLIC_WORKSHOP_SLUG ?? 'mna',
  siteUrl: 'https://mnadynamictorque.com',
  locale: 'en',
  currency: 'MYR',
  biz: {
    name: 'MNA Dynamic Torque',
    tagline: 'CVT & Automatic Transmission Specialists',
    bookingFeeRM: 60,
    country: 'MY',
  },
  // Keys match the legacy ServiceType values + deposits (lib/labels.serviceDeposits).
  services: [
    { key: 'transmission_inspection', label: 'Transmission inspection', depositRM: 80 },
    { key: 'general_service', label: 'General service', depositRM: 50 },
    { key: 'diagnostic', label: 'Diagnostic scan', depositRM: 60 },
    { key: 'fluid_change', label: 'Fluid change', depositRM: 40 },
  ],
  slots: ['09:00', '10:30', '12:00', '14:30', '16:00'],
})
