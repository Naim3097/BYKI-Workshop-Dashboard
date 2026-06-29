// Server-safe formatting helpers (NO 'use client'), so both Server and Client
// Components can format money/dates. The 'use client' ui module re-exports
// formatMYR for convenience in client code.

export function formatMYR(amount: number): string {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount)
}
