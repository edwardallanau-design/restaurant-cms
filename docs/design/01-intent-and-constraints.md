# 1 · Intent & Constraints  `[ALWAYS FIRST — declares the build mode]`

**Architect's question:** *Why am I building this, for whom, under what limits — and what does "done" mean for that reason?*

The "no" machine, the contract for the whole effort, and the artifact that **declares the build mode** — which sets which doors are one-way for everything else.

---

**Build mode: Product.** A B2B product sold to many independent cafés; success = adoption/payment against a written hypothesis, judged by kill criteria. So the **Product-mode depth defaults hold**: Artifacts 1–4 at production depth (domain, tenancy, architecture are the one-way doors), 5–7 thin.

**Why this exists (success condition).**
- *Hypothesis:* Diners at a small café will **voluntarily** place the majority of their orders via the digital menu rather than flag a waiter, because it's faster and removes the wait to be noticed.
- *Kill criteria:* By **pilot-live + ~8 weeks**, at ≥1 pilot café, over a **4-week steady-state window** — **primary:** voluntary digital-order share **<40% → pivot**, **<20% → kill**; **floor:** sustained **<~15 app orders/day** = too little volume; **secondary (qualitative):** does the pilot owner keep it past the trial?

**Actors.** *(One-way-door input — the domain boundaries and the authorization model derive from these.)*
- **Diner** — anonymous; browses and self-orders. The primary user.
- **Café staff** — authed; confirm/cancel pending orders at the counter.
- **Café admin / owner** — authed, tenant-scoped; manages the menu via the Payload admin. The buyer.
- **Platform super-admin** — cross-tenant operator; onboards cafés.

**Non-goals.** Payment processing · diner accounts/auth · multi-*location* chains · self-serve tenant signup · billing/subscriptions · per-tenant theming/custom domains · kitchen/printer integration · order status beyond pending→confirmed/cancelled · notifications · reporting/analytics · inventory tracking.

> "Digital transformation" is the **vision** (the Epic Map's backlog), **not** the MVP. The MVP tests one thin, falsifiable wedge.

— **Product mode only** —

**Who pays / primary user.** Buyer = the café/restaurant **owner** (B2B). Primary user = the diner.
**Scale assumptions.** **Tiny by design** — tens of café tenants; per café ≤ a few hundred orders/day, single-digit concurrent orderers. Low-throughput; resist throughput optimization.
**NFRs.** Availability ≈99% during service (manual waiter fallback) · Latency sub-second menu/order, 2s staff poll · Consistency **order path strong & atomic, menu reads cacheable** · Compliance minimal (no payments, no diner accounts; one admin login/tenant).
