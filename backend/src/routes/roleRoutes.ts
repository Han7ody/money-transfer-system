import express from 'express';
import RoleController from '../controllers/RoleController';
import { verifyToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbacMiddleware';

const router = express.Router();

router.use(verifyToken);

// Roles
router.get('/', requirePermission('ROLES_VIEW'), RoleController.listRoles);
router.post('/', requirePermission('ROLES_CREATE'), RoleController.createRole);
router.get('/:id', requirePermission('ROLES_VIEW'), RoleController.getRole);
router.delete('/:id', requirePermission('ROLES_DELETE'), RoleController.deleteRole);

// Role permissions
router.get('/:id/permissions', requirePermission('ROLES_VIEW'), RoleController.getRolePermissions);
router.put('/:id/permissions', requirePermission('ROLES_ASSIGN_PERMISSIONS'), RoleController.updateRolePermissions);

// Permissions catalog
router.get('/permissions/all', requirePermission('ROLES_VIEW'), RoleController.listPermissions);

export default router;
