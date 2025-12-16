import { Request, Response, NextFunction } from 'express';
import PermissionService from '../services/PermissionService';
import { sendError } from '../utils/response';

/**
 * Middleware to check if admin has required permission
 */
export function requirePermission(permissionCode: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      // Check if user is authenticated
      if (!user) {
        return sendError(res, 'Authentication required', 401);
      }

      // If user has permissions array in token (from admin login)
      if (user.permissions && Array.isArray(user.permissions)) {
        if (user.permissions.includes(permissionCode)) {
          return next();
        }
        return sendError(res, 'Insufficient permissions', 403);
      }

      // If adminId exists, check from database
      if (user.adminId) {
        const hasPermission = await PermissionService.hasPermission(user.adminId, permissionCode);
        
        if (hasPermission) {
          return next();
        }
        
        return sendError(res, 'Insufficient permissions', 403);
      }

      // Fallback for old user system (temporary compatibility)
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        return next();
      }

      return sendError(res, 'Insufficient permissions', 403);
    } catch (error) {
      console.error('[RBAC] Permission check error:', error);
      return sendError(res, 'Permission check failed', 500);
    }
  };
}

/**
 * Middleware to check if admin has any of the required permissions
 */
export function requireAnyPermission(permissionCodes: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return sendError(res, 'Authentication required', 401);
      }

      // Check from token permissions
      if (user.permissions && Array.isArray(user.permissions)) {
        const hasAny = permissionCodes.some(code => user.permissions.includes(code));
        if (hasAny) {
          return next();
        }
        return sendError(res, 'Insufficient permissions', 403);
      }

      // Check from database
      if (user.adminId) {
        const hasAny = await PermissionService.hasAnyPermission(user.adminId, permissionCodes);
        
        if (hasAny) {
          return next();
        }
        
        return sendError(res, 'Insufficient permissions', 403);
      }

      // Fallback
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        return next();
      }

      return sendError(res, 'Insufficient permissions', 403);
    } catch (error) {
      console.error('[RBAC] Permission check error:', error);
      return sendError(res, 'Permission check failed', 500);
    }
  };
}

/**
 * Middleware to check if user is admin (any admin role)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user) {
    return sendError(res, 'Authentication required', 401);
  }

  // Check if adminId exists (new admin system)
  if (user.adminId) {
    return next();
  }

  // Fallback to old system
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'SUPPORT' || user.role === 'COMPLIANCE') {
    return next();
  }

  return sendError(res, 'Admin access required', 403);
}

/**
 * Middleware to check if user is super admin
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user) {
    return sendError(res, 'Authentication required', 401);
  }

  // Check from token
  if (user.roleName === 'SUPER_ADMIN') {
    return next();
  }

  // Fallback
  if (user.role === 'SUPER_ADMIN') {
    return next();
  }

  return sendError(res, 'Super admin access required', 403);
}
