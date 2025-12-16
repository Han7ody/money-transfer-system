import { IStateMachine, ValidationResult, TransitionContext } from './IStateMachine';
import { KycStatus } from '@prisma/client';
import { auditLog } from '../../utils/auditLogger';

type TransitionGuard = (context: TransitionContext) => Promise<ValidationResult>;

export class KYCStateMachine implements IStateMachine<KycStatus> {
  private transitions: Map<KycStatus, KycStatus[]>;
  private guards: Map<string, TransitionGuard>;

  constructor() {
    this.transitions = new Map([
      [KycStatus.NOT_SUBMITTED, [KycStatus.PENDING]],
      [KycStatus.PENDING, [KycStatus.APPROVED, KycStatus.REJECTED]],
      [KycStatus.APPROVED, [KycStatus.PENDING]], // Allow re-verification if needed
      [KycStatus.REJECTED, [KycStatus.PENDING]], // Allow resubmission
    ]);

    this.guards = new Map();
    this.initializeGuards();
  }

  private initializeGuards(): void {
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

    // Guard: Require reason for approval
    this.guards.set('*->APPROVED', async (context) => {
      if (!context.reason || context.reason.trim().length === 0) {
        return {
          valid: false,
          reason: 'Approval reason is required'
        };
      }
      return { valid: true };
    });
  }

  canTransition(from: KycStatus, to: KycStatus): boolean {
    const allowedTransitions = this.transitions.get(from);
    return allowedTransitions ? allowedTransitions.includes(to) : false;
  }

  async validateTransition(
    from: KycStatus,
    to: KycStatus,
    context: TransitionContext
  ): Promise<ValidationResult> {
    if (!this.canTransition(from, to)) {
      return {
        valid: false,
        reason: `Transition from ${from} to ${to} is not allowed`
      };
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
    from: KycStatus,
    to: KycStatus,
    context: TransitionContext
  ): Promise<void> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Log to kyc_state_transitions table
      await prisma.$executeRaw`
        INSERT INTO kyc_state_transitions (
          user_id, from_status, to_status, changed_by, reason, metadata, created_at
        )
        SELECT 
          u.id,
          ${from}::text,
          ${to}::text,
          ${parseInt(context.userId)},
          ${context.reason || null},
          ${context.metadata ? JSON.stringify(context.metadata) : null}::jsonb,
          NOW()
        FROM users u
        WHERE u.kyc_status = ${from}::text
        LIMIT 1
      `.catch((error: any) => {
        // If table doesn't exist, log warning but don't fail
        if (error.code === 'P2010' || error.message?.includes('does not exist')) {
          console.warn('[KYCStateMachine] kyc_state_transitions table not found - skipping state transition log');
        } else {
          throw error;
        }
      });

      // Log the transition to audit log
      await auditLog({
        action: 'KYC_STATE_TRANSITION',
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

  getAllowedTransitions(from: KycStatus): KycStatus[] {
    return this.transitions.get(from) || [];
  }
}

export const kycStateMachine = new KYCStateMachine();
