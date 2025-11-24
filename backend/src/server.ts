// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import { verifyToken, isAdmin } from './middleware/auth';
import { uploadReceipt, uploadKycDocuments, handleUploadError } from './middleware/upload';
import * as transactionController from './controllers/transactionController';
import * as adminController from './controllers/adminController';
import * as userController from './controllers/userController';
import authRoutes from './routes/authRoutes';
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
    'http://192.168.1.6:3000', // <-- أضف هذا السطر
    process.env.FRONTEND_URL || ''
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files (absolute path for dev and prod)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ==================== AUTH ROUTES ====================
app.use('/api/auth', authRoutes);

// ==================== USER ROUTES ====================

app.put('/api/users/me', verifyToken, userController.updateCurrentUser);
app.put('/api/users/me/notification-settings', verifyToken, userController.updateNotificationSettings);

// ==================== KYC ROUTES ====================

app.post('/api/kyc/upload', verifyToken, uploadKycDocuments, handleUploadError, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (!files || !files.idFront || !files.idBack || !files.selfie) {
      console.log('Files received:', files);
      return res.status(400).json({
        success: false,
        message: 'All documents are required (idFront, idBack, selfie)'
      });
    }

    // Delete existing KYC documents
    await prisma.kycDocument.deleteMany({
      where: { userId }
    });

    // Save new KYC documents
    const documents = await Promise.all([
      prisma.kycDocument.create({
        data: {
          userId,
          type: 'id_front',
          filePath: files.idFront[0].filename
        }
      }),
      prisma.kycDocument.create({
        data: {
          userId,
          type: 'id_back',
          filePath: files.idBack[0].filename
        }
      }),
      prisma.kycDocument.create({
        data: {
          userId,
          type: 'selfie',
          filePath: files.selfie[0].filename
        }
      })
    ]);

    // Update user KYC status and get user data
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'PENDING',
        kycSubmittedAt: new Date()
      }
    });

    // Send KYC received email
    await emailService.sendKycReceivedEmail(user.email, user.fullName);

    res.json({
      success: true,
      message: 'KYC documents uploaded successfully',
      data: { documents }
    });
  } catch (error: any) {
    console.error('KYC upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload KYC documents'
    });
  }
});

// ==================== TRANSACTION ROUTES ====================

app.post('/api/transactions', verifyToken, transactionController.createTransaction);
app.post('/api/transactions/:transactionId/upload', verifyToken, uploadReceipt, handleUploadError, transactionController.uploadReceipt);
app.get('/api/transactions', verifyToken, transactionController.getUserTransactions);
app.get('/api/transactions/:id', verifyToken, transactionController.getTransactionById);
app.get('/api/exchange-rate', verifyToken, transactionController.getExchangeRate);
app.post('/api/transactions/:id/cancel', verifyToken, transactionController.cancelTransaction);

// ==================== ADMIN ROUTES ====================

app.get('/api/admin/transactions', verifyToken, isAdmin, adminController.getAllTransactions);
app.get('/api/admin/transactions/:id', verifyToken, isAdmin, adminController.getTransactionById);

// 🛑 المسار المضاف لجلب العملات
app.get('/api/admin/currencies', verifyToken, isAdmin, adminController.getAllCurrencies);

app.post('/api/admin/transactions/:id/approve', verifyToken, isAdmin, adminController.approveTransaction);
app.post('/api/admin/transactions/:id/reject', verifyToken, isAdmin, adminController.rejectTransaction);
app.post('/api/admin/transactions/:id/complete', verifyToken, isAdmin, adminController.completeTransaction);
app.get('/api/admin/dashboard/stats', verifyToken, isAdmin, adminController.getDashboardStats);
app.get('/api/admin/exchange-rates', verifyToken, isAdmin, adminController.getExchangeRates);
app.post('/api/admin/exchange-rates', verifyToken, isAdmin, adminController.updateExchangeRate);

// Admin User Management Routes
app.get('/api/admin/users', verifyToken, isAdmin, adminController.getAllUsers);
app.get('/api/admin/users/:id', verifyToken, isAdmin, adminController.getUserById);
app.get('/api/admin/users/:id/transactions', verifyToken, isAdmin, adminController.getUserTransactions);
app.put('/api/admin/users/:id/status', verifyToken, isAdmin, adminController.toggleUserStatus);

// Admin KYC Management Routes
app.post('/api/admin/kyc/:docId/approve', verifyToken, isAdmin, adminController.approveKycDocument);
app.post('/api/admin/kyc/:docId/reject', verifyToken, isAdmin, adminController.rejectKycDocument);

// Admin Notifications & Profile
app.get('/api/admin/notifications', verifyToken, isAdmin, adminController.getAdminNotifications);
app.post('/api/admin/notifications/:id/read', verifyToken, isAdmin, adminController.markNotificationAsRead);
app.post('/api/admin/notifications/read-all', verifyToken, isAdmin, adminController.markAllNotificationsAsRead);
app.get('/api/admin/profile', verifyToken, isAdmin, adminController.getAdminProfile);

// Admin Audit Logs (note: /stats must come before /:id)
app.get('/api/admin/audit-logs', verifyToken, isAdmin, adminController.getAuditLogs);
app.get('/api/admin/audit-logs/stats', verifyToken, isAdmin, adminController.getAuditLogStats);
app.get('/api/admin/audit-logs/:id', verifyToken, isAdmin, adminController.getAuditLogById);

// ==================== NOTIFICATIONS ====================

app.get('/api/notifications', verifyToken, async (req: any, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

app.post('/api/notifications/:id/read', verifyToken, async (req: any, res) => {
  try {
    await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification'
    });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

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