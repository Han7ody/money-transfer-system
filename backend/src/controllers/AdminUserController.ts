import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import AdminUserService from '../services/AdminUserService';
import { sendSuccess, sendError } from '../utils/response';
import { CredentialGenerator } from '../utils/credentialGenerator';

const prisma = new PrismaClient();

export class AdminUserController {
  /**
   * Create admin user
   */
  async createAdmin(req: Request, res: Response) {
    try {
      const { username, fullName, email, roleId, password } = req.body;
      const createdBy = (req as any).user?.adminId || (req as any).user?.userId;

      if (!fullName || !roleId) {
        return sendError(res, 'Full name and role ID are required', 400);
      }

      const result = await AdminUserService.createAdminUser({
        username,
        fullName,
        email,
        roleId: Number(roleId),
        password,
        createdBy
      });

      sendSuccess(res, result, 'Admin user created successfully', 201);
    } catch (error: any) {
      console.error('[AdminUserController] Create error:', error);
      sendError(res, error.message || 'Failed to create admin user');
    }
  }

  /**
   * List admins
   */
  async listAdmins(req: Request, res: Response) {
    try {
      const { roleId, status, search, page, limit } = req.query;

      const result = await AdminUserService.listAdmins({
        roleId: roleId ? Number(roleId) : undefined,
        status: status as string,
        search: search as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20
      });

      sendSuccess(res, result);
    } catch (error: any) {
      console.error('[AdminUserController] List error:', error);
      sendError(res, error.message || 'Failed to list admins');
    }
  }

  /**
   * Get admin by ID
   */
  async getAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const admin = await prisma.$queryRaw<any[]>`
        SELECT 
          au.id,
          au.username,
          au.full_name,
          au.email,
          au.role_id,
          ar.role_name,
          au.status,
          au.last_login_at,
          au.created_at,
          au.updated_at
        FROM admin_users au
        JOIN admin_roles ar ON au.role_id = ar.id
        WHERE au.id = ${Number(id)}
      `;

      if (admin.length === 0) {
        return sendError(res, 'Admin not found', 404);
      }

      sendSuccess(res, { admin: admin[0] });
    } catch (error: any) {
      console.error('[AdminUserController] Get error:', error);
      sendError(res, error.message || 'Failed to get admin');
    }
  }

  /**
   * Update admin
   */
  async updateAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { fullName, email, roleId } = req.body;
      const updatedBy = (req as any).user?.adminId || (req as any).user?.userId;

      await AdminUserService.updateAdminUser(
        Number(id),
        { fullName, email, roleId: roleId ? Number(roleId) : undefined },
        updatedBy
      );

      sendSuccess(res, null, 'Admin updated successfully');
    } catch (error: any) {
      console.error('[AdminUserController] Update error:', error);
      sendError(res, error.message || 'Failed to update admin');
    }
  }

  /**
   * Suspend admin
   */
  async suspendAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const suspendedBy = (req as any).user?.adminId || (req as any).user?.userId;

      // Validate reason is provided
      if (!reason || reason.trim().length === 0) {
        return sendError(res, 'Suspension reason is required', 400);
      }

      await AdminUserService.suspendAdmin(Number(id), reason, suspendedBy);

      // Audit log
      const { logAdminAction } = await import('../utils/auditLogger');
      await logAdminAction({
        adminId: suspendedBy,
        action: 'ADMIN_SUSPEND',
        entity: 'Admin',
        entityId: id,
        newValue: { reason },
        req
      });

      sendSuccess(res, null, 'Admin suspended successfully');
    } catch (error: any) {
      console.error('[AdminUserController] Suspend error:', error);
      sendError(res, error.message || 'Failed to suspend admin');
    }
  }

  /**
   * Activate admin
   */
  async activateAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const activatedBy = (req as any).user?.adminId || (req as any).user?.userId;

      await AdminUserService.activateAdmin(Number(id), activatedBy);

      // Audit log
      const { logAdminAction } = await import('../utils/auditLogger');
      await logAdminAction({
        adminId: activatedBy,
        action: 'ADMIN_ACTIVATE',
        entity: 'Admin',
        entityId: id,
        req
      });

      sendSuccess(res, null, 'Admin activated successfully');
    } catch (error: any) {
      console.error('[AdminUserController] Activate error:', error);
      sendError(res, error.message || 'Failed to activate admin');
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const resetBy = (req as any).user?.adminId || (req as any).user?.userId;

      const newPassword = await AdminUserService.resetPassword(
        Number(id),
        reason || 'Admin reset',
        resetBy
      );

      sendSuccess(res, { newPassword }, 'Password reset successfully');
    } catch (error: any) {
      console.error('[AdminUserController] Reset password error:', error);
      sendError(res, error.message || 'Failed to reset password');
    }
  }

  /**
   * Admin login
   */
  async login(req: Request, res: Response) {
    try {
      // Support both 'username' and 'email' field names for backward compatibility
      const { username, email, password } = req.body;
      const loginIdentifier = username || email;

      if (!loginIdentifier || !password) {
        return sendError(res, 'Username/email and password are required', 400);
      }

      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await AdminUserService.authenticateAdminLogin(loginIdentifier, password, ipAddress);

      sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      console.error('[AdminUserController] Login error:', error);
      sendError(res, error.message || 'Login failed', 401);
    }
  }

  /**
   * Get current admin profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.adminId;

      if (!adminId) {
        return sendError(res, 'Not authenticated', 401);
      }

      const permissions = await AdminUserService.getAdminPermissions(adminId);

      const admin = await prisma.$queryRaw<any[]>`
        SELECT 
          au.id,
          au.username,
          au.full_name,
          au.email,
          au.role_id,
          ar.role_name,
          au.status,
          au.last_login_at
        FROM admin_users au
        JOIN admin_roles ar ON au.role_id = ar.id
        WHERE au.id = ${adminId}
      `;

      if (admin.length === 0) {
        return sendError(res, 'Admin not found', 404);
      }

      sendSuccess(res, {
        admin: admin[0],
        permissions: permissions.map(p => p.code)
      });
    } catch (error: any) {
      console.error('[AdminUserController] Get profile error:', error);
      sendError(res, error.message || 'Failed to get profile');
    }
  }

  /**
   * Generate credentials
   */
  async generateCredentials(req: Request, res: Response) {
    try {
      const { type } = req.query;
      
      // Generate username based on type
      const username = type === 'agent' 
        ? await CredentialGenerator.generateAgentUsername(prisma)
        : await CredentialGenerator.generateAdminUsername(prisma);
      
      const password = CredentialGenerator.generatePassword();

      sendSuccess(res, { username, password });
    } catch (error: any) {
      console.error('[AdminUserController] Generate credentials error:', error);
      sendError(res, error.message || 'Failed to generate credentials');
    }
  }
}

export default new AdminUserController();
