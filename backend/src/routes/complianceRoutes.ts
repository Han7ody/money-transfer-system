import express from 'express';
import * as complianceController from '../controllers/complianceController';
import { verifyToken, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

const COMPLIANCE_ROLES = ['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_OFFICER'];

// AML Alerts
router.get('/aml-alerts', authorize(COMPLIANCE_ROLES), complianceController.getAMLAlerts);
router.put('/aml-alerts/:id', authorize(COMPLIANCE_ROLES), complianceController.updateAMLAlert);
router.get('/aml-stats', authorize(COMPLIANCE_ROLES), complianceController.getAMLStats);

// AML Case Management
router.post('/aml-cases', authorize(COMPLIANCE_ROLES), complianceController.createAMLCase);
router.post('/aml-cases/from-alert/:alertId', authorize(COMPLIANCE_ROLES), complianceController.createCaseFromAlert);
router.get('/aml-cases', authorize(COMPLIANCE_ROLES), complianceController.getAMLCases);
router.get('/aml-cases/:id', authorize(COMPLIANCE_ROLES), complianceController.getAMLCaseDetails);
router.put('/aml-cases/:id/assign', authorize(COMPLIANCE_ROLES), complianceController.assignAMLCase);
router.put('/aml-cases/:id/status', authorize(COMPLIANCE_ROLES), complianceController.updateAMLCaseStatus);
router.post('/aml-cases/:id/resolve', authorize(COMPLIANCE_ROLES), complianceController.resolveAMLCase);
router.post('/aml-cases/:id/notes', authorize(COMPLIANCE_ROLES), complianceController.addAMLCaseNote);
router.get('/aml-case-stats', authorize(COMPLIANCE_ROLES), complianceController.getAMLCaseStats);

// Fraud Score History
router.get('/fraud-score-history/:userId', authorize(COMPLIANCE_ROLES), complianceController.getFraudScoreHistory);

// Compliance Reporting
router.post('/reports/generate', authorize(COMPLIANCE_ROLES), complianceController.generateReport);
router.get('/reports', authorize(COMPLIANCE_ROLES), complianceController.getReports);
router.get('/reports/:id', authorize(COMPLIANCE_ROLES), complianceController.getReportById);
router.get('/reports/:id/export-csv', authorize(COMPLIANCE_ROLES), complianceController.exportReportCSV);

// Compliance Dashboard
router.get('/dashboard', authorize(COMPLIANCE_ROLES), complianceController.getComplianceDashboard);

export default router;
