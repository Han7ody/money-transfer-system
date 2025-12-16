import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { logAdminAction } from '../utils/auditLogger';

const prisma = new PrismaClient();

export class RoleManagementController {
  async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await prisma.$queryRaw`
        SELECT DISTINCT role
        FROM role_permissions
        ORDER BY role
      `;

      const rolesWithPermissions = await Promise.all(
        roles.map(async (r: any) => {
          const permissions = await prisma.$queryRaw`
            SELECT permission, enabled
            FROM role_permissions
            WHERE role = ${r.role}
            ORDER BY permission
          `;
          return {
            role: r.role,
            permissions
          };
        })
      );

      sendSuccess(res, { roles: rolesWithPermissions });
    } catch (error) {
      console.error('[RoleManagement] Error getting roles:', error);
      sendError(res, 'Failed to retrieve roles');
    }
  }

  async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.params;

      const permissions = await prisma.$queryRaw`
        SELECT id, permission, enabled, created_at, updated_at
        FROM role_permissions
        WHERE role = ${role}
        ORDER BY permission
      `;

      sendSuccess(res, { role, permissions });
    } catch (error) {
      console.error('[RoleManagement] Error getting role permissions:', error);
      sendError(res, 'Failed to retrieve role permissions');
    }
  }

  async updateRolePermission(req: Request, res: Response): Promise<void> {
    try {
      const { role, permission } = req.params;
      const { enabled } = req.body;
      const user = (req as any).user;

      if (enabled === undefined) {
        return sendError(res, 'Enabled status is required', 400);
      }

      await prisma.$executeRaw`
        UPDATE role_permissions
        SET enabled = ${enabled}, updated_at = NOW()
        WHERE role = ${role} AND permission = ${permission}
      `;

      await logAdminAction({
        adminId: user.userId,
        action: 'UPDATE_ROLE_PERMISSION',
        entity: 'RolePermission',
        entityId: `${role}:${permission}`,
        newValue: { enabled },
        req
      });

      sendSuccess(res, null, 'Permission updated successfully');
    } catch (error) {
      console.error('[RoleManagement] Error updating permission:', error);
      sendError(res, 'Failed to update permission');
    }
  }

  async bulkUpdatePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.params;
      const { permissions } = req.body;
      const user = (req as any).user;

      if (!Array.isArray(permissions)) {
        return sendError(res, 'Permissions must be an array', 400);
      }

      for (const perm of permissions) {
        await prisma.$executeRaw`
          UPDATE role_permissions
          SET enabled = ${perm.enabled}, updated_at = NOW()
          WHERE role = ${role} AND permission = ${perm.permission}
        `;
      }

      await logAdminAction({
        adminId: user.userId,
        action: 'BULK_UPDATE_PERMISSIONS',
        entity: 'RolePermission',
        entityId: role,
        newValue: { count: permissions.length },
        req
      });

      sendSuccess(res, null, 'Permissions updated successfully');
    } catch (error) {
      console.error('[RoleManagement] Error bulk updating permissions:', error);
      sendError(res, 'Failed to update permissions');
    }
  }
}

export default new RoleManagementController();
