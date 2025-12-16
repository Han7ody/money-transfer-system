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
import { uploadReceipt, uploadKycDocuments, handleUploadError, uploadProfilePicture } from './middleware/upload';
import * as transactionController from './controllers/transactionController';
import * as adminController from './controllers/adminController';
import * as userController from './controllers/userController';
import authRoutes from './routes/authRoutes';
import settingsRoutes from './routes/settingsRoutes';
import agentRoutes from './routes/agentRoutes';
import rateLimitRoutes from './routes/rateLimitRoutes';
import kycRoutes from './routes/kycRoutes';
import securityRoutes from './routes/securityRoutes';
import supportRoutes from './routes/supportRoutes';
import complianceRoutes from './routes/complianceRoutes';
import adminManagementRoutes from './routes/adminManagementRoutes';
import roleManagementRoutes from './routes/roleManagementRoutes';
import adminUserRoutes from './routes/adminUserRoutes';
import roleRoutes from './routes/roleRoutes';
import agentManagementRoutes from './routes/agentManagementRoutes';
import path from 'path';
import emailService from './services/emailService';
import { notificationHandler } from './events/handlers/notificationHandler';
import { sessionActivityMiddleware } from './middleware/sessionActivity';
import { ipWhitelistMiddleware } from './middleware/ipWhitelist';

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

// Serve uploaded files (absolute path for dev and prod)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ==================== API ROUTER ====================
const apiRouter = express.Router();

// Role constants
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];
const SUPER_ADMIN_ROLE = ['SUPER_ADMIN'];

// A temporary constant to keep shared routes functional without changing their internal logic
const VIEW_ROLES_SHARED = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'VIEWER'];

// ==================== AUTH ROUTES ====================
apiRouter.use('/auth', authRoutes);

// ==================== SPRINT 5: ADMIN LOGIN (PUBLIC) ====================
// Admin login must be before verifyToken middleware
apiRouter.post('/admin-management/admins/login', (req, res) => {
  return require('./controllers/AdminUserController').default.login(req, res);
});

// ==================== PUBLIC ENDPOINTS (NO AUTH REQUIRED) ====================
// These must come before verifyToken middleware
apiRouter.get('/public/system-status', async (req, res) => {
  try {
    const maintenanceSetting = await prisma.systemSettings.findUnique({
      where: { key: 'maintenance_mode' }
    });

    // Ensure maintenance_mode record exists, initialize to false if not
    let isMaintenanceMode = false;
    if (maintenanceSetting?.value === 'true') {
      isMaintenanceMode = true;
    } else if (!maintenanceSetting) {
      // If record doesn't exist, create it with false value
      try {
        await prisma.systemSettings.create({
          data: {
            key: 'maintenance_mode',
            value: 'false',
            category: 'general'
          }
        });
      } catch (error) {
        // Record might have been created by another request, that's fine
        // Could not create maintenance_mode setting
      }
      isMaintenanceMode = false;
    }



    res.json({
      success: true,
      data: {
        maintenance: isMaintenanceMode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system status'
    });
  }
});

// ==================== DEBUG ENDPOINT ====================
// Check actual database value (for debugging only)
apiRouter.get('/debug/maintenance-value', async (req, res) => {
  try {
    const allSettings = await prisma.systemSettings.findMany({
      where: {
        key: { in: ['maintenance_mode', 'maintenanceMode'] }
      }
    });

    res.json({
      success: true,
      data: {
        all_maintenance_settings: allSettings,
        count: allSettings.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as any).message
    });
  }
});



// ==================== MAINTENANCE MODE MIDDLEWARE ====================
// Apply after auth routes and public endpoints, before protected routes
apiRouter.use(verifyToken);
apiRouter.use(maintenanceMode);

// ==================== SECURITY MIDDLEWARE ====================
// Apply session activity tracking and IP whitelist for admin routes
apiRouter.use('/admin', sessionActivityMiddleware);
apiRouter.use('/admin', ipWhitelistMiddleware);

// ==================== SECURITY ROUTES ====================
apiRouter.use('/security', securityRoutes);

// ==================== SUPPORT ROUTES ====================
apiRouter.use('/support', supportRoutes);

// ==================== COMPLIANCE ROUTES ====================
apiRouter.use('/compliance', complianceRoutes);

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

    // Delete existing KYC documents for this user
    await prisma.kycDocument.deleteMany({ where: { userId } });

    // Create new KYC documents with proper schema fields
    const documents = await Promise.all([
      (prisma.kycDocument as any).create({ 
        data: { 
          userId, 
          documentType: 'NATIONAL_ID',
          frontImageUrl: `/uploads/kyc/${files.idFront[0].filename}`,
          backImageUrl: `/uploads/kyc/${files.idBack[0].filename}`
        } 
      }),
      (prisma.kycDocument as any).create({ 
        data: { 
          userId, 
          documentType: 'SELFIE',
          frontImageUrl: `/uploads/kyc/${files.selfie[0].filename}`
        } 
      })
    ]);

    // Update user KYC status
    const user = await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'PENDING', kycSubmittedAt: new Date() }
    });

    // Send confirmation email
    await emailService.sendKycReceivedEmail(user.email, user.fullName);

    res.json({ success: true, message: 'KYC documents uploaded successfully', data: { documents } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to upload KYC documents' });
  }
});

// ==================== TRANSACTION ROUTES ====================

apiRouter.post('/transactions', transactionController.createTransaction);
apiRouter.post('/transactions/:transactionId/upload', uploadReceipt, handleUploadError, transactionController.uploadReceipt);
apiRouter.get('/exchange-rate', transactionController.getExchangeRate);
apiRouter.post('/transactions/:id/cancel', transactionController.cancelTransaction);

// ==================== ADMIN & SHARED ROUTES ====================

// This shared route uses internal logic to differentiate roles. It is kept as is.
apiRouter.get('/transactions', (req: any, res: any) => {
  if (VIEW_ROLES_SHARED.includes(req.user.role)) {
    return adminController.getAllTransactions(req, res);
  }
  return transactionController.getUserTransactions(req, res);
});

// This shared route uses internal logic to differentiate roles. It is kept as is.
apiRouter.get('/transactions/:id', (req: any, res: any) => {
  if (VIEW_ROLES_SHARED.includes(req.user.role)) {
    return adminController.getTransactionById(req, res);
  }
  return transactionController.getTransactionById(req, res);
});

// Stricter RBAC rules applied as per user request
apiRouter.post('/admin/transactions/:id/approve', authorize(ADMIN_ROLES), adminController.approveTransaction);
apiRouter.post('/admin/transactions/:id/reject', authorize(ADMIN_ROLES), adminController.rejectTransaction);
apiRouter.post('/admin/transactions/:id/complete', authorize(ADMIN_ROLES), adminController.completeTransaction);
apiRouter.post('/admin/transactions/:id/assign-agent', authorize(ADMIN_ROLES), adminController.assignAgentToTransaction);
apiRouter.post('/admin/transactions/:id/confirm-pickup', authorize(ADMIN_ROLES), adminController.confirmCashPickup);
apiRouter.get('/admin/transactions/:id/history', authorize(ADMIN_ROLES), adminController.getTransactionHistory);

apiRouter.get('/admin/dashboard/stats', authorize(ADMIN_ROLES), adminController.getDashboardStats);

apiRouter.get('/admin/exchange-rates', authorize(ADMIN_ROLES), adminController.getExchangeRates);
apiRouter.post('/admin/exchange-rates', authorize(ADMIN_ROLES), adminController.updateExchangeRate);

apiRouter.get('/admin/currencies', authorize(ADMIN_ROLES), adminController.getAllCurrencies);

apiRouter.get('/admin/users', authorize(ADMIN_ROLES), adminController.getAllUsers);
apiRouter.get('/admin/users/recent', authorize(ADMIN_ROLES), adminController.getRecentUsers);
apiRouter.get('/admin/users/:id', authorize(ADMIN_ROLES), adminController.getUserById);
apiRouter.get('/admin/users/:id/transactions', authorize(ADMIN_ROLES), adminController.getUserTransactions);
apiRouter.put('/admin/users/:id/status', authorize(ADMIN_ROLES), adminController.toggleUserStatus);

// Old KYC endpoints removed - now using /admin/kyc routes from kycRoutes.ts
// apiRouter.post('/admin/kyc/:docId/approve', authorize(ADMIN_ROLES), adminController.approveKycDocument);
// apiRouter.post('/admin/kyc/:docId/reject', authorize(ADMIN_ROLES), adminController.rejectKycDocument);

apiRouter.get('/admin/profile', authorize(ADMIN_ROLES), adminController.getAdminProfile);
apiRouter.put('/admin/profile', authorize(ADMIN_ROLES), adminController.updateAdminProfile);
apiRouter.post('/admin/profile/picture', authorize(ADMIN_ROLES), uploadProfilePicture, handleUploadError, adminController.updateProfilePicture);

// Audit Logs & System - SUPER_ADMIN only
apiRouter.get('/admin/system/audit-logs', authorize(SUPER_ADMIN_ROLE), adminController.getAuditLogs);
apiRouter.get('/admin/audit-logs', authorize(ADMIN_ROLES), adminController.getAuditLogs);
apiRouter.get('/admin/system/audit-logs/stats', authorize(SUPER_ADMIN_ROLE), adminController.getAuditLogStats);
apiRouter.get('/admin/system/audit-logs/:id', authorize(SUPER_ADMIN_ROLE), adminController.getAuditLogById);

// System Settings - SUPER_ADMIN only
apiRouter.use('/admin/system', settingsRoutes);

// Agent Management - ADMIN only
apiRouter.use('/admin', agentRoutes);

// Rate Limit Management - SUPER_ADMIN only
apiRouter.use('/admin/security/rate-limits', rateLimitRoutes);

// KYC Management - ADMIN only
apiRouter.use('/admin/kyc', kycRoutes);

// Admin Management - SUPER_ADMIN only (Legacy)
apiRouter.use('/admin/admins', adminManagementRoutes);

// Role Management - SUPER_ADMIN only (Legacy)
apiRouter.use('/admin/roles', roleManagementRoutes);

// ==================== SPRINT 5: NEW ADMIN SYSTEM ====================
// Admin User Management (Separate admin accounts)
apiRouter.use('/admin-management/admins', adminUserRoutes);

// Role & Permission Management
apiRouter.use('/admin-management/roles', roleRoutes);

// Agent Management (Enhanced)
apiRouter.use('/agents', agentManagementRoutes);

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
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Initialize event handlers
notificationHandler.initialize();

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