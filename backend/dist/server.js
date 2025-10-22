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
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const auth_1 = require("./middleware/auth");
const upload_1 = require("./middleware/upload");
const transactionController = __importStar(require("./controllers/transactionController"));
const adminController = __importStar(require("./controllers/adminController"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
// Serve uploaded files
app.use('/uploads', express_1.default.static('uploads'));
// ==================== AUTH ROUTES ====================
// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, phone, password, country } = req.body;
        // Validation
        if (!fullName || !email || !phone || !password || !country) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { phone }]
            }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or phone already exists'
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
        // Generate token
        const token = (0, auth_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role
        });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
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
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});
// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        const token = (0, auth_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role
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
                    role: user.role
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});
// Get current user
app.get('/api/auth/me', auth_1.verifyToken, async (req, res) => {
    try {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data'
        });
    }
});
// ==================== TRANSACTION ROUTES ====================
app.post('/api/transactions', auth_1.verifyToken, transactionController.createTransaction);
app.post('/api/transactions/:transactionId/upload', auth_1.verifyToken, upload_1.uploadReceipt, upload_1.handleUploadError, transactionController.uploadReceipt);
app.get('/api/transactions', auth_1.verifyToken, transactionController.getUserTransactions);
app.get('/api/transactions/:id', auth_1.verifyToken, transactionController.getTransactionById);
app.get('/api/exchange-rate', auth_1.verifyToken, transactionController.getExchangeRate);
app.post('/api/transactions/:id/cancel', auth_1.verifyToken, transactionController.cancelTransaction);
// ==================== ADMIN ROUTES ====================
app.get('/api/admin/transactions', auth_1.verifyToken, auth_1.isAdmin, adminController.getAllTransactions);
app.post('/api/admin/transactions/:id/approve', auth_1.verifyToken, auth_1.isAdmin, adminController.approveTransaction);
app.post('/api/admin/transactions/:id/reject', auth_1.verifyToken, auth_1.isAdmin, adminController.rejectTransaction);
app.post('/api/admin/transactions/:id/complete', auth_1.verifyToken, auth_1.isAdmin, adminController.completeTransaction);
app.get('/api/admin/dashboard/stats', auth_1.verifyToken, auth_1.isAdmin, adminController.getDashboardStats);
app.post('/api/admin/exchange-rates', auth_1.verifyToken, auth_1.isAdmin, adminController.updateExchangeRate);
// ==================== NOTIFICATIONS ====================
app.get('/api/notifications', auth_1.verifyToken, async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});
app.post('/api/notifications/:id/read', auth_1.verifyToken, async (req, res) => {
    try {
        await prisma.notification.update({
            where: { id: parseInt(req.params.id) },
            data: { isRead: true }
        });
        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    }
    catch (error) {
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
app.use((err, req, res, next) => {
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
