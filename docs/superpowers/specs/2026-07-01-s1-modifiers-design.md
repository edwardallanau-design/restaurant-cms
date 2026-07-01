# S1 · Menu Authoring: Modifiers + ModifierOptions — Design Spec

**Date:** 2026-07-01
**Story:** S1 from [`docs/design/07-epic-map.md`](../../design/07-epic-map.md)
**Context artifacts:** Domain model → `02-domain-model.md` · Engineering decisions → `06b-engineering-decisions.md`

---

## What this story does

Adds authoring support for per-item choice groups (e.g. "Size": Small/Large; "Extras": optional add-ons) to the Payload admin. After S1 the system has:
- A `Modifiers` collection — a named choice-group attached to one `MenuItem` (`single` or `multi` select, optionally `required`)
- A `ModifierOptions` collection — one choice within a `Modifier`, carrying a price adjustment
- Both tenant-scoped via the existing multi-tenant plugin, following the `MenuCategories`/`MenuItems` pattern exactly

**Does not touch:** diner menu read (S2), checkout/ordering (S3), cache invalidation wiring (S2), authoring-time cross-field validation of checkout invariants (deferred to S3's server-side enforcement of INV-2/9/10/11).

---

## Entities (from `02-domain-model.md`)

- **Modifier** — `id, restaurantId, menuItemId, name, type(single|multi), required, active`
- **ModifierOption** — `id, restaurantId, modifierId, label, priceAdjustment, active`

`restaurantId` is injected automatically by `multiTenantPlugin` (INV-7) — not declared as an explicit field, matching every other tenant-scoped collection in this codebase.

## Collections

### `Modifiers`

**File:** `src/collections/Modifiers.ts` · **Slug:** `modifiers`

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `menuItem` | relationship → `menu-items` | required | Sidebar |
| `name` | text | required | e.g. "Size" |
| `type` | select | required, options `single` \| `multi` | |
| `required` | checkbox | default `false` | |
| `active` | checkbox | default `true` | Sidebar; soft-delete flag (INV-4) |

- **Admin:** `useAsTitle: 'name'`, `group: 'Menu'`, `defaultColumns: ['name', 'menuItem', 'type', 'required', 'active', 'updatedAt']`
- **Access:** `read: () => true`, `create/update/delete: Boolean(user)` — identical to `MenuItems`/`MenuCategories`
- **Index:** `['restaurant', 'menuItem']` (non-unique — an item has many modifiers)
- **No hooks** (cache invalidation deferred to S2; no authoring-time cross-field validation — deferred to S3 checkout invariants)

### `ModifierOptions`

**File:** `src/collections/ModifierOptions.ts` · **Slug:** `modifier-options`

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `modifier` | relationship → `modifiers` | required | Sidebar |
| `label` | text | required | e.g. "Large" |
| `priceAdjustment` | number | default `0` | No `min` — negative adjustments (discounts) allowed |
| `active` | checkbox | default `true` | Sidebar |

- **Admin:** `useAsTitle: 'label'`, `group: 'Menu'`, `defaultColumns: ['label', 'modifier', 'priceAdjustment', 'active', 'updatedAt']`
- **Access:** same pattern
- **Index:** `['restaurant', 'modifier']` (non-unique)
- **No hooks**

## Wiring

1. Register both collections in `src/payload.config.ts`'s `collections: [...]` array
2. Add `modifiers: {}` and `'modifier-options': {}` to `multiTenantPlugin({ collections: { ... } })` — empty config injects the standard `restaurant` tenant field
3. Export both from `src/collections/index.ts`
4. Run `npm run generate:types` to regenerate `src/payload-types.ts`

## Follow-up required in S2

`MenuCategories`/`MenuItems` both carry `afterChange`/`afterDelete` hooks calling `safeRevalidateTag(CACHE_TAGS.menu)`. `Modifiers`/`ModifierOptions` deliberately omit them here (no cached read path exists yet to invalidate) — this is the one point where S1 diverges from "follow the pattern exactly." **S2 must add the same `afterChange`/`afterDelete` → `safeRevalidateTag(CACHE_TAGS.menu)` hooks to both `Modifiers` and `ModifierOptions`** before or alongside building the cached diner menu read, otherwise editing a modifier/option won't invalidate the menu cache and diners will see stale option prices/labels until the parent item is re-saved.

## Explicitly out of scope (per epic map's scope boundary)

- No diner-facing read path (S2)
- No checkout/ordering logic (S3)
- No cache-tag revalidation hooks (deferred to S2, when the cached read path exists to invalidate)
- No authoring-time enforcement that a `required` modifier has ≥1 active option, or that `single`-select has exactly one selectable option — these are checkout-time invariants (INV-2/9/10/11) enforced server-side in S3, not admin-time validation

## Testing approach

Per the Product-mode dial (`06b-engineering-decisions.md`): full rigor applies to the ordering transaction path and tenancy; this story is authoring-only, outside both. No new Vitest suite — `MenuCategories`/`MenuItems` (the closest analogues) have none either, since there's no service/business logic, only declarative Payload config already exercised by Payload's own field/relationship machinery.

**Acceptance criteria (manual admin smoke test):**
- Admin creates a `MenuItem`, then a required single-select `Modifier` named "Size" with two `ModifierOptions` ("Small" / "Large")
- Admin adds an optional multi-select `Modifier` named "Extras" with one or more options
- Both persist tenant-scoped (visible only under the correct restaurant/tenant in admin) and appear correctly nested under the right `MenuItem` via the relationship fields
