# S0 — Tenant Foundation + Slug Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce multi-tenancy to the existing single-tenant Payload CMS site — Restaurant collection, per-tenant settings, tenant-scoped choke-point, and `/r/[slug]` routing — so that two seeded tenants (pilot + decoy) are provably isolated.

**Architecture:** S0 splits into two committed halves. S0a is pure Payload schema work — install the plugin, add the `Restaurant` collection, convert the three singleton globals to per-tenant collections, add the `restaurant` FK to existing tenant-owned collections, generate types, run a manually-extended migration, and seed. S0b is the application layer — the `src/server/db/` choke-point with Vitest unit tests proving isolation, updating the six marketing pages to use the choke-point instead of `findGlobal`, and adding the `/r/[slug]` stub route. Every query on a tenant-owned collection passes through the choke-point and carries `where: { restaurant: { equals: restaurantId } }`.

**Tech Stack:** Next.js 15 App Router · Payload CMS 3.78 · `@payloadcms/plugin-multi-tenant` · PostgreSQL / Neon via `@payloadcms/db-postgres` · Vitest · TypeScript · `@t3-oss/env-nextjs`

## Global Constraints

- Never hard-delete: soft-delete only (`active: false`) per INV-4.
- Tenant identity comes from the URL slug or session — never from the request body (INV-7, ADR-004).
- Every query on a tenant-owned collection must pass `where: { restaurant: { equals: restaurantId } }` through the choke-point. No raw queries in route handlers or page components.
- The `restaurant` field name on all tenant-owned collections is `restaurant` (plugin `tenantField.name: 'restaurant'`), not the plugin default `tenant`.
- No `@/` alias in Payload collection or config files — use relative imports. The choke-point files under `src/server/db/` are Next.js app files, so they may use `@/`.
- `payload-types.ts` is gitignored — regenerate with `npm run generate:types` after every schema change before writing code that imports from it.
- Import order in all new files: external packages first, then `@/` aliases, then relative imports.
- Commit at every green state. Each task ends with a commit.

---

## File Map

**Created:**
| File | Purpose |
|---|---|
| `src/collections/Restaurants.ts` | Restaurant (tenant root) collection |
| `src/collections/TenantSiteSettings.ts` | Replaces `SiteSettings` global — per-tenant |
| `src/collections/TenantHeroSections.ts` | Replaces `HeroSection` global — per-tenant |
| `src/collections/TenantPageContent.ts` | Replaces `PageContent` global — per-tenant |
| `src/scripts/seed.ts` | Seeds pilot + decoy tenants and their settings |
| `src/server/db/index.ts` | Re-exports all choke-point functions (sole import point) |
| `src/server/db/restaurants.ts` | `resolveSlug()` — slug → Restaurant or null |
| `src/server/db/settings.ts` | `getSettingsForTenant`, `getHeroForTenant`, `getPageContentForTenant` |
| `src/server/db/__tests__/restaurants.test.ts` | Unit tests for `resolveSlug` |
| `src/server/db/__tests__/settings.test.ts` | Unit tests proving cross-tenant isolation |
| `src/app/(frontend)/r/[slug]/page.tsx` | Diner route stub — resolves slug, 404 on unknown |
| `vitest.config.ts` | Vitest config with `@/` and `@payload-config` aliases |

**Modified:**
| File | Change |
|---|---|
| `src/collections/index.ts` | Add exports for four new collections |
| `src/collections/MenuCategories.ts` | Remove global `unique: true` from slug; add composite index |
| `src/collections/MenuItems.ts` | Same slug uniqueness fix |
| `src/globals/index.ts` | Remove all three global exports |
| `src/payload.config.ts` | Add Restaurant + 3 new collections; add plugin; remove globals |
| `src/env.ts` | Add `PILOT_RESTAURANT_SLUG` server var |
| `.env.example` | Add `PILOT_RESTAURANT_SLUG=pilot` |
| `package.json` | Add `seed` and `test` scripts; add `tsx` devDependency |
| `src/app/(frontend)/page.tsx` | Replace all three `findGlobal` calls with choke-point |
| `src/app/(frontend)/menu/page.tsx` | Replace `findGlobal` with choke-point |
| `src/app/(frontend)/gallery/page.tsx` | Replace `findGlobal` with choke-point |
| `src/app/(frontend)/about/page.tsx` | Replace `findGlobal` with choke-point |
| `src/app/(frontend)/events/page.tsx` | Replace `findGlobal` with choke-point |
| `src/app/(frontend)/contact/page.tsx` | Replace both `findGlobal` calls with choke-point |
| `docs/BUILD_STATUS.md` | Mark S0 in progress → done |

---

## ── S0a: Payload Schema ──────────────────────────────────────────────────────

---

### Task 1: Add Restaurant collection

**Files:**
- Create: `src/collections/Restaurants.ts`
- Modify: `src/collections/index.ts`
- Modify: `src/payload.config.ts`

**Interfaces:**
- Produces: `restaurants` Payload collection with fields `name`, `slug` (unique), `active`

- [ ] **Step 1: Create `src/collections/Restaurants.ts`**

```typescript
import type { CollectionConfig } from 'payload'

export const Restaurants: CollectionConfig = {
  slug: 'restaurants',
  admin: {
    useAsTitle: 'name',
    group: 'Platform',
    defaultColumns: ['name', 'slug', 'active', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'URL-safe identifier used in /r/<slug> diner routes. Lowercase, hyphens only.',
      },
      hooks: {
        beforeValidate: [
          ({ value }) =>
            typeof value === 'string' ? value.toLowerCase().trim() : value,
        ],
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Inactive restaurants resolve to 404 on diner routes.',
      },
    },
  ],
}
```

- [ ] **Step 2: Add export to `src/collections/index.ts`**

Add one line at the top of the file:

```typescript
export { Restaurants } from './Restaurants'
```

Full file after change:

```typescript
export { Restaurants } from './Restaurants'
export { Events } from './Events'
export { GalleryImages } from './GalleryImages'
export { Media } from './Media'
export { MenuCategories } from './MenuCategories'
export { MenuItems } from './MenuItems'
export { Users } from './Users'
```

- [ ] **Step 3: Add `Restaurants` to `payload.config.ts` collections array**

In `src/payload.config.ts`, update the imports block and the `collections` array:

```typescript
// Add this import (use the relative .ts extension — Payload CLI requirement)
import { Restaurants } from './collections/Restaurants.ts'
```

Change the collections line from:
```typescript
collections: [Users, Media, MenuCategories, MenuItems, GalleryImages, Events],
```
To:
```typescript
collections: [Restaurants, Users, Media, MenuCategories, MenuItems, GalleryImages, Events],
```

- [ ] **Step 4: Verify the app compiles**

```bash
npm run dev
```

Expected: dev server starts without TypeScript errors. Visit `http://localhost:3000/admin` and confirm a "Restaurants" collection appears under a "Platform" group.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Restaurants.ts src/collections/index.ts src/payload.config.ts
git commit -m "feat(s0a): add Restaurant (tenant root) collection"
```

---

### Task 2: Create three per-tenant settings collections

Replace the three Payload globals with collections that the multi-tenant plugin will make per-tenant. Do **not** remove the globals yet — that happens in Task 3 when the plugin is wired in.

**Files:**
- Create: `src/collections/TenantSiteSettings.ts`
- Create: `src/collections/TenantHeroSections.ts`
- Create: `src/collections/TenantPageContent.ts`
- Modify: `src/collections/index.ts`

**Interfaces:**
- Produces: three new collection files with all the same fields as the old globals; no `restaurant` field (the plugin adds it automatically)

- [ ] **Step 1: Create `src/collections/TenantSiteSettings.ts`**

Copy all fields from the existing `SiteSettings` global verbatim. Change `GlobalConfig` → `CollectionConfig`, update the slug and access shape:

```typescript
import type { CollectionConfig } from 'payload'
import { safeRevalidateTag } from '../lib/revalidate.ts'
import { CACHE_TAGS } from '../lib/cache.ts'

export const TenantSiteSettings: CollectionConfig = {
  slug: 'tenant-site-settings',
  admin: {
    useAsTitle: 'restaurantName',
    group: 'Settings',
    description: 'Restaurant contact information, hours, and global SEO defaults.',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'restaurantName',
          type: 'text',
          label: 'Restaurant Name',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'tagline',
          type: 'text',
          label: 'Tagline',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
    },
    {
      name: 'navigation',
      type: 'array',
      label: 'Navigation Links',
      admin: {
        description: 'Links shown in the header and footer.',
      },
      defaultValue: [
        { label: 'Home', href: '/' },
        { label: 'Menu', href: '/menu' },
        { label: 'Gallery', href: '/gallery' },
        { label: 'Events', href: '/events' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', label: 'Label', required: true, admin: { width: '50%' } },
            { name: 'href', type: 'text', label: 'Path or URL', required: true, admin: { width: '50%', placeholder: '/menu or https://...' } },
          ],
        },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Contact Information',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'phone', type: 'text', label: 'Phone Number', admin: { width: '50%' } },
            { name: 'email', type: 'email', label: 'Public Email', admin: { width: '50%' } },
          ],
        },
        {
          name: 'address',
          type: 'group',
          label: 'Address',
          fields: [
            { name: 'street', type: 'text', label: 'Street' },
            {
              type: 'row',
              fields: [
                { name: 'city', type: 'text', label: 'City', admin: { width: '40%' } },
                { name: 'state', type: 'text', label: 'State', admin: { width: '20%' } },
                { name: 'zip', type: 'text', label: 'ZIP Code', admin: { width: '20%' } },
                { name: 'country', type: 'text', label: 'Country', defaultValue: 'USA', admin: { width: '20%' } },
              ],
            },
          ],
        },
        { name: 'googleMapsEmbedUrl', type: 'text', label: 'Google Maps Embed URL' },
      ],
    },
    {
      name: 'hours',
      type: 'array',
      label: 'Opening Hours',
      admin: { description: 'Add one row per day or day range.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'day', type: 'text', label: 'Day(s)', required: true, admin: { width: '30%', placeholder: 'Monday–Friday' } },
            { name: 'openTime', type: 'text', label: 'Opens', admin: { width: '25%', placeholder: '11:00 AM' } },
            { name: 'closeTime', type: 'text', label: 'Closes', admin: { width: '25%', placeholder: '10:00 PM' } },
            { name: 'closed', type: 'checkbox', label: 'Closed', defaultValue: false, admin: { width: '20%' } },
          ],
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'group',
      label: 'Social Media Links',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'instagram', type: 'text', label: 'Instagram URL', admin: { width: '33%' } },
            { name: 'facebook', type: 'text', label: 'Facebook URL', admin: { width: '33%' } },
            { name: 'tiktok', type: 'text', label: 'TikTok URL', admin: { width: '33%' } },
          ],
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'Default SEO',
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Default Meta Title' },
        { name: 'metaDescription', type: 'textarea', label: 'Default Meta Description' },
        { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'Default OG Image' },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        await safeRevalidateTag(CACHE_TAGS.settings)
      },
    ],
  },
}
```

- [ ] **Step 2: Create `src/collections/TenantHeroSections.ts`**

```typescript
import type { CollectionConfig } from 'payload'
import { safeRevalidateTag } from '../lib/revalidate.ts'
import { CACHE_TAGS } from '../lib/cache.ts'

export const TenantHeroSections: CollectionConfig = {
  slug: 'tenant-hero-sections',
  admin: {
    useAsTitle: 'heading',
    group: 'Settings',
    description: 'Content for the full-screen hero banner on the home page.',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Heading',
      required: true,
      admin: { placeholder: 'e.g. Taste the Difference' },
    },
    {
      name: 'subheading',
      type: 'textarea',
      label: 'Subheading',
      admin: { placeholder: 'e.g. Fresh ingredients, inspired by tradition.', rows: 2 },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Background Image',
      required: true,
      admin: { description: 'Full-width hero image. Recommended: at least 1920 × 1080 px.' },
    },
    {
      name: 'backgroundVideo',
      type: 'text',
      label: 'Background Video URL',
      admin: { description: 'Optional video URL (MP4). If set, plays muted/looped instead of the image.' },
    },
    {
      name: 'primaryCta',
      type: 'group',
      label: 'Primary CTA Button',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'text', type: 'text', label: 'Button Text', admin: { width: '50%', placeholder: 'View Menu' } },
            { name: 'link', type: 'text', label: 'Button Link', admin: { width: '50%', placeholder: '/menu' } },
          ],
        },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      label: 'Secondary CTA Button (Optional)',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'text', type: 'text', label: 'Button Text', admin: { width: '50%', placeholder: 'Make a Reservation' } },
            { name: 'link', type: 'text', label: 'Button Link', admin: { width: '50%', placeholder: '/contact' } },
          ],
        },
      ],
    },
    {
      name: 'overlay',
      type: 'group',
      label: 'Overlay Options',
      fields: [
        { name: 'opacity', type: 'number', label: 'Overlay Opacity (0–100)', defaultValue: 50, min: 0, max: 100 },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        await safeRevalidateTag(CACHE_TAGS.hero)
      },
    ],
  },
}
```

- [ ] **Step 3: Create `src/collections/TenantPageContent.ts`**

```typescript
import type { CollectionConfig } from 'payload'
import { safeRevalidateTag } from '../lib/revalidate.ts'
import { CACHE_TAGS } from '../lib/cache.ts'

export const TenantPageContent: CollectionConfig = {
  slug: 'tenant-page-content',
  admin: {
    group: 'Settings',
    description: 'Editable static text for page headers and sections.',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'home',
      type: 'group',
      label: 'Home Page',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Featured Section Eyebrow', defaultValue: 'Our Selection', admin: { width: '50%' } },
            { name: 'headerTitle', type: 'text', label: 'Featured Section Heading', defaultValue: 'Featured Dishes', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'menu',
      type: 'group',
      label: 'Menu Page',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Eyebrow Text', defaultValue: 'What We Offer', admin: { width: '50%' } },
            { name: 'headerTitle', type: 'text', label: 'Page Title', defaultValue: 'Our Menu', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'gallery',
      type: 'group',
      label: 'Gallery Page',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Eyebrow Text', defaultValue: 'A Visual Story', admin: { width: '50%' } },
            { name: 'headerTitle', type: 'text', label: 'Page Title', defaultValue: 'Gallery', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'events',
      type: 'group',
      label: 'Events Page',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Eyebrow Text', defaultValue: "What's Coming Up", admin: { width: '50%' } },
            { name: 'headerTitle', type: 'text', label: 'Page Title', defaultValue: 'Events & Specials', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Contact Page',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Eyebrow Text', defaultValue: 'Find Us', admin: { width: '50%' } },
            { name: 'headerTitle', type: 'text', label: 'Page Title', defaultValue: 'Contact & Location', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'about',
      type: 'group',
      label: 'About Page',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'eyebrow', type: 'text', label: 'Eyebrow Text', defaultValue: 'Who We Are', admin: { width: '50%' } },
            { name: 'headerTitle', type: 'text', label: 'Page Title', defaultValue: 'About Us', admin: { width: '50%' } },
          ],
        },
        { name: 'tagline', type: 'text', label: 'Tagline' },
        { name: 'story', type: 'richText', label: 'Story / Introduction' },
        {
          name: 'storyFormatting',
          type: 'group',
          label: 'Story Section Formatting',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'background', type: 'select', label: 'Background', defaultValue: 'white', admin: { width: '33%' }, options: [{ label: 'White', value: 'white' }, { label: 'Off-white (Surface)', value: 'surface' }, { label: 'Primary Light', value: 'primary-light' }] },
                { name: 'textAlign', type: 'select', label: 'Text Alignment', defaultValue: 'center', admin: { width: '33%' }, options: [{ label: 'Center', value: 'center' }, { label: 'Left', value: 'left' }] },
                { name: 'containerWidth', type: 'select', label: 'Container Width', defaultValue: 'narrow', admin: { width: '33%' }, options: [{ label: 'Narrow', value: 'narrow' }, { label: 'Default', value: 'default' }, { label: 'Wide', value: 'wide' }] },
              ],
            },
          ],
        },
        { name: 'valuesHeading', type: 'text', label: 'Values Section Heading', defaultValue: 'Our Values' },
        {
          name: 'values',
          type: 'array',
          label: 'Values Cards',
          defaultValue: [
            { icon: '🌿', title: 'Fresh & Seasonal', description: 'We source the finest local and seasonal ingredients.' },
            { icon: '👨‍🍳', title: 'Crafted with Care', description: 'Every plate is prepared with time-honoured techniques.' },
            { icon: '🤝', title: 'Warm Hospitality', description: 'From the moment you walk in, we treat every guest like family.' },
          ],
          fields: [
            { type: 'row', fields: [{ name: 'icon', type: 'text', label: 'Icon (emoji)', admin: { width: '20%' } }, { name: 'title', type: 'text', label: 'Title', required: true, admin: { width: '80%' } }] },
            { name: 'description', type: 'textarea', label: 'Description', required: true },
          ],
        },
        { name: 'ctaHeading', type: 'text', label: 'CTA Heading', defaultValue: 'Come Visit Us' },
        { name: 'ctaSubtext', type: 'text', label: 'CTA Subtext', defaultValue: "We'd love to welcome you." },
        { type: 'row', fields: [{ name: 'ctaPrimaryText', type: 'text', label: 'Primary Button Text', defaultValue: 'View Our Menu', admin: { width: '50%' } }, { name: 'ctaSecondaryText', type: 'text', label: 'Secondary Button Text', defaultValue: 'Contact Us', admin: { width: '50%' } }] },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        await safeRevalidateTag(CACHE_TAGS.content)
      },
    ],
  },
}
```

- [ ] **Step 4: Update `src/collections/index.ts`**

```typescript
export { Restaurants } from './Restaurants'
export { TenantSiteSettings } from './TenantSiteSettings'
export { TenantHeroSections } from './TenantHeroSections'
export { TenantPageContent } from './TenantPageContent'
export { Events } from './Events'
export { GalleryImages } from './GalleryImages'
export { Media } from './Media'
export { MenuCategories } from './MenuCategories'
export { MenuItems } from './MenuItems'
export { Users } from './Users'
```

- [ ] **Step 5: Add new collections to `src/payload.config.ts`**

Add imports (relative `.ts` extension required):
```typescript
import { TenantSiteSettings } from './collections/TenantSiteSettings.ts'
import { TenantHeroSections } from './collections/TenantHeroSections.ts'
import { TenantPageContent } from './collections/TenantPageContent.ts'
```

Update the `collections` array (do NOT remove globals yet):
```typescript
collections: [
  Restaurants,
  TenantSiteSettings,
  TenantHeroSections,
  TenantPageContent,
  Users,
  Media,
  MenuCategories,
  MenuItems,
  GalleryImages,
  Events,
],
```

- [ ] **Step 6: Verify the app compiles**

```bash
npm run dev
```

Expected: dev server starts. Admin shows "Tenant Site Settings", "Tenant Hero Sections", "Tenant Page Content" collections in the Settings group alongside the old globals. No errors.

- [ ] **Step 7: Commit**

```bash
git add src/collections/TenantSiteSettings.ts src/collections/TenantHeroSections.ts src/collections/TenantPageContent.ts src/collections/index.ts src/payload.config.ts
git commit -m "feat(s0a): add per-tenant settings collections (replacing globals)"
```

---

### Task 3: Wire multi-tenant plugin, remove globals, fix slug uniqueness

This is the core schema wiring task. After this task the globals are gone and the plugin enforces tenant scoping in the Payload admin.

**Files:**
- Modify: `src/payload.config.ts`
- Modify: `src/globals/index.ts`
- Modify: `src/collections/MenuCategories.ts`
- Modify: `src/collections/MenuItems.ts`

**Interfaces:**
- Produces: multi-tenant plugin active with `tenantsSlug: 'restaurants'`, `tenantField.name: 'restaurant'`; old globals removed; slug uniqueness per-tenant on MenuCategories and MenuItems

- [ ] **Step 1: Install `@payloadcms/plugin-multi-tenant`**

```bash
npm install @payloadcms/plugin-multi-tenant
```

Verify it appears in `package.json` dependencies at a `^3.x.x` version.

- [ ] **Step 2: Update `src/payload.config.ts` — add plugin and remove globals**

Replace the entire file with the updated version. Key changes: add plugin import, add plugin to `plugins` array, remove the three globals from `globals: [...]`, remove the old global imports:

```typescript
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
import { Users } from './collections/Users.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverUrl =
  process.env['NEXT_PUBLIC_SERVER_URL'] ??
  (process.env['VERCEL_PROJECT_PRODUCTION_URL']
    ? `https://${process.env['VERCEL_PROJECT_PRODUCTION_URL']}`
    : process.env['VERCEL_URL']
      ? `https://${process.env['VERCEL_URL']}`
      : 'http://localhost:3000')

const allowedOrigins = [
  serverUrl,
  process.env['VERCEL_PROJECT_PRODUCTION_URL']
    ? `https://${process.env['VERCEL_PROJECT_PRODUCTION_URL']}`
    : null,
  process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : null,
  'http://localhost:3000',
].filter((v): v is string => Boolean(v))

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: '— Restaurant CMS' },
    importMap: {
      baseDir: path.resolve(dirname, 'app/(payload)/admin'),
    },
  },

  collections: [
    Restaurants,
    TenantSiteSettings,
    TenantHeroSections,
    TenantPageContent,
    Users,
    Media,
    MenuCategories,
    MenuItems,
    GalleryImages,
    Events,
  ],

  globals: [],

  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures],
  }),

  db: postgresAdapter({
    pool: {
      connectionString: (process.env['DATABASE_URL'] ?? '').replace(
        'sslmode=require',
        'sslmode=verify-full',
      ),
      max: 10,
    },
  }),

  plugins: [
    multiTenantPlugin({
      tenantsSlug: 'restaurants',
      tenantField: {
        name: 'restaurant',
      },
      collections: {
        'menu-categories': {},
        'menu-items': {},
        'gallery-images': {},
        'events': {},
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
            collections: { media: true },
            token: process.env['BLOB_READ_WRITE_TOKEN'] ?? '',
          }),
        ]
      : []),
  ],

  secret: process.env['PAYLOAD_SECRET']!,
  cors: allowedOrigins,
  csrf: allowedOrigins,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },

  serverURL: serverUrl,
  routes: {
    admin: '/admin',
    api: '/api',
    graphQL: '/api/graphql',
    graphQLPlayground: '/api/graphql-playground',
  },
})
```

- [ ] **Step 3: Empty `src/globals/index.ts`**

Replace the entire file with an empty export so nothing imports the old globals:

```typescript
// Globals converted to per-tenant collections in S0. See src/collections/Tenant*.ts
export {}
```

- [ ] **Step 4: Fix slug uniqueness in `src/collections/MenuCategories.ts`**

Two changes: remove `unique: true` from the slug field, add `indexes` at collection level.

In `MenuCategories.ts`, find the slug field and remove `unique: true`:

```typescript
{
  name: 'slug',
  type: 'text',
  label: 'Slug',
  // unique: true  <-- REMOVED
  admin: {
    description: 'URL-safe identifier. Auto-generated from name if left blank.',
    position: 'sidebar',
  },
  hooks: { ... }, // unchanged
},
```

Add `indexes` property to the collection config object (at the same level as `slug`, `admin`, `fields`):

```typescript
export const MenuCategories: CollectionConfig = {
  slug: 'menu-categories',
  admin: { ... },
  access: { ... },
  fields: [ ... ],
  indexes: [
    {
      fields: ['restaurant', 'slug'],
      unique: true,
    },
  ],
  hooks: { ... },
}
```

- [ ] **Step 5: Fix slug uniqueness in `src/collections/MenuItems.ts`**

Apply the same two changes:

Remove `unique: true` from the slug field definition in `MenuItems.ts`.

Add `indexes` to the collection config:

```typescript
export const MenuItems: CollectionConfig = {
  slug: 'menu-items',
  admin: { ... },
  access: { ... },
  fields: [ ... ],
  indexes: [
    {
      fields: ['restaurant', 'slug'],
      unique: true,
    },
  ],
  hooks: { ... },
}
```

- [ ] **Step 6: Regenerate Payload types**

```bash
npm run generate:types
```

Expected: `src/payload-types.ts` regenerates. It should now include types for `Restaurant`, `TenantSiteSetting`, `TenantHeroSection`, `TenantPageContent` and no longer have global types for `SiteSetting`, `HeroSection`, `PageContent`.

If the command fails: the app pages that still call `findGlobal()` will cause TypeScript errors. This is expected — they are fixed in S0b Task 8. For now, suppress the type errors by checking that the collection types exist, not the global types.

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: dev server starts. The admin shows the tenant selector at the top. The three settings collections (`Tenant Site Settings`, `Tenant Hero Sections`, `Tenant Page Content`) behave like globals — no list view, one document per selected tenant. `Menu Categories` and `Menu Items` show only rows for the selected tenant.

Note: the marketing pages will throw runtime errors if visited because `findGlobal()` calls are still in them. This is intentional and will be fixed in S0b Task 8.

- [ ] **Step 8: Commit**

```bash
git add src/payload.config.ts src/globals/index.ts src/collections/MenuCategories.ts src/collections/MenuItems.ts package-lock.json package.json
git commit -m "feat(s0a): wire multi-tenant plugin, remove singleton globals, fix per-tenant slug uniqueness"
```

---

### Task 4: Create and run migration, then seed

**Files:**
- Create: `src/scripts/seed.ts`
- Modify: `package.json`
- Create: generated migration file (committed)

**Interfaces:**
- Produces: database schema with `restaurants` table and `restaurant` FK on all tenant-owned collections; pilot + decoy restaurants; settings documents for each

- [ ] **Step 1: Generate the migration file**

```bash
npm run migrate:create
```

This creates a new file in `migrations/` (e.g., `migrations/20260630_120000.ts`). Do not run the migration yet.

- [ ] **Step 2: Open the generated migration and locate the `up` function**

The migration file is TypeScript. It will contain SQL that:
- Creates the `restaurants` table
- Adds a nullable `restaurant` (or `restaurant_id`) column to `menu_categories`, `menu_items`, `gallery_images`, `events`, `tenant_site_settings`, `tenant_hero_sections`, `tenant_page_content`

Find the exact column names Payload chose for the `restaurant` relationship field by reading the generated SQL carefully. The column is likely named `restaurant_id`. Note the exact name — you will use it in the backfill SQL below.

- [ ] **Step 3: Extend the migration `up` function with pilot INSERT + backfill + NOT NULL**

At the **end** of the `up` function body, after all the Payload-generated SQL, add:

```typescript
// Seed pilot restaurant and backfill existing rows
await db.execute(sql`
  INSERT INTO restaurants (id, name, slug, active, created_at, updated_at)
  VALUES (gen_random_uuid(), 'Pilot Café', 'pilot', true, NOW(), NOW());

  UPDATE menu_categories
  SET restaurant_id = (SELECT id FROM restaurants WHERE slug = 'pilot' LIMIT 1)
  WHERE restaurant_id IS NULL;

  UPDATE menu_items
  SET restaurant_id = (SELECT id FROM restaurants WHERE slug = 'pilot' LIMIT 1)
  WHERE restaurant_id IS NULL;

  UPDATE gallery_images
  SET restaurant_id = (SELECT id FROM restaurants WHERE slug = 'pilot' LIMIT 1)
  WHERE restaurant_id IS NULL;

  UPDATE events
  SET restaurant_id = (SELECT id FROM restaurants WHERE slug = 'pilot' LIMIT 1)
  WHERE restaurant_id IS NULL;

  ALTER TABLE menu_categories ALTER COLUMN restaurant_id SET NOT NULL;
  ALTER TABLE menu_items ALTER COLUMN restaurant_id SET NOT NULL;
  ALTER TABLE gallery_images ALTER COLUMN restaurant_id SET NOT NULL;
  ALTER TABLE events ALTER COLUMN restaurant_id SET NOT NULL;
`)
```

**Important:** Replace `restaurant_id` with the exact column name you found in Step 2 if it differs. Also replace table names (`menu_categories`, `menu_items`, `gallery_images`, `events`) with the exact names Payload uses — check the generated SQL above your addition to confirm. The `tenant_site_settings`, `tenant_hero_sections`, `tenant_page_content` tables are new (no existing rows) so no backfill is needed for them, but do NOT add NOT NULL for them here since the seed creates those docs after migration.

- [ ] **Step 4: Run the migration**

```bash
npm run migrate
```

Expected: migration runs without errors. Pilot restaurant row inserted. Existing rows backfilled. NOT NULL constraints applied.

If the migration fails: check the exact column and table names in the generated SQL. Fix the backfill SQL to match, then re-run.

- [ ] **Step 5: Install `tsx` and add npm scripts**

```bash
npm install -D tsx
```

In `package.json`, add to `"scripts"`:
```json
"seed": "cross-env PAYLOAD_CONFIG_PATH=src/payload.config.ts tsx src/scripts/seed.ts",
"test": "vitest"
```

- [ ] **Step 6: Create `src/scripts/seed.ts`**

```typescript
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'

async function seed() {
  const payload = await getPayload({ config })

  // Ensure pilot restaurant exists (created in migration; this is a guard)
  const pilotResult = await payload.find({
    collection: 'restaurants',
    where: { slug: { equals: 'pilot' } },
    limit: 1,
  })
  if (pilotResult.docs.length === 0) {
    throw new Error('Pilot restaurant not found. Run `npm run migrate` first.')
  }
  const pilot = pilotResult.docs[0]!

  // Create decoy restaurant if missing
  const decoyResult = await payload.find({
    collection: 'restaurants',
    where: { slug: { equals: 'decoy' } },
    limit: 1,
  })
  let decoy = decoyResult.docs[0]
  if (!decoy) {
    decoy = await payload.create({
      collection: 'restaurants',
      data: { name: 'Decoy Café', slug: 'decoy', active: true },
    })
    console.log('Created decoy restaurant:', decoy.id)
  }

  // Seed pilot site settings if missing
  const pilotSettings = await payload.find({
    collection: 'tenant-site-settings',
    where: { restaurant: { equals: pilot.id } },
    limit: 1,
  })
  if (pilotSettings.docs.length === 0) {
    await payload.create({
      collection: 'tenant-site-settings',
      data: {
        restaurant: pilot.id,
        restaurantName: 'Pilot Café',
        tagline: 'Fresh ingredients, inspired by tradition.',
        contact: { phone: '(555) 000-0001', email: 'hello@pilot.example' },
        hours: [
          { day: 'Monday–Friday', openTime: '11:00 AM', closeTime: '10:00 PM', closed: false },
          { day: 'Saturday–Sunday', openTime: '10:00 AM', closeTime: '11:00 PM', closed: false },
        ],
      },
    })
    console.log('Seeded pilot site settings')
  }

  // Seed pilot hero section if missing
  const pilotHero = await payload.find({
    collection: 'tenant-hero-sections',
    where: { restaurant: { equals: pilot.id } },
    limit: 1,
  })
  if (pilotHero.docs.length === 0) {
    // backgroundImage is required — skip if no media exists yet
    console.log('Skipped pilot hero section (no media — add via admin after seeding)')
  }

  // Seed pilot page content if missing
  const pilotContent = await payload.find({
    collection: 'tenant-page-content',
    where: { restaurant: { equals: pilot.id } },
    limit: 1,
  })
  if (pilotContent.docs.length === 0) {
    await payload.create({
      collection: 'tenant-page-content',
      data: {
        restaurant: pilot.id,
        home: { eyebrow: 'Our Selection', headerTitle: 'Featured Dishes' },
        menu: { eyebrow: 'What We Offer', headerTitle: 'Our Menu' },
        gallery: { eyebrow: 'A Visual Story', headerTitle: 'Gallery' },
        events: { eyebrow: "What's Coming Up", headerTitle: 'Events & Specials' },
        contact: { eyebrow: 'Find Us', headerTitle: 'Contact & Location' },
        about: { eyebrow: 'Who We Are', headerTitle: 'About Us', ctaHeading: 'Come Visit Us', ctaSubtext: "We'd love to welcome you.", ctaPrimaryText: 'View Our Menu', ctaSecondaryText: 'Contact Us' },
      },
    })
    console.log('Seeded pilot page content')
  }

  // Seed decoy site settings if missing (different from pilot — proves isolation)
  const decoySettings = await payload.find({
    collection: 'tenant-site-settings',
    where: { restaurant: { equals: decoy.id } },
    limit: 1,
  })
  if (decoySettings.docs.length === 0) {
    await payload.create({
      collection: 'tenant-site-settings',
      data: {
        restaurant: decoy.id,
        restaurantName: 'Decoy Café',
        tagline: 'Not the pilot — isolation test only.',
        contact: { phone: '(555) 000-0002', email: 'hello@decoy.example' },
      },
    })
    console.log('Seeded decoy site settings')
  }

  // Seed decoy page content if missing
  const decoyContent = await payload.find({
    collection: 'tenant-page-content',
    where: { restaurant: { equals: decoy.id } },
    limit: 1,
  })
  if (decoyContent.docs.length === 0) {
    await payload.create({
      collection: 'tenant-page-content',
      data: {
        restaurant: decoy.id,
        home: { eyebrow: 'Decoy Selection', headerTitle: 'Decoy Dishes' },
        menu: { eyebrow: 'Decoy Menu', headerTitle: 'Decoy Menu' },
      },
    })
    console.log('Seeded decoy page content')
  }

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 7: Run the seed**

```bash
npm run seed
```

Expected output:
```
Created decoy restaurant: <uuid>
Seeded pilot site settings
Seeded pilot page content
Skipped pilot hero section (no media — add via admin after seeding)
Seeded decoy site settings
Seeded decoy page content
Seed complete.
```

- [ ] **Step 8: Verify in Payload admin**

Visit `http://localhost:3000/admin`. Confirm:
1. Tenant selector shows "Pilot Café" and "Decoy Café"
2. Switching to Pilot → Settings → Tenant Site Settings shows "Pilot Café" in the restaurantName field
3. Switching to Decoy → Settings → Tenant Site Settings shows "Decoy Café" (isolation proof)
4. Switching to Pilot → Menu Categories shows only pilot's categories; switching to Decoy shows none

- [ ] **Step 9: Commit S0a**

```bash
git add src/scripts/seed.ts package.json package-lock.json migrations/
git commit -m "feat(s0a): migration with pilot backfill + decoy seed — S0a complete"
```

---

## ── S0b: Application Layer ───────────────────────────────────────────────────

---

### Task 5: Vitest setup + PILOT_RESTAURANT_SLUG env var

**Files:**
- Create: `vitest.config.ts`
- Modify: `src/env.ts`
- Modify: `.env.example`
- Modify: `package.json` (test script — added in Task 4 Step 5)

**Interfaces:**
- Produces: `npm test` runs Vitest; `env.PILOT_RESTAURANT_SLUG` available in all server code

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@payload-config': path.resolve(__dirname, './src/payload.config.ts'),
    },
  },
})
```

- [ ] **Step 3: Add `PILOT_RESTAURANT_SLUG` to `src/env.ts`**

Add one entry to the `server` block and one to `runtimeEnv`:

In the `server:` block, after `NODE_ENV`:
```typescript
PILOT_RESTAURANT_SLUG: z.string().min(1).default('pilot'),
```

In `runtimeEnv:`, after `NODE_ENV`:
```typescript
PILOT_RESTAURANT_SLUG: process.env['PILOT_RESTAURANT_SLUG'],
```

- [ ] **Step 4: Add to `.env.example`**

Append to `.env.example`:
```
# Slug of the pilot restaurant used by the marketing pages (default: pilot)
PILOT_RESTAURANT_SLUG=pilot
```

- [ ] **Step 5: Verify Vitest runs**

```bash
npm test
```

Expected: Vitest starts and reports "no test files found" (no tests yet). Exit code 0 or Vitest's "no tests" warning — either is acceptable.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/env.ts .env.example package.json package-lock.json
git commit -m "chore(s0b): Vitest setup + PILOT_RESTAURANT_SLUG env var"
```

---

### Task 6: `resolveSlug` — choke-point entry for slug resolution (TDD)

**Files:**
- Create: `src/server/db/restaurants.ts`
- Create: `src/server/db/__tests__/restaurants.test.ts`
- Create: `src/server/db/index.ts`

**Interfaces:**
- Produces: `resolveSlug(slug: string): Promise<Restaurant | null>` — queries `restaurants` collection, filters `active: true`, returns first doc or null

- [ ] **Step 1: Write the failing test**

Create `src/server/db/__tests__/restaurants.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFind = vi.fn()

vi.mock('@/lib/payload', () => ({
  getPayload: vi.fn(() => Promise.resolve({ find: mockFind })),
}))

// Import after mock so the module picks up the mock
const { resolveSlug } = await import('../restaurants')

describe('resolveSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the restaurant when an active restaurant matches the slug', async () => {
    const pilot = { id: 'pilot-uuid', name: 'Pilot Café', slug: 'pilot', active: true }
    mockFind.mockResolvedValue({ docs: [pilot], totalDocs: 1 })

    const result = await resolveSlug('pilot')

    expect(result).toEqual(pilot)
    expect(mockFind).toHaveBeenCalledWith({
      collection: 'restaurants',
      where: { slug: { equals: 'pilot' }, active: { equals: true } },
      limit: 1,
    })
  })

  it('returns null when no active restaurant matches the slug', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0 })

    const result = await resolveSlug('does-not-exist')

    expect(result).toBeNull()
  })

  it('returns null when the restaurant exists but is inactive', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0 })

    const result = await resolveSlug('inactive-slug')

    expect(result).toBeNull()
    // active: false restaurants are excluded by the where clause
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ active: { equals: true } }),
      }),
    )
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- src/server/db/__tests__/restaurants.test.ts
```

Expected: FAIL — `Cannot find module '../restaurants'`

- [ ] **Step 3: Implement `src/server/db/restaurants.ts`**

```typescript
import { getPayload } from '@/lib/payload'
import type { Restaurant } from '@/payload-types'

export async function resolveSlug(slug: string): Promise<Restaurant | null> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'restaurants',
    where: { slug: { equals: slug }, active: { equals: true } },
    limit: 1,
  })
  return result.docs[0] ?? null
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- src/server/db/__tests__/restaurants.test.ts
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Create `src/server/db/index.ts`**

```typescript
export { resolveSlug } from './restaurants'
```

- [ ] **Step 6: Commit**

```bash
git add src/server/db/restaurants.ts src/server/db/__tests__/restaurants.test.ts src/server/db/index.ts
git commit -m "feat(s0b): resolveSlug choke-point with tests"
```

---

### Task 7: Per-tenant settings queries — choke-point isolation (TDD)

**Files:**
- Create: `src/server/db/settings.ts`
- Create: `src/server/db/__tests__/settings.test.ts`
- Modify: `src/server/db/index.ts`

**Interfaces:**
- Consumes: nothing from prior tasks (standalone functions)
- Produces:
  - `getSettingsForTenant(restaurantId: string): Promise<TenantSiteSetting | null>`
  - `getHeroForTenant(restaurantId: string): Promise<TenantHeroSection | null>`
  - `getPageContentForTenant(restaurantId: string): Promise<TenantPageContent | null>`

- [ ] **Step 1: Write the failing tests**

Create `src/server/db/__tests__/settings.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFind = vi.fn()

vi.mock('@/lib/payload', () => ({
  getPayload: vi.fn(() => Promise.resolve({ find: mockFind })),
}))

const { getSettingsForTenant, getHeroForTenant, getPageContentForTenant } =
  await import('../settings')

const PILOT_ID = 'pilot-uuid'
const DECOY_ID = 'decoy-uuid'

describe('getSettingsForTenant', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries only the given tenant — pilot', async () => {
    const pilotDoc = { id: 's1', restaurant: PILOT_ID, restaurantName: 'Pilot Café' }
    mockFind.mockResolvedValue({ docs: [pilotDoc] })

    const result = await getSettingsForTenant(PILOT_ID)

    expect(mockFind).toHaveBeenCalledWith({
      collection: 'tenant-site-settings',
      where: { restaurant: { equals: PILOT_ID } },
      limit: 1,
    })
    expect(result?.restaurantName).toBe('Pilot Café')
  })

  it('queries only the given tenant — decoy does not bleed into pilot', async () => {
    const decoyDoc = { id: 's2', restaurant: DECOY_ID, restaurantName: 'Decoy Café' }
    mockFind.mockResolvedValue({ docs: [decoyDoc] })

    const result = await getSettingsForTenant(DECOY_ID)

    expect(mockFind).toHaveBeenCalledWith({
      collection: 'tenant-site-settings',
      where: { restaurant: { equals: DECOY_ID } },
      limit: 1,
    })
    expect(result?.restaurantName).toBe('Decoy Café')
    // Ensure pilot query was never issued
    expect(mockFind).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ restaurant: { equals: PILOT_ID } }),
      }),
    )
  })

  it('returns null when no settings document exists for the tenant', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    const result = await getSettingsForTenant('nonexistent')
    expect(result).toBeNull()
  })
})

describe('getHeroForTenant', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries tenant-hero-sections scoped to restaurantId', async () => {
    const heroDoc = { id: 'h1', restaurant: PILOT_ID, heading: 'Taste the Difference' }
    mockFind.mockResolvedValue({ docs: [heroDoc] })

    const result = await getHeroForTenant(PILOT_ID)

    expect(mockFind).toHaveBeenCalledWith({
      collection: 'tenant-hero-sections',
      where: { restaurant: { equals: PILOT_ID } },
      limit: 1,
    })
    expect(result?.heading).toBe('Taste the Difference')
  })

  it('returns null when no hero document exists for the tenant', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    expect(await getHeroForTenant(PILOT_ID)).toBeNull()
  })
})

describe('getPageContentForTenant', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries tenant-page-content scoped to restaurantId', async () => {
    const contentDoc = { id: 'c1', restaurant: PILOT_ID, menu: { eyebrow: 'What We Offer' } }
    mockFind.mockResolvedValue({ docs: [contentDoc] })

    const result = await getPageContentForTenant(PILOT_ID)

    expect(mockFind).toHaveBeenCalledWith({
      collection: 'tenant-page-content',
      where: { restaurant: { equals: PILOT_ID } },
      limit: 1,
    })
    expect(result?.menu?.eyebrow).toBe('What We Offer')
  })

  it('returns null when no content document exists for the tenant', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    expect(await getPageContentForTenant(PILOT_ID)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- src/server/db/__tests__/settings.test.ts
```

Expected: FAIL — `Cannot find module '../settings'`

- [ ] **Step 3: Implement `src/server/db/settings.ts`**

```typescript
import { getPayload } from '@/lib/payload'
import type { TenantSiteSetting, TenantHeroSection, TenantPageContent } from '@/payload-types'

export async function getSettingsForTenant(
  restaurantId: string,
): Promise<TenantSiteSetting | null> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'tenant-site-settings',
    where: { restaurant: { equals: restaurantId } },
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getHeroForTenant(
  restaurantId: string,
): Promise<TenantHeroSection | null> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'tenant-hero-sections',
    where: { restaurant: { equals: restaurantId } },
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getPageContentForTenant(
  restaurantId: string,
): Promise<TenantPageContent | null> {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'tenant-page-content',
    where: { restaurant: { equals: restaurantId } },
    limit: 1,
  })
  return result.docs[0] ?? null
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- src/server/db/__tests__/settings.test.ts
```

Expected: PASS — 7 tests passing

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: all tests passing (restaurants + settings = 10 tests total)

- [ ] **Step 6: Update `src/server/db/index.ts`**

```typescript
export { resolveSlug } from './restaurants'
export { getSettingsForTenant, getHeroForTenant, getPageContentForTenant } from './settings'
```

- [ ] **Step 7: Commit**

```bash
git add src/server/db/settings.ts src/server/db/__tests__/settings.test.ts src/server/db/index.ts
git commit -m "feat(s0b): per-tenant settings choke-point with isolation tests"
```

---

### Task 8: Update marketing pages to use choke-point

Replace all `payload.findGlobal(...)` calls in the six frontend pages. After this task every page reads settings from the pilot tenant's per-tenant collection via the choke-point. The `payload.find()` calls on `menu-items`, `gallery-images`, etc. are left unchanged (those get tenant-scoped in S1/S2 when the menu choke-point is built).

**Files:**
- Modify: `src/app/(frontend)/page.tsx`
- Modify: `src/app/(frontend)/menu/page.tsx`
- Modify: `src/app/(frontend)/gallery/page.tsx`
- Modify: `src/app/(frontend)/about/page.tsx`
- Modify: `src/app/(frontend)/events/page.tsx`
- Modify: `src/app/(frontend)/contact/page.tsx`

**Interfaces:**
- Consumes: `resolveSlug`, `getSettingsForTenant`, `getHeroForTenant`, `getPageContentForTenant` from `@/server/db`
- Consumes: `env.PILOT_RESTAURANT_SLUG` from `@/env`

- [ ] **Step 1: Update `src/app/(frontend)/page.tsx` (home page)**

Add these imports and remove the old `findGlobal` calls:

```typescript
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/cache'
import { env } from '@/env'
import { resolveSlug, getSettingsForTenant, getHeroForTenant, getPageContentForTenant } from '@/server/db'
import { HeroSection } from '@/sections/HeroSection'
import { FeaturedMenu } from '@/sections/FeaturedMenu'
import { GalleryPreview } from '@/sections/GalleryPreview'
import type { Media } from '@/payload-types'

const getHomeData = unstable_cache(
  async () => {
    const payload = await getPayload()
    const pilot = await resolveSlug(env.PILOT_RESTAURANT_SLUG)
    if (!pilot) throw new Error('Pilot restaurant not found. Run npm run seed.')

    const [hero, settings, content, featuredItems, featuredGallery] = await Promise.all([
      getHeroForTenant(pilot.id),
      getSettingsForTenant(pilot.id),
      getPageContentForTenant(pilot.id),
      payload.find({
        collection: 'menu-items',
        where: { and: [{ featured: { equals: true } }, { available: { equals: true } }] },
        sort: 'order',
        limit: 6,
        depth: 1,
      }),
      payload.find({
        collection: 'gallery-images',
        where: { featured: { equals: true } },
        sort: 'order',
        limit: 6,
        depth: 1,
      }),
    ])
    return {
      hero,
      settings,
      content,
      featuredItems: featuredItems.docs,
      featuredGallery: featuredGallery.docs,
    }
  },
  ['home-page'],
  {
    tags: [
      CACHE_TAGS.hero,
      CACHE_TAGS.settings,
      CACHE_TAGS.content,
      CACHE_TAGS.menu,
      CACHE_TAGS.gallery,
      CACHE_TAGS.media,
    ],
    revalidate: 300,
  },
)

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getHomeData()
  const ogImage =
    settings && typeof settings.seo?.ogImage === 'object'
      ? (settings.seo.ogImage as Media)
      : null

  return {
    title: settings?.seo?.metaTitle ?? settings?.restaurantName ?? 'Restaurant',
    description: settings?.seo?.metaDescription ?? settings?.tagline ?? undefined,
    openGraph: {
      title: settings?.seo?.metaTitle ?? settings?.restaurantName ?? undefined,
      description: settings?.seo?.metaDescription ?? undefined,
      images: ogImage?.url ? [{ url: ogImage.url, alt: ogImage.alt ?? '' }] : [],
    },
  }
}

export default async function HomePage() {
  const { hero, content, featuredItems, featuredGallery } = await getHomeData()

  return (
    <>
      <HeroSection
        heading={hero?.heading ?? ''}
        subheading={hero?.subheading ?? undefined}
        backgroundImage={hero?.backgroundImage ?? null}
        backgroundVideo={hero?.backgroundVideo ?? undefined}
        primaryCta={hero?.primaryCta ?? undefined}
        secondaryCta={hero?.secondaryCta ?? undefined}
        overlay={hero?.overlay ?? undefined}
      />
      <FeaturedMenu
        items={featuredItems}
        eyebrow={content?.home?.eyebrow ?? undefined}
        heading={content?.home?.headerTitle ?? undefined}
      />
      <GalleryPreview images={featuredGallery} />
    </>
  )
}
```

- [ ] **Step 2: Update `src/app/(frontend)/menu/page.tsx`**

Replace the `findGlobal` call with `getPageContentForTenant`. Only change the `getMenuData` function — the page JSX is unchanged:

```typescript
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/cache'
import { env } from '@/env'
import { resolveSlug, getPageContentForTenant } from '@/server/db'
import { Container } from '@/components/custom/Container'
import { Section } from '@/components/custom/Section'
import { MenuItemCard } from '@/components/menu/MenuItemCard'
import type { MenuItem } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Browse our full menu — starters, mains, desserts, and more.',
}

const getMenuData = unstable_cache(
  async () => {
    const payload = await getPayload()
    const pilot = await resolveSlug(env.PILOT_RESTAURANT_SLUG)
    if (!pilot) throw new Error('Pilot restaurant not found.')

    const [categories, items, content] = await Promise.all([
      payload.find({ collection: 'menu-categories', sort: 'order', limit: 50 }),
      payload.find({
        collection: 'menu-items',
        where: { available: { equals: true } },
        sort: 'order',
        limit: 300,
        depth: 1,
      }),
      getPageContentForTenant(pilot.id),
    ])
    return { categories: categories.docs, items: items.docs, content }
  },
  ['menu-page'],
  { tags: [CACHE_TAGS.menu, CACHE_TAGS.content, CACHE_TAGS.media], revalidate: 300 },
)
```

In the page JSX, add `?` for null safety on `content`:
```typescript
{content?.menu?.eyebrow ?? 'What We Offer'}
{content?.menu?.headerTitle ?? 'Our Menu'}
```

- [ ] **Step 3: Update `src/app/(frontend)/gallery/page.tsx`**

```typescript
const getGalleryData = unstable_cache(
  async () => {
    const payload = await getPayload()
    const pilot = await resolveSlug(env.PILOT_RESTAURANT_SLUG)
    if (!pilot) throw new Error('Pilot restaurant not found.')

    const [result, content] = await Promise.all([
      payload.find({ collection: 'gallery-images', sort: 'order', limit: 100, depth: 1 }),
      getPageContentForTenant(pilot.id),
    ])
    return { images: result.docs, content }
  },
  ['gallery-page'],
  { tags: [CACHE_TAGS.gallery, CACHE_TAGS.content, CACHE_TAGS.media], revalidate: 300 },
)
```

Update imports: add `env`, `resolveSlug`, `getPageContentForTenant` from `@/server/db`. Remove `getPayload` direct use if only needed for `findGlobal` — keep it for the `gallery-images` query.

In page JSX: `content?.gallery?.eyebrow`, `content?.gallery?.headerTitle`.

- [ ] **Step 4: Update `src/app/(frontend)/about/page.tsx`**

```typescript
const getAboutData = unstable_cache(
  async () => {
    const payload = await getPayload()
    const pilot = await resolveSlug(env.PILOT_RESTAURANT_SLUG)
    if (!pilot) throw new Error('Pilot restaurant not found.')

    const [gallery, content] = await Promise.all([
      payload.find({ collection: 'gallery-images', sort: 'order', limit: 4, depth: 1 }),
      getPageContentForTenant(pilot.id),
    ])
    return { galleryImages: gallery.docs, content }
  },
  ['about-page'],
  { tags: [CACHE_TAGS.gallery, CACHE_TAGS.content], revalidate: 300 },
)
```

In page JSX: replace all `content.about` with `content?.about`. The `about` variable already accessed as `const about = content.about` — change to `const about = content?.about`.

- [ ] **Step 5: Update `src/app/(frontend)/events/page.tsx`**

```typescript
const getEventsData = unstable_cache(
  async () => {
    const payload = await getPayload()
    const pilot = await resolveSlug(env.PILOT_RESTAURANT_SLUG)
    if (!pilot) throw new Error('Pilot restaurant not found.')
    const now = new Date().toISOString()

    const [result, content] = await Promise.all([
      payload.find({
        collection: 'events',
        where: { and: [{ status: { equals: 'published' } }, { date: { greater_than_equal: now } }] },
        sort: ['-featured', 'date'],
        limit: 50,
        depth: 1,
      }),
      getPageContentForTenant(pilot.id),
    ])
    return { events: result.docs, content }
  },
  ['events-page'],
  { tags: [CACHE_TAGS.events, CACHE_TAGS.content, CACHE_TAGS.media], revalidate: 300 },
)
```

In page JSX: `content?.events?.eyebrow`, `content?.events?.headerTitle`.

- [ ] **Step 6: Update `src/app/(frontend)/contact/page.tsx`**

```typescript
const getContactData = unstable_cache(
  async () => {
    const pilot = await resolveSlug(env.PILOT_RESTAURANT_SLUG)
    if (!pilot) throw new Error('Pilot restaurant not found.')

    const [settings, content] = await Promise.all([
      getSettingsForTenant(pilot.id),
      getPageContentForTenant(pilot.id),
    ])
    return { settings, content }
  },
  ['contact-page'],
  { tags: [CACHE_TAGS.settings, CACHE_TAGS.content], revalidate: 300 },
)
```

Note: `getPayload` import can be removed from `contact/page.tsx` since the choke-point functions handle the Payload calls. Update imports: add `env`, `resolveSlug`, `getSettingsForTenant`, `getPageContentForTenant`.

In page JSX: add `?` guards — `settings?.contact`, `settings?.hours`, `settings?.restaurantName`. `content?.contact?.eyebrow`, `content?.contact?.headerTitle`.

- [ ] **Step 7: Run the dev server and verify all six pages**

```bash
npm run dev
```

Visit each page and confirm it loads without errors:
- `http://localhost:3000/` — home page with hero, featured menu, gallery preview
- `http://localhost:3000/menu` — menu categories and items
- `http://localhost:3000/gallery` — gallery grid
- `http://localhost:3000/about` — about page
- `http://localhost:3000/events` — events page
- `http://localhost:3000/contact` — contact page with settings data

If a page throws "Pilot restaurant not found": ensure `npm run seed` has been run and `PILOT_RESTAURANT_SLUG=pilot` is in your `.env`.

- [ ] **Step 8: Commit**

```bash
git add src/app/\(frontend\)/page.tsx src/app/\(frontend\)/menu/page.tsx src/app/\(frontend\)/gallery/page.tsx src/app/\(frontend\)/about/page.tsx src/app/\(frontend\)/events/page.tsx src/app/\(frontend\)/contact/page.tsx
git commit -m "feat(s0b): replace findGlobal with choke-point on all marketing pages"
```

---

### Task 9: `/r/[slug]` route stub

**Files:**
- Create: `src/app/(frontend)/r/[slug]/page.tsx`

**Interfaces:**
- Consumes: `resolveSlug` from `@/server/db`
- Produces: `/r/pilot` → 200 with restaurant name; `/r/anything-unknown` → 404

- [ ] **Step 1: Create `src/app/(frontend)/r/[slug]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveSlug } from '@/server/db'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await resolveSlug(slug)
  if (!restaurant) return { title: 'Not Found' }
  return { title: restaurant.name }
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params
  const restaurant = await resolveSlug(slug)
  if (!restaurant) notFound()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="font-serif text-4xl font-bold text-gray-900">{restaurant.name}</h1>
      <p className="mt-4 text-gray-500">Digital menu coming soon.</p>
    </main>
  )
}
```

Note: `params` is a `Promise` in Next.js 15 App Router — always `await params` before destructuring.

- [ ] **Step 2: Verify the route manually**

```bash
npm run dev
```

- Visit `http://localhost:3000/r/pilot` → should render "Pilot Café" heading and "Digital menu coming soon."
- Visit `http://localhost:3000/r/decoy` → should render "Decoy Café" heading
- Visit `http://localhost:3000/r/nonexistent` → should render the 404 page from `(frontend)/not-found.tsx`

- [ ] **Step 3: Commit**

```bash
git add "src/app/(frontend)/r/[slug]/page.tsx"
git commit -m "feat(s0b): /r/[slug] stub route — resolves tenant, 404 on unknown slug"
```

---

### Task 10: Update BUILD_STATUS.md

- [ ] **Step 1: Update `docs/BUILD_STATUS.md`**

Change the S0 row:
```markdown
| S0 | Tenant foundation + slug routing (Restaurant, multi-tenant plugin, per-tenant settings, data-access choke-point) | ✅ | 10 Vitest tests green; pilot/decoy isolation proven; /r/pilot stub live |
```

Change "Current status" to reflect S0 complete and S1 next:
```markdown
> **MVP epic "Pilot ordering loop" — 🔄 S1 next.** S0 complete: multi-tenant foundation, choke-point, slug routing.
```

- [ ] **Step 2: Commit**

```bash
git add docs/BUILD_STATUS.md
git commit -m "docs: mark S0 complete in BUILD_STATUS"
```

---

## Summary

| Phase | Tasks | Deliverable |
|---|---|---|
| S0a | 1–4 | Payload schema: Restaurant, plugin, 3 per-tenant collections, migration, seed |
| S0b | 5–10 | App layer: choke-point + 10 tests, 6 updated pages, /r/[slug] stub |

**S0 acceptance criteria verified by:**
1. `/r/pilot` → 200 stub; `/r/nonexistent` → 404 (Task 9 manual test)
2. `getSettingsForTenant(pilotId)` where clause never matches decoy rows (Task 7 tests)
3. Admin shows pilot settings ≠ decoy settings (Task 4 Step 8 admin verification)
