import nodemailer from 'nodemailer';
import { getActiveSmtpConfig } from './smtpConfigService';

// Email templates data
const templates = {
  welcome: {
    ar: {
      subject: 'مرحباً بك في راصد - حسابك جاهز',
      body: `مرحباً {{name}}،

أهلاً بك في راصد! يسعدنا انضمامك إلى منصتنا لتحويل الأموال.

حسابك الآن جاهز للاستخدام. يمكنك البدء بإجراء تحويلاتك المالية بكل سهولة وأمان.

للبدء، يرجى إكمال عملية التحقق من هويتك (KYC) للاستفادة من جميع خدماتنا.

مع تحيات،
فريق راصد`
    },
    en: {
      subject: 'Welcome to Rasid - Your Account is Ready',
      body: `Hello {{name}},

Welcome to Rasid! We're delighted to have you join our money transfer platform.

Your account is now ready to use. You can start making your financial transfers easily and securely.

To get started, please complete your identity verification (KYC) to access all our services.

Best regards,
The Rasid Team`
    }
  },
  email_verification: {
    ar: {
      subject: 'رمز التحقق من بريدك الإلكتروني - راصد',
      body: `مرحباً {{name}}،

رمز التحقق الخاص بك هو:

{{otp}}

هذا الرمز صالح لمدة 10 دقائق فقط. لا تشاركه مع أي شخص.

إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد.

مع تحيات،
فريق راصد`
    },
    en: {
      subject: 'Your Email Verification Code - Rasid',
      body: `Hello {{name}},

Your verification code is:

{{otp}}

This code is valid for 10 minutes only. Do not share it with anyone.

If you didn't request this code, please ignore this email.

Best regards,
The Rasid Team`
    }
  },
  kyc_received: {
    ar: {
      subject: 'تم استلام وثائقك - قيد المراجعة',
      body: `مرحباً {{name}}،

شكراً لك! لقد تلقينا وثائق التحقق من هويتك بنجاح.

فريقنا يقوم الآن بمراجعة مستنداتك. عادةً ما تستغرق هذه العملية من 24 إلى 48 ساعة عمل.

سنقوم بإشعارك فور اكتمال المراجعة.

مع تحيات،
فريق راصد`
    },
    en: {
      subject: 'Documents Received - Under Review',
      body: `Hello {{name}},

Thank you! We have successfully received your identity verification documents.

Our team is now reviewing your documents. This process typically takes 24-48 business hours.

We will notify you once the review is complete.

Best regards,
The Rasid Team`
    }
  },
  kyc_approved: {
    ar: {
      subject: 'تمت الموافقة على التحقق من هويتك ✓',
      body: `مرحباً {{name}}،

أخبار سارة! تمت الموافقة على وثائق التحقق من هويتك بنجاح.

حسابك الآن موثق بالكامل ويمكنك الاستفادة من جميع خدمات راصد:
• إجراء تحويلات مالية دولية
• حدود تحويل أعلى
• أسعار صرف تنافسية

ابدأ أول تحويل لك الآن!

مع تحيات،
فريق راصد`
    },
    en: {
      subject: 'Identity Verification Approved ✓',
      body: `Hello {{name}},

Great news! Your identity verification documents have been successfully approved.

Your account is now fully verified and you can access all Rasid services:
• Make international money transfers
• Higher transfer limits
• Competitive exchange rates

Start your first transfer now!

Best regards,
The Rasid Team`
    }
  },
  kyc_rejected: {
    ar: {
      subject: 'يلزم تحديث وثائق التحقق',
      body: `مرحباً {{name}}،

للأسف، لم نتمكن من الموافقة على وثائق التحقق من هويتك للسبب التالي:

{{reason}}

يرجى إعادة رفع المستندات المطلوبة مع التأكد من:
• وضوح الصورة وجودتها
• ظهور جميع المعلومات بشكل كامل
• صلاحية المستند

إذا كنت بحاجة إلى مساعدة، لا تتردد في التواصل مع فريق الدعم.

مع تحيات،
فريق راصد`
    },
    en: {
      subject: 'Verification Documents Need Update',
      body: `Hello {{name}},

Unfortunately, we were unable to approve your identity verification documents for the following reason:

{{reason}}

Please re-upload the required documents ensuring:
• Clear and high-quality image
• All information is fully visible
• Document is valid and not expired

If you need assistance, please don't hesitate to contact our support team.

Best regards,
The Rasid Team`
    }
  },
  transaction_created: {
    ar: {
      subject: 'تم إنشاء تحويل جديد - {{transaction_id}}',
      body: `مرحباً {{name}}،

تم إنشاء طلب تحويل جديد بنجاح.

تفاصيل التحويل:
• رقم المرجع: {{transaction_id}}
• المبلغ المرسل: {{amount_sent}} {{from_currency}}
• المبلغ المستلم: {{amount_received}} {{to_currency}}
• سعر الصرف: {{exchange_rate}}
• المستفيد: {{recipient_name}}

الخطوة التالية:
يرجى إتمام عملية الدفع ورفع إيصال التحويل لمتابعة معالجة طلبك.

مع تحيات،
فريق راصد`
    },
    en: {
      subject: 'New Transfer Created - {{transaction_id}}',
      body: `Hello {{name}},

Your new transfer request has been successfully created.

Transfer Details:
• Reference Number: {{transaction_id}}
• Amount Sent: {{amount_sent}} {{from_currency}}
• Amount Received: {{amount_received}} {{to_currency}}
• Exchange Rate: {{exchange_rate}}
• Recipient: {{recipient_name}}

Next Step:
Please complete the payment and upload the transfer receipt to continue processing your request.

Best regards,
The Rasid Team`
    }
  },
  transaction_completed: {
    ar: {
      subject: 'تم إتمام تحويلك بنجاح ✓ - {{transaction_id}}',
      body: `مرحباً {{name}}،

يسعدنا إبلاغك بأن تحويلك قد تم بنجاح!

ملخص التحويل:
• رقم المرجع: {{transaction_id}}
• المبلغ المرسل: {{amount_sent}} {{from_currency}}
• المبلغ المستلم: {{amount_received}} {{to_currency}}
• المستفيد: {{recipient_name}}
• تاريخ الإتمام: {{completion_date}}

تم إيداع المبلغ في حساب المستفيد بنجاح.

شكراً لاختيارك راصد!

مع تحيات،
فريق راصد`
    },
    en: {
      subject: 'Transfer Completed Successfully ✓ - {{transaction_id}}',
      body: `Hello {{name}},

We're pleased to inform you that your transfer has been completed successfully!

Transfer Summary:
• Reference Number: {{transaction_id}}
• Amount Sent: {{amount_sent}} {{from_currency}}
• Amount Received: {{amount_received}} {{to_currency}}
• Recipient: {{recipient_name}}
• Completion Date: {{completion_date}}

The amount has been successfully deposited to the recipient's account.

Thank you for choosing Rasid!

Best regards,
The Rasid Team`
    }
  },
  transaction_failed: {
    ar: {
      subject: 'تم إلغاء/فشل التحويل - {{transaction_id}}',
      body: `مرحباً {{name}}،

نأسف لإبلاغك بأن تحويلك رقم {{transaction_id}} لم يتم إتمامه.

السبب: {{reason}}

تفاصيل التحويل:
• المبلغ: {{amount_sent}} {{from_currency}}
• المستفيد: {{recipient_name}}

إذا تم خصم أي مبلغ، سيتم إرجاعه خلال 3-5 أيام عمل.

إذا كنت بحاجة إلى مساعدة، يرجى التواصل مع فريق الدعم.

مع تحيات،
فريق راصد`
    },
    en: {
      subject: 'Transfer Cancelled/Failed - {{transaction_id}}',
      body: `Hello {{name}},

We regret to inform you that your transfer {{transaction_id}} was not completed.

Reason: {{reason}}

Transfer Details:
• Amount: {{amount_sent}} {{from_currency}}
• Recipient: {{recipient_name}}

If any amount was deducted, it will be refunded within 3-5 business days.

If you need assistance, please contact our support team.

Best regards,
The Rasid Team`
    }
  },
  account_suspension: {
    ar: {
      subject: 'تعليق حسابك مؤقتاً - راصد',
      body: `عزيزي {{name}}،

نأسف لإبلاغك بأنه تم تعليق حسابك مؤقتاً بسبب نشاط مشبوه تم اكتشافه.

تفاصيل التعليق:
- رقم القضية: {{case_number}}
- تاريخ التعليق: {{suspension_date}}
- السبب: {{reason}}

ما يعنيه هذا:
• لن تتمكن من الوصول إلى حسابك مؤقتاً
• جميع المعاملات المعلقة تم إيقافها
• سيتم مراجعة حسابك من قبل فريق الامتثال

الخطوات التالية:
1. سيقوم فريقنا بمراجعة حسابك خلال 3-5 أيام عمل
2. قد نطلب منك تقديم مستندات إضافية
3. سيتم إشعارك بنتيجة المراجعة عبر البريد الإلكتروني

إذا كان لديك أي استفسارات أو تعتقد أن هذا خطأ، يرجى التواصل مع فريق الدعم على الفور.

مع تحيات،
فريق راصد للامتثال`
    },
    en: {
      subject: 'Account Temporarily Suspended - Rasid',
      body: `Dear {{name}},

We regret to inform you that your account has been temporarily suspended due to suspicious activity detected.

Suspension Details:
- Case Number: {{case_number}}
- Suspension Date: {{suspension_date}}
- Reason: {{reason}}

What this means:
• You will not be able to access your account temporarily
• All pending transactions have been halted
• Your account will be reviewed by our compliance team

Next Steps:
1. Our team will review your account within 3-5 business days
2. We may request additional documentation from you
3. You will be notified of the review outcome via email

If you have any questions or believe this is an error, please contact our support team immediately.

Best regards,
Rasid Compliance Team`
    }
  }
};

// Create transporter with database config or fallback to env
const createTransporter = async () => {
  const config = await getActiveSmtpConfig();
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.encryption === 'SSL',
    auth: {
      user: config.username,
      pass: config.password
    }
  });
};

// Replace template variables
const replaceVariables = (text: string, variables: Record<string, string>): string => {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
};

// Generate HTML email
const generateHtmlEmail = (body: string, isRtl: boolean = false): string => {
  const direction = isRtl ? 'rtl' : 'ltr';
  const textAlign = isRtl ? 'right' : 'left';

  return `
<!DOCTYPE html>
<html lang="${isRtl ? 'ar' : 'en'}" dir="${direction}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rasid</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 auto;">
    <tr>
      <td style="padding: 20px 0; text-align: center; background-color: #F9FAFB;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto;">
          <tr>
            <td style="padding: 24px 40px; text-align: center; background: linear-gradient(135deg, #2E77FF 0%, #4CAFED 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff;">
                ${isRtl ? 'راصد | Rasid' : 'Rasid | راصد'}
              </h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 20px; background-color: #F9FAFB;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
              <div style="font-size: 16px; line-height: 1.7; color: #1F2937; text-align: ${textAlign}; white-space: pre-line;">
${body}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 0;">
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9CA3AF; text-align: center;">
                © ${new Date().getFullYear()} Rasid. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Email service class
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  async getTransporter() {
    if (!this.transporter) {
      this.transporter = await createTransporter();
    }
    return this.transporter;
  }

  // Refresh transporter (call after SMTP config changes)
  async refreshTransporter() {
    this.transporter = await createTransporter();
  }

  async sendEmail(
    to: string,
    templateName: keyof typeof templates,
    variables: Record<string, string>,
    language: 'ar' | 'en' = 'ar'
  ): Promise<boolean> {
    try {
      const template = templates[templateName]?.[language];
      if (!template) {
        return false;
      }

      const subject = replaceVariables(template.subject, variables);
      const body = replaceVariables(template.body, variables);
      const html = generateHtmlEmail(body, language === 'ar');

      const config = await getActiveSmtpConfig();
      const transporter = await this.getTransporter();

      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to,
        subject,
        text: body,
        html
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // Convenience methods for specific emails
  async sendWelcomeEmail(to: string, name: string, language: 'ar' | 'en' = 'ar') {
    return this.sendEmail(to, 'welcome', { name }, language);
  }

  async sendVerificationEmail(to: string, name: string, otp: string, language: 'ar' | 'en' = 'ar') {
    return this.sendEmail(to, 'email_verification', { name, otp }, language);
  }

  async sendKycReceivedEmail(to: string, name: string, language: 'ar' | 'en' = 'ar') {
    return this.sendEmail(to, 'kyc_received', { name }, language);
  }

  async sendKycApprovedEmail(to: string, name: string, language: 'ar' | 'en' = 'ar') {
    return this.sendEmail(to, 'kyc_approved', { name }, language);
  }

  async sendKycRejectedEmail(to: string, name: string, reason: string, language: 'ar' | 'en' = 'ar') {
    return this.sendEmail(to, 'kyc_rejected', { name, reason }, language);
  }

  async sendKycMoreDocsEmail(to: string, name: string, reason: string, language: 'ar' | 'en' = 'ar') {
    return this.sendEmail(to, 'kyc_rejected', { name, reason }, language);
  }

  async sendTransactionCreatedEmail(
    to: string,
    variables: {
      name: string;
      transaction_id: string;
      amount_sent: string;
      from_currency: string;
      amount_received: string;
      to_currency: string;
      exchange_rate: string;
      recipient_name: string;
    },
    language: 'ar' | 'en' = 'ar'
  ) {
    return this.sendEmail(to, 'transaction_created', variables, language);
  }

  async sendTransactionCompletedEmail(
    to: string,
    variables: {
      name: string;
      transaction_id: string;
      amount_sent: string;
      from_currency: string;
      amount_received: string;
      to_currency: string;
      recipient_name: string;
      completion_date: string;
    },
    language: 'ar' | 'en' = 'ar'
  ) {
    return this.sendEmail(to, 'transaction_completed', variables, language);
  }

  async sendTransactionFailedEmail(
    to: string,
    variables: {
      name: string;
      transaction_id: string;
      reason: string;
      amount_sent: string;
      from_currency: string;
      recipient_name: string;
    },
    language: 'ar' | 'en' = 'ar'
  ) {
    return this.sendEmail(to, 'transaction_failed', variables, language);
  }

  /**
   * Send raw HTML email (for testing and custom emails)
   */
  async sendRawEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    try {
      const config = await getActiveSmtpConfig();
      const transporter = await this.getTransporter();

      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // Send agent assigned email
  async sendAgentAssignedEmail(
    to: string,
    userName: string,
    details: {
      transactionRef: string;
      agentName: string;
      agentPhone: string;
      agentWhatsapp: string;
      pickupCity: string;
      pickupCode: string;
      amount: string;
    }
  ): Promise<boolean> {
    const subject = `تم تعيين وكيل لمعاملتك - ${details.transactionRef}`;
    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">مرحباً ${userName}،</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            تم تعيين وكيل لاستلام معاملتك <strong>${details.transactionRef}</strong>
          </p>

          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">معلومات الوكيل:</h3>
            <p style="margin: 10px 0;"><strong>الاسم:</strong> ${details.agentName}</p>
            <p style="margin: 10px 0;"><strong>الهاتف:</strong> ${details.agentPhone}</p>
            <p style="margin: 10px 0;"><strong>واتساب:</strong> ${details.agentWhatsapp}</p>
            <p style="margin: 10px 0;"><strong>المدينة:</strong> ${details.pickupCity}</p>
          </div>

          <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">رمز الاستلام:</h3>
            <p style="font-size: 32px; font-weight: bold; color: #92400e; text-align: center; margin: 10px 0; letter-spacing: 4px;">
              ${details.pickupCode}
            </p>
            <p style="color: #92400e; font-size: 14px; text-align: center;">
              احتفظ بهذا الرمز سرياً ولا تشاركه إلا مع الوكيل عند الاستلام
            </p>
          </div>

          <div style="background-color: #dbeafe; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0;">
              <strong>المبلغ المستحق:</strong> ${details.amount}
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            <h4 style="color: #1f2937;">تعليمات الاستلام:</h4>
            <ol style="color: #374151; line-height: 1.8;">
              <li>تواصل مع الوكيل لتحديد موعد الاستلام</li>
              <li>احضر معك بطاقة الهوية الشخصية</li>
              <li>أعط الوكيل رمز الاستلام المذكور أعلاه</li>
              <li>تأكد من عد المبلغ قبل مغادرة الوكيل</li>
            </ol>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            مع تحيات،<br>
            فريق راصد
          </p>
        </div>
      </div>
    `;

    return this.sendRawEmail({ to, subject, html });
  }

  // Send transaction completed email (overload for cash pickup)
  async sendCashPickupCompletedEmail(
    to: string,
    userName: string,
    details: {
      transactionRef: string;
      amount: string;
      recipientName: string;
      completedAt: string;
    }
  ): Promise<boolean> {
    const subject = `تم إكمال معاملتك بنجاح - ${details.transactionRef}`;
    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: #10b981; border-radius: 50%; padding: 15px;">
              <span style="font-size: 40px;">✓</span>
            </div>
          </div>

          <h2 style="color: #10b981; text-align: center; margin-bottom: 20px;">تم إكمال المعاملة بنجاح!</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
            مرحباً ${userName}،<br>
            تم تسليم المبلغ بنجاح إلى ${details.recipientName}
          </p>

          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">تفاصيل المعاملة:</h3>
            <p style="margin: 10px 0;"><strong>رقم المعاملة:</strong> ${details.transactionRef}</p>
            <p style="margin: 10px 0;"><strong>المبلغ المستلم:</strong> ${details.amount}</p>
            <p style="margin: 10px 0;"><strong>المستلم:</strong> ${details.recipientName}</p>
            <p style="margin: 10px 0;"><strong>تاريخ الإكمال:</strong> ${new Date(details.completedAt).toLocaleString('ar-SA')}</p>
          </div>

          <div style="background-color: #dbeafe; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="color: #1e40af; margin: 0;">
              شكراً لاستخدامك راصد لتحويل الأموال
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            مع تحيات،<br>
            فريق راصد
          </p>
        </div>
      </div>
    `;

    return this.sendRawEmail({ to, subject, html });
  }

  /**
   * Send account suspension notification email
   */
  async sendAccountSuspensionEmail(
    to: string,
    variables: {
      name: string;
      case_number: string;
      suspension_date: string;
      reason: string;
    },
    language: 'ar' | 'en' = 'ar'
  ) {
    return this.sendEmail(to, 'account_suspension', variables, language);
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
