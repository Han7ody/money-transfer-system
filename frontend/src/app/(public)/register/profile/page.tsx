'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Phone, MapPin, Calendar, Globe } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { authAPI, getAuthToken } from '@/lib/api';

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

const countries = [
  { code: 'SD', name: 'السودان', dialCode: '+249' },
  { code: 'SA', name: 'السعودية', dialCode: '+966' },
  { code: 'AE', name: 'الإمارات', dialCode: '+971' },
  { code: 'EG', name: 'مصر', dialCode: '+20' },
  { code: 'JO', name: 'الأردن', dialCode: '+962' },
  { code: 'KW', name: 'الكويت', dialCode: '+965' },
  { code: 'QA', name: 'قطر', dialCode: '+974' },
  { code: 'BH', name: 'البحرين', dialCode: '+973' },
  { code: 'OM', name: 'عمان', dialCode: '+968' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    country: 'SD',
    city: '',
    dateOfBirth: '',
    nationality: 'SD'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user is authenticated
    const token = getAuthToken();
    if (!token) {
      router.push('/register');
    }
  }, [router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.phone) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^\d{9,12}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'رقم الهاتف غير صالح';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'المدينة مطلوبة';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'تاريخ الميلاد مطلوب';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = 'يجب أن يكون عمرك 18 سنة على الأقل';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await authAPI.updateProfile({
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality
      });

      if (response.success) {
        router.push('/register/kyc');
      } else {
        setErrors({ submit: response.message || 'حدث خطأ. حاول مرة أخرى.' });
      }
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || 'حدث خطأ. حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const selectedCountry = countries.find(c => c.code === formData.country);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/register/verify" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">العودة</span>
          </Link>
          <div className="text-sm text-slate-500">الخطوة 2 من 4</div>
        </div>

        {/* Main Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">ر</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">المعلومات الشخصية</h1>
              <p className="text-sm text-slate-500 mt-1">أكمل بياناتك الشخصية</p>
            </div>

            {/* Progress */}
            <ProgressSteps currentStep={2} />

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  رقم الهاتف <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2" dir="ltr">
                  <div className="w-24 flex-shrink-0">
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {countries.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.dialCode}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="123456789"
                      className={`w-full pl-4 pr-10 py-2.5 rounded-xl border ${
                        errors.phone ? 'border-rose-300' : 'border-slate-200'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                  </div>
                </div>
                {errors.phone && (
                  <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>
                )}
              </div>

              {/* City */}
              <Input
                label="المدينة"
                name="city"
                type="text"
                placeholder="الخرطوم"
                value={formData.city}
                onChange={handleChange}
                error={errors.city}
                icon={MapPin}
                required
              />

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  تاريخ الميلاد <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className={`w-full pl-4 pr-10 py-2.5 rounded-xl border ${
                      errors.dateOfBirth ? 'border-rose-300' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    dir="ltr"
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="text-xs text-rose-600 mt-1">{errors.dateOfBirth}</p>
                )}
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  الجنسية <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                  >
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                    جاري الحفظ...
                  </>
                ) : (
                  'المتابعة'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
