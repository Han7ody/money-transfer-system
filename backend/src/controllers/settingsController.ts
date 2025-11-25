// backend/src/controllers/settingsController.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logAdminAction, AuditActions, AuditEntities } from '../utils/auditLogger';
import emailService from '../services/emailService';
import path from 'path';
import { deleteFile } from '../utils/upload';

const prisma = new PrismaClient();

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

    // Validate required fields
    if (updates.platformName && typeof updates.platformName !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid platformName'
      });
    }

    if (updates.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.supportEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    if (updates.defaultFeePercent !== undefined) {
      const fee = Number(updates.defaultFeePercent);
      if (isNaN(fee) || fee < 0 || fee > 100) {
        return res.status(400).json({
          success: false,
          message: 'Default fee percent must be between 0 and 100'
        });
      }
    }

    // Update each setting
    const updatePromises = Object.entries(updates).map(([key, value]) => {
      return prisma.systemSettings.upsert({
        where: { key },
        update: {
          value: String(value),
          updatedBy: adminId
        },
        create: {
          key,
          value: String(value),
          category: 'general',
          updatedBy: adminId
        }
      });
    });

    await prisma.$transaction(updatePromises);

    // Log audit action
    await logAdminAction({
      adminId,
      action: AuditActions.UPDATE_GENERAL_SETTINGS,
      entity: AuditEntities.SYSTEM_SETTINGS,
      oldValue,
      newValue: updates,
      req
    });

    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: updates
    });
  } catch (error: any) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings'
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
