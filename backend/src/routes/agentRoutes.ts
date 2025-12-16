// backend/src/routes/agentRoutes.ts
import express from 'express';
import { verifyToken, authorize } from '../middleware/auth';
import * as agentController from '../controllers/agentController';

const router = express.Router();

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

// All agent routes require admin authentication
router.use(verifyToken);
router.use(authorize(ADMIN_ROLES));

// Agent CRUD routes
router.get('/agents', agentController.getAllAgents);
router.get('/agents/available', agentController.getAvailableAgents);
router.get('/agents/:id', agentController.getAgentById);
router.post('/agents', agentController.createAgent);
router.put('/agents/:id', agentController.updateAgent);
router.put('/agents/:id/status', agentController.updateAgentStatus);
router.delete('/agents/:id', agentController.deleteAgent);
router.get('/agents/:id/transactions', agentController.getAgentTransactions);

// Agent credential management
router.post('/agents/:id/create-login', agentController.createAgentLogin);
router.post('/agents/:id/reset-password', agentController.resetAgentPassword);
router.get('/agents/:id/credentials', agentController.getAgentCredentials);

export default router;
