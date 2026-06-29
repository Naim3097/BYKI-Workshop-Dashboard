'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { getBrowserSupabase } from '@byki/core/auth/client'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    setError(null)
    const { error: err } = await getBrowserSupabase().auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    router.push(search.get('next') || '/')
    router.refresh()
  }

  const field =
    'w-full rounded-xl border border-[#e0e0e0] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[#b4b4b4] focus:border-[var(--green-500)]'

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="byki-card w-full max-w-sm p-8">
        <Image src="/byki-logo-black.png" alt="BYKI" width={96} height={32} className="mb-8 h-8 w-auto" priority />
        <h1 className="text-xl font-bold text-[var(--ink)]">Master Admin</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Sign in to the BYKI dashboard.</p>

        <div className="mt-6 space-y-3">
          <input
            className={field}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <input
            className={field}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={loading || !email || !password}
            className="w-full rounded-xl bg-[var(--green-500)] px-4 py-3 text-sm font-bold text-white transition-[filter] hover:brightness-105 disabled:opacity-40"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </div>
    </main>
  )
}
