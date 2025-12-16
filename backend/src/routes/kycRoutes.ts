// backend/src/routes/kycRoutes.ts
import { Router } from 'express';
import { authorize } from '../middleware/auth';
import * as kycController from '../controllers/kycController';

const router = Router();
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

// KYC Queue & Review
router.get('/queue', authorize(ADMIN_ROLES), kycController.getKycQueue);
router.get('/review/:id', authorize(ADMIN_ROLES), kycController.getKycReviewDetails);
router.get('/stats', authorize(ADMIN_ROLES), kycController.getKycStats);

// KYC Actions
router.post('/:id/approve', authorize(ADMIN_ROLES), kycController.approveKyc);
router.post('/:id/reject', authorize(ADMIN_ROLES), kycController.rejectKyc);
router.post('/:id/request-more', authorize(ADMIN_ROLES), kycController.requestMoreDocuments);
router.post('/:id/escalate', authorize(ADMIN_ROLES), kycController.escalateKyc);

// Review Notes
router.post('/:id/notes', authorize(ADMIN_ROLES), kycController.addReviewNote);

// Fraud Detection
router.post('/fraud-match/:matchId/resolve', authorize(ADMIN_ROLES), kycController.resolveFraudMatch);

export default router;
