import express from 'express';
import AdminUserController from '../controllers/AdminUserController';
import { verifyToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbacMiddleware';

const router = express.Router();

// Public routes
router.post('/login', AdminUserController.login);

// Protected routes
router.use(verifyToken);

// Profile
router.get('/profile', AdminUserController.getProfile);

// Generate credentials
router.get('/generate-credentials', requirePermission('ADMINS_CREATE'), AdminUserController.generateCredentials);

// Admin management
router.post('/', requirePermission('ADMINS_CREATE'), AdminUserController.createAdmin);
router.get('/', requirePermission('ADMINS_VIEW'), AdminUserController.listAdmins);
router.get('/:id', requirePermission('ADMINS_VIEW'), AdminUserController.getAdmin);
router.put('/:id', requirePermission('ADMINS_EDIT'), AdminUserController.updateAdmin);
router.put('/:id/suspend', requirePermission('ADMINS_SUSPEND'), AdminUserController.suspendAdmin);
router.put('/:id/activate', requirePermission('ADMINS_SUSPEND'), AdminUserController.activateAdmin);
router.put('/:id/reset-password', requirePermission('ADMINS_EDIT'), AdminUserController.resetPassword);

export default router;
