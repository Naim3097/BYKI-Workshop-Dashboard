// WorkshopConfig — the per-workshop identity each app provides. All shared
// behaviour lives in @byki/core; an app supplies this config + its pages/theme.
// Modeled on Overhaulinyard's site-config but generalised for any workshop.

export interface BizInfo {
  name: string
  legalName?: string
  tagline?: string
  trustline?: string
  since?: number
  /** Default booking deposit (MYR) when a service has no explicit depositAmount. */
  bookingFeeRM: number
  heroImage?: string
  whatsapp?: string
  phoneDisplay?: string
  addressLine?: string
  city?: string
  state?: string
  country?: string
  geo?: { lat: number; lng: number }
  hours?: string
}

export interface ServiceOption {
  /** Stored verbatim in bookings.service_type. */
  key: string
  label: string
  /** Deposit for this service (MYR). Falls back to biz.bookingFeeRM. */
  depositRM?: number
}

export interface WorkshopConfig {
  /** workshop_id (uuid) — must equal the workshops.id row in Supabase. */
  id: string
  slug: string
  siteUrl: string
  /** Default locale for copy + product display. */
  locale: string
  currency: string
  biz: BizInfo
  /** Bookable services; first is the default. */
  services: ServiceOption[]
  /** Time slots offered for bookings. */
  slots: string[]
  /** Free-form per-app copy (headings, labels) — shape is the app's choice. */
  copy?: Record<string, unknown>
  theme?: { accent?: string }
}

/** Identity helper for type-safe config files in each app. */
export function defineWorkshopConfig(config: WorkshopConfig): WorkshopConfig {
  return config
}

/** The current workshop id from the environment (NEXT_PUBLIC_WORKSHOP_ID). */
export function getWorkshopId(): string {
  const id = process.env.NEXT_PUBLIC_WORKSHOP_ID
  if (!id) {
    throw new Error(
      'NEXT_PUBLIC_WORKSHOP_ID is not set. Each workshop app must define it (see docs/ADDING-A-WORKSHOP.md).',
    )
  }
  return id
}

/** The current workshop slug from the environment (NEXT_PUBLIC_WORKSHOP_SLUG). */
export function getWorkshopSlug(): string | undefined {
  return process.env.NEXT_PUBLIC_WORKSHOP_SLUG
}

export function depositForService(config: WorkshopConfig, serviceKey: string): number {
  const service = config.services.find((s) => s.key === serviceKey)
  return service?.depositRM ?? config.biz.bookingFeeRM
}
