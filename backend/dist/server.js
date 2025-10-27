"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
// Middleware imports
const auth_1 = require("./middleware/auth");
const upload_1 = require("./middleware/upload");
const errorHandler_1 = require("./middleware/errorHandler");
const security_1 = require("./middleware/security");
const validators_1 = require("./middleware/validators");
// Controllers
const transactionController = __importStar(require("./controllers/transactionController"));
const adminController = __importStar(require("./controllers/adminController"));
// Utils
const logger_1 = __importStar(require("./utils/logger"));
const cache_1 = require("./utils/cache");
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 5000;
// Initialize Redis (optional - app will work without it)
(0, cache_1.initRedis)();
// ==================== MIDDLEWARE ====================
// Security middleware
app.use((0, helmet_1.default)(security_1.securityHeaders));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Compression middleware
app.use((0, compression_1.default)());
// Logging middleware
app.use((0, morgan_1.default)('combined', { stream: logger_1.morganStream }));
// Input sanitization
app.use(security_1.sanitizeInput);
// Serve uploaded files
app.use('/uploads', express_1.default.static('uploads'));
// Apply general rate limiting to all API routes
app.use('/api/', security_1.apiLimiter);
// ==================== AUTH ROUTES ====================
// Register - with strict rate limiting
app.post('/api/auth/register', security_1.authLimiter, validators_1.registerValidation, (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const passwordHash = await bcrypt_1.default.hash(password, 10);
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
    logger_1.default.info(`New user registered: ${user.email}`);
    // Generate token
    const token = (0, auth_1.generateToken)({
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
}));
// Login - with strict rate limiting
app.post('/api/auth/login', security_1.authLimiter, validators_1.loginValidation, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user) {
        logger_1.default.warn(`Failed login attempt for non-existent user: ${email}`);
        return res.status(401).json({
            success: false,
            message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        });
    }
    if (!user.isActive) {
        logger_1.default.warn(`Login attempt for deactivated account: ${email}`);
        return res.status(403).json({
            success: false,
            message: 'الحساب معطل'
        });
    }
    const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        logger_1.default.warn(`Failed login attempt with wrong password: ${email}`);
        return res.status(401).json({
            success: false,
            message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        });
    }
    logger_1.default.info(`User logged in: ${user.email}`);
    const token = (0, auth_1.generateToken)({
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
}));
// Get current user
app.get('/api/auth/me', auth_1.verifyToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
}));
// ==================== TRANSACTION ROUTES ====================
app.post('/api/transactions', auth_1.verifyToken, validators_1.createTransactionValidation, transactionController.createTransaction);
app.post('/api/transactions/:transactionId/upload', auth_1.verifyToken, security_1.uploadLimiter, upload_1.uploadReceipt, upload_1.handleUploadError, transactionController.uploadReceipt);
app.get('/api/transactions', auth_1.verifyToken, validators_1.paginationValidation, transactionController.getUserTransactions);
app.get('/api/transactions/:id', auth_1.verifyToken, validators_1.transactionIdValidation, transactionController.getTransactionById);
// Cache exchange rates for 5 minutes
app.get('/api/exchange-rate', auth_1.verifyToken, validators_1.exchangeRateValidation, (0, cache_1.cacheMiddleware)(300), transactionController.getExchangeRate);
app.post('/api/transactions/:id/cancel', auth_1.verifyToken, validators_1.transactionIdValidation, transactionController.cancelTransaction);
// ==================== ADMIN ROUTES ====================
app.get('/api/admin/transactions', auth_1.verifyToken, auth_1.isAdmin, security_1.adminLimiter, validators_1.paginationValidation, adminController.getAllTransactions);
// Cache currencies for 10 minutes
app.get('/api/admin/currencies', auth_1.verifyToken, auth_1.isAdmin, security_1.adminLimiter, (0, cache_1.cacheMiddleware)(600), adminController.getAllCurrencies);
app.post('/api/admin/transactions/:id/approve', auth_1.verifyToken, auth_1.isAdmin, security_1.adminLimiter, validators_1.approveTransactionValidation, adminController.approveTransaction);
app.post('/api/admin/transactions/:id/reject', auth_1.verifyToken, auth_1.isAdmin, security_1.adminLimiter, validators_1.rejectTransactionValidation, adminController.rejectTransaction);
app.post('/api/admin/transactions/:id/complete', auth_1.verifyToken, auth_1.isAdmin, security_1.adminLimiter, validators_1.transactionIdValidation, adminController.completeTransaction);
// Cache dashboard stats for 2 minutes
app.get('/api/admin/dashboard/stats', auth_1.verifyToken, auth_1.isAdmin, security_1.adminLimiter, (0, cache_1.cacheMiddleware)(120), adminController.getDashboardStats);
app.post('/api/admin/exchange-rates', auth_1.verifyToken, auth_1.isAdmin, security_1.adminLimiter, validators_1.updateExchangeRateValidation, adminController.updateExchangeRate);
// ==================== NOTIFICATIONS ====================
app.get('/api/notifications', auth_1.verifyToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20
    });
    res.json({
        success: true,
        data: notifications
    });
}));
app.post('/api/notifications/:id/read', auth_1.verifyToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await prisma.notification.update({
        where: { id: parseInt(req.params.id) },
        data: { isRead: true }
    });
    res.json({
        success: true,
        message: 'تم تحديث الإشعار'
    });
}));
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
app.use(errorHandler_1.notFoundHandler);
// Global error handler
app.use(errorHandler_1.errorHandler);
// ==================== START SERVER ====================
const server = app.listen(PORT, () => {
    logger_1.default.info(`🚀 Server is running on port ${PORT}`);
    logger_1.default.info(`📡 API: http://localhost:${PORT}/api`);
    logger_1.default.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
// ==================== GRACEFUL SHUTDOWN ====================
const gracefulShutdown = async (signal) => {
    logger_1.default.info(`${signal} received. Starting graceful shutdown...`);
    // Stop accepting new connections
    server.close(async () => {
        logger_1.default.info('HTTP server closed');
        // Close database connection
        await prisma.$disconnect();
        logger_1.default.info('Database connection closed');
        // Close Redis connection
        await (0, cache_1.closeRedis)();
        logger_1.default.info('Graceful shutdown completed');
        process.exit(0);
    });
    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger_1.default.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});
exports.default = app;
