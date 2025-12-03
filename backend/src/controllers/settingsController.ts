// backend/src/controllers/settingsController.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logAdminAction, AuditActions, AuditEntities } from '../utils/auditLogger';
import emailService from '../services/emailService';
import path from 'path';
import { deleteFile } from '../utils/upload';
import prisma from '../lib/prisma';

// Helper: Transform settings array to object
const settingsArrayToObject = (settings: any[]): Record<string, any> => {
  const result: Record<string, any> = {};
  settings.forEach((setting) => {
    const { key, value } = setting;
    // Parse JSON values or numbers
    try {
      if (value === 'true') result[key] = true;
      else if (value === 'false') result[key] = false;
      else if (!isNaN(Number(value)) && value !== '') result[key] = Number(value);
      else result[key] = value;
    } catch {
      result[key] = value;
    }
  });
  return result;
};

/**
 * GET: Fetch maintenance mode status
 * Public endpoint - accessible without authentication
 */
export const getMaintenanceFlag = async (req: any, res: Response) => {
  try {
    let maintenanceSetting = await prisma.systemSettings.findUnique({
      where: { key: 'maintenance_mode' }
    });

    // If record doesn't exist, create it with false value
    if (!maintenanceSetting) {
      try {
        maintenanceSetting = await prisma.systemSettings.create({
          data: {
            key: 'maintenance_mode',
            value: 'false',
            category: 'general'
          }
        });
      } catch (error) {
        // Record might have been created by another request, fetch it again
        maintenanceSetting = await prisma.systemSettings.findUnique({
          where: { key: 'maintenance_mode' }
        });
      }
    }

    const isMaintenanceMode = maintenanceSetting?.value === 'true';

    res.json({
      success: true,
      data: {
        maintenance: isMaintenanceMode
      }
    });
  } catch (error) {
    console.error('Get maintenance flag error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب حالة الصيانة'
    });
  }
};

// GET /admin/system/settings
export const getSystemSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: { category: 'general' },
      orderBy: { key: 'asc' }
    });

    const settingsObject = settingsArrayToObject(settings);

    res.json({
      success: true,
      data: settingsObject
    });
  } catch (error: any) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings'
    });
  }
};

// PATCH /admin/system/settings
export const updateSystemSettings = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get current settings for audit log
    const currentSettings = await prisma.systemSettings.findMany({
      where: { category: 'general' }
    });
    const oldValue = settingsArrayToObject(currentSettings);

    const updates = req.body;

    // Whitelist of allowed fields (removed financial fields)
    const allowedFields = [
      'platformName',
      'supportEmail',
      'supportPhone',
      'maintenance_mode',
      'timezone',
      'companyAddress',
      'defaultLanguage',
      'dateFormat',
      'timeFormat'
    ];

    // Filter out disallowed fields
    const filteredUpdates: Record<string, any> = {};
    allowedFields.forEach((field) => {
      if (field in updates) {
        filteredUpdates[field] = updates[field];
      }
    });

    // Validate required fields
    if (filteredUpdates.platformName && typeof filteredUpdates.platformName !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid platformName'
      });
    }

    if (filteredUpdates.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(filteredUpdates.supportEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    // Update each setting
    const updatePromises = Object.entries(filteredUpdates).map(([key, value]) => {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      return prisma.systemSettings.upsert({
        where: { key: dbKey },
        update: {
          value: String(value),
          updatedBy: adminId,
          updatedAt: new Date()
        },
        create: {
          key: dbKey,
          value: String(value),
          category: 'general',
          updatedBy: adminId
        }
      });
    });

    await Promise.all(updatePromises);

    // Log audit action only if something changed
    if (Object.keys(filteredUpdates).length > 0) {
      await logAdminAction({
        adminId,
        action: AuditActions.UPDATE_GENERAL_SETTINGS,
        entity: AuditEntities.SYSTEM_SETTINGS,
        oldValue,
        newValue: filteredUpdates,
        req
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح',
      data: filteredUpdates
    });
  } catch (error: any) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث الإعدادات'
    });
  }
};

// POST /admin/system/settings/logo
export const uploadSettingsLogo = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get old logo to delete it
    const oldLogoSetting = await prisma.systemSettings.findUnique({
      where: { key: 'logoUrl' }
    });

    if (oldLogoSetting && oldLogoSetting.value) {
      const oldLogoPath = path.join(__dirname, '../../uploads/logos', path.basename(oldLogoSetting.value));
      deleteFile(oldLogoPath);
    }

    // Generate logo URL
    const logoUrl = `${req.protocol}://${req.get('host')}/uploads/logos/${file.filename}`;

    // Save to database
    await prisma.systemSettings.upsert({
      where: { key: 'logoUrl' },
      update: {
        value: logoUrl,
        updatedBy: adminId
      },
      create: {
        key: 'logoUrl',
        value: logoUrl,
        category: 'general',
        updatedBy: adminId
      }
    });

    // Log audit action
    await logAdminAction({
      adminId,
      action: AuditActions.UPDATE_GENERAL_SETTINGS,
      entity: AuditEntities.SYSTEM_SETTINGS,
      entityId: 'logoUrl',
      oldValue: { logoUrl: oldLogoSetting?.value || null },
      newValue: { logoUrl },
      req
    });

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: { logoUrl }
    });
  } catch (error: any) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo'
    });
  }
};

// POST /admin/system/settings/smtp/test
export const testSmtpSettings = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const adminEmail = req.user?.email;

    if (!adminId || !adminEmail) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get support email from settings
    const supportEmailSetting = await prisma.systemSettings.findUnique({
      where: { key: 'supportEmail' }
    });

    const testEmail = supportEmailSetting?.value || adminEmail;

    // Send test email
    await emailService.sendEmail({
      to: testEmail,
      subject: 'SMTP Test Email',
      html: `
        <h2>SMTP Configuration Test</h2>
        <p>This is a test email to verify your SMTP settings are working correctly.</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Sent by:</strong> ${adminEmail}</p>
        <hr />
        <p>If you received this email, your SMTP settings are configured correctly.</p>
      `
    });

    // Log audit action
    await logAdminAction({
      adminId,
      action: 'TEST_SMTP',
      entity: AuditEntities.SYSTEM_SETTINGS,
      newValue: { testEmail, status: 'success' },
      req
    });

    res.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`
    });
  } catch (error: any) {
    console.error('SMTP test error:', error);

    // Log failed test
    if (req.user?.id) {
      await logAdminAction({
        adminId: req.user.id,
        action: 'TEST_SMTP',
        entity: AuditEntities.SYSTEM_SETTINGS,
        newValue: { status: 'failed', error: error.message },
        req
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send test email. Please check your SMTP configuration.'
    });
  }
};
