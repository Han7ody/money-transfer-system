import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'يجب أن تحتوي على حروف كبيرة وصغيرة وأرقام'),
  confirmPassword: z.string()
}).refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword']
});

export const profileSchema = z.object({
  phone: z.string()
    .min(10, 'رقم الهاتف غير صالح')
    .regex(/^\+?[1-9]\d{1,14}$/, 'رقم الهاتف غير صالح'),
  country: z.string().min(1, 'البلد مطلوب'),
  city: z.string().min(1, 'المدينة مطلوبة'),
  dateOfBirth: z.string()
    .min(1, 'تاريخ الميلاد مطلوب')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18;
    }, 'يجب أن تكون 18 سنة أو أكثر'),
  nationality: z.string().min(1, 'الجنسية مطلوبة')
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'رمز التحقق يجب أن يكون 6 أرقام')
});

export const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels = ['', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية'];
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  
  return {
    score,
    label: labels[Math.min(score, 4)],
    color: colors[Math.min(score, 4)]
  };
};

export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;