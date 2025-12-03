# ✅ Maintenance Mode Fix - User Login Blocking

## Problem Fixed
Users could still login during maintenance mode. The issue had two root causes:

1. **Database Key Mismatch**: Seed file used `maintenanceMode` but code checked for `maintenance_mode`
2. **Missing Record**: If the record didn't exist, the check would silently default to false

## Solution Implemented

### 1. Fixed Seed File
Updated `backend/src/seed.ts` to use the correct key:
- Changed from: `maintenanceMode`
- Changed to: `maintenance_mode`

### 2. Enhanced Login Endpoint
Updated `backend/src/routes/authRoutes.ts` with:
- Auto-creation of `maintenance_mode` record if missing
- Proper value checking
- Clear blocking message for non-admin users

### 3. Enhanced Public Endpoint
Updated `backend/src/server.ts` with:
- Auto-creation of `maintenance_mode` record if missing
- Same safeguards as login endpoint

### 4. Enhanced Settings Controller
Updated `backend/src/controllers/settingsController.ts` with:
- Auto-creation of record if missing during fetch
- Graceful fallback for concurrent requests

## How to Enable Maintenance Mode Now

### Option 1: Database Update (Immediate)
```sql
-- Update existing record or insert if missing
INSERT INTO system_settings (key, value, category, created_at, updated_at)
VALUES ('maintenance_mode', 'true', 'general', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET 
  value = 'true',
  updated_at = NOW();

-- Verify
SELECT * FROM system_settings WHERE key = 'maintenance_mode';
```

### Option 2: Via API (As SUPER_ADMIN)
```bash
curl -X PATCH http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "maintenance_mode": true
  }'
```

### Option 3: Check Status (No Auth Needed)
```bash
curl http://localhost:5000/api/public/system-status

# Response:
# {
#   "success": true,
#   "data": {
#     "maintenance": true
#   }
# }
```

## Testing the Fix

### Test 1: Normal User Login (Should be BLOCKED)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'

# Expected Response (503):
# {
#   "success": false,
#   "message": "The system is currently under maintenance. Please try again later.",
#   "maintenance": true,
#   "statusCode": 503
# }
```

### Test 2: Admin Login (Should SUCCEED)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@moneytransfer.com",
    "password": "Admin@123"
  }'

# Expected Response (200):
# {
#   "success": true,
#   "message": "Login successful",
#   "data": {
#     "user": { ... },
#     "token": "eyJ..."
#   }
# }
```

### Test 3: Check Maintenance Status (Should Return true)
```bash
curl http://localhost:5000/api/public/system-status

# Expected Response (200):
# {
#   "success": true,
#   "data": {
#     "maintenance": true
#   }
# }
```

## Files Modified

1. ✅ `backend/src/seed.ts` - Fixed key name
2. ✅ `backend/src/routes/authRoutes.ts` - Enhanced login check
3. ✅ `backend/src/server.ts` - Enhanced public endpoint
4. ✅ `backend/src/controllers/settingsController.ts` - Enhanced getMaintenanceFlag
5. ✅ `backend/src/models/migrations/fix_maintenance_mode_key.sql` - SQL cleanup script (optional)

## Key Features

✅ **Auto-creates maintenance_mode record** if missing
✅ **Blocks normal users** from login with 503 status
✅ **Allows admins** to bypass maintenance
✅ **Public status endpoint** for frontend checks
✅ **Consistent key naming** (maintenance_mode everywhere)
✅ **Graceful error handling** for race conditions

## How It Works

When a user tries to login:
1. Request reaches `/auth/login` endpoint
2. Endpoint checks if `maintenance_mode` = 'true' in database
3. If record missing, auto-creates with value 'false'
4. If value is 'true':
   - Check user role
   - Block if user is not ADMIN/SUPER_ADMIN
   - Return 503 with maintenance flag
5. If user is ADMIN/SUPER_ADMIN:
   - Allow login to proceed normally

## Important Notes

- The `maintenance_mode` record is automatically created on first login/status check
- No need to manually insert it if using the updated code
- The system gracefully handles concurrent requests trying to create the record
- Admin and Super Admin users are unaffected by maintenance mode

## Resetting to Normal Mode

To disable maintenance and allow normal logins:

```sql
UPDATE system_settings SET value = 'false' WHERE key = 'maintenance_mode';
```

Or via API:
```bash
curl -X PATCH http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"maintenance_mode": false}'
```

---

**Status**: ✅ Complete and Ready to Test
