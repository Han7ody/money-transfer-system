// backend/src/utils/auditLogger.ts
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export interface AuditLogParams {
  adminId: number;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  req?: Request;
}

/**
 * Log an admin action to the audit log
 */
export const logAdminAction = async ({
  adminId,
  action,
  entity,
  entityId,
  oldValue,
  newValue,
  req
}: AuditLogParams): Promise<void> => {
  try {
    // Extract IP address
    let ipAddress: string | undefined;
    if (req) {
      ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                  req.socket?.remoteAddress ||
                  req.ip;
    }

    // Extract user agent
    const userAgent = req?.headers['user-agent'];

    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        oldValue: oldValue || null,
        newValue: newValue || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      }
    });

    console.log(`[AuditLog] ${action} on ${entity} by admin ${adminId}`);
  } catch (error) {
    console.error('[AuditLog] Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
  }
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
  COMPLETE_TRANSACTION: 'COMPLETE_TRANSACTION'
};

// Entity types for consistency
export const AuditEntities = {
  SYSTEM_SETTINGS: 'SystemSettings',
  EXCHANGE_RATES: 'ExchangeRates',
  USER: 'User',
  TRANSACTION: 'Transaction',
  AUTH: 'Auth'
};

export default { logAdminAction, AuditActions, AuditEntities };
