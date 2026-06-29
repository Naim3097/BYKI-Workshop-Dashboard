import { createAuthMiddleware } from '@byki/core/auth/middleware'

// The entire BYKI app is admin-only. Everything except /login requires a
// session; the (dash) layout additionally enforces the byki_admin role.
export const middleware = createAuthMiddleware({
  protectedPrefixes: ['/', '/workshops', '/customers', '/diagnose', '/commerce', '/bookings', '/billing'],
  loginPath: '/login',
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|byki-logo-black.png|byki-logo-white.png).*)'],
}
