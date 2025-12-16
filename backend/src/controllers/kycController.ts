// backend/src/controllers/kycController.ts
import { Request, Response } from 'express';
import kycService from '../services/kycService';
import fraudDetectionService from '../services/fraudDetectionService';
import { sendSuccess, sendError } from '../utils/response';
import { logAdminAction } from '../utils/auditLogger';

export const getKycQueue = async (req: Request, res: Response) => {
  try {
    const { country, documentType, riskLevel, search, status, page = '1', limit = '20' } = req.query;

    const result = await kycService.getKycQueue(
      {
        country: country as string,
        documentType: documentType as string,
        riskLevel: riskLevel as 'low' | 'medium' | 'high',
        search: search as string,
        status: status as any
      },
      parseInt(page as string),
      parseInt(limit as string)
    );

    return sendSuccess(res, result, 'KYC queue fetched successfully');
  } catch (error: any) {
    console.error('Get KYC queue error:', error);
    return sendError(res, error.message, 500);
  }
};

export const getKycReviewDetails = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const result = await kycService.getKycReviewDetails(userId);

    return sendSuccess(res, result, 'KYC review details fetched successfully');
  } catch (error: any) {
    console.error('Get KYC review details error:', error);
    return sendError(res, error.message, 500);
  }
};

export const approveKyc = async (req: any, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { reason } = req.body;
    const adminId = req.user.id;

    // ✅ ENFORCE REASON FIELD
    if (!reason || reason.trim().length === 0) {
      return sendError(res, 'Approval reason is required', 400);
    }

    const result = await kycService.approveKyc(userId, adminId, reason);

    await logAdminAction({
      adminId,
      action: 'KYC_APPROVE',
      entity: 'User',
      entityId: userId.toString(),
      newValue: { reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      req
    });

    return sendSuccess(res, result, 'KYC approved successfully');
  } catch (error: any) {
    console.error('Approve KYC error:', error);
    return sendError(res, error.message, 500);
  }
};

export const rejectKyc = async (req: any, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { reason } = req.body;
    const adminId = req.user.id;

    // ✅ ENFORCE REASON FIELD
    if (!reason || reason.trim().length === 0) {
      return sendError(res, 'Rejection reason is required', 400);
    }

    const result = await kycService.rejectKyc(userId, adminId, reason);

    await logAdminAction({
      adminId,
      action: 'KYC_REJECT',
      entity: 'User',
      entityId: userId.toString(),
      newValue: { reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      req
    });

    return sendSuccess(res, result, 'KYC rejected successfully');
  } catch (error: any) {
    console.error('Reject KYC error:', error);
    return sendError(res, error.message, 500);
  }
};

export const requestMoreDocuments = async (req: any, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return sendError(res, 'Reason is required', 400);
    }

    const result = await kycService.requestMoreDocuments(userId, adminId, reason);

    await logAdminAction({
      adminId,
      action: 'KYC_REQUEST_MORE',
      entity: 'User',
      entityId: userId.toString(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return sendSuccess(res, result, 'More documents requested successfully');
  } catch (error: any) {
    console.error('Request more documents error:', error);
    return sendError(res, error.message, 500);
  }
};

export const escalateKyc = async (req: any, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return sendError(res, 'Escalation reason is required', 400);
    }

    const result = await kycService.escalateKyc(userId, adminId, reason);

    await logAdminAction({
      adminId,
      action: 'KYC_ESCALATE',
      entity: 'User',
      entityId: userId.toString(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return sendSuccess(res, result, 'KYC escalated successfully');
  } catch (error: any) {
    console.error('Escalate KYC error:', error);
    return sendError(res, error.message, 500);
  }
};

export const addReviewNote = async (req: any, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { message } = req.body;
    const adminId = req.user.id;

    if (!message) {
      return sendError(res, 'Message is required', 400);
    }

    const note = await kycService.addReviewNote(userId, adminId, message);

    return sendSuccess(res, note, 'Note added successfully');
  } catch (error: any) {
    console.error('Add review note error:', error);
    return sendError(res, error.message, 500);
  }
};

export const getKycStats = async (req: Request, res: Response) => {
  try {
    const stats = await kycService.getKycStats();
    return sendSuccess(res, stats, 'KYC stats fetched successfully');
  } catch (error: any) {
    console.error('Get KYC stats error:', error);
    return sendError(res, error.message, 500);
  }
};

export const resolveFraudMatch = async (req: any, res: Response) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const adminId = req.user.id;

    const result = await fraudDetectionService.resolveFraudMatch(matchId, adminId);

    return sendSuccess(res, result, 'Fraud match resolved successfully');
  } catch (error: any) {
    console.error('Resolve fraud match error:', error);
    return sendError(res, error.message, 500);
  }
};
