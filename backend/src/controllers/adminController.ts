// backend/src/controllers/adminController.ts
import { Response } from 'express';
// تم استيراد Prisma أيضاً للاستخدام مع Decimal
import { PrismaClient, Prisma } from '@prisma/client'; 
import { AuthRequest } from '../middleware/auth';

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

    res.json({
      success: true,
      data: {
        transactions,
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
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'APPROVE_TRANSACTION',
        tableName: 'transactions',
        recordId: parseInt(id),
        details: { transactionRef: transaction.transactionRef, adminNotes }
      }
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

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'REJECT_TRANSACTION',
        tableName: 'transactions',
        recordId: parseInt(id),
        details: { transactionRef: transaction.transactionRef, rejectionReason }
      }
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
      todayTransactions
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
      })
    ]);

    const totalVolume = await prisma.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amountSent: true, adminFee: true }
    });

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
        totalVolume: {
          amountSent: totalVolume._sum.amountSent || 0,
          adminFee: totalVolume._sum.adminFee || 0
        }
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

// Update exchange rate (مع التعديلات النهائية لـ Decimal و updatedBy)
export const updateExchangeRate = async (req: AuthRequest, res: Response) => {
  try {
    const { fromCurrencyCode, toCurrencyCode, rate, adminFeePercent } = req.body;

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

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_EXCHANGE_RATE',
        tableName: 'exchange_rates',
        recordId: updated.id,
        details: { fromCurrencyCode, toCurrencyCode, rate, adminFeePercent }
      }
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