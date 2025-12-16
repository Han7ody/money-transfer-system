# 🧪 Sprint-1 Testing Guide

## Quick Start

### 1. Run Database Migration

```bash
# Windows
.\migrate-rate-limits.cmd

# Or manually
cd backend
npx prisma migrate dev --name add_rate_limits_sprint1
npx prisma generate
```

### 2. Start Development Servers

```bash
# Start both backend and frontend
.\start-dev.ps1

# Or manually
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3. Login as SUPER_ADMIN

Navigate to: `http://localhost:3000/login`

Use your SUPER_ADMIN credentials (check your database or create one if needed)

---

## 🧪 Test Scenarios

### A. Event-Driven Notification System

#### Test 1: Transaction Approval Notification
1. Login as SUPER_ADMIN
2. Go to `/admin/transactions`
3. Find a transaction with status "UNDER_REVIEW"
4. Click "Approve"
5. **Expected Results:**
   - ✅ Transaction status changes to "APPROVED"
   - ✅ User receives notification in database
   - ✅ All admins receive notification
   - ✅ Console shows event log: `[EVENT] transaction.approved`
   - ✅ Audit log created

#### Test 2: Transaction Rejection Notification
1. Find another "UNDER_REVIEW" transaction
2. Click "Reject" and provide a reason
3. **Expected Results:**
   - ✅ Transaction status changes to "REJECTED"
   - ✅ User receives notification with rejection reason
   - ✅ All admins receive notification
   - ✅ Console shows event log: `[EVENT] transaction.rejected`

#### Test 3: Agent Creation Notification
1. Go to `/admin/agents`
2. Click "Add Agent"
3. Fill in agent details and submit
4. **Expected Results:**
   - ✅ Agent created successfully
   - ✅ All admins receive notification
   - ✅ Console shows event log: `[EVENT] agent.created`

#### Verify Notifications
```sql
-- Check notifications in database
SELECT * FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

### B. Authentication Pipeline

#### Test 1: Successful Login
1. Logout if logged in
2. Go to `/login`
3. Enter valid credentials
4. **Expected Results:**
   - ✅ Login successful
   - ✅ JWT token generated
   - ✅ HTTP-only cookie set
   - ✅ Redirected to dashboard
   - ✅ Console shows pipeline execution logs

#### Test 2: Invalid Credentials
1. Try to login with wrong password
2. **Expected Results:**
   - ✅ Error: "Invalid email or password"
   - ✅ No token generated
   - ✅ Stays on login page

#### Test 3: Blocked Account
1. Block a user account in database:
```sql
UPDATE users SET is_active = false WHERE email = 'test@example.com';
```
2. Try to login with that account
3. **Expected Results:**
   - ✅ Error: "Your account has been blocked"
   - ✅ No token generated

#### Test 4: Invalid Email Format
1. Try to login with invalid email (e.g., "notanemail")
2. **Expected Results:**
   - ✅ Error: "Invalid email format"

#### Verify Pipeline Logs
Check backend console for:
```
[LoginPipeline] Step 1: Validate input
[LoginPipeline] Step 2: Find user
[LoginPipeline] Step 3: Check active status
[LoginPipeline] Step 4: Verify password
[LoginPipeline] Step 5: Generate JWT
[LoginPipeline] Login successful
```

---

### C. Rate Limit Management

#### Test 1: Access Control
1. Login as regular ADMIN (not SUPER_ADMIN)
2. Try to access `/admin/security/rate-limits`
3. **Expected Result:**
   - ✅ Access denied / Redirected

4. Login as SUPER_ADMIN
5. Access `/admin/security/rate-limits`
6. **Expected Result:**
   - ✅ Page loads successfully

#### Test 2: Create Rate Limit
1. As SUPER_ADMIN, go to `/admin/security/rate-limits`
2. Click "Add Rate Limit"
3. Fill in the form:
   - Endpoint: `/api/auth/login`
   - Method: `POST`
   - Max Requests: `5`
   - Window: `900000` (15 minutes)
   - Message: `Too many login attempts`
4. Click "Create"
5. **Expected Results:**
   - ✅ Rate limit created
   - ✅ Appears in table
   - ✅ Status shows "Active"
   - ✅ Audit log created

#### Test 3: Update Rate Limit
1. Click "Edit" on a rate limit
2. Change Max Requests to `10`
3. Click "Update"
4. **Expected Results:**
   - ✅ Rate limit updated
   - ✅ New value shows in table
   - ✅ Audit log created

#### Test 4: Toggle Status
1. Click the toggle switch on a rate limit
2. **Expected Results:**
   - ✅ Status changes (Active ↔ Inactive)
   - ✅ Visual indicator updates
   - ✅ Stats cards update

#### Test 5: Delete Rate Limit
1. Click "Delete" on a rate limit
2. Confirm deletion
3. **Expected Results:**
   - ✅ Confirmation dialog appears
   - ✅ Rate limit removed from table
   - ✅ Stats cards update
   - ✅ Audit log created

#### Test 6: Validation
1. Try to create rate limit with:
   - Empty endpoint → Error
   - Max Requests = 0 → Error
   - Max Requests = 20000 → Error
   - Window = 500 → Error
2. **Expected Results:**
   - ✅ Validation errors shown
   - ✅ Form not submitted

#### Test 7: Duplicate Prevention
1. Create a rate limit for `/api/test`
2. Try to create another for `/api/test`
3. **Expected Result:**
   - ✅ Error: "Rate limit for this endpoint already exists"

#### Verify Database
```sql
-- Check rate limits
SELECT * FROM rate_limits;

-- Check audit logs
SELECT * FROM audit_logs 
WHERE entity = 'RateLimit'
ORDER BY created_at DESC;
```

---

## 📊 Stats Verification

### Check Event System Stats
```sql
-- Count notifications created by events
SELECT 
  DATE(created_at) as date,
  COUNT(*) as notification_count
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Check Authentication Stats
```sql
-- Count login attempts (when login history service is ready)
-- For now, check user last login
SELECT 
  email,
  full_name,
  role,
  updated_at as last_activity
FROM users
WHERE role IN ('ADMIN', 'SUPER_ADMIN')
ORDER BY updated_at DESC;
```

### Check Rate Limit Stats
```sql
-- Rate limit summary
SELECT 
  COUNT(*) as total_rules,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_rules,
  SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) as inactive_rules
FROM rate_limits;
```

---

## 🐛 Troubleshooting

### Event System Not Working

**Problem:** Notifications not created after transaction approval

**Solutions:**
1. Check backend console for event logs
2. Verify notification handler is initialized:
   ```
   ✅ Event handlers initialized
   ```
3. Check database connection
4. Verify user IDs exist in database

### Authentication Pipeline Errors

**Problem:** Login fails with 500 error

**Solutions:**
1. Check JWT_SECRET in `.env`
2. Verify database connection
3. Check user exists and has passwordHash
4. Review backend console logs

### Rate Limit Page Not Loading

**Problem:** 403 Forbidden or blank page

**Solutions:**
1. Verify logged in as SUPER_ADMIN
2. Check role in JWT token
3. Verify backend route is registered
4. Check browser console for errors

### Database Migration Fails

**Problem:** Migration error

**Solutions:**
1. Check DATABASE_URL in `.env`
2. Ensure PostgreSQL is running
3. Check for existing rate_limits table
4. Try: `npx prisma migrate reset` (WARNING: deletes data)

---

## ✅ Acceptance Checklist

Before marking Sprint-1 as complete, verify:

### Event System
- [ ] Transaction approval creates notifications
- [ ] Transaction rejection creates notifications
- [ ] Agent creation creates notifications
- [ ] Events logged in console
- [ ] Audit logs created

### Authentication Pipeline
- [ ] Valid login works
- [ ] Invalid credentials rejected
- [ ] Blocked accounts rejected
- [ ] JWT token generated
- [ ] HTTP-only cookie set
- [ ] Pipeline logs visible

### Rate Limit Management
- [ ] SUPER_ADMIN can access page
- [ ] Regular ADMIN cannot access
- [ ] Can create rate limit
- [ ] Can update rate limit
- [ ] Can toggle status
- [ ] Can delete rate limit
- [ ] Validation works
- [ ] Duplicate prevention works
- [ ] Stats cards accurate
- [ ] Audit logs created

---

## 📝 Test Results Template

```markdown
## Sprint-1 Test Results

**Date:** [Date]
**Tester:** [Name]
**Environment:** Development

### Event System
- Transaction Approval: ✅ / ❌
- Transaction Rejection: ✅ / ❌
- Agent Creation: ✅ / ❌
- Console Logs: ✅ / ❌
- Notes: [Any issues]

### Authentication Pipeline
- Valid Login: ✅ / ❌
- Invalid Credentials: ✅ / ❌
- Blocked Account: ✅ / ❌
- JWT Generation: ✅ / ❌
- Notes: [Any issues]

### Rate Limit Management
- Access Control: ✅ / ❌
- Create: ✅ / ❌
- Update: ✅ / ❌
- Toggle: ✅ / ❌
- Delete: ✅ / ❌
- Validation: ✅ / ❌
- Notes: [Any issues]

### Overall Status
- [ ] All tests passed
- [ ] Ready for production
- [ ] Issues found: [List]
```

---

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - Mark Sprint-1 as complete
   - Deploy to staging environment
   - Begin Sprint-2 planning

2. **If issues found:**
   - Document issues in test results
   - Create bug tickets
   - Fix and retest

3. **Performance Testing:**
   - Test with 100+ concurrent users
   - Monitor event system performance
   - Check database query performance

---

**Happy Testing! 🎉**
