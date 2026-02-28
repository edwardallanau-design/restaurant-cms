import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import {
  Events,
  GalleryImages,
  Media,
  MenuCategories,
  MenuItems,
  Users,
} from './collections'
import { HeroSection, SiteSettings } from './globals'
import { env } from './env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // ── Admin Panel ─────────────────────────────────────────────────────────────
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Restaurant CMS',
      favicon: '/favicon.ico',
    },
    // Redirect to admin on first load
    components: {},
  },

  // ── Collections & Globals ───────────────────────────────────────────────────
  collections: [Users, Media, MenuCategories, MenuItems, GalleryImages, Events],
  globals: [SiteSettings, HeroSection],

  // ── Editor ──────────────────────────────────────────────────────────────────
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures],
  }),

  // ── Database (Neon PostgreSQL) ───────────────────────────────────────────────
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
      // Neon's serverless driver handles connection pooling on its side.
      // Keep pool size small for Vercel serverless functions.
      max: 10,
    },
    // Auto-run migrations on startup in production (safe because Payload tracks migration state)
    prodMigrations: process.env['NODE_ENV'] === 'production',
  }),

  // ── File Storage ─────────────────────────────────────────────────────────────
  // In production: Vercel Blob. In development: local filesystem.
  plugins: [
    ...(process.env['BLOB_READ_WRITE_TOKEN']
      ? [
          vercelBlobStorage({
            enabled: true,
            collections: {
              media: true,
            },
            token: process.env['BLOB_READ_WRITE_TOKEN'] ?? '',
          }),
        ]
      : []),
  ],

  // ── Security ────────────────────────────────────────────────────────────────
  secret: env.PAYLOAD_SECRET,

  // ── CORS & CSRF ─────────────────────────────────────────────────────────────
  cors: [env.NEXT_PUBLIC_SERVER_URL, 'http://localhost:3000'].filter(Boolean),
  csrf: [env.NEXT_PUBLIC_SERVER_URL, 'http://localhost:3000'].filter(Boolean),

  // ── TypeScript ───────────────────────────────────────────────────────────────
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ── GraphQL ──────────────────────────────────────────────────────────────────
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },

  // ── Misc ────────────────────────────────────────────────────────────────────
  serverURL: env.NEXT_PUBLIC_SERVER_URL,
  routes: {
    admin: '/admin',
    api: '/api',
    graphQL: '/api/graphql',
    graphQLPlayground: '/api/graphql-playground',
  },
})
