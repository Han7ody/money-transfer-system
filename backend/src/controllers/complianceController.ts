import { Request, Response } from 'express';
import { amlMonitoringService } from '../services/AMLMonitoringService';
import { amlCaseService, CaseType, CaseSeverity, CaseStatus } from '../services/AMLCaseService';
import { reportingService, ReportType } from '../services/ReportingService';
import fraudDetectionService from '../services/fraudDetectionService';
import { sendSuccess, sendError } from '../utils/response';
import { logAdminAction } from '../utils/auditLogger';
import prisma from '../lib/prisma';

export const getAMLAlerts = async (req: any, res: Response) => {
  try {
    const { status, severity, type, userId, page, limit } = req.query;

    const result = await amlMonitoringService.getAlerts({
      status: status as string,
      severity: severity as string,
      type: type as string,
      userId: userId ? parseInt(userId as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20
    });

    return sendSuccess(res, result, 'AML alerts fetched successfully');
  } catch (error: any) {
    console.error('Get AML alerts error:', error);
    return sendError(res, error.message, 500);
  }
};

export const updateAMLAlert = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.id;

    if (!status) {
      return sendError(res, 'Status is required', 400);
    }

    await amlMonitoringService.updateAlertStatus(
      parseInt(id),
      status,
      adminId,
      notes
    );

    await logAdminAction({
      adminId,
      action: 'AML_ALERT_UPDATE',
      entity: 'AMLAlert',
      entityId: id,
      newValue: { status, notes },
      req
    });

    return sendSuccess(res, null, 'AML alert updated successfully');
  } catch (error: any) {
    console.error('Update AML alert error:', error);
    return sendError(res, error.message, 500);
  }
};

export const getAMLStats = async (req: Request, res: Response) => {
  try {
    const result = await amlMonitoringService.getAlerts({
      page: 1,
      limit: 1000 // Get all for stats
    });

    const stats = {
      total: result.total,
      open: result.alerts.filter((a: any) => a.status === 'OPEN').length,
      underReview: result.alerts.filter((a: any) => a.status === 'UNDER_REVIEW').length,
      resolved: result.alerts.filter((a: any) => a.status === 'RESOLVED').length,
      byType: {
        velocity: result.alerts.filter((a: any) => a.type === 'VELOCITY').length,
        structuring: result.alerts.filter((a: any) => a.type === 'STRUCTURING').length
      },
      bySeverity: {
        high: result.alerts.filter((a: any) => a.severity === 'HIGH').length,
        medium: result.alerts.filter((a: any) => a.severity === 'MEDIUM').length,
        low: result.alerts.filter((a: any) => a.severity === 'LOW').length
      }
    };

    return sendSuccess(res, stats, 'AML stats fetched successfully');
  } catch (error: any) {
    console.error('Get AML stats error:', error);
    return sendError(res, error.message, 500);
  }
};

// ============================================
// AML Case Management
// ============================================

export const createAMLCase = async (req: any, res: Response) => {
  try {
    const { userId, transactionId, caseType, severity, title, description, alertIds, suspendUser } = req.body;
    const adminId = req.user.id;

    if (!userId || !caseType || !severity || !title) {
      return sendError(res, 'Missing required fields', 400);
    }

    // Validate enum values
    const validCaseTypes = Object.values(CaseType);
    const validSeverities = Object.values(CaseSeverity);

    if (!validCaseTypes.includes(caseType)) {
      return sendError(res, `Invalid case type. Must be one of: ${validCaseTypes.join(', ')}`, 400);
    }

    if (!validSeverities.includes(severity)) {
      return sendError(res, `Invalid severity. Must be one of: ${validSeverities.join(', ')}`, 400);
    }

    // Get user details before creating case
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const amlCase = await amlCaseService.createCase({
      userId: parseInt(userId),
      transactionId: transactionId ? parseInt(transactionId) : undefined,
      caseType: caseType as CaseType,
      severity: severity as CaseSeverity,
      title,
      description,
      createdBy: adminId,
      alertIds: alertIds || []
    });

    // Suspend user account if requested
    if (suspendUser && user.isActive) {
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { isActive: false }
      });

      // Send suspension notification email
      const emailService = (await import('../services/emailService')).default;
      await emailService.sendAccountSuspensionEmail(
        user.email,
        {
          name: user.fullName,
          case_number: amlCase.case_number,
          suspension_date: new Date().toLocaleDateString('en-GB'),
          reason: `${caseType} activity detected - ${title}`
        },
        'en' // You can determine language based on user preference
      );

      // Log the suspension action
      await logAdminAction({
        adminId,
        action: 'USER_SUSPENDED',
        entity: 'User',
        entityId: userId.toString(),
        newValue: { reason: `AML Case: ${amlCase.case_number}`, suspended: true },
        req
      });
    }

    await logAdminAction({
      adminId,
      action: 'AML_CASE_CREATED',
      entity: 'AMLCase',
      entityId: amlCase.id.toString(),
      newValue: { caseType, severity, title, userSuspended: suspendUser && user.isActive },
      req
    });

    return sendSuccess(res, {
      ...amlCase,
      userSuspended: suspendUser && user.isActive,
      emailSent: suspendUser && user.isActive
    }, 'AML case created successfully');
  } catch (error: any) {
    console.error('Create AML case error:', error);
    return sendError(res, error.message, 500);
  }
};

export const createCaseFromAlert = async (req: any, res: Response) => {
  try {
    const { alertId } = req.params;
    const adminId = req.user.id;

    const amlCase = await amlCaseService.createCaseFromAlert(parseInt(alertId), adminId);

    await logAdminAction({
      adminId,
      action: 'AML_CASE_FROM_ALERT',
      entity: 'AMLCase',
      entityId: amlCase.id.toString(),
      newValue: { alertId },
      req
    });

    return sendSuccess(res, amlCase, 'AML case created from alert');
  } catch (error: any) {
    console.error('Create case from alert error:', error);
    return sendError(res, error.message, 500);
  }
};

export const getAMLCases = async (req: any, res: Response) => {
  try {
    const { status, severity, caseType, assignedTo, page, limit } = req.query;

    const result = await amlCaseService.getCases({
      status: status as string,
      severity: severity as string,
      caseType: caseType as string,
      assignedTo: assignedTo ? parseInt(assignedTo as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20
    });

    return sendSuccess(res, result, 'AML cases fetched successfully');
  } catch (error: any) {
    console.error('Get AML cases error:', error);
    return sendError(res, error.message, 500);
  }
};

export const getAMLCaseDetails = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const caseDetails = await amlCaseService.getCaseDetails(parseInt(id));

    return sendSuccess(res, caseDetails, 'Case details fetched successfully');
  } catch (error: any) {
    console.error('Get case details error:', error);
    return sendError(res, error.message, 500);
  }
};

export const assignAMLCase = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const adminId = req.user.id;

    if (!assignedTo) {
      return sendError(res, 'assignedTo is required', 400);
    }

    await amlCaseService.assignCase(parseInt(id), parseInt(assignedTo), adminId);

    await logAdminAction({
      adminId,
      action: 'AML_CASE_ASSIGNED',
      entity: 'AMLCase',
      entityId: id,
      newValue: { assignedTo },
      req
    });

    return sendSuccess(res, null, 'Case assigned successfully');
  } catch (error: any) {
    console.error('Assign case error:', error);
    return sendError(res, error.message, 500);
  }
};

export const updateAMLCaseStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.id;

    if (!status) {
      return sendError(res, 'Status is required', 400);
    }

    await amlCaseService.updateStatus(parseInt(id), status as CaseStatus, adminId, notes);

    await logAdminAction({
      adminId,
      action: 'AML_CASE_STATUS_UPDATE',
      entity: 'AMLCase',
      entityId: id,
      newValue: { status, notes },
      req
    });

    return sendSuccess(res, null, 'Case status updated successfully');
  } catch (error: any) {
    console.error('Update case status error:', error);
    return sendError(res, error.message, 500);
  }
};

export const resolveAMLCase = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;
    const adminId = req.user.id;

    if (!resolutionNotes) {
      return sendError(res, 'Resolution notes are required', 400);
    }

    await amlCaseService.resolveCase(parseInt(id), adminId, resolutionNotes);

    await logAdminAction({
      adminId,
      action: 'AML_CASE_RESOLVED',
      entity: 'AMLCase',
      entityId: id,
      newValue: { resolutionNotes },
      req
    });

    return sendSuccess(res, null, 'Case resolved successfully');
  } catch (error: any) {
    console.error('Resolve case error:', error);
    return sendError(res, error.message, 500);
  }
};

export const addAMLCaseNote = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    if (!notes) {
      return sendError(res, 'Notes are required', 400);
    }

    await amlCaseService.addNote(parseInt(id), adminId, notes);

    return sendSuccess(res, null, 'Note added successfully');
  } catch (error: any) {
    console.error('Add case note error:', error);
    return sendError(res, error.message, 500);
  }
};

export const getAMLCaseStats = async (req: any, res: Response) => {
  try {
    const stats = await amlCaseService.getStatistics();
    return sendSuccess(res, stats, 'Case statistics fetched successfully');
  } catch (error: any) {
    console.error('Get case stats error:', error);
    return sendError(res, error.message, 500);
  }
};

// ============================================
// Fraud Score History
// ============================================

export const getFraudScoreHistory = async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const history = await fraudDetectionService.getFraudScoreHistory(
      parseInt(userId),
      limit ? parseInt(limit as string) : 10
    );

    return sendSuccess(res, history, 'Fraud score history fetched successfully');
  } catch (error: any) {
    console.error('Get fraud score history error:', error);
    return sendError(res, error.message, 500);
  }
};

// ============================================
// Compliance Reporting
// ============================================

export const generateReport = async (req: any, res: Response) => {
  try {
    const { reportType, dateFrom, dateTo } = req.body;
    const adminId = req.user.id;

    if (!reportType || !dateFrom || !dateTo) {
      return sendError(res, 'Missing required fields', 400);
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    let reportData;

    switch (reportType) {
      case ReportType.DAILY_SUMMARY:
        reportData = await reportingService.generateDailySummary(from, to, adminId);
        break;
      case ReportType.KYC_COMPLIANCE:
        reportData = await reportingService.generateKYCComplianceReport(from, to, adminId);
        break;
      case ReportType.FRAUD_DETECTION:
        reportData = await reportingService.generateFraudDetectionReport(from, to, adminId);
        break;
      case ReportType.AML_ALERTS:
        reportData = await reportingService.generateAMLAlertsReport(from, to, adminId);
        break;
      default:
        return sendError(res, 'Invalid report type', 400);
    }

    await logAdminAction({
      adminId,
      action: 'REPORT_GENERATED',
      entity: 'ComplianceReport',
      entityId: reportType,
      newValue: { reportType, dateFrom, dateTo },
      req
    });

    return sendSuccess(res, reportData, 'Report generated successfully');
  } catch (error: any) {
    console.error('Generate report error:', error);
    return sendError(res, error.message, 500);
  }
};

export const getReports = async (req: any, res: Response) => {
  try {
    const { reportType, page, limit } = req.query;

    const result = await reportingService.getReports({
      reportType: reportType as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20
    });

    return sendSuccess(res, result, 'Reports fetched successfully');
  } catch (error: any) {
    console.error('Get reports error:', error);
    return sendError(res, error.message, 500);
  }
};

export const getReportById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const report = await reportingService.getReportById(parseInt(id));

    return sendSuccess(res, report, 'Report fetched successfully');
  } catch (error: any) {
    console.error('Get report error:', error);
    return sendError(res, error.message, 500);
  }
};

export const exportReportCSV = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const report = await reportingService.getReportById(parseInt(id));
    const csv = reportingService.exportToCSV(report.report_data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${report.report_name}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Export report CSV error:', error);
    return sendError(res, error.message, 500);
  }
};

// ============================================
// Compliance Dashboard Stats
// ============================================

export const getComplianceDashboard = async (req: any, res: Response) => {
  try {
    // Get various stats for dashboard
    const [amlStats, caseStats, kycStats, fraudStats] = await Promise.all([
      amlMonitoringService.getAlerts({ page: 1, limit: 1 }),
      amlCaseService.getStatistics(),
      getKYCStats(),
      getFraudStats()
    ]);

    const dashboard = {
      aml: {
        totalAlerts: Number(amlStats.total || 0),
        openAlerts: amlStats.alerts.filter((a: any) => a.status === 'OPEN').length
      },
      cases: caseStats,
      kyc: kycStats,
      fraud: fraudStats
    };

    return sendSuccess(res, dashboard, 'Dashboard data fetched successfully');
  } catch (error: any) {
    console.error('Get compliance dashboard error:', error);
    return sendError(res, error.message, 500);
  }
};

// Helper functions
async function getKYCStats() {
  try {
    const prisma = (await import('../lib/prisma')).default;
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) FILTER (WHERE kyc_status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE kyc_status = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE kyc_status = 'REJECTED') as rejected
      FROM users
      WHERE kyc_submitted_at IS NOT NULL
    `;
    const result = stats[0] || { pending: 0, approved: 0, rejected: 0 };
    return {
      pending: Number(result.pending || 0),
      approved: Number(result.approved || 0),
      rejected: Number(result.rejected || 0)
    };
  } catch (error) {
    console.warn('[Compliance] Error fetching KYC stats:', error);
    return { pending: 0, approved: 0, rejected: 0 };
  }
}

async function getFraudStats() {
  try {
    const prisma = (await import('../lib/prisma')).default;
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) FILTER (WHERE risk_level = 'HIGH' OR risk_level = 'CRITICAL') as high_risk_users,
        COUNT(*) FILTER (WHERE fraud_score >= 70) as flagged_users,
        AVG(fraud_score) as avg_fraud_score
      FROM users
    `;
    const result = stats[0] || { high_risk_users: 0, flagged_users: 0, avg_fraud_score: 0 };
    return {
      high_risk_users: Number(result.high_risk_users || 0),
      flagged_users: Number(result.flagged_users || 0),
      avg_fraud_score: Number(result.avg_fraud_score || 0)
    };
  } catch (error) {
    console.warn('[Compliance] Error fetching fraud stats:', error);
    return { high_risk_users: 0, flagged_users: 0, avg_fraud_score: 0 };
  }
}
