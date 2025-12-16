import { Request, Response, NextFunction } from 'express';
import { ipWhitelistService } from '../services/IPWhitelistService';
import { sendError } from '../utils/response';
import { logAdminAction, AuditActions } from '../utils/auditLogger';

/**
 * Middleware to check IP whitelist for admin routes
 */
export const ipWhitelistMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // TEMPORARILY DISABLED FOR DEBUGGING
    console.log(`[Debug] IP whitelist check bypassed for: ${ipWhitelistService.extractIP(req)}`);
    return next();
    
    const ipAddress = ipWhitelistService.extractIP(req);
    const isWhitelisted = await ipWhitelistService.isWhitelisted(ipAddress);

    if (!isWhitelisted) {
      // Log unauthorized access attempt
      await logAdminAction({
        action: 'UNAUTHORIZED_IP_ACCESS_ATTEMPT',
        entity: 'Security',
        ipAddress,
        userAgent: req.headers['user-agent'],
        req
      });

      console.warn(`[Security] Blocked access from non-whitelisted IP: ${ipAddress}`);
      
      return sendError(res, 'Access denied. Your IP address is not authorized.', 403);
    }

    next();
  } catch (error: any) {
    // If table doesn't exist (migration not run), allow access
    if (error.code === 'P2010' || error.message?.includes('does not exist')) {
      console.warn('[IPWhitelist] Table not found - allowing access. Run migration: scripts/database/run-sprint0-migration.bat');
      return next();
    }
    
    console.error('[IPWhitelist] Error:', error);
    // On error, allow access (fail open) but log the error
    next();
  }
};
