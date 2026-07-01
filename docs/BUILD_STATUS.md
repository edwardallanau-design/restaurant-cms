# Digital Menu & Ordering System — Build Status

**Design (source of truth):** [`docs/design/`](design/README.md) — multi-tenant, Payload-based (Artifacts 1–7).
**Standing rules:** [`CLAUDE.md`](../CLAUDE.md)

> **Supersedes** the 2026-06-29 single-tenant / Prisma phase plan. That plan and its design spec are
> archived under [`docs/superpowers/`](superpowers/) marked SUPERSEDED — **do not build from them.**

---

## Current status

> **MVP epic "Pilot ordering loop" — 🔄 S2 next.** S0 complete: multi-tenant foundation, data-access
> choke-point, and `/r/[slug]` slug routing. 10 Vitest tests green; pilot/decoy isolation proven.
> Payload upgraded 3.78→3.85.1 (required for `plugin-multi-tenant`). S1 complete: `Modifiers` +
> `ModifierOptions` collections added, tenant-scoped, attached to `MenuItems`.

## MVP epic — stories

Agent-ready detail in [`docs/design/07-epic-map.md`](design/07-epic-map.md). Sequenced riskiest one-way door first.

| # | Story | Status | Proof (test / commit) |
|---|-------|--------|------------------------|
| S0 | Tenant foundation + slug routing (Restaurant, multi-tenant plugin, per-tenant settings, data-access choke-point) | ✅ | 10/10 Vitest tests; pilot≠decoy isolation; `/r/pilot` → stub, `/r/unknown` → 404; `355502a`→`886a3f4` |
| S1 | Menu authoring: `Modifiers` + `ModifierOptions` collections | ✅ | Local-API smoke test: required single-select + optional multi-select created, tenant-scoped (pilot≠decoy); `246fee2` |
| S2 | Diner menu read — `GET /api/shop/:slug/menu` (cached). **Must also add `afterChange`/`afterDelete` → `safeRevalidateTag(CACHE_TAGS.menu)` hooks to `Modifiers`/`ModifierOptions` (S1 deferred these; see S1 spec's "Follow-up required in S2")** | ⬜ | — |
| S3 | Checkout — `POST /api/shop/:slug/orders` (keystone; invariants INV-1…14) | ⬜ | — |
| S4 | Order confirmation — `GET /api/shop/:slug/orders/:orderNumber` | ⬜ | — |
| S5 | Staff dashboard + confirm/cancel (2s polling) | ⬜ | — |
| S6 | Deploy pilot end-to-end (Vercel/Neon, seed real menu, table QR) | ⬜ | — |

Status key: ⬜ not started · 🔄 in progress · ✅ done · ⚠️ blocked

## Backlog epics (post-validation, signal-driven)

E2 onboarding · E3 billing · E4 payments · E5 status/kitchen · E6 notifications · E7 theming/domains · E8 analytics · E9 multi-location · E10 security/ops hardening (RLS + isolation test) · E11 WebSocket · E12 inventory.

Ordered by irreversibility × likelihood (playbook §6): **E10 first**, then the pilot's revealed bottleneck + observability, then friction features.

---

## How to use this document

**Session start:** read Current status, the MVP epic in [`docs/design/07-epic-map.md`](design/07-epic-map.md), and the relevant context-package docs in [`docs/design/`](design/README.md).
**Session end:** update each touched story's Status + Proof, then commit this file alongside the code.
