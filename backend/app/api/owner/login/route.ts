import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Verifies the owner access code and sets a session cookie. Placeholder auth for
// the mockup; swap for Supabase Auth (email + password / magic link) later.
export async function POST(request: NextRequest) {
  const { code } = (await request.json()) as { code?: string }
  const expected = process.env.OWNER_ACCESS_CODE || 'mna-owner'

  if (!code || code !== expected) {
    return NextResponse.json({ error: 'Incorrect access code.' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set('owner_session', 'ok', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('owner_session', '', { path: '/', maxAge: 0 })
  return res
}
