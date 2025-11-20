'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, Mail, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { authAPI, getCurrentUser } from '@/lib/api';

const OTPVerificationPage = () => {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.email) {
      setUserEmail(user.email);
    } else {
      // If no user, maybe redirect to login, but for now just show a placeholder
      setUserEmail('your-email@example.com');
    }
  }, []);

  // Timer for resend
  useEffect(() => {
    if (resendTimer > 0 && !canResend) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0 && !canResend) {
      setCanResend(true);
    }
  }, [resendTimer, canResend]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit) && newOtp.length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    const finalOtp = [...newOtp, ...Array(6 - newOtp.length).fill('')];
    setOtp(finalOtp);
    
    if (newOtp.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOtp(code);
      if (response.success) {
        setSuccess(true);
        // Update user in local storage to reflect verified status
        const updatedUser = await authAPI.getCurrentUser();
        if (updatedUser.success && updatedUser.data) {
          localStorage.setItem('user', JSON.stringify(updatedUser.data));
        }
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(response.message || 'رمز التحقق غير صحيح. حاول مرة أخرى');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء التحقق. حاول مرة أخرى.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendTimer(60);
    setOtp(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
    
    try {
        await authAPI.sendVerificationOtp();
        // Maybe show a success toast/message here
    } catch (err) {
        setError('فشل إرسال الرمز. حاول مرة أخرى.');
        setCanResend(true); // Allow user to try again sooner if it fails
    }
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors">
          <ArrowRight className="w-5 h-5" />
          <span className="font-medium">رجوع</span>
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              {success ? <CheckCircle2 className="w-10 h-10 text-white" /> : <Shield className="w-10 h-10 text-white" />}
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {success ? 'تم التحقق بنجاح!' : 'التحقق من الهوية'}
            </h1>
            <p className="text-slate-600">
              {success ? 'تم التحقق من حسابك بنجاح. سيتم توجيهك الآن...' : 'أدخل الرمز المكون من 6 أرقام المرسل إلى'}
            </p>
            {!success && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-indigo-600">{userEmail}</span>
              </div>
            )}
          </div>

          {!success && (
            <>
              <div className="mb-6">
                <div className="flex justify-center gap-3 mb-4" dir="ltr">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-14 h-14 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      disabled={loading || success}
                    />
                  ))}
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-xl flex items-start gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-800 font-medium">{error}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleVerify(otp.join(''))}
                disabled={loading || otp.join('').length !== 6}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-indigo-400 disabled:to-violet-400 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 flex items-center justify-center gap-3 mb-6"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    تحقق
                    <Shield className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-slate-600 mb-3">
                  لم تستلم الرمز؟
                </p>
                {canResend ? (
                  <button
                    onClick={handleResend}
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    إعادة إرسال الرمز
                  </button>
                ) : (
                  <p className="text-sm font-semibold text-slate-500">
                    يمكنك إعادة الإرسال بعد {resendTimer} ثانية
                  </p>
                )}
              </div>
            </>
          )}

          {success && (
            <div className="text-center">
                <button onClick={() => router.push('/dashboard')} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-4 rounded-xl transition-all">
                    المتابعة إلى لوحة التحكم
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;