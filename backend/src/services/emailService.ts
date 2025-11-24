import nodemailer from 'nodemailer';

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
  }
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
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
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = createTransporter();
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
        console.error(`Template ${templateName} not found for language ${language}`);
        return false;
      }

      const subject = replaceVariables(template.subject, variables);
      const body = replaceVariables(template.body, variables);
      const html = generateHtmlEmail(body, language === 'ar');

      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER;

      await this.transporter.sendMail({
        from: `"Rasid راصد" <${fromEmail}>`,
        to,
        subject,
        text: body,
        html
      });

      console.log(`Email sent successfully to ${to}: ${templateName}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
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
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
