// backend/src/utils/auditLogger.ts
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export interface AuditLogParams {
  adminId?: number;
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  details?: any;
  req?: Request;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Log an admin action to the audit log
 */
export const logAdminAction = async ({
  adminId,
  userId,
  action,
  entity,
  entityId,
  oldValue,
  newValue,
  details,
  req,
  ipAddress: providedIpAddress,
  userAgent: providedUserAgent,
  sessionId
}: AuditLogParams): Promise<void> => {
  try {
    // Validate required fields
    if (!action) {
      return;
    }

    // Extract IP address (use provided or extract from req)
    let ipAddress: string | undefined = providedIpAddress;
    if (!ipAddress && req) {
      ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                  req.socket?.remoteAddress ||
                  req.ip;
    }

    // Extract user agent (use provided or extract from req)
    const userAgent = providedUserAgent || req?.headers['user-agent'];

    // Extract session ID from JWT if available
    let finalSessionId = sessionId;
    if (!finalSessionId && req && (req as any).user) {
      finalSessionId = (req as any).user.sessionId || (req as any).user.jti;
    }

    // Ensure we have either adminId or userId
    const actorId = adminId || (userId ? parseInt(userId) : null);

    await prisma.auditLog.create({
      data: {
        adminId: actorId,
        action,
        entity: entity || null,
        entityId: entityId ? String(entityId) : null,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      }
    });

  } catch (error) {
    // Don't throw - audit logging should not break the main operation
  }
};

/**
 * Simplified audit log function for use with user ID string
 */
export const auditLog = async (params: {
  action: string;
  userId: string;
  details?: any;
  req?: Request;
}): Promise<void> => {
  return logAdminAction({
    userId: params.userId,
    action: params.action,
    details: params.details,
    req: params.req
  });
};

// Pre-defined action types for consistency
export const AuditActions = {
  // Authentication
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  ADMIN_LOGOUT: 'ADMIN_LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',

  // Exchange Rates
  UPDATE_EXCHANGE_RATE: 'UPDATE_EXCHANGE_RATE',
  CREATE_EXCHANGE_RATE: 'CREATE_EXCHANGE_RATE',
  DELETE_EXCHANGE_RATE: 'DELETE_EXCHANGE_RATE',

  // System Settings
  UPDATE_GENERAL_SETTINGS: 'UPDATE_GENERAL_SETTINGS',
  UPDATE_SMTP: 'UPDATE_SMTP',
  UPDATE_SECURITY_SETTINGS: 'UPDATE_SECURITY_SETTINGS',

  // User Management
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  APPROVE_KYC: 'APPROVE_KYC',
  REJECT_KYC: 'REJECT_KYC',

  // Transaction Management
  APPROVE_TRANSACTION: 'APPROVE_TRANSACTION',
  REJECT_TRANSACTION: 'REJECT_TRANSACTION',
  COMPLETE_TRANSACTION: 'COMPLETE_TRANSACTION',
  ASSIGN_AGENT: 'ASSIGN_AGENT',
  CONFIRM_PICKUP: 'CONFIRM_PICKUP',

  // Agent Management
  CREATE_AGENT: 'CREATE_AGENT',
  UPDATE_AGENT: 'UPDATE_AGENT',
  UPDATE_AGENT_STATUS: 'UPDATE_AGENT_STATUS',
  DELETE_AGENT: 'DELETE_AGENT',

  // Generic CRUD actions
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
};

// Entity types for consistency
export const AuditEntities = {
  SYSTEM_SETTINGS: 'SystemSettings',
  EXCHANGE_RATES: 'ExchangeRates',
  USER: 'User',
  TRANSACTION: 'Transaction',
  AUTH: 'Auth',
  AGENT: 'Agent'
};

export default { logAdminAction, AuditActions, AuditEntities };
