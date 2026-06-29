// Product + inventory reads/writes, workshop-scoped. Service-role; server only.
// Ported from MNA's lib/store.ts, re-pointed at Supabase.

import { getAdminClient } from '../supabase/admin'
import type { Database } from '../supabase/database.types'
import type { Product, ProductKind, ProductWithStock } from '../types'
import { productFromRow } from './mappers'

export async function listProducts(workshopId: string): Promise<Product[]> {
  const db = getAdminClient()
  const { data, error } = await db
    .from('products')
    .select('*')
    .eq('workshop_id', workshopId)
    .eq('active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(productFromRow)
}

export async function getProduct(workshopId: string, id: string): Promise<Product | undefined> {
  const db = getAdminClient()
  const { data } = await db
    .from('products')
    .select('*')
    .eq('workshop_id', workshopId)
    .eq('id', id)
    .maybeSingle()
  return data ? productFromRow(data) : undefined
}

export async function getProductBySlug(
  workshopId: string,
  slug: string,
): Promise<Product | undefined> {
  const db = getAdminClient()
  const { data } = await db
    .from('products')
    .select('*')
    .eq('workshop_id', workshopId)
    .eq('slug', slug)
    .maybeSingle()
  return data ? productFromRow(data) : undefined
}

export async function listProductsWithStock(workshopId: string): Promise<ProductWithStock[]> {
  const db = getAdminClient()
  const [{ data: products, error: pErr }, { data: inventory, error: iErr }] = await Promise.all([
    db.from('products').select('*').eq('workshop_id', workshopId),
    db.from('inventory').select('*').eq('workshop_id', workshopId),
  ])
  if (pErr) throw new Error(pErr.message)
  if (iErr) throw new Error(iErr.message)
  const stockByProduct = new Map((inventory ?? []).map((i) => [i.product_id, i]))
  return (products ?? []).map((p) => {
    const inv = stockByProduct.get(p.id)
    return {
      ...productFromRow(p),
      stockQty: inv?.stock_qty ?? 0,
      reorderLevel: inv?.reorder_level ?? 0,
    }
  })
}

export interface NewProductInput {
  sku: string
  slug?: string
  name: string
  kind: ProductKind
  category: string
  description?: string
  shortDescription?: string
  image?: string | null
  priceRetail: number
  priceBulk?: number | null
  bulkMinQty?: number
  depositAmount?: number | null
  active?: boolean
  isFeatured?: boolean
  initialStock?: number
  reorderLevel?: number
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Creates a product, its inventory row, and (if initialStock > 0) an opening
// restock movement so the ledger explains the starting quantity.
export async function createProduct(
  workshopId: string,
  input: NewProductInput,
): Promise<Product> {
  const db = getAdminClient()
  const slug = input.slug ? slugify(input.slug) : slugify(input.name)

  const { data: created, error } = await db
    .from('products')
    .insert({
      workshop_id: workshopId,
      sku: input.sku,
      slug,
      name: input.name,
      kind: input.kind,
      category: input.category,
      description: input.description ?? '',
      short_description: input.shortDescription ?? '',
      image: input.image ?? null,
      price_retail: input.priceRetail,
      price_bulk: input.priceBulk ?? null,
      bulk_min_qty: Math.max(1, Math.floor(input.bulkMinQty ?? 1)),
      deposit_amount: input.depositAmount ?? null,
      active: input.active ?? true,
      is_featured: input.isFeatured ?? false,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  const initialStock = Math.max(0, Math.floor(input.initialStock ?? 0))
  await db.from('inventory').insert({
    workshop_id: workshopId,
    product_id: created.id,
    stock_qty: initialStock,
    reorder_level: Math.max(0, Math.floor(input.reorderLevel ?? 0)),
  })
  if (initialStock > 0) {
    await db.from('stock_movements').insert({
      workshop_id: workshopId,
      product_id: created.id,
      type: 'restock',
      qty: initialStock,
      reference: 'opening-stock',
      note: 'Opening stock on product creation',
    })
  }
  return productFromRow(created)
}

export async function updateProductDetails(
  workshopId: string,
  id: string,
  patch: Partial<{
    name: string
    sku: string
    category: string
    description: string
    shortDescription: string
    image: string | null
    priceRetail: number
    priceBulk: number | null
    bulkMinQty: number
    depositAmount: number | null
    active: boolean
    isFeatured: boolean
    reorderLevel: number
  }>,
): Promise<Product | undefined> {
  const db = getAdminClient()
  const { reorderLevel, ...rest } = patch
  const row: Database['public']['Tables']['products']['Update'] = {}
  if (rest.name !== undefined) row.name = rest.name
  if (rest.sku !== undefined) row.sku = rest.sku
  if (rest.category !== undefined) row.category = rest.category
  if (rest.description !== undefined) row.description = rest.description
  if (rest.shortDescription !== undefined) row.short_description = rest.shortDescription
  if (rest.image !== undefined) row.image = rest.image
  if (rest.priceRetail !== undefined) row.price_retail = rest.priceRetail
  if (rest.priceBulk !== undefined) row.price_bulk = rest.priceBulk
  if (rest.bulkMinQty !== undefined) row.bulk_min_qty = rest.bulkMinQty
  if (rest.depositAmount !== undefined) row.deposit_amount = rest.depositAmount
  if (rest.active !== undefined) row.active = rest.active
  if (rest.isFeatured !== undefined) row.is_featured = rest.isFeatured

  let updated: Awaited<ReturnType<typeof getProduct>> | undefined
  if (Object.keys(row).length > 0) {
    const { data, error } = await db
      .from('products')
      .update(row)
      .eq('workshop_id', workshopId)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    updated = productFromRow(data)
  }

  if (reorderLevel != null) {
    await db
      .from('inventory')
      .update({ reorder_level: Math.max(0, Math.floor(reorderLevel)), updated_at: new Date().toISOString() })
      .eq('workshop_id', workshopId)
      .eq('product_id', id)
  }

  return updated ?? getProduct(workshopId, id)
}
