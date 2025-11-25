'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { Lock, Loader, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

function ResetPasswordComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({ loading: false, error: null, success: null });

  useEffect(() => {
    if (!token) {
      setStatus({ loading: false, error: 'رابط إعادة التعيين غير صالح أو مفقود.', success: null });
    }
  }, [token]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!token) return;
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setStatus({ loading: false, error: 'كلمتا المرور غير متطابقتين.', success: null });
    }

    setStatus({ loading: true, error: null, success: null });
    try {
      const res = await authAPI.resetPassword({ token, newPassword: passwords.newPassword });
      if (res.success) {
        setStatus({ loading: false, success: 'تم إعادة تعيين كلمة المرور بنجاح! جاري توجيهك لتسجيل الدخول...', error: null });
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setStatus({ loading: false, error: res.message, success: null });
      }
    } catch (err: any) {
      setStatus({ loading: false, error: err.response?.data?.message || 'فشل إعادة تعيين كلمة المرور.', success: null });
    }
  };

  const handleChange = (e: any) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">إعادة تعيين كلمة المرور</h1>
          <p className="text-slate-600 mb-6">أدخل كلمة المرور الجديدة لحسابك.</p>

          {status.error && <div className="p-3 mb-4 bg-rose-50 text-rose-700 rounded-xl text-sm flex items-center gap-2"><AlertCircle className="w-5 h-5"/>{status.error}</div>}
          {status.success && <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/>{status.success}</div>}

          {!status.success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 text-right">كلمة المرور الجديدة</label>
                <div className="relative"><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type={showPassword ? 'text' : 'password'} name="newPassword" onChange={handleChange} className="w-full pr-12 pl-12 py-3 border-2 rounded-xl" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff /> : <Eye />}</button></div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 text-right">تأكيد كلمة المرور الجديدة</label>
                <div className="relative"><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type={showPassword ? 'text' : 'password'} name="confirmPassword" onChange={handleChange} className="w-full pr-12 pl-12 py-3 border-2 rounded-xl" required /></div>
              </div>
              <button type="submit" disabled={status.loading || !token} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
                {status.loading ? <Loader className="animate-spin inline-block" /> : 'إعادة تعيين كلمة المرور'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin"/></div>}>
      <ResetPasswordComponent />
    </Suspense>
  );
}
