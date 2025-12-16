import express from 'express';
import AgentManagementController from '../controllers/AgentManagementController';
import { verifyToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbacMiddleware';

const router = express.Router();

router.use(verifyToken);

// Agent management
router.post('/', requirePermission('AGENTS_CREATE'), AgentManagementController.createAgent);
router.get('/', requirePermission('AGENTS_VIEW'), AgentManagementController.listAgents);
router.get('/:id', requirePermission('AGENTS_VIEW'), AgentManagementController.getAgent);
router.put('/:id', requirePermission('AGENTS_EDIT'), AgentManagementController.updateAgent);
router.put('/:id/suspend', requirePermission('AGENTS_SUSPEND'), AgentManagementController.suspendAgent);
router.put('/:id/activate', requirePermission('AGENTS_SUSPEND'), AgentManagementController.activateAgent);
router.put('/:id/reset-access', requirePermission('AGENTS_EDIT'), AgentManagementController.resetAccess);
router.put('/:id/performance', requirePermission('AGENTS_EDIT'), AgentManagementController.updatePerformanceScore);

export default router;
