'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Mail, RefreshCw } from 'lucide-react';
import { authAPI } from '@/lib/api';

// Progress Steps Component
const ProgressSteps = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { num: 1, label: 'إنشاء الحساب' },
    { num: 2, label: 'المعلومات الشخصية' },
    { num: 3, label: 'التحقق من الهوية' },
    { num: 4, label: 'الموافقة' }
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.num}>
          <div className="flex flex-col items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
              ${currentStep > step.num
                ? 'bg-emerald-500 text-white'
                : currentStep === step.num
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }
            `}>
              {currentStep > step.num ? <Check className="w-5 h-5" /> : step.num}
            </div>
            <span className={`text-xs mt-1 hidden sm:block ${
              currentStep >= step.num ? 'text-slate-700' : 'text-slate-400'
            }`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${
              currentStep > step.num ? 'bg-emerald-500' : 'bg-slate-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default function VerifyOTPPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Get email from localStorage
    const storedEmail = localStorage.getItem('registerEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push('/register');
    }
  }, [router]);

  useEffect(() => {
    // Countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;

    setCanResend(false);
    setCountdown(60);
    setError('');

    try {
      const response = await authAPI.resendOtp(email);
      if (!response.success) {
        setError(response.message || 'فشل إرسال الرمز');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل إرسال الرمز. حاول مرة أخرى.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('يرجى إدخال الرمز المكون من 6 أرقام');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyRegistrationOtp(email, otpValue);

      if (response.success) {
        // Clear registration email from localStorage
        localStorage.removeItem('registerEmail');
        // Redirect to profile step
        router.push('/register/profile');
      } else {
        setError(response.message || 'رمز التحقق غير صحيح');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'رمز التحقق غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  // Mask email for display
  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/register" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">العودة</span>
          </Link>
          <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            لديك حساب؟ تسجيل الدخول
          </Link>
        </div>

        {/* Main Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">التحقق من البريد</h1>
              <p className="text-sm text-slate-500 mt-1">
                أدخل الرمز المرسل إلى
              </p>
              <p className="text-sm font-medium text-slate-700 mt-1" dir="ltr">
                {maskedEmail}
              </p>
            </div>

            {/* Progress */}
            <ProgressSteps currentStep={1} />

            {/* OTP Form */}
            <form onSubmit={handleVerify} className="space-y-6">
              {/* OTP Inputs */}
              <div className="flex justify-center gap-2" dir="ltr">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`
                      w-12 h-14 text-center text-xl font-semibold rounded-xl border-2
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                      ${error ? 'border-rose-300' : 'border-slate-200'}
                    `}
                  />
                ))}
              </div>

              {error && (
                <p className="text-sm text-rose-600 text-center">{error}</p>
              )}

              {/* Resend Code */}
              <div className="text-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="flex items-center justify-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    إعادة إرسال الرمز
                  </button>
                ) : (
                  <p className="text-sm text-slate-500">
                    إعادة الإرسال بعد{' '}
                    <span className="font-medium text-slate-700">{countdown}</span>{' '}
                    ثانية
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  'تأكيد الرمز'
                )}
              </button>
            </form>

            {/* Help Text */}
            <p className="text-xs text-slate-500 text-center mt-4">
              لم تستلم الرمز؟ تحقق من مجلد الرسائل غير المرغوب فيها
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
