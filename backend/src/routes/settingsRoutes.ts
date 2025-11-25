// backend/src/routes/settingsRoutes.ts
import express from 'express';
import { verifyToken, authorize } from '../middleware/auth';
import * as settingsController from '../controllers/settingsController';
import { uploadLogo, handleLogoUploadError } from '../utils/upload';

const router = express.Router();

const SUPER_ADMIN_ROLE = ['SUPER_ADMIN'];

// All settings routes require SUPER_ADMIN role
router.get(
  '/settings',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.getSystemSettings
);

router.patch(
  '/settings',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.updateSystemSettings
);

router.post(
  '/settings/logo',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  uploadLogo,
  handleLogoUploadError,
  settingsController.uploadSettingsLogo
);

router.post(
  '/settings/smtp/test',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.testSmtpSettings
);

export default router;
