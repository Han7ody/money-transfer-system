import express from 'express';
import securityController from '../controllers/securityController';
import { verifyToken, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

// IP Whitelist Management
router.get('/ip-whitelist', authorize(ADMIN_ROLES), securityController.getWhitelistedIPs);
router.post('/ip-whitelist', authorize(ADMIN_ROLES), securityController.addIPToWhitelist);
router.delete('/ip-whitelist/:ipAddress', authorize(ADMIN_ROLES), securityController.removeIPFromWhitelist);

// Session Management
router.get('/sessions', securityController.getActiveSessions);
router.post('/sessions/refresh', securityController.refreshSession);
router.delete('/sessions/:sessionId', securityController.revokeSession);

// Failed Login Monitoring
router.get('/failed-logins', authorize(ADMIN_ROLES), securityController.getFailedLoginAttempts);

// Logout
router.post('/logout', securityController.logout);

export default router;
