# Supabase migration

The mockup stores data in `.data/store.json`. Production uses Supabase. Because
every read/write goes through `lib/store.ts`, switching backends means rewriting
the bodies of those functions - nothing else changes.

## Steps

1. Create the Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor. It creates the enums and
   tables that mirror `lib/types.ts`.
3. Set the Supabase env vars (see [Configuration](configuration.md)).
4. Add the client and rewrite `lib/store.ts` (below).
5. Seed the `products` and `inventory` tables (port `lib/seed.ts` into SQL inserts
   or a one-off script).
6. Add Row Level Security policies (below).

## Install and client

```
npm install @supabase/supabase-js
```

Create `lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

// Server-side admin client (service role). Never import this into a client
// component. Use it from API routes and server components only.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)
```

## Column naming

TypeScript uses camelCase; SQL uses snake_case. Map at the store boundary so the
rest of the app keeps the existing types.

| TS (types.ts) | SQL (schema.sql) |
|---|---|
| priceRetail | price_retail |
| priceBulk | price_bulk |
| bulkMinQty | bulk_min_qty |
| stockQty | stock_qty |
| reorderLevel | reorder_level |
| invoiceRef | invoice_ref |
| paymentStatus | payment_status |
| leanxBillNo | leanx_bill_no |
| stockApplied | stock_applied |
| createdAt | created_at |
| paidAt | paid_at |

Order items live in their own `order_items` table; map `Order.items` to inserts
into `order_items` and read them back with a join or a second query.

## Example: rewriting store functions

Before (file store):

```ts
export async function listProducts(): Promise<Product[]> {
  const store = await readStore()
  return store.products.filter((p) => p.active)
}
```

After (Supabase):

```ts
import { supabaseAdmin } from './supabase'

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('active', true)
  if (error) throw error
  return data.map(rowToProduct)   // map snake_case -> camelCase
}
```

`recordMovement` should become a transaction (or a Postgres function) so the
`inventory.stock_qty` update and the `stock_movements` insert are atomic:

```ts
export async function recordMovement(input) {
  const { data, error } = await supabaseAdmin.rpc('record_movement', {
    p_product_id: input.productId,
    p_type: input.type,
    p_qty: input.qty,
    p_reference: input.reference ?? '',
    p_note: input.note ?? '',
  })
  if (error) throw error
  return rowToMovement(data)
}
```

Define `record_movement` as a SQL function that updates inventory and inserts the
movement in one transaction. This prevents races between concurrent sales and the
webhook.

Keep the **function signatures identical** to the current ones so API routes and
components do not change:

```
listProducts, getProduct, listProductsWithStock, getInventory,
createProduct, updateProductDetails, listMovements, recordMovement,
listOrders, getOrder, getOrderByInvoiceRef, createOrder, updateOrder,
listBookings, getBooking, getBookingByInvoiceRef, createBooking, updateBooking
```

`createProduct` inserts into `products` and `inventory` (and an opening
`stock_movements` row); make it a transaction or Postgres function so the rows
stay consistent. `updateProductDetails` updates `products` and, when
`reorderLevel` is supplied, the `inventory` row.

## Row Level Security

Enable RLS on all tables, then add policies:

- `products`, `inventory`: public `select` (storefront reads the catalogue).
- `orders`, `order_items`, `bookings`: insert allowed for creating pending
  records; reads restricted. The dashboard and webhook use the service role key,
  which bypasses RLS - keep that key server-side only.
- `stock_movements`: no public access; service role only.

Because the storefront talks to the catalogue through our API routes (which use
the service role), you can keep RLS strict and avoid exposing the anon key beyond
catalogue reads. Decide per route whether to call Supabase with the anon key
(client-trusted reads) or the service role (server-trusted writes).

## Data integrity to add in SQL

- Unique constraint on `orders.invoice_ref` and `bookings.invoice_ref` (in the
  schema already) to dedupe webhooks.
- A check that `stock_qty >= 0`, or clamp in `record_movement`.
- Foreign keys are already defined in `schema.sql`.
