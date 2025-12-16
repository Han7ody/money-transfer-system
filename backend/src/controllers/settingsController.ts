// backend/src/controllers/settingsController.ts
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logAdminAction, AuditActions, AuditEntities } from '../utils/auditLogger';
import emailService from '../services/emailService';
import path from 'path';
import { deleteFile } from '../utils/upload';
import prisma from '../lib/prisma';
import { createOrUpdateSmtpConfig, getActiveSmtpConfig, decryptPassword } from '../services/smtpConfigService';

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

    // Convert snake_case keys to camelCase for frontend
    const settingsObject: Record<string, any> = {};
    settings.forEach((setting: any) => {
      const { key, value } = setting;
      // Convert snake_case to camelCase (maintenance_mode -> maintenanceMode)
      const camelKey = key.replace(/_([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
      
      // Parse values
      if (value === 'true') settingsObject[camelKey] = true;
      else if (value === 'false') settingsObject[camelKey] = false;
      else if (!isNaN(Number(value)) && value !== '') settingsObject[camelKey] = Number(value);
      else settingsObject[camelKey] = value;
    });
    
    console.log('[Settings Get] Returning settings:', settingsObject);

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
    
    console.log('[Settings Update] Received updates:', updates);

    // Whitelist of allowed fields (removed financial fields)
    const allowedFields = [
      'platformName',
      'supportEmail',
      'supportPhone',
      'maintenanceMode',
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
    
    console.log('[Settings Update] Filtered updates:', filteredUpdates);

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
    const updatePromises = Object.entries(filteredUpdates).map(async ([key, value]) => {
      // Convert camelCase to snake_case properly (maintenanceMode -> maintenance_mode)
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
      console.log(`[Settings Update] Converting ${key} -> ${dbKey}, value: ${value}`);
      
      const result = await prisma.systemSettings.upsert({
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
      
      console.log(`[Settings Update] Saved ${dbKey} = ${result.value}`);
      return result;
    });

    const results = await Promise.all(updatePromises);
    console.log('[Settings Update] All updates completed:', results.length);

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
    await emailService.sendRawEmail({
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
      entityId: 'smtp_test',
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
        entityId: 'smtp_test',
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


// ==================== SMTP SETTINGS ====================

// GET /admin/system/settings/smtp
export const getSmtpSettings = async (req: AuthRequest, res: Response) => {
  try {
    const config = await getActiveSmtpConfig();
    
    // Mask password for security
    const maskedConfig = {
      ...config,
      password: config.password ? '********' : ''
    };

    res.json({
      success: true,
      data: maskedConfig
    });
  } catch (error: any) {
    console.error('Get SMTP settings error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب إعدادات SMTP'
    });
  }
};

// PUT /admin/system/settings/smtp
export const updateSmtpSettings = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { host, port, username, password, encryption, fromEmail, fromName } = req.body;

    // Validation
    if (!host || !port || !username || !fromEmail || !fromName) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة'
      });
    }

    if (port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        message: 'رقم المنفذ غير صحيح'
      });
    }

    if (!['NONE', 'TLS', 'SSL'].includes(encryption)) {
      return res.status(400).json({
        success: false,
        message: 'نوع التشفير غير صحيح'
      });
    }

    // Get old config for audit
    const oldConfig = await getActiveSmtpConfig();

    // Create or update config
    const newConfig = await createOrUpdateSmtpConfig({
      host,
      port: parseInt(port),
      username,
      password: password || oldConfig.password, // Keep old password if not provided
      encryption,
      fromEmail,
      fromName,
      createdBy: adminId
    });

    // Refresh email service transporter
    await emailService.refreshTransporter();

    // Log audit action
    await logAdminAction({
      adminId,
      action: AuditActions.UPDATE,
      entity: AuditEntities.SYSTEM_SETTINGS,
      entityId: 'smtp_config',
      oldValue: { ...oldConfig, password: '********' },
      newValue: { ...newConfig, password: '********' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث إعدادات SMTP بنجاح',
      data: {
        ...newConfig,
        password: '********'
      }
    });
  } catch (error: any) {
    console.error('Update SMTP settings error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث إعدادات SMTP'
    });
  }
};

// POST /admin/system/settings/smtp/test
export const testSmtpConnection = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { testEmail } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مطلوب'
      });
    }

    // Send test email
    const success = await emailService.sendRawEmail({
      to: testEmail,
      subject: 'اختبار إعدادات SMTP - Rasid',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4f46e5;">اختبار إعدادات SMTP</h2>
          <p>هذه رسالة اختبار للتحقق من أن إعدادات SMTP تعمل بشكل صحيح.</p>
          <p><strong>تاريخ الإرسال:</strong> ${new Date().toLocaleString('ar-SA')}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">إذا استلمت هذه الرسالة، فإن إعدادات SMTP مضبوطة بشكل صحيح.</p>
        </div>
      `
    });

    if (!success) {
      throw new Error('Failed to send test email');
    }

    // Log audit action
    await logAdminAction({
      adminId,
      action: 'TEST_SMTP',
      entity: AuditEntities.SYSTEM_SETTINGS,
      entityId: 'smtp_test',
      newValue: { testEmail, status: 'success' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: `تم إرسال رسالة اختبار بنجاح إلى ${testEmail}`
    });
  } catch (error: any) {
    console.error('SMTP test error:', error);

    // Log failed test
    if (req.user?.id) {
      await logAdminAction({
        adminId: req.user.id,
        action: 'TEST_SMTP',
        entity: AuditEntities.SYSTEM_SETTINGS,
        entityId: 'smtp_test',
        newValue: { status: 'failed', error: error.message },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'فشل في إرسال رسالة الاختبار. يرجى التحقق من إعدادات SMTP.'
    });
  }
};

// ==================== EMAIL TEMPLATES ====================

// GET /admin/settings/email-templates
export const getEmailTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { displayName: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.emailTemplate.count({ where })
    ]);

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get email templates error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب قوالب البريد الإلكتروني'
    });
  }
};

// GET /admin/settings/email-templates/:id
export const getEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'القالب غير موجود'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    console.error('Get email template error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب القالب'
    });
  }
};

// PUT /admin/settings/email-templates/:id
export const updateEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    const { displayName, subject, bodyHtml, bodyText, isActive } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const existing = await prisma.emailTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'القالب غير موجود'
      });
    }

    // Validation
    if (subject && subject.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'عنوان الرسالة طويل جداً'
      });
    }

    const updated = await prisma.emailTemplate.update({
      where: { id: parseInt(id) },
      data: {
        ...(displayName && { displayName }),
        ...(subject && { subject }),
        ...(bodyHtml && { bodyHtml }),
        ...(bodyText !== undefined && { bodyText }),
        ...(isActive !== undefined && { isActive })
      }
    });

    // Log audit action
    await logAdminAction({
      adminId,
      action: AuditActions.UPDATE,
      entity: AuditEntities.SYSTEM_SETTINGS,
      entityId: `email_template_${id}`,
      oldValue: existing,
      newValue: updated,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث القالب بنجاح',
      data: updated
    });
  } catch (error: any) {
    console.error('Update email template error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث القالب'
    });
  }
};

// POST /admin/settings/email-templates/:id/test
export const testEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    const { testEmail, context = {} } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مطلوب'
      });
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'القالب غير موجود'
      });
    }

    // Replace variables in subject and body
    let subject = template.subject;
    let bodyHtml = template.bodyHtml;

    // Use provided context or default test values
    const testContext = {
      name: 'اسم المستخدم',
      transaction_id: 'TXN-12345',
      amount_sent: '1000',
      from_currency: 'SAR',
      amount_received: '250000',
      to_currency: 'SDG',
      exchange_rate: '250',
      recipient_name: 'اسم المستلم',
      completion_date: new Date().toLocaleDateString('ar-SA'),
      otp: '123456',
      reason: 'سبب الرفض',
      ...context
    };

    // Replace variables
    Object.entries(testContext).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value));
      bodyHtml = bodyHtml.replace(regex, String(value));
    });

    // Send test email
    const success = await emailService.sendRawEmail({
      to: testEmail,
      subject,
      html: bodyHtml
    });

    if (!success) {
      throw new Error('Failed to send test email');
    }

    // Log audit action
    await logAdminAction({
      adminId,
      action: 'TEST_EMAIL_TEMPLATE',
      entity: AuditEntities.SYSTEM_SETTINGS,
      entityId: `email_template_${id}`,
      newValue: { testEmail, templateName: template.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: `تم إرسال رسالة اختبار بنجاح إلى ${testEmail}`
    });
  } catch (error: any) {
    console.error('Test email template error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في إرسال رسالة الاختبار'
    });
  }
};

// ==================== CURRENCIES ====================

// GET /admin/currencies
export const getCurrencies = async (req: AuthRequest, res: Response) => {
  try {
    const currencies = await prisma.currency.findMany({
      orderBy: { code: 'asc' }
    });

    res.json({
      success: true,
      data: currencies
    });
  } catch (error: any) {
    console.error('Get currencies error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب العملات'
    });
  }
};

// POST /admin/currencies
export const createCurrency = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { code, name, symbol, country } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Validation
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'الكود والاسم مطلوبان'
      });
    }

    // Code must be uppercase and 3 characters
    const upperCode = code.toUpperCase();
    if (upperCode.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'كود العملة يجب أن يكون 3 أحرف'
      });
    }

    // Check if currency already exists
    const existing = await prisma.currency.findUnique({
      where: { code: upperCode }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'العملة موجودة بالفعل'
      });
    }

    const currency = await prisma.currency.create({
      data: {
        code: upperCode,
        name,
        symbol: symbol || code,
        country: country || null
      }
    });

    // Log audit action
    await logAdminAction({
      adminId,
      action: AuditActions.CREATE,
      entity: 'CURRENCY',
      entityId: currency.id.toString(),
      newValue: currency,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم إضافة العملة بنجاح',
      data: currency
    });
  } catch (error: any) {
    console.error('Create currency error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في إضافة العملة'
    });
  }
};

// PUT /admin/currencies/:id
export const updateCurrency = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    const { name, symbol, country, isActive } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const existing = await prisma.currency.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'العملة غير موجودة'
      });
    }

    const updated = await prisma.currency.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(symbol && { symbol }),
        ...(country !== undefined && { country }),
        ...(isActive !== undefined && { isActive })
      }
    });

    // Log audit action
    await logAdminAction({
      adminId,
      action: AuditActions.UPDATE,
      entity: 'CURRENCY',
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'تم تحديث العملة بنجاح',
      data: updated
    });
  } catch (error: any) {
    console.error('Update currency error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث العملة'
    });
  }
};

// PATCH /admin/currencies/:id/toggle
export const toggleCurrency = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const existing = await prisma.currency.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'العملة غير موجودة'
      });
    }

    const updated = await prisma.currency.update({
      where: { id: parseInt(id) },
      data: { isActive: !existing.isActive }
    });

    // Log audit action
    await logAdminAction({
      adminId,
      action: AuditActions.UPDATE,
      entity: 'CURRENCY',
      entityId: id,
      oldValue: { isActive: existing.isActive },
      newValue: { isActive: updated.isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: updated.isActive ? 'تم تفعيل العملة' : 'تم إيقاف العملة',
      data: updated
    });
  } catch (error: any) {
    console.error('Toggle currency error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث حالة العملة'
    });
  }
};

// ==================== POLICIES ====================

// GET /admin/settings/policies
export const getPolicies = async (req: AuthRequest, res: Response) => {
  try {
    const policies = await prisma.policy.findMany({
      orderBy: { type: 'asc' }
    });

    res.json({
      success: true,
      data: policies
    });
  } catch (error: any) {
    console.error('Get policies error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب السياسات'
    });
  }
};

// GET /admin/settings/policies/:type
export const getPolicy = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;

    const policy = await prisma.policy.findUnique({
      where: { type: type.toUpperCase() }
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'السياسة غير موجودة'
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error: any) {
    console.error('Get policy error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب السياسة'
    });
  }
};

// PUT /admin/settings/policies/:type
export const updatePolicy = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { type } = req.params;
    const { title, content, version, isPublished } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'العنوان والمحتوى مطلوبان'
      });
    }

    const policyType = type.toUpperCase();

    // Check if policy exists
    const existing = await prisma.policy.findUnique({
      where: { type: policyType }
    });

    let policy;
    if (existing) {
      // Update existing
      policy = await prisma.policy.update({
        where: { type: policyType },
        data: {
          title,
          content,
          version: version || existing.version,
          isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
          publishedAt: isPublished && !existing.isPublished ? new Date() : existing.publishedAt
        }
      });

      // Log audit action
      await logAdminAction({
        adminId,
        action: AuditActions.UPDATE,
        entity: 'POLICY',
        entityId: policyType,
        oldValue: existing,
        newValue: policy,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } else {
      // Create new
      policy = await prisma.policy.create({
        data: {
          type: policyType,
          title,
          content,
          version: version || '1.0',
          isPublished: isPublished || false,
          publishedAt: isPublished ? new Date() : null,
          createdBy: adminId
        }
      });

      // Log audit action
      await logAdminAction({
        adminId,
        action: AuditActions.CREATE,
        entity: 'POLICY',
        entityId: policyType,
        newValue: policy,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    res.json({
      success: true,
      message: 'تم حفظ السياسة بنجاح',
      data: policy
    });
  } catch (error: any) {
    console.error('Update policy error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في حفظ السياسة'
    });
  }
};
