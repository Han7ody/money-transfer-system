import express from 'express';
import roleManagementController from '../controllers/roleManagementController';
import { authorize } from '../middleware/auth';

const router = express.Router();

const SUPER_ADMIN_ONLY = ['SUPER_ADMIN'];

router.get('/', authorize(SUPER_ADMIN_ONLY), roleManagementController.getAllRoles);
router.get('/:role', authorize(SUPER_ADMIN_ONLY), roleManagementController.getRolePermissions);
router.put('/:role/:permission', authorize(SUPER_ADMIN_ONLY), roleManagementController.updateRolePermission);
router.put('/:role/bulk', authorize(SUPER_ADMIN_ONLY), roleManagementController.bulkUpdatePermissions);

export default router;
