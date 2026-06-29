# Inventory

## Principle: stock changes only through movements

`inventory.stockQty` is never edited directly. Every change goes through
`recordMovement()` in `lib/store.ts`, which both adjusts the on-hand quantity and
appends a `stock_movements` row. The ledger therefore always explains the current
count, and nothing can change stock without leaving a trace.

```
recordMovement({ productId, type, qty, reference, note })
  -> inventory.stockQty = max(0, stockQty + qty)
  -> append stock_movements row
```

`qty` sign convention:

| Type | Sign | Source |
|---|---|---|
| restock | positive | `POST /api/inventory/restock` (deliveries) |
| sale | negative | `applyPaymentResult()` on a paid order |
| workshop_use | negative | `POST /api/inventory/workshop-use` |
| adjustment | either | reserved for manual corrections |

## Sales decrement

When an order is paid (webhook or simulator), `applyPaymentResult()`:

1. Sets the order to `paid` / `SUCCESS`.
2. For each line, records a `sale` movement of `-qty`, referenced by the order's
   `invoiceRef`.
3. Sets `stockApplied = true` so a duplicate webhook cannot double-decrement.

Stock is only decremented on success, never at order creation. A pending or
cancelled order does not hold or reduce stock.

## Workshop usage (the key rule)

The owner's own workshop consumes parts too. This is recorded as a **separate
movement type** (`workshop_use`), never as a sale. Consequences:

- Workshop consumption reduces stock exactly like a sale, so counts stay correct.
- It never appears in sales or revenue figures.
- It has its own dedicated panel on the dashboard inventory tab (a distinct
  amber-bordered box), so own-shop usage is always visible and separable.
- Each entry carries a job `reference` (e.g. `WS-1042`) and an optional note, so
  consumption can be traced to a specific workshop job.

This satisfies the requirement that even when the owner's own workshop uses
stock, it is reflected in counts and shown in its own section rather than hidden
inside sales.

## Adding and editing products

The owner manages the catalogue from the dashboard Inventory tab:

- **Add product** (header button) opens a form for SKU, name, category, brand,
  description, retail price, bulk price, the bulk-quantity threshold, reorder
  level, initial stock, and an active toggle. The product id is derived from the
  SKU. Creating with initial stock writes an opening `restock` movement.
- **Edit** (per row) changes details, prices, reorder level, and the active flag.
- **Active toggle**: `active: false` hides a product from the storefront without
  deleting it. It still appears in the owner inventory tagged "Hidden". The
  storefront reads `GET /api/products` (active only) live, so adding or
  reactivating a product makes it appear on the shop immediately.

This is handled by `POST` / `PUT /api/products/manage` (gated) and the store
functions `createProduct` / `updateProductDetails`. Editing never changes on-hand
stock directly; stock only moves through `recordMovement`.

## Dashboard surfaces

`components/dashboard/InventoryPanel.tsx`:
- Inventory table: each part with stock badge (in stock / low / out), reorder
  level, and two actions - "Add stock" and "Use in workshop".
- Workshop usage panel: the most recent `workshop_use` movements.

`components/dashboard/Kpis.tsx`:
- "Workshop stock used (value)" - sum of `workshop_use` quantities valued at
  retail price (an indicative cost of own-shop consumption).
- "Low / out of stock" - counts using `reorderLevel`.

## Low-stock logic

`components/ui.tsx` `StockBadge`:

| Condition | Badge |
|---|---|
| stockQty <= 0 | Out of stock (red) |
| stockQty <= reorderLevel | Low: N left (amber) |
| otherwise | In stock: N (green) |

## Extending

- **Reserve on order**: if you want pending orders to hold stock, decrement at
  creation and restore on cancel. The movement model supports this - add a
  `reservation` type, or use `adjustment`. Keep `stockApplied` semantics so the
  final paid state nets out correctly.
- **Per-warehouse stock**: add a `location` column to `inventory` and
  `stock_movements` and key inventory by `(productId, location)`.
- **Cost tracking**: add a `unitCost` to restock movements to value workshop
  usage at cost instead of retail.
