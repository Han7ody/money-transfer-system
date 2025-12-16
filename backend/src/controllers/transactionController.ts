// backend/src/controllers/transactionController.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Generate unique transaction reference
const generateTransactionRef = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TXN${year}${month}${day}${random}`;
};

// Create new transaction
export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const {
      senderName,
      senderPhone,
      senderCountry,
      recipientName,
      recipientPhone,
      recipientBankName,
      recipientAccountNumber,
      recipientCountry,
      fromCurrencyCode,
      toCurrencyCode,
      amountSent
    } = req.body;

    // Validation
    if (!senderName || !recipientName || !amountSent || !fromCurrencyCode || !toCurrencyCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get currencies
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

    // Get exchange rate
    const exchangeRateData = await prisma.exchangeRate.findUnique({
      where: {
        fromCurrencyId_toCurrencyId: {
          fromCurrencyId: fromCurrency.id,
          toCurrencyId: toCurrency.id
        }
      }
    });

    if (!exchangeRateData) {
      return res.status(400).json({
        success: false,
        message: 'Exchange rate not available for this currency pair'
      });
    }

    // Calculate amounts
    const rate = parseFloat(exchangeRateData.rate.toString());
    const feePercent = parseFloat(exchangeRateData.adminFeePercent.toString());
    const adminFee = (parseFloat(amountSent) * feePercent) / 100;
    const amountAfterFee = parseFloat(amountSent) - adminFee;
    const amountReceived = amountAfterFee * rate;

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        transactionRef: generateTransactionRef(),
        userId: req.user!.id,
        senderName,
        senderPhone,
        senderCountry,
        recipientName,
        recipientPhone,
        recipientBankName,
        recipientAccountNumber,
        recipientCountry,
        fromCurrencyId: fromCurrency.id,
        toCurrencyId: toCurrency.id,
        amountSent: parseFloat(amountSent),
        exchangeRate: rate,
        adminFee,
        amountReceived,
        status: 'PENDING'
      },
      include: {
        fromCurrency: true,
        toCurrency: true
      }
    });

    // ✅ Run AML checks (non-blocking)
    const { amlMonitoringService } = await import('../services/AMLMonitoringService');
    amlMonitoringService.runChecks(req.user!.id, transaction.id).catch(err => {
      console.error('[AML] Error running checks:', err);
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        transactionId: transaction.id,
        title: 'Transaction Created',
        message: `Your transaction ${transaction.transactionRef} has been created. Please upload payment receipt.`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction'
    });
  }
};

// Upload receipt
export const uploadReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { transactionId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(transactionId) }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: parseInt(transactionId) },
      data: {
        receiptFilePath: file.path,
        receiptUploadedAt: new Date(),
        status: 'UNDER_REVIEW'
      }
    });

    // Create history
    await prisma.transactionHistory.create({
      data: {
        transactionId: parseInt(transactionId),
        oldStatus: transaction.status,
        newStatus: 'UNDER_REVIEW',
        changedBy: req.user!.id,
        notes: 'Receipt uploaded'
      }
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        transactionId: parseInt(transactionId),
        title: 'Receipt Uploaded',
        message: `Receipt uploaded successfully for transaction ${transaction.transactionRef}. Under admin review.`
      }
    });

    res.json({
      success: true,
      message: 'Receipt uploaded successfully',
      data: updatedTransaction
    });
  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload receipt'
    });
  }
};

// Get user transactions
export const getUserTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const where: any = { userId: req.user!.id };
    
    if (status) {
      where.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          fromCurrency: true,
          toCurrency: true
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
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
};

// Get transaction by ID
export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
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
        },
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        history: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction'
    });
  }
};

// Get exchange rate
export const getExchangeRate = async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Missing currency codes'
      });
    }

    const fromCurrency = await prisma.currency.findUnique({
      where: { code: from as string }
    });

    const toCurrency = await prisma.currency.findUnique({
      where: { code: to as string }
    });

    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency codes'
      });
    }

    const exchangeRate = await prisma.exchangeRate.findUnique({
      where: {
        fromCurrencyId_toCurrencyId: {
          fromCurrencyId: fromCurrency.id,
          toCurrencyId: toCurrency.id
        }
      }
    });

    if (!exchangeRate) {
      return res.status(404).json({
        success: false,
        message: 'Exchange rate not found'
      });
    }

    res.json({
      success: true,
      data: {
        from: fromCurrency,
        to: toCurrency,
        rate: parseFloat(exchangeRate.rate.toString()),
        adminFeePercent: parseFloat(exchangeRate.adminFeePercent.toString())
      }
    });
  } catch (error) {
    console.error('Get exchange rate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rate'
    });
  }
};

// Cancel transaction (user can cancel only if pending)
export const cancelTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel transaction in current status'
      });
    }

    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED' }
    });

    await prisma.transactionHistory.create({
      data: {
        transactionId: parseInt(id),
        oldStatus: transaction.status,
        newStatus: 'CANCELLED',
        changedBy: req.user!.id,
        notes: 'Cancelled by user'
      }
    });

    res.json({
      success: true,
      message: 'Transaction cancelled successfully',
      data: updated
    });
  } catch (error) {
    console.error('Cancel transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel transaction'
    });
  }
};