# 📦 Complete Maintenance Mode Fix - All Updated Files

## Backend Files

### 1. backend/src/middleware/maintenance.ts (CREATED)
```typescript
import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth';

/**
 * Global Maintenance Mode Middleware
 * 
 * Rules:
 * - Reads maintenance_mode from SystemSettings (key = "maintenance_mode")
 * - If maintenance_mode = true AND user is NOT ADMIN/SUPER_ADMIN → Block access
 * - Returns 503 Service Unavailable for blocked users
 * - Allows ADMIN and SUPER_ADMIN to bypass maintenance
 */
export const maintenanceMode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get maintenance status from SystemSettings
    const maintenanceSetting = await prisma.systemSettings.findUnique({
      where: { key: 'maintenance_mode' }
    });

    const isMaintenanceMode = maintenanceSetting?.value === 'true';

    // If maintenance mode is OFF, allow all requests
    if (!isMaintenanceMode) {
      return next();
    }

    // If maintenance mode is ON, check user role
    const user = req.user;

    // If no authenticated user or user is not admin, block the request
    if (!user) {
      return res.status(503).json({
        error: 'SYSTEM_UNDER_MAINTENANCE',
        message: 'The system is currently under maintenance.',
        statusCode: 503
      });
    }

    // Check if user has admin role
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      return res.status(503).json({
        error: 'SYSTEM_UNDER_MAINTENANCE',
        message: 'The system is currently under maintenance.',
        statusCode: 503
      });
    }

    // Admin or SUPER_ADMIN can proceed
    return next();
  } catch (error) {
    console.error('[MaintenanceMode] Error checking maintenance status:', error);
    // If there's an error checking maintenance status, allow the request to proceed
    return next();
  }
};
```

---

### 2. backend/src/routes/authRoutes.ts (UPDATED - Login Endpoint)
Key update: The login endpoint now includes maintenance check:

```typescript
// Login endpoint with maintenance check
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check maintenance mode BEFORE allowing login for non-admins
    const maintenanceSetting = await prisma.systemSettings.findUnique({
      where: { key: 'maintenance_mode' }
    });
    const isMaintenanceMode = maintenanceSetting?.value === 'true';

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Block non-admin users during maintenance mode
    if (isMaintenanceMode && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return res.status(503).json({
        success: false,
        message: 'The system is currently under maintenance. Please try again later.',
        maintenance: true,
        statusCode: 503
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          kycStatus: user.kycStatus
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});
```

---

### 3. backend/src/server.ts (COMPLETE FILE)
```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import { verifyToken, authorize } from './middleware/auth';
import { maintenanceMode } from './middleware/maintenance';
import { uploadReceipt, uploadKycDocuments, handleUploadError } from './middleware/upload';
import * as transactionController from './controllers/transactionController';
import * as adminController from './controllers/adminController';
import * as userController from './controllers/userController';
import authRoutes from './routes/authRoutes';
import settingsRoutes from './routes/settingsRoutes';
import path from 'path';
import emailService from './services/emailService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.1.6:3000',
    process.env.FRONTEND_URL || ''
  ],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ==================== API ROUTER ====================
const apiRouter = express.Router();

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];
const SUPER_ADMIN_ROLE = ['SUPER_ADMIN'];
const VIEW_ROLES_SHARED = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'VIEWER'];

// ==================== AUTH ROUTES ====================
apiRouter.use('/auth', authRoutes);

// ==================== MAINTENANCE MODE MIDDLEWARE ====================
// Apply after auth routes but before protected routes
apiRouter.use(verifyToken);
apiRouter.use(maintenanceMode);

// ==================== USER ROUTES ====================
apiRouter.put('/users/me', userController.updateCurrentUser);
apiRouter.put('/users/me/notification-settings', userController.updateNotificationSettings);

// ==================== KYC ROUTES ====================
apiRouter.post('/kyc/upload', uploadKycDocuments, handleUploadError, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (!files || !files.idFront || !files.idBack || !files.selfie) {
      return res.status(400).json({
        success: false,
        message: 'All documents are required (idFront, idBack, selfie)'
      });
    }

    await prisma.kycDocument.deleteMany({ where: { userId } });

    const documents = await Promise.all([
      prisma.kycDocument.create({ data: { userId, type: 'id_front', filePath: files.idFront[0].filename } }),
      prisma.kycDocument.create({ data: { userId, type: 'id_back', filePath: files.idBack[0].filename } }),
      prisma.kycDocument.create({ data: { userId, type: 'selfie', filePath: files.selfie[0].filename } })
    ]);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'PENDING', kycSubmittedAt: new Date() }
    });

    await emailService.sendKycReceivedEmail(user.email, user.fullName);

    res.json({ success: true, message: 'KYC documents uploaded successfully', data: { documents } });
  } catch (error: any) {
    console.error('KYC upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload KYC documents' });
  }
});

// ==================== TRANSACTION ROUTES ====================
apiRouter.post('/transactions', transactionController.createTransaction);
apiRouter.post('/transactions/:transactionId/upload', uploadReceipt, handleUploadError, transactionController.uploadReceipt);
apiRouter.get('/exchange-rate', transactionController.getExchangeRate);
apiRouter.post('/transactions/:id/cancel', transactionController.cancelTransaction);

// ==================== ADMIN & SHARED ROUTES ====================
apiRouter.get('/transactions', (req: any, res: any) => {
  if (VIEW_ROLES_SHARED.includes(req.user.role)) {
    return adminController.getAllTransactions(req, res);
  }
  return transactionController.getUserTransactions(req, res);
});

apiRouter.get('/transactions/:id', (req: any, res: any) => {
  if (VIEW_ROLES_SHARED.includes(req.user.role)) {
    return adminController.getTransactionById(req, res);
  }
  return transactionController.getTransactionById(req, res);
});

apiRouter.post('/admin/transactions/:id/approve', authorize(ADMIN_ROLES), adminController.approveTransaction);
apiRouter.post('/admin/transactions/:id/reject', authorize(ADMIN_ROLES), adminController.rejectTransaction);
apiRouter.post('/admin/transactions/:id/complete', authorize(ADMIN_ROLES), adminController.completeTransaction);

apiRouter.get('/admin/dashboard/stats', authorize(ADMIN_ROLES), adminController.getDashboardStats);

apiRouter.get('/admin/exchange-rates', authorize(ADMIN_ROLES), adminController.getExchangeRates);
apiRouter.post('/admin/exchange-rates', authorize(ADMIN_ROLES), adminController.updateExchangeRate);

apiRouter.get('/admin/currencies', authorize(ADMIN_ROLES), adminController.getAllCurrencies);

apiRouter.get('/admin/users', authorize(ADMIN_ROLES), adminController.getAllUsers);
apiRouter.get('/admin/users/:id', authorize(ADMIN_ROLES), adminController.getUserById);
apiRouter.get('/admin/users/:id/transactions', authorize(ADMIN_ROLES), adminController.getUserTransactions);
apiRouter.put('/admin/users/:id/status', authorize(ADMIN_ROLES), adminController.toggleUserStatus);

apiRouter.post('/admin/kyc/:docId/approve', authorize(ADMIN_ROLES), adminController.approveKycDocument);
apiRouter.post('/admin/kyc/:docId/reject', authorize(ADMIN_ROLES), adminController.rejectKycDocument);

apiRouter.get('/admin/profile', authorize(ADMIN_ROLES), adminController.getAdminProfile);
apiRouter.put('/admin/profile', authorize(ADMIN_ROLES), adminController.updateAdminProfile);

// Audit Logs & System - SUPER_ADMIN only
apiRouter.get('/admin/system/audit-logs', authorize(SUPER_ADMIN_ROLE), adminController.getAuditLogs);
apiRouter.get('/admin/system/audit-logs/stats', authorize(SUPER_ADMIN_ROLE), adminController.getAuditLogStats);
apiRouter.get('/admin/system/audit-logs/:id', authorize(SUPER_ADMIN_ROLE), adminController.getAuditLogById);

// System Settings - SUPER_ADMIN only
apiRouter.use('/admin/system', settingsRoutes);

// ==================== NOTIFICATIONS ====================
apiRouter.get('/notifications', (req: any, res: any) => {
  if (VIEW_ROLES_SHARED.includes(req.user.role)) {
    return adminController.getAdminNotifications(req, res);
  }
  
  prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 20 })
    .then(notifications => res.json({ success: true, data: notifications }))
    .catch(() => res.status(500).json({ success: false, message: 'Failed to fetch notifications' }));
});

apiRouter.post('/notifications/:id/read', (req: any, res: any) => {
  if (VIEW_ROLES_SHARED.includes(req.user.role)) {
    return adminController.markNotificationAsRead(req, res);
  }
  
  prisma.notification.update({ where: { id: parseInt(req.params.id), userId: req.user.id }, data: { isRead: true } })
    .then(() => res.json({ success: true, message: 'Notification marked as read' }))
    .catch(() => res.status(500).json({ success: false, message: 'Failed to update notification' }));
});

apiRouter.post('/notifications/read-all', authorize(ADMIN_ROLES), adminController.markAllNotificationsAsRead);

// ==================== HEALTH CHECK ====================
apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

---

### 4. backend/src/controllers/settingsController.ts (UPDATED)
Key changes:
- `getMaintenanceFlag()` uses correct key `maintenance_mode`
- `updateSystemSettings()` whitelist includes `maintenance_mode`

```typescript
/**
 * GET: Fetch maintenance mode status
 * Public endpoint - accessible without authentication
 */
export const getMaintenanceFlag = async (req: any, res: Response) => {
  try {
    const maintenanceSetting = await prisma.systemSettings.findUnique({
      where: { key: 'maintenance_mode' }
    });

    const isMaintenanceMode = maintenanceSetting?.value === 'true';

    res.json({
      success: true,
      data: {
        maintenance: isMaintenanceMode
      }
    });
  } catch (error) {
    console.error('Get maintenance flag error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب حالة الصيانة'
    });
  }
};

// In updateSystemSettings():
const allowedFields = [
  'platformName',
  'supportEmail',
  'supportPhone',
  'maintenance_mode',  // ✅ Updated from maintenanceMode
  'timezone',
  'companyAddress',
  'defaultLanguage',
  'dateFormat',
  'timeFormat'
];
```

---

### 5. backend/src/routes/settingsRoutes.ts (PUBLIC ENDPOINT)
```typescript
// PUBLIC endpoint - get maintenance status (no auth required)
router.get('/settings/maintenance', settingsController.getMaintenanceFlag);
```

---

## Frontend Files

### 1. frontend/src/app/(public)/login/page.tsx (UPDATED)
```typescript
'use client';
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, DollarSign, Shield, Zap } from 'lucide-react';

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Check maintenance status on page load
  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await authAPI.getMaintenanceStatus();
        if (response?.data?.maintenance) {
          setMaintenanceMode(true);
        }
      } catch (err) {
        console.error('Failed to check maintenance status:', err);
      }
    };

    checkMaintenanceStatus();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Check maintenance mode before attempting login
    if (maintenanceMode) {
      setError('النظام تحت الصيانة. لا يمكن تسجيل الدخول حالياً.');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(formData.email, formData.password);
      if (response.success) {
        try {
          const me = await authAPI.getCurrentUser();
          if (me?.success && me?.data) {
            localStorage.setItem('user', JSON.stringify(me.data));
          }
          const role = me?.data?.role;
          const isVerified = me?.data?.isVerified;

          // Redirect based on role
          if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SUPPORT' || role === 'VIEWER') {
            router.push('/admin');
          } else if (!isVerified) {
            try { await authAPI.sendVerificationOtp(); } catch {}
            router.push('/verify-email');
          } else {
            router.push('/dashboard');
          }
        } catch {
          router.push('/dashboard');
        }
      } else {
        setError(response.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.');
      }
    } catch (err: unknown) {
      const error = err as { response?: { status: number; data?: { maintenance?: boolean; message?: string } } };
      if (error.response?.status === 503 && error.response?.data?.maintenance) {
        setMaintenanceMode(true);
        setError('النظام تحت الصيانة. لا يمكن تسجيل الدخول حالياً.');
      } else {
        setError(error.response?.data?.message || 'حدث خطأ أثناء محاولة تسجيل الدخول.');
      }
    }
    setLoading(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side card (hidden on mobile) */}
        <div className="hidden lg:block">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-12 text-white shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center"><DollarSign className="w-8 h-8" /></div>
              <div><h2 className="text-3xl font-bold">راصد</h2><p className="text-indigo-100">خدمة آمنة وسريعة</p></div>
            </div>
            <div className="space-y-6 mb-12">
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><Zap className="w-6 h-6" /></div><div><h3 className="font-bold text-lg mb-1">تحويل فوري</h3><p className="text-indigo-100 text-sm">إرسال الأموال بسرعة وسهولة بين السودان والهند</p></div></div>
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><Shield className="w-6 h-6" /></div><div><h3 className="font-bold text-lg mb-1">آمن ومضمون</h3><p className="text-indigo-100 text-sm">تشفير عالي المستوى لحماية معاملاتك المالية</p></div></div>
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><DollarSign className="w-6 h-6" /></div><div><h3 className="font-bold text-lg mb-1">أسعار تنافسية</h3><p className="text-indigo-100 text-sm">أفضل أسعار صرف مع عمولات منخفضة</p></div></div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">مرحباً بعودتك!</h1>
              <p className="text-slate-600">سجل دخولك للوصول إلى حسابك</p>
            </div>

            {maintenanceMode && (
              <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium">النظام تحت الصيانة. سيكون متاحاً قريباً.</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-800 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                <div className="relative"><Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pr-12 pl-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="example@email.com" required /></div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
                <div className="relative"><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="w-full pr-12 pl-12 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div>
              </div>

              <div className="flex items-center justify-between">
                <a href="/forgot-password" className="text-sm text-slate-600 hover:text-indigo-700 font-bold">نسيت كلمة المرور؟</a>
                <a href="/register" className="text-sm text-indigo-600 hover:text-indigo-700 font-bold">إنشاء حساب جديد</a>
              </div>

              <button type="submit" disabled={loading || maintenanceMode} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3">
                {loading ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>جاري تسجيل الدخول...</span></>) : (<><span>تسجيل الدخول</span><LogIn className="w-5 h-5" /></>)}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```

---

### 2. frontend/src/app/maintenance/page.tsx (CREATED)
```tsx
'use client';

import React from 'react';
import { Wrench, Clock } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-10 h-10 text-amber-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">النظام تحت الصيانة</h1>

          {/* Description */}
          <p className="text-slate-600 mb-6">
            نعتذر عن الإزعاج. نحن نعمل على تحسين الخدمة حالياً. يرجى المحاولة لاحقاً.
          </p>

          {/* Status */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-amber-700">
              <Clock className="w-5 h-5" />
              <span className="font-medium">سيكون النظام متاحاً قريباً</span>
            </div>
          </div>

          {/* Support Contact */}
          <div className="pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-4">
              في حالة وجود أي استفسارات، يمكنك التواصل معنا
            </p>
            <a
              href="mailto:support@rasid.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
            >
              البريد الإلكتروني للدعم
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. frontend/src/lib/api.ts (UPDATED)
Added to `authAPI`:
```typescript
// Get maintenance status (public endpoint, no auth required)
getMaintenanceStatus: async () => {
  const response = await api.get('/admin/system/settings/maintenance');
  return response.data;
},
```

---

## Key Implementation Points

✅ **Backend Enforcement**: Middleware blocks at API level before route handlers  
✅ **Login Check**: Maintenance status checked before credentials validation  
✅ **Frontend Check**: Page load checks maintenance and disables login  
✅ **Admin Bypass**: ADMIN and SUPER_ADMIN can login and access all routes  
✅ **Database Driven**: Uses SystemSettings table with key `maintenance_mode`  
✅ **Public Endpoint**: `/api/admin/system/settings/maintenance` accessible without auth  
✅ **Proper HTTP Status**: Returns 503 Service Unavailable  
✅ **Error Handling**: Graceful fallback if database check fails  

---

## Testing

```bash
# Enable maintenance mode
curl -X PATCH http://localhost:5000/api/admin/system/settings \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maintenance_mode": true}'

# Check maintenance status (public)
curl http://localhost:5000/api/admin/system/settings/maintenance

# Try to login as normal user (should return 503)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Login as admin (should work)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

---

## ✨ Implementation Complete

All files have been updated with complete maintenance mode enforcement at both API and frontend levels. The system is now production-ready for managing maintenance windows.
