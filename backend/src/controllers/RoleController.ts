import { Request, Response } from 'express';
import RoleService from '../services/RoleService';
import PermissionService from '../services/PermissionService';
import { sendSuccess, sendError } from '../utils/response';

export class RoleController {
  /**
   * List all roles with their permissions
   */
  async listRoles(req: Request, res: Response) {
    try {
      const rolesData = await RoleService.listRoles();
      const allPermissions = await PermissionService.listPermissions();
      
      // Format roles with permissions for frontend
      const roles = await Promise.all(rolesData.map(async (role: any) => {
        const rolePermissions = await RoleService.getRolePermissions(role.id);
        const rolePermissionCodes = rolePermissions.map((p: any) => p.code);
        
        return {
          role: role.role_name,
          permissions: allPermissions.permissions.map((p: any) => ({
            permission: p.code,
            enabled: rolePermissionCodes.includes(p.code)
          }))
        };
      }));
      
      sendSuccess(res, { roles });
    } catch (error: any) {
      console.error('[RoleController] List error:', error);
      sendError(res, error.message || 'Failed to list roles');
    }
  }

  /**
   * Get role by ID
   */
  async getRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const role = await RoleService.getRoleById(Number(id));
      const permissions = await RoleService.getRolePermissions(Number(id));

      sendSuccess(res, { role, permissions });
    } catch (error: any) {
      console.error('[RoleController] Get error:', error);
      sendError(res, error.message || 'Failed to get role');
    }
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const permissions = await RoleService.getRolePermissions(Number(id));

      sendSuccess(res, { permissions });
    } catch (error: any) {
      console.error('[RoleController] Get permissions error:', error);
      sendError(res, error.message || 'Failed to get role permissions');
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(req: Request, res: Response) {
    try {
      const roleName = req.params.id; // Actually role name from frontend
      const { permissions } = req.body;
      const updatedBy = (req as any).user?.adminId || (req as any).user?.userId;

      // Get role by name
      const roles = await RoleService.listRoles();
      const role = roles.find((r: any) => r.role_name === roleName);
      
      if (!role) {
        return sendError(res, 'Role not found', 404);
      }

      // Get all permissions to map codes to IDs
      const allPermissions = await PermissionService.listPermissions();
      
      // Filter enabled permissions and get their IDs
      const enabledPermissionCodes = permissions
        .filter((p: any) => p.enabled)
        .map((p: any) => p.permission);
      
      const permissionIds = allPermissions.permissions
        .filter((p: any) => enabledPermissionCodes.includes(p.code))
        .map((p: any) => p.id);

      await RoleService.updateRolePermissions(role.id, permissionIds, updatedBy);

      sendSuccess(res, null, 'Role permissions updated successfully');
    } catch (error: any) {
      console.error('[RoleController] Update permissions error:', error);
      sendError(res, error.message || 'Failed to update role permissions');
    }
  }

  /**
   * Create role
   */
  async createRole(req: Request, res: Response) {
    try {
      const { roleName, permissionIds } = req.body;
      const createdBy = (req as any).user?.adminId || (req as any).user?.userId;

      if (!roleName) {
        return sendError(res, 'Role name is required', 400);
      }

      const role = await RoleService.createRole(
        roleName,
        permissionIds || [],
        createdBy
      );

      sendSuccess(res, { role }, 'Role created successfully', 201);
    } catch (error: any) {
      console.error('[RoleController] Create error:', error);
      sendError(res, error.message || 'Failed to create role');
    }
  }

  /**
   * Delete role
   */
  async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedBy = (req as any).user?.adminId || (req as any).user?.userId;

      await RoleService.deleteRole(Number(id), deletedBy);

      sendSuccess(res, null, 'Role deleted successfully');
    } catch (error: any) {
      console.error('[RoleController] Delete error:', error);
      sendError(res, error.message || 'Failed to delete role');
    }
  }

  /**
   * List all permissions
   */
  async listPermissions(req: Request, res: Response) {
    try {
      const result = await PermissionService.listPermissions();
      sendSuccess(res, result);
    } catch (error: any) {
      console.error('[RoleController] List permissions error:', error);
      sendError(res, error.message || 'Failed to list permissions');
    }
  }
}

export default new RoleController();
