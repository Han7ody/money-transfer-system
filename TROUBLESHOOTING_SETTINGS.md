# 🔧 Troubleshooting: "Failed to update system settings"

## Problem

Getting error: **"Failed to update system settings"** when trying to save settings in the Admin General Settings page.

---

## Root Cause

The `SystemSettings` model was added to Prisma schema but the Prisma client was not regenerated, causing TypeScript errors like:

```
Property 'systemSettings' does not exist on type 'PrismaClient'
```

---

## ✅ Solution Steps

### Step 1: Stop All Running Processes

```bash
# Stop backend if running (Ctrl+C or)
# Check for any Node processes on port 5000/54112
```

### Step 2: Run SQL Migration Manually

Since Prisma migrate had permission issues, run the SQL directly:

```bash
# Option A: Using psql command line
psql -U postgres -d money_transfer_db -f backend/src/models/migrations/add_system_settings.sql

# Option B: Using pgAdmin or any PostgreSQL client
# Open and execute: backend/src/models/migrations/add_system_settings.sql
```

**Verify migration succeeded:**
```sql
SELECT * FROM system_settings LIMIT 1;
```

### Step 3: Generate Prisma Client (IMPORTANT)

The Prisma client generation failed earlier due to file permissions. Try these options:

#### Option A: Close VS Code and Regenerate
```bash
# 1. Close VS Code completely
# 2. Open new terminal as Administrator (Windows)
cd c:\money-transfer-system\backend

# 3. Delete existing Prisma client
rmdir /s /q node_modules\.prisma

# 4. Generate fresh client
npx prisma generate
```

#### Option B: Manual Prisma Client Update (if Option A fails)
```bash
# Delete lock files
del package-lock.json
del node_modules\.prisma -Recurse -Force

# Reinstall
npm install
npx prisma generate
```

#### Option C: Restart Computer (if all else fails)
Sometimes Windows locks the DLL file. A restart will release it.

### Step 4: Verify Prisma Client Was Generated

Check that the client includes SystemSettings:

```bash
# Check the generated types
type node_modules\.prisma\client\index.d.ts | findstr "systemSettings"
```

**Expected output:**
```typescript
systemSettings: Prisma.SystemSettingsDelegate<GlobalReject>;
```

### Step 5: Run Seed Script

```bash
cd backend
npm run seed
```

**Expected output:**
```
Created/updated super admin user: superadmin@moneytransfer.com
Created/updated admin user: admin@moneytransfer.com
Inserted 4 currencies.
Inserted 3 exchange rates.
Inserted 2 sample audit logs.
Inserted 12 default system settings.  ← This line is important!
Seeding finished.
```

### Step 6: Restart Backend Server

```bash
cd backend
npm run dev
```

**Expected output:**
```
🚀 Server is running on port 5000
📡 API: http://localhost:5000/api
```

### Step 7: Test API Directly

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"superadmin@moneytransfer.com\",\"password\":\"SuperAdmin@123\"}"

# Copy the token from response, then:
curl -X GET http://localhost:5000/api/admin/system/settings ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** JSON with 12 settings

### Step 8: Test Frontend

```bash
# Start frontend
cd frontend
npm run dev
```

Navigate to: `http://localhost:3000/admin/settings/general`

---

## 🔍 Diagnostic Commands

### Check Database Connection
```bash
cd backend
npx prisma db pull
```

### Check Prisma Schema
```bash
cd backend
npx prisma validate
```

### Check if Table Exists
```sql
-- In PostgreSQL
\dt system_settings

-- Or
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'system_settings';
```

### Check Prisma Client Version
```bash
cd backend
npm list @prisma/client
```

---

## 🚨 Common Issues

### Issue 1: "EPERM: operation not permitted"

**Cause:** Windows file lock on Prisma DLL

**Solutions:**
1. Close VS Code completely
2. Stop all Node processes
3. Delete `node_modules\.prisma` folder
4. Run `npx prisma generate` as Administrator
5. If still fails, restart computer

### Issue 2: "Table system_settings does not exist"

**Cause:** Migration not run

**Solution:**
```bash
psql -U postgres -d money_transfer_db -f backend/src/models/migrations/add_system_settings.sql
```

### Issue 3: "Authentication failed against database"

**Cause:** Wrong database credentials

**Solution:**
Check `.env` file:
```env
DATABASE_URL="postgresql://postgres:han7ody@localhost:5432/money_transfer_db?schema=public"
```

Test connection:
```bash
psql -U postgres -d money_transfer_db -c "SELECT 1;"
```

### Issue 4: Seed shows "0 default system settings"

**Cause:** Prisma client not generated

**Solution:**
```bash
cd backend
npx prisma generate
npm run seed
```

### Issue 5: Frontend shows empty form

**Cause:** Backend API not returning settings

**Check:**
1. Backend server is running
2. Check browser console for errors
3. Check Network tab for API response
4. Verify API endpoint: `GET /api/admin/system/settings`

---

## 🎯 Quick Fix (Nuclear Option)

If nothing works, do a complete reset:

```bash
# 1. Stop all processes
# 2. Delete Prisma client
cd backend
rmdir /s /q node_modules\.prisma

# 3. Run migration manually
psql -U postgres -d money_transfer_db -f src/models/migrations/add_system_settings.sql

# 4. Close VS Code
# 5. Reopen VS Code as Administrator

# 6. Reinstall and generate
npm install
npx prisma generate

# 7. Seed
npm run seed

# 8. Start server
npm run dev
```

---

## ✅ Verification Checklist

After fixing, verify these:

- [ ] SQL migration ran successfully
- [ ] `system_settings` table exists in database
- [ ] Prisma client generated (no TypeScript errors)
- [ ] Seed script inserted 12 settings
- [ ] Backend server starts without errors
- [ ] GET `/api/admin/system/settings` returns data
- [ ] Frontend page loads without errors
- [ ] Can update settings and save successfully

---

## 📝 Still Not Working?

### Check Backend Logs

Look for these specific errors:

```typescript
// TypeScript compilation errors
Property 'systemSettings' does not exist on type 'PrismaClient'

// Runtime errors
PrismaClientKnownRequestError: Table 'system_settings' does not exist
```

### Check Frontend Console

Look for:
```
Failed to fetch system settings
403 Forbidden (wrong role)
401 Unauthorized (not logged in)
```

### Database Query Test

```sql
-- Check if settings exist
SELECT COUNT(*) FROM system_settings;
-- Should return 12

-- Check specific setting
SELECT * FROM system_settings WHERE key = 'platformName';
-- Should return one row
```

---

## 🎯 Expected Final State

When everything is working:

1. **Database:** `system_settings` table with 12 rows
2. **Prisma Client:** Generated with `systemSettings` property
3. **Backend:** Server running, no TypeScript errors
4. **API:** GET `/api/admin/system/settings` returns all 12 settings
5. **Frontend:** Settings page loads and displays all fields
6. **Save:** Can update settings without errors
7. **Audit:** Changes logged to `audit_logs` table

---

## 📞 Support Files

- **Deployment Guide:** `ADMIN_SETTINGS_DEPLOYMENT.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **API Tests:** `CURL_TESTS_SETTINGS.md`
- **Quick Reference:** `SETTINGS_QUICK_REFERENCE.md`

---

**Last Updated:** 2025-11-25
**Module Version:** 1.0.0
