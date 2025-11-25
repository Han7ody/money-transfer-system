'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Settings, Save, RotateCcw, Loader2, Mail, Globe, DollarSign, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { LogoUploader } from '@/components/admin/settings/LogoUploader';
import { SystemSettings, TIMEZONES, DATE_FORMATS, TIME_FORMATS } from '@/types/settings';
import { useAuth } from '@/hooks/useAuth';

const DEFAULT_SETTINGS: SystemSettings = {
  platformName: 'نظام التحويلات المالية',
  logoUrl: '',
  timezone: 'Africa/Cairo',
  defaultLanguage: 'ar',
  maintenanceMode: false,
  defaultCurrency: 'EGP',
  supportEmail: 'support@example.com',
  supportPhone: '+20 123 456 7890',
  defaultFeePercent: 2.5,
  companyAddress: 'القاهرة، مصر',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h'
};

export default function GeneralSettingsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [currencies, setCurrencies] = useState<string[]>([]);

  useEffect(() => {
    // RBAC Check - SUPER_ADMIN only
    if (role && role !== 'SUPER_ADMIN') {
      router.push('/admin/unauthorized');
      return;
    }

    if (role === 'SUPER_ADMIN') {
      fetchSettings();
      fetchCurrencies();
    }
  }, [role, router]);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getSystemSettings();
      setSettings({ ...DEFAULT_SETTINGS, ...response.data });
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await apiClient.getCurrencies();
      setCurrencies(response.data.map((c: any) => c.code));
    } catch (error) {
      // Fallback to common currencies
      setCurrencies(['EGP', 'USD', 'EUR', 'SAR', 'AED']);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleLogoUploadSuccess = (logoUrl: string) => {
    setSettings(prev => ({ ...prev, logoUrl }));
    setSuccess('تم رفع الشعار بنجاح');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleLogoUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(''), 5000);
  };

  const validateSettings = (): boolean => {
    if (!settings.platformName.trim()) {
      setError('اسم المنصة مطلوب');
      return false;
    }

    if (!settings.supportEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail)) {
      setError('البريد الإلكتروني للدعم غير صحيح');
      return false;
    }

    if (settings.defaultFeePercent < 0 || settings.defaultFeePercent > 100) {
      setError('نسبة العمولة يجب أن تكون بين 0 و 100');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateSettings()) {
      return;
    }

    setSaving(true);
    try {
      await apiClient.updateSystemSettings(settings);
      setSuccess('تم حفظ الإعدادات بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟')) {
      return;
    }

    setSettings(DEFAULT_SETTINGS);
    setSuccess('تم إعادة تعيين الإعدادات');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleTestSmtp = async () => {
    setError('');
    setSuccess('');
    setTestingSmtp(true);
    try {
      await apiClient.testSmtp();
      setSuccess('تم إرسال بريد تجريبي بنجاح. تحقق من صندوق الوارد.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل اختبار SMTP');
    } finally {
      setTestingSmtp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push('/admin/settings')}
          className="text-slate-500 hover:text-indigo-600"
        >
          الإعدادات
        </button>
        <ArrowRight className="w-4 h-4 text-slate-300 rotate-180" />
        <span className="text-slate-900 font-medium">الإعدادات العامة</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
          <Settings className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الإعدادات العامة</h1>
          <p className="text-sm text-slate-600">إدارة إعدادات المنصة الأساسية</p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">معلومات المنصة</h2>

          <div className="space-y-4">
            {/* Platform Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                اسم المنصة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => handleInputChange('platformName', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="نظام التحويلات المالية"
                required
              />
            </div>

            {/* Logo Uploader */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                شعار المنصة
              </label>
              <LogoUploader
                currentLogo={settings.logoUrl}
                onUploadSuccess={handleLogoUploadSuccess}
                onError={handleLogoUploadError}
              />
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">الإعدادات الإقليمية</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Globe className="w-4 h-4 inline ml-1" />
                المنطقة الزمنية
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            {/* Default Language */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                اللغة الافتراضية
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline ml-1" />
                تنسيق التاريخ
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {DATE_FORMATS.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>

            {/* Time Format */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Clock className="w-4 h-4 inline ml-1" />
                تنسيق الوقت
              </label>
              <select
                value={settings.timeFormat}
                onChange={(e) => handleInputChange('timeFormat', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {TIME_FORMATS.map(format => (
                  <option key={format} value={format}>{format === '24h' ? '24 ساعة' : '12 ساعة'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">الإعدادات المالية</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Default Currency */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <DollarSign className="w-4 h-4 inline ml-1" />
                العملة الافتراضية
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            {/* Default Fee Percent */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                نسبة العمولة الافتراضية (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.defaultFeePercent}
                onChange={(e) => handleInputChange('defaultFeePercent', parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="2.5"
              />
            </div>
          </div>
        </div>

        {/* Support Contact */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">معلومات الاتصال</h2>

          <div className="space-y-4">
            {/* Support Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4 inline ml-1" />
                البريد الإلكتروني للدعم <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="support@example.com"
                  required
                />
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp}
                  className="px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {testingSmtp ? 'جاري الاختبار...' : 'اختبار SMTP'}
                </button>
              </div>
            </div>

            {/* Support Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                رقم الهاتف للدعم
              </label>
              <input
                type="tel"
                value={settings.supportPhone}
                onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+20 123 456 7890"
              />
            </div>

            {/* Company Address */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4 inline ml-1" />
                عنوان الشركة
              </label>
              <textarea
                value={settings.companyAddress}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="القاهرة، مصر"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">حالة النظام</h2>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">وضع الصيانة</p>
              <p className="text-sm text-slate-600">تعطيل الوصول للمستخدمين مؤقتاً</p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('maintenanceMode', !settings.maintenanceMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.maintenanceMode ? 'bg-red-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.maintenanceMode ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ التغييرات
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetToDefaults}
            disabled={saving}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            إعادة تعيين
          </button>
        </div>
      </form>
    </div>
  );
}
