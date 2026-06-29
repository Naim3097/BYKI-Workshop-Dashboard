import type { InventoryRecord, Product, StoreData } from './types'
import catalogSeed from './catalog-seed.json'

// The catalogue is imported from the live bengkelgearbox.my storefront via
// scripts/import-catalog.mjs (re-run it when the static catalogue changes). This
// keeps the mockup backend seeded with the real products so the integration is
// exercised against real data. In production this data lives in Supabase.

const products = catalogSeed.products as unknown as Product[]
const inventory = catalogSeed.inventory as unknown as InventoryRecord[]

export function buildSeed(now: string): StoreData {
  return {
    products,
    inventory: inventory.map((record) => ({ ...record, updatedAt: now })),
    movements: [],
    orders: [],
    bookings: [],
  }
}
