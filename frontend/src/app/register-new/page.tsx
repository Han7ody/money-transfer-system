'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { AuthShell } from '@/components/auth/AuthShell';
import { StepHeader } from '@/components/auth/StepHeader';
import { TextInput } from '@/components/auth/TextInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { registerSchema, type RegisterFormData, getPasswordStrength } from '@/lib/validation';
import { authAPI } from '@/lib/api';
import { showToast } from '@/lib/toast';

const steps = [
  { id: 1, label: 'إنشاء الحساب' },
  { id: 2, label: 'تحقق البريد' },
  { id: 3, label: 'المعلومات الشخصية' },
  { id: 4, label: 'التحقق من الهوية' }
];

export default function RegisterNewPage() {
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const password = watch('password', '');
  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await authAPI.register({
        fullName: data.fullName,
        email: data.email,
        password: data.password
      });

      if (response.success) {
        localStorage.setItem('registerEmail', data.email);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast.success('تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني');
        router.push('/register/verify');
      } else {
        showToast.error(response.message || 'حدث خطأ أثناء إنشاء الحساب');
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <div className="text-center text-white mb-8">
        <h1 className="text-4xl font-bold mb-2">🎨 NEW DESIGN TEST</h1>
        <p className="text-xl">This is the new registration design!</p>
      </div>
      
      <AuthShell
        title="إنشاء حساب جديد - التصميم الجديد"
        subtitle="أدخل بياناتك للبدء"
        backHref="/"
      >
        <StepHeader steps={steps} currentStep={1} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TextInput
            label="الاسم الكامل"
            placeholder="أحمد محمد"
            icon={<User className="w-5 h-5" />}
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <TextInput
            label="البريد الإلكتروني"
            type="email"
            placeholder="example@email.com"
            icon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            dir="ltr"
            {...register('email')}
          />

          <div>
            <TextInput
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              error={errors.password?.message}
              showPasswordToggle
              dir="ltr"
              {...register('password')}
            />
            
            {password && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        i <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  قوة كلمة المرور: {passwordStrength.label}
                </p>
              </motion.div>
            )}
          </div>

          <TextInput
            label="تأكيد كلمة المرور"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-5 h-5" />}
            error={errors.confirmPassword?.message}
            showPasswordToggle
            dir="ltr"
            {...register('confirmPassword')}
          />

          <PrimaryButton type="submit" loading={isSubmitting}>
            إنشاء الحساب
          </PrimaryButton>
        </form>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-slate-500 text-center mt-6"
        >
          بالتسجيل، أنت توافق على{' '}
          <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
            شروط الخدمة
          </Link>{' '}
          و{' '}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
            سياسة الخصوصية
          </Link>
        </motion.p>
      </AuthShell>
    </div>
  );
}