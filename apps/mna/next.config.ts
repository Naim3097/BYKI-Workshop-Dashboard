import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @byki/core ships TypeScript source; Next transpiles it for this app.
  transpilePackages: ['@byki/core'],
}

export default nextConfig
