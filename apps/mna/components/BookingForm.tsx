'use client'

// Recorded booking — same flow as Overhaulinyard: posts a deposit booking to the
// core payment flow (/api/payments/create), so the booking + customer land in
// Supabase and feed BYKI. lastScanId() links a just-completed OBD scan to it.

import { useState } from 'react'
import { CustomerFields, emptyCustomer, type Customer } from '@/components/CustomerFields'
import { lastScanId } from '@byki/core/diagnose'
import { serviceDeposits, serviceLabels, timeSlots } from '@/lib/labels'
import { formatMYR } from '@/lib/format'
import type { ServiceType } from '@/lib/types'

const services = Object.keys(serviceLabels) as ServiceType[]

export function BookingForm() {
  const [serviceType, setServiceType] = useState<ServiceType>('transmission_inspection')
  const [vehicleModel, setVehicleModel] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [customer, setCustomer] = useState<Customer>(emptyCustomer)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const deposit = serviceDeposits[serviceType]
  const today = new Date().toISOString().split('T')[0]

  const onSubmit = async () => {
    setError('')
    if (!customer.name || !customer.phone || !customer.email) {
      setError('Please fill in your name, phone and email.')
      return
    }
    if (!preferredDate || !timeSlot) {
      setError('Please choose a date and time slot.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking',
          customer,
          diagnoseSessionId: lastScanId() ?? undefined,
          booking: { serviceType, vehicleModel, preferredDate, timeSlot, notes },
          returnPath: '/result',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not start booking.')
        setSubmitting(false)
        return
      }
      window.location.href = data.paymentLink
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-5 text-left">
      <div className="mb-3 text-sm font-semibold text-ink">Service</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {services.map((s) => {
          const active = s === serviceType
          return (
            <button
              key={s}
              type="button"
              onClick={() => setServiceType(s)}
              className={`flex items-center justify-between rounded-card border px-3 py-3 text-left text-sm transition-colors ${
                active ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:bg-white/5'
              }`}
            >
              <span className="font-medium text-ink">{serviceLabels[s]}</span>
              <span className="text-ink-muted">{formatMYR(serviceDeposits[s])}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="vehicle">Vehicle model</label>
          <input
            id="vehicle"
            className="input"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            placeholder="e.g. Proton X50 1.5 TGDi (CVT)"
          />
        </div>
        <div>
          <label className="label" htmlFor="date">Preferred date</label>
          <input
            id="date"
            type="date"
            min={today}
            className="input"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="slot">Time slot</label>
          <select id="slot" className="input" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
            <option value="">Select a slot</option>
            {timeSlots.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            className="input min-h-20"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the symptoms or work needed"
          />
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <CustomerFields value={customer} onChange={setCustomer} legend="Your details" />
      </div>

      {error ? (
        <p className="mt-4 rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <span className="text-ink-muted">Deposit due now</span>
          <span className="ml-2 text-lg font-semibold text-ink">{formatMYR(deposit)}</span>
        </div>
        <button type="button" onClick={onSubmit} disabled={submitting} className="btn-primary sm:w-auto">
          {submitting ? 'Starting payment…' : `Pay deposit ${formatMYR(deposit)}`}
        </button>
      </div>
    </div>
  )
}
