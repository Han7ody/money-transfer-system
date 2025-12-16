import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { ipWhitelistService } from '../services/IPWhitelistService';
import { sessionService } from '../services/SessionService';
import { failedLoginService } from '../services/FailedLoginService';
import { logAdminAction, AuditActions } from '../utils/auditLogger';

export class SecurityController {
  /**
   * Get all whitelisted IPs
   */
  async getWhitelistedIPs(req: Request, res: Response): Promise<void> {
    try {
      const ips = await ipWhitelistService.getAllIPs();
      const currentIP = ipWhitelistService.extractIP(req);
      
      sendSuccess(res, {
        ips,
        currentIP,
        isEnabled: await ipWhitelistService.isEnabled()
      });
    } catch (error) {
      console.error('[SecurityController] Error getting whitelisted IPs:', error);
      sendError(res, 'Failed to retrieve whitelisted IPs');
    }
  }

  /**
   * Add IP to whitelist
   */
  async addIPToWhitelist(req: Request, res: Response): Promise<void> {
    try {
      const { ipAddress, description } = req.body;
      const user = (req as any).user;

      if (!ipAddress) {
        return sendError(res, 'IP address is required', 400);
      }

      await ipWhitelistService.addIP(ipAddress, description || '', user.userId);

      await logAdminAction({
        adminId: user.userId,
        action: 'ADD_IP_WHITELIST',
        entity: 'IPWhitelist',
        entityId: ipAddress,
        newValue: { ipAddress, description },
        req
      });

      sendSuccess(res, { message: 'IP address added to whitelist' });
    } catch (error: any) {
      console.error('[SecurityController] Error adding IP to whitelist:', error);
      sendError(res, error.message || 'Failed to add IP to whitelist');
    }
  }

  /**
   * Remove IP from whitelist
   */
  async removeIPFromWhitelist(req: Request, res: Response): Promise<void> {
    try {
      const { ipAddress } = req.params;
      const user = (req as any).user;

      await ipWhitelistService.removeIP(ipAddress);

      await logAdminAction({
        adminId: user.userId,
        action: 'REMOVE_IP_WHITELIST',
        entity: 'IPWhitelist',
        entityId: ipAddress,
        req
      });

      sendSuccess(res, { message: 'IP address removed from whitelist' });
    } catch (error: any) {
      console.error('[SecurityController] Error removing IP from whitelist:', error);
      sendError(res, error.message || 'Failed to remove IP from whitelist');
    }
  }

  /**
   * Get active sessions for current user
   */
  async getActiveSessions(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const sessions = await sessionService.getUserSessions(user.userId);

      sendSuccess(res, { sessions });
    } catch (error) {
      console.error('[SecurityController] Error getting active sessions:', error);
      sendError(res, 'Failed to retrieve active sessions');
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const user = (req as any).user;

      await sessionService.revokeSession(sessionId);

      await logAdminAction({
        adminId: user.userId,
        action: 'REVOKE_SESSION',
        entity: 'Session',
        entityId: sessionId,
        req
      });

      sendSuccess(res, { message: 'Session revoked successfully' });
    } catch (error) {
      console.error('[SecurityController] Error revoking session:', error);
      sendError(res, 'Failed to revoke session');
    }
  }

  /**
   * Refresh current session (extend timeout)
   */
  async refreshSession(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user.sessionId) {
        return sendError(res, 'No active session found', 400);
      }

      await sessionService.updateActivity(user.sessionId);

      sendSuccess(res, { message: 'Session refreshed successfully' });
    } catch (error) {
      console.error('[SecurityController] Error refreshing session:', error);
      sendError(res, 'Failed to refresh session');
    }
  }

  /**
   * Get failed login attempts (for monitoring)
   */
  async getFailedLoginAttempts(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const attempts = await failedLoginService.getRecentFailedAttempts(limit);

      sendSuccess(res, { attempts });
    } catch (error) {
      console.error('[SecurityController] Error getting failed login attempts:', error);
      sendError(res, 'Failed to retrieve failed login attempts');
    }
  }

  /**
   * Logout (revoke current session)
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (user.sessionId) {
        await sessionService.revokeSession(user.sessionId);
      }

      await logAdminAction({
        adminId: user.userId,
        action: AuditActions.ADMIN_LOGOUT,
        entity: 'Auth',
        req
      });

      sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error) {
      console.error('[SecurityController] Error during logout:', error);
      sendError(res, 'Failed to logout');
    }
  }
}

export default new SecurityController();
