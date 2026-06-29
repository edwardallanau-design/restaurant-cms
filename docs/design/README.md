# Design — Digital Menu & Ordering System (multi-tenant)

The **context package** for this system, produced via `SYSTEM_DESIGN_PLAYBOOK.md`.

> **These docs are the current source of truth.** They **supersede** the 2026-06-29
> single-tenant / Prisma design spec and phase plan (kept under `docs/superpowers/`,
> marked SUPERSEDED). Where the original `HLD.md` conflicts, these win — it was a
> single-tenant MVP spec and is superseded on tenancy, stack, order numbering, and
> order states.

**Depth:** Artifacts 1–4 at production depth (one-way doors) · 5–7 MVP-thin · dated 2026-06-30.

| # | Artifact | Depth |
|---|----------|-------|
| 1 | [Product & Constraints](01-product-and-constraints.md) — problem, NFRs, validation hypothesis + kill criteria | `[PRODUCTION]` |
| 2 | [Domain Model](02-domain-model.md) — entities, aggregates, invariants (INV-1…14), state machines | `[PRODUCTION]` |
| 3 | [Tenancy & Isolation](03-tenancy-model.md) — multi-tenant strategy, propagation, enforcement | `[PRODUCTION]` |
| 4 | [Architecture & ADRs](04-architecture.md) — modules, stack rationale, ADR log | `[PRODUCTION]` |
| 5 | [API Conventions](05-api-conventions.md) | `[MVP-THIN]` |
| 6 | [Engineering Standards](06-engineering-standards.md) | `[MVP-THIN]` |
| 7 | [Epic Map](07-epic-map.md) — MVP epic (agent-ready stories) + backlog placeholders | `[MVP-THIN]` |

**Live build status:** [`../BUILD_STATUS.md`](../BUILD_STATUS.md) · **Standing rules:** [`../../CLAUDE.md`](../../CLAUDE.md)
