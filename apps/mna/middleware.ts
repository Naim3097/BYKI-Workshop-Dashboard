import { createAuthMiddleware } from '@byki/core/auth/middleware'

// Owner area gated by Supabase Auth (replaces the legacy access-code cookie).
export const middleware = createAuthMiddleware({
  protectedPrefixes: ['/portal', '/dashboard', '/api/dashboard', '/api/inventory', '/api/products/manage'],
  loginPath: '/owner-login',
})

export const config = {
  matcher: [
    '/portal/:path*',
    '/dashboard/:path*',
    '/api/dashboard/:path*',
    '/api/inventory/:path*',
    '/api/products/manage/:path*',
  ],
}
