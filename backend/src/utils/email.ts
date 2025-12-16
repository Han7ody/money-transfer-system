import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // This should be a Gmail App Password
  },
});

const createEmailTemplate = (title: string, body: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 12px; background-color: #f9f9f9; }
        .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; text-align: right; }
        .content p { margin-bottom: 20px; }
        .code { font-size: 28px; font-weight: bold; color: #4f46e5; text-align: center; letter-spacing: 5px; margin: 30px 0; padding: 15px; background-color: #eef2ff; border-radius: 8px; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${body}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Money Transfer System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: MailOptions) => {
  try {
    const mailOptions = {
      from: `"Money Transfer System" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    return { success: false, message: 'Failed to send email.' };
  }
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const title = 'إعادة تعيين كلمة المرور';
  const body = `
    <p>مرحباً،</p>
    <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. انقر على الرابط أدناه لتعيين كلمة مرور جديدة. هذا الرابط صالح لمدة ساعة واحدة.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">إعادة تعيين كلمة المرور</a>
    </div>
    <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.</p>
  `;
  const html = createEmailTemplate(title, body);
  return await sendEmail({ to, subject: title, html });
};

export const sendVerificationOtpEmail = async (to: string, otp: string) => {
  const title = 'كود التحقق من حسابك';
  const body = `
    <p>مرحباً،</p>
    <p>استخدم الكود التالي للتحقق من حسابك. الكود صالح لمدة 10 دقائق.</p>
    <div class="code">${otp}</div>
    <p>إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد الإلكتروني.</p>
  `;
  const html = createEmailTemplate(title, body);
  return await sendEmail({ to, subject: title, html });
};
