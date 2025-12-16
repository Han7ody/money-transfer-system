// backend/src/routes/settingsRoutes.ts
import express from 'express';
import { verifyToken, authorize } from '../middleware/auth';
import * as settingsController from '../controllers/settingsController';
import { uploadLogo, handleLogoUploadError } from '../utils/upload';

const router = express.Router();

const SUPER_ADMIN_ROLE = ['SUPER_ADMIN'];

// PUBLIC endpoint - get maintenance status (no auth required)
router.get('/settings/maintenance', settingsController.getMaintenanceFlag);

// All other settings routes require SUPER_ADMIN role
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

// SMTP Settings
router.get(
  '/settings/smtp',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.getSmtpSettings
);

router.put(
  '/settings/smtp',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.updateSmtpSettings
);

router.post(
  '/settings/smtp/test',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.testSmtpConnection
);

// Email Templates
router.get(
  '/settings/email-templates',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.getEmailTemplates
);

router.get(
  '/settings/email-templates/:id',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.getEmailTemplate
);

router.put(
  '/settings/email-templates/:id',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.updateEmailTemplate
);

router.post(
  '/settings/email-templates/:id/test',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.testEmailTemplate
);

// Currencies
router.get(
  '/currencies',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.getCurrencies
);

router.post(
  '/currencies',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.createCurrency
);

router.put(
  '/currencies/:id',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.updateCurrency
);

router.patch(
  '/currencies/:id/toggle',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.toggleCurrency
);

// Policies
router.get(
  '/settings/policies',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.getPolicies
);

router.get(
  '/settings/policies/:type',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.getPolicy
);

router.put(
  '/settings/policies/:type',
  verifyToken,
  authorize(SUPER_ADMIN_ROLE),
  settingsController.updatePolicy
);

export default router;
