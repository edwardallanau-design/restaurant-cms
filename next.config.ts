import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  experimental: {
    useCache: true,
    reactCompiler: false,
  },
  images: {
    remotePatterns: [
      // Vercel Blob storage
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      // Local development uploads served by Payload
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Payload requires this to work with Next.js
  outputFileTracingIncludes: {
    '/api/**/*': ['./src/collections/**/*', './src/globals/**/*'],
  },
}

export default withPayload(nextConfig)
