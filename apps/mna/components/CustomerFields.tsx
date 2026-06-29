'use client'

export interface Customer {
  name: string
  email: string
  phone: string
}

export const emptyCustomer: Customer = { name: '', email: '', phone: '' }

export function CustomerFields({
  value,
  onChange,
  legend = 'Customer details',
}: {
  value: Customer
  onChange: (next: Customer) => void
  legend?: string
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-ink">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="cust-name">
            Full name
          </label>
          <input
            id="cust-name"
            className="input"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="e.g. Ahmad bin Ismail"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor="cust-email">
            Email
          </label>
          <input
            id="cust-email"
            type="email"
            className="input"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="name@email.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label" htmlFor="cust-phone">
            Mobile number
          </label>
          <input
            id="cust-phone"
            className="input"
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            placeholder="0123456789"
            autoComplete="tel"
          />
        </div>
      </div>
    </fieldset>
  )
}
