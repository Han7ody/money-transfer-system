import express from 'express';
import adminManagementController from '../controllers/adminManagementController';
import { authorize } from '../middleware/auth';

const router = express.Router();

const SUPER_ADMIN_ONLY = ['SUPER_ADMIN'];

router.get('/', authorize(SUPER_ADMIN_ONLY), adminManagementController.getAllAdmins);
router.post('/', authorize(SUPER_ADMIN_ONLY), adminManagementController.createAdmin);
router.put('/:id', authorize(SUPER_ADMIN_ONLY), adminManagementController.updateAdmin);
router.post('/:id/reset-password', authorize(SUPER_ADMIN_ONLY), adminManagementController.resetPassword);
router.post('/:id/suspend', authorize(SUPER_ADMIN_ONLY), adminManagementController.suspendAdmin);
router.post('/:id/activate', authorize(SUPER_ADMIN_ONLY), adminManagementController.activateAdmin);
router.get('/generate-credentials', authorize(SUPER_ADMIN_ONLY), adminManagementController.generateCredentials);

export default router;
