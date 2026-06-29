# 4 · Architecture & ADRs  `[PRODUCTION DEPTH for the bones; ADRs accrete]`

**Architect's question:** *What are the major pieces, how do they fit, and what assumption makes each choice correct?*

---

## Overview — modules & boundaries

One Next.js (App Router) app on Vercel, one Neon Postgres, **two cooperating subsystems** on the shared DB:

1. **Authoring / CMS (Payload).** Collections: `Restaurant` (tenant), `Users`, `Media`, `MenuCategories`, `MenuItems`, `Modifiers`, `ModifierOptions`, `Orders` (read/admin visibility); per-tenant settings (the ex-globals); marketing collections (Gallery, Events) + content. Owns the admin UI and auth.
2. **Ordering (custom Next.js route handlers).** The diner + staff transactional API. Layering: `route handler (HTTP) → service (pricing, validation, per-café sequence, snapshot, state transitions) → tenant-scoped data-access`. The Artifact 2 invariants live in the **service layer**.

**Boundary:** Payload owns *menu/content writes*; the ordering subsystem owns *order transactions* and *diner menu reads*. Both pass through the one tenant-scoped data-access choke-point (Artifact 3).

**Namespace note:** Payload mounts its REST API at `/api/[collection]`, so custom ordering endpoints use a distinct prefix (`/api/shop/*`, `/api/staff/*`) to avoid collision — finalized in Artifact 5.

## Tech stack (with rationale)

- **Next.js App Router** — one deployment for diner + staff + admin; server components; route handlers for the custom API.
- **Payload CMS 3.x** — per-tenant menu authoring + admin UI nearly free (ADR-001).
- **Neon Postgres** via Payload's `postgresAdapter` — relational fits the menu/order model; serverless suits Vercel.
- **Vercel Blob** — media. **Vercel** — hosting/deploy.
- **Tailwind v4 + shadcn/ui** — UI.
- **Real-time: 2s HTTP polling, not WebSocket** — adequate at this scale (ADR-005).
- **Menu reads: cached** (Next.js cache, invalidated on Payload menu writes) — from Artifact 1's "menu cacheable" (ADR-006).

## Cross-cutting concerns

- **Auth.** Payload auth for staff/admin (café users scoped to their tenant; a cross-tenant super-admin). Diners are anonymous (tenant via slug).
- **Errors & logging.** One error envelope + one global boundary handler that owns logging; **no log-and-throw**. Contract detailed in Artifact 6.
- **Config.** Env for infra secrets (`DATABASE_URL`, `PAYLOAD_SECRET`, blob token, `NEXT_PUBLIC_SERVER_URL`); per-tenant config (slug, settings) lives in the DB, not env.
- **Integrations.** Neon (DB), Vercel Blob (media). No payments, no email/SMS (cut).

## ADR log

Each ADR names the assumption that makes it right and the condition that would invalidate it.

### ADR-001 — Payload authors; custom routes transact orders
- **Context.** A multi-tenant ordering product layered on an existing Payload CMS. Ordering is an anonymous, server-priced, atomic, snapshotting write; authoring is admin CRUD.
- **Decision.** Payload owns per-café menu authoring + admin + marketing; ordering is custom Next.js route handlers on the same Neon DB.
- **Alternatives rejected.** *All-in Payload* (fights the tool for transactional integrity on an anonymous priced write); *drop Payload* (throws away the free per-café admin UI — a large slice of product value).
- **Assumption that makes it right.** Menu and order never need to mutate in a single transaction; per-café authoring stays within Payload's modeling.
- **What would invalidate it.** Menu + order needing one transaction, or authoring outgrowing Payload's collections.

### ADR-002 — Orders stored as Payload collections, created only via a transactional custom route
- **Context.** Café staff want order history/visibility; the create path must stay server-owned.
- **Decision.** `Orders`/`OrderItems` are Payload collections (free admin views), but **created exclusively** through the custom transactional service (Payload Local API in a transaction).
- **Alternatives rejected.** Pure custom tables (lose free admin history); client/Payload-REST create (violates server-side pricing, INV-1).
- **Assumption.** Payload's Local-API transaction can hold the order invariant atomically (validate → sequence → snapshot → persist).
- **What would invalidate it.** That transaction proving insufficient for atomic order creation → move Orders to custom tables.

### ADR-003 — Multi-tenant via shared schema + tenant column; app-layer enforcement, RLS deferred
- **Context.** Tens of low-value café tenants, minimal compliance (Artifact 3).
- **Decision.** Shared schema + `restaurantId` (Payload multi-tenant plugin); app-layer choke-point now; RLS + isolation test deferred to first post-validation security task.
- **Alternatives rejected.** Schema-/db-per-tenant (over-engineered); RLS-from-day-one (real friction with Neon pooling + serverless + Payload's adapter).
- **Assumption.** MVP stakes are low (no payments, minimal PII) and the choke-point + discipline hold until hardening.
- **What would invalidate it.** A tenant needing hard isolation/compliance, or a near-miss leak → pull RLS forward.

### ADR-004 — Anonymous tenant identity from URL slug
- **Decision.** Diners carry tenant via `/r/<slug>`; server resolves it.
- **Alternatives rejected.** Subdomain (needs wildcard DNS/TLS; pairs with deferred theming); opaque token (no MVP gain over a slug).
- **Assumption.** No per-tenant custom domains/branding in the MVP.
- **What would invalidate it.** Per-tenant custom domains/branding becoming required → host→tenant middleware.

### ADR-005 — 2s polling for staff real-time, not WebSocket
- **Assumption.** Single-digit concurrent orders per café; 2s staleness is fine.
- **What would invalidate it.** Volume/latency making polling load or staleness unacceptable → WebSocket (backlog E11).

### ADR-006 — Cached menu reads, strong order writes
- **Decision.** Menu reads cached + invalidated on writes; order writes strongly consistent (from Artifact 1).
- **What would invalidate it.** Menu correctness needing to be real-time (it doesn't).

## Deferred scale decisions (explicit)

RLS backstop + isolation tests · caching beyond menu reads · read replicas · async/queues · WebSocket real-time · self-serve onboarding/billing/theming · observability stack. **All deferred until validated** (playbook §6).
