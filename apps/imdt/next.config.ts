import type { NextConfig } from 'next'

// SERVER app (not a static export): the booking/commerce/payment flow needs API
// routes to keep the LeanX secret server-side. The OBD diagnose half is fully
// client-side (Web Bluetooth).
const nextConfig: NextConfig = {
  // @byki/core ships TypeScript/TSX source; Next transpiles it for this app.
  transpilePackages: ['@byki/core'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
}

export default nextConfig
