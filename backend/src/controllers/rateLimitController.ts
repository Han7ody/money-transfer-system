import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { logAdminAction, AuditActions, AuditEntities } from '../utils/auditLogger';
import { clearRateLimitCache } from '../middleware/rateLimiter';

export const getRateLimits = async (req: AuthRequest, res: Response) => {
  try {
    const rateLimits = await prisma.rateLimit.findMany({
      orderBy: { endpoint: 'asc' },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    return sendSuccess(res, rateLimits);
  } catch (error: any) {
    console.error('Get rate limits error:', error);
    return sendError(res, error.message, 500);
  }
};

export const createRateLimit = async (req: AuthRequest, res: Response) => {
  try {
    const { endpoint, method, maxRequests, windowMs, message } = req.body;

    // Validation
    if (!endpoint || !method || !maxRequests || !windowMs) {
      return sendError(res, 'Missing required fields', 400);
    }

    if (maxRequests < 1 || maxRequests > 10000) {
      return sendError(res, 'maxRequests must be between 1 and 10000', 400);
    }

    if (windowMs < 1000 || windowMs > 3600000) {
      return sendError(res, 'windowMs must be between 1000 and 3600000', 400);
    }

    // Check for duplicate (endpoint + method combination)
    const existing = await prisma.rateLimit.findUnique({
      where: { 
        endpoint_method: {
          endpoint,
          method: method.toUpperCase()
        }
      }
    });

    if (existing) {
      return sendError(res, 'Rate limit for this endpoint and method already exists', 400);
    }

    const rateLimit = await prisma.rateLimit.create({
      data: {
        endpoint,
        method: method.toUpperCase(),
        maxRequests,
        windowMs,
        message: message || `Too many requests. Please try again later.`,
        createdBy: req.user!.id
      }
    });

    // Log audit
    await logAdminAction({
      adminId: req.user!.id,
      action: AuditActions.CREATE,
      entity: AuditEntities.SYSTEM_SETTINGS,
      entityId: rateLimit.id.toString(),
      newValue: rateLimit,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Clear cache to pick up new config
    clearRateLimitCache();

    return sendSuccess(res, rateLimit, 'Rate limit created successfully', 201);
  } catch (error: any) {
    console.error('Create rate limit error:', error);
    return sendError(res, error.message, 500);
  }
};

export const updateRateLimit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { maxRequests, windowMs, message, isActive } = req.body;

    const existing = await prisma.rateLimit.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return sendError(res, 'Rate limit not found', 404);
    }

    const updated = await prisma.rateLimit.update({
      where: { id: parseInt(id) },
      data: {
        ...(maxRequests !== undefined && { maxRequests }),
        ...(windowMs !== undefined && { windowMs }),
        ...(message !== undefined && { message }),
        ...(isActive !== undefined && { isActive })
      }
    });

    // Log audit
    await logAdminAction({
      adminId: req.user!.id,
      action: AuditActions.UPDATE,
      entity: AuditEntities.SYSTEM_SETTINGS,
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Clear cache to pick up updated config
    clearRateLimitCache();

    return sendSuccess(res, updated, 'Rate limit updated successfully');
  } catch (error: any) {
    console.error('Update rate limit error:', error);
    return sendError(res, error.message, 500);
  }
};

export const deleteRateLimit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.rateLimit.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return sendError(res, 'Rate limit not found', 404);
    }

    await prisma.rateLimit.delete({
      where: { id: parseInt(id) }
    });

    // Log audit
    await logAdminAction({
      adminId: req.user!.id,
      action: AuditActions.DELETE,
      entity: AuditEntities.SYSTEM_SETTINGS,
      entityId: id,
      oldValue: existing,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Clear cache to pick up deleted config
    clearRateLimitCache();

    return sendSuccess(res, { message: 'Rate limit deleted successfully' });
  } catch (error: any) {
    console.error('Delete rate limit error:', error);
    return sendError(res, error.message, 500);
  }
};
