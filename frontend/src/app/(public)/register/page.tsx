'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, User } from 'lucide-react';
import { AuthShell, StepHeader, TextInput, PrimaryButton } from '@/components/auth';
import { registerSchema, type RegisterFormData, getPasswordStrength } from '@/lib/validation';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange'
  });

  const password = watch('password', '');
  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('تم إنشاء الحساب بنجاح!');
      router.push('/register/verify');
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="إنشاء حساب جديد"
      subtitle="أدخل بياناتك للبدء"
      backHref="/"
    >
      {/* Progress Steps */}
      <StepHeader
        currentStep={1}
        totalSteps={4}
        steps={[
          { label: 'إنشاء الحساب', active: true },
          { label: 'تحقق البريد', active: false },
          { label: 'المعلومات', active: false },
          { label: 'التحقق', active: false }
        ]}
      />

      {/* Form */}
      <motion.form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
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
          className="en-text"
          {...register('email')}
        />

        <div>
          <TextInput
            label="كلمة المرور"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-5 h-5" />}
            showPasswordToggle
            error={errors.password?.message}
            dir="ltr"
            className="en-text"
            {...register('password')}
          />
          
          {password && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3"
            >
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
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
          showPasswordToggle
          error={errors.confirmPassword?.message}
          dir="ltr"
          className="en-text"
          {...register('confirmPassword')}
        />

        <PrimaryButton loading={loading} type="submit">
          إنشاء الحساب
        </PrimaryButton>
      </motion.form>

      {/* Terms */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs text-slate-500 text-center mt-6 leading-relaxed"
      >
        بالتسجيل، أنت توافق على{' '}
        <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline">
          شروط الخدمة
        </Link>{' '}
        و{' '}
        <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline">
          سياسة الخصوصية
        </Link>
      </motion.p>
    </AuthShell>
  );
}
