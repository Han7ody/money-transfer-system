'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, MapPin, Calendar, Flag } from 'lucide-react';

import { AuthShell } from '@/components/auth/AuthShell';
import { StepHeader } from '@/components/auth/StepHeader';
import { TextInput } from '@/components/auth/TextInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { profileSchema, type ProfileFormData } from '@/lib/validation';
import { authAPI } from '@/lib/api';

const steps = [
  { label: 'إنشاء الحساب', active: false },
  { label: 'تحقق البريد', active: false },
  { label: 'المعلومات', active: true },
  { label: 'التحقق', active: false }
];

export default function ProfilePage() {
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const response = await authAPI.updateProfile(data);

      if (response.success) {
        router.push('/register/kyc');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
    }
  };

  return (
    <AuthShell
      title="أكمل ملفك الشخصي"
      subtitle="أدخل معلوماتك الشخصية"
      backHref="/register/verify"
    >
      <StepHeader 
        currentStep={3}
        totalSteps={4}
        steps={steps}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <TextInput
          label="رقم الهاتف"
          type="tel"
          placeholder="+966501234567"
          icon={<Phone className="w-5 h-5" />}
          error={errors.phone?.message}
          dir="ltr"
          {...register('phone')}
        />

        <TextInput
          label="البلد"
          placeholder="المملكة العربية السعودية"
          icon={<Flag className="w-5 h-5" />}
          error={errors.country?.message}
          {...register('country')}
        />

        <TextInput
          label="المدينة"
          placeholder="الرياض"
          icon={<MapPin className="w-5 h-5" />}
          error={errors.city?.message}
          {...register('city')}
        />

        <TextInput
          label="تاريخ الميلاد"
          type="date"
          icon={<Calendar className="w-5 h-5" />}
          error={errors.dateOfBirth?.message}
          {...register('dateOfBirth')}
        />

        <TextInput
          label="الجنسية"
          placeholder="سعودي"
          icon={<Flag className="w-5 h-5" />}
          error={errors.nationality?.message}
          {...register('nationality')}
        />

        <PrimaryButton type="submit" loading={isSubmitting}>
          متابعة إلى التحقق من الهوية
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}