import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@byki/core'],
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
