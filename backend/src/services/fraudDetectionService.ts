// backend/src/services/fraudDetectionService.ts
import prisma from '../lib/prisma';

interface FraudScore {
  totalScore: number;
  matches: Array<{
    type: string;
    matchedUserId: number;
    matchedUserName: string;
    score: number;
    value?: string;
  }>;
}

export class FraudDetectionService {
  async calculateFraudScore(userId: number, calculatedBy?: number): Promise<FraudScore> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycDocuments: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const matches: FraudScore['matches'] = [];
    let totalScore = 0;
    const factors: any[] = [];

    // Check for duplicate document numbers (with error handling)
    try {
      if (user.kycDocuments.length > 0) {
        const docNumbers = user.kycDocuments
          .filter((doc: any) => doc.documentNumber)
          .map((doc: any) => doc.documentNumber);

        if (docNumbers.length > 0) {
          // Use raw query to avoid Prisma type issues with documentNumber field
          const duplicateDocs: any[] = await prisma.$queryRaw`
            SELECT kd.*, u.id as user_id, u.full_name
            FROM kyc_documents kd
            JOIN users u ON kd.user_id = u.id
            WHERE kd.document_number = ANY(${docNumbers}::text[])
            AND kd.user_id != ${userId}
          `;

          for (const doc of duplicateDocs) {
            matches.push({
              type: 'DOCUMENT',
              matchedUserId: doc.user_id,
              matchedUserName: doc.full_name,
              score: 15,
              value: doc.document_number || undefined
            });
            totalScore += 15;
            factors.push({ type: 'DOCUMENT_DUPLICATE', score: 15, value: doc.document_number });
          }
        }
      }
    } catch (error) {
      // Continue with other checks
    }

    // Check for duplicate email
    if (user.email) {
      const duplicateEmails = await prisma.user.findMany({
        where: {
          email: user.email,
          id: { not: userId }
        },
        select: { id: true, fullName: true }
      });

      for (const match of duplicateEmails) {
        matches.push({
          type: 'EMAIL',
          matchedUserId: match.id,
          matchedUserName: match.fullName,
          score: 5,
          value: user.email
        });
        totalScore += 5;
        factors.push({ type: 'EMAIL_DUPLICATE', score: 5, value: user.email });
      }
    }

    // Check for duplicate phone
    if (user.phone) {
      const duplicatePhones = await prisma.user.findMany({
        where: {
          phone: user.phone,
          id: { not: userId }
        },
        select: { id: true, fullName: true }
      });

      for (const match of duplicatePhones) {
        matches.push({
          type: 'PHONE',
          matchedUserId: match.id,
          matchedUserName: match.fullName,
          score: 5,
          value: user.phone
        });
        totalScore += 5;
        factors.push({ type: 'PHONE_DUPLICATE', score: 5, value: user.phone });
      }
    }

    // Check nationality mismatch
    if (user.nationality && user.country && user.nationality !== user.country) {
      totalScore += 10;
      factors.push({ type: 'NATIONALITY_MISMATCH', score: 10 });
    }

    const finalScore = Math.min(totalScore, 100);
    const riskLevel = this.calculateRiskLevel(finalScore);

    // Store fraud matches in database
    await this.storeFraudMatches(userId, matches);

    // Store fraud score history
    await this.storeFraudScore(userId, finalScore, riskLevel, factors, calculatedBy);

    // Update user's current fraud score
    await this.updateUserFraudScore(userId, finalScore, riskLevel);

    return {
      totalScore: finalScore,
      matches
    };
  }

  private calculateRiskLevel(score: number): string {
    if (score >= 100) return 'CRITICAL';
    if (score >= 71) return 'HIGH';
    if (score >= 31) return 'MEDIUM';
    return 'LOW';
  }

  private async storeFraudScore(
    userId: number,
    score: number,
    riskLevel: string,
    factors: any[],
    calculatedBy?: number
  ): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO fraud_scores (user_id, score, risk_level, factors, calculated_by, created_at)
        VALUES (${userId}, ${score}, ${riskLevel}, ${JSON.stringify(factors)}::jsonb, ${calculatedBy || null}, NOW())
      `;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[FraudDetection] fraud_scores table not found - skipping score storage');
        return;
      }
      console.error('[FraudDetection] Error storing fraud score:', error);
    }
  }

  private async updateUserFraudScore(userId: number, score: number, riskLevel: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE users
        SET fraud_score = ${score}, risk_level = ${riskLevel}
        WHERE id = ${userId}
      `;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[FraudDetection] fraud_score column not found - skipping user update');
        return;
      }
      console.error('[FraudDetection] Error updating user fraud score:', error);
    }
  }

  async getFraudScoreHistory(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const history = await prisma.$queryRaw`
        SELECT fs.*, u.full_name as calculated_by_name
        FROM fraud_scores fs
        LEFT JOIN users u ON fs.calculated_by = u.id
        WHERE fs.user_id = ${userId}
        ORDER BY fs.created_at DESC
        LIMIT ${limit}
      `;
      return history as any[];
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[FraudDetection] fraud_scores table not found - returning empty history');
        return [];
      }
      throw error;
    }
  }

  private async storeFraudMatches(userId: number, matches: FraudScore['matches']) {
    // Delete old unresolved matches for this user
    await (prisma as any).fraudMatch.deleteMany({
      where: { userId, isResolved: false }
    });

    // Create new matches
    for (const match of matches) {
      await (prisma as any).fraudMatch.create({
        data: {
          userId,
          matchedUserId: match.matchedUserId,
          matchType: match.type,
          matchValue: match.value,
          score: match.score
        }
      });
    }
  }

  async getFraudMatches(userId: number) {
    return (prisma as any).fraudMatch.findMany({
      where: { userId, isResolved: false },
      include: {
        matchedUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            country: true,
            kycStatus: true
          }
        }
      },
      orderBy: { score: 'desc' }
    });
  }

  async resolveFraudMatch(matchId: number, adminId: number) {
    return (prisma as any).fraudMatch.update({
      where: { id: matchId },
      data: {
        isResolved: true,
        resolvedBy: adminId,
        resolvedAt: new Date()
      }
    });
  }
}

export default new FraudDetectionService();
