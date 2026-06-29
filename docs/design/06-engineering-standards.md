# 6 · Engineering Standards  `[MVP-THIN]`

**Architect's question:** *What rules does every unit of code obey — so the low-level design is constrained without being pre-drawn?*

Rules every class obeys; the agent generates the actual LLD per story, bounded by these.

---

**Code organisation.**
- Payload collections in `src/collections/`, per-tenant settings in `src/globals/`.
- Ordering subsystem, layered: route handlers `src/app/api/shop|staff/...` → services `src/server/ordering/` (pricing, validation, sequence, snapshot, transitions) → **one tenant-scoped data-access module `src/server/db/`** (the Artifact 3 choke-point).
- Pages: marketing `(frontend)/`, diner `(frontend)/r/[restaurant]/...`, staff its own area; page-level sections `src/sections/`, feature components `src/components/[feature]/`.
- `cn()` from `src/lib/utils.ts` for conditional classNames; static class strings stay plain.

**Test philosophy.** **AC-anchored** — a story's acceptance criteria *are* its test spec. Highest-value tests = the invariants: server-side pricing (INV-1), required-modifier + selection-cardinality rejection (INV-2/9/10), inactive-item rejection (INV-8), `total = Σ lines` (INV-13), per-café order-number uniqueness **under concurrency** (INV-6), and the **cross-tenant isolation test** (the one security test that matters). Unit-test the service layer directly; integration-test the `POST /orders` route. Mocks live at the data-access boundary.
- **Test runner: Vitest + React Testing Library** (this resolves the previously-unset `npm test`).

**Errors & logging contract.** The service layer throws **typed domain errors** carrying a `code`; **one boundary handler** maps `code → status + envelope` and is the *only* place that logs. **No log-and-throw.** Expected validation failures log at `info/warn` (control flow, not incidents). `500`s never leak internals.

**Patterns & dependency rules.**
- Dependency direction is one-way: `route → service → data-access → DB`. Pages/components never touch the DB except via cached server reads or the data-access module.
- **No query bypasses the tenant choke-point** (enforce by review/lint) — this is the Artifact 3 enforcement layer made concrete.
- **Server-by-default**: async server components + cached reads; `'use client'` only where interaction requires it (cart, forms).
- **Forms**: `useActionState` + Zod server actions (no `react-hook-form`).
- **Money is `Decimal` / integer minor units, never a JS float** — non-negotiable; it underpins INV-1/13.
- **Zod validates request shape at the boundary (→400)** *before* domain validation (→422).
- Style is the formatter's job (Prettier), not this doc's.
