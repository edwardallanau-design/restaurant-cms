# Prompt for Claude Code - Digital Menu Ordering System

Use this prompt in Claude Code. Upload or paste the `design.md` and `claude.md` files when prompted.

---

## Prompt Template

```
You are building a digital menu ordering system for restaurants/cafes.

Reference the attached files:
- design.md: System design, database schema, API endpoints, pages, user flows
- claude.md: Build instructions, setup steps, file structure, implementation notes

Build the entire Next.js application following these guidelines:

1. Start with database schema (Prisma)
2. Build API routes (menu, orders, staff, admin)
3. Build customer pages (menu + cart, order confirmation, order history)
4. Build staff dashboard (real-time order display with polling)
5. Build admin pages (menu item & modifier management)
6. Add mobile responsiveness
7. Ensure all price calculations happen server-side

Keep it simple, clean, and aligned with the MVP scope in the design doc.

No authentication/login yet. No payment processing. Just order creation and staff confirmation.

Start by setting up the project structure and database schema, then build incrementally.
```

---

## How to Use in Claude Code

1. Open Claude Code
2. Paste the prompt above
3. Upload `design.md` and `claude.md` as files
4. Let Claude read them and start building

Claude will reference the files as needed for schema, endpoints, pages, and implementation details.

---

## Alternative: Shorter Prompt

If you want even simpler:

```
Build a Next.js digital menu ordering system using the attached design.md and claude.md files.

Follow claude.md for setup and structure.
Follow design.md for schema, APIs, and pages.

Start with database setup, then build incrementally: API routes → Customer pages → Staff dashboard → Admin pages.
```

---

Choose whichever works best for you!
