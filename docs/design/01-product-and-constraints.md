# 1 · Product & Constraints  `[PRODUCTION DEPTH]`

**Architect's question:** *What problem, for whom, under what limits — and how will I know if I was wrong?*

This is the "no" machine and the contract for the whole effort.

---

**Problem.** Small cafés/restaurants depend on waiters to take orders — a labor cost and a peak-time bottleneck. Digital self-ordering (a diner scans a table QR, browses, and submits an order) cuts that reliance.

**Who pays / primary user.**
- **Buyer:** the café/restaurant *owner* — this is a **B2B product sold to many independent venues** (multi-tenant).
- **Primary user:** the **diner**, who self-orders. **Secondary user:** counter/floor **staff**, who confirm orders.

**Scale assumptions.** **Tiny by design** — tens of café tenants; per café ≤ a few hundred orders/day and single-digit concurrent orderers. A low-throughput system; the design should actively *resist* throughput optimization (see Guardrail #3 in the playbook).

**NFRs.**
- **Availability** ≈ 99% during service hours. Brief outages are survivable: staff revert to taking orders manually. No 24/7 five-nines obligation.
- **Latency** — sub-second feel for menu load and order submit; 2s staff-dashboard freshness (polling).
- **Consistency** — **order path strongly consistent & atomic; menu reads cacheable / eventually consistent.** (This is the seam the domain model encodes.)
- **Compliance** — minimal. Payment is manual and in-person (out of scope); diners do not log in; the only PII is one tenant-admin login per café.

**Non-goals (explicit).** Payment processing · diner accounts/auth · multi-*location* chains (one tenant, many branches) · self-serve tenant signup · billing/subscriptions · per-tenant theming/custom domains · kitchen/printer integration · order status beyond pending→confirmed/cancelled · notifications (SMS/email) · reporting/analytics · inventory tracking.

> "Digital transformation" is the **vision / north-star** (see the Epic Map's backlog), **not** the MVP. The MVP tests one thin, falsifiable wedge. Do not let the broad framing re-open the scope cut here.

**Validation hypothesis.** *We believe diners at a small café will **voluntarily** place the majority of their orders via the digital menu (rather than flag a waiter), because it's faster and removes the wait to be noticed.*

**Kill criteria.** By **pilot-live + ~8 weeks** (convert to an absolute date the day the pilot launches), at ≥1 pilot café, over a **4-week steady-state window**:
- **Primary** — voluntary **digital-order share** (app-placed ÷ total orders, excluding cancelled): **< 40% → pivot** the diner flow; **< 20% → kill**.
- **Floor** — sustained **< ~15 app orders/day** = too little volume to matter even at high share.
- **Secondary (qualitative)** — does the pilot owner choose to keep it running past the trial?

> The pilot keeps waiters available and measures *voluntary* share — a QR-only/no-waiter pilot would measure coercion, not demand.
