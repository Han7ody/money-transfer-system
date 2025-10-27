// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

// Middleware imports
import { verifyToken, isAdmin, generateToken } from './middleware/auth';
import { uploadReceipt, handleUploadError } from './middleware/upload';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler';
import {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  adminLimiter,
  sanitizeInput,
  securityHeaders
} from './middleware/security';
import {
  registerValidation,
  loginValidation,
  createTransactionValidation,
  exchangeRateValidation,
  transactionIdValidation,
  approveTransactionValidation,
  rejectTransactionValidation,
  updateExchangeRateValidation,
  paginationValidation,
} from './middleware/validators';

// Controllers
import * as transactionController from './controllers/transactionController';
import * as adminController from './controllers/adminController';

// Utils
import logger, { morganStream } from './utils/logger';
import { initRedis, closeRedis, cacheMiddleware } from './utils/cache';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Initialize Redis (optional - app will work without it)
initRedis();

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet(securityHeaders));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: morganStream }));

// Input sanitization
app.use(sanitizeInput);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// ==================== AUTH ROUTES ====================

// Register - with strict rate limiting
app.post('/api/auth/register',
  authLimiter,
  registerValidation,
  asyncHandler(async (req: any, res: any) => {
    const { fullName, email, phone, password, country } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'المستخدم موجود مسبقاً بهذا البريد الإلكتروني أو رقم الهاتف'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        country,
        role: 'USER'
      }
    });

    logger.info(`New user registered: ${user.email}`);

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'تم التسجيل بنجاح',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  })
);

// Login - with strict rate limiting
app.post('/api/auth/login',
  authLimiter,
  loginValidation,
  asyncHandler(async (req: any, res: any) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      logger.warn(`Failed login attempt for non-existent user: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    if (!user.isActive) {
      logger.warn(`Login attempt for deactivated account: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'الحساب معطل'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      logger.warn(`Failed login attempt with wrong password: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    logger.info(`User logged in: ${user.email}`);

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  })
);

// Get current user
app.get('/api/auth/me',
  verifyToken,
  asyncHandler(async (req: any, res: any) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        country: true,
        isVerified: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  })
);

// ==================== TRANSACTION ROUTES ====================

app.post('/api/transactions',
  verifyToken,
  createTransactionValidation,
  transactionController.createTransaction
);

app.post('/api/transactions/:transactionId/upload',
  verifyToken,
  uploadLimiter,
  uploadReceipt,
  handleUploadError,
  transactionController.uploadReceipt
);

app.get('/api/transactions',
  verifyToken,
  paginationValidation,
  transactionController.getUserTransactions
);

app.get('/api/transactions/:id',
  verifyToken,
  transactionIdValidation,
  transactionController.getTransactionById
);

// Cache exchange rates for 5 minutes
app.get('/api/exchange-rate',
  verifyToken,
  exchangeRateValidation,
  cacheMiddleware(300),
  transactionController.getExchangeRate
);

app.post('/api/transactions/:id/cancel',
  verifyToken,
  transactionIdValidation,
  transactionController.cancelTransaction
);

// ==================== ADMIN ROUTES ====================

app.get('/api/admin/transactions',
  verifyToken,
  isAdmin,
  adminLimiter,
  paginationValidation,
  adminController.getAllTransactions
);

// Cache currencies for 10 minutes
app.get('/api/admin/currencies',
  verifyToken,
  isAdmin,
  adminLimiter,
  cacheMiddleware(600),
  adminController.getAllCurrencies
);

app.post('/api/admin/transactions/:id/approve',
  verifyToken,
  isAdmin,
  adminLimiter,
  approveTransactionValidation,
  adminController.approveTransaction
);

app.post('/api/admin/transactions/:id/reject',
  verifyToken,
  isAdmin,
  adminLimiter,
  rejectTransactionValidation,
  adminController.rejectTransaction
);

app.post('/api/admin/transactions/:id/complete',
  verifyToken,
  isAdmin,
  adminLimiter,
  transactionIdValidation,
  adminController.completeTransaction
);

// Cache dashboard stats for 2 minutes
app.get('/api/admin/dashboard/stats',
  verifyToken,
  isAdmin,
  adminLimiter,
  cacheMiddleware(120),
  adminController.getDashboardStats
);

app.post('/api/admin/exchange-rates',
  verifyToken,
  isAdmin,
  adminLimiter,
  updateExchangeRateValidation,
  adminController.updateExchangeRate
);

// ==================== NOTIFICATIONS ====================

app.get('/api/notifications',
  verifyToken,
  asyncHandler(async (req: any, res: any) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      success: true,
      data: notifications
    });
  })
);

app.post('/api/notifications/:id/read',
  verifyToken,
  asyncHandler(async (req: any, res: any) => {
    await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'تم تحديث الإشعار'
    });
  })
);

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'الخادم يعمل بنجاح',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== ERROR HANDLERS ====================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ==================== START SERVER ====================

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`📡 API: http://localhost:${PORT}/api`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ==================== GRACEFUL SHUTDOWN ====================

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    // Close database connection
    await prisma.$disconnect();
    logger.info('Database connection closed');

    // Close Redis connection
    await closeRedis();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default app;
