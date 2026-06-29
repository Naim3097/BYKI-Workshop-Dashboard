# Data model

All types are defined in `lib/types.ts` and mirrored as SQL in
`supabase/schema.sql`. The mockup stores these as JSON arrays in
`.data/store.json`; production stores them as Supabase tables.

## Entities

```
products (1) ---- (1) inventory
products (1) ---- (many) stock_movements
orders   (1) ---- (many) order_items ---- (many to 1) products
bookings (standalone)
```

- `orders` and `bookings` both represent money movements and both appear on the
  dashboard transactions view.
- `stock_movements` is the ledger that explains every change to on-hand stock.

## Product

| Field | Type | Notes |
|---|---|---|
| id | string | Stable id, e.g. `p-oil-filter-mann` |
| sku | string | Unique stock code |
| name | string | Display name |
| category | enum | transmission, engine, brakes, suspension, electrical, filters |
| brand | string | |
| description | string | |
| priceRetail | number | MYR per unit at retail |
| priceBulk | number | MYR per unit at bulk |
| bulkMinQty | number | Quantity at which bulk price applies |
| active | boolean | Hidden from storefront when false |

Pricing rule: `qty >= bulkMinQty ? priceBulk : priceRetail`. Applied per line, so
one order can mix retail and bulk lines.

## InventoryRecord

One row per product.

| Field | Type | Notes |
|---|---|---|
| productId | string | FK to product |
| stockQty | number | On-hand quantity |
| reorderLevel | number | Low-stock threshold for dashboard flags |
| updatedAt | string (ISO) | |

`stockQty` is never edited directly in the UI. It only changes through
`recordMovement`, which also writes a `stock_movements` row. See
[Inventory](inventory.md).

## StockMovement

| Field | Type | Notes |
|---|---|---|
| id | string (uuid) | |
| productId | string | FK to product |
| type | enum | restock, sale, workshop_use, adjustment |
| qty | number | Positive for restock, negative for sale/workshop_use |
| reference | string | Order ref, workshop job ref, supplier note |
| note | string | Free text |
| createdAt | string (ISO) | |

## Order

| Field | Type | Notes |
|---|---|---|
| id | string (uuid) | |
| invoiceRef | string | `ORDER-XXXXXXXX` (8 hex, upper). Used as LeanX `invoice_ref` |
| channel | enum | retail, bulk, owner |
| customerName/Email/Phone | string | |
| items | OrderItem[] | Snapshot of products, prices, tier at sale time |
| amount | number | Sum of line totals (MYR) |
| status | enum | pending_payment, paid, cancelled, fulfilled |
| paymentStatus | enum | pending, SUCCESS, FAILED, CANCELLED |
| leanxBillNo | string\|null | From LeanX `bill_no` (mock: `MOCK-<invoiceRef>`) |
| leanxInvoiceRef | string\|null | |
| paymentLink | string\|null | URL to share / redirect to |
| paymentProvider/Method/TransactionId | string\|null | From webhook |
| createdAt / paidAt | string\|null | |
| stockApplied | boolean | Guard so stock is decremented once only |

### OrderItem

| Field | Type | Notes |
|---|---|---|
| productId, sku, name | string | Snapshot |
| unitPrice | number | Price charged |
| qty | number | |
| pricing | enum | retail or bulk (tier applied) |
| lineTotal | number | unitPrice * qty |

`channel` meaning:
- `retail` - self-serve checkout, no bulk lines.
- `bulk` - self-serve checkout where at least one line hit bulk pricing.
- `owner` - created from the sales portal by the owner.

## Booking

| Field | Type | Notes |
|---|---|---|
| id | string (uuid) | |
| invoiceRef | string | `BOOKING-XXXXXXXX`. Used as LeanX `invoice_ref` |
| serviceType | enum | transmission_inspection, general_service, diagnostic, fluid_change |
| customerName/Email/Phone | string | |
| vehicleModel | string | |
| preferredDate | string (date) | |
| timeSlot | string | One of the configured slots |
| amount | number | Deposit (MYR) |
| status / paymentStatus | enum | Same as Order |
| leanxBillNo / leanxInvoiceRef / paymentLink | string\|null | |
| paymentTransactionId | string\|null | |
| createdAt / paidAt | string\|null | |
| notes | string | |

## Status lifecycle

```
Order/Booking created           -> status: pending_payment, paymentStatus: pending
Payment SUCCESS (webhook)       -> status: paid,            paymentStatus: SUCCESS
Payment FAILED/CANCELLED        -> status: cancelled,       paymentStatus: FAILED/CANCELLED
(Manual, future)                -> status: fulfilled
```

`fulfilled` exists in the model for a future "mark as collected/completed" action;
the current flow does not set it automatically.

## Seed data (mockup)

Defined in `lib/seed.ts`.

8 products across all categories, including high-value transmission parts
(mechatronic unit, dual-clutch kit) and high-volume consumables (ATF fluid, oil
filters) so both retail and bulk pricing are easy to demonstrate.

Service deposits and time slots are in `lib/labels.ts`:

| Service | Deposit (MYR) |
|---|---|
| Transmission inspection | 80 |
| General service | 50 |
| Diagnostic scan | 60 |
| Fluid change | 40 |

Time slots: 09:00, 10:30, 12:00, 14:30, 16:00.

To reset the mockup to seed state, delete `.data/store.json`; it is recreated on
the next request.
