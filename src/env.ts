import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  /**
   * Server-side environment variables — never exposed to the browser.
   */
  server: {
    /**
     * Neon PostgreSQL connection string.
     * Enable connection pooling in the Neon console for serverless.
     * Format: postgresql://user:pass@ep-xxx.neon.tech/restaurant?sslmode=require
     */
    DATABASE_URL: z.string().min(1),

    /**
     * Payload CMS secret — used to sign JWTs and encrypt sensitive data.
     * Generate with: openssl rand -base64 64
     */
    PAYLOAD_SECRET: z.string().min(32),

    /**
     * Resend API key for transactional emails (contact form).
     */
    RESEND_API_KEY: z.string().min(1),

    /**
     * The verified sender email address configured in Resend.
     */
    RESEND_FROM_EMAIL: z.string().email(),

    /**
     * The restaurant owner's email address to receive contact form submissions.
     */
    RESEND_TO_EMAIL: z.string().email(),

    /**
     * Secret token to authorize on-demand ISR revalidation webhook calls.
     * Generate with: openssl rand -hex 32
     */
    REVALIDATION_SECRET: z.string().min(16),

    /**
     * Node environment.
     */
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },

  /**
   * Client-side environment variables — exposed to the browser via NEXT_PUBLIC_ prefix.
   */
  client: {
    /**
     * The canonical URL of the deployed site (used for OG images and Payload admin CORS).
     * Optional — on Vercel the URL is auto-detected from VERCEL_PROJECT_PRODUCTION_URL.
     * Set this explicitly if you use a custom domain or non-Vercel hosting.
     */
    NEXT_PUBLIC_SERVER_URL: z.string().url().optional(),
  },

  /**
   * Destructure and forward all env vars. Next.js requires explicit references
   * to process.env keys — no dynamic access.
   */
  runtimeEnv: {
    DATABASE_URL: process.env['DATABASE_URL'],
    PAYLOAD_SECRET: process.env['PAYLOAD_SECRET'],
    RESEND_API_KEY: process.env['RESEND_API_KEY'],
    RESEND_FROM_EMAIL: process.env['RESEND_FROM_EMAIL'],
    RESEND_TO_EMAIL: process.env['RESEND_TO_EMAIL'],
    REVALIDATION_SECRET: process.env['REVALIDATION_SECRET'],
    NODE_ENV: process.env['NODE_ENV'],
    NEXT_PUBLIC_SERVER_URL: process.env['NEXT_PUBLIC_SERVER_URL'],
  },

  /**
   * Throw on missing env vars during build so deployment fails fast.
   */
  emptyStringAsUndefined: true,
})
