import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { Events } from './collections/Events.ts'
import { GalleryImages } from './collections/GalleryImages.ts'
import { Media } from './collections/Media.ts'
import { MenuCategories } from './collections/MenuCategories.ts'
import { MenuItems } from './collections/MenuItems.ts'
import { Users } from './collections/Users.ts'
import { HeroSection } from './globals/HeroSection.ts'
import { PageContent } from './globals/PageContent.ts'
import { SiteSettings } from './globals/SiteSettings.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // ── Admin Panel ─────────────────────────────────────────────────────────────
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Restaurant CMS',
    },
    importMap: {
      baseDir: path.resolve(dirname, 'app/(payload)/admin'),
    },
  },

  // ── Collections & Globals ───────────────────────────────────────────────────
  collections: [Users, Media, MenuCategories, MenuItems, GalleryImages, Events],
  globals: [SiteSettings, HeroSection, PageContent],

  // ── Editor ──────────────────────────────────────────────────────────────────
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures],
  }),

  // ── Database (Neon PostgreSQL) ───────────────────────────────────────────────
  db: postgresAdapter({
    pool: {
      connectionString: process.env['DATABASE_URL']!,
      // Neon's serverless driver handles connection pooling on its side.
      // Keep pool size small for Vercel serverless functions.
      max: 10,
    },
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
  secret: process.env['PAYLOAD_SECRET']!,

  // ── CORS & CSRF ─────────────────────────────────────────────────────────────
  cors: [process.env['NEXT_PUBLIC_SERVER_URL'], 'http://localhost:3000'].filter(Boolean) as string[],
  csrf: [process.env['NEXT_PUBLIC_SERVER_URL'], 'http://localhost:3000'].filter(Boolean) as string[],

  // ── TypeScript ───────────────────────────────────────────────────────────────
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ── GraphQL ──────────────────────────────────────────────────────────────────
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },

  // ── Misc ────────────────────────────────────────────────────────────────────
  serverURL: process.env['NEXT_PUBLIC_SERVER_URL'] ?? 'http://localhost:3000',
  routes: {
    admin: '/admin',
    api: '/api',
    graphQL: '/api/graphql',
    graphQLPlayground: '/api/graphql-playground',
  },
})
