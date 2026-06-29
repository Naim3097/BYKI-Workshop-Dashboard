'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginInner() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get('next') || '/dashboard'
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/owner/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (res.ok) {
      router.push(next)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Login failed.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-6">
        <h1 className="text-lg font-semibold text-ink">Owner access</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Enter the access code to open the portal and dashboard.
        </p>
        <div className="mt-4">
          <label className="label" htmlFor="code">
            Access code
          </label>
          <input
            id="code"
            type="password"
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Access code"
            autoFocus
          />
        </div>
        {error ? (
          <p className="mt-3 rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
        <button type="submit" disabled={submitting} className="btn-primary mt-4 w-full">
          {submitting ? 'Checking...' : 'Enter'}
        </button>
        <p className="mt-3 text-center text-xs text-ink-muted">
          Owner access only.
        </p>
      </form>
    </div>
  )
}

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
