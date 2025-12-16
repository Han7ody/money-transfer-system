'use client';

import React from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { StepHeader } from '@/components/auth/StepHeader';
import { TextInput } from '@/components/auth/TextInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { User, Mail, Lock } from 'lucide-react';

const steps = [
  { id: 1, label: 'إنشاء الحساب' },
  { id: 2, label: 'تحقق البريد' },
  { id: 3, label: 'المعلومات الشخصية' },
  { id: 4, label: 'التحقق من الهوية' }
];

export default function TestNewDesignPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600">
      <div className="text-center text-white py-8">
        <h1 className="text-6xl font-bold mb-4">🎨 NEW DESIGN TEST</h1>
        <p className="text-2xl">This proves the new components are working!</p>
        <p className="text-lg mt-2">Time: {new Date().toLocaleString()}</p>
      </div>
      
      <AuthShell
        title="تصميم جديد - اختبار"
        subtitle="هذا هو التصميم الجديد"
        backHref="/"
      >
        <StepHeader steps={steps} currentStep={1} />

        <div className="space-y-6">
          <TextInput
            label="الاسم الكامل"
            placeholder="أحمد محمد"
            icon={<User className="w-5 h-5" />}
          />

          <TextInput
            label="البريد الإلكتروني"
            type="email"
            placeholder="example@email.com"
            icon={<Mail className="w-5 h-5" />}
            dir="ltr"
          />

          <TextInput
            label="كلمة المرور"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-5 h-5" />}
            showPasswordToggle
            dir="ltr"
          />

          <PrimaryButton>
            إنشاء الحساب
          </PrimaryButton>
        </div>
      </AuthShell>
    </div>
  );
}