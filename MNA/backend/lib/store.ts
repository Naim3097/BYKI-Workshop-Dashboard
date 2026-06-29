import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { buildSeed } from './seed'
import type {
  Booking,
  InventoryRecord,
  MovementType,
  Order,
  Product,
  StockMovement,
  StoreData,
} from './types'

// File-backed store for the mockup. Every read/write goes through here so the
// same code can later be re-pointed at Supabase by replacing the body of these
// functions with table queries. The JSON file lives outside the build output.

const DATA_DIR = path.join(process.cwd(), '.data')
const DATA_FILE = path.join(DATA_DIR, 'store.json')

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const seed = buildSeed(new Date().toISOString())
    await fs.writeFile(DATA_FILE, JSON.stringify(seed, null, 2), 'utf8')
  }
}

async function readStore(): Promise<StoreData> {
  await ensureFile()
  const raw = await fs.readFile(DATA_FILE, 'utf8')
  return JSON.parse(raw) as StoreData
}

async function writeStore(data: StoreData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

// ----- Products & inventory -------------------------------------------------

export async function listProducts(): Promise<Product[]> {
  const store = await readStore()
  return store.products.filter((p) => p.active)
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const store = await readStore()
  return store.products.find((p) => p.id === id)
}

export interface ProductWithStock extends Product {
  stockQty: number
  reorderLevel: number
}

export async function listProductsWithStock(): Promise<ProductWithStock[]> {
  const store = await readStore()
  return store.products.map((p) => {
    const inv = store.inventory.find((i) => i.productId === p.id)
    return {
      ...p,
      stockQty: inv?.stockQty ?? 0,
      reorderLevel: inv?.reorderLevel ?? 0,
    }
  })
}

export async function getInventory(): Promise<InventoryRecord[]> {
  const store = await readStore()
  return store.inventory
}

function slugifyId(sku: string): string {
  const base = sku
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `p-${base || randomUUID().split('-')[0]}`
}

export interface NewProductInput {
  sku: string
  name: string
  category: Product['category']
  brand: string
  description: string
  priceRetail: number
  priceBulk: number
  bulkMinQty: number
  active: boolean
  initialStock: number
  reorderLevel: number
}

// Creates a product, its inventory record, and (if initial stock > 0) an opening
// restock movement so the ledger explains the starting quantity.
export async function createProduct(input: NewProductInput): Promise<Product> {
  const store = await readStore()

  if (store.products.some((p) => p.sku.toLowerCase() === input.sku.toLowerCase())) {
    throw new Error(`SKU ${input.sku} already exists.`)
  }

  let id = slugifyId(input.sku)
  if (store.products.some((p) => p.id === id)) {
    id = `${id}-${randomUUID().split('-')[0]}`
  }

  const now = new Date().toISOString()
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const product: Product = {
    id,
    sku: input.sku,
    name: input.name,
    category: input.category,
    brand: input.brand,
    description: input.description,
    priceRetail: input.priceRetail,
    priceBulk: input.priceBulk,
    bulkMinQty: input.bulkMinQty,
    active: input.active,
    slug: slug || id,
    specifications: {},
    compatibleVehicles: [],
    compatibleGearboxes: [],
    tags: [],
    isFeatured: false,
  }
  store.products.push(product)
  store.inventory.push({
    productId: id,
    stockQty: Math.max(0, Math.floor(input.initialStock)),
    reorderLevel: Math.max(0, Math.floor(input.reorderLevel)),
    updatedAt: now,
  })
  if (input.initialStock > 0) {
    store.movements.push({
      id: randomUUID(),
      productId: id,
      type: 'restock',
      qty: Math.floor(input.initialStock),
      reference: 'opening-stock',
      note: 'Opening stock on product creation',
      createdAt: now,
    })
  }
  await writeStore(store)
  return product
}

// Updates editable product fields and, optionally, the inventory reorder level.
// On-hand stock is not changed here; that only moves through recordMovement.
export async function updateProductDetails(
  id: string,
  patch: Partial<Omit<Product, 'id'>> & { reorderLevel?: number },
): Promise<Product | undefined> {
  const store = await readStore()
  const product = store.products.find((p) => p.id === id)
  if (!product) return undefined

  if (
    patch.sku &&
    store.products.some(
      (p) => p.id !== id && p.sku.toLowerCase() === patch.sku!.toLowerCase(),
    )
  ) {
    throw new Error(`SKU ${patch.sku} already exists.`)
  }

  const { reorderLevel, ...productPatch } = patch
  Object.assign(product, productPatch)

  if (reorderLevel != null) {
    const inv = store.inventory.find((i) => i.productId === id)
    if (inv) {
      inv.reorderLevel = Math.max(0, Math.floor(reorderLevel))
      inv.updatedAt = new Date().toISOString()
    }
  }

  await writeStore(store)
  return product
}

export async function listMovements(): Promise<StockMovement[]> {
  const store = await readStore()
  return [...store.movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// Records a stock movement and adjusts the on-hand quantity in one step.
// Positive qty for restock, negative for sale / workshop_use / adjustment-down.
export async function recordMovement(input: {
  productId: string
  type: MovementType
  qty: number
  reference?: string
  note?: string
}): Promise<StockMovement> {
  const store = await readStore()
  const inv = store.inventory.find((i) => i.productId === input.productId)
  if (!inv) {
    throw new Error(`No inventory record for product ${input.productId}`)
  }
  const now = new Date().toISOString()
  inv.stockQty = Math.max(0, inv.stockQty + input.qty)
  inv.updatedAt = now

  const movement: StockMovement = {
    id: randomUUID(),
    productId: input.productId,
    type: input.type,
    qty: input.qty,
    reference: input.reference ?? '',
    note: input.note ?? '',
    createdAt: now,
  }
  store.movements.push(movement)
  await writeStore(store)
  return movement
}

// ----- Orders ---------------------------------------------------------------

export async function listOrders(): Promise<Order[]> {
  const store = await readStore()
  return [...store.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const store = await readStore()
  return store.orders.find((o) => o.id === id)
}

export async function getOrderByInvoiceRef(ref: string): Promise<Order | undefined> {
  const store = await readStore()
  return store.orders.find(
    (o) => o.invoiceRef === ref || o.leanxBillNo === ref || o.leanxInvoiceRef === ref,
  )
}

export async function createOrder(order: Order): Promise<Order> {
  const store = await readStore()
  store.orders.push(order)
  await writeStore(store)
  return order
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>,
): Promise<Order | undefined> {
  const store = await readStore()
  const idx = store.orders.findIndex((o) => o.id === id)
  if (idx === -1) return undefined
  store.orders[idx] = { ...store.orders[idx], ...patch }
  await writeStore(store)
  return store.orders[idx]
}

// ----- Bookings -------------------------------------------------------------

export async function listBookings(): Promise<Booking[]> {
  const store = await readStore()
  return [...store.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  const store = await readStore()
  return store.bookings.find((b) => b.id === id)
}

export async function getBookingByInvoiceRef(ref: string): Promise<Booking | undefined> {
  const store = await readStore()
  return store.bookings.find(
    (b) => b.invoiceRef === ref || b.leanxBillNo === ref || b.leanxInvoiceRef === ref,
  )
}

export async function createBooking(booking: Booking): Promise<Booking> {
  const store = await readStore()
  store.bookings.push(booking)
  await writeStore(store)
  return booking
}

export async function updateBooking(
  id: string,
  patch: Partial<Booking>,
): Promise<Booking | undefined> {
  const store = await readStore()
  const idx = store.bookings.findIndex((b) => b.id === id)
  if (idx === -1) return undefined
  store.bookings[idx] = { ...store.bookings[idx], ...patch }
  await writeStore(store)
  return store.bookings[idx]
}
