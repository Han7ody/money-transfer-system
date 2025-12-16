import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum EscalationReason {
  HIGH_VALUE = 'HIGH_VALUE',
  HIGH_FRAUD_SCORE = 'HIGH_FRAUD_SCORE',
  AML_ALERT = 'AML_ALERT',
  MANUAL_REVIEW = 'MANUAL_REVIEW'
}

export class EscalationService {
  /**
   * Check if transaction needs escalation
   */
  async checkEscalation(transactionId: number): Promise<{
    needsEscalation: boolean;
    reasons: string[];
    escalateTo?: string;
  }> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            fraudScore: true
          }
        }
      }
    });

    if (!transaction) {
      return { needsEscalation: false, reasons: [] };
    }

    const reasons: string[] = [];
    let escalateTo: string | undefined;

    // Rule 1: Transactions > $10K → escalate to SUPER_ADMIN
    if (Number(transaction.amountSent) > 10000) {
      reasons.push(`High value transaction: $${Number(transaction.amountSent).toFixed(2)}`);
      escalateTo = 'SUPER_ADMIN';
    }

    // Rule 2: Fraud score > 80 → escalate to COMPLIANCE_OFFICER
    const fraudScore = transaction.user?.fraudScore || 0;
    if (fraudScore > 80) {
      reasons.push(`High fraud score: ${fraudScore}`);
      escalateTo = 'COMPLIANCE_OFFICER';
    }

    // Rule 3: Check for HIGH severity AML alerts
    try {
      const amlAlerts = await prisma.$queryRawUnsafe<Array<{ severity: string }>>(
        `SELECT severity FROM aml_alerts 
         WHERE transaction_id = $1 AND severity = 'HIGH' AND status = 'OPEN'
         LIMIT 1`,
        transactionId
      );

      if (amlAlerts.length > 0) {
        reasons.push('High severity AML alert detected');
        escalateTo = 'COMPLIANCE_OFFICER';
      }
    } catch (error: any) {
      // If table doesn't exist, skip AML check
      if (!(error.code === 'P2010' || error.message?.includes('does not exist'))) {
        throw error;
      }
    }

    return {
      needsEscalation: reasons.length > 0,
      reasons,
      escalateTo
    };
  }

  /**
   * Mark transaction as escalated
   */
  async escalateTransaction(
    transactionId: number,
    reasons: string[],
    escalatedBy: number,
    escalateTo: string
  ): Promise<void> {
    try {
      // Update transaction with escalation flag
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          // Store escalation info in adminNotes for now
          adminNotes: `⚠️ ESCALATED to ${escalateTo}: ${reasons.join('; ')}`
        }
      });

      // Log escalation in audit
      await prisma.auditLog.create({
        data: {
          adminId: escalatedBy,
          action: 'TRANSACTION_ESCALATED',
          entity: 'Transaction',
          entityId: transactionId.toString(),
          newValue: {
            escalateTo,
            reasons
          }
        }
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get escalation info for a transaction
   */
  async getEscalationInfo(transactionId: number): Promise<{
    isEscalated: boolean;
    reasons: string[];
    escalateTo?: string;
  }> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { adminNotes: true }
    });

    if (!transaction?.adminNotes?.includes('ESCALATED')) {
      return { isEscalated: false, reasons: [] };
    }

    // Parse escalation info from adminNotes
    const match = transaction.adminNotes.match(/ESCALATED to (\w+): (.+)/);
    if (match) {
      return {
        isEscalated: true,
        escalateTo: match[1],
        reasons: match[2].split('; ')
      };
    }

    return { isEscalated: false, reasons: [] };
  }
}

export const escalationService = new EscalationService();
