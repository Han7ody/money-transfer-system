// backend/src/services/kycService.ts
import prisma from '../lib/prisma';
import { KycStatus } from '@prisma/client';
import fraudDetectionService from './fraudDetectionService';
import emailService from './emailService';

interface KycQueueFilters {
  country?: string;
  documentType?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  search?: string;
  status?: KycStatus;
}

export class KycService {
  async getKycQueue(filters: KycQueueFilters, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const where: any = {
      kycStatus: filters.status || 'PENDING'
    };

    if (filters.country) {
      where.country = filters.country;
    }

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          kycDocuments: true,
          fraudMatchesAsUser: {
            where: { isResolved: false },
            select: { score: true }
          }
        },
        orderBy: [
          { kycSubmittedAt: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    // Calculate fraud scores and sort
    const usersWithScores = users.map(user => {
      const fraudScore = user.fraudMatchesAsUser.reduce((sum, match) => sum + match.score, 0);
      const hoursSinceSubmission = user.kycSubmittedAt 
        ? (Date.now() - user.kycSubmittedAt.getTime()) / (1000 * 60 * 60)
        : 0;

      return {
        ...user,
        fraudScore: Math.min(fraudScore, 100),
        hoursSinceSubmission,
        priority: this.calculatePriority(fraudScore, hoursSinceSubmission)
      };
    });

    // Sort by priority
    usersWithScores.sort((a, b) => b.priority - a.priority);

    return {
      users: usersWithScores,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  private calculatePriority(fraudScore: number, hoursSinceSubmission: number): number {
    let priority = 0;
    
    // High risk gets highest priority
    if (fraudScore >= 80) priority += 1000;
    else if (fraudScore >= 50) priority += 500;
    
    // Pending >48h gets priority boost
    if (hoursSinceSubmission > 48) priority += 300;
    
    // Add hours as tiebreaker
    priority += hoursSinceSubmission;
    
    return priority;
  }

  async getKycReviewDetails(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycDocuments: true,
        kycReviewNotes: {
          orderBy: { createdAt: 'desc' }
        },
        kycActionLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate fraud score with error handling
    let fraudScore = 0;
    let fraudMatches: any[] = [];
    
    try {
      const fraudAnalysis = await fraudDetectionService.calculateFraudScore(userId);
      fraudScore = fraudAnalysis.totalScore;
      fraudMatches = await fraudDetectionService.getFraudMatches(userId);
    } catch (error) {
      // Continue without fraud detection if it fails
    }

    return {
      user,
      fraudScore,
      fraudMatches,
      documents: user.kycDocuments,
      notes: user.kycReviewNotes,
      actionHistory: user.kycActionLogs
    };
  }

  async approveKyc(userId: number, adminId: number, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // ✅ USE STATE MACHINE VALIDATION
    const { kycStateMachine } = await import('./stateMachine/KYCStateMachine');
    const validation = await kycStateMachine.validateTransition(
      user.kycStatus,
      'APPROVED',
      {
        userId: adminId.toString(),
        reason: reason || 'KYC approved by admin'
      }
    );

    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid KYC state transition');
    }

    // Execute state transition
    await kycStateMachine.executeTransition(
      user.kycStatus,
      'APPROVED',
      {
        userId: adminId.toString(),
        reason: reason || 'KYC approved by admin'
      }
    );

    const oldStatus = user.kycStatus;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'APPROVED',
          kycReviewedAt: new Date(),
          kycReviewedBy: adminId
        }
      }),
      prisma.kycActionLog.create({
        data: {
          userId,
          adminId,
          action: 'APPROVE',
          reason,
          oldStatus,
          newStatus: 'APPROVED'
        }
      })
    ]);

    // Send email notification
    await emailService.sendKycApprovedEmail(user.email, user.fullName);

    return { success: true };
  }

  async rejectKyc(userId: number, adminId: number, reason: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // ✅ USE STATE MACHINE VALIDATION
    const { kycStateMachine } = await import('./stateMachine/KYCStateMachine');
    const validation = await kycStateMachine.validateTransition(
      user.kycStatus,
      'REJECTED',
      {
        userId: adminId.toString(),
        reason
      }
    );

    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid KYC state transition');
    }

    // Execute state transition
    await kycStateMachine.executeTransition(
      user.kycStatus,
      'REJECTED',
      {
        userId: adminId.toString(),
        reason
      }
    );

    const oldStatus = user.kycStatus;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'REJECTED',
          kycReviewedAt: new Date(),
          kycReviewedBy: adminId
        }
      }),
      prisma.kycActionLog.create({
        data: {
          userId,
          adminId,
          action: 'REJECT',
          reason,
          oldStatus,
          newStatus: 'REJECTED'
        }
      })
    ]);

    // Send email notification
    await emailService.sendKycRejectedEmail(user.email, user.fullName, reason);

    return { success: true };
  }

  async requestMoreDocuments(userId: number, adminId: number, reason: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const oldStatus = user.kycStatus;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'NOT_SUBMITTED'
        }
      }),
      prisma.kycActionLog.create({
        data: {
          userId,
          adminId,
          action: 'REQUEST_MORE',
          reason,
          oldStatus,
          newStatus: 'NOT_SUBMITTED'
        }
      })
    ]);

    // Send email notification
    await emailService.sendKycMoreDocsEmail(user.email, user.fullName, reason);

    return { success: true };
  }

  async escalateKyc(userId: number, adminId: number, reason: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    await prisma.kycActionLog.create({
      data: {
        userId,
        adminId,
        action: 'ESCALATE',
        reason,
        oldStatus: user.kycStatus,
        newStatus: user.kycStatus
      }
    });

    // TODO: Send notification to compliance team

    return { success: true };
  }

  async addReviewNote(userId: number, adminId: number, message: string) {
    return prisma.kycReviewNote.create({
      data: {
        userId,
        adminId,
        message
      }
    });
  }

  async getKycStats() {
    const [pending, approved, rejected, escalated] = await Promise.all([
      prisma.user.count({ where: { kycStatus: 'PENDING' } }),
      prisma.user.count({ where: { kycStatus: 'APPROVED' } }),
      prisma.user.count({ where: { kycStatus: 'REJECTED' } }),
      prisma.kycActionLog.count({ where: { action: 'ESCALATE' } })
    ]);

    return { pending, approved, rejected, escalated };
  }
}

export default new KycService();
