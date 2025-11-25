'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const strengthConfig = [
    { label: 'ضعيف جداً', color: 'bg-red-500', textColor: 'text-red-700' },
    { label: 'ضعيف', color: 'bg-orange-500', textColor: 'text-orange-700' },
    { label: 'متوسط', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { label: 'جيد', color: 'bg-lime-500', textColor: 'text-lime-700' },
    { label: 'قوي جداً', color: 'bg-green-500', textColor: 'text-green-700' }
  ];

  const currentStrength = strengthConfig[passwordStrength] || strengthConfig[0];

  // Password validation checks
  const validationChecks = [
    { label: 'على الأقل 8 أحرف', valid: formData.newPassword.length >= 8 },
    { label: 'أحرف كبيرة وصغيرة', valid: /[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword) },
    { label: 'رقم واحد على الأقل', valid: /\d/.test(formData.newPassword) },
    { label: 'رمز خاص واحد على الأقل', valid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('الرجاء ملء جميع الحقول');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('كلمتا المرور الجديدتان غير متطابقتين');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة');
      return;
    }

    setLoading(true);

    try {
      await apiClient.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setSuccess('تم تغيير كلمة المرور بنجاح');

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/security');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push('/admin/security')}
          className="text-slate-500 hover:text-indigo-600"
        >
          إعدادات الأمان
        </button>
        <ArrowRight className="w-4 h-4 text-slate-300 rotate-180" />
        <span className="text-slate-900 font-medium">تغيير كلمة المرور</span>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">تغيير كلمة المرور</h1>
              <p className="text-sm text-slate-600">قم بتحديث كلمة المرور الخاصة بك</p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                كلمة المرور الحالية
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="أدخل كلمة المرور الحالية"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="أدخل كلمة المرور الجديدة"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {formData.newPassword && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">قوة كلمة المرور:</span>
                    <span className={`font-medium ${currentStrength.textColor}`}>
                      {currentStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i < passwordStrength ? currentStrength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                تأكيد كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="أدخل كلمة المرور مرة أخرى"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Validation Checklist */}
            {formData.newPassword && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-slate-700 mb-2">متطلبات كلمة المرور:</p>
                {validationChecks.map((check, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {check.valid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300" />
                    )}
                    <span className={check.valid ? 'text-green-700' : 'text-slate-500'}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/security')}
                disabled={loading}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>

        {/* Security Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">نصائح لكلمة مرور قوية:</p>
              <ul className="space-y-1">
                <li>• استخدم مزيجاً من الأحرف الكبيرة والصغيرة والأرقام والرموز</li>
                <li>• تجنب استخدام معلومات شخصية يسهل تخمينها</li>
                <li>• لا تستخدم نفس كلمة المرور في مواقع متعددة</li>
                <li>• قم بتغيير كلمة المرور بشكل دوري كل 3-6 أشهر</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
