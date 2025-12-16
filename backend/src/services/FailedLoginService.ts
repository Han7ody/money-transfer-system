import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export class FailedLoginService {
  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    reason: string = 'Invalid credentials'
  ): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO failed_login_attempts (email, ip_address, user_agent, reason, attempt_time)
      VALUES (${email}, ${ipAddress}, ${userAgent}, ${reason}, NOW())
    `;
  }

  /**
   * Check if account is locked due to failed attempts
   */
  async isAccountLocked(email: string): Promise<boolean> {
    const lockoutTime = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000);

    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM failed_login_attempts
      WHERE email = ${email}
        AND attempt_time > ${lockoutTime}
    `;

    const failedAttempts = Number(result[0].count);
    return failedAttempts >= MAX_FAILED_ATTEMPTS;
  }

  /**
   * Get remaining lockout time in minutes
   */
  async getRemainingLockoutTime(email: string): Promise<number> {
    const lockoutTime = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000);

    const result = await prisma.$queryRaw<Array<{ latest_attempt: Date }>>`
      SELECT MAX(attempt_time) as latest_attempt
      FROM failed_login_attempts
      WHERE email = ${email}
        AND attempt_time > ${lockoutTime}
    `;

    if (result.length === 0 || !result[0].latest_attempt) {
      return 0;
    }

    const latestAttempt = new Date(result[0].latest_attempt);
    const unlockTime = new Date(latestAttempt.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    const remainingMs = unlockTime.getTime() - Date.now();

    return Math.ceil(remainingMs / 60000); // Convert to minutes
  }

  /**
   * Clear failed attempts for an email (after successful login)
   */
  async clearFailedAttempts(email: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM failed_login_attempts
      WHERE email = ${email}
    `;
  }

  /**
   * Get failed login attempts for monitoring
   */
  async getRecentFailedAttempts(limit: number = 100): Promise<any[]> {
    return prisma.$queryRaw`
      SELECT 
        email,
        ip_address,
        user_agent,
        reason,
        attempt_time
      FROM failed_login_attempts
      ORDER BY attempt_time DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Get failed attempts count by email
   */
  async getFailedAttemptsCount(email: string): Promise<number> {
    const lockoutTime = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000);

    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM failed_login_attempts
      WHERE email = ${email}
        AND attempt_time > ${lockoutTime}
    `;

    return Number(result[0].count);
  }

  /**
   * Clean up old failed attempts (older than 30 days)
   */
  async cleanupOldAttempts(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await prisma.$executeRaw`
      DELETE FROM failed_login_attempts
      WHERE attempt_time < ${thirtyDaysAgo}
    `;
  }
}

export const failedLoginService = new FailedLoginService();
