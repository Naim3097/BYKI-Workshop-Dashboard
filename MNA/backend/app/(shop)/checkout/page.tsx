'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { lineTier, lineUnitPrice, useCart } from '@/components/CartProvider'
import { CustomerFields, emptyCustomer, type Customer } from '@/components/CustomerFields'
import { formatMYR } from '@/lib/format'

export default function CheckoutPage() {
  const router = useRouter()
  const { lines, subtotal, count, clear } = useCart()
  const [customer, setCustomer] = useState<Customer>(emptyCustomer)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Bulk applies if any line is at bulk tier; channel is 'bulk' when the whole
  // order is bulk-priced, otherwise 'retail'. Either way it is a self-serve sale.
  const anyBulk = lines.some((l) => lineTier(l) === 'bulk')

  const onPay = async () => {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order',
          channel: anyBulk ? 'bulk' : 'retail',
          customer,
          items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
          returnPath: '/result',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not start payment.')
        setSubmitting(false)
        return
      }
      clear()
      window.location.href = data.paymentLink
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  if (count === 0) {
    return (
      <div className="container-page py-12">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold text-ink">Nothing to check out</h1>
          <Link href="/" className="btn-primary mt-4">
            Browse parts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-5 text-xl font-semibold text-ink">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card p-5">
          <CustomerFields value={customer} onChange={setCustomer} />
          {error ? (
            <p className="mt-4 rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>

        <div className="card h-fit p-5">
          <h2 className="text-sm font-semibold text-ink">Order summary</h2>
          <div className="mt-3 space-y-2">
            {lines.map((l) => (
              <div key={l.product.id} className="flex justify-between text-sm">
                <span className="min-w-0 truncate pr-2 text-ink-soft">
                  {l.product.name}
                  <span className="text-ink-muted"> x{l.qty}</span>
                </span>
                <span className="text-ink">{formatMYR(lineUnitPrice(l) * l.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm">
            <span className="font-semibold text-ink">Total</span>
            <span className="font-semibold text-ink">{formatMYR(subtotal)}</span>
          </div>
          <button
            type="button"
            onClick={onPay}
            disabled={submitting}
            className="btn-primary mt-4 w-full"
          >
            {submitting ? 'Starting payment...' : `Pay ${formatMYR(subtotal)}`}
          </button>
          <p className="mt-2 text-center text-xs text-ink-muted">
            You will be redirected to the secure payment page.
          </p>
        </div>
      </div>
    </div>
  )
}
