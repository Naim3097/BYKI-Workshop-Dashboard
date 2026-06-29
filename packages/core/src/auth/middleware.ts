// Middleware factory: refreshes the Supabase session cookie and gates a set of
// protected path prefixes (e.g. /dashboard + admin APIs). Each app wires this in
// its own middleware.ts. Replaces MNA's cookie gate + One X's hashed-password
// cookie with real Supabase Auth.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export interface MiddlewareOptions {
  /** Path prefixes that require a signed-in user. */
  protectedPrefixes?: string[]
  /** Where unauthenticated page navigations are redirected. */
  loginPath?: string
}

export function createAuthMiddleware(options: MiddlewareOptions = {}) {
  const protectedPrefixes = options.protectedPrefixes ?? ['/dashboard', '/api/admin']
  const loginPath = options.loginPath ?? '/owner-login'

  return async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request })

    type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (toSet: CookieToSet[]) => {
            toSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            toSet.forEach(({ name, value, options: o }) =>
              response.cookies.set(name, value, o as Record<string, unknown>),
            )
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const isProtected = protectedPrefixes.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )

    if (isProtected && !user) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const url = request.nextUrl.clone()
      url.pathname = loginPath
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    return response
  }
}
