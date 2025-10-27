// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { verifyToken, isAdmin } from './middleware/auth';
import { uploadReceipt, handleUploadError } from './middleware/upload';
import * as transactionController from './controllers/transactionController';
import * as adminController from './controllers/adminController';
import * as userController from './controllers/userController';
import authRoutes from './routes/authRoutes';
import path from 'path';


dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// ==================== TRANSACTION ROUTES ====================

app.post('/api/transactions', verifyToken, transactionController.createTransaction);
app.post('/api/transactions/:transactionId/upload', verifyToken, uploadReceipt, handleUploadError, transactionController.uploadReceipt);
app.get('/api/transactions', verifyToken, transactionController.getUserTransactions);
app.get('/api/transactions/:id', verifyToken, transactionController.getTransactionById);
app.get('/api/exchange-rate', verifyToken, transactionController.getExchangeRate);
app.post('/api/transactions/:id/cancel', verifyToken, transactionController.cancelTransaction);

// ==================== ADMIN ROUTES ====================

app.get('/api/admin/transactions', verifyToken, isAdmin, adminController.getAllTransactions);

// 🛑 المسار المضاف لجلب العملات
app.get('/api/admin/currencies', verifyToken, isAdmin, adminController.getAllCurrencies); 

app.post('/api/admin/transactions/:id/approve', verifyToken, isAdmin, adminController.approveTransaction);
app.post('/api/admin/transactions/:id/reject', verifyToken, isAdmin, adminController.rejectTransaction);
app.post('/api/admin/transactions/:id/complete', verifyToken, isAdmin, adminController.completeTransaction);
app.get('/api/admin/dashboard/stats', verifyToken, isAdmin, adminController.getDashboardStats);
app.post('/api/admin/exchange-rates', verifyToken, isAdmin, adminController.updateExchangeRate);

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