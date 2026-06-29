# Claude Code - Build Instructions

## Quick Start Guide for Building Digital Menu System

This file guides you through building a simple restaurant ordering system in Claude Code.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (use Neon for free managed DB)
- **ORM:** Prisma (schema + migrations)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React hooks
- **Real-time:** Polling (2-second intervals)

---

## Project Setup

### 1. Initialize Next.js Project
```bash
npx create-next-app@latest digital-menu --typescript --tailwind
cd digital-menu
```

### 2. Install Dependencies
```bash
npm install prisma @prisma/client
npm install shadcn-ui
npx shadcn-ui@latest init
```

### 3. Setup Database
- Create free PostgreSQL database on Neon (neon.tech)
- Copy connection string: `postgresql://user:password@host/database`
- Create `.env.local`:
```
DATABASE_URL="postgresql://user:password@host/database"
```

### 4. Setup Prisma
```bash
npx prisma init
```
- Update `prisma/.env` with DATABASE_URL
- Create schema (see below)

---

## Database Schema (Prisma)

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model MenuItem {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  price       Decimal  @db.Decimal(10, 2)
  active      Boolean  @default(true)
  modifiers   Modifier[]
  orderItems  OrderItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Modifier {
  id          Int      @id @default(autoincrement())
  menuItem    MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  menuItemId  Int
  name        String   // e.g., "Size", "Toppings"
  type        String   // e.g., "single-select", "multi-select"
  options     ModifierOption[]
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ModifierOption {
  id              Int      @id @default(autoincrement())
  modifier        Modifier @relation(fields: [modifierId], references: [id], onDelete: Cascade)
  modifierId      Int
  label           String   // e.g., "Small", "Medium", "Large"
  priceAdjustment Decimal  @default(0) @db.Decimal(10, 2)
  active          Boolean  @default(true)
}

model Order {
  id          Int       @id @default(autoincrement())
  orderNumber String    @unique
  status      OrderStatus @default(PENDING)
  totalPrice  Decimal   @db.Decimal(10, 2)
  items       OrderItem[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum OrderStatus {
  PENDING
  CONFIRMED
}

model OrderItem {
  id          Int      @id @default(autoincrement())
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId     Int
  menuItem    MenuItem @relation(fields: [menuItemId], references: [id])
  menuItemId  Int
  quantity    Int
  price       Decimal  @db.Decimal(10, 2)  // Price at time of order
  modifiers   Json     // { modifierId: optionId }
  createdAt   DateTime @default(now())
}
```

**Apply schema:**
```bash
npx prisma migrate dev --name init
```

---

## File Structure

```
digital-menu/
├── app/
│   ├── api/
│   │   ├── menu/
│   │   │   └── route.ts          (GET /api/menu)
│   │   ├── orders/
│   │   │   ├── route.ts          (POST /api/orders)
│   │   │   └── [orderNumber]/
│   │   │       └── route.ts      (GET /api/orders/:orderNumber)
│   │   ├── staff/
│   │   │   └── orders/
│   │   │       ├── route.ts      (GET /api/staff/orders)
│   │   │       └── [orderId]/
│   │   │           └── confirm/
│   │   │               └── route.ts (PATCH confirm order)
│   │   └── admin/
│   │       ├── items/
│   │       │   ├── route.ts      (GET/POST items)
│   │       │   └── [itemId]/
│   │       │       └── route.ts  (PATCH/DELETE item)
│   │       ├── modifiers/
│   │       │   ├── route.ts      (POST modifier)
│   │       │   └── [modifierId]/
│   │       │       └── route.ts  (PATCH modifier)
│   │       └── orders/
│   │           └── route.ts      (GET all orders)
│   ├── (customer)/
│   │   ├── page.tsx              (Menu + Cart)
│   │   ├── order-confirmation/
│   │   │   └── [orderNumber]/
│   │   │       └── page.tsx
│   │   └── orders/
│   │       └── page.tsx          (Order History)
│   ├── staff/
│   │   └── page.tsx              (Order Dashboard)
│   ├── admin/
│   │   ├── page.tsx              (Menu Management)
│   │   └── items/
│   │       └── [itemId]/
│   │           └── modifiers/
│   │               └── page.tsx
│   └── layout.tsx
├── components/
│   ├── MenuCard.tsx              (Item card with modifiers)
│   ├── Cart.tsx                  (Cart sidebar/modal)
│   ├── OrderCard.tsx             (Staff order card)
│   └── ui/                       (shadcn components)
├── lib/
│   ├── prisma.ts                 (Prisma client)
│   ├── utils.ts                  (Helpers)
│   └── orders.ts                 (Order generation logic)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                   (Optional: seed dummy data)
├── .env.local
└── package.json
```

---

## Key Implementation Steps

### Step 1: Prisma Client Setup
Create `lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 2: API Routes (Start Simple)
- Build `api/menu/route.ts` first (GET all active items with modifiers)
- Then `api/orders/route.ts` (POST create order)
- Then `api/staff/orders/route.ts` (GET pending orders)

### Step 3: Customer Pages
- Build `/page.tsx` (menu + cart)
  - Fetch menu on load
  - Display items with modifiers
  - Local state for cart
  - Checkout → POST /api/orders → redirect to confirmation
- Build order confirmation page

### Step 4: Staff Dashboard
- Build `/staff/page.tsx`
  - Fetch pending orders
  - Setup polling (every 2 seconds)
  - Display orders with confirm button
  - Update UI on confirm

### Step 5: Admin Pages
- Build `/admin/page.tsx`
  - List menu items
  - Add/edit/delete items
- Build modifier management (optional for MVP)

### Step 6: Polish
- Mobile responsiveness
- Error handling
- Loading states
- Better UI with shadcn components

---

## Important Notes

### Order Number Generation
Simple approach: use auto-increment ID with prefix
```typescript
const orderNumber = `ORD-${String(order.id).padStart(4, '0')}`
```

### Calculate Total Price
Always on the server (API route), never trust client:
```typescript
// In POST /api/orders
let totalPrice = 0
for (const item of orderItems) {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: item.itemId },
  })
  let itemPrice = menuItem.price * item.quantity
  
  // Add modifier prices
  for (const [modId, optionId] of Object.entries(item.selectedModifiers)) {
    const option = await prisma.modifierOption.findUnique({
      where: { id: Number(optionId) },
    })
    itemPrice += option.priceAdjustment * item.quantity
  }
  
  totalPrice += itemPrice
}
```

### Real-time Polling (Staff Dashboard)
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch('/api/staff/orders')
    const orders = await res.json()
    setOrders(orders)
  }, 2000) // Poll every 2 seconds
  
  return () => clearInterval(interval)
}, [])
```

### Modifiers Structure
Store in OrderItem as JSON:
```typescript
// When saving order item
modifiers: {
  "1": "3",      // modifierId: optionId
  "2": "7"
}
```

---

## Testing Checklist

- [ ] Create menu item
- [ ] View menu
- [ ] Add item to cart with modifiers
- [ ] Checkout → get order number
- [ ] Staff sees new order in dashboard
- [ ] Staff confirms order
- [ ] Order status changes
- [ ] Order history shows all orders
- [ ] Mobile view works (menu, cart, staff)

---

## Next Steps (Post-MVP)

1. Add authentication (staff login)
2. WebSocket instead of polling
3. Kitchen display system (KDS)
4. Payment integration
5. Reports & analytics
6. Email notifications
7. Table management
8. Inventory tracking

---

## Resources

- Prisma docs: https://www.prisma.io/docs/
- Next.js App Router: https://nextjs.org/docs/app
- shadcn/ui: https://ui.shadcn.com/
- Neon database: https://neon.tech/

---

Good luck! Start with API routes first, then UI. Keep it simple. 🚀
