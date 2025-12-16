'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import { AuthShell } from '@/components/auth/AuthShell';
import { StepHeader } from '@/components/auth/StepHeader';
import { OtpInput } from '@/components/auth/OtpInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';

import { useCountdown } from '@/hooks/useCountdown';
import { authAPI } from '@/lib/api';
import { showToast } from '@/lib/toast';

const steps = [
  { label: 'إنشاء الحساب', active: false },
  { label: 'تحقق البريد', active: true },
  { label: 'المعلومات', active: false },
  { label: 'التحقق', active: false }
];

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  const { seconds, isActive, start } = useCountdown(60);

  useEffect(() => {
    const registerEmail = localStorage.getItem('registerEmail');
    if (!registerEmail) {
      router.push('/register');
      return;
    }
    setEmail(registerEmail);
    start(); // Start countdown on mount
  }, [router, start]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('يرجى إدخال رمز التحقق كاملاً');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await authAPI.verifyRegistrationOtp(email, otpCode);
      
      if (response.success) {
        localStorage.removeItem('registerEmail');
        showToast.success('تم التحقق من البريد الإلكتروني بنجاح!');
        router.push('/register/profile');
      } else {
        setError(response.message || 'رمز التحقق غير صحيح');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء التحقق');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (isActive) return;

    setIsResending(true);
    setError('');
    
    try {
      const response = await authAPI.resendOtp(email);
      if (response.success) {
        start(); // Restart countdown
        setOtp(Array(6).fill('')); // Clear OTP inputs
        showToast.success('تم إرسال رمز التحقق مرة أخرى');
      } else {
        setError(response.message || 'حدث خطأ أثناء إعادة الإرسال');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'حدث خطأ أثناء إعادة الإرسال');
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (newOtp: string[]) => {
    setOtp(newOtp);
    if (error) setError('');
  };

  return (
    <AuthShell
      title="تحقق من بريدك الإلكتروني"
      backHref="/register"
    >
      <StepHeader 
        currentStep={2}
        totalSteps={4}
        steps={steps}
      />

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-10 h-10 text-blue-600" />
        </div>
        <p className="text-slate-600 mb-2">أرسلنا رمز التحقق إلى</p>
        <p className="font-semibold text-slate-900 en-text" dir="ltr">{email}</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-4 text-center">
            أدخل رمز التحقق المكون من 6 أرقام
          </label>
          <OtpInput
            value={otp}
            onChange={handleOtpChange}
            error={error}
          />
        </div>

        <PrimaryButton 
          type="submit" 
          loading={isSubmitting}
          disabled={otp.join('').length !== 6}
        >
          تحقق من الرمز
        </PrimaryButton>
      </form>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center mt-8 space-y-4"
      >
        <p className="text-sm text-slate-500">لم تستلم الرمز؟</p>
        
        {isActive ? (
          <p className="text-sm text-slate-400">
            إعادة الإرسال خلال <span className="en-digits font-semibold">({seconds})</span> ثانية
          </p>
        ) : (
          <button
            onClick={handleResendOtp}
            disabled={isResending}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                إعادة إرسال الرمز
              </>
            )}
          </button>
        )}
      </motion.div>
    </AuthShell>
  );
}