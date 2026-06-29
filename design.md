# Digital Menu & Order System - Design Doc

## System Overview
A simple web-based ordering system for restaurants/cafes. Customers browse menu, add items with modifiers, checkout to get order number. Staff view pending orders in real-time and confirm them. No payment processing, no kitchen integration yet.

---

## Database Schema

### Menu Items
```
items
- id (primary key)
- name (string)
- description (text)
- price (decimal)
- active (boolean)
- createdAt
- updatedAt
```

### Item Modifiers
```
modifiers
- id (primary key)
- itemId (foreign key → items)
- name (string) e.g., "Size", "Toppings", "Extras"
- type (string) e.g., "single-select", "multi-select"
- active (boolean)
```

### Modifier Options
```
modifier_options
- id (primary key)
- modifierId (foreign key → modifiers)
- label (string) e.g., "Small", "Medium", "Large"
- priceAdjustment (decimal) default 0
- active (boolean)
```

### Orders
```
orders
- id (primary key)
- orderNumber (string) e.g., "ORD-001", "ORD-002"
- status (enum) "pending" | "confirmed"
- totalPrice (decimal)
- createdAt
- updatedAt
```

### Order Items
```
order_items
- id (primary key)
- orderId (foreign key → orders)
- itemId (foreign key → items)
- quantity (integer)
- price (decimal) at time of order
- modifiers (JSON) selected modifiers + options
```

---

## API Endpoints

### Customer Routes
```
GET /api/menu
  → Returns all active items with modifiers

POST /api/orders
  body: {
    items: [
      { itemId, quantity, selectedModifiers: { modifierId: optionId } }
    ]
  }
  → Returns { orderNumber, orderId, totalPrice }

GET /api/orders/:orderNumber
  → Returns order details (for receipt/confirmation)
```

### Staff Routes
```
GET /api/staff/orders
  → Returns all pending orders, sorted by createdAt (newest first)

PATCH /api/staff/orders/:orderId/confirm
  → Updates status to "confirmed"
  → Returns updated order
```

### Admin Routes
```
GET /api/admin/items
  → Returns all items (active + inactive)

POST /api/admin/items
  body: { name, description, price, active }
  → Creates new item

PATCH /api/admin/items/:itemId
  body: { name, description, price, active }
  → Updates item

DELETE /api/admin/items/:itemId
  → Soft delete (sets active: false)

GET /api/admin/modifiers/:itemId
  → Returns modifiers for an item

POST /api/admin/modifiers
  body: { itemId, name, type, options: [{ label, priceAdjustment }] }
  → Creates modifier with options

PATCH /api/admin/modifiers/:modifierId
  → Updates modifier

GET /api/admin/orders
  → Returns all orders with filters (date, status)
```

---

## Pages & Routes

### Customer Interface
- **`/`** – Menu + Cart
  - Display all active items
  - Click item → modal with modifiers
  - Add to cart → updates cart icon
  - View cart → shows items, price breakdown
  - Checkout → generates order number

- **`/order-confirmation/:orderNumber`** – Confirmation page
  - Shows order number, items, total price
  - "Show this to staff" message
  - Print button (optional)

### Staff Interface
- **`/staff`** – Order Dashboard
  - Real-time list of pending orders
  - Each order shows: order number, items, time created
  - "Confirm Order" button for each
  - Auto-refresh (polling every 2 seconds)
  - Confirmed orders move to history or disappear

### Admin Interface
- **`/admin`** – Menu Management
  - Add new item (name, price, description)
  - List all items (active + inactive)
  - Edit item → update name, price, active status
  - Delete item (soft delete)

- **`/admin/items/:itemId/modifiers`** – Modifier Management
  - Add modifier to item (e.g., "Size")
  - Define options (Small +$0, Medium +$0.50, Large +$1)
  - Edit/delete modifiers
  - Toggle active/inactive

### History
- **`/orders`** – Order History
  - List all orders (paginated, newest first)
  - Filter by status (pending, confirmed)
  - Show order number, items count, total price, time

---

## User Flows

### Customer Flow
1. Visit `/` → sees menu
2. Click item → modal opens with name, description, price, modifiers
3. Select modifiers → price updates dynamically
4. Click "Add to Cart"
5. View cart → review items, prices
6. Click "Checkout" → order created, redirected to confirmation page
7. See order number → show to staff to pay

### Staff Flow
1. Visit `/staff` → sees all pending orders
2. Orders auto-update in real-time (polling)
3. See order details: order number, items with modifiers, total
4. Click "Confirm Order" → status changes to "confirmed"
5. Customer pays in person

### Admin Flow
1. Visit `/admin` → sees menu items
2. Add Item → form (name, price, description) → item created
3. Edit Item → click item → modal → update → save
4. Delete Item → soft delete (sets active: false)
5. Click item → manage modifiers
6. Add Modifier → define name, type, options (with price adjustments)
7. Save → modifier linked to item

---

## Data Flow (Simplified)

```
Customer:
  Menu (GET /api/menu) → Display items
  Click item → Show modifiers
  Add to cart → Update local state
  Checkout → POST /api/orders → Get order number → Show confirmation

Staff:
  Load /staff → GET /api/staff/orders → Display pending
  Every 2s: Polling /api/staff/orders → Check for new
  Click confirm → PATCH /api/staff/orders/:orderId/confirm → Update UI

Admin:
  Load /admin → GET /api/admin/items
  Add/Edit → POST/PATCH /api/admin/items
  Manage modifiers → GET/POST/PATCH /api/admin/modifiers
```

---

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Database:** PostgreSQL (Neon/Supabase) or SQLite (local dev)
- **ORM:** Prisma
- **UI:** Tailwind CSS + shadcn/ui
- **State:** React hooks (useState, useContext)
- **Real-time:** Polling (2s intervals) for MVP
- **Hosting:** Vercel (frontend) + managed DB

---

## Implementation Priority (MVP)

1. **Database setup** (schema + seed data)
2. **Customer menu page** (GET menu, display items)
3. **Add to cart** (local state)
4. **Checkout** (POST order, generate order number)
5. **Staff dashboard** (GET pending orders, polling)
6. **Confirm order** (PATCH order status)
7. **Admin menu management** (ADD/EDIT/DELETE items)
8. **Admin modifier management**
9. **Order history page**
10. **Mobile responsiveness** (Tailwind)

---

## Notes

- No authentication/login for MVP (add later if needed)
- Modifiers are dynamic: each item can have different modifiers
- Order number format: simple auto-increment or UUID (decide later)
- Polling is simpler than WebSocket for MVP; switch to WebSocket if scaling needed
- No payment processing yet
- All prices calculated server-side (prevent client-side manipulation)
