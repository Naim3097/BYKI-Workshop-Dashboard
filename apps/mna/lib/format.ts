// Display helpers. Currency is MYR throughout.

export function formatMYR(amount: number): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDateTime(iso: string): string {
  if (!iso) return '-'
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDate(iso: string): string {
  if (!iso) return '-'
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
