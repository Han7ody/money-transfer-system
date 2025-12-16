// backend/src/services/transactionService.ts
/**
 * Transaction Service
 * Handles all transaction-related business logic
 */

import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import notificationService from './notificationService';

export interface CreateTransactionData {
  senderName: string;
  senderPhone: string;
  senderCountry: string;
  recipientName: string;
  recipientPhone: string;
  recipientBankName?: string;
  recipientAccountNumber?: string;
  recipientCountry: string;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  amountSent: number;
}

export interface TransactionAmounts {
  rate: number;
  feePercent: number;
  adminFee: number;
  amountAfterFee: number;
  amountReceived: number;
}

export class TransactionService {
  /**
   * Generate unique transaction reference
   */
  private generateTransactionRef(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TXN${year}${month}${day}${random}`;
  }

  /**
   * Calculate transaction amounts
   */
  async calculateAmounts(
    amountSent: number,
    fromCurrencyCode: string,
    toCurrencyCode: string
  ): Promise<TransactionAmounts> {
    const fromCurrency = await prisma.currency.findUnique({
      where: { code: fromCurrencyCode }
    });

    const toCurrency = await prisma.currency.findUnique({
      where: { code: toCurrencyCode }
    });

    if (!fromCurrency || !toCurrency) {
      throw new ValidationError('Invalid currency codes');
    }

    const exchangeRateData = await prisma.exchangeRate.findUnique({
      where: {
        fromCurrencyId_toCurrencyId: {
          fromCurrencyId: fromCurrency.id,
          toCurrencyId: toCurrency.id
        }
      }
    });

    if (!exchangeRateData) {
      throw new ValidationError('Exchange rate not available for this currency pair');
    }

    const rate = parseFloat(exchangeRateData.rate.toString());
    const feePercent = parseFloat(exchangeRateData.adminFeePercent.toString());
    const adminFee = (amountSent * feePercent) / 100;
    const amountAfterFee = amountSent - adminFee;
    const amountReceived = amountAfterFee * rate;

    return {
      rate,
      feePercent,
      adminFee,
      amountAfterFee,
      amountReceived
    };
  }

  /**
   * Create new transaction
   */
  async createTransaction(userId: number, data: CreateTransactionData) {
    // Validation
    if (!data.senderName || !data.recipientName || !data.amountSent || 
        !data.fromCurrencyCode || !data.toCurrencyCode) {
      throw new ValidationError('Missing required fields');
    }

    // Get currencies
    const fromCurrency = await prisma.currency.findUnique({
      where: { code: data.fromCurrencyCode }
    });

    const toCurrency = await prisma.currency.findUnique({
      where: { code: data.toCurrencyCode }
    });

    if (!fromCurrency || !toCurrency) {
      throw new ValidationError('Invalid currency codes');
    }

    // Calculate amounts
    const amounts = await this.calculateAmounts(
      data.amountSent,
      data.fromCurrencyCode,
      data.toCurrencyCode
    );

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        transactionRef: this.generateTransactionRef(),
        userId,
        senderName: data.senderName,
        senderPhone: data.senderPhone,
        senderCountry: data.senderCountry,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        recipientBankName: data.recipientBankName,
        recipientAccountNumber: data.recipientAccountNumber,
        recipientCountry: data.recipientCountry,
        fromCurrencyId: fromCurrency.id,
        toCurrencyId: toCurrency.id,
        amountSent: data.amountSent,
        exchangeRate: amounts.rate,
        adminFee: amounts.adminFee,
        amountReceived: amounts.amountReceived,
        status: 'PENDING'
      },
      include: {
        fromCurrency: true,
        toCurrency: true
      }
    });

    // Create notification
    await notificationService.createNotification({
      userId,
      transactionId: transaction.id,
      title: 'Transaction Created',
      message: `Your transaction ${transaction.transactionRef} has been created. Please upload payment receipt.`
    });

    return transaction;
  }

  /**
   * Upload receipt for transaction
   */
  async uploadReceipt(transactionId: number, userId: number, filePath: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenError('Unauthorized access');
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        receiptFilePath: filePath,
        receiptUploadedAt: new Date(),
        status: 'UNDER_REVIEW'
      }
    });

    // Create history
    await this.createHistory(
      transactionId,
      transaction.status,
      'UNDER_REVIEW',
      userId,
      'Receipt uploaded'
    );

    // Notify user
    await notificationService.createNotification({
      userId,
      transactionId,
      title: 'Receipt Uploaded',
      message: `Receipt uploaded successfully for transaction ${transaction.transactionRef}. Under admin review.`
    });

    return updatedTransaction;
  }

  /**
   * Create transaction history entry
   * Centralized method to eliminate duplicate code
   */
  async createHistory(
    transactionId: number,
    oldStatus: string,
    newStatus: string,
    changedBy: number,
    notes?: string
  ): Promise<void> {
    await prisma.transactionHistory.create({
      data: {
        transactionId,
        oldStatus,
        newStatus,
        changedBy,
        notes: notes || `Status changed from ${oldStatus} to ${newStatus}`
      }
    });
  }

  /**
   * Get user transactions with filters and pagination
   */
  async getUserTransactions(
    userId: number,
    filters: { status?: string },
    page: number = 1,
    limit: number = 10
  ) {
    const where: Prisma.TransactionWhereInput = { userId };
    
    if (filters.status) {
      where.status = filters.status as any;
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          fromCurrency: true,
          toCurrency: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: number, userId: number, userRole: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
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
      throw new NotFoundError('Transaction not found');
    }

    // Check permissions
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'VIEWER'].includes(userRole);
    if (transaction.userId !== userId && !isAdmin) {
      throw new ForbiddenError('Unauthorized access');
    }

    return transaction;
  }

  /**
   * Get exchange rate
   */
  async getExchangeRate(fromCurrencyCode: string, toCurrencyCode: string) {
    if (!fromCurrencyCode || !toCurrencyCode) {
      throw new ValidationError('Missing currency codes');
    }

    const fromCurrency = await prisma.currency.findUnique({
      where: { code: fromCurrencyCode }
    });

    const toCurrency = await prisma.currency.findUnique({
      where: { code: toCurrencyCode }
    });

    if (!fromCurrency || !toCurrency) {
      throw new ValidationError('Invalid currency codes');
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
      throw new NotFoundError('Exchange rate not found');
    }

    return {
      from: fromCurrency,
      to: toCurrency,
      rate: parseFloat(exchangeRate.rate.toString()),
      adminFeePercent: parseFloat(exchangeRate.adminFeePercent.toString())
    };
  }

  /**
   * Cancel transaction (user can cancel only if pending)
   */
  async cancelTransaction(transactionId: number, userId: number) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenError('Unauthorized access');
    }

    if (transaction.status !== 'PENDING') {
      throw new ValidationError('Cannot cancel transaction in current status');
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'CANCELLED' }
    });

    await this.createHistory(
      transactionId,
      transaction.status,
      'CANCELLED',
      userId,
      'Cancelled by user'
    );

    return updated;
  }
}

export default new TransactionService();
