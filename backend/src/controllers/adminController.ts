// backend/src/controllers/adminController.ts
import { Response } from 'express';
// تم استيراد Prisma أيضاً للاستخدام مع Decimal
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import emailService from '../services/emailService';
import { logAdminAction, AuditActions, AuditEntities } from '../utils/auditLogger';
import { eventEmitter } from '../events/eventEmitter';
import { EventType } from '../events/eventTypes';

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

    // ✅ CHECK APPROVAL LIMITS
    const { approvalService } = await import('../services/ApprovalService');
    const canApproveCheck = await approvalService.canApprove(req.user!.id, parseInt(id));
    
    if (!canApproveCheck.canApprove) {
      return res.status(403).json({
        success: false,
        message: canApproveCheck.reason || 'You do not have permission to approve this transaction'
      });
    }

    // ✅ CHECK MAKER-CHECKER REQUIREMENTS
    const approvalStatus = await approvalService.getApprovalStatus(parseInt(id));
    
    if (approvalStatus.requiresDual) {
      if (!approvalStatus.firstApprover) {
        // This is the first approval
        await approvalService.recordFirstApproval(parseInt(id), req.user!.id);
        
        return res.json({
          success: true,
          message: 'First approval recorded. Awaiting second approval.',
          data: {
            ...transaction,
            approvalStatus: 'FIRST_APPROVAL_PENDING_SECOND'
          }
        });
      } else if (!approvalStatus.secondApprover) {
        // This is the second approval
        const secondApprovalResult = await approvalService.recordSecondApproval(parseInt(id), req.user!.id);
        
        if (!secondApprovalResult.success) {
          return res.status(403).json({
            success: false,
            message: secondApprovalResult.reason || 'Cannot record second approval'
          });
        }
        // Continue with actual approval below
      }
    } else {
      // Single approval sufficient
      await approvalService.recordFirstApproval(parseInt(id), req.user!.id);
    }

    // ✅ USE STATE MACHINE VALIDATION
    const { transactionStateMachine } = await import('../services/stateMachine/TransactionStateMachine');
    const validation = await transactionStateMachine.validateTransition(
      transaction.status as any,
      'APPROVED',
      {
        userId: req.user!.id.toString(),
        reason: adminNotes || 'Transaction approved by admin'
      }
    );

    if (!validation.valid) {
      console.log('[StateMachine] Transition denied:', validation.reason);
      return res.status(400).json({
        success: false,
        message: validation.reason || 'Invalid state transition',
        debug: {
          from: transaction.status,
          to: 'APPROVED',
          reason: validation.reason
        }
      });
    }

    // Execute state transition
    await transactionStateMachine.executeTransition(
      transaction.status as any,
      'APPROVED',
      {
        userId: req.user!.id.toString(),
        reason: adminNotes || 'Transaction approved by admin',
        metadata: { paymentMethod, paymentReference }
      }
    );

    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
        adminNotes,
        paymentMethod,
        paymentReference
      },
      include: {
        user: { select: { fullName: true } }
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

    // Emit event for notifications
    const adminUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { fullName: true }
    });
    
    eventEmitter.emitEvent(EventType.TRANSACTION_APPROVED, {
      transactionId: updated.id,
      transactionRef: transaction.transactionRef,
      userId: transaction.userId,
      approvedBy: req.user!.id,
      approvedByName: adminUser?.fullName || 'Admin'
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

    // ✅ Check for escalation requirements
    const { escalationService } = await import('../services/EscalationService');
    const escalationCheck = await escalationService.checkEscalation(parseInt(id));
    
    if (escalationCheck.needsEscalation) {
      await escalationService.escalateTransaction(
        parseInt(id),
        escalationCheck.reasons,
        req.user!.id,
        escalationCheck.escalateTo || 'SUPER_ADMIN'
      );
    }

    res.json({
      success: true,
      message: 'Transaction approved successfully',
      data: {
        ...updated,
        escalation: escalationCheck.needsEscalation ? {
          escalated: true,
          reasons: escalationCheck.reasons,
          escalateTo: escalationCheck.escalateTo
        } : null
      }
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

    // ✅ USE STATE MACHINE VALIDATION
    const { transactionStateMachine } = await import('../services/stateMachine/TransactionStateMachine');
    const validation = await transactionStateMachine.validateTransition(
      transaction.status as any,
      'REJECTED',
      {
        userId: req.user!.id.toString(),
        reason: rejectionReason
      }
    );

    if (!validation.valid) {
      console.log('[StateMachine] Transition denied:', validation.reason);
      return res.status(400).json({
        success: false,
        message: validation.reason || 'Invalid state transition',
        debug: {
          from: transaction.status,
          to: 'REJECTED',
          reason: validation.reason
        }
      });
    }

    // Execute state transition
    await transactionStateMachine.executeTransition(
      transaction.status as any,
      'REJECTED',
      {
        userId: req.user!.id.toString(),
        reason: rejectionReason,
        metadata: { adminNotes }
      }
    );

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

    // Emit event for notifications
    const adminUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { fullName: true }
    });
    
    eventEmitter.emitEvent(EventType.TRANSACTION_REJECTED, {
      transactionId: updated.id,
      transactionRef: transaction.transactionRef,
      userId: transaction.userId,
      rejectedBy: req.user!.id,
      rejectedByName: adminUser?.fullName || 'Admin',
      reason: rejectionReason
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

    // ✅ USE STATE MACHINE VALIDATION
    const { transactionStateMachine } = await import('../services/stateMachine/TransactionStateMachine');
    const validation = await transactionStateMachine.validateTransition(
      transaction.status as any,
      'COMPLETED',
      {
        userId: req.user!.id.toString(),
        reason: adminNotes || 'Transaction completed by admin'
      }
    );

    if (!validation.valid) {
      console.log('[StateMachine] Transition denied:', validation.reason);
      return res.status(400).json({
        success: false,
        message: validation.reason || 'Invalid state transition'
      });
    }

    // Execute state transition
    await transactionStateMachine.executeTransition(
      transaction.status as any,
      'COMPLETED',
      {
        userId: req.user!.id.toString(),
        reason: adminNotes || 'Transaction completed by admin'
      }
    );

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
        notes: adminNotes || 'Transaction completed - funds transferred to recipient'
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

    // Log action
    await logAdminAction({
      adminId: req.user!.id,
      action: AuditActions.COMPLETE_TRANSACTION,
      entity: AuditEntities.TRANSACTION,
      entityId: String(updated.id),
      newValue: { transactionRef: transaction.transactionRef, adminNotes },
      req
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

    // Validate required fields
    if (!fromCurrencyCode || !toCurrencyCode || !rate || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fromCurrency, toCurrency, rate, password'
      });
    }

    // Validate rate is positive
    if (rate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Exchange rate must be greater than 0'
      });
    }

    // Validate admin fee if provided
    if (adminFeePercent !== undefined && (adminFeePercent < 0 || adminFeePercent > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Admin fee must be between 0 and 100'
      });
    }

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
    const { isActive, reason } = req.body;

    // ✅ ENFORCE REASON FOR BLOCKING
    if (!isActive && (!reason || reason.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required when blocking a user'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
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
      newValue: { isActive: updated.isActive, reason },
      req
    });

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId: parseInt(id),
        title: isActive ? 'Account Activated' : 'Account Blocked',
        message: isActive
          ? 'Your account has been activated. You can now use all features.'
          : `Your account has been blocked. Reason: ${reason}. Please contact support for more information.`
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
        city: true,
        dateOfBirth: true,
        role: true,
        isActive: true,
        isVerified: true,
        kycStatus: true,
        kycSubmittedAt: true,
        kycDocuments: {
          select: {
            id: true,
            documentType: true,
            documentNumber: true,
            frontImageUrl: true,
            backImageUrl: true,
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
      type: doc.documentType,
      documentNumber: doc.documentNumber || undefined,
      frontImageUrl: doc.frontImageUrl || undefined,
      backImageUrl: doc.backImageUrl || undefined,
      uploadDate: doc.uploadedAt.toISOString()
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

// OLD KYC FUNCTIONS - DEPRECATED - Use kycController.ts instead
// These are kept for reference but should not be used
/*
export const approveKycDocument = async (req: AuthRequest, res: Response) => {
  // DEPRECATED - Use /admin/kyc/:userId/approve endpoint instead
  res.status(410).json({
    success: false,
    message: 'This endpoint is deprecated. Use /admin/kyc/:userId/approve instead'
  });
};

export const rejectKycDocument = async (req: AuthRequest, res: Response) => {
  // DEPRECATED - Use /admin/kyc/:userId/reject endpoint instead
  res.status(410).json({
    success: false,
    message: 'This endpoint is deprecated. Use /admin/kyc/:userId/reject instead'
  });
};
*/

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
    notifications.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

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
        profilePicture: true,
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

// Update admin profile
export const updateAdminProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, email } = req.body;
    const adminId = req.user!.id;

    // Validate input
    if (!fullName && !email) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (fullName or email) is required'
      });
    }

    // If email is being updated, check if it's already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: adminId }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update admin profile
    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email })
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    // Log the update
    await logAdminAction({
      adminId,
      action: AuditActions.UPDATE,
      entity: AuditEntities.USER,
      entityId: adminId.toString(),
      oldValue: { fullName: req.user!.email },
      newValue: { fullName, email },
      req
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin profile'
    });
  }
};

// Update admin profile picture
export const updateProfilePicture = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture uploaded'
      });
    }

    // Get current profile picture before update
    const currentUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { profilePicture: true }
    });

    // Generate the URL for the uploaded file
    const profilePictureUrl = `/uploads/profiles/${file.filename}`;

    // Update admin profile picture in database
    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: {
        profilePicture: profilePictureUrl
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePicture: true
      }
    });

    // Log the update
    await logAdminAction({
      adminId,
      action: AuditActions.UPDATE,
      entity: AuditEntities.USER,
      entityId: adminId.toString(),
      oldValue: { profilePicture: currentUser?.profilePicture || null },
      newValue: { profilePicture: profilePictureUrl },
      req
    });

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: profilePictureUrl,
        admin: updatedAdmin
      }
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile picture'
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

// ==================== AGENT ASSIGNMENT & CASH PICKUP ====================

// Assign agent to transaction
export const assignAgentToTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID is required'
      });
    }

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
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

    // Validate payout method
    if (transaction.payoutMethod !== 'CASH_PICKUP') {
      return res.status(400).json({
        success: false,
        message: 'Agent can only be assigned to cash pickup transactions'
      });
    }

    // Validate pickup city is set
    if (!transaction.pickupCity) {
      return res.status(400).json({
        success: false,
        message: 'Pickup city must be set before assigning agent'
      });
    }

    // Get agent
    const agent = await prisma.agent.findUnique({
      where: { id: parseInt(agentId) }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Validate agent status
    if (agent.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Agent is ${agent.status}. Only ACTIVE agents can be assigned.`
      });
    }

    // Validate agent city matches pickup city
    if (agent.city.toLowerCase() !== transaction.pickupCity.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: `Agent is in ${agent.city} but pickup city is ${transaction.pickupCity}`
      });
    }

    // Check agent capacity
    const remaining = Number(agent.maxDailyAmount) - Number(agent.currentDailyAmount);
    if (remaining < Number(transaction.amountReceived)) {
      return res.status(400).json({
        success: false,
        message: `Agent has insufficient daily capacity. Remaining: ${remaining}, Required: ${transaction.amountReceived}`
      });
    }

    // Generate unique 6-digit pickup code
    const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        assignedAgentId: agent.id,
        assignedAt: new Date(),
        pickupCode,
        status: 'READY_FOR_PICKUP'
      },
      include: {
        assignedAgent: true,
        user: true,
        fromCurrency: true,
        toCurrency: true
      }
    });

    // Update agent statistics
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        activeTransactions: { increment: 1 },
        currentDailyAmount: { increment: transaction.amountReceived }
      }
    });

    // Create transaction history entry
    await prisma.transactionHistory.create({
      data: {
        transactionId: transaction.id,
        oldStatus: transaction.status,
        newStatus: 'READY_FOR_PICKUP',
        changedBy: req.user!.id,
        notes: `Agent ${agent.fullName} assigned. Pickup code: ${pickupCode}`
      }
    });

    // Log audit action
    await logAdminAction({
      adminId: req.user!.id,
      action: AuditActions.ASSIGN_AGENT,
      entity: AuditEntities.TRANSACTION,
      entityId: transaction.id.toString(),
      oldValue: { assignedAgentId: null, status: transaction.status },
      newValue: { assignedAgentId: agent.id, status: 'READY_FOR_PICKUP', pickupCode },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send notification email to user
    try {
      await emailService.sendAgentAssignedEmail(
        transaction.user.email,
        transaction.user.fullName,
        {
          transactionRef: transaction.transactionRef,
          agentName: agent.fullName,
          agentPhone: agent.phone,
          agentWhatsapp: agent.whatsapp || agent.phone,
          pickupCity: transaction.pickupCity,
          pickupCode,
          amount: `${transaction.amountReceived} ${transaction.toCurrency.code}`
        }
      );
    } catch (emailError) {
      console.error('Failed to send agent assignment email:', emailError);
      // Don't fail the request if email fails
    }

    return res.json({
      success: true,
      message: 'Agent assigned successfully',
      data: updatedTransaction
    });
  } catch (error: any) {
    console.error('Assign agent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign agent'
    });
  }
};

// Confirm cash pickup
export const confirmCashPickup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { pickupCode } = req.body;

    if (!pickupCode) {
      return res.status(400).json({
        success: false,
        message: 'Pickup code is required'
      });
    }

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignedAgent: true,
        user: true,
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

    // Validate transaction status
    if (transaction.status !== 'READY_FOR_PICKUP') {
      return res.status(400).json({
        success: false,
        message: `Transaction status is ${transaction.status}. Only READY_FOR_PICKUP transactions can be confirmed.`
      });
    }

    // Validate pickup code
    if (transaction.pickupCode !== pickupCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pickup code'
      });
    }

    // Validate agent is assigned
    if (!transaction.assignedAgentId) {
      return res.status(400).json({
        success: false,
        message: 'No agent assigned to this transaction'
      });
    }

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        status: 'COMPLETED',
        pickupVerifiedAt: new Date(),
        pickupVerifiedByAgentId: transaction.assignedAgentId,
        completedAt: new Date()
      },
      include: {
        assignedAgent: true,
        pickupVerifier: true,
        user: true,
        fromCurrency: true,
        toCurrency: true
      }
    });

    // Update agent statistics
    await prisma.agent.update({
      where: { id: transaction.assignedAgentId },
      data: {
        activeTransactions: { decrement: 1 },
        totalTransactions: { increment: 1 }
      }
    });

    // Create transaction history entry
    await prisma.transactionHistory.create({
      data: {
        transactionId: transaction.id,
        oldStatus: 'READY_FOR_PICKUP',
        newStatus: 'COMPLETED',
        changedBy: req.user!.id,
        notes: `Cash pickup confirmed by ${transaction.assignedAgent?.fullName}`
      }
    });

    // Log audit action
    await logAdminAction({
      adminId: req.user!.id,
      action: AuditActions.CONFIRM_PICKUP,
      entity: AuditEntities.TRANSACTION,
      entityId: transaction.id.toString(),
      oldValue: { status: 'READY_FOR_PICKUP', pickupVerifiedAt: null },
      newValue: { status: 'COMPLETED', pickupVerifiedAt: new Date() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send completion notification email
    try {
      await emailService.sendCashPickupCompletedEmail(
        transaction.user.email,
        transaction.user.fullName,
        {
          transactionRef: transaction.transactionRef,
          amount: `${transaction.amountReceived} ${transaction.toCurrency.code}`,
          recipientName: transaction.recipientName,
          completedAt: new Date().toISOString()
        }
      );
    } catch (emailError) {
      console.error('Failed to send completion email:', emailError);
    }

    return res.json({
      success: true,
      message: 'Cash pickup confirmed successfully',
      data: updatedTransaction
    });
  } catch (error: any) {
    console.error('Confirm cash pickup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm cash pickup'
    });
  }
};


// Get transaction history
export const getTransactionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const history = await prisma.transactionHistory.findMany({
      where: { transactionId: parseInt(id) },
      orderBy: { createdAt: 'desc' }
    });

    // Manually fetch user details for each history entry
    const historyWithUsers = await Promise.all(
      history.map(async (entry) => {
        let changedByUser = null;
        if (entry.changedBy) {
          changedByUser = await prisma.user.findUnique({
            where: { id: entry.changedBy },
            select: { id: true, fullName: true, email: true }
          });
        }
        return { ...entry, changedByUser };
      })
    );

    return res.json({
      success: true,
      data: historyWithUsers
    });
  } catch (error: any) {
    console.error('Get transaction history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history'
    });
  }
};

// Get recent users for AML case creation
export const getRecentUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20, sortBy = 'lastTransaction' } = req.query;

    let orderBy: any = { createdAt: 'desc' };
    
    if (sortBy === 'lastTransaction') {
      // Get users with their most recent transaction date
      const users = await prisma.user.findMany({
        where: { 
          role: 'USER',
          isActive: true 
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          createdAt: true,
          transactions: {
            select: {
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        take: parseInt(limit as string) * 2 // Get more to sort properly
      });

      // Sort by last transaction date
      const usersWithLastTransaction = users
        .map(user => ({
          ...user,
          lastTransactionAt: user.transactions[0]?.createdAt || null,
          transactions: undefined // Remove transactions from response
        }))
        .sort((a, b) => {
          if (!a.lastTransactionAt && !b.lastTransactionAt) return 0;
          if (!a.lastTransactionAt) return 1;
          if (!b.lastTransactionAt) return -1;
          return new Date(b.lastTransactionAt).getTime() - new Date(a.lastTransactionAt).getTime();
        })
        .slice(0, parseInt(limit as string));

      return res.json({
        success: true,
        data: {
          users: usersWithLastTransaction
        }
      });
    } else {
      // Default sorting by creation date
      const users = await prisma.user.findMany({
        where: { 
          role: 'USER',
          isActive: true 
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          createdAt: true
        },
        orderBy,
        take: parseInt(limit as string)
      });

      return res.json({
        success: true,
        data: {
          users
        }
      });
    }
  } catch (error: any) {
    console.error('Get recent users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent users'
    });
  }
};
