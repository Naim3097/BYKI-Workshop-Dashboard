'use client'

// Owner/staff login via Supabase Auth. On success the session cookie is set and
// the middleware lets them into /dashboard.

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getBrowserSupabase } from '@byki/core/auth/client'
import { Button, Card } from '@/components/ui'

export default function OwnerLoginPage() {
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

  const input =
    'w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:border-[var(--accent)]/50 outline-none'

  async function submit() {
    setLoading(true)
    setError(null)
    const { error: err } = await getBrowserSupabase().auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    router.push(search.get('next') || '/dashboard')
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <Card className="space-y-4">
        <h1 className="text-xl font-bold text-white">Log Masuk Pemilik</h1>
        <input className={input} type="email" placeholder="E-mel" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" placeholder="Kata laluan" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button className="w-full" disabled={loading || !email || !password} onClick={submit}>
          {loading ? 'Memproses…' : 'Log Masuk'}
        </Button>
      </Card>
    </div>
  )
}
