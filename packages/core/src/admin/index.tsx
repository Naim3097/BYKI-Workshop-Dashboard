'use client'

// Owner dashboard — consolidated from MNA's panels (KPIs, Bookings, Orders,
// Inventory, Transactions) plus Diagnose, rebuilt on core types. Inventory is
// interactive: add product, add stock (restock), and use-in-workshop, via the
// standard /api/admin/* routes. Pass DashboardData from a server component that
// called getDashboardData(workshopId).

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, formatMYR } from '../ui'
import type { DashboardData } from './handlers'
import type { Booking, Order, ProductWithStock, StockMovement, DiagnoseSession } from '../types'

export type { DashboardData } from './handlers'

const TABS = ['Overview', 'Bookings', 'Orders', 'Inventory', 'Movements', 'Diagnose'] as const
type Tab = (typeof TABS)[number]

export function OwnerDashboard({ data, title = 'Dashboard' }: { data: DashboardData; title?: string }) {
  const [tab, setTab] = useState<Tab>('Overview')
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      <Kpis data={data} />
      <nav className="mt-8 mb-4 flex flex-wrap gap-2 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'border-b-2 border-[var(--accent)] text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>
      {tab === 'Overview' && <Overview data={data} />}
      {tab === 'Bookings' && <BookingsPanel bookings={data.bookings} />}
      {tab === 'Orders' && <OrdersPanel orders={data.orders} />}
      {tab === 'Inventory' && <InventoryPanel products={data.products} />}
      {tab === 'Movements' && <MovementsPanel movements={data.movements} products={data.products} />}
      {tab === 'Diagnose' && <DiagnosePanel sessions={data.diagnoseSessions} />}
    </div>
  )
}

function Kpis({ data }: { data: DashboardData }) {
  const priceMap = new Map(data.products.map((p) => [p.id, p]))
  const paidOrders = data.orders.filter((o) => o.paymentStatus === 'SUCCESS')
  const paidBookings = data.bookings.filter((b) => b.paymentStatus === 'SUCCESS')
  const revenue =
    paidOrders.reduce((s, o) => s + o.amount, 0) + paidBookings.reduce((s, b) => s + b.amount, 0)
  const pending =
    data.orders.filter((o) => o.status === 'pending_payment').length +
    data.bookings.filter((b) => b.status === 'pending_payment').length
  const workshopValue = data.movements
    .filter((m) => m.type === 'workshop_use')
    .reduce((sum, m) => sum + Math.abs(m.qty) * (priceMap.get(m.productId)?.priceRetail ?? 0), 0)
  const lowStock = data.products.filter((p) => p.stockQty > 0 && p.stockQty <= p.reorderLevel).length
  const outStock = data.products.filter((p) => p.stockQty <= 0).length

  const cards = [
    { label: 'Paid revenue', value: formatMYR(revenue) },
    { label: 'Awaiting payment', value: String(pending) },
    { label: 'Workshop stock used', value: formatMYR(workshopValue) },
    { label: 'Low / out of stock', value: `${lowStock} low, ${outStock} out` },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-white/50">{c.label}</p>
          <p className="mt-1 text-lg font-semibold">{c.value}</p>
        </div>
      ))}
    </div>
  )
}

function Overview({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Recent bookings">
        <BookingsPanel bookings={data.bookings.slice(0, 5)} compact />
      </Section>
      <Section title="Recent orders">
        <OrdersPanel orders={data.orders.slice(0, 5)} compact />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h2 className="mb-3 text-sm font-semibold text-white/70">{title}</h2>
      {children}
    </div>
  )
}

function payColor(status: string): 'green' | 'yellow' | 'red' | 'default' {
  if (status === 'SUCCESS') return 'green'
  if (status === 'pending') return 'yellow'
  if (status === 'FAILED' || status === 'CANCELLED') return 'red'
  return 'default'
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-white/40">
            {head.map((h) => (
              <th key={h} className="px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function BookingsPanel({ bookings, compact = false }: { bookings: Booking[]; compact?: boolean }) {
  if (!bookings.length) return <Empty label="No bookings yet." />
  return (
    <Table head={compact ? ['Customer', 'Service', 'Status'] : ['Ref', 'Customer', 'Service', 'Date', 'Amount', 'Payment']}>
      {bookings.map((b) => (
        <tr key={b.id} className="border-t border-white/5">
          {!compact && <td className="px-2 py-2 font-mono text-xs">{b.invoiceRef}</td>}
          <td className="px-2 py-2">{b.customerName}</td>
          <td className="px-2 py-2">{b.serviceType}</td>
          {!compact && <td className="px-2 py-2">{b.preferredDate ?? '-'}</td>}
          {!compact && <td className="px-2 py-2">{formatMYR(b.amount)}</td>}
          <td className="px-2 py-2">
            <Badge color={payColor(b.paymentStatus)}>{b.paymentStatus}</Badge>
          </td>
        </tr>
      ))}
    </Table>
  )
}

function OrdersPanel({ orders, compact = false }: { orders: Order[]; compact?: boolean }) {
  if (!orders.length) return <Empty label="No orders yet." />
  return (
    <Table head={compact ? ['Customer', 'Amount', 'Status'] : ['Ref', 'Customer', 'Channel', 'Items', 'Amount', 'Payment']}>
      {orders.map((o) => (
        <tr key={o.id} className="border-t border-white/5">
          {!compact && <td className="px-2 py-2 font-mono text-xs">{o.invoiceRef}</td>}
          <td className="px-2 py-2">{o.customerName}</td>
          {!compact && <td className="px-2 py-2 capitalize">{o.channel}</td>}
          {!compact && <td className="px-2 py-2">{o.items?.length ?? 0}</td>}
          <td className="px-2 py-2">{formatMYR(o.amount)}</td>
          <td className="px-2 py-2">
            <Badge color={payColor(o.paymentStatus)}>{o.paymentStatus}</Badge>
          </td>
        </tr>
      ))}
    </Table>
  )
}

// ── Interactive inventory: add product, add stock, use in workshop ──
function InventoryPanel({ products }: { products: ProductWithStock[] }) {
  const router = useRouter()
  const [action, setAction] = useState<{ product: ProductWithStock; mode: 'restock' | 'workshop_use' } | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const refresh = () => router.refresh()

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-white/50">Add products, take in deliveries, or consume stock for the workshop.</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>+ Add product</Button>
      </div>
      {products.length === 0 ? (
        <Empty label="No products yet — add your first." />
      ) : (
        <Table head={['Product', 'SKU', 'Retail', 'Stock', 'Reorder', 'Status', 'Actions']}>
          {products.map((p) => {
            const out = p.stockQty <= 0
            const low = !out && p.stockQty <= p.reorderLevel
            return (
              <tr key={p.id} className="border-t border-white/5">
                <td className="px-2 py-2">{p.name}</td>
                <td className="px-2 py-2 font-mono text-xs">{p.sku}</td>
                <td className="px-2 py-2">{formatMYR(p.priceRetail)}</td>
                <td className="px-2 py-2">{p.stockQty}</td>
                <td className="px-2 py-2">{p.reorderLevel}</td>
                <td className="px-2 py-2">
                  <Badge color={out ? 'red' : low ? 'yellow' : 'green'}>{out ? 'Out' : low ? 'Low' : 'OK'}</Badge>
                </td>
                <td className="px-2 py-2">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setAction({ product: p, mode: 'restock' })}
                      className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/5"
                    >
                      Add stock
                    </button>
                    <button
                      onClick={() => setAction({ product: p, mode: 'workshop_use' })}
                      className="rounded-md border border-amber-500/40 bg-amber-500/5 px-2 py-1 text-xs text-amber-400 hover:bg-amber-500/10"
                    >
                      Use in workshop
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </Table>
      )}

      {action && (
        <StockActionModal
          product={action.product}
          mode={action.mode}
          onClose={() => setAction(null)}
          onDone={() => {
            setAction(null)
            refresh()
          }}
        />
      )}
      {addOpen && (
        <ProductFormModal
          onClose={() => setAddOpen(false)}
          onDone={() => {
            setAddOpen(false)
            refresh()
          }}
        />
      )}
    </div>
  )
}

const modalInput =
  'w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/25 focus:border-[var(--accent)]/50 outline-none'

function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--bg-raised,#121214)] p-5">
        <h3 className="mb-4 text-base font-semibold text-white">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function StockActionModal({
  product,
  mode,
  onClose,
  onDone,
}: {
  product: ProductWithStock
  mode: 'restock' | 'workshop_use'
  onClose: () => void
  onDone: () => void
}) {
  const isRestock = mode === 'restock'
  const [qty, setQty] = useState(1)
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setError('')
    if (qty <= 0) return setError('Enter a quantity above zero.')
    if (!isRestock && qty > product.stockQty) return setError(`Only ${product.stockQty} in stock.`)
    setBusy(true)
    const res = await fetch('/api/admin/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, type: mode, qty, reference, note }),
    })
    if (res.ok) return onDone()
    const d = await res.json().catch(() => ({}))
    setError(d.error || 'Could not save.')
    setBusy(false)
  }

  return (
    <Modal title={isRestock ? `Add stock — ${product.name}` : `Use in workshop — ${product.name}`}>
      <p className="mb-3 text-xs text-white/50">Current stock: {product.stockQty}</p>
      <label className="mb-1 block text-xs text-white/60">Quantity</label>
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
        className={modalInput}
      />
      {!isRestock && (
        <>
          <label className="mb-1 mt-3 block text-xs text-white/60">Job reference</label>
          <input className={modalInput} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. WS-1042" />
        </>
      )}
      <label className="mb-1 mt-3 block text-xs text-white/60">Note (optional)</label>
      <input className={modalInput} value={note} onChange={(e) => setNote(e.target.value)} placeholder={isRestock ? 'Supplier / delivery' : 'Reason'} />
      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
      <div className="mt-5 flex gap-2">
        <Button variant="secondary" className="flex-1" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button className="flex-1" disabled={busy} onClick={submit}>
          {busy ? 'Saving…' : isRestock ? 'Add stock' : 'Record usage'}
        </Button>
      </div>
    </Modal>
  )
}

function ProductFormModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({
    name: '', sku: '', kind: 'part', category: '',
    priceRetail: '', priceBulk: '', bulkMinQty: '', initialStock: '', reorderLevel: '', isFeatured: false,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value })

  async function submit() {
    setError('')
    if (!f.name || !f.sku || !(Number(f.priceRetail) > 0)) return setError('Name, SKU and retail price are required.')
    setBusy(true)
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    })
    if (res.ok) return onDone()
    const d = await res.json().catch(() => ({}))
    setError(d.error || 'Could not save.')
    setBusy(false)
  }

  return (
    <Modal title="Add product">
      <div className="space-y-2">
        <input className={modalInput} placeholder="Name" value={f.name} onChange={set('name')} />
        <input className={modalInput} placeholder="SKU" value={f.sku} onChange={set('sku')} />
        <div className="flex gap-2">
          <select className={modalInput} value={f.kind} onChange={set('kind')}>
            <option value="part">Part</option>
            <option value="device">Device</option>
            <option value="service">Service</option>
          </select>
          <input className={modalInput} placeholder="Category" value={f.category} onChange={set('category')} />
        </div>
        <div className="flex gap-2">
          <input className={modalInput} type="number" placeholder="Retail price (RM)" value={f.priceRetail} onChange={set('priceRetail')} />
          <input className={modalInput} type="number" placeholder="Bulk price (opt)" value={f.priceBulk} onChange={set('priceBulk')} />
        </div>
        <div className="flex gap-2">
          <input className={modalInput} type="number" placeholder="Bulk min qty" value={f.bulkMinQty} onChange={set('bulkMinQty')} />
          <input className={modalInput} type="number" placeholder="Opening stock" value={f.initialStock} onChange={set('initialStock')} />
          <input className={modalInput} type="number" placeholder="Reorder at" value={f.reorderLevel} onChange={set('reorderLevel')} />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={f.isFeatured} onChange={set('isFeatured')} /> Featured on landing page
        </label>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
      <div className="mt-5 flex gap-2">
        <Button variant="secondary" className="flex-1" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button className="flex-1" disabled={busy} onClick={submit}>{busy ? 'Saving…' : 'Add product'}</Button>
      </div>
    </Modal>
  )
}

function MovementsPanel({ movements, products }: { movements: StockMovement[]; products: ProductWithStock[] }) {
  if (!movements.length) return <Empty label="No stock movements yet." />
  const nameById = new Map(products.map((p) => [p.id, p.name]))
  return (
    <Table head={['Date', 'Product', 'Type', 'Qty', 'Reference']}>
      {movements.map((m) => (
        <tr key={m.id} className="border-t border-white/5">
          <td className="px-2 py-2 text-xs">{new Date(m.createdAt).toLocaleString()}</td>
          <td className="px-2 py-2">{nameById.get(m.productId) ?? m.productId}</td>
          <td className="px-2 py-2">
            <Badge color={m.type === 'restock' ? 'green' : m.type === 'workshop_use' ? 'blue' : 'default'}>{m.type}</Badge>
          </td>
          <td className={`px-2 py-2 ${m.qty < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{m.qty}</td>
          <td className="px-2 py-2 text-xs">{m.reference}</td>
        </tr>
      ))}
    </Table>
  )
}

function DiagnosePanel({ sessions }: { sessions: DiagnoseSession[] }) {
  if (!sessions.length) return <Empty label="No diagnose sessions yet." />
  return (
    <Table head={['Date', 'Source', 'Vehicle', 'Fault codes']}>
      {sessions.map((s) => (
        <tr key={s.id} className="border-t border-white/5">
          <td className="px-2 py-2 text-xs">{new Date(s.createdAt).toLocaleString()}</td>
          <td className="px-2 py-2">
            <Badge color={s.source === 'obd' ? 'blue' : 'default'}>{s.source}</Badge>
          </td>
          <td className="px-2 py-2">{s.vehicleModel || '-'}</td>
          <td className="px-2 py-2 font-mono text-xs">{s.faultCodes.join(', ') || 'clean'}</td>
        </tr>
      ))}
    </Table>
  )
}

function Empty({ label }: { label: string }) {
  return <p className="py-6 text-center text-sm text-white/40">{label}</p>
}
