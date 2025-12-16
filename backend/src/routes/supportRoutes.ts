import express from 'express';
import supportController from '../controllers/supportController';
import { authorize } from '../middleware/auth';

const router = express.Router();

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

// Support Requests Management
router.post('/create', supportController.createSupportRequest);
router.get('/', authorize(ADMIN_ROLES), supportController.getSupportRequests);
router.get('/:id', authorize(ADMIN_ROLES), supportController.getSupportRequestById);
router.put('/:id/status', authorize(ADMIN_ROLES), supportController.updateSupportStatus);
router.post('/:id/note', authorize(ADMIN_ROLES), supportController.addSupportNote);
router.put('/:id/assign', authorize(ADMIN_ROLES), supportController.assignSupport);

// Legacy WhatsApp escalation
router.post('/escalate', authorize(ADMIN_ROLES), supportController.logEscalation);
router.get('/escalations', authorize(ADMIN_ROLES), supportController.getEscalations);

export default router;
