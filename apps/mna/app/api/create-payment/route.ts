// Alias of /api/payments/create — the shared @byki/core CartDrawer posts here.
// Same core flow (amount recomputed server-side, customer upserted, BYKI-connected).
export { dynamic, POST, OPTIONS } from '../payments/create/route'
