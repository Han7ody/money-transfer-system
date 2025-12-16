# Admin General Settings API - cURL Test Examples

## Prerequisites
1. Login as SUPER_ADMIN to get JWT token
2. Run the migration SQL first: `backend/src/models/migrations/add_system_settings.sql`
3. Run seed: `npm run seed` from backend directory
4. Start backend server: `npm run dev` from backend directory

## 1. Login as SUPER_ADMIN

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@moneytransfer.com",
    "password": "SuperAdmin@123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "superadmin@moneytransfer.com",
      "role": "SUPER_ADMIN"
    }
  }
}
```

**Copy the token for subsequent requests**

---

## 2. GET System Settings

```bash
curl -X GET http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "platformName": "Rasid - نظام التحويلات المالية",
    "logoUrl": "",
    "timezone": "Africa/Khartoum",
    "defaultLanguage": "ar",
    "maintenanceMode": false,
    "defaultCurrency": "SDG",
    "supportEmail": "support@rasid.com",
    "supportPhone": "+249 123 456 789",
    "defaultFeePercent": 2.5,
    "companyAddress": "الخرطوم، السودان",
    "dateFormat": "YYYY-MM-DD",
    "timeFormat": "24h"
  }
}
```

---

## 3. UPDATE System Settings

```bash
curl -X PATCH http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "platformName": "Rasid Money Transfer",
    "supportEmail": "contact@rasid.com",
    "defaultFeePercent": 3.0,
    "maintenanceMode": false,
    "companyAddress": "Khartoum, Sudan - New Address",
    "timezone": "Africa/Cairo"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "System settings updated successfully",
  "data": {
    "platformName": "Rasid Money Transfer",
    "supportEmail": "contact@rasid.com",
    "defaultFeePercent": 3.0,
    "maintenanceMode": false,
    "companyAddress": "Khartoum, Sudan - New Address",
    "timezone": "Africa/Cairo"
  }
}
```

---

## 4. UPLOAD Logo

```bash
curl -X POST http://localhost:5000/api/admin/system/settings/logo \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "logo=@/path/to/your/logo.png"
```

**Example (Windows):**
```bash
curl -X POST http://localhost:5000/api/admin/system/settings/logo \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "logo=@C:\Users\YourName\Downloads\logo.png"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "logoUrl": "http://localhost:5000/uploads/logos/logo-1234567890-123456789.png"
  }
}
```

---

## 5. TEST SMTP Settings

```bash
curl -X POST http://localhost:5000/api/admin/system/settings/smtp/test \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Test email sent successfully to support@rasid.com"
}
```

**Expected Response (Failure):**
```json
{
  "success": false,
  "message": "Failed to send test email. Please check your SMTP configuration."
}
```

---

## 6. Verify Audit Log was Created

```bash
curl -X GET "http://localhost:5000/api/admin/system/audit-logs?action=UPDATE_GENERAL_SETTINGS&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 123,
        "adminId": 1,
        "action": "UPDATE_GENERAL_SETTINGS",
        "entity": "SystemSettings",
        "oldValue": {...},
        "newValue": {...},
        "ipAddress": "::1",
        "userAgent": "curl/7.68.0",
        "createdAt": "2025-11-25T10:30:00.000Z",
        "admin": {
          "fullName": "Super Admin",
          "email": "superadmin@moneytransfer.com"
        }
      }
    ],
    "pagination": {...}
  }
}
```

---

## 7. Test RBAC - Try as Non-SUPER_ADMIN (Should Fail)

Login as regular ADMIN:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@moneytransfer.com",
    "password": "Admin@123"
  }'
```

Try to access settings (should fail):
```bash
curl -X GET http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Access denied. You do not have permission to access this resource."
}
```

---

## Validation Tests

### Test Invalid Email
```bash
curl -X PATCH http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "supportEmail": "invalid-email"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid email address"
}
```

### Test Invalid Fee Percent
```bash
curl -X PATCH http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "defaultFeePercent": 150
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Default fee percent must be between 0 and 100"
}
```

### Test Invalid Logo File
```bash
curl -X POST http://localhost:5000/api/admin/system/settings/logo \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "logo=@/path/to/document.pdf"
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed."
}
```

---

## Notes

1. **Database Connection**: If you get "Authentication failed against database", ensure PostgreSQL is running and credentials in `.env` are correct.

2. **Run Migration**: Execute the SQL migration first:
   ```bash
   psql -U money_transfer_user -d money_transfer_db -f backend/src/models/migrations/add_system_settings.sql
   ```

3. **Generate Prisma Client**: After migration:
   ```bash
   cd backend
   npx prisma generate
   ```

4. **Run Seed**: To populate default settings:
   ```bash
   cd backend
   npm run seed
   ```

5. **All endpoints require SUPER_ADMIN role** - Regular ADMIN will get 403 Forbidden.

6. **Audit logs are automatically created** for every settings update.

7. **Logo files are stored** in `backend/uploads/logos/` directory.

8. **SMTP test** requires proper email configuration in `.env` file.
