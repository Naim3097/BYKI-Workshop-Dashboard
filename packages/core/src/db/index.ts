// Workshop-scoped data-access layer (Supabase, service-role, server only).
// Every function takes workshopId as its first argument so BYKI can operate
// across any workshop and apps stay strictly scoped to their own.

export * from './products'
export * from './inventory'
export * from './orders'
export * from './bookings'
export * from './diagnose'
export * from './customers'
export * from './mappers'
