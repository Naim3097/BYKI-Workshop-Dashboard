'use client'

// Client-side CSV export of a table. No dependencies; builds a Blob and
// triggers a download.
export function ExportCsv({
  filename,
  headers,
  rows,
}: {
  filename: string
  headers: string[]
  rows: (string | number)[][]
}) {
  function download() {
    const esc = (v: string | number) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button
      onClick={download}
      className="rounded-lg border border-[#e0e0e0] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[#f3f3f3]"
    >
      Export CSV
    </button>
  )
}
