# S3 · Checkout `POST /api/shop/:slug/orders` — Design Spec

**Date:** 2026-07-02
**Story:** S3 from [`docs/design/07-epic-map.md`](../../design/07-epic-map.md)
**Context artifacts:** Domain model + invariants → `02-domain-model.md` · API conventions → `05-api-conventions.md` · Engineering decisions → `06b-engineering-decisions.md` · Tenancy → `03-tenancy-model.md`

---

## What this story does

Adds the ordering **write** path: a diner's cart → `POST /api/shop/:slug/orders`. The server re-resolves and validates every line against the live tenant menu, computes the total, assigns a per-café order number inside a transaction, snapshots everything onto the Order, and persists it `PENDING`. This is the keystone story — it's the first write path in the system, the first place a DB transaction is needed, and the first place a typed domain-error taxonomy is needed.

**Does not touch:** payment, auth, staff view, order confirmation page (S4), the diner cart *UI* (client-side cart state is assumed to already produce the request shape — this story is the API only).

---

## Part 1 — `Orders` collection: `src/collections/Orders.ts`

Order is the aggregate root; OrderItem is **not** a separate Payload collection — it's an `array` field on Order (per domain model: "Order (root) → OrderItems... closed via the snapshot"). One write, no second collection to keep in sync.

| Field | Type | Notes |
|---|---|---|
| `sequenceNumber` | number | per-tenant counter value at creation time |
| `orderNumber` | text | `ORD-` + zero-padded `sequenceNumber` (e.g. `ORD-0042`); derived, stored for cheap reads |
| `status` | select (`PENDING`\|`CONFIRMED`\|`CANCELLED`) | default `PENDING` |
| `totalPrice` | number | server-computed, INV-1/13 |
| `items` | array | the OrderItem snapshot lines (below) |

`items` array field, each row:

| Field | Type | Notes |
|---|---|---|
| `menuItem` | relationship → `menu-items` | reference only, never re-read for display (INV-3) |
| `itemName` | text | snapshot |
| `unitPrice` | number | snapshot (base price at order time) |
| `quantity` | number | integer ≥ 1 |
| `selectedModifiers` | json | snapshot shape from `05-api-conventions.md`: `[{ modifierName, options: [{ label, priceAdjustment }] }]` |

Tenant field (`restaurant`) is injected automatically by `plugin-multi-tenant`, same as every other tenant-owned collection — no manual field needed (confirmed: `MenuItems.ts` doesn't declare it either).

`access`: `read`/`update`/`delete` gated on `Boolean(user)` (staff/admin only — matches `MenuItems.ts` pattern); `create: () => true` (anonymous diners create orders through the Local API call in `createOrderForTenant`, same trust model as the rest of the diner-facing write path — tenant scoping is enforced by the service passing the locked `restaurantId`, not by Payload access control). No `overrideAccess` needed — this mirrors how `resolveSlug`/`getMenuForTenant` already rely on permissive `read` rules rather than bypassing access control.

No `afterChange` cache-invalidation hook — Orders aren't cached (S4/S5 read them fresh; INV-3 means the order side is intentionally *not* the cacheable side, per `02-domain-model.md`'s "the seam").

Add a **`lastOrderSequence`** field (number, default `0`) to the existing `Restaurants` collection — this is the per-tenant counter INV-6 increments. Lives on Restaurant (not a separate counter collection) because it's a single scalar naturally scoped by the row you're already locking.

---

## Part 2 — Data access: `src/server/db/orders.ts`

```ts
export async function getMenuItemsForValidation(
  restaurantId: number,
  menuItemIds: number[],
): Promise<MenuItemValidationView[]>
```
Tenant-scoped fetch of *only* the referenced MenuItems + their Modifiers + ModifierOptions — **items and options include inactive rows** (checkout must see `active: false`/`available: false` to reject with `ITEM_INACTIVE`/`OPTION_INACTIVE`; the S2 read path filters inactive out entirely, so it can't be reused here). **Modifiers, by contrast, are fetched active-only**: an inactive modifier is hidden from the menu (S2), so checkout treats it as not belonging to the item — a selection referencing it fails `INVALID_MODIFIER_SELECTION`, and an inactive *required* modifier no longer blocks the item from being ordered (otherwise soft-deleting a required modifier would make its item permanently unorderable while looking fine on the menu). Same 3-query-and-assemble pattern as `getMenuForTenant` in `menu.ts`, but scoped by `id: { in: menuItemIds }` on the top query instead of pulling the whole tenant menu.

```ts
export async function createOrderForTenant(
  restaurantId: number,
  priced: PricedOrder,
): Promise<{ orderNumber: string; totalPrice: number; status: string; createdAt: string }>
```
The transactional write (INV-6). Using Payload's Local API transaction support:
1. `const transactionID = await payload.db.beginTransaction()`
2. `payload.findByID({ collection: 'restaurants', id: restaurantId, req: { transactionID } })` — Postgres row-locks the Restaurant row for the duration of the transaction (Payload's Postgres adapter uses `SELECT ... FOR UPDATE` semantics under an open transaction for a lookup-then-write on the same row).
3. Increment `lastOrderSequence` via `payload.update(..., { req: { transactionID } })`, read back the new value as `sequenceNumber`.
4. `payload.create({ collection: 'orders', data: { sequenceNumber, orderNumber: 'ORD-' + pad(sequenceNumber), status: 'PENDING', totalPrice, items }, req: { transactionID }, overrideAccess: true })`.
5. `commitTransaction`; any thrown error → `rollbackTransaction` then rethrow.

Different tenants never contend for the same lock (row-scoped), so concurrent checkouts across cafés don't serialize against each other — only concurrent checkouts *within* the same café do, which is exactly the INV-6 requirement.

Exported from `src/server/db/index.ts` alongside existing choke-point functions.

---

## Part 3 — Domain errors: `src/server/ordering/errors.ts`

First typed error taxonomy in the codebase (S0–S2 only needed `null`-return-to-404).

```ts
export type DomainErrorCode =
  | 'ITEM_INACTIVE' | 'OPTION_INACTIVE' | 'INVALID_MODIFIER_SELECTION'
  | 'REQUIRED_MODIFIER_MISSING' | 'EMPTY_ORDER' | 'INVALID_QUANTITY'

export class DomainError extends Error {
  constructor(public code: DomainErrorCode, message: string) { super(message) }
}

const STATUS_BY_CODE: Record<DomainErrorCode, number> = { ...all 422... }

export function toErrorResponse(error: DomainError): Response
```
Matches `06b-engineering-decisions.md` §3: a single flat `code`, no class-per-error taxonomy, one mapping function. `RESTAURANT_NOT_FOUND` stays a plain `null`-return (existing S2 pattern), not a `DomainError` — it's a 404 resolved before checkout logic runs, same shape as the menu route.

---

## Part 4 — Zod shape schema: `src/server/ordering/checkout.schema.ts`

Structural validation only (400, not 422) — draws the line as `05-api-conventions.md` intends:

```ts
const cartSchema = z.object({
  items: z.array(z.object({
    menuItemId: z.number().int().positive(),
    quantity: z.number().int(),          // sign/lower-bound is a DOMAIN rule (INV-12) — Zod only checks it's an int
    selectedModifiers: z.array(z.object({
      modifierId: z.number().int().positive(),
      optionIds: z.array(z.number().int().positive()),
    })),
  })),   // emptiness of `items` is EMPTY_ORDER (domain, 422) — Zod only checks it's an array
})
```
Malformed JSON, wrong types, missing fields → `400`. Everything semantic (empty cart, qty ≤ 0, inactive rows, cardinality, integrity, required-missing) is hand-written in the service and 422s.

---

## Part 5 — Service: `src/server/ordering/checkout.ts`

```ts
export async function checkout(slug: string, cart: Cart): Promise<CheckoutResult | null>
```
`null` → unknown tenant (route maps to 404, same convention as `getMenu`). Otherwise throws `DomainError` on any invariant violation, or returns the created order's response shape.

Steps:
1. `resolveSlug(slug)` → `null` short-circuits to `null`.
2. `cart.items.length === 0` → throw `EMPTY_ORDER`.
3. `getMenuItemsForValidation(restaurant.id, cart.items.map(i => i.menuItemId))`.
4. **Per line, in this order (fail-fast — first violation across the whole cart wins, no aggregation):**
   a. Item exists in the fetched set and `active`/`available` — else `ITEM_INACTIVE` (an id that doesn't resolve at all is indistinguishable from inactive, from the diner's POV, so it's treated the same).
   b. Every `selectedModifiers[].modifierId` belongs to this item, every `optionIds[]` belongs to its modifier, and every referenced option is active — else `INVALID_MODIFIER_SELECTION` (integrity + anti-price-manipulation, INV-11) or `OPTION_INACTIVE`.
   c. Single-select modifiers: submitted `optionIds.length <= 1` — else `INVALID_MODIFIER_SELECTION` (INV-9).
   d. Required modifiers (single or multi) have `optionIds.length >= 1` — else `REQUIRED_MODIFIER_MISSING` (INV-2/10).
   e. `quantity >= 1` — else `INVALID_QUANTITY` (INV-12).
5. Duplicate `menuItemId` across lines is **allowed** — no merge/reject logic; each cart entry becomes its own OrderItem.
6. Price every line: `lineTotal = (unitPrice + Σ selected option priceAdjustment) × quantity`; sum → `totalPrice` (INV-1/13, purely server-computed — a client-sent price field, if present, is never read since the Zod schema doesn't even accept one).
7. Build the snapshot `items` array (itemName, unitPrice, quantity, selectedModifiers with resolved labels/adjustments).
8. `createOrderForTenant(restaurant.id, { items, totalPrice })` → transactional create.
9. Return `{ orderNumber, totalPrice, status: 'PENDING', createdAt }`.

---

## Part 6 — Route handler: `src/app/api/shop/[slug]/orders/route.ts`

```ts
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> })
```
- Parse JSON body; `cartSchema.safeParse` failure → `400` with the standard envelope.
- Call `checkout(slug, cart)`; catch `DomainError` → `toErrorResponse(error)`; `null` result → `404 RESTAURANT_NOT_FOUND`; success → `201` with `{ orderNumber, totalPrice, status, createdAt }`.
- No `unstable_cache` — this is a write, not a cached read.
- No auth (diner endpoint, tenant from slug, per `05-api-conventions.md`).

---

## Testing approach

Per the Product-mode dial: this **is** the ordering transaction path + touches tenancy, so full rigor applies here (unlike S2's thin read-path testing).

- **`src/server/ordering/__tests__/checkout.test.ts`** — the bulk of the coverage: one test per `DomainError` code (each invariant triggers correctly), fail-fast check ordering (a line with two simultaneous violations surfaces the earlier one per the documented order), correct pricing arithmetic (matches the `05-api-conventions.md` worked example: `2 × (4.50+1.00+0.75+0.50) = 13.50`), duplicate-menuItemId lines both appear as independent OrderItems, unknown slug → `null`.
- **`src/server/db/__tests__/orders.test.ts`** — `getMenuItemsForValidation` includes inactive rows and is tenant-scoped (pilot ≠ decoy); `createOrderForTenant` sequence-under-concurrency test: two simultaneous calls for the same tenant get distinct `sequenceNumber`s (mocking Payload's transaction calls to simulate interleaving, or — if feasible against a real test DB — actually firing two concurrent calls and asserting no collision).
- **`src/app/api/shop/[slug]/orders/__tests__/route.test.ts`** — `201` + envelope shape on a valid cart; `400` on malformed JSON; each `422` code reachable through the route; `404` for unknown slug.

## Explicitly out of scope (per epic map's scope boundary)

- No payment, no auth, no staff view, no order confirmation page (S4)
- No diner cart UI/state management (this story is the API contract only)
- `details: []` in the error envelope stays empty (fail-fast returns one code, not an aggregated list)
