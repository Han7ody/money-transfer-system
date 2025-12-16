# 🚀 Quick Start - Agent Management System

## ⚡ Fast Setup (3 Steps)

### Step 1: Run Database Migration

**Option A - Using Command File (Easiest):**
```cmd
migrate-database.cmd
```

**Option B - Manual:**
```bash
cd backend
npx prisma migrate dev --name add_agent_and_cash_pickup
npx prisma generate
cd ..
```

### Step 2: Start Backend

Open a terminal and run:
```bash
cd backend
npm run dev
```

✅ Backend should start on `http://localhost:5000`

### Step 3: Start Frontend

Open another terminal and run:
```bash
cd frontend
npm run dev
```

✅ Frontend should start on `http://localhost:3000`

---

## 🎯 What Was Implemented

### Backend (100% Complete)
- ✅ Agent model in database
- ✅ 8 Agent API endpoints (CRUD + more)
- ✅ Agent assignment to transactions
- ✅ Pickup code generation
- ✅ Pickup confirmation
- ✅ Email notifications
- ✅ Audit logging

### Frontend (60% Complete)
- ✅ Agent API client methods
- ✅ Agents list page with real data
- ✅ Search and filtering
- ✅ Pagination
- ⏳ Agent form modal (pending)
- ⏳ Transaction integration (pending)

---

## 📋 Testing the System

### 1. Access Agents Page

1. Open `http://localhost:3000`
2. Login as admin
3. Navigate to `/admin/agents`
4. You should see an empty agents list

### 2. Create Test Agent via API

Use this curl command (replace YOUR_TOKEN with your actual token):

```bash
curl -X POST http://localhost:5000/api/admin/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fullName": "أحمد محمد",
    "phone": "+249912345678",
    "whatsapp": "+249912345678",
    "city": "الخرطوم",
    "maxDailyAmount": 50000
  }'
```

Or use Postman/Insomnia with:
- **URL:** `POST http://localhost:5000/api/admin/agents`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN`
- **Body:**
```json
{
  "fullName": "أحمد محمد",
  "phone": "+249912345678",
  "whatsapp": "+249912345678",
  "city": "الخرطوم",
  "maxDailyAmount": 50000
}
```

### 3. Verify Agent Appears

Refresh the agents page - you should see your new agent!

---

## 🔍 Available API Endpoints

### Agent Management
```
GET    /api/admin/agents                    - List all agents
GET    /api/admin/agents/available          - Get available agents
GET    /api/admin/agents/:id                - Get agent details
POST   /api/admin/agents                    - Create agent
PUT    /api/admin/agents/:id                - Update agent
PUT    /api/admin/agents/:id/status         - Update status
DELETE /api/admin/agents/:id                - Delete agent
GET    /api/admin/agents/:id/transactions   - Get agent transactions
```

### Transaction Integration
```
POST   /api/admin/transactions/:id/assign-agent    - Assign agent
POST   /api/admin/transactions/:id/confirm-pickup  - Confirm pickup
```

---

## 🐛 Troubleshooting

### "Network Error" in Frontend

**Problem:** Backend is not running

**Solution:**
```bash
cd backend
npm run dev
```

### "Table 'agents' doesn't exist"

**Problem:** Migration not run

**Solution:**
```bash
cd backend
npx prisma migrate dev --name add_agent_and_cash_pickup
npx prisma generate
```

### "Cannot find module '@prisma/client'"

**Problem:** Prisma client not generated

**Solution:**
```bash
cd backend
npx prisma generate
```

### Backend won't start

**Problem:** Database connection issue

**Solution:** Check `backend/.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/rasid_db"
```

---

## 📊 Database Schema Changes

### New Table: `agents`
```sql
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR NOT NULL,
  phone VARCHAR UNIQUE NOT NULL,
  whatsapp VARCHAR,
  city VARCHAR NOT NULL,
  country VARCHAR DEFAULT 'Sudan',
  status VARCHAR DEFAULT 'ACTIVE',
  max_daily_amount DECIMAL(15,2) NOT NULL,
  current_daily_amount DECIMAL(15,2) DEFAULT 0,
  active_transactions INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Updated Table: `transactions`
```sql
ALTER TABLE transactions ADD COLUMN payout_method VARCHAR;
ALTER TABLE transactions ADD COLUMN pickup_city VARCHAR;
ALTER TABLE transactions ADD COLUMN assigned_agent_id INTEGER;
ALTER TABLE transactions ADD COLUMN assigned_at TIMESTAMP;
ALTER TABLE transactions ADD COLUMN pickup_code VARCHAR UNIQUE;
ALTER TABLE transactions ADD COLUMN pickup_verified_at TIMESTAMP;
ALTER TABLE transactions ADD COLUMN pickup_verified_by_agent_id INTEGER;
```

---

## 🎨 UI Features

### Agents Page (`/admin/agents`)
- ✅ Real-time agent list
- ✅ Search by name, phone, or city
- ✅ Filter by status (ACTIVE, SUSPENDED, etc.)
- ✅ Pagination
- ✅ Agent cards with statistics
- ✅ Daily usage progress bar
- ✅ Delete agent functionality
- ⏳ Create agent (button exists, modal pending)
- ⏳ Edit agent (button exists, modal pending)

---

## 📝 Next Development Tasks

### High Priority (2-3 days)

1. **Agent Form Modal**
   - Create/Edit agent form
   - Validation
   - Submit to API

2. **Transaction Detail Page**
   - Show pickup city
   - Assign agent button
   - Show assigned agent details
   - Display pickup code
   - Confirm pickup button

3. **Assign Agent Modal**
   - Fetch available agents
   - Show agent capacity
   - Confirm assignment

4. **Confirm Pickup Modal**
   - Input pickup code
   - Validation
   - Confirmation

### Medium Priority (1 week)

5. **User Transaction Form**
   - Add payout method selector
   - Pickup city input
   - Validation

6. **Transaction Timeline**
   - Add READY_FOR_PICKUP status
   - Show agent assignment
   - Show pickup confirmation

---

## 📚 Documentation

- **Full Implementation:** `AGENT_CASH_PICKUP_COMPLETE.md`
- **Setup Instructions:** `SETUP_INSTRUCTIONS.md`
- **API Documentation:** See backend controllers
- **Database Schema:** `backend/src/models/schema.prisma`

---

## ✅ Verification Checklist

- [ ] Database migration completed
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Can access `/admin/agents` page
- [ ] Can create agent via API
- [ ] Agent appears in list
- [ ] Search works
- [ ] Filter works
- [ ] Pagination works
- [ ] Delete works

---

## 🎉 Success!

If you can see the agents page and create agents via API, the system is working!

**Next:** Implement the agent form modal to create agents from the UI.

---

**Need Help?** Check the error messages in:
- Backend terminal
- Frontend terminal
- Browser console (F12)
