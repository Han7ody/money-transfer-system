import { Permission, RolePermissions } from './permissions';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response';

export class PermissionService {
  hasPermission(role: string, permission: Permission): boolean {
    const rolePermissions = RolePermissions[role] || [];
    return rolePermissions.includes(permission);
  }

  getRolePermissions(role: string): Permission[] {
    return RolePermissions[role] || [];
  }

  checkPermission(permission: Permission) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      
      if (!user) {
        return sendError(res, 'Unauthorized', 401);
      }

      if (!this.hasPermission(user.role, permission)) {
        return sendError(res, 'Insufficient permissions', 403);
      }

      next();
    };
  }

  checkAnyPermission(permissions: Permission[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      
      if (!user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const hasAnyPermission = permissions.some(permission => 
        this.hasPermission(user.role, permission)
      );

      if (!hasAnyPermission) {
        return sendError(res, 'Insufficient permissions', 403);
      }

      next();
    };
  }
}

export const permissionService = new PermissionService();
