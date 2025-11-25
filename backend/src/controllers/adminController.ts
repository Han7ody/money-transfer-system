// backend/src/controllers/adminController.ts
import { Response } from 'express';
// تم استيراد Prisma أيضاً للاستخدام مع Decimal
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import emailService from '../services/emailService';
import { logAdminAction, AuditActions, AuditEntities } from '../utils/auditLogger';

const prisma = new PrismaClient();

// Get all transactions for admin review
export const getAllTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { transactionRef: { contains: search as string, mode: 'insensitive' } },
        { senderName: { contains: search as string, mode: 'insensitive' } },
        { recipientName: { contains: search as string, mode: 'insensitive' } },
        { senderPhone: { contains: search as string } },
        { recipientPhone: { contains: search as string } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          fromCurrency: true,
          toCurrency: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.transaction.count({ where })
    ]);

    // Transform receiptFilePath to receiptUrl
    const transactionsWithUrl = transactions.map(tx => ({
      ...tx,
      receiptUrl: tx.receiptFilePath
        ? `${req.protocol}://${req.get('host')}/uploads/receipts/${tx.receiptFilePath.split(/[/\\]/).pop()}`
        : null
    }));

    res.json({
      success: true,
      data: {
        transactions: transactionsWithUrl,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
};

// 🟢 الدالة المضافة: جلب جميع العملات للمسؤول
export const getAllCurrencies = async (req: AuthRequest, res: Response) => {
  try {
    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });

    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currencies'
    });
  }
};

// Get single transaction by ID for admin
export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        fromCurrency: true,
        toCurrency: true
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Transform receiptFilePath to receiptUrl
    const transactionWithUrl = {
      ...transaction,
      receiptUrl: transaction.receiptFilePath
        ? `${req.protocol}://${req.get('host')}/uploads/receipts/${transaction.receiptFilePath.split(/[/\\]/).pop()}`
        : null
    };

    res.json({
      success: true,
      data: transactionWithUrl
    });
  } catch (error) {
    console.error('Get transaction by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction'
    });
  }
};

// Approve transaction
export const approveTransaction = async (req: AuthRequest, res: Response) => {
  console.log('approveTransaction request params:', req.params);
  console.log('approveTransaction request body:', req.body);
  try {
    const { id } = req.params;
    const { paymentMethod, paymentReference, adminNotes } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'UNDER_REVIEW') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is not under review'
      });
    }

    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
        adminNotes,
        paymentMethod,
        paymentReference
      }
    });

    // Create history
    await prisma.transactionHistory.create({
      data: {
        transactionId: parseInt(id),
        oldStatus: transaction.status,
        newStatus: 'APPROVED',
        changedBy: req.user!.id,
        notes: adminNotes || 'Transaction approved by admin'
      }
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: transaction.userId,
        transactionId: parseInt(id),
        title: 'Transaction Approved',
        message: `Your transaction ${transaction.transactionRef} has been approved and is being processed.`
      }
    });

    // Log action
    await logAdminAction({
      adminId: req.user!.id,
      action: AuditActions.APPROVE_TRANSACTION,
      entity: AuditEntities.TRANSACTION,
      entityId: String(updated.id),
      newValue: { transactionRef: transaction.transactionRef, adminNotes },
      req
    });

    res.json({
      success: true,
      message: 'Transaction approved successfully',
      data: updated
    });
  } catch (error) {
    console.error('Approve transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve transaction'
    });
  }
};

// Reject transaction
export const rejectTransaction = async (req: AuthRequest, res: Response) => {
  console.log('rejectTransaction request params:', req.params);
  console.log('rejectTransaction request body:', req.body);
  try {
    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'UNDER_REVIEW') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is not under review'
      });
    }

    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
        rejectionReason,
        adminNotes
      }
    });

    await prisma.transactionHistory.create({
      data: {
        transactionId: parseInt(id),
        oldStatus: transaction.status,
        newStatus: 'REJECTED',
        changedBy: req.user!.id,
        notes: `Rejected: ${rejectionReason}`
      }
    });

    await prisma.notification.create({
      data: {
        userId: transaction.userId,
        transactionId: parseInt(id),
        title: 'Transaction Rejected',
        message: `Your transaction ${transaction.transactionRef} has been rejected. Reason: ${rejectionReason}`
      }
    });

    await logAdminAction({
      adminId: req.user!.id,
      action: AuditActions.REJECT_TRANSACTION,
      entity: AuditEntities.TRANSACTION,
      entityId: String(updated.id),
      newValue: { transactionRef: transaction.transactionRef, rejectionReason },
      req
    });

    res.json({
      success: true,
      message: 'Transaction rejected',
      data: updated
    });
  } catch (error) {
    console.error('Reject transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject transaction'
    });
  }
};

// Mark transaction as completed
export const completeTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Transaction must be approved first'
      });
    }

    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        adminNotes: adminNotes || transaction.adminNotes
      }
    });

    await prisma.transactionHistory.create({
      data: {
        transactionId: parseInt(id),
        oldStatus: transaction.status,
        newStatus: 'COMPLETED',
        changedBy: req.user!.id,
        notes: 'Transaction completed - funds transferred to recipient'
      }
    });

    await prisma.notification.create({
      data: {
        userId: transaction.userId,
        transactionId: parseInt(id),
        title: 'Transaction Completed',
        message: `Your transaction ${transaction.transactionRef} has been completed successfully. The recipient should receive the funds shortly.`
      }
    });

    // Get user and currency details for email
    const user = await prisma.user.findUnique({ where: { id: transaction.userId } });
    const fromCurrency = await prisma.currency.findUnique({ where: { id: transaction.fromCurrencyId } });
    const toCurrency = await prisma.currency.findUnique({ where: { id: transaction.toCurrencyId } });

    if (user) {
      await emailService.sendTransactionCompletedEmail(user.email, {
        name: user.fullName,
        transaction_id: transaction.transactionRef,
        amount_sent: transaction.amountSent.toString(),
        from_currency: fromCurrency?.code || 'SDG',
        amount_received: transaction.amountReceived.toString(),
        to_currency: toCurrency?.code || 'USD',
        recipient_name: transaction.recipientName,
        completion_date: new Date().toLocaleDateString('ar-SA')
      });
    }

    res.json({
      success: true,
      message: 'Transaction marked as completed',
      data: updated
    });
  } catch (error) {
    console.error('Complete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete transaction'
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalTransactions,
      pendingCount,
      underReviewCount,
      approvedCount,
      completedCount,
      rejectedCount,
      totalUsers,
      todayTransactions,
      pendingKycCount
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'PENDING' } }),
      prisma.transaction.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.transaction.count({ where: { status: 'APPROVED' } }),
      prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      prisma.transaction.count({ where: { status: 'REJECTED' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.transaction.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.user.count({ where: { kycStatus: 'PENDING' } })
    ]);

    const totalVolume = await prisma.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amountSent: true, adminFee: true }
    });

    // Get weekly chart data (last 7 days)
    const weeklyData = [];
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const [dayTransactions, dayVolume] = await Promise.all([
        prisma.transaction.count({
          where: {
            createdAt: { gte: startOfDay, lte: endOfDay }
          }
        }),
        prisma.transaction.aggregate({
          where: {
            createdAt: { gte: startOfDay, lte: endOfDay },
            status: { in: ['COMPLETED', 'APPROVED', 'UNDER_REVIEW'] }
          },
          _sum: { amountSent: true }
        })
      ]);

      weeklyData.push({
        name: dayNames[startOfDay.getDay()],
        transactions: dayTransactions,
        volume: Number(dayVolume._sum.amountSent || 0)
      });
    }

    res.json({
      success: true,
      data: {
        totalTransactions,
        pendingCount,
        underReviewCount,
        approvedCount,
        completedCount,
        rejectedCount,
        totalUsers,
        todayTransactions,
        pendingKycCount,
        totalVolume: {
          amountSent: totalVolume._sum.amountSent || 0,
          adminFee: totalVolume._sum.adminFee || 0
        },
        weeklyChartData: weeklyData
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};

// Get all exchange rates
export const getExchangeRates = async (req: AuthRequest, res: Response) => {
  try {
    const rates = await prisma.exchangeRate.findMany({
      include: {
        fromCurrency: { select: { code: true, name: true } },
        toCurrency: { select: { code: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: rates.map(rate => ({
        id: rate.id,
        fromCurrency: rate.fromCurrency.code,
        toCurrency: rate.toCurrency.code,
        rate: Number(rate.rate),
        adminFeePercent: Number(rate.adminFeePercent),
        updatedAt: rate.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rates'
    });
  }
};

// Update exchange rate with password verification
export const updateExchangeRate = async (req: AuthRequest, res: Response) => {
  try {
    const { fromCurrency: fromCurrencyCode, toCurrency: toCurrencyCode, rate, adminFeePercent, password } = req.body;

    // Verify admin password
    const admin = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const bcrypt = require('bcrypt');
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'كلمة المرور غير صحيحة'
      });
    }

    const fromCurrency = await prisma.currency.findUnique({
      where: { code: fromCurrencyCode }
    });

    const toCurrency = await prisma.currency.findUnique({
      where: { code: toCurrencyCode }
    });

    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency codes'
      });
    }

    // Get old value for audit log
    const existingRate = await prisma.exchangeRate.findUnique({
      where: {
        fromCurrencyId_toCurrencyId: {
          fromCurrencyId: fromCurrency.id,
          toCurrencyId: toCurrency.id
        }
      }
    });

    const updated = await prisma.exchangeRate.upsert({
      where: {
        fromCurrencyId_toCurrencyId: {
          fromCurrencyId: fromCurrency.id,
          toCurrencyId: toCurrency.id
        }
      },
      update: {
        rate: new Prisma.Decimal(rate),
        adminFeePercent: new Prisma.Decimal(adminFeePercent),
        updatedBy: req.user!.id
      },
      create: {
        fromCurrencyId: fromCurrency.id,
        toCurrencyId: toCurrency.id,
        rate: new Prisma.Decimal(rate),
        adminFeePercent: new Prisma.Decimal(adminFeePercent),
        updatedBy: req.user!.id
      }
    });

    // Log the action
    await logAdminAction({
      adminId: req.user!.id,
      action: existingRate ? AuditActions.UPDATE_EXCHANGE_RATE : AuditActions.CREATE_EXCHANGE_RATE,
      entity: AuditEntities.EXCHANGE_RATES,
      entityId: String(updated.id),
      oldValue: existingRate ? {
        fromCurrency: fromCurrencyCode,
        toCurrency: toCurrencyCode,
        rate: existingRate.rate.toString(),
        adminFeePercent: existingRate.adminFeePercent.toString()
      } : null,
      newValue: {
        fromCurrency: fromCurrencyCode,
        toCurrency: toCurrencyCode,
        rate: rate.toString(),
        adminFeePercent: adminFeePercent.toString()
      },
      req
    });

    res.json({
      success: true,
      message: 'Exchange rate updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update exchange rate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update exchange rate'
    });
  }
};

// Get all users for admin
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, page = 1, limit = 20, status } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } }
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'blocked') {
      where.isActive = false;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          country: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              transactions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Block/Unblock user
export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot block/unblock admin users'
      });
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive }
    });

    await logAdminAction({
      adminId: req.user!.id,
      action: isActive ? 'UNBLOCK_USER' : 'BLOCK_USER',
      entity: AuditEntities.USER,
      entityId: String(updated.id),
      oldValue: { isActive: user.isActive },
      newValue: { isActive: updated.isActive },
      req
    });

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId: parseInt(id),
        title: isActive ? 'Account Activated' : 'Account Blocked',
        message: isActive
          ? 'Your account has been activated. You can now use all features.'
          : 'Your account has been blocked. Please contact support for more information.'
      }
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'blocked'} successfully`,
      data: updated
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

// Get single user by ID with stats
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        country: true,
        role: true,
        isActive: true,
        isVerified: true,
        kycStatus: true,
        kycSubmittedAt: true,
        kycDocuments: {
          select: {
            id: true,
            type: true,
            filePath: true,
            status: true,
            rejectionReason: true,
            uploadedAt: true
          }
        },
        createdAt: true,
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const [totalAmount, completedCount, rejectedCount, lastTransaction] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: parseInt(id), status: 'COMPLETED' },
        _sum: { amountSent: true }
      }),
      prisma.transaction.count({
        where: { userId: parseInt(id), status: 'COMPLETED' }
      }),
      prisma.transaction.count({
        where: { userId: parseInt(id), status: 'REJECTED' }
      }),
      prisma.transaction.findFirst({
        where: { userId: parseInt(id) },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
    ]);

    const totalTransactions = user._count.transactions;
    const rejectionRatio = totalTransactions > 0
      ? Math.round((rejectedCount / totalTransactions) * 100)
      : 0;

    // Determine fraud risk based on rejection ratio
    let fraudRisk: 'low' | 'medium' | 'high' = 'low';
    if (rejectionRatio > 30) fraudRisk = 'high';
    else if (rejectionRatio > 15) fraudRisk = 'medium';

    // Get audit log for this user
    const auditLog = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityId: id, entity: AuditEntities.USER },
          { adminId: parseInt(id) }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        admin: {
          select: { fullName: true, role: true }
        }
      }
    });

    // Map KYC status
    let kycStatusMapped = 'pending';
    if (user.kycStatus === 'APPROVED') kycStatusMapped = 'verified';
    else if (user.kycStatus === 'REJECTED') kycStatusMapped = 'rejected';
    else if (user.kycStatus === 'PENDING') kycStatusMapped = 'pending';
    else if (user.kycStatus === 'NOT_SUBMITTED') kycStatusMapped = 'not_submitted';

    // Map KYC documents
    const kycDocuments = user.kycDocuments.map(doc => ({
      id: doc.id.toString(),
      type: doc.type as 'id_front' | 'id_back' | 'selfie',
      uploadDate: doc.uploadedAt.toISOString(),
      status: doc.status as 'approved' | 'pending' | 'rejected',
      url: `/uploads/kyc/${doc.filePath}`,
      rejectionReason: doc.rejectionReason || undefined
    }));

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          status: user.isActive ? 'active' : 'blocked',
          kycStatus: kycStatusMapped,
          tier: rejectionRatio > 30 ? 'high_risk' : totalTransactions > 50 ? 'vip' : 'regular'
        },
        stats: {
          totalTransactions,
          totalAmount: totalAmount._sum.amountSent || 0,
          lastTransactionDate: lastTransaction?.createdAt || null,
          rejectionRatio,
          fraudRisk
        },
        kycDocuments,
        auditLog: auditLog.map(log => {
          const detailsObject: any = {};
          if (log.oldValue) detailsObject.oldValue = log.oldValue;
          if (log.newValue) detailsObject.newValue = log.newValue;
          const details = Object.keys(detailsObject).length > 0 ? JSON.stringify(detailsObject) : null;
          
          return {
            id: log.id.toString(),
            action: log.action,
            type: log.admin?.role === 'ADMIN' ? 'admin' : 'user',
            timestamp: log.createdAt.toISOString(),
            details: details
          };
        })
      }
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

// Get user's transactions
export const getUserTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const orderBy: any = {};
    orderBy[sortField as string] = sortOrder;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: parseInt(id) },
        include: {
          fromCurrency: { select: { code: true } },
          toCurrency: { select: { code: true } }
        },
        orderBy,
        skip,
        take: parseInt(limit as string)
      }),
      prisma.transaction.count({ where: { userId: parseInt(id) } })
    ]);

    res.json({
      success: true,
      data: {
        transactions: transactions.map(tx => ({
          id: tx.id.toString(),
          transactionRef: tx.transactionRef,
          amountSent: Number(tx.amountSent),
          amountReceived: Number(tx.amountReceived),
          fromCurrency: tx.fromCurrency?.code || 'SDG',
          toCurrency: tx.toCurrency?.code || 'INR',
          status: tx.status,
          createdAt: tx.createdAt.toISOString()
        })),
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user transactions'
    });
  }
};

// Approve KYC document
export const approveKycDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { docId } = req.params;

    const document = await prisma.kycDocument.update({
      where: { id: parseInt(docId) },
      data: {
        status: 'approved',
        reviewedAt: new Date()
      }
    });

    // Check if all documents are approved, then update user KYC status
    const userDocs = await prisma.kycDocument.findMany({
      where: { userId: document.userId }
    });

    const allApproved = userDocs.every(doc => doc.status === 'approved');
    if (allApproved) {
      const user = await prisma.user.update({
        where: { id: document.userId },
        data: {
          kycStatus: 'APPROVED',
          kycReviewedAt: new Date(),
          kycReviewedBy: req.user!.id
        }
      });

      // Send KYC approved email
      await emailService.sendKycApprovedEmail(user.email, user.fullName);
    }

    // Create audit log
    await logAdminAction({
      adminId: req.user!.id,
      action: AuditActions.APPROVE_KYC,
      entity: 'KycDocument',
      entityId: String(document.id),
      newValue: { documentType: document.type, userId: document.userId, status: 'APPROVED' },
      req
    });

    res.json({
      success: true,
      message: 'Document approved successfully',
      data: { document, kycFullyApproved: allApproved }
    });
  } catch (error) {
    console.error('Approve KYC document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve document'
    });
  }
};

// Reject KYC document
export const rejectKycDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { docId } = req.params;
    const { reason } = req.body;

    const document = await prisma.kycDocument.update({
      where: { id: parseInt(docId) },
      data: {
        status: 'rejected',
        rejectionReason: reason,
        reviewedAt: new Date()
      }
    });

    // Update user KYC status to rejected
    const user = await prisma.user.update({
      where: { id: document.userId },
      data: {
        kycStatus: 'REJECTED',
        kycReviewedAt: new Date(),
        kycReviewedBy: req.user!.id
      }
    });

    // Send KYC rejected email
    await emailService.sendKycRejectedEmail(user.email, user.fullName, reason);

    // Create audit log
    await logAdminAction({
      adminId: req.user!.id,
      action: AuditActions.REJECT_KYC,
      entity: 'KycDocument',
      entityId: String(document.id),
      newValue: { documentType: document.type, userId: document.userId, reason, status: 'REJECTED' },
      req
    });

    res.json({
      success: true,
      message: 'Document rejected',
      data: { document }
    });
  } catch (error) {
    console.error('Reject KYC document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject document'
    });
  }
};

// Get admin notifications (aggregated from various sources)
export const getAdminNotifications = async (req: AuthRequest, res: Response) => {
  try {
    // Get pending transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { fullName: true } } }
    });

    // Get transactions with uploaded receipts (under review)
    const receiptsPending = await prisma.transaction.findMany({
      where: { status: 'UNDER_REVIEW' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { fullName: true } } }
    });

    // Get pending KYC
    const pendingKyc = await prisma.user.findMany({
      where: { kycStatus: 'PENDING' },
      orderBy: { kycSubmittedAt: 'desc' },
      take: 5,
      select: { id: true, fullName: true, kycSubmittedAt: true }
    });

    // Get completed transactions (last 24h)
    const completedTransactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
      include: { user: { select: { fullName: true } } }
    });

    // Get newly verified users (last 24h)
    const verifiedUsers = await prisma.user.findMany({
      where: {
        kycStatus: 'APPROVED',
        kycReviewedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { kycReviewedAt: 'desc' },
      take: 5,
      select: { id: true, fullName: true, kycReviewedAt: true }
    });

    // Build notifications array
    const notifications = [
      // High priority - pending transactions
      ...pendingTransactions.map(tx => ({
        id: `tx-${tx.id}`,
        category: 'pending_transaction',
        priority: 'high',
        title: 'معاملة جديدة بانتظار الموافقة',
        description: `تحويل بقيمة ${tx.amountSent} من ${tx.user.fullName}`,
        timestamp: tx.createdAt,
        isRead: false,
        link: '/admin/transactions'
      })),

      // High priority - receipts pending
      ...receiptsPending.map(tx => ({
        id: `receipt-${tx.id}`,
        category: 'pending_receipt',
        priority: 'high',
        title: 'إيصال جديد بانتظار المراجعة',
        description: `تم رفع إيصال للمعاملة ${tx.transactionRef}`,
        timestamp: tx.updatedAt,
        isRead: false,
        link: '/admin/transactions'
      })),

      // High priority - pending KYC
      ...pendingKyc.map(user => ({
        id: `kyc-${user.id}`,
        category: 'pending_kyc',
        priority: 'high',
        title: 'طلب KYC جديد',
        description: `${user.fullName} ينتظر التحقق من الهوية`,
        timestamp: user.kycSubmittedAt,
        isRead: false,
        link: `/admin/users/${user.id}`
      })),

      // Normal - completed transfers
      ...completedTransactions.map(tx => ({
        id: `completed-${tx.id}`,
        category: 'completed_transfer',
        priority: 'normal',
        title: 'تحويل مكتمل',
        description: `تم إتمام التحويل ${tx.transactionRef} بنجاح`,
        timestamp: tx.completedAt,
        isRead: true,
        link: '/admin/transactions'
      })),

      // Normal - verified users
      ...verifiedUsers.map(user => ({
        id: `verified-${user.id}`,
        category: 'verified_user',
        priority: 'normal',
        title: 'مستخدم جديد موثق',
        description: `تم التحقق من حساب ${user.fullName}`,
        timestamp: user.kycReviewedAt,
        isRead: true,
        link: `/admin/users/${user.id}`
      }))
    ];

    // Sort by timestamp
    notifications.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read (for future use with persistent notifications)
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    // For now, just return success - in production you'd track read state
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// Get admin profile
export const getAdminProfile = async (req: AuthRequest, res: Response) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile'
    });
  }
};

// Get audit logs with filtering and pagination
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      entity,
      adminId,
      startDate,
      endDate,
      search
    } = req.query;

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    if (adminId) {
      where.adminId = parseInt(adminId as string);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: 'insensitive' } },
        { entity: { contains: search as string, mode: 'insensitive' } },
        { admin: { email: { contains: search as string, mode: 'insensitive' } } },
        { admin: { fullName: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  }
};

// Get audit log by ID
export const getAuditLogById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id: parseInt(id) },
      include: {
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Get audit log by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log'
    });
  }
};

// Get audit log statistics
export const getAuditLogStats = async (req: AuthRequest, res: Response) => {
  try {
    const [actionCounts, entityCounts, recentActivity] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      prisma.auditLog.groupBy({
        by: ['entity'],
        _count: { entity: true },
        orderBy: { _count: { entity: 'desc' } }
      }),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        actionCounts,
        entityCounts,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get audit log stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log statistics'
    });
  }
};