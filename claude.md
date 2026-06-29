# CLAUDE.md — Project Context

> Persistent context for Claude Code. Read this at the start of every session before touching code.

## What this is
A **multi-tenant** digital menu & ordering system, sold B2B to many independent cafés/restaurants. A diner scans a table QR, browses that café's categorized menu, adds items (with modifiers) to a cart, and checks out to get an order number. Staff see pending orders in real time and confirm (or cancel) them. Payment is manual, in person — no payment processing. Goal: reduce a café's reliance on waiters.

## Source of truth
**`docs/design/` is authoritative** — the context package (Artifacts 1–7), produced via `SYSTEM_DESIGN_PLAYBOOK.md`. Start at `docs/design/README.md`. If anything here conflicts with those docs, they win. Don't invent schema or endpoints that aren't in them — if something's missing or ambiguous, stop and ask.

> `HLD.md` is the original single-tenant MVP spec — **superseded** on tenancy, stack, order numbering, and order states. The 2026-06-29 Prisma/single-tenant spec + phase-0 plan under `docs/superpowers/` are **superseded — do not build from them** (the phase-0 plan would delete Payload, which the current design keeps).

## Tech stack
- **Next.js** (App Router) — one app: diner ordering + staff dashboard + Payload admin/CMS
- **Payload CMS 3.x** on **PostgreSQL (Neon)** via `@payloadcms/db-postgres` — authoring, admin, marketing
- **Ordering = custom Next.js route handlers** on the same DB (ADR-001) — **not** Prisma
- **Multi-tenant**: shared schema + tenant column (Payload multi-tenant plugin); tenant from URL slug (diners) / session (staff)
- **Tailwind v4 + shadcn/ui** · Vercel Blob (media) · Vercel (host)
- Real-time: HTTP polling (2s), not WebSocket — MVP

## Invariants (do not violate)
Full list = INV-1…14 in `docs/design/02-domain-model.md`. The ones most often gotten wrong:
1. **Prices computed server-side, always** (INV-1). The client sends item/option IDs + quantities only; the server prices.
2. **Required modifiers + selection rules validated server-side** (INV-2/9/10/11); reject on violation.
3. **OrderItem snapshotted at checkout** (INV-3) — itemName, unitPrice, and full modifier labels + adjustments. Never re-join history to the live menu.
4. **Soft deletes only** (`active:false`, INV-4) — never hard-delete.
5. **Tenant-scoped, always** (INV-7). Every menu/order row belongs to one Restaurant; tenant comes from the URL slug or session, **never the request body**; no query bypasses the data-access choke-point.
6. **Order number** = `ORD-` + zero-padded **per-café** sequence (INV-6), unique per restaurant, assigned inside the order transaction.

## Project structure
```
src/
  payload.config.ts   Payload config (collections, globals, Neon adapter)
  collections/        Restaurant(tenant), Users, Media, MenuCategories, MenuItems, Modifiers, ModifierOptions, Orders
  globals/            per-tenant settings (being made tenant-scoped)
  app/
    (frontend)/       marketing + diner ordering (diner under r/[restaurant]/)
    (payload)/admin/  Payload admin UI
    api/shop|staff/   custom ordering route handlers (separate from Payload's /api/[collection])
  server/
    ordering/         services: pricing, validation, sequence, snapshot, transitions
    db/               the ONE tenant-scoped data-access choke-point
  components/         feature components; components/ui/ = shadcn
  sections/           page-level sections
  lib/utils.ts        cn() helper
```
Parts of this (`server/`, `api/shop`, the `Restaurant`/`Modifiers`/`Orders` collections) are still to be built — see the epic map. Code is the real source of truth; verify before trusting.

## Commands
- `npm run dev` — local dev server
- `npm run generate:types` — regenerate `src/payload-types.ts` after editing collections (needs `"type":"module"`)
- `npm run lint`
- `npm test` — **Vitest + React Testing Library** (per `docs/design/06-engineering-standards.md`)
- Payload owns the schema/migrations (`payload migrate`) — no Prisma.

## Working agreement (how we build)
- **Plan before code.** For any non-trivial feature, produce an approach/plan and wait for review.
- **One vertical slice at a time** (API → service → domain → persistence → response). Never a horizontal layer alone.
- **Tests are the contract.** Each slice gets at least one test (the story's ACs). Implement until green.
- **Commit at every green state.** Small, working commits.
- **Update `docs/BUILD_STATUS.md`** when a story lands.

## Context-package index (load per story)
Product/constraints → `docs/design/01-product-and-constraints.md` · Domain model → `02-domain-model.md` · Tenancy → `03-tenancy-model.md` · Architecture/ADRs → `04-architecture.md` · API conventions → `05-api-conventions.md` · Engineering standards → `06-engineering-standards.md` · Epic map/stories → `07-epic-map.md`

## Stop rules (ask before doing)
Anything irreversible or one-way: touching the tenancy model / data-access choke-point, schema migrations, auth, deleting data — or executing the **superseded** Prisma phase-0 plan (don't). Flag, don't guess.

## Build status & orientation
Live tracker: `docs/BUILD_STATUS.md` (MVP epic "Pilot ordering loop"; start at S0). On session start: (1) read BUILD_STATUS, (2) verify against the actual repo — code is the real source of truth, (3) skim recent `git log`. If the tracker and code disagree, trust the code and flag the mismatch.
