# Design — Digital Menu & Ordering System (multi-tenant)

The **context package** for this system, produced via the design playbook (kept local, gitignored).

> Source of truth. **Supersedes** the 2026-06-29 single-tenant/Prisma spec + plan (removed). **Build mode: Product** → Artifacts 1–4 at production depth, 5–7 thin. File naming follows the playbook's `NN-<artifact>.md` convention (06 is two files: `06a`/`06b`).

| # | Artifact | Depth |
|---|----------|-------|
| [01](01-intent-and-constraints.md) | Intent & Constraints — build mode, actors, success condition, kill criteria | `[PRODUCTION]` |
| [02](02-domain-model.md) | Domain Model — journey, entities, aggregates, INV-1…14, state machines | `[PRODUCTION]` |
| [03](03-tenancy-model.md) | Tenancy & Isolation | `[PRODUCTION]` |
| [04](04-architecture.md) | Architecture & ADRs | `[PRODUCTION]` |
| [05](05-api-conventions.md) | API Conventions | `[MVP-THIN]` |
| [06a](06a-engineering-principles.md) | Engineering — universal principles (P1–P10, verbatim) | `[MVP-THIN]` |
| [06b](06b-engineering-decisions.md) | Engineering — per-system decisions | `[MVP-THIN]` |
| [07](07-epic-map.md) | Epic Map — MVP stories S0–S6 + backlog | `[MVP-THIN]` |

**Live build status:** [`../BUILD_STATUS.md`](../BUILD_STATUS.md) · **Standing rules:** [`../../CLAUDE.md`](../../CLAUDE.md)
