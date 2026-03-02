import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

// Base remote patterns — always allowed
const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
  // Vercel Blob storage (production media)
  { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
  // Local development uploads served by Payload
  { protocol: 'http', hostname: 'localhost' },
]

// Allow images served directly from the Vercel deployment URL.
// This covers media uploaded before Vercel Blob was fully configured.
if (process.env['VERCEL_PROJECT_PRODUCTION_URL']) {
  remotePatterns.push({ protocol: 'https', hostname: process.env['VERCEL_PROJECT_PRODUCTION_URL'] })
}
if (process.env['VERCEL_URL'] && process.env['VERCEL_URL'] !== process.env['VERCEL_PROJECT_PRODUCTION_URL']) {
  remotePatterns.push({ protocol: 'https', hostname: process.env['VERCEL_URL'] })
}

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 days — restaurant images rarely change
  },
  // Payload requires this to work with Next.js
  outputFileTracingIncludes: {
    '/api/**/*': ['./src/collections/**/*', './src/globals/**/*'],
  },
}

export default withPayload(nextConfig)
