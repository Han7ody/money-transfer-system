# Sprint 3 - KYC Review & Fraud Engine Setup

## Quick Start

### 1. Database Setup

Run the migration to create KYC and fraud detection tables:

**Option A: Using SQL file (Recommended for Windows)**
```bash
cd scripts/database
psql -U postgres -d money_transfer_db -f kyc-fraud-tables.sql
cd ../..
```

**Option B: Using Node script**
```bash
node scripts/database/add-kyc-fraud-tables.js
```

**Option C: Using batch file (Windows)**
```bash
cd scripts/database
run-kyc-migration.bat
cd ../..
```

### 2. Backend Setup

Regenerate Prisma client to include new models:

```bash
cd backend
npx prisma generate
```

### 3. Verify Setup

Test that everything is working:

```bash
node scripts/test-kyc-setup.js
```

### 4. Start Services

Start backend:
```bash
cd backend
npm run dev
```

Start frontend (in new terminal):
```bash
cd frontend
npm run dev
```

## Access Points

- **KYC Queue**: http://localhost:3000/admin/users/kyc-queue
- **Admin Dashboard**: http://localhost:3000/admin

## Testing the Feature

### Create Test User with KYC Documents

1. Register a new user account
2. Upload KYC documents (ID front, ID back, selfie)
3. Login as admin
4. Navigate to KYC Queue
5. Click "Review" on the pending submission

### Test Fraud Detection

To test duplicate detection:
1. Create two users with same email/phone
2. Upload KYC documents for both
3. Review second user - should show fraud match

## API Testing

### Get KYC Queue
```bash
curl -X GET http://localhost:5000/api/admin/kyc/queue \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Approve KYC
```bash
curl -X POST http://localhost:5000/api/admin/kyc/1/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Documents verified"}'
```

### Reject KYC
```bash
curl -X POST http://localhost:5000/api/admin/kyc/1/reject \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Document image unclear"}'
```

## Troubleshooting

### Tables Not Created
If you see "table does not exist" errors:
```bash
# Check if tables exist
psql -d money_transfer_db -c "\dt kyc_*"
psql -d money_transfer_db -c "\dt fraud_*"

# If missing, run migration again
node scripts/database/add-kyc-fraud-tables.js
```

### Prisma Client Errors
If you see "Property does not exist" errors:
```bash
cd backend
npx prisma generate
# Restart backend server
```

### Frontend Build Errors
```bash
cd frontend
npm install
npm run dev
```

## Features Implemented

✅ KYC Review Queue with filtering and search
✅ Smart priority sorting (high risk, escalated, >48h old)
✅ Document viewer with zoom, rotate, compare
✅ Fraud detection engine with scoring
✅ Duplicate detection (document, email, phone)
✅ One-click actions (approve, reject, request more, escalate)
✅ Review notes system
✅ Complete audit trail
✅ Keyboard shortcuts (A, R, M, E)
✅ Email notifications
✅ High-risk approval warnings
✅ Fraud match panel with user details

## Next Steps

After setup is complete:
1. Review the KYC queue interface
2. Test document viewer functionality
3. Verify fraud detection is working
4. Check email notifications are sent
5. Review audit logs in database

## Documentation

- Full feature documentation: `docs/features/KYC_FRAUD_ENGINE.md`
- API endpoints: See feature documentation
- Database schema: `backend/src/models/schema.prisma`

## Support

If you encounter issues:
1. Check backend logs for errors
2. Verify database connection
3. Ensure all tables were created
4. Check Prisma client is up to date
5. Verify admin user has proper permissions
