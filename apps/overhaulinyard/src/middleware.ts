import { createAuthMiddleware } from '@byki/core/auth/middleware'

// Gate the owner dashboard + admin APIs behind Supabase Auth.
export const middleware = createAuthMiddleware({
  protectedPrefixes: ['/dashboard', '/api/admin'],
  loginPath: '/owner-login',
})

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
}
