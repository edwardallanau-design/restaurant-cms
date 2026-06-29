# 3 · Tenancy & Isolation  `[PRODUCTION DEPTH]`

**Architect's question:** *How is one café's data kept separate from another's, and at which layer is that boundary enforced?*

A one-way door that cross-cuts everything. This system is genuinely multi-tenant (Artifact 1), so this is **not** a one-line ADR.

---

**Strategy.** **Shared schema + a tenant column** (`restaurantId` on every tenant-owned row), via Payload's `@payloadcms/plugin-multi-tenant`. Because: tens of low-value café tenants with minimal compliance → shared-schema is cheapest to operate. Schema-per-tenant and database-per-tenant are **rejected** as over-engineering for this profile.

**Context propagation.**
- **Diner (anonymous):** tenant rides in on the **URL path slug** `/r/<slug>` (encoded in the table QR). The server resolves slug → `restaurantId` and scopes every query.
- **Staff/admin (authenticated):** tenant comes from the **authed user record**.
- **The rule both obey:** tenant identity comes from the URL or the session — **never from a `restaurantId` in the request body** (same trust boundary as server-side pricing). If a slug ever appears on an authed route, it must equal the user's tenant or **403**.

**Enforcement layer.** **Application layer**, through **one tenant-scoped data-access choke-point** (the diner path scopes by resolved slug; the Payload admin path by the multi-tenant plugin). The goal: a developer can state exactly how any query is scoped, and no query bypasses the choke-point (enforced by review/lint — see Artifact 6).

> **Deferred (first post-validation security task, per playbook §6):** Postgres **Row-Level Security** as a fail-safe backstop + an automated **cross-tenant isolation test**. Two write paths exist (Payload admin + the anonymous order API), so RLS later unifies enforcement beneath both.

**Shared vs. isolated.**
- **Isolated per tenant:** categories, items, modifiers, options, orders, media, per-café settings.
- **Shared:** platform code/schema + a cross-tenant **super-admin** (platform operator).
- Each staff/admin `User` belongs to one tenant (except the super-admin).

**Onboarding.** Manual (self-serve deferred): create a `Restaurant` + unique slug + its admin `User`, then seed an empty menu.

> **Migration note (debt to repay):** the existing app's singleton globals (`SiteSettings`, `HeroSection`, `PageContent`) encode "there is one restaurant." They must become **per-tenant** config — this is the single-tenant assumption to reverse, and it is partly why the tenant decision had to be made now rather than retrofitted.
