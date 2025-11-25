'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { Mail, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({ loading: false, error: null, success: null });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });
    try {
      const res = await authAPI.forgotPassword(email);
      setStatus({ loading: false, success: res.message, error: null });
    } catch (err) {
      setStatus({ loading: false, success: 'If an account with this email exists, a password reset link has been sent.', error: null });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">نسيت كلمة المرور؟</h1>
          <p className="text-slate-600 mb-6">لا تقلق. أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.</p>

          {status.error && <div className="p-3 mb-4 bg-rose-50 text-rose-700 rounded-xl text-sm flex items-center gap-2"><AlertCircle className="w-5 h-5"/>{status.error}</div>}
          {status.success && <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/>{status.success}</div>}

          {!status.success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="sr-only">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border-2 rounded-xl"
                    placeholder="أدخل بريدك الإلكتروني"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={status.loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
                {status.loading ? <Loader className="animate-spin inline-block" /> : 'إرسال رابط إعادة التعيين'}
              </button>
            </form>
          )}

          <div className="mt-6">
            <button onClick={() => router.push('/login')} className="text-sm font-medium text-slate-600 hover:text-indigo-600">العودة إلى تسجيل الدخول</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
