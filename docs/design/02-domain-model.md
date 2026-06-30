# 2 · Domain Model  `[PRODUCTION DEPTH]`

**Architect's question:** *What are the true entities, what rules must always hold, and where are the consistency boundaries?*

An agent can infer a schema from entities. It **cannot** infer invariants — so those are the heart of this document.

---

## Glossary (ubiquitous language)

- **Restaurant (Tenant)** — one café/venue; the isolation scope. Every tenant-owned record belongs to exactly one.
- **Category** — an ordered grouping of menu items within a restaurant.
- **MenuItem** — a sellable product (base price); belongs to one Category.
- **Modifier** — a named choice-group attached to a MenuItem (e.g. "Size"), `single-select` or `multi-select`, optionally `required`.
- **ModifierOption** — one choice within a Modifier (e.g. "Large"), carrying a price adjustment.
- **Order** — a placed basket for one restaurant; has a per-café order number, a status, and a total.
- **OrderItem** — a **snapshotted** line within an Order (item name, unit price, chosen modifiers), frozen at checkout.
- **Snapshot** — the copy of menu data stored on an OrderItem at checkout, making the Order independent of later menu edits.
- **Line total** — `(unitPrice + Σ option adjustments) × quantity`.
- **Voluntary digital-order share** — the Artifact 1 validation metric (excludes cancelled orders).

## High-level flow (the journey)

The narrative form of the state machines below — the path each actor takes, not the screens.

- **Diner.** Scan the table QR → land on the café's menu (`/r/<slug>`) → browse categories/items → pick an item and choose its modifiers → add to cart → review cart → check out → receive an order number → show it to staff to pay in person.
- **Staff.** Open the dashboard → see pending orders (newest first, polled ~2s) → read an order → **confirm** it (or **cancel** a bogus/duplicate) → it leaves the board.
- **Café admin / owner.** Sign in to the Payload admin → manage the menu (categories, items, modifiers, options; soft-delete / reactivate / mark sold-out) → changes flow to the diner menu read.
- **Platform super-admin.** Onboard a new café — create the Restaurant + slug + its admin user, seed an empty menu.

> The `Order` state machine (`PENDING → CONFIRMED | CANCELLED`) derives from the diner→staff handoff; the menu-entity `active` lifecycle derives from the admin journey.

## Entities (name — key attributes — purpose)

> Implementation-agnostic. DB types, indexes, and exact columns derive later. Every tenant-owned entity carries `restaurantId` (INV-7).

- **Restaurant** — `id, name, slug (unique), active` — the tenant / isolation scope.
- **User** — `id, restaurantId (null = platform super-admin), role, credentials` — authenticated café operator.
- **Category** — `id, restaurantId, name, displayOrder, active` — ordered grouping.
- **MenuItem** — `id, restaurantId, categoryId, name, description?, price, active` — sellable product; **aggregate root** for its modifiers.
- **Modifier** — `id, restaurantId, menuItemId, name, type(single|multi), required, active` — choice-group.
- **ModifierOption** — `id, restaurantId, modifierId, label, priceAdjustment, active` — one choice.
- **Order** — `id, restaurantId, sequenceNumber, orderNumber, status(PENDING|CONFIRMED|CANCELLED), totalPrice, createdAt` — **aggregate root** for its items.
- **OrderItem** — `id, orderId, menuItemId (ref only), itemName (snapshot), quantity, unitPrice (snapshot), selectedModifiers (snapshot)` — a frozen line.

`selectedModifiers` snapshot shape:
```json
[{ "modifierName": "Size", "options": [{ "label": "Large", "priceAdjustment": "1.00" }] }]
```

## Aggregates & consistency boundaries

- **Restaurant** = tenant root. A *scope*, not part of any transaction.
- **MenuItem** (root) → Modifiers → ModifierOptions. You edit an item + its modifiers as a unit; the *whole* menu is never one transaction. `Category` is a grouping entity, not a consistency boundary.
- **Order** (root) → OrderItems. **Closed via the snapshot**: it copies everything it needs, so it depends on nothing in the live menu afterward. Strongly consistent and atomic at checkout.
- **The seam:** an Order references `MenuItem` by id but renders only from its snapshot. This is why the **Menu side is cacheable** and the **Order side is strong** (Artifact 1). Order creation crosses to the live menu exactly once — to validate + snapshot, atomically.

## Invariants (must always hold)

1. **INV-1** — Prices are computed **server-side** from base price + option adjustments; a client-sent price is never trusted.
2. **INV-2** — A `required` modifier with no selection **rejects** the order.
3. **INV-3** — `OrderItem` **snapshots** `itemName`, `unitPrice`, and the full `selectedModifiers` (labels + adjustments) at checkout; order history never re-joins the live menu.
4. **INV-4** — Categories, items, modifiers, options are **soft-deleted** (`active:false`) only — never hard-deleted.
5. **INV-5** — Every MenuItem belongs to **exactly one** Category.
6. **INV-6** — Order number = `ORD-` + zero-padded **per-café** `sequenceNumber`; unique on `(restaurantId, sequenceNumber)`, assigned inside the order-creation transaction.
7. **INV-7** — Every Category, MenuItem, Modifier, ModifierOption, and Order belongs to **exactly one Restaurant**; every query is tenant-scoped. *(Enforcement → Artifact 3.)*
8. **INV-8** — Checkout **re-validates** every item and selected option against the live menu; any inactive one **rejects the whole order**.
9. **INV-9** — A `single-select` modifier accepts **at most one** option (exactly one if `required`); more than one rejects.
10. **INV-10** — A `multi-select` modifier accepts **0..n** options (≥1 if `required`). *No min/max selection limits in MVP — deferred two-way door.*
11. **INV-11** — Every submitted `optionId` must belong to its `modifierId`, and every modifier must belong to the ordered `MenuItem`. *(Integrity + anti-price-manipulation.)*
12. **INV-12** — Quantity is an integer ≥ 1.
13. **INV-13** — `Order.totalPrice` = Σ line totals, where line = `(unitPrice + Σ adjustments) × quantity`. *(Holds by construction — the server computes it.)*
14. **INV-14** — An order must contain **at least one** item.

## State machines

- **Order** — states: `PENDING` (initial), `CONFIRMED` (terminal), `CANCELLED` (terminal).
  - `PENDING → CONFIRMED` (staff confirm) · `PENDING → CANCELLED` (staff dismiss a bogus/duplicate order).
  - Illegal: any transition out of a terminal state; `PENDING → PENDING`. *(Cancel-after-confirm deferred.)*
  - Rationale: a complete machine — every order has a legitimate terminal resolution, so junk never has to be "confirmed" into real history.
- **Menu entities** (Category / MenuItem / Modifier / ModifierOption) — `active: true ⇄ false`, both directions (`false→true` = un-hide / back in stock).
- **Restaurant** — no lifecycle in MVP (exists once onboarded; suspend/offboard deferred with billing).
