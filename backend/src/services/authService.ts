// backend/src/services/authService.ts
/**
 * Authentication Service
 * Handles all authentication-related business logic
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { ValidationError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { sendVerificationOtpEmail, sendPasswordResetEmail } from '../utils/email';
import { generateToken } from '../middleware/auth';
import { loginPipeline } from '../pipelines/loginPipeline';
import { Request } from 'express';
import { sessionService } from './SessionService';
import { failedLoginService } from './FailedLoginService';
import { ipWhitelistService } from './IPWhitelistService';

export class AuthService {
  /**
   * Change user password
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current and new passwords are required');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid current password');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });
  }

  /**
   * Generate and send verification OTP
   */
  async sendVerificationOtp(userId: number): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: userId },
      data: { verificationOtp: otp, verificationOtpExpiresAt: expiresAt }
    });

    await sendVerificationOtpEmail(user.email, otp);
    return user.email;
  }

  /**
   * Verify OTP
   */
  async verifyOtp(userId: number, otp: string): Promise<void> {
    if (!otp) {
      throw new ValidationError('OTP is required');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.verificationOtp || !user.verificationOtpExpiresAt) {
      throw new ValidationError('No pending verification found');
    }

    if (user.verificationOtpExpiresAt < new Date()) {
      throw new ValidationError('OTP has expired. Please request a new one');
    }

    if (user.verificationOtp !== otp) {
      throw new ValidationError('Invalid OTP');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, verificationOtp: null, verificationOtpExpiresAt: null }
    });
  }

  /**
   * Initiate password reset
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken, passwordResetTokenExpiresAt }
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      // Don't throw - we don't want to reveal if email exists
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || !newPassword) {
      throw new ValidationError('Token and new password are required');
    }

    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken,
        passwordResetTokenExpiresAt: { gt: new Date() }
      }
    });

    if (!user) {
      throw new ValidationError('Invalid or expired password reset token');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null
      }
    });
  }

  /**
   * Login user - Uses authentication pipeline with security enhancements
   */
  async login(email: string, password: string, req: Request, twoFactorToken?: string): Promise<{ user: any; token: string; requires2FA?: boolean }> {
    const ipAddress = ipWhitelistService.extractIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Check if account is locked
    const isLocked = await failedLoginService.isAccountLocked(email);
    if (isLocked) {
      const remainingTime = await failedLoginService.getRemainingLockoutTime(email);
      throw new UnauthorizedError(
        `Account temporarily locked due to multiple failed login attempts. Try again in ${remainingTime} minutes.`
      );
    }

    try {
      const result = await loginPipeline.execute(
        { email, password, twoFactorToken },
        req
      );

      // Clear failed attempts on successful login
      await failedLoginService.clearFailedAttempts(email);

      // Create session for admin users
      if (result.user.role === 'ADMIN' || result.user.role === 'SUPER_ADMIN' || result.user.role === 'COMPLIANCE_OFFICER') {
        const sessionToken = await sessionService.createSession(
          result.user.id,
          result.user.email,
          result.user.role,
          ipAddress,
          userAgent
        );
        
        // Return session token instead of regular JWT for admin users
        return {
          ...result,
          token: sessionToken
        };
      }

      return result;
    } catch (error) {
      // Record failed login attempt
      await failedLoginService.recordFailedAttempt(
        email,
        ipAddress,
        userAgent,
        error instanceof Error ? error.message : 'Login failed'
      );

      throw error;
    }
  }

  /**
   * Legacy login method (deprecated - kept for backward compatibility)
   */
  async loginLegacy(email: string, password: string): Promise<{ user: any; token: string }> {
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        kycStatus: user.kycStatus
      },
      token
    };
  }
}

export default new AuthService();
