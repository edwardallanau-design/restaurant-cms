# Issues — Digital Menu & Ordering System

Bugs and defects encountered during development, and how they were fixed. Distinct from
[`IMPROVEMENTS.md`](IMPROVEMENTS.md) (deferred gaps/tech debt, not yet wrong) — this file is for
things that were actually broken and got fixed, kept for traceability so a similar bug doesn't get
re-introduced without someone noticing the pattern.

**Maintained the same way as [`BUILD_STATUS.md`](BUILD_STATUS.md):** add an entry when a bug is
found (via review, testing, or manual smoke test); update with the fix commit once resolved; commit
alongside the fix.

Status key: 🔴 open · ✅ fixed

---

## BUG-1 — Broken test fixture forced an unneeded defensive guard into production code

**Found:** S2, Task 3 review (`getMenuForTenant`), 2026-07-02.

**What happened:** the tenant-isolation test's mock (`'never mixes decoy tenant rows into a pilot
query'`) returned the same category-shaped object for *every* collection query (categories, items,
modifiers, options), regardless of which collection was actually being queried. This meant the
mocked "modifier-options" response had no `modifier` field, "modifiers" had no `menuItem` field, etc.
To stop the test crashing (`Cannot read properties of undefined (reading 'id')`), the implementer
added `== null` guards in `src/server/db/menu.ts`'s grouping loops that silently skipped any row with
a missing parent-relation field.

**Why it was a real bug, not just a test fix:** `ModifierOption.modifier`, `Modifier.menuItem`, and
`MenuItem.category` are all `required: true` in their Payload schemas, so a null parent relation
cannot occur through normal validation. The guards were masking a fixture bug by adding an
unspecified "silently drop orphaned rows" behavior to production code — a real data-integrity bug
(e.g. a stale FK after an out-of-band DB edit) would now vanish from the menu silently instead of
surfacing as an error.

**Fix:** rewrote the test fixture to branch on both `collection` and `where.restaurant.equals`,
returning realistic, well-formed nested data per tenant. Removed the `== null` guards, restoring
unconditional relation-ID resolution.

**Commit:** `4a9f8bd` — "fix: replace broken test fixture with realistic mock, remove unneeded null
guards (S2 review fix)"

**Status:** ✅ fixed. See [`IMPROVEMENTS.md`](IMPROVEMENTS.md) I5 for the follow-up (a suggested
comment documenting the `required: true` invariant these loops rely on).

---

## BUG-2 — Negative `priceAdjustment` (discounts) rendered as `(+$-1.00)` on the diner page

**Found:** S2, Task 6 review (diner page rendering), 2026-07-02.

**What happened:** `ModifierOptions.priceAdjustment` explicitly supports negative values for
discounts (per the field's own admin description: "Use a negative number for a discount"). The
diner page's rendering ternary (`option.priceAdjustment ? `${label} (+$${adjustment.toFixed(2)})` :
label`) always prefixed with `+`, so a `-1.00` discount rendered as the nonsensical `(+$-1.00)`.

**Fix:** changed the format to check sign explicitly — `-$X.XX` for discounts, `+$X.XX` for
surcharges, using `Math.abs()` for the magnitude.

**Commit:** `9b99463` — "fix: format negative priceAdjustment correctly on diner menu page (S2
review fix)"

**Status:** ✅ fixed.

---

## BUG-3 — Menu items rendered in DB-arbitrary order, ignoring `MenuItems.order`

**Found:** S2, final whole-branch review, 2026-07-02.

**What happened:** `MenuItems.order` ("Lower numbers appear first within the category") was defined
in the schema but never applied — the `menu-items` query in `src/server/db/menu.ts` had no `sort`
clause (unlike the `menu-categories` query, which correctly sorted by `order`). Items within a
category rendered in roughly insertion/id order regardless of an author's intended ordering.

**Fix:** added `sort: 'order'` to the `menu-items` `payload.find()` call, matching the existing
`menu-categories` query.

**Commit:** `23910bb` — "fix: sort menu items by display order (S2 final review fix)"

**Status:** ✅ fixed. Verified live via manual smoke test post-fix (cleared stale `.next/cache` and
confirmed the diner page and `/api/shop/:slug/menu` route agree on item order).

---

## BUG-4 — Soft-deleted required modifier would have bricked its item at checkout

**Found:** S3, Task 2 review escalation (before the service was built), 2026-07-02.

**What happened:** the original S3 plan fetched ALL modifiers (active + inactive) into the
checkout validation view; the service's required-modifier check would then demand a selection for
a soft-deleted required modifier that the S2 menu read hides from diners. Result: every order for
that item would fail `REQUIRED_MODIFIER_MISSING` at checkout, even though no diner ever saw the
option to select it.

**Why it mattered:** a silent failure mode — an author accidentally sets a modifier
`active: false` in the admin panel, and that restaurant's entire item becomes impossible to order.
No diner-facing error message, no indication in the menu; just all orders rejected. A soft-delete
at that layer is meant to be temporary (e.g. "out of stock"), not a way to "remove" something
permanently.

**Fix:** `getMenuItemsForValidation` now fetches active modifiers only (matching the S2 menu read's
filtering), using the same data-access layer filter. A selection referencing an inactive modifier
now fails `INVALID_MODIFIER_SELECTION` (doesn't belong to the validation view), and required-checks
skip it because the modifier is not present in the view. Covered by a dedicated checkout-service
test exercising a required modifier marked inactive.

**Commits:** `8bef485` (fix: fetch active modifiers only in checkout validation view (S3 review)) ·
`5bee5e3` (test: cover inactive required modifier at checkout (S3 review)).

**Status:** ✅ fixed.

---

## How to use this document

Log an entry when a review, test failure, or manual check reveals something that was actually
wrong (not just missing/deferred — that's `IMPROVEMENTS.md`). Include: what happened, why it
mattered (not just "test failed" — the underlying risk), the fix, and the commit. Flip to ✅ once
merged.
