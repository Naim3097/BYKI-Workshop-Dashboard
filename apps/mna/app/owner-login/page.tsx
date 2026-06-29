'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getBrowserSupabase } from '@byki/core/auth/client'

function LoginInner() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get('next') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: err } = await getBrowserSupabase().auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message || 'Login failed.')
      setSubmitting(false)
      return
    }
    router.push(next)
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-6">
        <h1 className="text-lg font-semibold text-ink">Owner access</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Sign in to open the portal and dashboard.
        </p>
        <div className="mt-4">
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@workshop.com"
            autoFocus
          />
        </div>
        <div className="mt-3">
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </div>
        {error ? (
          <p className="mt-3 rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
        <button type="submit" disabled={submitting} className="btn-primary mt-4 w-full">
          {submitting ? 'Checking...' : 'Enter'}
        </button>
        <p className="mt-3 text-center text-xs text-ink-muted">Owner access only.</p>
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
