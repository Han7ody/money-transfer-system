# Testing Guide: Admin Transaction Details Page

## 🚀 Quick Start

### Prerequisites
1. Backend server running on `http://localhost:5000`
2. Frontend server running on `http://localhost:3000`
3. Admin user logged in
4. At least one test transaction in the database

## 📋 Test Scenarios

### Scenario 1: View Transaction Details
**Steps:**
1. Navigate to `/admin/transactions`
2. Click on any transaction row
3. Verify all information displays correctly:
   - Transaction reference
   - Status badge
   - Sender information
   - Receiver information
   - Transaction summary
   - Timeline events

**Expected Result:**
- All data loads without errors
- Status is color-coded correctly
- Timeline shows chronological events

---

### Scenario 2: Approve Bank Transfer Transaction
**Prerequisites:** Transaction with status `UNDER_REVIEW` and `payoutMethod: BANK_TRANSFER`

**Steps:**
1. Open transaction detail page
2. Click "موافقة" (Approve) button in Quick Actions panel
3. Wait for confirmation

**Expected Result:**
- Success message appears: "تمت الموافقة على المعاملة بنجاح"
- Status changes to `APPROVED`
- Timeline updates with approval event
- "إكمال التحويل" (Complete Transfer) button appears

---

### Scenario 3: Assign Agent to Cash Pickup
**Prerequisites:** Transaction with status `APPROVED` and `payoutMethod: CASH_PICKUP`

**Steps:**
1. Open transaction detail page
2. Verify "تعيين وكيل" (Assign Agent) button is visible
3. Click "تعيين وكيل" button
4. Modal opens showing available agents
5. Search for agent by name or phone (optional)
6. Click on an agent card to select
7. Click "تعيين الوكيل" (Assign Agent) button

**Expected Result:**
- Modal shows agents filtered by pickup city
- Agent capacity bars display correctly
- Unavailable agents are disabled with reason
- After assignment:
  - Success message: "تم تعيين الوكيل بنجاح"
  - Status changes to `READY_FOR_PICKUP`
  - Agent details appear in Cash Pickup card
  - Pickup code is generated and displayed
  - Timeline shows agent assignment event

---

### Scenario 4: Confirm Cash Pickup
**Prerequisites:** Transaction with status `READY_FOR_PICKUP` and assigned agent

**Steps:**
1. Open transaction detail page
2. Note the pickup code (6 digits) in Cash Pickup card
3. Click "تأكيد الاستلام" (Confirm Pickup) button
4. Modal opens
5. Enter the 6-digit pickup code
6. Click "تأكيد الاستلام" button

**Expected Result:**
- Modal shows transaction summary
- Invalid code shows error: "رمز الاستلام يجب أن يكون 6 أرقام"
- Correct code:
  - Success message: "تم تأكيد الاستلام بنجاح"
  - Status changes to `COMPLETED`
  - Pickup verification timestamp appears
  - Timeline shows pickup confirmation event
  - Agent's active transactions count decreases

---

### Scenario 5: Reject Transaction
**Prerequisites:** Transaction with status `UNDER_REVIEW` or `APPROVED`

**Steps:**
1. Open transaction detail page
2. Click "رفض" (Reject) button
3. Modal opens
4. Enter rejection reason
5. Select rejection category (optional)
6. Click "رفض المعاملة" (Reject Transaction)

**Expected Result:**
- Success message: "تم رفض المعاملة"
- Status changes to `REJECTED`
- Rejection reason appears in timeline
- All action buttons become disabled
- Red status badge displays

---

### Scenario 6: Copy Functions
**Steps:**
1. Open any transaction detail page
2. Click copy icon next to transaction reference
3. Verify clipboard contains transaction ref
4. If cash pickup with code:
   - Click eye icon to show pickup code
   - Click copy icon next to pickup code
   - Verify clipboard contains pickup code

**Expected Result:**
- Data copied to clipboard successfully
- Visual feedback (optional: add toast notification)

---

### Scenario 7: View Audit Logs
**Steps:**
1. Open transaction detail page
2. Scroll to "سجل التدقيق" (Audit Log) card
3. View recent actions
4. If more than 3 logs, click "عرض المزيد" (Show More)

**Expected Result:**
- Logs display in chronological order (newest first)
- Each log shows:
  - Action type with color-coded icon
  - Admin name who performed action
  - Timestamp
  - Details/notes
- Expandable list works correctly

---

### Scenario 8: Error Handling
**Test Cases:**

#### Invalid Transaction ID
1. Navigate to `/admin/transactions/99999`
2. Verify error message: "المعاملة غير موجودة"
3. "العودة للمعاملات" button works

#### Network Error
1. Stop backend server
2. Try to perform any action
3. Verify error message displays
4. Restart server and retry

#### Invalid Pickup Code
1. Open READY_FOR_PICKUP transaction
2. Click "تأكيد الاستلام"
3. Enter wrong code (e.g., "123456")
4. Verify error: "Invalid pickup code"

---

## 🔍 Visual Checks

### Status Colors
- `PENDING`: Yellow/Orange
- `UNDER_REVIEW`: Amber
- `APPROVED`: Blue
- `READY_FOR_PICKUP`: Purple
- `COMPLETED`: Green/Emerald
- `REJECTED`: Red/Rose

### Responsive Design
Test on different screen sizes:
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

### Loading States
- Initial page load shows skeleton
- Action buttons show loading spinner
- Modals show loading during API calls

---

## 🐛 Common Issues & Solutions

### Issue: Agents not loading in modal
**Solution:** 
- Check if agents exist in database for the pickup city
- Verify `/admin/agents/available` endpoint is accessible
- Check browser console for errors

### Issue: Pickup code not generated
**Solution:**
- Verify agent assignment completed successfully
- Check backend logs for errors
- Ensure `pickupCode` field is being set in database

### Issue: Timeline not updating
**Solution:**
- Check if `TransactionHistory` records are being created
- Verify `/admin/transactions/:id/history` endpoint works
- Refresh page to force reload

### Issue: Actions not working
**Solution:**
- Verify user has admin role
- Check authentication token is valid
- Review backend logs for authorization errors

---

## 📊 Database Verification

### Check Transaction Status
```sql
SELECT id, transactionRef, status, payoutMethod, assignedAgentId, pickupCode
FROM "Transaction"
WHERE id = YOUR_TRANSACTION_ID;
```

### Check Transaction History
```sql
SELECT * FROM "TransactionHistory"
WHERE "transactionId" = YOUR_TRANSACTION_ID
ORDER BY "createdAt" DESC;
```

### Check Available Agents
```sql
SELECT id, fullName, city, status, "maxDailyAmount", "currentDailyAmount", "activeTransactions"
FROM "Agent"
WHERE city = 'YOUR_CITY' AND status = 'ACTIVE';
```

### Check Audit Logs
```sql
SELECT * FROM "AuditLog"
WHERE "entityId" = 'YOUR_TRANSACTION_ID'
ORDER BY "createdAt" DESC;
```

---

## 🎯 Performance Testing

### Load Time Benchmarks
- Initial page load: < 2 seconds
- Agent modal load: < 1 second
- Action execution: < 1 second
- Timeline refresh: < 500ms

### API Response Times
```bash
# Test transaction detail endpoint
curl -X GET http://localhost:5000/api/transactions/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test available agents endpoint
curl -X GET "http://localhost:5000/api/admin/agents/available?city=Khartoum" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test assign agent endpoint
curl -X POST http://localhost:5000/api/admin/transactions/1/assign-agent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agentId": 1}'
```

---

## ✅ Acceptance Criteria

### Must Have
- [x] All transaction details display correctly
- [x] Status-based actions work as expected
- [x] Agent assignment flow completes successfully
- [x] Pickup confirmation validates code correctly
- [x] Timeline shows all events chronologically
- [x] Audit logs track all admin actions
- [x] Error messages are user-friendly
- [x] Loading states prevent duplicate actions
- [x] Success messages provide clear feedback

### Nice to Have
- [ ] Toast notifications for all actions
- [ ] Keyboard shortcuts for common actions
- [ ] Print-friendly layout
- [ ] Export to PDF functionality
- [ ] Real-time updates via WebSocket

---

## 📝 Test Report Template

```markdown
## Test Session Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Dev/Staging/Production]

### Test Results

| Scenario | Status | Notes |
|----------|--------|-------|
| View Transaction Details | ✅ Pass | |
| Approve Bank Transfer | ✅ Pass | |
| Assign Agent | ✅ Pass | |
| Confirm Pickup | ✅ Pass | |
| Reject Transaction | ✅ Pass | |
| Copy Functions | ✅ Pass | |
| View Audit Logs | ✅ Pass | |
| Error Handling | ✅ Pass | |

### Issues Found
1. [Issue description]
   - Severity: [Low/Medium/High/Critical]
   - Steps to reproduce: [Steps]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]

### Recommendations
- [Recommendation 1]
- [Recommendation 2]
```

---

## 🎓 Tips for Testers

1. **Test with real data** - Use actual transaction scenarios
2. **Test edge cases** - Try invalid inputs, missing data, etc.
3. **Test permissions** - Try accessing as different user roles
4. **Test concurrency** - Open same transaction in multiple tabs
5. **Test network conditions** - Simulate slow/offline scenarios
6. **Document everything** - Take screenshots of issues
7. **Clear cache** - Test with fresh browser cache
8. **Check console** - Monitor browser console for errors

---

**Happy Testing! 🚀**
