# Design Divergences — Digital Menu & Ordering System

Points where implementation consciously chose differently from, or filled a gap left by,
[`docs/design/`](design/README.md) (the source-of-truth context package). Routine implementation
judgment calls are **not** logged here — only decisions that either contradict a design doc's
literal text or fill in something the design left unspecified, where a future reader might
reasonably ask "why does the code not match the spec?"

**Maintained the same way as [`BUILD_STATUS.md`](BUILD_STATUS.md):** add an entry during a story's
brainstorming/spec phase when a real divergence is decided; commit alongside the spec doc that
records it.

---

## D1 — `MenuCategories.active` field (not in the original schema)

**Design said:** [`02-domain-model.md`](design/02-domain-model.md) / the S1 spec's category shape
didn't include an active/soft-delete flag on `MenuCategories` — only `Modifiers` and
`ModifierOptions` were specified with `active`, and `MenuItems` already had `available`.

**We did:** added a new `active` checkbox field to `MenuCategories` (S2), matching the
`Modifiers.active` pattern (default `true`, sidebar, soft-delete per INV-4).

**Why:** S2's acceptance criteria ("Returns only `active` rows" at every level of the tree,
[`07-epic-map.md`](design/07-epic-map.md) S2) requires every level of the menu tree to have a
visibility flag. `MenuCategories` was the one gap. Treated `MenuItems.available` as the
semantic equivalent of `active` rather than renaming it — renaming would have been a schema
change beyond S2's stated scope.

**Story:** S2. **Spec:** [`2026-07-01-s2-diner-menu-read-design.md`](superpowers/specs/2026-07-01-s2-diner-menu-read-design.md) Part 2.

---

## D2 — Route → service → persistence layering kept even though S2 has no business logic

**Design said:** [`06b-engineering-decisions.md`](design/06b-engineering-decisions.md) §2 specifies
boundary → service (`src/server/ordering/`) → persistence (`src/server/db/`) layering for the
*ordering* bounded context, but doesn't explicitly say whether a purely read-only, no-business-logic
endpoint like S2 needs the middle (service) layer, versus the route calling the db choke-point
directly (both are defensible reads of the Product-mode "collapsed on thin surfaces" dial in
[`06a-engineering-principles.md`](design/06a-engineering-principles.md)).

**We did:** added a thin `src/server/ordering/menu.ts` service (`getMenu`) that does nothing but
resolve the slug and delegate to `getMenuForTenant` — no pricing/validation/state logic.

**Why:** chosen explicitly over the "route calls db directly" alternative during S2 brainstorming,
so every route on the ordering path (S2's read, S3/S4/S5's write+read) follows the same three-layer
shape by precedent, rather than S2 being a one-off exception that later stories would have to
explain.

**Story:** S2. **Spec:** [`2026-07-01-s2-diner-menu-read-design.md`](superpowers/specs/2026-07-01-s2-diner-menu-read-design.md) Part 4.

---

## D3 — S1 deliberately omitted cache-invalidation hooks (deferred to S2)

**Design said:** [`07-epic-map.md`](design/07-epic-map.md) doesn't call out cache hooks as part of
S1's scope boundary at all — S1's scope boundary only says "Authoring only — no diner read, no
ordering."

**We did:** `Modifiers`/`ModifierOptions` were built in S1 *without* the `afterChange`/`afterDelete`
→ `safeRevalidateTag(CACHE_TAGS.menu)` hooks that `MenuCategories`/`MenuItems` already had — even
though the pattern existed and was easy to copy — then added them in S2 once the cached read path
existed to invalidate.

**Why:** a cache-invalidation hook with no cached reader to invalidate is untestable and
unverifiable — there was no way to confirm S1's hooks worked correctly until S2's
`GET /api/shop/:slug/menu` existed. Explicitly flagged in the S1 spec as "Follow-up required in S2"
rather than silently skipped.

**Story:** S1 (deferred) → S2 (landed). **Spec:** [`2026-07-01-s1-modifiers-design.md`](superpowers/specs/2026-07-01-s1-modifiers-design.md) "Follow-up required in S2".

---

## D4 — Inactive-modifier semantics at checkout (gap-fill of INV-8)

**Design said:** [`02-domain-model.md`](design/02-domain-model.md) INV-8 mandates re-validating items
and selected options against the live menu at checkout, but is silent on inactive *modifiers* —
there is no `MODIFIER_INACTIVE` error code in [`05-api-conventions.md`](design/05-api-conventions.md).

**We did:** an inactive modifier is treated as not belonging to the item — filtered from the
checkout validation view at the db layer. A cart referencing an inactive modifier fails the
`INVALID_MODIFIER_SELECTION` check ("selection doesn't belong to this item"), and an inactive
required modifier no longer blocks its item.

**Why:** INV-8's wording ("[re-validate against the live menu]") is consistent with treating soft
deletes as visibility toggles (the diner never sees the inactive modifier in S2's menu read). An
inactive required modifier posed a concrete risk (see [`ISSUES.md`](ISSUES.md) BUG-4) — every order
would fail validation. Chose the consistent path (filter at the db layer, just like S2 does)
rather than adding a new `MODIFIER_INACTIVE` error code or leaving it unspecified. This gap-fill
was decided explicitly and not silent.

**Story:** S3. **Spec:** [`docs/superpowers/specs/2026-07-02-s3-checkout-design.md`](superpowers/specs/2026-07-02-s3-checkout-design.md) Part 2.

---

## How to use this document

Log a divergence when: the design docs said X and the code does Y, or the design left something
unspecified and a real choice had to be made that a future reader might question. Don't log routine
implementation details (variable names, file layout, minor field ordering) that don't contradict or
fill a gap in the design.
