import express from 'express';
import { authorize } from '../middleware/auth';
import {
  getRateLimits,
  createRateLimit,
  updateRateLimit,
  deleteRateLimit
} from '../controllers/rateLimitController';

const router = express.Router();

// All rate limit routes require SUPER_ADMIN role
const SUPER_ADMIN_ROLE = ['SUPER_ADMIN'];

// GET /api/admin/security/rate-limits
router.get('/', authorize(SUPER_ADMIN_ROLE), getRateLimits);

// POST /api/admin/security/rate-limits
router.post('/', authorize(SUPER_ADMIN_ROLE), createRateLimit);

// PUT /api/admin/security/rate-limits/:id
router.put('/:id', authorize(SUPER_ADMIN_ROLE), updateRateLimit);

// DELETE /api/admin/security/rate-limits/:id
router.delete('/:id', authorize(SUPER_ADMIN_ROLE), deleteRateLimit);

export default router;
