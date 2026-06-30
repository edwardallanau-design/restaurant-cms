# Engineering Decisions — Digital Menu & Ordering System

**The per-system half of Artifact 6.** Pairs with [`06a-engineering-principles.md`](06a-engineering-principles.md) (universal, verbatim). This file records *this* system's concrete code-contract choices; the principles file holds the universal rules. CLAUDE.md points the agent at both.

**Build mode: Product** → dial = **Full** on the production-depth subsystems (the ordering transaction path, tenancy), **collapsed** on thin surfaces. Floors hold everywhere.

> Owns the **code contract only**. Tenancy, architecture topology, and the domain model are owned by their own artifacts and carried here as pointers (§9), never duplicated.

---

## 1. Stack
- **Backend:** TypeScript · Next.js (App Router) route handlers · **Payload CMS 3.x** (authoring/admin) · **Postgres (Neon)** via `@payloadcms/db-postgres`. Ordering = **custom route handlers** on the same DB (ADR-001) — not Prisma.
- **Frontend:** Next.js server components + React · Tailwind v4 · shadcn/ui.
- **Infra / deploy:** Vercel (host) · Vercel Blob (media) · GitHub.

## 2. Layer names — *Instantiates P1 (layered ownership)*
- **Boundary (transport):** Next route handler — `src/app/api/shop|staff/...`.
- **Logic (business rules):** service — `src/server/ordering/` (pricing, validation, sequence, snapshot, transitions).
- **Persistence (storage):** the **tenant-scoped data-access module** — `src/server/db/` (the single choke-point; INV-7).
- **Cross-cutting:** typed domain errors + the one boundary error handler in `src/server/`.

## 3. Exception taxonomy — *Instantiates P2* · collapsed (Product-thin)
- **Root:** a typed `DomainError` carrying a stable `code`.
- **Category → status:** validation → `422` · not-found / cross-tenant → `404` · illegal state transition → `409` · auth missing → `401` · wrong tenant → `403` · unexpected → `500` (generic).
- **Naming:** errors carry a `code` (e.g. `ITEM_INACTIVE`), not a deep class tree — no taxonomy until the surface grows.
- **Single handler:** one boundary handler maps `code → status + envelope` and is the **only** place that logs. *(Floor: never log twice; never leak infra detail to the client.)*

## 4. Logging — *Instantiates P3* · collapsed
- **Format:** plain lines (structured JSON deferred).
- **Owners:** the service logs one line on success and one on a rejected business rule (`info`/`warn`); the boundary handler owns failure logging. Expected validation failures are not logged at `error`.
- **Never logged:** secrets, tokens, full payloads, PII — reference entities by ID. *(Floor — does not collapse.)*

## 5. API contract — *Instantiates P5*
The API contract (endpoints, status codes, error envelope + codes, pagination, auth, naming, versioning, worked examples) is **Artifact 05** — see [`05-api-conventions.md`](05-api-conventions.md). Per the playbook's numbering, API conventions are their own file; this section points there rather than holding a second copy.

## 6. Boundary gateway & shared types — *Instantiates P6 / P7*
- **Outbound wrapper:** one typed client (`apiClient`) for diner → `/api/shop` calls; components never call `fetch` directly.
- **Typed error:** the one envelope defined in `05-api-conventions.md`.
- **Shared types:** generated `src/payload-types.ts` + a shared types location; **no `any` at boundaries**.
- **DB boundary:** all tenant-owned access routes through the `src/server/db/` choke-point — no raw queries in leaves.

## 7. Test stack — *Instantiates P8*
- **Logic-layer unit:** Vitest (pricing, validation, cardinality, sequence under concurrency, snapshot, transitions).
- **Integration:** route-handler tests against a test DB for contract + **cross-tenant isolation** (the key security test).
- **Component / wrapper:** React Testing Library.
- **End-to-end:** one happy path (the S6 pilot smoke flow). Exhaustive matrix deferred (Product-thin).

## 8. Authorization placement & roles — *Instantiates the centralization invariant*
- **Location:** Payload access control for admin/staff collections + one guard for the custom staff routes (tenant from session). Diner endpoints anonymous (tenant from slug). **No inline authority checks** scattered in transport/logic.
- **Roles:** platform **super-admin** (cross-tenant) + **tenant-scoped staff/admin**. Diners unauthenticated.

## 9. Pointers — decided in other artifacts
- **Tenancy / isolation:** shared schema + tenant column, app-layer choke-point → [`03-tenancy-model.md`](03-tenancy-model.md).
- **Architecture topology & module boundaries:** → [`04-architecture.md`](04-architecture.md).
- **Domain model & invariants (INV-1…14):** → [`02-domain-model.md`](02-domain-model.md).
