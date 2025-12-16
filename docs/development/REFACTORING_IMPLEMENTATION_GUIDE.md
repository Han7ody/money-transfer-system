# 🔧 Backend Refactoring Implementation Guide

## Quick Reference for Using New Infrastructure

---

## 1. Using Error Classes

### Import
```typescript
import { ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/errors';
```

### Usage in Services
```typescript
// Before:
if (!user) {
  return res.status(404).json({ success: false, message: 'User not found' });
}

// After:
if (!user) {
  throw new NotFoundError('User not found');
}
```

### All Available Errors
```typescript
throw new ValidationError('Invalid input');        // 400
throw new UnauthorizedError('Not authenticated'); // 401
throw new ForbiddenError('Access denied');        // 403
throw new NotFoundError('Resource not found');    // 404
throw new ConflictError('Already exists');        // 409
throw new InternalServerError('Server error');    // 500
```

---

## 2. Using Response Utilities

### Import
```typescript
import { sendSuccess, sendError, sendPaginated, sendCreated } from '../utils/response';
```

### Success Response
```typescript
// Before:
res.json({ success: true, message: 'User created', data: user });

// After:
sendSuccess(res, user, 'User created successfully');
```

### Created Response (201)
```typescript
sendCreated(res, transaction, 'Transaction created successfully');
```

### Paginated Response
```typescript
const { transactions, total } = await transactionService.getUserTransactions(...);
sendPaginated(res, transactions, total, page, limit);
```

### Error Response (rarely needed - use error classes instead)
```typescript
sendError(res, 'Something went wrong', 500);
```

---

## 3. Using Async Handler

### Import
```typescript
import { asyncHandler } from '../middleware/errorHandler';
```

### Wrap Controller Functions
```typescript
// Before:
export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique(...);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
};

// After:
export const getUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.getUserById(req.user!.id);
  sendSuccess(res, user);
});
```

---

## 4. Using Services

### AuthService
```typescript
import authService from '../services/authService';

// Change password
await authService.changePassword(userId, currentPassword, newPassword);

// Send OTP
const email = await authService.sendVerificationOtp(userId);

// Verify OTP
await authService.verifyOtp(userId, otp);

// Login
const { user, token } = await authService.login(email, password);
```

### TransactionService
```typescript
import transactionService from '../services/transactionService';

// Create transaction
const transaction = await transactionService.createTransaction(userId, data);

// Upload receipt
await transactionService.uploadReceipt(transactionId, userId, filePath);

// Get transactions
const result = await transactionService.getUserTransactions(userId, filters, page, limit);

// Get exchange rate
const rate = await transactionService.getExchangeRate('SDG', 'INR');
```

### NotificationService
```typescript
import notificationService from '../services/notificationService';

// Create notification
await notificationService.createNotification({
  userId,
  title: 'Transaction Approved',
  message: 'Your transaction has been approved',
  transactionId
});

// Get notifications
const result = await notificationService.getUserNotifications(userId, page, limit);

// Mark as read
await notificationService.markAsRead(notificationId, userId);
```

---

## 5. Using Pagination Utility

### Import
```typescript
import { calculatePagination, createPaginationMeta } from '../utils/pagination';
```

### Calculate Pagination
```typescript
// Before:
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 20;
const skip = (page - 1) * limit;

// After:
const { skip, take, page, limit } = calculatePagination(req.query);
```

### Create Pagination Metadata
```typescript
const pagination = createPaginationMeta(total, page, limit);
// Returns: { total, page, limit, totalPages }
```

---

## 6. Complete Controller Example

### Before Refactoring:
```typescript
export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { senderName, recipientName, amountSent, fromCurrencyCode, toCurrencyCode } = req.body;

    if (!senderName || !recipientName || !amountSent) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const fromCurrency = await prisma.currency.findUnique({
      where: { code: fromCurrencyCode }
    });

    if (!fromCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency'
      });
    }

    // ... more business logic ...

    const transaction = await prisma.transaction.create({ ... });

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Transaction Created',
        message: `Transaction ${transaction.transactionRef} created`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created',
      data: transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction'
    });
  }
};
```

### After Refactoring:
```typescript
export const createTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const transaction = await transactionService.createTransaction(req.user!.id, req.body);
  sendCreated(res, transaction, 'Transaction created successfully');
});
```

**Benefits:**
- 90% less code in controller
- Business logic in service (testable)
- Consistent error handling
- Consistent response format
- No try-catch needed

---

## 7. Complete Service Example

### TransactionService Method:
```typescript
async createTransaction(userId: number, data: CreateTransactionData) {
  // Validation
  if (!data.senderName || !data.recipientName || !data.amountSent) {
    throw new ValidationError('Missing required fields');
  }

  // Get currencies
  const fromCurrency = await prisma.currency.findUnique({
    where: { code: data.fromCurrencyCode }
  });

  if (!fromCurrency) {
    throw new ValidationError('Invalid currency code');
  }

  // Calculate amounts
  const amounts = await this.calculateAmounts(
    data.amountSent,
    data.fromCurrencyCode,
    data.toCurrencyCode
  );

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      transactionRef: this.generateTransactionRef(),
      userId,
      ...data,
      ...amounts,
      status: 'PENDING'
    }
  });

  // Create notification
  await notificationService.createNotification({
    userId,
    transactionId: transaction.id,
    title: 'Transaction Created',
    message: `Transaction ${transaction.transactionRef} created`
  });

  return transaction;
}
```

**Benefits:**
- All business logic in one place
- Throws errors (caught by global handler)
- Reusable across controllers
- Easy to test
- Clear and readable

---

## 8. Updating server.ts

### Add Error Handler (at the end, after all routes):
```typescript
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// ... all your routes ...

// 404 handler (before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);
```

---

## 9. Migration Checklist

### For Each Controller Function:

- [ ] Identify business logic
- [ ] Move business logic to service
- [ ] Import service in controller
- [ ] Wrap controller with `asyncHandler`
- [ ] Replace try-catch with service call
- [ ] Use response utilities
- [ ] Remove inline error handling
- [ ] Test the endpoint

### Example Migration:

**Step 1:** Create service method
```typescript
// In service:
async getUserById(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}
```

**Step 2:** Update controller
```typescript
// In controller:
export const getUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.getUserById(req.user!.id);
  sendSuccess(res, user);
});
```

**Step 3:** Test
```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 10. Common Patterns

### Pattern 1: Get Single Resource
```typescript
export const getResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resource = await resourceService.getById(parseInt(req.params.id));
  sendSuccess(res, resource);
});
```

### Pattern 2: Get List with Pagination
```typescript
export const getResources = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { skip, take, page, limit } = calculatePagination(req.query);
  const { resources, total } = await resourceService.getAll(skip, take);
  sendPaginated(res, resources, total, page, limit);
});
```

### Pattern 3: Create Resource
```typescript
export const createResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resource = await resourceService.create(req.user!.id, req.body);
  sendCreated(res, resource, 'Resource created successfully');
});
```

### Pattern 4: Update Resource
```typescript
export const updateResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resource = await resourceService.update(parseInt(req.params.id), req.body);
  sendSuccess(res, resource, 'Resource updated successfully');
});
```

### Pattern 5: Delete Resource
```typescript
export const deleteResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  await resourceService.delete(parseInt(req.params.id));
  sendSuccess(res, undefined, 'Resource deleted successfully');
});
```

---

## 11. Testing Services

### Unit Test Example:
```typescript
import authService from '../services/authService';
import { ValidationError, UnauthorizedError } from '../utils/errors';

describe('AuthService', () => {
  describe('login', () => {
    it('should throw ValidationError if email is missing', async () => {
      await expect(authService.login('', 'password'))
        .rejects.toThrow(ValidationError);
    });

    it('should throw UnauthorizedError if credentials are invalid', async () => {
      await expect(authService.login('wrong@email.com', 'wrong'))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should return user and token on successful login', async () => {
      const result = await authService.login('user@example.com', 'password');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
    });
  });
});
```

---

## 12. Troubleshooting

### Error: "Cannot find module"
**Solution:** Check import paths, ensure files are created

### Error: "Property does not exist"
**Solution:** Regenerate Prisma client: `npx prisma generate`

### Error: "Unhandled promise rejection"
**Solution:** Ensure `asyncHandler` is used and error handler is registered

### Error: "Response already sent"
**Solution:** Don't use both `throw` and `res.json()` - choose one

---

## 13. Best Practices

### DO:
- ✅ Throw errors in services
- ✅ Use asyncHandler in controllers
- ✅ Use response utilities
- ✅ Keep controllers thin
- ✅ Put business logic in services
- ✅ Use TypeScript types
- ✅ Document service methods

### DON'T:
- ❌ Return responses from services
- ❌ Use try-catch in controllers (use asyncHandler)
- ❌ Put business logic in controllers
- ❌ Use `any` type
- ❌ Duplicate code
- ❌ Mix error handling patterns

---

**Happy Refactoring! 🚀**
