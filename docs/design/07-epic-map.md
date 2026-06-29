# 7 · Epic Map  `[MVP-THIN — MVP epic detailed, rest placeholders]`

**Architect's question:** *What is the whole territory, and what is the smallest slice that tests the idea?*

---

## MVP epic — "Pilot ordering loop"

*One café, tenant-aware, diner self-orders → staff confirms, deployed.* The thinnest slice that tests the Artifact 1 hypothesis. Stories below are elaborated to agent-ready depth (playbook §5), sequenced by dependency — **riskiest one-way door first**.

The walking skeleton **is** this epic, built end-to-end through every layer and deployed.

---

### S0 · Tenant foundation + slug routing
- **Context anchor.** Epic: Pilot ordering loop. Bounded context: tenancy (Artifact 3). Follow: Payload multi-tenant plugin, the data-access choke-point.
- **Vertical slice.** Add `Restaurant` collection + multi-tenant plugin; convert singleton globals → per-tenant settings; `/r/[slug]` route resolves slug → `restaurantId`; stand up the tenant-scoped data-access module; seed **1 pilot + 1 decoy** tenant.
- **Acceptance criteria (= tests).**
  - `GET /r/pilot/...` resolves to the pilot tenant; an unknown slug → 404.
  - A query for pilot data **never** returns the decoy tenant's rows through the choke-point.
  - The ex-globals read per-tenant (pilot vs decoy differ).
- **Scope boundary — do NOT touch.** No ordering, no menu read API, no diner UI yet.
- **Fits one window?** Borderline — split into *(S0a)* tenant model + plugin + choke-point and *(S0b)* slug routing + resolution if it overflows.

### S1 · Menu authoring: Modifiers + Options
- **Context anchor.** Bounded context: authoring (Payload). Follow: existing `MenuCategories`/`MenuItems` collections.
- **Vertical slice.** Add `Modifiers` (single/multi, `required`) + `ModifierOptions` (label, priceAdjustment, active) collections, tenant-scoped, attached to `MenuItems`.
- **Acceptance criteria.** Admin creates an item with a required single-select "Size" + an optional multi-select "Extras"; persists tenant-scoped; appears under the right item.
- **Scope boundary.** Authoring only — no diner read, no ordering.
- **Fits one window?** Yes.

### S2 · Diner menu read (cached)
- **Context anchor.** Bounded context: ordering read path. Follow: API conventions (§5), ADR-006.
- **Vertical slice.** `GET /api/shop/:slug/menu` → active category→item→modifier→option tree for the tenant; cached, invalidated on menu writes; diner page renders it.
- **Acceptance criteria.** Returns only `active` rows; only this tenant's; an empty menu → `200 []`; a cross-tenant slug returns only its own data.
- **Scope boundary.** Read-only — no cart, no order.
- **Fits one window?** Yes.

### S3 · Checkout `POST /orders` (keystone)
- **Context anchor.** Bounded context: ordering write path (the Order aggregate). Follow: Artifact 2 invariants, §5/§6.
- **Vertical slice.** Cart (client state) → `POST /api/shop/:slug/orders`. Server: Zod shape (→400); re-resolve + validate against the live tenant menu (INV-8/11); required + cardinality + qty + non-empty (INV-2/9/10/12/14); compute total server-side (INV-1/13); assign per-café number in a transaction (INV-6); snapshot (INV-3); persist `PENDING`; return `201 {orderNumber, totalPrice}`.
- **Acceptance criteria (= the invariant list).**
  - Total is computed server-side; a client-sent price is ignored (INV-1/13).
  - Missing required modifier → 422 `REQUIRED_MODIFIER_MISSING` (INV-2).
  - Inactive item/option → 422 `ITEM_INACTIVE`/`OPTION_INACTIVE` (INV-8).
  - single-select >1, or option ∉ modifier ∉ item → 422 `INVALID_MODIFIER_SELECTION` (INV-9/11).
  - qty < 1 → 422; empty cart → 422 `EMPTY_ORDER` (INV-12/14).
  - Concurrent orders at one café get **distinct** sequential numbers (INV-6).
- **Scope boundary — do NOT touch.** No payment, no auth, no staff view, no confirmation page.
- **Fits one window?** Yes — but it is the largest story; keep it focused.

### S4 · Order confirmation read
- **Context anchor.** Ordering read path; follow S3's response + §5.
- **Vertical slice.** `GET /api/shop/:slug/orders/:orderNumber` → snapshot detail; diner confirmation page renders it.
- **Acceptance criteria.** Shows order number + snapshot lines + total; unknown number → 404; another tenant's order number → 404.
- **Scope boundary.** Read-only.
- **Fits one window?** Yes.

### S5 · Staff dashboard + confirm/cancel (2s poll)
- **Context anchor.** Bounded context: staff. Follow: ADR-005, the Order state machine, §5.
- **Vertical slice.** Authed staff page polls `GET /api/staff/orders?status=PENDING` (tenant from session, newest first) every 2s; `PATCH /api/staff/orders/:id {status}` validates `PENDING → CONFIRMED | CANCELLED`.
- **Acceptance criteria.** A new order appears ≤ ~2s; confirm/cancel removes it from the board and persists; illegal transition → 409 `ILLEGAL_STATE_TRANSITION`; acting on another tenant's order → 403/404; `setInterval` cleaned up on unmount.
- **Scope boundary.** Pending list + confirm/cancel only — no history UI, no analytics.
- **Fits one window?** Yes.

### S6 · Deploy the pilot end-to-end
- **Context anchor.** The deployed-skeleton gate (playbook §3).
- **Vertical slice.** Wire to Vercel/Neon production; seed the pilot café's real menu; generate the table QR → `/r/pilot/menu`.
- **Acceptance criteria.** A phone scanning the QR places a real order in production; staff see and confirm it.
- **Scope boundary.** No new features — deployment + smoke test only.
- **Fits one window?** Yes.

> **Note:** the HLD's order-history page is **not** an MVP story — orders live in Payload (ADR-002), so the café gets history/visibility free in the admin. A richer history/analytics UI is backlog **E8**.

---

## Backlog epics (placeholders)

- **E2** — Self-serve tenant onboarding (signup, slug claim, guided menu setup)
- **E3** — Billing & subscriptions
- **E4** — Checkout payments (online vs in-person)
- **E5** — Order-status tracking (preparing/ready) + kitchen/printer
- **E6** — Notifications (SMS/email order ready)
- **E7** — Per-tenant branding/theming + custom domains (→ subdomain routing; invalidates ADR-004)
- **E8** — Reporting & analytics (sales, popular items, labor-impact dashboard)
- **E9** — Multi-location (one tenant, many branches)
- **E10** — Security/ops hardening (RLS backstop + isolation test, observability, tested backups/DR)
- **E11** — Real-time upgrade (WebSocket replacing polling)
- **E12** — Inventory/availability automation

## Rough sequence / dependencies

MVP epic first — it generates the validation signal. **Post-gate is signal-driven**, ordered by irreversibility × likelihood (playbook §6):
1. **E10 (data-loss & security) first** — RLS backstop, isolation test, tested backups.
2. **The pilot's revealed bottleneck + observability** — downtime risks.
3. **Friction** — E5/E6/E8 features and polish.

E2 + E3 gate scaling to many *paying* cafés; E7 pairs with subdomain routing.
