import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { Restaurants } from './collections/Restaurants.ts'
import { TenantSiteSettings } from './collections/TenantSiteSettings.ts'
import { TenantHeroSections } from './collections/TenantHeroSections.ts'
import { TenantPageContent } from './collections/TenantPageContent.ts'
import { Events } from './collections/Events.ts'
import { GalleryImages } from './collections/GalleryImages.ts'
import { Media } from './collections/Media.ts'
import { MenuCategories } from './collections/MenuCategories.ts'
import { MenuItems } from './collections/MenuItems.ts'
import { Modifiers } from './collections/Modifiers.ts'
import { ModifierOptions } from './collections/ModifierOptions.ts'
import { Orders } from './collections/Orders.ts'
import { Users } from './collections/Users.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Resolve the canonical server URL, falling back to Vercel's automatic env vars.
// VERCEL_PROJECT_PRODUCTION_URL = stable production hostname (no protocol)
// VERCEL_URL                    = current deployment hostname (no protocol)
const serverUrl =
  process.env['NEXT_PUBLIC_SERVER_URL'] ??
  (process.env['VERCEL_PROJECT_PRODUCTION_URL']
    ? `https://${process.env['VERCEL_PROJECT_PRODUCTION_URL']}`
    : process.env['VERCEL_URL']
      ? `https://${process.env['VERCEL_URL']}`
      : 'http://localhost:3000')

// Always include the Vercel system URLs unconditionally so that even if
// NEXT_PUBLIC_SERVER_URL is set to localhost (common during local dev), the
// actual production and preview origins are never accidentally excluded.
const allowedOrigins = [
  serverUrl,
  process.env['VERCEL_PROJECT_PRODUCTION_URL']
    ? `https://${process.env['VERCEL_PROJECT_PRODUCTION_URL']}`
    : null,
  process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : null,
  'http://localhost:3000',
].filter((v): v is string => Boolean(v))

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
  collections: [
    Restaurants,
    TenantSiteSettings,
    TenantHeroSections,
    TenantPageContent,
    Users,
    Media,
    MenuCategories,
    MenuItems,
    Modifiers,
    ModifierOptions,
    Orders,
    GalleryImages,
    Events,
  ],
  globals: [],

  // ── Editor ──────────────────────────────────────────────────────────────────
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures],
  }),

  // ── Database (Neon PostgreSQL) ───────────────────────────────────────────────
  db: postgresAdapter({
    pool: {
      // Normalize sslmode=require → verify-full to silence the pg-connection-string
      // deprecation warning. Both modes behave identically against Neon (CA-signed certs).
      connectionString: (process.env['DATABASE_URL'] ?? '').replace(
        'sslmode=require',
        'sslmode=verify-full',
      ),
      // Neon's serverless driver handles connection pooling on its side.
      // Keep pool size small for Vercel serverless functions.
      max: 10,
    },
  }),

  // ── File Storage ─────────────────────────────────────────────────────────────
  // In production: Vercel Blob. In development: local filesystem.
  plugins: [
    multiTenantPlugin({
      tenantsSlug: 'restaurants',
      tenantField: {
        name: 'restaurant',
      },
      collections: {
        'menu-categories': {},
        'menu-items': {},
        modifiers: {},
        'modifier-options': {},
        orders: {},
        'gallery-images': {},
        events: {},
        'tenant-site-settings': { isGlobal: true },
        'tenant-hero-sections': { isGlobal: true },
        'tenant-page-content': { isGlobal: true },
      },
      tenantsArrayField: {
        includeDefaultField: true,
      },
      userHasAccessToAllTenants: (user) => {
        const u = user as { tenants?: unknown[] } | null
        return !u?.tenants || u.tenants.length === 0
      },
    }),
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
  cors: allowedOrigins,
  csrf: allowedOrigins,

  // ── TypeScript ───────────────────────────────────────────────────────────────
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ── GraphQL ──────────────────────────────────────────────────────────────────
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },

  // ── Misc ────────────────────────────────────────────────────────────────────
  serverURL: serverUrl,
  routes: {
    admin: '/admin',
    api: '/api',
    graphQL: '/api/graphql',
    graphQLPlayground: '/api/graphql-playground',
  },
})
