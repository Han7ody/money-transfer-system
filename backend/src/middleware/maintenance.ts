import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth';

/**
 * Global Maintenance Mode Middleware
 * 
 * Rules:
 * - Reads maintenance_mode from SystemSettings (key = "maintenance_mode")
 * - If maintenance_mode = true AND user is NOT ADMIN/SUPER_ADMIN → Block access
 * - Returns 503 Service Unavailable for blocked users
 * - Allows ADMIN and SUPER_ADMIN to bypass maintenance
 */
export const maintenanceMode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get maintenance status from SystemSettings
    const maintenanceSetting = await prisma.systemSettings.findUnique({
      where: { key: 'maintenance_mode' }
    });

    const isMaintenanceMode = maintenanceSetting?.value === 'true';

    // If maintenance mode is OFF, allow all requests
    if (!isMaintenanceMode) {
      return next();
    }

    // If maintenance mode is ON, check user role
    const user = req.user;

    // If no authenticated user or user is not admin, block the request
    if (!user) {
      return res.status(503).json({
        error: 'SYSTEM_UNDER_MAINTENANCE',
        message: 'The system is currently under maintenance.',
        statusCode: 503
      });
    }

    // Check if user has admin role
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      return res.status(503).json({
        error: 'SYSTEM_UNDER_MAINTENANCE',
        message: 'The system is currently under maintenance.',
        statusCode: 503
      });
    }

    // Admin or SUPER_ADMIN can proceed
    return next();
  } catch (error) {
    console.error('[MaintenanceMode] Error checking maintenance status:', error);
    // If there's an error checking maintenance status, allow the request to proceed
    return next();
  }
};
