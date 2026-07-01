# S2 · Diner Menu Read (Cached) — Design Spec

**Date:** 2026-07-01
**Story:** S2 from [`docs/design/07-epic-map.md`](../../design/07-epic-map.md)
**Context artifacts:** API conventions → `05-api-conventions.md` · Engineering decisions → `06b-engineering-decisions.md` · Domain model → `02-domain-model.md`

---

## What this story does

Adds the diner-facing menu read path: `GET /api/shop/:slug/menu` returns the active category → item → modifier → option tree for one tenant, cached and invalidated on menu writes. The `/r/[slug]` stub page (added in S0) renders it. Also lands the cache-invalidation hooks on `Modifiers`/`ModifierOptions` deferred from S1, and adds the missing `active` field to `MenuCategories`.

**Does not touch:** cart state, checkout (`POST /orders`, S3), order confirmation (S4), staff dashboard (S5). Read-only.

---

## Part 1 — Cache-hook fix (deferred from S1)

`MenuCategories`/`MenuItems` already carry:
```ts
hooks: {
  afterChange: [async () => { await safeRevalidateTag(CACHE_TAGS.menu) }],
  afterDelete: [async () => { await safeRevalidateTag(CACHE_TAGS.menu) }],
}
```
`Modifiers`/`ModifierOptions` omitted this in S1 (no cached read path existed yet to invalidate). Add the identical hook block to both, using the same imports (`safeRevalidateTag` from `../lib/revalidate.ts`, `CACHE_TAGS` from `../lib/cache.ts`) already present in `MenuCategories.ts`/`MenuItems.ts`.

## Part 2 — `MenuCategories.active` field

`MenuCategories` currently has no visibility/soft-delete flag. `MenuItems` uses `available`; `Modifiers`/`ModifierOptions` use `active`. Rather than rename `MenuItems.available` (a schema change beyond this story's scope), add a new field to `MenuCategories` matching the `Modifiers.active` pattern exactly:

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `active` | checkbox | default `true` | Sidebar; soft-delete flag (INV-4) |

The query/service layer treats `MenuCategories.active` and `MenuItems.available` as equivalent "is this visible to diners" flags — same semantics, different field names, no rename.

## Part 3 — Data-access choke-point: `src/server/db/menu.ts`

```ts
export async function getMenuForTenant(restaurantId: string): Promise<MenuCategoryTree[]>
```

Four flat `payload.find()` calls, each scoped by `restaurant: { equals: restaurantId }` (INV-7) and filtered to the active-equivalent flag:
- `menu-categories` — `active: { equals: true }`, sorted `order`
- `menu-items` — `available: { equals: true }`
- `modifiers` — `active: { equals: true }`
- `modifier-options` — `active: { equals: true }`

Assembly (in-memory, by relationship FK — confirmed field names):
- `ModifierOptions.modifier` → group options under their modifier
- `Modifiers.menuItem` → group modifiers under their item
- `MenuItems.category` → group items under their category
- Categories with zero active items, and items with zero active modifiers, still appear (an item legitimately has no modifiers) — only rows failing their own `active`/`available` filter are dropped, no cascading "drop empty parent" logic.

Exported from `src/server/db/index.ts` alongside the other choke-point functions.

Return shape matches the tree in `05-api-conventions.md`'s worked example (id, name, displayOrder/order, items[], modifiers[], options[], price, label, priceAdjustment, type, required).

## Part 4 — Service: `src/server/ordering/menu.ts`

```ts
export async function getMenu(slug: string): Promise<MenuCategoryTree[] | null>
```

Calls `resolveSlug(slug)` (existing choke-point function; returns `null` for unknown/inactive tenant) then `getMenuForTenant(restaurant.id)`. Returns `null` when the tenant doesn't resolve, letting the route handler map that to `404`.

This is a thin compose today (no pricing/validation/state — those arrive in S3). It's added now, rather than having the route call the db layer directly, to keep the boundary → service → persistence layering from `06b-engineering-decisions.md` §2 consistent across all `ordering/*` routes, since S3/S4/S5 will need real logic at this layer.

## Part 5 — Route handler: `src/app/api/shop/[slug]/menu/route.ts`

```ts
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> })
```

- Calls `getMenu(slug)` (wrapped in `unstable_cache`, keyed `['menu', slug]`, tagged `CACHE_TAGS.menu`)
- `null` → `404` with envelope `{ error: { code: 'RESTAURANT_NOT_FOUND', message: '...', details: [] } }`
- Otherwise → `200` with the tree as JSON (empty array if the tenant has no active categories — never `404` for an empty menu, per `05-api-conventions.md`)
- No auth (diner endpoint, tenant from slug per `05-api-conventions.md`)

## Part 6 — Diner page: `src/app/(frontend)/r/[slug]/page.tsx`

Replace the "Digital menu coming soon" placeholder. Server component calls `getMenu(slug)` directly via Local API (no HTTP round-trip, per the existing `getRestaurant` pattern already in this file using `unstable_cache`), `notFound()` if `null`, otherwise renders categories → items → modifiers/options as static read-only markup. No cart, no add-to-order interactivity (S3+ scope).

## Testing approach

Per the Product-mode dial: this is the ordering *read* path, not the transaction path, so full rigor applies to tenancy/isolation but not to exhaustive business-rule coverage (there are no business rules here).

- **`src/server/db/__tests__/menu.test.ts`** — `getMenuForTenant`: mocks `payload.find`, asserts each of the 4 calls filters by `restaurant.equals` + the correct active/available flag; asserts tree assembly nests correctly; asserts pilot's tree never includes decoy rows (tenant isolation, the key security property per `06b` §7).
- **`src/server/ordering/__tests__/menu.test.ts`** — `getMenu`: mocks `resolveSlug` + `getMenuForTenant`; unknown slug → `null`; known slug → delegates with the resolved `restaurant.id`.
- **`src/app/api/shop/[slug]/menu/__tests__/route.test.ts`** — this repo has no route-handler test precedent yet; App Router route handlers are plain exported async functions, so test by importing `GET` directly and invoking it with a mock `Request` + `params`, mocking `getMenu`. Asserts `200` with tree for a known slug, `200 []` for a tenant with no active categories, `404 RESTAURANT_NOT_FOUND` for an unknown slug.

## Explicitly out of scope (per epic map's scope boundary)

- No cart, no `POST /orders` (S3)
- No order confirmation page (S4)
- No staff dashboard (S5)
- No pricing logic beyond passing through `priceAdjustment`/`price` as authored (server-side *total* computation is S3's INV-1/13)
