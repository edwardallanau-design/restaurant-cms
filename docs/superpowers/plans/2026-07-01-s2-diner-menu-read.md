# S2 · Diner Menu Read (Cached) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `GET /api/shop/:slug/menu` (cached, tenant-scoped, active-only) and render it on the `/r/[slug]` diner page. Also lands the S1-deferred cache-invalidation hooks on `Modifiers`/`ModifierOptions`, and a new `active` field on `MenuCategories`.

**Architecture:** Boundary → service → persistence, per `06b-engineering-decisions.md` §2. `src/server/db/menu.ts` (persistence, the tenant-scoped choke-point) runs four flat `payload.find()` calls and assembles a tree in memory. `src/server/ordering/menu.ts` (service, currently a thin pass-through) resolves the slug then calls the persistence layer. `src/app/api/shop/[slug]/menu/route.ts` (boundary) wraps the service call in `unstable_cache` and maps `null` → `404`. `src/app/(frontend)/r/[slug]/page.tsx` renders the same tree server-side.

**Tech Stack:** Payload CMS 3.85.1 Local API, Next.js 15 App Router route handlers, `unstable_cache`/`revalidateTag`, TypeScript, Vitest.

## Global Constraints

- Every query is scoped by `restaurant: { equals: restaurantId }` (INV-7) — no query bypasses this.
- Only rows passing the active-equivalent flag are returned: `MenuCategories.active`, `MenuItems.available`, `Modifiers.active`, `ModifierOptions.active` — all `{ equals: true }`.
- Empty menu → `200 []`, never `404`. Unknown/inactive tenant slug → `404 RESTAURANT_NOT_FOUND`.
- Error envelope: `{ error: { code: 'RESTAURANT_NOT_FOUND', message: string, details: [] } }` (`05-api-conventions.md`).
- No cart, no checkout, no pricing computation beyond passing through authored `price`/`priceAdjustment` values — this is a read-only story.
- `restaurant` tenant field is injected automatically by `multiTenantPlugin` — never declare it explicitly as a field.
- After editing collections, run `npm run generate:types` to regenerate `src/payload-types.ts` (gitignored, not committed).
- Full spec: `docs/superpowers/specs/2026-07-01-s2-diner-menu-read-design.md`.

---

### Task 1: Cache-invalidation hooks on `Modifiers` + `ModifierOptions`

**Files:**
- Modify: `src/collections/Modifiers.ts`
- Modify: `src/collections/ModifierOptions.ts`

**Interfaces:**
- Consumes: `safeRevalidateTag` from `src/lib/revalidate.ts`, `CACHE_TAGS.menu` from `src/lib/cache.ts` (both already exist and are already used by `MenuCategories.ts`/`MenuItems.ts`).
- Produces: both collections now revalidate the `menu` cache tag on any write/delete — required before Task 5's cached route exists, otherwise edits here would never invalidate it.

- [ ] **Step 1: Add hooks to `Modifiers.ts`**

In `src/collections/Modifiers.ts`, add the imports at the top (matching `MenuCategories.ts`'s import style):

```typescript
import { safeRevalidateTag } from '../lib/revalidate.ts'
import { CACHE_TAGS } from '../lib/cache.ts'
```

Add a `hooks` block as a new top-level key in the `Modifiers` config object (after `indexes`):

```typescript
  hooks: {
    afterChange: [
      async () => {
        await safeRevalidateTag(CACHE_TAGS.menu)
      },
    ],
    afterDelete: [
      async () => {
        await safeRevalidateTag(CACHE_TAGS.menu)
      },
    ],
  },
```

- [ ] **Step 2: Add hooks to `ModifierOptions.ts`**

Same two additions (imports + `hooks` block) in `src/collections/ModifierOptions.ts`, identical content.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/collections/Modifiers.ts src/collections/ModifierOptions.ts
git commit -m "fix: add deferred cache-invalidation hooks to Modifiers/ModifierOptions (S2)"
```

---

### Task 2: `MenuCategories.active` field

**Files:**
- Modify: `src/collections/MenuCategories.ts`

**Interfaces:**
- Produces: `MenuCategory.active` (boolean, default `true`) — consumed by Task 3's `getMenuForTenant` filter.

- [ ] **Step 1: Add the field**

In `src/collections/MenuCategories.ts`, add to the `fields` array (after the existing `order` field, matching the `Modifiers.active` field exactly):

```typescript
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Uncheck to hide this category from the menu without deleting it.',
      },
    },
```

- [ ] **Step 2: Regenerate types**

Run: `npm run generate:types`
Expected: exits 0; `src/payload-types.ts`'s `MenuCategory` interface now includes `active?: boolean | null;`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/collections/MenuCategories.ts
git commit -m "feat: add active field to MenuCategories (S2)"
```

---

### Task 3: `getMenuForTenant` — data-access choke-point

**Files:**
- Create: `src/server/db/menu.ts`
- Create: `src/server/db/__tests__/menu.test.ts`
- Modify: `src/server/db/index.ts` (add export)

**Interfaces:**
- Consumes: `getPayload` from `@/lib/payload`; `Restaurant`, `MenuCategory`, `MenuItem`, `Modifier`, `ModifierOption` types from `@/payload-types`.
- Produces:
  ```typescript
  export interface MenuOptionView {
    id: number
    label: string
    priceAdjustment: number
  }
  export interface MenuModifierView {
    id: number
    name: string
    type: 'single' | 'multi'
    required: boolean
    options: MenuOptionView[]
  }
  export interface MenuItemView {
    id: number
    name: string
    description: MenuItem['description']
    price: number
    modifiers: MenuModifierView[]
  }
  export interface MenuCategoryView {
    id: number
    name: string
    order: number
    items: MenuItemView[]
  }
  export async function getMenuForTenant(restaurantId: number): Promise<MenuCategoryView[]>
  ```
  Consumed by Task 4's `getMenu` service function.

- [ ] **Step 1: Write the failing test**

Create `src/server/db/__tests__/menu.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFind = vi.fn()

vi.mock('@/lib/payload', () => ({
  getPayload: vi.fn(() => Promise.resolve({ find: mockFind })),
}))

const { getMenuForTenant } = await import('../menu')

const PILOT_ID = 1
const DECOY_ID = 2

describe('getMenuForTenant', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries all four collections scoped to the tenant and active/available flags', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    await getMenuForTenant(PILOT_ID)

    expect(mockFind).toHaveBeenCalledWith({
      collection: 'menu-categories',
      where: { restaurant: { equals: PILOT_ID }, active: { equals: true } },
      sort: 'order',
      limit: 0,
    })
    expect(mockFind).toHaveBeenCalledWith({
      collection: 'menu-items',
      where: { restaurant: { equals: PILOT_ID }, available: { equals: true } },
      limit: 0,
    })
    expect(mockFind).toHaveBeenCalledWith({
      collection: 'modifiers',
      where: { restaurant: { equals: PILOT_ID }, active: { equals: true } },
      limit: 0,
    })
    expect(mockFind).toHaveBeenCalledWith({
      collection: 'modifier-options',
      where: { restaurant: { equals: PILOT_ID }, active: { equals: true } },
      limit: 0,
    })
  })

  it('assembles a nested tree: category -> items -> modifiers -> options', async () => {
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'menu-categories') {
        return Promise.resolve({ docs: [{ id: 1, name: 'Coffee', order: 1 }] })
      }
      if (collection === 'menu-items') {
        return Promise.resolve({
          docs: [{ id: 10, name: 'Cappuccino', description: null, price: 4.5, category: 1 }],
        })
      }
      if (collection === 'modifiers') {
        return Promise.resolve({
          docs: [{ id: 101, name: 'Size', type: 'single', required: true, menuItem: 10 }],
        })
      }
      if (collection === 'modifier-options') {
        return Promise.resolve({
          docs: [{ id: 201, label: 'Large', priceAdjustment: 1, modifier: 101 }],
        })
      }
      return Promise.resolve({ docs: [] })
    })

    const result = await getMenuForTenant(PILOT_ID)

    expect(result).toEqual([
      {
        id: 1,
        name: 'Coffee',
        order: 1,
        items: [
          {
            id: 10,
            name: 'Cappuccino',
            description: null,
            price: 4.5,
            modifiers: [
              {
                id: 101,
                name: 'Size',
                type: 'single',
                required: true,
                options: [{ id: 201, label: 'Large', priceAdjustment: 1 }],
              },
            ],
          },
        ],
      },
    ])
  })

  it('keeps items with zero modifiers and categories with zero items', async () => {
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'menu-categories') {
        return Promise.resolve({ docs: [{ id: 1, name: 'Empty Category', order: 1 }] })
      }
      return Promise.resolve({ docs: [] })
    })

    const result = await getMenuForTenant(PILOT_ID)

    expect(result).toEqual([{ id: 1, name: 'Empty Category', order: 1, items: [] }])
  })

  it('never mixes decoy tenant rows into a pilot query', async () => {
    mockFind.mockImplementation(({ where }: { where: { restaurant: { equals: number } } }) => {
      if (where.restaurant.equals === PILOT_ID) {
        return Promise.resolve({ docs: [{ id: 1, name: 'Pilot Category', order: 1 }] })
      }
      return Promise.resolve({ docs: [{ id: 2, name: 'Decoy Category', order: 1 }] })
    })

    const result = await getMenuForTenant(PILOT_ID)

    expect(result).toEqual([{ id: 1, name: 'Pilot Category', order: 1, items: [] }])
    expect(result.some((c) => c.name === 'Decoy Category')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/server/db/__tests__/menu.test.ts`
Expected: FAIL — `Cannot find module '../menu'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/server/db/menu.ts`:

```typescript
import { getPayload } from '@/lib/payload'
import type { MenuCategory, MenuItem, Modifier, ModifierOption } from '@/payload-types'

export interface MenuOptionView {
  id: number
  label: string
  priceAdjustment: number
}

export interface MenuModifierView {
  id: number
  name: string
  type: 'single' | 'multi'
  required: boolean
  options: MenuOptionView[]
}

export interface MenuItemView {
  id: number
  name: string
  description: MenuItem['description']
  price: number
  modifiers: MenuModifierView[]
}

export interface MenuCategoryView {
  id: number
  name: string
  order: number
  items: MenuItemView[]
}

export async function getMenuForTenant(restaurantId: number): Promise<MenuCategoryView[]> {
  const payload = await getPayload()

  const [categories, items, modifiers, options] = await Promise.all([
    payload.find({
      collection: 'menu-categories',
      where: { restaurant: { equals: restaurantId }, active: { equals: true } },
      sort: 'order',
      limit: 0,
    }),
    payload.find({
      collection: 'menu-items',
      where: { restaurant: { equals: restaurantId }, available: { equals: true } },
      limit: 0,
    }),
    payload.find({
      collection: 'modifiers',
      where: { restaurant: { equals: restaurantId }, active: { equals: true } },
      limit: 0,
    }),
    payload.find({
      collection: 'modifier-options',
      where: { restaurant: { equals: restaurantId }, active: { equals: true } },
      limit: 0,
    }),
  ])

  const optionsByModifier = new Map<number, MenuOptionView[]>()
  for (const option of options.docs as ModifierOption[]) {
    const modifierId = typeof option.modifier === 'number' ? option.modifier : option.modifier.id
    const list = optionsByModifier.get(modifierId) ?? []
    list.push({ id: option.id, label: option.label, priceAdjustment: option.priceAdjustment ?? 0 })
    optionsByModifier.set(modifierId, list)
  }

  const modifiersByItem = new Map<number, MenuModifierView[]>()
  for (const modifier of modifiers.docs as Modifier[]) {
    const itemId = typeof modifier.menuItem === 'number' ? modifier.menuItem : modifier.menuItem.id
    const list = modifiersByItem.get(itemId) ?? []
    list.push({
      id: modifier.id,
      name: modifier.name,
      type: modifier.type,
      required: modifier.required ?? false,
      options: optionsByModifier.get(modifier.id) ?? [],
    })
    modifiersByItem.set(itemId, list)
  }

  const itemsByCategory = new Map<number, MenuItemView[]>()
  for (const item of items.docs as MenuItem[]) {
    const categoryId = typeof item.category === 'number' ? item.category : item.category.id
    const list = itemsByCategory.get(categoryId) ?? []
    list.push({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      modifiers: modifiersByItem.get(item.id) ?? [],
    })
    itemsByCategory.set(categoryId, list)
  }

  return (categories.docs as MenuCategory[]).map((category) => ({
    id: category.id,
    name: category.name,
    order: category.order ?? 0,
    items: itemsByCategory.get(category.id) ?? [],
  }))
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/server/db/__tests__/menu.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Export from the choke-point barrel**

In `src/server/db/index.ts`, add:

```typescript
export { getMenuForTenant } from './menu'
export type { MenuCategoryView, MenuItemView, MenuModifierView, MenuOptionView } from './menu'
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/server/db/menu.ts src/server/db/__tests__/menu.test.ts src/server/db/index.ts
git commit -m "feat: add getMenuForTenant data-access function (S2)"
```

---

### Task 4: `getMenu` service

**Files:**
- Create: `src/server/ordering/menu.ts`
- Create: `src/server/ordering/__tests__/menu.test.ts`

**Interfaces:**
- Consumes: `resolveSlug` from `src/server/db` (returns `Restaurant | null`), `getMenuForTenant` from `src/server/db` (Task 3).
- Produces:
  ```typescript
  export async function getMenu(slug: string): Promise<MenuCategoryView[] | null>
  ```
  Consumed by Task 5's route handler and Task 6's diner page.

- [ ] **Step 1: Write the failing test**

Create `src/server/ordering/__tests__/menu.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockResolveSlug = vi.fn()
const mockGetMenuForTenant = vi.fn()

vi.mock('@/server/db', () => ({
  resolveSlug: mockResolveSlug,
  getMenuForTenant: mockGetMenuForTenant,
}))

const { getMenu } = await import('../menu')

describe('getMenu', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when the slug does not resolve to a tenant', async () => {
    mockResolveSlug.mockResolvedValue(null)

    const result = await getMenu('unknown-slug')

    expect(result).toBeNull()
    expect(mockGetMenuForTenant).not.toHaveBeenCalled()
  })

  it('delegates to getMenuForTenant with the resolved restaurant id', async () => {
    mockResolveSlug.mockResolvedValue({ id: 7, name: 'Pilot Café', slug: 'pilot', active: true })
    mockGetMenuForTenant.mockResolvedValue([{ id: 1, name: 'Coffee', order: 1, items: [] }])

    const result = await getMenu('pilot')

    expect(mockGetMenuForTenant).toHaveBeenCalledWith(7)
    expect(result).toEqual([{ id: 1, name: 'Coffee', order: 1, items: [] }])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/server/ordering/__tests__/menu.test.ts`
Expected: FAIL — `Cannot find module '../menu'`.

- [ ] **Step 3: Write the implementation**

Create `src/server/ordering/menu.ts`:

```typescript
import { resolveSlug, getMenuForTenant } from '@/server/db'
import type { MenuCategoryView } from '@/server/db'

export async function getMenu(slug: string): Promise<MenuCategoryView[] | null> {
  const restaurant = await resolveSlug(slug)
  if (!restaurant) return null
  return getMenuForTenant(restaurant.id)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/server/ordering/__tests__/menu.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/server/ordering/menu.ts src/server/ordering/__tests__/menu.test.ts
git commit -m "feat: add getMenu ordering service (S2)"
```

---

### Task 5: `GET /api/shop/:slug/menu` route handler

**Files:**
- Create: `src/app/api/shop/[slug]/menu/route.ts`
- Create: `src/app/api/shop/[slug]/menu/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `getMenu` from `src/server/ordering/menu.ts` (Task 4); `CACHE_TAGS.menu` from `src/lib/cache.ts`.
- Produces: `GET` handler at `/api/shop/:slug/menu` — `200` with `MenuCategoryView[]` body, or `404` with `{ error: { code: 'RESTAURANT_NOT_FOUND', message, details: [] } }`.

- [ ] **Step 1: Write the failing test**

Create `src/app/api/shop/[slug]/menu/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetMenu = vi.fn()

vi.mock('@/server/ordering/menu', () => ({
  getMenu: mockGetMenu,
}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

const { GET } = await import('../route')

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

describe('GET /api/shop/:slug/menu', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with the menu tree for a known slug', async () => {
    mockGetMenu.mockResolvedValue([{ id: 1, name: 'Coffee', order: 1, items: [] }])

    const response = await GET(new Request('http://localhost/api/shop/pilot/menu'), makeParams('pilot'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([{ id: 1, name: 'Coffee', order: 1, items: [] }])
  })

  it('returns 200 [] for a tenant with no active categories', async () => {
    mockGetMenu.mockResolvedValue([])

    const response = await GET(new Request('http://localhost/api/shop/pilot/menu'), makeParams('pilot'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([])
  })

  it('returns 404 RESTAURANT_NOT_FOUND for an unknown slug', async () => {
    mockGetMenu.mockResolvedValue(null)

    const response = await GET(
      new Request('http://localhost/api/shop/unknown/menu'),
      makeParams('unknown'),
    )
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      error: { code: 'RESTAURANT_NOT_FOUND', message: 'Restaurant not found', details: [] },
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/app/api/shop/[slug]/menu/__tests__/route.test.ts`
Expected: FAIL — `Cannot find module '../route'`.

- [ ] **Step 3: Write the implementation**

Create `src/app/api/shop/[slug]/menu/route.ts`:

```typescript
import { unstable_cache } from 'next/cache'
import { getMenu } from '@/server/ordering/menu'
import { CACHE_TAGS } from '@/lib/cache'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  const { slug } = await params

  const cachedGetMenu = unstable_cache(() => getMenu(slug), ['menu', slug], {
    tags: [CACHE_TAGS.menu],
  })
  const menu = await cachedGetMenu()

  if (menu === null) {
    return Response.json(
      { error: { code: 'RESTAURANT_NOT_FOUND', message: 'Restaurant not found', details: [] } },
      { status: 404 },
    )
  }

  return Response.json(menu, { status: 200 })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/app/api/shop/[slug]/menu/__tests__/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/shop/\[slug\]/menu/route.ts src/app/api/shop/\[slug\]/menu/__tests__/route.test.ts
git commit -m "feat: add GET /api/shop/:slug/menu route handler (S2)"
```

---

### Task 6: Diner page renders the menu

**Files:**
- Modify: `src/app/(frontend)/r/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getMenu` from `@/server/ordering/menu` (Task 4), `MenuCategoryView` type from `@/server/db` (Task 3).

- [ ] **Step 1: Replace the stub with a menu render**

Current file (`src/app/(frontend)/r/[slug]/page.tsx`) fetches the restaurant via `resolveSlug` wrapped in `unstable_cache` and renders a "Digital menu coming soon" placeholder. Replace its body to also fetch and render the menu:

```typescript
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { resolveSlug } from '@/server/db'
import { getMenu } from '@/server/ordering/menu'
import { CACHE_TAGS } from '@/lib/cache'

interface Props {
  params: Promise<{ slug: string }>
}

const getRestaurant = (slug: string) =>
  unstable_cache(() => resolveSlug(slug), [`restaurant-${slug}`], { revalidate: 60 })()

const getCachedMenu = (slug: string) =>
  unstable_cache(() => getMenu(slug), [`menu-${slug}`], { tags: [CACHE_TAGS.menu] })()

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await getRestaurant(slug)
  if (!restaurant) return { title: 'Not Found' }
  return { title: restaurant.name }
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params
  const restaurant = await getRestaurant(slug)
  if (!restaurant) notFound()

  const menu = await getCachedMenu(slug)

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="font-serif text-4xl font-bold text-gray-900">{restaurant.name}</h1>
      {menu === null || menu.length === 0 ? (
        <p className="mt-4 text-gray-500">Menu coming soon.</p>
      ) : (
        menu.map((category) => (
          <section key={category.id} className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900">{category.name}</h2>
            <ul className="mt-4 space-y-4">
              {category.items.map((item) => (
                <li key={item.id}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-gray-700">${item.price.toFixed(2)}</span>
                  </div>
                  {item.modifiers.map((modifier) => (
                    <div key={modifier.id} className="mt-1 pl-4 text-sm text-gray-500">
                      {modifier.name}
                      {modifier.required ? ' (required)' : ''}:{' '}
                      {modifier.options
                        .map((option) =>
                          option.priceAdjustment
                            ? `${option.label} (+$${option.priceAdjustment.toFixed(2)})`
                            : option.label,
                        )
                        .join(', ')}
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`
Navigate to `http://localhost:3000/r/pilot` (or whatever slug the pilot tenant was seeded with in S0). Confirm the page renders the pilot's categories/items/modifiers/options if any exist, or "Menu coming soon." if the tenant has no active categories yet. Navigate to `http://localhost:3000/r/does-not-exist` and confirm it 404s.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(frontend)/r/[slug]/page.tsx"
git commit -m "feat: render diner menu on /r/:slug page (S2)"
```

---

### Task 7: BUILD_STATUS update

**Files:**
- Modify: `docs/BUILD_STATUS.md`

**Interfaces:**
- Consumes: all prior tasks complete and committed.

- [ ] **Step 1: Update the S2 row**

In `docs/BUILD_STATUS.md`, change the S2 row (currently line 26) from:

```markdown
| S2 | Diner menu read — `GET /api/shop/:slug/menu` (cached). **Must also add `afterChange`/`afterDelete` → `safeRevalidateTag(CACHE_TAGS.menu)` hooks to `Modifiers`/`ModifierOptions` (S1 deferred these; see S1 spec's "Follow-up required in S2")** | ⬜ | — |
```

to:

```markdown
| S2 | Diner menu read — `GET /api/shop/:slug/menu` (cached); `Modifiers`/`ModifierOptions` cache hooks added; `/r/:slug` renders the tree | ✅ | Vitest: `getMenuForTenant` (tenant isolation + tree assembly), `getMenu` service, route handler (200/`200 []`/404); `<commit-hash>` |
```

- [ ] **Step 2: Update the "Current status" section**

In `docs/BUILD_STATUS.md` (lines 13–16), update to note S2 complete and S3 next, following the same style as the existing S1-complete sentence.

- [ ] **Step 3: Commit**

```bash
git add docs/BUILD_STATUS.md
git commit -m "docs: mark S2 complete in BUILD_STATUS"
```

---

## Self-Review Notes

- **Spec coverage:** Part 1 (cache hooks) → Task 1. Part 2 (`MenuCategories.active`) → Task 2. Part 3 (`getMenuForTenant`) → Task 3. Part 4 (`getMenu` service) → Task 4. Part 5 (route handler) → Task 5. Part 6 (diner page) → Task 6. Testing approach's three test files → Tasks 3/4/5 respectively.
- **Type consistency:** `MenuCategoryView`/`MenuItemView`/`MenuModifierView`/`MenuOptionView` defined in Task 3, re-exported from `src/server/db/index.ts`, consumed by name in Task 4 (`getMenu` return type) and Task 6 (page rendering) without renaming.
- **Tenant isolation covered:** Task 3's test suite includes an explicit pilot≠decoy assertion, matching the existing `resolveSlug`/`getSettingsForTenant` test pattern and the Product-mode "Full" rigor dial on tenancy.
- **Cache invalidation ordering:** Task 1 (hooks) intentionally precedes Task 5 (the cached route) so there's never a window where the cached route exists without invalidation wired up.
