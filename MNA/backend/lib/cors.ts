// CORS for the public endpoints the static storefront (a different origin on
// GitHub Pages) calls: catalog, payment create, payment status. These carry no
// cookies, so a wildcard origin is safe. The owner endpoints are NOT wrapped in
// CORS - they are same-origin on the backend and cookie-gated.
//
// To lock this down later, set ALLOWED_ORIGIN to the exact storefront origin
// (e.g. https://bengkelgearbox.my) and echo it instead of '*'.
import { NextResponse } from 'next/server'

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

// JSON response with CORS headers attached. Defined here (not in the route file)
// so routes can swap NextResponse.json for corsJson without risk.
export function corsJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...(init?.headers || {}), ...corsHeaders },
  })
}
