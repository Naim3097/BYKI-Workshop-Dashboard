# Payments (LeanX)

This system uses the **LeanX** gateway (`leanx.io`). The integration is a direct
port of the flow proven in the One X Transmission project. It supports two modes
through one code path, switched by the `PAYMENTS_MODE` environment variable:

- `mock` (default) - no LeanX call. A built-in simulator at `/pay/[ref]` stands
  in for the LeanX hosted page so the whole flow works without credentials.
- `live` - calls the real LeanX API. Requires `LEANX_AUTH_TOKEN` and
  `LEANX_COLLECTION_UUID`.

Going live is configuration only. No code changes are required.

## Core files

| File | Responsibility |
|---|---|
| `lib/leanx.ts` | `createBill()` (mock + live), `paymentsMode()`, validators |
| `lib/payments.ts` | `applyPaymentResult()` - confirm order/booking + decrement stock |
| `app/api/payments/create/route.ts` | Create order/booking, call `createBill`, persist |
| `app/api/payments/webhook/route.ts` | Receive LeanX callback, call `applyPaymentResult` |
| `app/api/payments/simulate/route.ts` | Mock-only: drive `applyPaymentResult` from the simulator |
| `app/api/payments/status/route.ts` | Poll latest status by reference |

## End-to-end sequence

```
Client            create route         leanx.ts            LeanX            webhook route        payments.ts
------            ------------         --------            -----            -------------        ----------
POST create  -->  build order
                  persist (pending)
                  createBill() ----->  mock: /pay/[ref]
                                       live: POST create-bill-page --> bill + redirect_url
                  store billNo, link
  <-- paymentLink
redirect to paymentLink
                                                          (customer pays)
                                                          POST callback_url ---> parse payload
                                                                                 applyPaymentResult() -->
                                                                                   order -> paid
                                                                                   sale movements
                                                                                   stock decrement
redirect to redirect_url (/result?ref=...)
GET status (poll) --> read order
  <-- SUCCESS
```

In mock mode, the simulator page calls `POST /api/payments/simulate` instead of a
real callback. Both routes funnel into the same `applyPaymentResult()`, so mock
and live behave identically downstream.

## Create bill - request

`createBill()` in `lib/leanx.ts` (live mode) sends:

```
POST {LEANX_API_HOST}/api/v1/merchant/create-bill-page
Headers:
  Content-Type: application/json
  auth-token: {LEANX_AUTH_TOKEN}
Body:
  {
    "collection_uuid": "{LEANX_COLLECTION_UUID}",
    "amount": 624.00,
    "invoice_ref": "ORDER-946FF6E7",
    "redirect_url": "https://site/result?ref=ORDER-946FF6E7",
    "callback_url": "https://site/api/payments/webhook",
    "full_name": "Test Buyer",
    "email": "buyer@test.com",
    "phone_number": "0123456789"
  }
```

### Success response

LeanX returns `response_code: 2000` and:

```
{
  "response_code": 2000,
  "data": {
    "collection_uuid": "...",
    "redirect_url": "https://leanx.io/bill/...",   <- the payment link
    "bill_no": "...",
    "invoice_ref": "ORDER-946FF6E7"
  }
}
```

`data.redirect_url` is the payment link. The storefront redirects the buyer to
it; the sales portal shares it. Any `response_code` other than `2000` is treated
as an error.

## Webhook - callback

LeanX calls `callback_url` (our `/api/payments/webhook`). The handler accepts
JSON or `application/x-www-form-urlencoded` (LeanX has used both), and reads:

| Field | Use |
|---|---|
| invoice_no | Matched against `invoiceRef`, `leanxBillNo`, or `leanxInvoiceRef` |
| invoice_status | `SUCCESS`, `FAILED`, or `CANCELLED` |
| amount | Recorded |
| bank_provider | Stored as paymentProvider |
| providerTypeReference | Stored as paymentMethod (defaults to FPX) |
| fpx_invoice_no | Stored as paymentTransactionId |

Mapping to internal status:

| invoice_status | order/booking status | paymentStatus |
|---|---|---|
| SUCCESS | paid | SUCCESS |
| FAILED | cancelled | FAILED |
| CANCELLED | cancelled | CANCELLED |

On `SUCCESS` for an order, `applyPaymentResult()` records one `sale` movement per
line and decrements stock once (guarded by `stockApplied`).

### Reference matching

`invoice_ref` we send is `ORDER-xxxx` / `BOOKING-xxxx`. The lookup
(`getOrderByInvoiceRef` / `getBookingByInvoiceRef`) matches on `invoiceRef`,
`leanxBillNo`, or `leanxInvoiceRef`, mirroring the multi-strategy matching used in
One X Transmission so a webhook is found regardless of which identifier LeanX
echoes back.

## Status check / reconciliation

`GET /api/payments/status?ref=...` returns the current stored status. The result
page polls it after redirect, because the webhook may land a moment after the
browser returns.

For live mode you can additionally reconcile against LeanX directly (as One X
Transmission does) using:

```
POST {LEANX_API_HOST}/api/v1/merchant/manual-checking-transaction?invoice_no={ref}
Headers: auth-token: {LEANX_AUTH_TOKEN}
```

This is documented here for completeness; wire it into the status route as a
fallback if you want belt-and-braces confirmation when a webhook is missed.

## Going live: checklist

1. Obtain `LEANX_COLLECTION_UUID` and `LEANX_AUTH_TOKEN` from the client.
2. Set in the production environment:
   ```
   PAYMENTS_MODE=live
   LEANX_AUTH_TOKEN=...
   LEANX_COLLECTION_UUID=...
   LEANX_API_HOST=https://api.leanx.io
   NEXT_PUBLIC_BASE_URL=https://your-domain
   ```
3. Register the callback URL with LeanX (or confirm it accepts the
   `callback_url` we send per bill): `https://your-domain/api/payments/webhook`.
4. Confirm `NEXT_PUBLIC_BASE_URL` is the public HTTPS domain so redirect and
   callback URLs are correct.
5. Run one real low-value transaction and confirm: redirect works, webhook
   confirms the order, stock decrements, dashboard shows it.

## Security notes for production

- The `/api/payments/simulate` route refuses to run when `PAYMENTS_MODE=live`, so
  it can never affect real transactions. You may also remove the route and the
  `/pay/[ref]` page entirely in production.
- Consider verifying webhook authenticity (LeanX signature/IP allowlist if
  available) before trusting the payload. The current handler validates shape but
  not origin.
- Amounts are always recomputed server-side from the catalogue; the client never
  dictates the charged amount.
