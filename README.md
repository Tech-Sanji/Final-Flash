# DropZone — Midnight Product Drop

> ACM MPSTME Hackathon — Full Stack Problem 2  
> Stack: Next.js 14 · Prisma ORM · SQLite · Claude AI API

---

## Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env.local

# 3. Setup database (creates SQLite file + seeds data)
npm run db:setup

# 4. Start dev server
npm run dev
```

Open **http://localhost:3000**

---

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| demo@dropzone.io | drop2024 | User |
| admin@dropzone.io | admin2024 | Admin |
| judge@hackathon.io | judge2024 | Judge |

> All users are stored in the SQLite database and validated via API.

---

## Pages

| Route | Description |
|-------|-------------|
| `/login` | DB-authenticated login |
| `/` | Flash sale — live countdown + buy button |
| `/orders` | All successful orders with search |
| `/admin` | System dashboard + stock reset |
| `/test` | Stress test — fire 5–200 concurrent buyers |

---

## Database

- **SQLite** via **Prisma ORM** — zero external server needed
- Database file created at `prisma/dropzone.db`
- Three models: `Product`, `Order`, `User`

```bash
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:reset     # Wipe and re-seed database
npm run db:seed      # Re-seed without wiping schema
```

---

## Architecture

```
Frontend (Next.js)
    ↓
API Routes (/api/*)
    ↓
Prisma ORM
    ↓
SQLite Database (dropzone.db)
```

### Concurrency Solution

Purchases use a **Prisma `$transaction`** with a conditional update:

```typescript
await prisma.$transaction(async (tx) => {
  // Atomic: only succeeds if stock > 0
  const updated = await tx.product.update({
    where: { id: 1, stock: { gt: 0 } },
    data: { stock: { decrement: 1 } },
  });
  // Create order only if update succeeded
  await tx.order.create({ ... });
});
```

If two requests arrive simultaneously, SQLite's write lock serializes them. Only the first N succeed.

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/login` | POST | Validates user against DB |
| `/api/purchase` | POST | Atomic buy with Prisma transaction |
| `/api/stats` | GET | Live inventory + orders from DB |
| `/api/reset` | POST | Reset stock + clear orders |
| `/api/ai` | POST | ARIA chatbot with live DB context |
