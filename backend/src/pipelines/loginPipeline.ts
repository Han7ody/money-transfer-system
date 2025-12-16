import { Request } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { ValidationError, UnauthorizedError } from '../utils/errors';

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorToken?: string;
}

export interface LoginResult {
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  token: string;
  requires2FA: boolean;
}

/**
 * Login Pipeline - Orchestrates the complete authentication flow
 * 
 * SEQUENCE:
 * 1. Rate limit check (handled by middleware before this)
 * 2. Validate input credentials
 * 3. Find user by email
 * 4. Check if user is active
 * 5. Verify password
 * 6. Check 2FA requirement (if enabled)
 * 7. Generate JWT token
 * 8. Record login attempt (TODO: when loginHistoryService is ready)
 * 9. Register session (TODO: when sessionService is ready)
 * 10. Return success
 */
export class LoginPipeline {
  /**
   * Execute complete login pipeline
   */
  async execute(
    credentials: LoginCredentials,
    req: Request
  ): Promise<LoginResult> {
    let user: any = null;
    let loginStatus: 'success' | 'failed' | 'blocked' = 'failed';
    let failReason: string | undefined;

    try {
      // Step 1: Validate input
      this.validateInput(credentials);

      // Step 2: Find user
      user = await this.findUser(credentials.email);
      if (!user) {
        failReason = 'Invalid credentials';
        throw new UnauthorizedError('Invalid email or password');
      }

      // Step 3: Check if user is active
      if (!user.isActive) {
        loginStatus = 'blocked';
        failReason = 'Account is blocked';
        throw new UnauthorizedError('Your account has been blocked');
      }

      // Step 4: Verify password
      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.passwordHash
      );
      if (!isPasswordValid) {
        failReason = 'Invalid credentials';
        throw new UnauthorizedError('Invalid email or password');
      }

      // Step 5: Check 2FA requirement (placeholder for future implementation)
      // TODO: Implement 2FA check when 2FA system is ready
      // const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      //   where: { userId: user.id }
      // });
      // if (twoFactorAuth && twoFactorAuth.enabled) {
      //   if (!credentials.twoFactorToken) {
      //     return {
      //       user: {
      //         id: user.id,
      //         fullName: user.fullName,
      //         email: user.email,
      //         role: user.role
      //       },
      //       token: '',
      //       requires2FA: true
      //     };
      //   }
      //   // Verify 2FA token
      //   const isValid = await twoFactorService.verifyToken(
      //     user.id,
      //     credentials.twoFactorToken
      //   );
      //   if (!isValid) {
      //     throw new UnauthorizedError('Invalid 2FA token');
      //   }
      // }

      // Step 6: Generate JWT
      const token = this.generateJWT(user);

      // Step 7: Record successful login
      loginStatus = 'success';
      
      // TODO: Record login history when service is ready
      // await loginHistoryService.recordLogin({
      //   userId: user.id,
      //   ipAddress: req.ip,
      //   userAgent: req.headers['user-agent'],
      //   status: 'success',
      //   timestamp: new Date()
      // });

      // TODO: Register session when service is ready
      // await sessionService.createSession({
      //   userId: user.id,
      //   token: token,
      //   ipAddress: req.ip,
      //   userAgent: req.headers['user-agent'],
      //   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      // });

      // Step 8: Return success
      return {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        },
        token,
        requires2FA: false
      };

    } catch (error) {
      // TODO: Record failed login attempt when service is ready
      // if (user) {
      //   await loginHistoryService.recordLogin({
      //     userId: user.id,
      //     ipAddress: req.ip,
      //     userAgent: req.headers['user-agent'],
      //     status: loginStatus,
      //     failReason: failReason,
      //     timestamp: new Date()
      //   });
      // }

      throw error;
    }
  }

  private validateInput(credentials: LoginCredentials): void {
    if (!credentials.email || !credentials.password) {
      throw new ValidationError('Email and password are required');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  private async findUser(email: string): Promise<any> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
  }

  private generateJWT(user: any): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '7d'
    });
  }
}

export const loginPipeline = new LoginPipeline();
