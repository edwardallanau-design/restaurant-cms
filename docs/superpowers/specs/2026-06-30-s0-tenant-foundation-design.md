# S0 · Tenant Foundation + Slug Routing — Design Spec

**Date:** 2026-06-30
**Story:** S0 from [`docs/design/07-epic-map.md`](../../design/07-epic-map.md)
**Context artifacts:** Tenancy → `03-tenancy-model.md` · Architecture → `04-architecture.md` · Domain model → `02-domain-model.md` · Engineering decisions → `06b-engineering-decisions.md`

---

## What this story does

Reverses the single-tenant assumption baked into the existing codebase. After S0 the system has:
- A `Restaurant` collection (the tenant root)
- All tenant-owned collections scoped by `restaurantId` (INV-7)
- The three singleton globals replaced by per-tenant settings collections
- A `/r/[slug]` route that resolves a slug to a restaurant (404 on unknown slugs)
- A single tenant-scoped data-access choke-point (`src/server/db/`) through which every tenant query passes
- Two seeded tenants (pilot + decoy) that can prove isolation

**Does not touch:** ordering, menu read API, diner ordering UI (S2+), modifier collections (S1), staff auth (S5).

---

## Split: S0a (Payload schema) + S0b (application layer)

The epic map flagged S0 as borderline for one window. Split rationale: S0a is entirely Payload config + migration; S0b is Next.js routing + service layer. Each fits cleanly in one context window, each has its own green commit.

---

## S0a — Payload Schema

### 1. Package install

```
npm install @payloadcms/plugin-multi-tenant
```

First-party Payload plugin at the same `^3.78.0` range. Added to the `plugins` array in `src/payload.config.ts` alongside the existing `vercelBlobStorage` plugin. Verify exact plugin config API against Payload 3.x docs at implementation time.

### 2. `Restaurant` collection

**File:** `src/collections/Restaurants.ts`

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `name` | text | required | Admin `useAsTitle` |
| `slug` | text | required, unique | Diner URL path segment; auto-lowercased kebab |
| `active` | checkbox | default `true` | Sidebar; inactive slug → 404 |

**Access:** `read: () => true` (slug resolution is public). Create/update/delete: `Boolean(user)` (any authenticated Payload user for MVP; tightened to super-admin post-pilot).

Exported and added to `collections: [...]` in `payload.config.ts`.

### 3. Multi-tenant plugin configuration

Configured with:
- `tenantCollection: 'restaurants'`
- Collections in scope: `menu-categories`, `menu-items`, `gallery-images`, `events`, `tenant-site-settings`, `tenant-hero-sections`, `tenant-page-content`

The plugin automatically:
1. Adds a `restaurant` relationship field (the tenant column) to every collection in scope
2. Filters the Payload admin UI to show only rows for the currently selected tenant

**Users:** The plugin adds a `tenants` array relationship to the `Users` collection. A user with an empty `tenants` array is treated as a platform super-admin (cross-tenant access).

### 4. Globals → per-tenant collections

The three existing Payload globals are **removed** from `globals: [...]` and replaced with three new collections added to `collections: [...]`.

| Removed global | New collection slug | Admin group |
|---|---|---|
| `site-settings` | `tenant-site-settings` | Settings |
| `hero-section` | `tenant-hero-sections` | Settings |
| `page-content` | `tenant-page-content` | Settings |

Each new collection carries **all the same fields** as its former global — no field is added, removed, or renamed in this story. The only structural addition is the `restaurant` relationship field attached by the plugin. One document per tenant.

The `afterChange` cache-invalidation hooks (calling `safeRevalidateTag(CACHE_TAGS.settings)`, `safeRevalidateTag(CACHE_TAGS.hero)`, `safeRevalidateTag(CACHE_TAGS.content)`) move from the old globals into the corresponding new collections with identical logic.

### 5. `restaurantId` on existing tenant-owned collections

`MenuCategories`, `MenuItems`, `GalleryImages`, and `Events` each receive the `restaurant` relationship field via the plugin (no manual field declaration needed).

**Existing row backfill:** the generated migration SQL must backfill all existing rows to the pilot restaurant's ID before enforcing the NOT NULL constraint. The seed (§7) runs before the backfill is applied, so the pilot ID is available in the migration. Document the backfill step explicitly in the migration file.

### 6. Slug uniqueness fix

`MenuCategories.slug` and `MenuItems.slug` currently carry `unique: true` (globally unique). In the multi-tenant schema, uniqueness is per-restaurant.

Changes to both collections:
1. Remove `unique: true` from the `slug` field definition.
2. Add a composite unique index `(restaurant, slug)` via the collection's `indexes` config (supported by `@payloadcms/db-postgres`).

```typescript
// Example shape — verify exact Payload 3.x API at implementation time
indexes: [{ fields: ['restaurant', 'slug'], unique: true }]
```

### 7. Migration + seed

**Ordering matters.** The `restaurants` table and the `restaurant` columns on existing collections are created by the Payload migration. The pilot restaurant row must exist before existing rows can be backfilled. The correct sequence:

1. `npm run migrate:create` — generates the migration file. The generated SQL adds `restaurants` table and adds a nullable `restaurant` column to existing collections.
2. **Manually extend the generated migration** with three extra steps at the end:
   a. `INSERT` the pilot restaurant row (SQL — known values, no app needed).
   b. `UPDATE` all existing tenant-owned rows to set `restaurant = <pilot_id>`.
   c. `ALTER COLUMN restaurant SET NOT NULL` on each affected table.
3. Run `payload migrate` to apply the extended migration.
4. Run `npm run seed` to create the decoy restaurant + both tenants' settings documents.

```bash
npm run migrate:create   # generates; manually extend before running
npm run migrate          # applies extended migration (pilot row + backfill + NOT NULL)
npm run seed             # creates decoy + all per-tenant settings docs
```

**Seed script:** `src/scripts/seed.ts` — callable via `npm run seed` (add to `package.json`). Uses the Payload Local API. Creates:

| Tenant | slug | name | Settings doc content |
|---|---|---|---|
| Pilot | `pilot` | `Pilot Café` | Real-looking content (already exists after migration step 2a) |
| Decoy | `decoy` | `Decoy Café` | Clearly different `restaurantName` etc. |

The seed script is idempotent: it checks for an existing slug before inserting, so re-running is safe. Both tenants get one document in each of the three per-tenant settings collections, with field values that visibly differ — satisfying the AC "pilot vs decoy differ."

**S0a acceptance criteria (verifiable in Payload admin):**
- Both restaurants exist and are selectable in the admin
- Switching tenant filter shows only that tenant's rows across all scoped collections
- Pilot and decoy settings documents have different content

---

## S0b — Application Layer

### 1. Tenant-scoped data-access choke-point

**Directory:** `src/server/db/`

```
src/server/db/
  index.ts          — re-exports all public functions (only import point for callers)
  restaurants.ts    — resolveSlug()
  settings.ts       — getSettingsForTenant(), getHeroForTenant(), getPageContentForTenant()
  __tests__/
    restaurants.test.ts
    settings.test.ts
```

`menu.ts` is **not** created in S0 — added in S1/S2 when those queries are needed.

**Invariant:** every function that queries a tenant-owned collection passes `where: { restaurant: { equals: restaurantId } }` inside the function body. No caller constructs this clause. This is the enforcement mechanism for INV-7.

**Data source:** Payload Local API (`payload.find(...)`, `payload.findOne(...)`). No raw SQL, no direct `pg` calls.

#### `restaurants.ts`

```typescript
resolveSlug(slug: string): Promise<Restaurant | null>
```

Queries `restaurants` collection with `where: { slug: { equals: slug }, active: { equals: true } }`. Returns the first match or `null`. An inactive restaurant returns `null` (its URL → 404).

#### `settings.ts`

```typescript
getSettingsForTenant(restaurantId: string): Promise<TenantSiteSetting | null>
getHeroForTenant(restaurantId: string): Promise<TenantHeroSection | null>
getPageContentForTenant(restaurantId: string): Promise<TenantPageContent | null>
```

Each queries its respective collection with `where: { restaurant: { equals: restaurantId } }`, limit 1.

#### `index.ts`

Re-exports all public functions. Callers use `import { resolveSlug } from '@/server/db'` — never import from the individual files directly. This keeps the internal file structure changeable without touching callers.

### 2. `/r/[slug]` routing

**File added:** `src/app/(frontend)/r/[slug]/page.tsx`

- `async` server component, no `'use client'`
- Calls `resolveSlug(params.slug)`
- If `null` → `notFound()` (Next.js renders existing `(frontend)/not-found.tsx`)
- If found → renders a minimal stub: restaurant name + placeholder paragraph
- Exports `generateMetadata` returning `{ title: restaurant.name }` for a sensible `<title>`

No layout shell, no Tailwind investment. This surface is replaced in S2 when the diner menu UI is built. The value of this route in S0 is the resolution machinery, not the rendered output.

### 3. Marketing page updates

The existing `(frontend)` pages (`/`, `/menu`, `/gallery`, `/events`, `/about`, `/contact`) read from the three removed globals. They must be updated to use the choke-point.

**Env var:** Add `PILOT_RESTAURANT_SLUG=pilot` to `.env.example` and `src/env.ts` (alongside existing vars). This is the only place the pilot slug is declared; frontend code never hardcodes `'pilot'`.

**Cache function updates in `src/lib/cache.ts`:** Replace `getGlobal('site-settings')` / `getGlobal('hero-section')` / `getGlobal('page-content')` calls with choke-point calls scoped to the pilot restaurant:

```
resolveSlug(env.PILOT_RESTAURANT_SLUG) → restaurantId
→ getSettingsForTenant(restaurantId)
→ getHeroForTenant(restaurantId)
→ getPageContentForTenant(restaurantId)
```

The `unstable_cache()` wrappers and `CACHE_TAGS` remain unchanged — only the inner data-fetch changes. Cache invalidation continues to work via the `afterChange` hooks on the new per-tenant collections.

### 4. Test plan

Three Vitest unit tests — one per S0 acceptance criterion. Tests mock the Payload Local API (`vi.mock('payload')`) to verify the choke-point constructs the correct `where` clause and returns shaped data.

| AC | Test | File |
|---|---|---|
| Unknown slug → null (→ 404 at route) | `resolveSlug('does-not-exist')` returns `null` | `restaurants.test.ts` |
| Pilot data never returns decoy rows | `getSettingsForTenant(pilotId)` result contains no decoy data; `getSettingsForTenant(decoyId)` contains no pilot data | `settings.test.ts` |
| Ex-globals read per-tenant | pilot `restaurantName` ≠ decoy `restaurantName` from the same function | `settings.test.ts` |

The full cross-tenant integration test (hitting a real test DB) is deferred to E10 per ADR-003. These unit tests verify the structural guarantee: the right `where` clause is always present.

---

## What does NOT change in S0

- No ordering route handlers (`/api/shop/`, `/api/staff/`)
- No `Modifiers` or `ModifierOptions` collections (S1)
- No diner ordering UI beyond the slug-resolution stub (S2+)
- No staff auth beyond what Payload already provides (S5)
- No RLS backstop (E10)
- Existing frontend page URLs (`/menu`, `/gallery`, etc.) stay the same — only their data source changes

---

## Acceptance criteria (from epic map)

- `GET /r/pilot/...` resolves to the pilot tenant; an unknown slug → 404.
- A query for pilot data **never** returns the decoy tenant's rows through the choke-point.
- The ex-globals read per-tenant (pilot vs decoy differ).
