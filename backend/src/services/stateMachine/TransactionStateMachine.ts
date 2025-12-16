import { IStateMachine, ValidationResult, TransitionContext } from './IStateMachine';
import { TransactionStatus } from '@prisma/client';
import { auditLog } from '../../utils/auditLogger';

type TransitionGuard = (context: TransitionContext) => Promise<ValidationResult>;

export class TransactionStateMachine implements IStateMachine<TransactionStatus> {
  private transitions: Map<TransactionStatus, TransactionStatus[]>;
  private guards: Map<string, TransitionGuard>;

  constructor() {
    this.transitions = new Map([
      [TransactionStatus.PENDING, [TransactionStatus.UNDER_REVIEW, TransactionStatus.REJECTED, TransactionStatus.CANCELLED]],
      [TransactionStatus.UNDER_REVIEW, [TransactionStatus.APPROVED, TransactionStatus.REJECTED, TransactionStatus.CANCELLED]],
      [TransactionStatus.APPROVED, [TransactionStatus.READY_FOR_PICKUP, TransactionStatus.CANCELLED]],
      [TransactionStatus.READY_FOR_PICKUP, [TransactionStatus.COMPLETED, TransactionStatus.CANCELLED]],
      [TransactionStatus.COMPLETED, []],
      [TransactionStatus.REJECTED, []],
      [TransactionStatus.CANCELLED, []],
    ]);

    this.guards = new Map();
    this.initializeGuards();
  }

  private initializeGuards(): void {
    // Guard: Prevent PENDING -> APPROVED (must go through UNDER_REVIEW)
    this.guards.set('PENDING->APPROVED', async (context) => {
      return {
        valid: false,
        reason: 'Transaction must be reviewed before approval'
      };
    });

    // Guard: Require reason for rejection
    this.guards.set('*->REJECTED', async (context) => {
      if (!context.reason || context.reason.trim().length === 0) {
        return {
          valid: false,
          reason: 'Rejection reason is required'
        };
      }
      return { valid: true };
    });

    // Guard: Require reason for cancellation
    this.guards.set('*->CANCELLED', async (context) => {
      if (!context.reason || context.reason.trim().length === 0) {
        return {
          valid: false,
          reason: 'Cancellation reason is required'
        };
      }
      return { valid: true };
    });
  }

  canTransition(from: TransactionStatus, to: TransactionStatus): boolean {
    const allowedTransitions = this.transitions.get(from);
    return allowedTransitions ? allowedTransitions.includes(to) : false;
  }

  async validateTransition(
    from: TransactionStatus,
    to: TransactionStatus,
    context: TransitionContext
  ): Promise<ValidationResult> {
    // Check if transition is allowed
    if (!this.canTransition(from, to)) {
      return {
        valid: false,
        reason: `Transition from ${from} to ${to} is not allowed`
      };
    }

    // Check specific guard for this transition
    const specificGuardKey = `${from}->${to}`;
    if (this.guards.has(specificGuardKey)) {
      const guard = this.guards.get(specificGuardKey)!;
      const result = await guard(context);
      if (!result.valid) {
        return result;
      }
    }

    // Check wildcard guard for target state
    const wildcardGuardKey = `*->${to}`;
    if (this.guards.has(wildcardGuardKey)) {
      const guard = this.guards.get(wildcardGuardKey)!;
      const result = await guard(context);
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true };
  }

  async executeTransition(
    from: TransactionStatus,
    to: TransactionStatus,
    context: TransitionContext
  ): Promise<void> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Log to transaction_state_transitions table
      await prisma.$executeRaw`
        INSERT INTO transaction_state_transitions (
          transaction_id, from_status, to_status, changed_by, reason, metadata, created_at
        )
        SELECT 
          t.id, 
          ${from}::text, 
          ${to}::text, 
          ${parseInt(context.userId)}, 
          ${context.reason || null}, 
          ${context.metadata ? JSON.stringify(context.metadata) : null}::jsonb,
          NOW()
        FROM transactions t
        WHERE t.status = ${from}::text
        LIMIT 1
      `.catch((error: any) => {
        // If table doesn't exist, log warning but don't fail
        if (error.code === 'P2010' || error.message?.includes('does not exist')) {
          console.warn('[TransactionStateMachine] transaction_state_transitions table not found - skipping state transition log');
        } else {
          throw error;
        }
      });

      // Log the transition to audit log
      await auditLog({
        action: 'TRANSACTION_STATE_TRANSITION',
        userId: context.userId,
        details: {
          from,
          to,
          reason: context.reason,
          metadata: context.metadata
        }
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  getAllowedTransitions(from: TransactionStatus): TransactionStatus[] {
    return this.transitions.get(from) || [];
  }
}

// Singleton instance
export const transactionStateMachine = new TransactionStateMachine();
