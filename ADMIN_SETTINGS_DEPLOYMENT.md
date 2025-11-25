# 🚀 Admin General Settings - Deployment Guide

## 📋 Quick Start

This guide will help you deploy the complete Admin General Settings module in 5 minutes.

---

## ✅ Prerequisites

- PostgreSQL running
- Node.js installed
- Backend and frontend dependencies installed
- SUPER_ADMIN account exists

---

## 🔧 Step 1: Database Setup

### Option A: Using Prisma Migrate (Recommended if DB connection works)

```bash
cd backend
npx prisma migrate dev --name add_system_settings
npx prisma generate
```

### Option B: Manual SQL Migration (If Prisma connection fails)

```bash
# Connect to your PostgreSQL database
psql -U money_transfer_user -d money_transfer_db

# Run the migration SQL
\i backend/src/models/migrations/add_system_settings.sql

# Exit psql
\q

# Generate Prisma client
cd backend
npx prisma generate
```

---

## 🌱 Step 2: Seed Default Settings

```bash
cd backend
npm run seed
```

**Expected Output:**
```
Created/updated super admin user: superadmin@moneytransfer.com
Created/updated admin user: admin@moneytransfer.com
Inserted 4 currencies.
Inserted 3 exchange rates.
Inserted 2 sample audit logs.
Inserted 12 default system settings.
Seeding finished.
```

---

## 🏃 Step 3: Start Services

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

**Expected:** Server running on http://localhost:5000

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

**Expected:** Frontend running on http://localhost:3000

---

## 🧪 Step 4: Test the Implementation

### A. Browser Test

1. Navigate to: http://localhost:3000/login
2. Login as SUPER_ADMIN:
   - Email: `superadmin@moneytransfer.com`
   - Password: `SuperAdmin@123`
3. Navigate to: http://localhost:3000/admin/settings/general
4. You should see the General Settings page with all fields populated

### B. API Test (cURL)

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@moneytransfer.com","password":"SuperAdmin@123"}'

# Copy the token from response

# 2. Get Settings
curl -X GET http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. Update Settings
curl -X PATCH http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"platformName":"Updated Name","defaultFeePercent":3.5}'
```

See `CURL_TESTS_SETTINGS.md` for complete test suite.

---

## 📂 Verify Files Exist

Run these commands to verify all files were created:

```bash
# Backend files
ls backend/src/controllers/settingsController.ts
ls backend/src/routes/settingsRoutes.ts
ls backend/src/utils/upload.ts
ls backend/src/models/migrations/add_system_settings.sql

# Frontend files (already existed)
ls frontend/src/app/admin/settings/general/page.tsx
ls frontend/src/components/admin/settings/LogoUploader.tsx
ls frontend/src/types/settings.ts
```

---

## 🔍 Troubleshooting

### Issue 1: Database Connection Error

**Error:** `Authentication failed against database server`

**Solution:**
1. Check PostgreSQL is running: `pg_ctl status`
2. Verify `.env` credentials:
   ```env
   DATABASE_URL=postgresql://money_transfer_user:password@localhost:5432/money_transfer_db
   ```
3. Use manual SQL migration (Option B above)

### Issue 2: Prisma Client Not Generated

**Error:** `Property 'systemSettings' does not exist on type 'PrismaClient'`

**Solution:**
```bash
cd backend
npx prisma generate
```

### Issue 3: RBAC - Access Denied

**Error:** Frontend redirects to unauthorized page

**Solution:**
1. Ensure you're logged in as SUPER_ADMIN
2. Check JWT token is valid
3. Verify role in localStorage:
   ```javascript
   // Browser console
   JSON.parse(localStorage.getItem('user')).role
   ```

### Issue 4: 404 on API Endpoints

**Error:** `Route not found` when calling `/api/admin/system/settings`

**Solution:**
1. Verify server.ts was updated with settingsRoutes import
2. Restart backend server
3. Check server logs for any import errors

### Issue 5: Logo Upload Fails

**Error:** `EPERM: operation not permitted`

**Solution:**
1. Create uploads directory manually:
   ```bash
   mkdir -p backend/uploads/logos
   ```
2. Ensure directory has write permissions
3. On Windows, run as Administrator if needed

---

## 🎯 Validation Tests

### Test 1: RBAC Enforcement
```bash
# Login as regular ADMIN (should fail to access settings)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@moneytransfer.com","password":"Admin@123"}'

# Try to access settings (should get 403)
curl -X GET http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** `403 Forbidden`

### Test 2: Input Validation
```bash
# Invalid email
curl -X PATCH http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"supportEmail":"not-an-email"}'
```

**Expected:** `400 Bad Request - Invalid email address`

### Test 3: Audit Logging
```bash
# Check audit logs
curl -X GET "http://localhost:5000/api/admin/system/audit-logs?action=UPDATE_GENERAL_SETTINGS" \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

**Expected:** List of UPDATE_GENERAL_SETTINGS actions

---

## 📊 Feature Verification Checklist

After deployment, verify these features work:

- [ ] **View Settings**: All 12 settings load correctly
- [ ] **Edit Settings**: Can update platformName
- [ ] **Upload Logo**: Can upload PNG/JPG file
- [ ] **Logo Preview**: Uploaded logo displays
- [ ] **Remove Logo**: Can remove uploaded logo
- [ ] **Test SMTP**: Button triggers test email
- [ ] **Reset Defaults**: Resets all fields
- [ ] **Validation**: Invalid email shows error
- [ ] **Validation**: Fee > 100 shows error
- [ ] **RBAC**: Non-SUPER_ADMIN gets 403
- [ ] **Audit Log**: Updates create audit entries
- [ ] **RTL Support**: Arabic text displays correctly
- [ ] **Loading State**: Skeleton shows while loading
- [ ] **Error Messages**: Inline error alerts appear
- [ ] **Success Messages**: Success alerts appear

---

## 🎨 UI Features

### Page Location
- URL: `/admin/settings/general`
- Route: `frontend/src/app/admin/settings/general/page.tsx`

### Components Used
- ShadCN UI Cards
- Custom LogoUploader component
- Lucide React icons
- Tailwind CSS styling

### Form Fields
1. **Platform Info**
   - Platform Name (text input)
   - Logo Upload (file upload)

2. **Localization**
   - Timezone (select)
   - Default Language (select: ar/en)
   - Date Format (select)
   - Time Format (select: 24h/12h)

3. **Financial**
   - Default Currency (select)
   - Default Fee Percent (number input)

4. **Contact**
   - Support Email (email input + Test SMTP button)
   - Support Phone (tel input)
   - Company Address (textarea)

5. **System Status**
   - Maintenance Mode (toggle switch)

6. **Actions**
   - Save Changes (primary button)
   - Reset to Defaults (secondary button)

---

## 🔐 Security Features

### Frontend Security
- RBAC: useAuth() hook checks role
- Redirect: Non-SUPER_ADMIN → `/admin/unauthorized`
- Validation: Client-side validation before submit
- File Type Check: Only images allowed

### Backend Security
- JWT Authentication: verifyToken middleware
- RBAC: authorize(['SUPER_ADMIN']) middleware
- Input Validation: Email format, fee range
- File Upload: Multer validation, size limit
- Audit Logging: All changes tracked

---

## 📈 Performance Considerations

### Database
- Indexed columns: key, category
- Settings stored as key-value pairs
- Efficient upsert operations

### File Upload
- 5MB file size limit
- Automatic old file deletion
- Unique filename generation

### Frontend
- Loading skeleton for better UX
- Optimistic UI updates
- Error boundary handling

---

## 🌍 Internationalization

### RTL Support
- Full RTL layout for Arabic
- Bidirectional text support
- Arabic UI strings

### Language Settings
- Default language: Arabic (ar)
- Support for English (en)
- Easily extensible for more languages

---

## 📝 Environment Variables

Required in `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://money_transfer_user:password@localhost:5432/money_transfer_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Email (for SMTP test feature)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Super Admin
SUPER_ADMIN_EMAIL=superadmin@moneytransfer.com
SUPER_ADMIN_PASSWORD=SuperAdmin@123

# Optional
SUPPORT_EMAIL=support@rasid.com
```

---

## 🚀 Production Deployment

### 1. Environment Setup
```bash
# Set production environment variables
export NODE_ENV=production
export DATABASE_URL=postgresql://...
export JWT_SECRET=strong-random-secret
```

### 2. Build Frontend
```bash
cd frontend
npm run build
```

### 3. Build Backend
```bash
cd backend
npm run build
```

### 4. Run Migrations
```bash
cd backend
npx prisma migrate deploy
```

### 5. Start Production Services
```bash
# Backend
cd backend
npm start

# Frontend (with PM2 or similar)
cd frontend
npm start
```

---

## 📞 Support

### Documentation
- `IMPLEMENTATION_SUMMARY.md` - Complete feature documentation
- `CURL_TESTS_SETTINGS.md` - API testing guide
- This file - Deployment guide

### Common Issues
- Database connection → Check PostgreSQL service
- Prisma client → Run `npx prisma generate`
- RBAC → Verify SUPER_ADMIN role
- File upload → Check directory permissions

---

## ✅ Deployment Checklist

Before going live:

- [ ] Database migration completed
- [ ] Prisma client generated
- [ ] Seed data populated
- [ ] Backend server running
- [ ] Frontend server running
- [ ] All 15 feature tests pass
- [ ] RBAC working correctly
- [ ] Audit logs being created
- [ ] Logo upload working
- [ ] SMTP test working
- [ ] Environment variables set
- [ ] Production build successful
- [ ] Error handling tested
- [ ] Loading states verified
- [ ] RTL layout confirmed

---

## 🎉 Success!

If all steps completed successfully, you should now have:

- ✅ Fully functional General Settings page
- ✅ Complete CRUD operations
- ✅ Logo upload capability
- ✅ SMTP testing feature
- ✅ RBAC enforcement
- ✅ Audit logging
- ✅ Input validation
- ✅ RTL support
- ✅ Production-ready code

Navigate to `/admin/settings/general` as SUPER_ADMIN to manage your platform settings!

---

**Last Updated:** 2025-11-25
**Module Version:** 1.0.0
**Status:** Production Ready ✅
