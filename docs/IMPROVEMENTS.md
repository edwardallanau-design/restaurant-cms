# Improvements — Digital Menu & Ordering System

Known gaps, tech debt, and things worth revisiting once the MVP epic ("Pilot ordering loop", S0–S6)
ships. Nothing here blocks the current build — these are deliberately deferred, not forgotten.

**Maintained the same way as [`BUILD_STATUS.md`](BUILD_STATUS.md):** add an entry when a story's
review surfaces a non-blocking gap; update status when it's addressed; commit alongside the code
that surfaced or fixed it.

Status key: 🔴 open · 🟡 in progress · ✅ resolved

---

## Data model / schema

| # | Item | Surfaced | Status |
|---|------|----------|--------|
| I1 | **Modifiers are 1:1 with a single `MenuItem`** (`menuItem` is a single required relationship) — no way to define "Size: Small/Large" once and reuse it across items (Burger, Pizza, etc.). Each item needing the same modifier requires duplicate `Modifiers`/`ModifierOptions` records. The linkage shape itself (not just the duplication) was flagged as worth a fresh look — likely a many-to-many join, or promoting Modifiers to restaurant/category-level templates that items attach to. | User review of S2 live diner menu, 2026-07-02 | 🔴 open — revisit after MVP (S0–S6) ships |
| I2 | `Modifiers` has no explicit display-order field (`MenuCategories`/`MenuItems` both have `order`) — modifier display order at checkout/diner UI is DB-arbitrary. Likely resolved by whatever I1's redesign produces. | S1 review, 2026-06-30 | 🔴 open |
| I3 | No uniqueness constraint preventing two `Modifiers` with the same `name` on the same `menuItem` (e.g. two "Size" modifiers on one item, no error). Likely resolved alongside I1. | S1 review, 2026-06-30 | 🔴 open |
| I4 | `Events` collection's slug index is global-unique instead of a per-restaurant composite (`['restaurant', 'slug']`) — two different tenants can't both have an event with the same slug. Needs fixing before ordering/staff features touch `Events`. | S0 review, 2026-06-29 | 🔴 open |

## Code quality

| # | Item | Surfaced | Status |
|---|------|----------|--------|
| I5 | `src/server/db/menu.ts`'s three grouping loops (options→modifiers→items) resolve relation IDs unconditionally, relying on `required: true` on `Modifiers.menuItem`/`ModifierOptions.modifier`/`MenuItems.category` in their Payload schemas. Reviewer suggested a one-line comment documenting this invariant so a future editor doesn't reintroduce a silent-skip "safety" guard that would defeat data-integrity detection (see [`ISSUES.md`](ISSUES.md) BUG-1 for the incident that prompted this). | S2 Task 3 review, 2026-07-02 | 🔴 open — nice-to-have, not blocking |
| I6 | Repo-wide `tsc --noEmit` errors, pre-existing and unrelated to any single story: missing `SiteSetting`/`HeroSection` exports from `@/payload-types` in `Header`/`Footer`/`HeroSection` components (likely stale generated types — needs `npm run generate:types` re-run and a source check), implicit-`any` params in `Header`/`Footer`, unused params in `src/migrations/20260630_144713.ts`. | Confirmed via `tsc --noEmit` during S2, 2026-07-02 (pre-dates S2) | 🔴 open — worth its own small cleanup story |
| I7 | `getMenuItemsForValidation`'s `modifier-options` query fetches the whole tenant's options rather than scoping to the cart's modifier IDs (mirrors `menu.ts` pattern) — checkout is latency-sensitive; candidate for a two-step query to reduce payload. | S3 review, 2026-07-02 | 🔴 open |
| I8 | `createOrderForTenant`'s catch block calls `killTransaction` unguarded — if rollback itself throws, the original error is replaced with the rollback error, losing the root cause. Wrap or log-and-rethrow the rollback error. | S3 review, 2026-07-02 | 🔴 open |
| I9 | Route handler: the JSON-parse-failure branch (unparseable body) has no direct test, and the existing 400 test conflates parse-failure with shape-failure (both cases return 400 / `INVALID_BODY`). Separate tests would improve failure locality. | S3 review, 2026-07-02 | 🔴 open |
| I10 | `DomainError` messages embed raw numeric IDs in 422 response bodies — fine for the MVP client, but a user-facing API or admin dashboard may want friendlier copy (e.g. "Item not available" instead of "itemId 3 is inactive"). Candidate for a separate message → user-copy layer. | S3 review, 2026-07-02 | 🔴 open |
| I11 | Checkout `DomainError` loop-test is a single `it` block iterating over 6 error codes — if the code set grows or a specific case breaks, `it.each` would provide better failure locality and less test-name guessing. | S3 review, 2026-07-02 | 🔴 open |
| I12 | S1+S3 schema changes (`Modifiers`/`ModifierOptions`/`Orders`/`Restaurants.lastOrderSequence`, and the new composite indexes added in S3's final review) have no committed migration — the earlier `src/migrations/20260630_144713.json` snapshot predates all of them, and dev push-mode hides the gap. Run `payload migrate create` to capture the accumulated schema drift before the S6 production deploy. | S3 final review, 2026-07-02 | 🔴 open — blocking before S6 deploy |
| I13 | Money (`lineTotal`/`totalPrice` in `src/server/ordering/checkout.ts`) is float arithmetic rounded to 2dp at the pricing boundary (`Math.round(x * 100) / 100`) rather than integer cents throughout. Guards against IEEE-754 drift for the MVP's scale, but integer cents is the more robust long-term representation. | S3 final review, 2026-07-02 | 🔴 open — consider post-MVP |
| I14 | Non-`DomainError` exceptions on `/api/shop` routes (e.g. an unexpected DB error) fall through to Next's default 500 body rather than the API conventions' generic error envelope — consistent with S2's menu route, but not yet unified into one error-boundary helper. | S3 final review, 2026-07-02 | 🔴 open |
| I15 | The atomic per-café sequence increment (`createOrderForTenant` in `src/server/db/orders.ts`) reads `payload.db.sessions[transactionID]`/`payload.db.tables.restaurants` directly, since `@payloadcms/drizzle`'s typed `DrizzleAdapter` and its `getTransaction()` helper are not part of that package's public export map (only `.`, `./postgres`, `./sqlite`, `./types` are exported) — this couples the implementation to adapter internals that could shift in a future `@payloadcms/db-postgres` upgrade without a semver-visible break. Worth an S6 integration test that fires two real concurrent checkout requests against a live Postgres instance to confirm the row-level serialization holds in practice (unit tests here only exercise the mocked builder chain). | S3 final review, 2026-07-02 | 🔴 open |

---

## How to use this document

**When a review (task-level or final whole-branch) surfaces a gap that isn't in scope for the
current story:** add a row here instead of letting it live only in a session's scratch ledger.
**When addressed:** flip status to ✅ resolved and note the commit/PR, same as `BUILD_STATUS.md`'s
Proof column.
