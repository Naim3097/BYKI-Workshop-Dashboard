'use client'

import { useEffect, useMemo, useState } from 'react'
import { CustomerFields, emptyCustomer, type Customer } from '@/components/CustomerFields'
import type { StoreProduct } from '@/components/ProductCard'
import { formatMYR } from '@/lib/format'
import { serviceDeposits, serviceLabels, timeSlots } from '@/lib/labels'
import type { ServiceType } from '@/lib/types'

type Mode = 'order' | 'booking'

interface LinkResult {
  invoiceRef: string
  amount: number
  paymentLink: string
}

const services = Object.keys(serviceLabels) as ServiceType[]

export default function PortalPage() {
  const [mode, setMode] = useState<Mode>('order')
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [qtys, setQtys] = useState<Record<string, number>>({})
  const [customer, setCustomer] = useState<Customer>(emptyCustomer)

  const [serviceType, setServiceType] = useState<ServiceType>('transmission_inspection')
  const [vehicleModel, setVehicleModel] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [notes, setNotes] = useState('')

  const [result, setResult] = useState<LinkResult | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
  }, [])

  const orderLines = useMemo(() => {
    return products
      .map((p) => ({ product: p, qty: qtys[p.id] || 0 }))
      .filter((l) => l.qty > 0)
      .map((l) => {
        const bulk = l.qty >= l.product.bulkMinQty
        const unit = bulk ? l.product.priceBulk : l.product.priceRetail
        return { ...l, unit, tier: bulk ? 'bulk' : 'retail', lineTotal: unit * l.qty }
      })
  }, [products, qtys])

  const orderTotal = orderLines.reduce((sum, l) => sum + l.lineTotal, 0)
  const today = new Date().toISOString().split('T')[0]

  const setQty = (id: string, qty: number) =>
    setQtys((prev) => ({ ...prev, [id]: Math.max(0, Math.floor(qty || 0)) }))

  const reset = () => {
    setResult(null)
    setError('')
    setCopied(false)
  }

  const createLink = async () => {
    reset()
    setSubmitting(true)
    try {
      const payload =
        mode === 'order'
          ? {
              type: 'order',
              channel: 'owner',
              customer,
              items: orderLines.map((l) => ({ productId: l.product.id, qty: l.qty })),
              returnPath: '/result',
            }
          : {
              type: 'booking',
              customer,
              booking: { serviceType, vehicleModel, preferredDate, timeSlot, notes },
              returnPath: '/result',
            }

      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not create the payment link.')
        setSubmitting(false)
        return
      }
      setResult({ invoiceRef: data.invoiceRef, amount: data.amount, paymentLink: data.paymentLink })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const copyLink = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.paymentLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const canSubmit =
    customer.name &&
    customer.email &&
    customer.phone &&
    (mode === 'order' ? orderLines.length > 0 : preferredDate && timeSlot)

  return (
    <div className="container-page py-8">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink">Sales portal</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Build an order or booking for a buyer, then send them a payment link.
          The transaction appears on the dashboard as soon as it is created.
        </p>
      </div>

      <div className="mb-5 inline-flex rounded-card border border-line bg-surface p-1">
        <TabButton active={mode === 'order'} onClick={() => { setMode('order'); reset() }}>
          Parts order
        </TabButton>
        <TabButton active={mode === 'booking'} onClick={() => { setMode('booking'); reset() }}>
          Service booking
        </TabButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card p-5">
          {mode === 'order' ? (
            <>
              <div className="mb-3 text-sm font-semibold text-ink">Select parts and quantities</div>
              <div className="divide-y divide-line">
                {products.map((p) => {
                  const qty = qtys[p.id] || 0
                  const bulk = qty >= p.bulkMinQty
                  const unit = bulk ? p.priceBulk : p.priceRetail
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink-muted">
                          {formatMYR(p.priceRetail)} retail | {formatMYR(p.priceBulk)} bulk from{' '}
                          {p.bulkMinQty} | stock {p.stockQty}
                        </p>
                      </div>
                      <div className="flex items-center rounded-card border border-line">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() => setQty(p.id, qty - 1)}
                          className="px-2.5 py-1.5 text-ink-soft hover:bg-white/5"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={qty}
                          onChange={(e) => setQty(p.id, Number(e.target.value))}
                          className="w-12 border-x border-line bg-transparent py-1.5 text-center text-sm text-ink outline-none"
                        />
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() => setQty(p.id, qty + 1)}
                          className="px-2.5 py-1.5 text-ink-soft hover:bg-white/5"
                        >
                          +
                        </button>
                      </div>
                      <div className="w-20 text-right text-sm font-medium text-ink">
                        {qty > 0 ? formatMYR(unit * qty) : '-'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 text-sm font-semibold text-ink">Service</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {services.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setServiceType(s)}
                    className={`flex items-center justify-between rounded-card border px-3 py-3 text-left text-sm ${
                      s === serviceType ? 'border-brand bg-brand-soft' : 'border-line hover:bg-white/5'
                    }`}
                  >
                    <span className="font-medium text-ink">{serviceLabels[s]}</span>
                    <span className="text-ink-muted">{formatMYR(serviceDeposits[s])}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="p-vehicle">Vehicle model</label>
                  <input
                    id="p-vehicle"
                    className="input"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="e.g. Audi A4 B8 2.0 TFSI"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="p-date">Preferred date</label>
                  <input
                    id="p-date"
                    type="date"
                    min={today}
                    className="input"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="p-slot">Time slot</label>
                  <select
                    id="p-slot"
                    className="input"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                  >
                    <option value="">Select a slot</option>
                    {timeSlots.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="p-notes">Notes</label>
                  <textarea
                    id="p-notes"
                    className="input min-h-16"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="mt-5 border-t border-line pt-5">
            <CustomerFields value={customer} onChange={setCustomer} legend="Buyer details" />
          </div>
        </div>

        <div className="card h-fit p-5">
          <h2 className="text-sm font-semibold text-ink">Summary</h2>
          {mode === 'order' ? (
            <div className="mt-3 space-y-1.5">
              {orderLines.length === 0 ? (
                <p className="text-sm text-ink-muted">No parts selected yet.</p>
              ) : (
                orderLines.map((l) => (
                  <div key={l.product.id} className="flex justify-between text-sm">
                    <span className="min-w-0 truncate pr-2 text-ink-soft">
                      {l.product.name} x{l.qty}
                      <span className="text-ink-muted"> ({l.tier})</span>
                    </span>
                    <span className="text-ink">{formatMYR(l.lineTotal)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between border-t border-line pt-2 text-sm font-semibold text-ink">
                <span>Total</span>
                <span>{formatMYR(orderTotal)}</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex justify-between text-sm font-semibold text-ink">
              <span>Deposit</span>
              <span>{formatMYR(serviceDeposits[serviceType])}</span>
            </div>
          )}

          {error ? (
            <p className="mt-4 rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          ) : null}

          {result ? (
            <div className="mt-4 rounded-card border border-positive/30 bg-positive/5 p-3">
              <p className="text-sm font-semibold text-positive">Payment link created</p>
              <p className="mt-1 text-xs text-ink-muted">
                Reference {result.invoiceRef} | {formatMYR(result.amount)}
              </p>
              <input
                readOnly
                value={result.paymentLink}
                onFocus={(e) => e.currentTarget.select()}
                className="input mt-2 text-xs"
              />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={copyLink} className="btn-secondary flex-1">
                  {copied ? 'Copied' : 'Copy link'}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `MNA Dynamic Torque payment link (${formatMYR(result.amount)}): ${result.paymentLink}`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary flex-1 text-center"
                >
                  Share on WhatsApp
                </a>
              </div>
              <button type="button" onClick={reset} className="btn-ghost mt-2 w-full">
                Create another
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={createLink}
              disabled={submitting || !canSubmit}
              className="btn-primary mt-4 w-full"
            >
              {submitting ? 'Creating...' : 'Create payment link'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[7px] px-4 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-brand text-white' : 'text-ink-soft hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  )
}
