# API reference

All routes are Next.js App Router handlers under `app/api`. Bodies are JSON unless
noted. "Gated" routes require the owner session cookie (set by login); the
middleware returns `401` for gated API routes without it.

## Catalogue

### GET /api/catalog

Public, CORS-enabled. The catalogue in the exact shape the static storefront
(`window.MNACatalog`) expects, so `assets/catalog.js` only changes its data
source. Active products only. `stockStatus` is derived from `stockQty` vs the
reorder level.

Response:
```
{ "products": [
  { "id","name","slug","sku","category","description","specifications",
    "compatibleVehicles","compatibleGearboxes",
    "price","wholesalePrice","minWholesaleQty",
    "stockQty","lowStockThreshold","stockStatus","tags","isFeatured" }
] }
```

### GET /api/products

Internal shape used by the backend's own pages and product management. Public.

Response:
```
{ "products": [
  { "id","sku","name","slug","category","brand","description",
    "priceRetail","priceBulk","bulkMinQty","active",
    "specifications","compatibleVehicles","compatibleGearboxes","tags","isFeatured",
    "stockQty","reorderLevel" }
] }
```

## Payments

### POST /api/payments/create

Creates an order or a booking, creates the LeanX bill, returns the payment link.
Public (used by storefront, booking, and the owner portal). Amounts are computed
server-side.

Order body:
```
{
  "type": "order",
  "channel": "retail" | "bulk" | "owner",
  "customer": { "name", "email", "phone" },
  "items": [ { "productId", "qty" } ],
  "returnPath": "/result",       // internal backend path, OR
  "returnUrl": "https://site/success.html"  // absolute; sends the buyer back to
                                            // the static storefront after paying
}
```
CORS-enabled with an OPTIONS preflight so the static storefront can call it
cross-origin.

Booking body:
```
{
  "type": "booking",
  "customer": { "name", "email", "phone" },
  "booking": {
    "serviceType": "transmission_inspection" | "general_service" | "diagnostic" | "fluid_change",
    "vehicleModel", "preferredDate", "timeSlot", "notes"
  },
  "returnPath": "/result"
}
```

Response:
```
{ "success": true, "type": "order"|"booking", "id", "invoiceRef", "amount", "paymentLink" }
```

Validation errors return `400` with `{ "error": "..." }`. Customer name, email,
and a valid Malaysian mobile number are required.

### POST /api/payments/webhook

LeanX callback. Accepts JSON or form-encoded. See
[Payments](payments-leanx.md#webhook---callback). Returns `{ success, kind, id, status }`
or `404` if no matching record.

### GET /api/payments/webhook

Health check: `{ "status": "Webhook active", "timestamp": "..." }`.

### POST /api/payments/simulate

Mock mode only (returns `403` when `PAYMENTS_MODE=live`). Drives the same result
logic as the webhook from the simulator page.

Body: `{ "ref": "ORDER-XXXX", "outcome": "success" | "fail" }`
Response: `{ "success": true, "kind", "id", "status" }`

### GET /api/payments/status?ref=...

Latest stored status for a reference. Public (read-only).

Response:
```
{ "found": true, "type": "order"|"booking", "invoiceRef",
  "status", "paymentStatus", "amount", "customerName" }
```
Returns `404` `{ "found": false }` if unknown.

## Products - management (gated)

The public `GET /api/products` is read-only. Owner product management is a
separate, gated route.

### POST /api/products/manage

Create a new product. Also creates its inventory record and, if `initialStock`
> 0, an opening `restock` movement.

Body:
```
{
  "sku", "name",
  "category": "transmission" | "engine" | "brakes" | "suspension" | "electrical" | "filters",
  "brand", "description",
  "priceRetail", "priceBulk", "bulkMinQty",
  "reorderLevel", "initialStock",
  "active": true
}
```
Response: `{ "success": true, "product": { ... } }`. Duplicate SKU returns `500`
with the error message; missing/invalid fields return `400`.

### PUT /api/products/manage

Update an existing product. Send `id` plus any fields to change. `reorderLevel`
updates the inventory record. `active: false` hides the product from the
storefront without deleting it (it still shows in the owner inventory, tagged
"Hidden"). On-hand stock is never changed here - use the restock / workshop-use
routes so every change leaves a movement.

Body: `{ "id", ...any editable fields }`
Response: `{ "success": true, "product": { ... } }`

## Inventory (gated)

### POST /api/inventory/restock

Adds stock. Records a positive `restock` movement.

Body: `{ "productId", "qty", "note" }`
Response: `{ "success": true, "movement": { ... } }`

### POST /api/inventory/workshop-use

Consumes stock for the owner's own workshop. Records a negative `workshop_use`
movement. Validates against available stock is not enforced server-side beyond a
non-negative floor; the dashboard UI blocks over-consumption.

Body: `{ "productId", "qty", "reference", "note" }`
Response: `{ "success": true, "movement": { ... } }`

## Dashboard (gated)

### GET /api/dashboard

One aggregate payload powering the dashboard. Polled every 5 seconds by the UI.

Response:
```
{
  "orders":   [ Order, ... ],      // newest first
  "bookings": [ Booking, ... ],
  "products": [ Product + stock ],
  "movements":[ StockMovement ]    // newest first
}
```

## Owner auth

### POST /api/owner/login

Body: `{ "code": "..." }`. If it equals `OWNER_ACCESS_CODE`, sets an httpOnly
session cookie (`owner_session=ok`, 8h). Returns `401` on mismatch.

### DELETE /api/owner/login

Clears the session cookie. Used by Sign out.

## Status codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 400 | Validation error (missing/invalid fields) |
| 401 | Not authenticated (gated route, no/invalid session) |
| 403 | Simulator called in live mode |
| 404 | Reference/record not found |
| 500 | Server error (also returned if LeanX rejects a live create-bill) |
