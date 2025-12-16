import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Request } from 'express';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars';
const SESSION_TIMEOUT_MINUTES = 30;

export interface SessionData {
  userId: number;
  email: string;
  role: string;
  sessionId: string;
}

export class SessionService {
  /**
   * Create a new session
   */
  async createSession(
    userId: number,
    email: string,
    role: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    const sessionToken = this.generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);

    // Store session in database
    await prisma.$executeRaw`
      INSERT INTO admin_sessions (user_id, session_token, ip_address, user_agent, last_activity, expires_at, is_active)
      VALUES (${userId}, ${sessionToken}, ${ipAddress}, ${userAgent}, NOW(), ${expiresAt}, true)
      ON CONFLICT (session_token) DO UPDATE
      SET last_activity = NOW(), expires_at = ${expiresAt}, is_active = true
    `;

    // Generate JWT with session ID
    const token = jwt.sign(
      {
        userId,
        email,
        role,
        sessionId: sessionToken,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '7d' } // JWT valid for 7 days, but session timeout is 30 min
    );

    return token;
  }

  /**
   * Validate and refresh session
   */
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const result = await prisma.$queryRaw<Array<{ is_active: boolean; expires_at: Date }>>`
        SELECT is_active, expires_at
        FROM admin_sessions
        WHERE session_token = ${sessionId}
        LIMIT 1
      `;

      if (result.length === 0) {
        return false;
      }

      const session = result[0];
      
      // Check if session is active and not expired
      if (!session.is_active || new Date() > new Date(session.expires_at)) {
        return false;
      }

      return true;
    } catch (error: any) {
      // If table doesn't exist, allow access (graceful degradation)
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[SessionService] admin_sessions table not found - allowing access');
        return true;
      }
      throw error;
    }
  }

  /**
   * Update session activity
   */
  async updateActivity(sessionId: string): Promise<void> {
    try {
      const newExpiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);
      
      await prisma.$executeRaw`
        UPDATE admin_sessions
        SET last_activity = NOW(), expires_at = ${newExpiresAt}
        WHERE session_token = ${sessionId} AND is_active = true
      `;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[SessionService] admin_sessions table not found - skipping activity update');
        return;
      }
      throw error;
    }
  }

  /**
   * Revoke session (logout)
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE admin_sessions
        SET is_active = false
        WHERE session_token = ${sessionId}
      `;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[SessionService] admin_sessions table not found - skipping session revocation');
        return;
      }
      throw error;
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: number): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE admin_sessions
        SET is_active = false
        WHERE user_id = ${userId}
      `;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[SessionService] admin_sessions table not found - skipping session revocation');
        return;
      }
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE admin_sessions
        SET is_active = false
        WHERE expires_at < NOW() AND is_active = true
      `;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[SessionService] admin_sessions table not found - skipping cleanup');
        return;
      }
      throw error;
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: number): Promise<any[]> {
    try {
      return await prisma.$queryRaw`
        SELECT id, ip_address, user_agent, last_activity, expires_at, created_at
        FROM admin_sessions
        WHERE user_id = ${userId} AND is_active = true
        ORDER BY last_activity DESC
      `;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[SessionService] admin_sessions table not found - returning empty list');
        return [];
      }
      throw error;
    }
  }

  /**
   * Extract session info from request
   */
  extractSessionFromRequest(req: Request): SessionData | null {
    const user = (req as any).user;
    if (!user) return null;

    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
      sessionId: user.sessionId
    };
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

export const sessionService = new SessionService();
