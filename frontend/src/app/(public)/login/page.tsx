'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, DollarSign, Shield, Zap } from 'lucide-react';

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.login(formData.email, formData.password);
      if (response.success) {
        try {
          // اجلب بيانات المستخدم من ا��مصدر الصحيح وحدث التخزين المحلي
          const me = await authAPI.getCurrentUser();
          if (me?.success && me?.data) {
            localStorage.setItem('user', JSON.stringify(me.data));
          }
          const role = me?.data?.role;
          const isVerified = me?.data?.isVerified;

          // Redirect based on role
          if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SUPPORT' || role === 'VIEWER') {
            router.push('/admin');
          } else if (!isVerified) {
            try { await authAPI.sendVerificationOtp(); } catch {}
            router.push('/verify-email');
          } else {
            router.push('/dashboard');
          }
        } catch {
          // في حالة أي خطأ، نعود للتوجيه الافتراضي
          router.push('/dashboard');
        }
      } else {
        setError(response.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء محاولة تسجيل الدخول.');
    }
    setLoading(false);
  };

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-12 text-white shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center"><DollarSign className="w-8 h-8" /></div>
              <div><h2 className="text-3xl font-bold">راصد</h2><p className="text-indigo-100">خدمة آمنة وسريعة</p></div>
            </div>
            <div className="space-y-6 mb-12">
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><Zap className="w-6 h-6" /></div><div><h3 className="font-bold text-lg mb-1">تحويل فوري</h3><p className="text-indigo-100 text-sm">إرسال الأموال بسرعة وسهولة بين السودان والهند</p></div></div>
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><Shield className="w-6 h-6" /></div><div><h3 className="font-bold text-lg mb-1">آمن ومضمون</h3><p className="text-indigo-100 text-sm">تشفير عالي المستوى لحماية معاملاتك المالية</p></div></div>
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"><DollarSign className="w-6 h-6" /></div><div><h3 className="font-bold text-lg mb-1">أسعار تنافسية</h3><p className="text-indigo-100 text-sm">أفضل أسعار صرف مع عمولات منخفضة</p></div></div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">مرحباً بعودتك!</h1>
              <p className="text-slate-600">سجل دخولك للوصول إلى حسابك</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-800 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                <div className="relative"><Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pr-12 pl-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="example@email.com" required /></div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
                <div className="relative"><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="w-full pr-12 pl-12 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div>
              </div>

              <div className="flex items-center justify-between">
                <a href="/forgot-password" className="text-sm text-slate-600 hover:text-indigo-700 font-bold">نسيت كلمة المرور؟</a>
                <a href="/register" className="text-sm text-indigo-600 hover:text-indigo-700 font-bold">إنشاء حساب جديد</a>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3">
                {loading ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>جاري تسجيل الدخول...</span></>) : (<><span>تسجيل الدخول</span><LogIn className="w-5 h-5" /></>)}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
