# S1 · Modifiers + ModifierOptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tenant-scoped `Modifiers` and `ModifierOptions` Payload collections so an admin can attach choice-groups (e.g. "Size", "Extras") to a `MenuItem`.

**Architecture:** Two new top-level Payload collections, each a relationship child of an existing collection (`Modifiers` → `menu-items`, `ModifierOptions` → `modifiers`), registered with the existing `multiTenantPlugin` the same way `MenuCategories`/`MenuItems` already are. No new services, routes, or hooks — pure declarative Payload config.

**Tech Stack:** Payload CMS 3.85.1, TypeScript, `@payloadcms/plugin-multi-tenant`.

## Global Constraints

- Follow the exact pattern of `src/collections/MenuCategories.ts` / `src/collections/MenuItems.ts` — same `access` shape, same admin field layout conventions, same index style.
- `restaurant` tenant field is injected automatically by `multiTenantPlugin` — never declare it explicitly as a field.
- No cache-invalidation hooks on either collection (deferred to S2).
- No authoring-time cross-field validation (e.g. "required modifier must have ≥1 option") — deferred to S3 checkout invariants.
- After both collections are registered, run `npm run generate:types` to regenerate `src/payload-types.ts` (gitignored, not committed).
- Full spec: `docs/superpowers/specs/2026-07-01-s1-modifiers-design.md`.

---

### Task 1: `Modifiers` collection

**Files:**
- Create: `src/collections/Modifiers.ts`
- Modify: `src/collections/index.ts` (add export)
- Modify: `src/payload.config.ts` (register collection + plugin entry)

**Interfaces:**
- Produces: Payload collection slug `modifiers`, with fields `menuItem` (relationship → `menu-items`), `name` (text), `type` (select: `single` | `multi`), `required` (checkbox), `active` (checkbox). Later tasks (Task 2) relate to this collection via slug `modifiers`.

- [ ] **Step 1: Create the collection file**

```typescript
// src/collections/Modifiers.ts
import type { CollectionConfig } from 'payload'

export const Modifiers: CollectionConfig = {
  slug: 'modifiers',
  admin: {
    useAsTitle: 'name',
    group: 'Menu',
    defaultColumns: ['name', 'menuItem', 'type', 'required', 'active', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'menuItem',
      type: 'relationship',
      relationTo: 'menu-items',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'name',
      type: 'text',
      label: 'Modifier Name',
      required: true,
      admin: {
        description: 'e.g. "Size"',
      },
    },
    {
      name: 'type',
      type: 'select',
      label: 'Selection Type',
      required: true,
      options: [
        { label: 'Single-select', value: 'single' },
        { label: 'Multi-select', value: 'multi' },
      ],
    },
    {
      name: 'required',
      type: 'checkbox',
      label: 'Required',
      defaultValue: false,
      admin: {
        description: 'If checked, the diner must choose at least one option at checkout.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Uncheck to hide this modifier without deleting it.',
      },
    },
  ],
  indexes: [
    {
      fields: ['restaurant', 'menuItem'],
    },
  ],
}
```

- [ ] **Step 2: Export from the collections barrel**

In `src/collections/index.ts`, add after the `MenuItems` export:

```typescript
export { Modifiers } from './Modifiers'
```

- [ ] **Step 3: Register in `payload.config.ts`**

In `src/payload.config.ts`, add the import near the other collection imports:

```typescript
import { Modifiers } from './collections/Modifiers.ts'
```

Add `Modifiers` to the `collections: [...]` array, after `MenuItems`:

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
    Modifiers,
    GalleryImages,
    Events,
  ],
```

Add `modifiers: {}` to the `multiTenantPlugin({ collections: { ... } })` map, after `'menu-items': {}`:

```typescript
      collections: {
        'menu-categories': {},
        'menu-items': {},
        modifiers: {},
        'gallery-images': {},
        events: {},
        'tenant-site-settings': { isGlobal: true },
        'tenant-hero-sections': { isGlobal: true },
        'tenant-page-content': { isGlobal: true },
      },
```

- [ ] **Step 4: Regenerate types**

Run: `npm run generate:types`
Expected: exits 0; `src/payload-types.ts` now includes a `Modifier` type with fields `menuItem`, `name`, `type`, `required`, `active`, `restaurant`.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/collections/Modifiers.ts src/collections/index.ts src/payload.config.ts
git commit -m "feat: add Modifiers collection (S1)"
```

---

### Task 2: `ModifierOptions` collection

**Files:**
- Create: `src/collections/ModifierOptions.ts`
- Modify: `src/collections/index.ts` (add export)
- Modify: `src/payload.config.ts` (register collection + plugin entry)

**Interfaces:**
- Consumes: relationship target `modifiers` (slug from Task 1).
- Produces: Payload collection slug `modifier-options`, with fields `modifier` (relationship → `modifiers`), `label` (text), `priceAdjustment` (number), `active` (checkbox).

- [ ] **Step 1: Create the collection file**

```typescript
// src/collections/ModifierOptions.ts
import type { CollectionConfig } from 'payload'

export const ModifierOptions: CollectionConfig = {
  slug: 'modifier-options',
  admin: {
    useAsTitle: 'label',
    group: 'Menu',
    defaultColumns: ['label', 'modifier', 'priceAdjustment', 'active', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'modifier',
      type: 'relationship',
      relationTo: 'modifiers',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'label',
      type: 'text',
      label: 'Option Label',
      required: true,
      admin: {
        description: 'e.g. "Large"',
      },
    },
    {
      name: 'priceAdjustment',
      type: 'number',
      label: 'Price Adjustment (USD)',
      defaultValue: 0,
      admin: {
        description: 'Added to the base item price. Use a negative number for a discount.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Uncheck to hide this option without deleting it.',
      },
    },
  ],
  indexes: [
    {
      fields: ['restaurant', 'modifier'],
    },
  ],
}
```

- [ ] **Step 2: Export from the collections barrel**

In `src/collections/index.ts`, add after the `Modifiers` export:

```typescript
export { ModifierOptions } from './ModifierOptions'
```

- [ ] **Step 3: Register in `payload.config.ts`**

Add the import:

```typescript
import { ModifierOptions } from './collections/ModifierOptions.ts'
```

Add `ModifierOptions` to the `collections: [...]` array, after `Modifiers`:

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
    Modifiers,
    ModifierOptions,
    GalleryImages,
    Events,
  ],
```

Add `'modifier-options': {}` to the `multiTenantPlugin({ collections: { ... } })` map, after `modifiers: {}`:

```typescript
      collections: {
        'menu-categories': {},
        'menu-items': {},
        modifiers: {},
        'modifier-options': {},
        'gallery-images': {},
        events: {},
        'tenant-site-settings': { isGlobal: true },
        'tenant-hero-sections': { isGlobal: true },
        'tenant-page-content': { isGlobal: true },
      },
```

- [ ] **Step 4: Regenerate types**

Run: `npm run generate:types`
Expected: exits 0; `src/payload-types.ts` now includes a `ModifierOption` type with fields `modifier`, `label`, `priceAdjustment`, `active`, `restaurant`.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/collections/ModifierOptions.ts src/collections/index.ts src/payload.config.ts
git commit -m "feat: add ModifierOptions collection (S1)"
```

---

### Task 3: Manual admin smoke test + BUILD_STATUS update

**Files:**
- Modify: `docs/BUILD_STATUS.md`

**Interfaces:**
- Consumes: both collections registered and migrated from Tasks 1–2.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000` with no Payload schema errors in the console (Payload auto-applies schema changes to Postgres in dev).

- [ ] **Step 2: Log into `/admin` and locate the pilot restaurant's data**

Navigate to `http://localhost:3000/admin`, log in, and switch tenant context (top-of-admin tenant selector) to the pilot restaurant seeded in S0.

- [ ] **Step 3: Create a MenuItem to attach modifiers to (or use an existing seeded one)**

Under **Menu → Menu Items**, open or create one item (e.g. "Burger").

- [ ] **Step 4: Create a required single-select Modifier**

Under **Menu → Modifiers**, create:
- `menuItem`: the item from Step 3
- `name`: "Size"
- `type`: Single-select
- `required`: checked

Save. Confirm it saves without error and appears in the Modifiers list scoped to the pilot tenant only (switch tenant to decoy and confirm it does NOT appear).

- [ ] **Step 5: Create two ModifierOptions under "Size"**

Under **Menu → Modifier Options**, create:
- `modifier`: "Size" from Step 4, `label`: "Small", `priceAdjustment`: 0
- `modifier`: "Size" from Step 4, `label`: "Large", `priceAdjustment`: 2

Save both. Confirm both persist and show the correct `modifier` relationship.

- [ ] **Step 6: Create an optional multi-select Modifier + option**

Under **Menu → Modifiers**, create:
- `menuItem`: same item, `name`: "Extras", `type`: Multi-select, `required`: unchecked

Under **Menu → Modifier Options**, create one option under "Extras" (e.g. `label`: "Extra Cheese", `priceAdjustment`: 1).

Save. Confirm it persists correctly.

- [ ] **Step 7: Update BUILD_STATUS.md**

In `docs/BUILD_STATUS.md`, update the S1 row (currently line 24) from:

```markdown
| S1 | Menu authoring: `Modifiers` + `ModifierOptions` collections | ⬜ | — |
```

to:

```markdown
| S1 | Menu authoring: `Modifiers` + `ModifierOptions` collections | ✅ | Manual admin smoke test: required single-select + optional multi-select created, tenant-scoped (pilot≠decoy); `<commit-hash>` |
```

Also update the "Current status" section (lines 13–16) to reflect S1 done, S2 next.

- [ ] **Step 8: Commit**

```bash
git add docs/BUILD_STATUS.md
git commit -m "docs: mark S1 complete in BUILD_STATUS"
```

---

## Self-Review Notes

- **Spec coverage:** Both collections (Modifiers, ModifierOptions) fully specified per the design spec's field tables; wiring steps (config, plugin, barrel export, type regen) covered in Tasks 1–2; manual acceptance criteria from the spec covered in Task 3.
- **No cache hooks, no cross-field validation** — correctly omitted per spec's "explicitly out of scope" section.
- **Type consistency:** `Modifiers` relationship target slug `modifiers` (Task 1) matches `ModifierOptions.modifier`'s `relationTo: 'modifiers'` (Task 2). `menu-items` slug matches the existing `MenuItems` collection's slug.
