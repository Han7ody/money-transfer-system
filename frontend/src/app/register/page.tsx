'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { UserPlus, Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

const RegisterPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: 'Sudan'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...apiData } = formData as any;
      const response = await authAPI.register(apiData);
      if (response.success) {
        try {
          await authAPI.sendVerificationOtp();
        } catch (e) {
          // حتى لو فشل الإرسال، نوجه المستخدم لصفحة التحقق ليتمكن من إعادة طلب الكود
        }
        router.push('/verify-email');
      } else {
        setError(response.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ غير متوقع.');
    }
    setLoading(false);
  };

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-600 p-8 lg:p-12 text-white">
              <h3 className="text-2xl font-bold mb-4">انضم إلينا اليوم</h3>
              <p className="text-indigo-100 mb-8">ابدأ في إرسال الأموال بأمان وسرعة</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3"><CheckCircle2 className="w-5 ه-5 mt-0.5" /><span>تسجيل مجاني بدون رسوم</span></div>
                <div className="flex items-start gap-3"><CheckCircle2 className="w-5 ه-5 mt-0.5" /><span>أسعار صرف تنافسية</span></div>
                <div className="flex items-start gap-3"><CheckCircle2 className="w-5 ه-5 mt-0.5" /><span>تحويلات سريعة وآمنة</span></div>
              </div>
              <div className="mt-12 pt-8 border-t border-white/20">
                <p className="text-sm text-indigo-100 mb-3">مستخدم بالفعل؟</p>
                <button onClick={() => router.push('/login')} className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold">تسجيل الدخول</button>
              </div>
            </div>

            <div className="lg:col-span-3 p-8 lg:p-12">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">إنشاء حساب جديد</h1>
              <p className="text-slate-600 mb-8">املأ البيانات التالية للبدء</p>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-800 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div><label className="block text-sm font-bold mb-2">الاسم الكامل</label><div className="relative"><User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full pr-12 pl-4 py-3 border-2 rounded-xl" required /></div></div>
                <div><label className="block text-sm font-bold mb-2">البريد الإلكتروني</label><div className="relative"><Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pr-12 pl-4 py-3 border-2 rounded-xl" required /></div></div>
                <div><label className="block text-sm font-bold mb-2">رقم الهاتف</label><div className="relative"><Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full pr-12 pl-4 py-3 border-2 rounded-xl" required /></div></div>
                <div><label className="block text-sm font-bold mb-2">كلمة ال��رور</label><div className="relative"><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="w-full pr-12 pl-12 py-3 border-2 rounded-xl" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff /> : <Eye />}</button></div></div>
                <div><label className="block text-sm font-bold mb-2">تأكيد كلمة المرور</label><div className="relative"><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full pr-12 pl-12 py-3 border-2 rounded-xl" required /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute left-4 top-1/2 -translate-y-1/2">{showConfirmPassword ? <EyeOff /> : <Eye />}</button></div></div>
                
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50">
                  {loading ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>جاري إنشاء الحساب...</span></>) : (<><span>إنشاء حساب</span><UserPlus className="w-5 h-5" /></>)}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
