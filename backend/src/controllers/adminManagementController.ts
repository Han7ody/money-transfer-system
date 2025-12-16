import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendSuccess, sendError } from '../utils/response';
import { logAdminAction } from '../utils/auditLogger';
import { CredentialGenerator } from '../utils/credentialGenerator';

const prisma = new PrismaClient();

export class AdminManagementController {
  async getAllAdmins(req: Request, res: Response): Promise<void> {
    try {
      const admins = await prisma.$queryRaw`
        SELECT 
          id, 
          email as username,
          full_name,
          email,
          phone,
          role,
          is_active,
          created_at,
          updated_at
        FROM users
        WHERE role IN ('ADMIN', 'SUPER_ADMIN', 'COMPLIANCE', 'SUPPORT')
        ORDER BY created_at DESC
      `;

      sendSuccess(res, { admins });
    } catch (error: any) {
      console.error('[AdminManagement] Error getting admins:', error);
      console.error('[AdminManagement] Error details:', error.message, error.code);
      sendError(res, error.message || 'Failed to retrieve admins');
    }
  }

  async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, email, phone, role, username, password, isActive = true } = req.body;
      const user = (req as any).user;

      if (!fullName || !email || !role) {
        return sendError(res, 'Full name, email, and role are required', 400);
      }

      const generatedUsername = username || email;
      const generatedPassword = password || CredentialGenerator.generatePassword();
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      const admin = await prisma.$queryRaw<any[]>`
        INSERT INTO users (
          password_hash, full_name, email, phone, role, is_active, country, created_at
        )
        VALUES (
          ${hashedPassword},
          ${fullName},
          ${email},
          ${phone || null},
          ${role}::user_role,
          ${isActive},
          'SA',
          NOW()
        )
        RETURNING id, email as username, full_name, email, phone, role, is_active, created_at
      `;

      await logAdminAction({
        adminId: user.userId,
        action: 'CREATE_ADMIN',
        entity: 'User',
        entityId: String(admin[0].id),
        newValue: { username: generatedUsername, role, email },
        req
      });

      sendSuccess(res, {
        admin: admin[0],
        credentials: { username: generatedUsername, password: generatedPassword }
      }, 'Admin created successfully');
    } catch (error: any) {
      console.error('[AdminManagement] Error creating admin:', error);
      if (error.code === '23505') {
        return sendError(res, 'Username or email already exists', 400);
      }
      sendError(res, 'Failed to create admin');
    }
  }

  async updateAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { fullName, email, phone, role, isActive } = req.body;
      const user = (req as any).user;

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (fullName) {
        updates.push(`full_name = $${paramIndex++}`);
        params.push(fullName);
      }
      if (email) {
        updates.push(`email = $${paramIndex++}`);
        params.push(email);
      }
      if (phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        params.push(phone);
      }
      if (role) {
        updates.push(`role = $${paramIndex++}::user_role`);
        params.push(role);
      }
      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        params.push(isActive);
      }

      if (updates.length === 0) {
        return sendError(res, 'No fields to update', 400);
      }

      updates.push(`updated_at = NOW()`);
      params.push(Number(id));

      await prisma.$queryRawUnsafe(`
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
      `, ...params);

      await logAdminAction({
        adminId: user.userId,
        action: 'UPDATE_ADMIN',
        entity: 'User',
        entityId: id,
        newValue: { fullName, email, phone, role, isActive },
        req
      });

      sendSuccess(res, null, 'Admin updated successfully');
    } catch (error) {
      console.error('[AdminManagement] Error updating admin:', error);
      sendError(res, 'Failed to update admin');
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = (req as any).user;

      const newPassword = CredentialGenerator.generatePassword();
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.$executeRaw`
        UPDATE users
        SET password_hash = ${hashedPassword}, updated_at = NOW()
        WHERE id = ${Number(id)}
      `;

      await prisma.$executeRaw`
        INSERT INTO password_reset_history (user_id, reset_by, reason, reset_type)
        VALUES (${Number(id)}, ${user.userId}, ${reason || 'Admin reset'}, 'ADMIN_RESET')
      `;

      await logAdminAction({
        adminId: user.userId,
        action: 'RESET_PASSWORD',
        entity: 'User',
        entityId: id,
        newValue: { reason },
        req
      });

      sendSuccess(res, { newPassword }, 'Password reset successfully');
    } catch (error) {
      console.error('[AdminManagement] Error resetting password:', error);
      sendError(res, 'Failed to reset password');
    }
  }

  async suspendAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = (req as any).user;

      await prisma.$executeRaw`
        UPDATE users
        SET is_active = false, updated_at = NOW()
        WHERE id = ${Number(id)}
      `;

      await logAdminAction({
        adminId: user.userId,
        action: 'SUSPEND_ADMIN',
        entity: 'User',
        entityId: id,
        newValue: { reason },
        req
      });

      sendSuccess(res, null, 'Admin suspended successfully');
    } catch (error) {
      console.error('[AdminManagement] Error suspending admin:', error);
      sendError(res, 'Failed to suspend admin');
    }
  }

  async activateAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      await prisma.$executeRaw`
        UPDATE users
        SET is_active = true, updated_at = NOW()
        WHERE id = ${Number(id)}
      `;

      await logAdminAction({
        adminId: user.userId,
        action: 'ACTIVATE_ADMIN',
        entity: 'User',
        entityId: id,
        req
      });

      sendSuccess(res, null, 'Admin activated successfully');
    } catch (error) {
      console.error('[AdminManagement] Error activating admin:', error);
      sendError(res, 'Failed to activate admin');
    }
  }

  async generateCredentials(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.query;
      
      const username = type === 'agent' 
        ? await CredentialGenerator.generateAgentUsername(prisma)
        : await CredentialGenerator.generateAdminUsername(prisma);
      
      const password = CredentialGenerator.generatePassword();

      sendSuccess(res, { username, password });
    } catch (error) {
      console.error('[AdminManagement] Error generating credentials:', error);
      sendError(res, 'Failed to generate credentials');
    }
  }
}

export default new AdminManagementController();
