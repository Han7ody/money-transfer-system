import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Approval limits per role (in base currency)
const APPROVAL_LIMITS = {
  ADMIN: 10000,
  SUPER_ADMIN: Infinity,
  COMPLIANCE_OFFICER: 5000
};

export class ApprovalService {
  /**
   * Check if a transaction requires dual approval
   */
  async requiresDualApproval(transactionId: number): Promise<boolean> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Transactions over 5000 require dual approval
    const DUAL_APPROVAL_THRESHOLD = 5000;
    return Number(transaction.amountSent) >= DUAL_APPROVAL_THRESHOLD;
  }

  /**
   * Check if admin can approve based on their role and limits
   */
  async canApprove(adminId: number, transactionId: number): Promise<{ canApprove: boolean; reason?: string }> {
    const [admin, transaction] = await Promise.all([
      prisma.user.findUnique({ where: { id: adminId } }),
      prisma.transaction.findUnique({ where: { id: transactionId } })
    ]);

    if (!admin || !transaction) {
      return { canApprove: false, reason: 'Admin or transaction not found' };
    }

    const limit = APPROVAL_LIMITS[admin.role as keyof typeof APPROVAL_LIMITS] || 0;
    const amount = Number(transaction.amountSent);

    if (amount > limit) {
      return {
        canApprove: false,
        reason: `Transaction amount (${amount}) exceeds your approval limit (${limit})`
      };
    }

    return { canApprove: true };
  }

  /**
   * Record first approval
   */
  async recordFirstApproval(transactionId: number, adminId: number): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO transaction_approvals (transaction_id, approver_id, approval_level, notes)
        VALUES (${transactionId}, ${adminId}, 1, 'First approval')
        ON CONFLICT (transaction_id, approver_id) DO NOTHING
      `;
    } catch (error: any) {
      // If table doesn't exist, log warning but don't fail
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[ApprovalService] transaction_approvals table not found - skipping approval tracking');
        return;
      }
      throw error;
    }
  }

  /**
   * Record second approval and validate it's from a different admin
   */
  async recordSecondApproval(
    transactionId: number,
    adminId: number
  ): Promise<{ success: boolean; reason?: string }> {
    try {
      // Check if first approval exists
      const firstApproval = await prisma.$queryRaw<Array<{ approver_id: number }>>`
        SELECT approver_id FROM transaction_approvals
        WHERE transaction_id = ${transactionId} AND approval_level = 1
        LIMIT 1
      `;

      if (firstApproval.length === 0) {
        return { success: false, reason: 'First approval not found' };
      }

      // Check if same admin
      if (firstApproval[0].approver_id === adminId) {
        return { success: false, reason: 'Same admin cannot provide both approvals' };
      }

      // Record second approval
      await prisma.$executeRaw`
        INSERT INTO transaction_approvals (transaction_id, approver_id, approval_level, notes)
        VALUES (${transactionId}, ${adminId}, 2, 'Second approval')
        ON CONFLICT (transaction_id, approver_id) DO NOTHING
      `;

      return { success: true };
    } catch (error: any) {
      // If table doesn't exist, allow approval but log warning
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[ApprovalService] transaction_approvals table not found - allowing approval');
        return { success: true };
      }
      throw error;
    }
  }

  /**
   * Get approval status for a transaction
   */
  async getApprovalStatus(transactionId: number): Promise<{
    requiresDual: boolean;
    firstApprover?: number;
    secondApprover?: number;
    isFullyApproved: boolean;
  }> {
    try {
      const requiresDual = await this.requiresDualApproval(transactionId);

      const approvals = await prisma.$queryRaw<Array<{ approver_id: number; approval_level: number }>>`
        SELECT approver_id, approval_level FROM transaction_approvals
        WHERE transaction_id = ${transactionId}
        ORDER BY approval_level ASC
      `;

      const firstApprover = approvals.find(a => a.approval_level === 1)?.approver_id;
      const secondApprover = approvals.find(a => a.approval_level === 2)?.approver_id;

      return {
        requiresDual,
        firstApprover,
        secondApprover,
        isFullyApproved: requiresDual ? !!secondApprover : !!firstApprover
      };
    } catch (error: any) {
      // If table doesn't exist, return default values
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[ApprovalService] transaction_approvals table not found - returning default status');
        return {
          requiresDual: false,
          isFullyApproved: false
        };
      }
      throw error;
    }
  }
}

export const approvalService = new ApprovalService();
