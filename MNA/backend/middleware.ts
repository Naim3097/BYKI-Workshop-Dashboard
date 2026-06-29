import { NextRequest, NextResponse } from 'next/server'

// Simple gate for the owner-only areas (portal, dashboard, and their data APIs).
// This is a placeholder for the mockup; it will be replaced by Supabase Auth.
// The session cookie is set by /api/owner/login after the access code matches.

const PROTECTED = [
  '/portal',
  '/dashboard',
  '/api/dashboard',
  '/api/inventory',
  '/api/products/manage',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
  if (!isProtected) return NextResponse.next()

  const session = request.cookies.get('owner_session')?.value
  if (session === 'ok') return NextResponse.next()

  // API calls get a 401; page navigations get redirected to the login screen.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const loginUrl = new URL('/owner-login', request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/dashboard/:path*',
    '/api/dashboard/:path*',
    '/api/inventory/:path*',
    '/api/products/manage/:path*',
  ],
}
