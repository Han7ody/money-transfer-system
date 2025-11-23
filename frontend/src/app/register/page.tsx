'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
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

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'الاسم يجب أن يكون 3 أحرف على الأقل';
    }

    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'يجب أن تحتوي على حروف كبيرة وصغيرة وأرقام';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await authAPI.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      });

      if (response.success) {
        // Store email for OTP verification
        localStorage.setItem('registerEmail', formData.email);
        router.push('/register/verify');
      } else {
        setErrors({ submit: response.message || 'حدث خطأ أثناء إنشاء الحساب' });
      }
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const labels = ['', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية', 'ممتازة'];
    const colors = ['', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];

    return { strength, label: labels[strength], color: colors[strength] };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
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
                <span className="text-white text-xl font-bold">ر</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">إنشاء حساب جديد</h1>
              <p className="text-sm text-slate-500 mt-1">أدخل بياناتك للبدء</p>
            </div>

            {/* Progress */}
            <ProgressSteps currentStep={1} />

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="الاسم الكامل"
                name="fullName"
                type="text"
                placeholder="أحمد محمد"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
                icon={User}
                required
              />

              <Input
                label="البريد الإلكتروني"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={Mail}
                required
                dir="ltr"
              />

              <div>
                <div className="relative">
                  <Input
                    label="كلمة المرور"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    icon={Lock}
                    required
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-9 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded ${
                            i <= passwordStrength.strength ? passwordStrength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">
                      قوة كلمة المرور: {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              <div className="relative">
                <Input
                  label="تأكيد كلمة المرور"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  icon={Lock}
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-9 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {errors.submit && (
                <p className="text-sm text-rose-600 text-center">{errors.submit}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  'إنشاء الحساب'
                )}
              </button>
            </form>

            {/* Terms */}
            <p className="text-xs text-slate-500 text-center mt-4">
              بالتسجيل، أنت توافق على{' '}
              <Link href="/terms" className="text-indigo-600 hover:underline">
                شروط الخدمة
              </Link>{' '}
              و{' '}
              <Link href="/privacy" className="text-indigo-600 hover:underline">
                سياسة الخصوصية
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
