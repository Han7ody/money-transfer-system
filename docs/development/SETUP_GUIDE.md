# 🚀 Setup Instructions for Agent System

## Step 1: Run Database Migration

The Agent model and Transaction extensions need to be migrated to the database.

```bash
cd backend
npx prisma migrate dev --name add_agent_and_cash_pickup
npx prisma generate
```

This will:
- Create the `agents` table
- Add new fields to `transactions` table
- Create new enums (AgentStatus, PayoutMethod)
- Add READY_FOR_PICKUP to TransactionStatus

## Step 2: Start Backend Server

```bash
cd backend
npm run dev
```

The backend should start on `http://localhost:5000`

## Step 3: Start Frontend Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend should start on `http://localhost:3000`

## Step 4: Verify Setup

1. Check backend is running:
   - Open `http://localhost:5000/api/health`
   - Should return: `{"success":true,"message":"Server is running"}`

2. Check frontend is running:
   - Open `http://localhost:3000`
   - Should load the login page

3. Login as admin and navigate to:
   - `http://localhost:3000/admin/agents`
   - Should load the agents page (empty initially)

## Step 5: Create Test Agent (Optional)

You can create a test agent using the API or through the UI once the modal is implemented.

Using curl:
```bash
curl -X POST http://localhost:5000/api/admin/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fullName": "أحمد محمد",
    "phone": "+249912345678",
    "whatsapp": "+249912345678",
    "city": "الخرطوم",
    "maxDailyAmount": 50000,
    "notes": "وكيل تجريبي"
  }'
```

## Troubleshooting

### Error: "Network Error"
- **Cause:** Backend server is not running
- **Solution:** Start backend with `npm run dev` in backend folder

### Error: "Table 'agents' doesn't exist"
- **Cause:** Migration not run
- **Solution:** Run `npx prisma migrate dev` in backend folder

### Error: "Column 'payoutMethod' doesn't exist"
- **Cause:** Migration not run
- **Solution:** Run `npx prisma migrate dev` in backend folder

### Error: "Cannot find module '@prisma/client'"
- **Cause:** Prisma client not generated
- **Solution:** Run `npx prisma generate` in backend folder

## Database Seeding (Optional)

If you want to seed some test agents, create a seed file:

```typescript
// backend/src/seed-agents.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const agents = [
    {
      fullName: 'أحمد محمد علي',
      phone: '+249912345678',
      whatsapp: '+249912345678',
      city: 'الخرطوم',
      country: 'Sudan',
      maxDailyAmount: 50000,
      status: 'ACTIVE'
    },
    {
      fullName: 'محمد أحمد حسن',
      phone: '+249923456789',
      whatsapp: '+249923456789',
      city: 'أم درمان',
      country: 'Sudan',
      maxDailyAmount: 100000,
      status: 'ACTIVE'
    },
    {
      fullName: 'عبدالله يوسف',
      phone: '+249934567890',
      whatsapp: '+249934567890',
      city: 'بحري',
      country: 'Sudan',
      maxDailyAmount: 75000,
      status: 'ACTIVE'
    }
  ];

  for (const agent of agents) {
    await prisma.agent.create({ data: agent });
  }

  console.log('✅ Seeded 3 test agents');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with:
```bash
cd backend
npx ts-node src/seed-agents.ts
```

## Next Steps

Once the backend is running and migration is complete:

1. ✅ Agents page will load real data
2. ⏳ Implement AgentFormModal for create/edit
3. ⏳ Update transaction detail page for agent assignment
4. ⏳ Implement pickup confirmation flow

## Current Status

- ✅ Backend API: Complete
- ✅ Database Schema: Complete
- ✅ Frontend API Client: Complete
- ✅ Agents List Page: Complete
- ⏳ Agent Form Modal: Pending
- ⏳ Transaction Integration: Pending
