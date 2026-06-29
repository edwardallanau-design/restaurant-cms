# 5 · API Conventions  `[MVP-THIN]`

**Architect's question:** *What rules will every endpoint obey, so I never re-decide them per feature?*

Conventions, not per-endpoint specs. Governs the **custom ordering API**; Payload's `/api/[collection]` REST + admin keep Payload's own conventions.

---

## Endpoint set & tenant scoping

- **Diner (anonymous, tenant slug in path):**
  - `GET  /api/shop/:slug/menu` — active categories → items → modifiers → options (cached)
  - `POST /api/shop/:slug/orders` — create an order (priced, validated, snapshotted)
  - `GET  /api/shop/:slug/orders/:orderNumber` — confirmation view
- **Staff (authenticated, tenant from session — no slug):**
  - `GET   /api/staff/orders?status=PENDING` — pending, newest first
  - `PATCH /api/staff/orders/:id` — body `{ "status": "CONFIRMED" | "CANCELLED" }`; validates the legal transition (Artifact 2 state machine)
- **Rule:** if a slug ever appears on an authed route, it must equal the user's tenant or **403**.

## Status codes

- `GET` → `200` (empty collection = `200 []`, never `404`)
- `POST` create → `201` + created resource
- `PATCH` → `200` + updated resource
- Malformed body / shape → `400`
- **Domain-validation failure → `422`**
- Unknown slug / order / cross-tenant resource → `404`
- Illegal state transition → `409`
- Missing/invalid staff auth → `401`; authed but wrong tenant → `403`
- Unexpected → `500` (generic; never leak internals)

## Error envelope

Always:
```json
{ "error": { "code": "STRING", "message": "human-readable", "details": [] } }
```
`code` is stable and machine-readable so the diner UI can map it to an action. Codes track the invariants:

`RESTAURANT_NOT_FOUND` · `ITEM_INACTIVE` · `OPTION_INACTIVE` · `REQUIRED_MODIFIER_MISSING` · `INVALID_MODIFIER_SELECTION` (single-select >1, or option ∉ modifier ∉ item) · `EMPTY_ORDER` · `INVALID_QUANTITY` · `ORDER_NOT_FOUND` · `ILLEGAL_STATE_TRANSITION`.

## Pagination · Auth · Naming · Versioning

- **Pagination.** The pending list isn't paginated (small, polled). History lists: `?limit` (default 50, max 100) + `?cursor` (opaque, by `createdAt,id`), returning `{ data, nextCursor }`.
- **Auth.** Payload session (cookie) for staff/admin; diner endpoints unauthenticated, tenant via slug.
- **Naming.** Plural resource nouns, kebab-case paths. Diners reference orders by `orderNumber`; staff by internal `id`.
- **Versioning.** Unversioned for the MVP (you own both ends of the only client). Introduce path versioning `/api/shop/v1/...` only when an external/contract consumer appears.

---

## Worked examples

Salvaged from the original `HLD.md` and adjusted for multi-tenant: slug in the path, per-café order number, and the snapshot shape from Artifact 2.

### `GET /api/shop/:slug/menu`
Active categories (by `displayOrder`) → active items → modifiers → options.
```json
[
  {
    "id": 1, "name": "Coffee", "displayOrder": 1,
    "items": [
      {
        "id": 10, "name": "Cappuccino", "description": "Espresso with steamed milk", "price": "4.50",
        "modifiers": [
          { "id": 101, "name": "Size", "type": "single-select", "required": true,
            "options": [
              { "id": 201, "label": "Small", "priceAdjustment": "0.00" },
              { "id": 202, "label": "Large", "priceAdjustment": "1.00" }
            ] },
          { "id": 102, "name": "Extras", "type": "multi-select", "required": false,
            "options": [
              { "id": 204, "label": "Extra shot", "priceAdjustment": "0.75" },
              { "id": 205, "label": "Syrup", "priceAdjustment": "0.50" }
            ] }
        ]
      }
    ]
  }
]
```

### `POST /api/shop/:slug/orders`
Client sends **IDs + quantities only** — tenant comes from `:slug`, never the body. The server resolves, validates (INV-2/8/9/10/11/12/14), prices (INV-1/13), assigns the per-café number (INV-6), and snapshots (INV-3).

Request:
```json
{
  "items": [
    { "menuItemId": 10, "quantity": 2,
      "selectedModifiers": [
        { "modifierId": 101, "optionIds": [202] },
        { "modifierId": 102, "optionIds": [204, 205] }
      ] }
  ]
}
```
Response `201`:
```json
{ "orderNumber": "ORD-0042", "totalPrice": "13.50", "status": "PENDING", "createdAt": "2026-06-30T14:32:00Z" }
```
`2 × (4.50 + 1.00 + 0.75 + 0.50) = 13.50`

### `GET /api/staff/orders?status=PENDING`
Renders entirely from snapshots — never touches the live menu (INV-3).
```json
[
  {
    "id": 42, "orderNumber": "ORD-0042", "status": "PENDING", "totalPrice": "13.50",
    "createdAt": "2026-06-30T14:32:00Z",
    "items": [
      { "itemName": "Cappuccino", "quantity": 2, "unitPrice": "4.50",
        "selectedModifiers": [
          { "modifierName": "Size", "options": [{ "label": "Large", "priceAdjustment": "1.00" }] },
          { "modifierName": "Extras", "options": [
            { "label": "Extra shot", "priceAdjustment": "0.75" },
            { "label": "Syrup", "priceAdjustment": "0.50" }
          ] }
        ] }
    ]
  }
]
```
