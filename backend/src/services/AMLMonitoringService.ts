import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum AMLAlertType {
  VELOCITY = 'VELOCITY',
  STRUCTURING = 'STRUCTURING',
  HIGH_RISK_COUNTRY = 'HIGH_RISK_COUNTRY',
  UNUSUAL_PATTERN = 'UNUSUAL_PATTERN'
}

export enum AMLSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export class AMLMonitoringService {
  /**
   * Check velocity - transactions per day and daily amount
   */
  async checkVelocity(userId: number, transactionId: number): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: oneDayAgo },
        status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED'] }
      }
    });

    const transactionCount = recentTransactions.length;
    const totalAmount = recentTransactions.reduce((sum, tx) => sum + Number(tx.amountSent), 0);

    // Alert if >3 transactions/day
    if (transactionCount > 3) {
      await this.createAlert({
        userId,
        transactionId,
        type: AMLAlertType.VELOCITY,
        severity: AMLSeverity.MEDIUM,
        details: {
          transactionCount,
          period: '24h',
          threshold: 3
        },
        message: `User has ${transactionCount} transactions in 24 hours (threshold: 3)`
      });
    }

    // Alert if >$5K/day
    if (totalAmount > 5000) {
      await this.createAlert({
        userId,
        transactionId,
        type: AMLAlertType.VELOCITY,
        severity: AMLSeverity.HIGH,
        details: {
          totalAmount,
          period: '24h',
          threshold: 5000
        },
        message: `User has $${totalAmount.toFixed(2)} in 24 hours (threshold: $5000)`
      });
    }
  }

  /**
   * Check for structuring - multiple transactions just below reporting threshold
   */
  async checkStructuring(userId: number, transactionId: number): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const structuringTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: oneDayAgo },
        amountSent: {
          gte: 4500,
          lte: 5000
        },
        status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED'] }
      }
    });

    // Alert if 2+ transactions between $4,500-$5,000 within 24 hours
    if (structuringTransactions.length >= 2) {
      await this.createAlert({
        userId,
        transactionId,
        type: AMLAlertType.STRUCTURING,
        severity: AMLSeverity.HIGH,
        details: {
          transactionCount: structuringTransactions.length,
          amountRange: '$4,500-$5,000',
          period: '24h',
          transactionIds: structuringTransactions.map(tx => tx.id)
        },
        message: `Possible structuring: ${structuringTransactions.length} transactions between $4,500-$5,000 in 24 hours`
      });
    }
  }

  /**
   * Run all AML checks for a transaction
   */
  async runChecks(userId: number, transactionId: number): Promise<void> {
    try {
      await Promise.all([
        this.checkVelocity(userId, transactionId),
        this.checkStructuring(userId, transactionId)
      ]);
    } catch (error) {
      // Don't throw - AML checks shouldn't block transactions
    }
  }

  /**
   * Create an AML alert
   */
  private async createAlert(params: {
    userId: number;
    transactionId: number;
    type: AMLAlertType;
    severity: AMLSeverity;
    details: any;
    message: string;
  }): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO aml_alerts (user_id, transaction_id, type, severity, details, message, status, created_at)
        VALUES (
          ${params.userId},
          ${params.transactionId},
          ${params.type},
          ${params.severity},
          ${JSON.stringify(params.details)}::jsonb,
          ${params.message},
          'OPEN',
          NOW()
        )
      `;


    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[AMLMonitoring] aml_alerts table not found - skipping alert creation');
        return;
      }
      throw error;
    }
  }

  /**
   * Get all AML alerts with filtering
   */
  async getAlerts(filters: {
    status?: string;
    severity?: string;
    type?: string;
    userId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ alerts: any[]; total: number }> {
    try {
      const { status, severity, type, userId, page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (severity) {
        whereClause += ` AND severity = $${paramIndex}`;
        params.push(severity);
        paramIndex++;
      }

      if (type) {
        whereClause += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (userId) {
        whereClause += ` AND user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      const alerts = await prisma.$queryRawUnsafe(`
        SELECT 
          a.*,
          u.full_name as user_name,
          u.email as user_email,
          t.transaction_ref,
          t.amount_sent
        FROM aml_alerts a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN transactions t ON a.transaction_id = t.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, ...params, limit, offset);

      const totalResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM aml_alerts a ${whereClause}`,
        ...params
      );

      return {
        alerts: alerts as any[],
        total: Number(totalResult[0]?.count || 0)
      };
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[AMLMonitoring] aml_alerts table not found - returning empty list');
        return { alerts: [], total: 0 };
      }
      throw error;
    }
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(alertId: number, status: string, reviewedBy: number, notes?: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE aml_alerts
        SET status = ${status}, reviewed_by = ${reviewedBy}, reviewed_at = NOW(), notes = ${notes || null}
        WHERE id = ${alertId}
      `;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[AMLMonitoring] aml_alerts table not found - skipping update');
        return;
      }
      throw error;
    }
  }
}

export const amlMonitoringService = new AMLMonitoringService();
