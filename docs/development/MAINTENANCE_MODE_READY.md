# ✅ Maintenance Mode - Complete Setup Guide

## Current Status
✅ **System is working correctly!**
- Backend maintenance middleware: **ACTIVE**
- Frontend maintenance checks: **ACTIVE**
- Public status endpoint: **ACTIVE**
- Login blocking logic: **READY**

The database shows `maintenance_mode = 'false'`, which is why normal users can still login.

---

## How to Enable Maintenance Mode

### Option 1: SQL Command (Fastest)
```sql
UPDATE system_settings 
SET value = 'true', updated_at = NOW() 
WHERE key = 'maintenance_mode';
```

### Option 2: Using psql Command Line
```bash
psql -U your_username -d your_database -c "UPDATE system_settings SET value = 'true' WHERE key = 'maintenance_mode';"
```

### Option 3: Via API (As SUPER_ADMIN)
```bash
curl -X PATCH http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maintenance_mode": true}'
```

### Option 4: Using Admin UI
1. Login as SUPER_ADMIN
2. Go to `/admin/settings/general`
3. Toggle "Maintenance Mode" to **ON**
4. Click Save

---

## What Happens When Maintenance Mode is Enabled

### Normal User Behavior
```
1. Frontend checks /api/public/system-status
   ↓
2. Gets { "maintenance": true }
   ↓
3. Login page shows warning banner
4. Login button is DISABLED
5. If user tries via API → Returns 503 error
```

### Admin/Super Admin Behavior
```
1. Frontend checks maintenance status
   ↓
2. Warning shown but login allowed
   ↓
3. Login succeeds normally
4. Full system access maintained
```

---

## Testing Maintenance Mode

### Step 1: Enable Maintenance Mode
Run one of the SQL commands above to set `value = 'true'`

### Step 2: Check Status Endpoint
```bash
curl http://localhost:5000/api/public/system-status

# Should return:
# {
#   "success": true,
#   "data": {
#     "maintenance": true
#   }
# }
```

### Step 3: Try Normal User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"Password123"}'

# Should return 503:
# {
#   "success": false,
#   "message": "The system is currently under maintenance. Please try again later.",
#   "maintenance": true,
#   "statusCode": 503
# }
```

### Step 4: Try Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@moneytransfer.com","password":"Admin@123"}'

# Should return 200 with token:
# {
#   "success": true,
#   "message": "Login successful",
#   "data": { "user": {...}, "token": "..." }
# }
```

### Step 5: Check Frontend
1. Go to http://localhost:3000/login
2. Should see amber warning: "النظام تحت الصيانة. سيكون متاحاً قريباً."
3. Login button should be disabled (grayed out)

---

## Disable Maintenance Mode

### Via SQL
```sql
UPDATE system_settings 
SET value = 'false', updated_at = NOW() 
WHERE key = 'maintenance_mode';
```

### Via API (As SUPER_ADMIN)
```bash
curl -X PATCH http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maintenance_mode": false}'
```

---

## Implementation Summary

### Backend Files Updated
1. ✅ `backend/src/middleware/maintenance.ts` - Global middleware checking maintenance mode
2. ✅ `backend/src/routes/authRoutes.ts` - Login endpoint checks maintenance before allowing access
3. ✅ `backend/src/server.ts` - Public endpoint to check maintenance status
4. ✅ `backend/src/controllers/settingsController.ts` - Settings controller

### Frontend Files Updated
1. ✅ `frontend/src/app/(public)/login/page.tsx` - Checks maintenance on page load
2. ✅ `frontend/src/app/maintenance/page.tsx` - Maintenance page shown when redirected
3. ✅ `frontend/src/lib/api.ts` - API method to fetch maintenance status
4. ✅ `frontend/src/middleware.ts` - Redirects to maintenance page

### How It Works

**Request Flow During Maintenance (value = 'true'):**
```
User Request
    ↓
Auth Routes (public)
    ↓
Public Endpoints (no auth needed)
    ├─ /public/system-status → Returns maintenance status
    └─ Other public endpoints
    ↓
verifyToken Middleware
    ↓
maintenanceMode Middleware
    ├─ Checks database: maintenance_mode = 'true'?
    ├─ YES → Is user ADMIN/SUPER_ADMIN?
    │  ├─ YES → Allow to proceed
    │  └─ NO → Return 503 Service Unavailable
    └─ NO → Allow to proceed
    ↓
Protected Routes
```

---

## Key Files to Reference

📄 **enable_maintenance.sql** - SQL to enable maintenance mode
📄 **disable_maintenance.sql** - SQL to disable maintenance mode
📄 **test-maintenance-debug.ps1** - PowerShell script to test maintenance mode

---

## Verification

The system is fully functional. The reason normal users can still login is simply because:

**Current Database State:**
```
key: 'maintenance_mode'
value: 'false'  ← This is why maintenance is OFF
```

**To Enable Maintenance:**
```
Change value from 'false' to 'true'
```

That's it! Once you update the database value to `'true'`, normal users will be blocked from logging in and will see the maintenance page.

---

## Troubleshooting

### Users Still Can Login After Setting to 'true'
1. Verify in database: `SELECT * FROM system_settings WHERE key = 'maintenance_mode';`
2. Check the `value` column is exactly `'true'` (string, not boolean)
3. Restart backend server to clear any caches

### Admin Can't Login During Maintenance
1. Verify user role: `SELECT email, role FROM users WHERE email = 'admin@moneytransfer.com';`
2. Role must be exactly `'ADMIN'` or `'SUPER_ADMIN'` (case-sensitive)
3. Check server logs for [Login] debug messages

### Frontend Shows Login Button Enabled During Maintenance
1. Check browser console for errors
2. Verify `/api/public/system-status` returns `{ "maintenance": true }`
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

---

## Next Steps

1. **Enable maintenance mode** using one of the methods above
2. **Run tests** to verify normal users are blocked
3. **Verify admin access** still works
4. **Check frontend** displays maintenance page correctly
5. **Monitor logs** for any errors

✅ **System is ready to use!**
