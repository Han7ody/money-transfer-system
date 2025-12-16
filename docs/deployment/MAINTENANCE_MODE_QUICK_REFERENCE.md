# 🚀 Maintenance Mode System - Quick Reference

## What Was Fixed

The maintenance mode system was previously **UI-only** - users could still:
- ✅ Login during maintenance
- ✅ Access all protected routes
- ✅ Make API calls

**Now Fixed**: Complete enforcement at **API level + Frontend level**

---

## How It Works

### When Maintenance is ENABLED

```
Regular User                          Admin User
     ↓                                   ↓
Visits /login                      Visits /login
     ↓                                   ↓
Sees "System Under Maintenance"     Can see login form
     ↓                                   ↓
Button DISABLED                     Login ALLOWED
     ↓                                   ↓
Cannot Submit                       Logged in successfully
     ↓                                   ↓
If tries anyway → 503 Error         Full system access
     ↓
Redirected to /maintenance
```

---

## Activation

### Option 1: Admin UI (Recommended)
1. Login as SUPER_ADMIN
2. Go to `/admin/settings/general`
3. Toggle "Maintenance Mode" ON/OFF
4. Changes take effect immediately

### Option 2: Direct Database
```sql
-- Enable maintenance mode
UPDATE system_settings 
SET value = 'true' 
WHERE key = 'maintenance_mode';

-- Disable maintenance mode
UPDATE system_settings 
SET value = 'false' 
WHERE key = 'maintenance_mode';
```

### Option 3: API
```bash
# As SUPER_ADMIN
curl -X PATCH http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"maintenance_mode": true}'
```

---

## File Changes Summary

### Backend (4 files)
1. ✅ `middleware/maintenance.ts` (NEW) - Global middleware
2. ✅ `routes/authRoutes.ts` - Login endpoint check
3. ✅ `server.ts` - Already updated with middleware
4. ✅ `controllers/settingsController.ts` - Fixed key names

### Frontend (3 files)
1. ✅ `app/(public)/login/page.tsx` - Maintenance check + UI
2. ✅ `app/maintenance/page.tsx` - New maintenance page
3. ✅ `lib/api.ts` - Added getMaintenanceStatus()

---

## Test Scenarios

### ✅ Normal User - Should be BLOCKED
```bash
# 1. Check maintenance status
curl http://localhost:5000/api/admin/system/settings/maintenance
→ Returns: { maintenance: true }

# 2. Try to login
curl -X POST http://localhost:5000/api/auth/login \
  -d '{"email":"user@example.com","password":"password"}'
→ Returns: 503 { success: false, maintenance: true }

# 3. Try to access protected route
curl http://localhost:5000/api/transactions
→ Returns: 503 Service Unavailable
```

### ✅ Admin User - Should PASS
```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -d '{"email":"admin@example.com","password":"password"}'
→ Returns: 200 { success: true, token: "..." }

# 2. Access protected routes
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/admin/users
→ Returns: 200 { success: true, data: [...] }
```

---

## Key Features

| Feature | Details |
|---------|---------|
| **Database-Driven** | Configuration stored in `system_settings` table |
| **Role-Based** | Only `ADMIN` and `SUPER_ADMIN` can bypass |
| **API Enforcement** | Middleware blocks at Express level |
| **Frontend Backup** | Login page also checks maintenance |
| **Public Endpoint** | `/api/admin/system/settings/maintenance` (no auth) |
| **HTTP Status** | Returns 503 Service Unavailable |
| **Error Handling** | Graceful fallback if database unavailable |
| **Messaging** | Includes `maintenance: true` flag in response |

---

## Database Schema

The system uses the existing `SystemSettings` table:

```sql
-- Key-value pair storage
system_settings:
  - key: 'maintenance_mode'
  - value: 'true' or 'false'
  - category: 'general'
  - updatedBy: <admin_id>
  - updatedAt: <timestamp>
```

---

## Response Examples

### Maintenance ENABLED for Regular User
```json
{
  "error": "SYSTEM_UNDER_MAINTENANCE",
  "message": "The system is currently under maintenance.",
  "statusCode": 503
}
```

### Public Status Endpoint
```json
{
  "success": true,
  "data": {
    "maintenance": true
  }
}
```

### Login During Maintenance (Non-Admin)
```json
{
  "success": false,
  "message": "The system is currently under maintenance. Please try again later.",
  "maintenance": true,
  "statusCode": 503
}
```

---

## Middleware Chain

The Express middleware is applied in this order:

```
1. Auth Routes (/auth/*)
   └─ No maintenance check
   └─ Login has its own check

2. verifyToken Middleware
   └─ Authenticates user

3. maintenanceMode Middleware
   └─ Checks maintenance_mode setting
   └─ Blocks non-admins
   └─ Allows admins to proceed

4. Protected Routes
   └─ /transactions
   └─ /users
   └─ /admin/*
   └─ etc.
```

---

## Troubleshooting

### Issue: "Maintenance flag not working"
**Solution**: Check that `maintenance_mode` record exists in `system_settings`:
```sql
SELECT * FROM system_settings WHERE key = 'maintenance_mode';
-- If empty, insert:
INSERT INTO system_settings (key, value, category) 
VALUES ('maintenance_mode', 'false', 'general');
```

### Issue: "Admin can't login during maintenance"
**Solution**: Check admin user's role:
```sql
SELECT id, email, role FROM users 
WHERE email = 'admin@example.com';
-- Should be 'ADMIN' or 'SUPER_ADMIN'
```

### Issue: "Frontend not checking maintenance"
**Solution**: Verify API is accessible:
```bash
curl http://localhost:5000/api/admin/system/settings/maintenance
```

---

## Security Considerations

✅ **Cannot be bypassed from frontend** - API enforces at Express level  
✅ **Cannot be bypassed by token manipulation** - Checked in middleware  
✅ **Admin bypass is controlled** - Only specified roles can bypass  
✅ **Database-driven** - Cannot be hardcoded in frontend  
✅ **Proper HTTP status** - 503 indicates temporary unavailability  

---

## Performance Notes

- Maintenance check is done **per-request** (minimal overhead)
- Uses direct database lookup (indexed key)
- Errors don't crash the system (graceful fallback)
- No caching layer needed (simple boolean flag)

---

## Related Documentation

- 📄 `COMPLETE_MAINTENANCE_FIX.md` - Detailed technical implementation
- 📄 `MAINTENANCE_MODE_ALL_FILES.md` - Complete file listings
- 📄 `IMPLEMENTATION_PATCH_SUMMARY.md` - Previous patch details

---

## Support

All changes are **production-ready** and follow industry best practices:
- ✅ TypeScript with proper types
- ✅ Error handling and logging
- ✅ Security best practices
- ✅ RESTful API design
- ✅ Responsive UI/UX
