// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import { verifyToken, authorize } from './middleware/auth';
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

// ==================== USER ROUTES ====================

apiRouter.put('/users/me', verifyToken, userController.updateCurrentUser);
apiRouter.put('/users/me/notification-settings', verifyToken, userController.updateNotificationSettings);

// ==================== KYC ROUTES ====================

apiRouter.post('/kyc/upload', verifyToken, uploadKycDocuments, handleUploadError, async (req: any, res: any) => {
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

apiRouter.post('/transactions', verifyToken, transactionController.createTransaction);
apiRouter.post('/transactions/:transactionId/upload', verifyToken, uploadReceipt, handleUploadError, transactionController.uploadReceipt);
apiRouter.get('/exchange-rate', verifyToken, transactionController.getExchangeRate);
apiRouter.post('/transactions/:id/cancel', verifyToken, transactionController.cancelTransaction);

// ==================== ADMIN & SHARED ROUTES ====================

// This shared route uses internal logic to differentiate roles. It is kept as is.
apiRouter.get('/transactions', verifyToken, (req: any, res: any) => {
  if (VIEW_ROLES_SHARED.includes(req.user.role)) {
    return adminController.getAllTransactions(req, res);
  }
  return transactionController.getUserTransactions(req, res);
});

// This shared route uses internal logic to differentiate roles. It is kept as is.
apiRouter.get('/transactions/:id', verifyToken, (req: any, res: any) => {
  if (VIEW_ROLES_SHARED.includes(req.user.role)) {
    return adminController.getTransactionById(req, res);
  }
  return transactionController.getTransactionById(req, res);
});

// Stricter RBAC rules applied as per user request
apiRouter.post('/admin/transactions/:id/approve', verifyToken, authorize(ADMIN_ROLES), adminController.approveTransaction);
apiRouter.post('/admin/transactions/:id/reject', verifyToken, authorize(ADMIN_ROLES), adminController.rejectTransaction);
apiRouter.post('/admin/transactions/:id/complete', verifyToken, authorize(ADMIN_ROLES), adminController.completeTransaction);

apiRouter.get('/admin/dashboard/stats', verifyToken, authorize(ADMIN_ROLES), adminController.getDashboardStats);

apiRouter.get('/admin/exchange-rates', verifyToken, authorize(ADMIN_ROLES), adminController.getExchangeRates);
apiRouter.post('/admin/exchange-rates', verifyToken, authorize(ADMIN_ROLES), adminController.updateExchangeRate);

apiRouter.get('/admin/currencies', verifyToken, authorize(ADMIN_ROLES), adminController.getAllCurrencies);

apiRouter.get('/admin/users', verifyToken, authorize(ADMIN_ROLES), adminController.getAllUsers);
apiRouter.get('/admin/users/:id', verifyToken, authorize(ADMIN_ROLES), adminController.getUserById);
apiRouter.get('/admin/users/:id/transactions', verifyToken, authorize(ADMIN_ROLES), adminController.getUserTransactions);
apiRouter.put('/admin/users/:id/status', verifyToken, authorize(ADMIN_ROLES), adminController.toggleUserStatus);

apiRouter.post('/admin/kyc/:docId/approve', verifyToken, authorize(ADMIN_ROLES), adminController.approveKycDocument);
apiRouter.post('/admin/kyc/:docId/reject', verifyToken, authorize(ADMIN_ROLES), adminController.rejectKycDocument);

apiRouter.get('/admin/profile', verifyToken, authorize(ADMIN_ROLES), adminController.getAdminProfile);
apiRouter.put('/admin/profile', verifyToken, authorize(ADMIN_ROLES), adminController.updateAdminProfile);

// Audit Logs & System - SUPER_ADMIN only
apiRouter.get('/admin/system/audit-logs', verifyToken, authorize(SUPER_ADMIN_ROLE), adminController.getAuditLogs);
apiRouter.get('/admin/system/audit-logs/stats', verifyToken, authorize(SUPER_ADMIN_ROLE), adminController.getAuditLogStats);
apiRouter.get('/admin/system/audit-logs/:id', verifyToken, authorize(SUPER_ADMIN_ROLE), adminController.getAuditLogById);

// System Settings - SUPER_ADMIN only
apiRouter.use('/admin/system', settingsRoutes);

// ==================== NOTIFICATIONS ====================

apiRouter.get('/notifications', verifyToken, (req: any, res: any) => {
  if (VIEW_ROLES_SHARED.includes(req.user.role)) {
    return adminController.getAdminNotifications(req, res);
  }
  
  prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 20 })
    .then(notifications => res.json({ success: true, data: notifications }))
    .catch(() => res.status(500).json({ success: false, message: 'Failed to fetch notifications' }));
});

apiRouter.post('/notifications/:id/read', verifyToken, (req: any, res: any) => {
  if (VIEW_ROLES_SHARED.includes(req.user.role)) {
    return adminController.markNotificationAsRead(req, res);
  }
  
  prisma.notification.update({ where: { id: parseInt(req.params.id), userId: req.user.id }, data: { isRead: true } })
    .then(() => res.json({ success: true, message: 'Notification marked as read' }))
    .catch(() => res.status(500).json({ success: false, message: 'Failed to update notification' }));
});

apiRouter.post('/notifications/read-all', verifyToken, authorize(ADMIN_ROLES), adminController.markAllNotificationsAsRead);

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