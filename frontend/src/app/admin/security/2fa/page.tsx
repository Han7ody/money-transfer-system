'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, Smartphone, Key, Copy, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface TwoFactorStatus {
  enabled: boolean;
  qrCode?: string;
  secret?: string;
  backupCodes?: string[];
}

export default function TwoFactorAuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState<TwoFactorStatus>({ enabled: false });
  const [step, setStep] = useState<'status' | 'setup' | 'verify'>('status');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCode, setCopiedBackupCode] = useState<number | null>(null);

  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  const fetchTwoFactorStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get2FAStatus();
      setStatus(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل تحميل حالة المصادقة الثنائية');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.enable2FA();
      setStatus({
        enabled: false,
        qrCode: response.data.qrCode,
        secret: response.data.secret
      });
      setStep('setup');
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل تفعيل المصادقة الثنائية');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verificationCode.length !== 6) {
      setError('الرجاء إدخال رمز مكون من 6 أرقام');
      return;
    }

    setVerifying(true);
    try {
      const response = await apiClient.verify2FA(verificationCode);
      setStatus({
        enabled: true,
        backupCodes: response.data.backupCodes
      });
      setStep('verify');
      setSuccess('تم تفعيل المصادقة الثنائية بنجاح');
    } catch (error: any) {
      setError(error.response?.data?.message || 'رمز التحقق غير صحيح');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('هل أنت متأكد من تعطيل المصادقة الثنائية؟ سيؤدي ذلك إلى تقليل أمان حسابك.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.disable2FA();
      setStatus({ enabled: false });
      setStep('status');
      setSuccess('تم تعطيل المصادقة الثنائية');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل تعطيل المصادقة الثنائية');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'backup', index?: number) => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackupCode(index ?? null);
      setTimeout(() => setCopiedBackupCode(null), 2000);
    }
    setSuccess('تم النسخ إلى الحافظة');
    setTimeout(() => setSuccess(''), 2000);
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
          onClick={() => router.push('/admin/security')}
          className="text-slate-500 hover:text-indigo-600"
        >
          إعدادات الأمان
        </button>
        <ArrowRight className="w-4 h-4 text-slate-300 rotate-180" />
        <span className="text-slate-900 font-medium">التحقق بخطوتين</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">التحقق بخطوتين (2FA)</h1>
          <p className="text-sm text-slate-600">
            أضف طبقة حماية إضافية لحسابك باستخدام تطبيق المصادقة
          </p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Status View */}
      {step === 'status' && (
        <>
          {/* Current Status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  status.enabled ? 'bg-green-100' : 'bg-slate-100'
                }`}>
                  {status.enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">حالة المصادقة الثنائية</h3>
                  <p className="text-sm text-slate-600">
                    {status.enabled ? 'مفعّلة' : 'غير مفعّلة'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status.enabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {status.enabled ? 'نشط' : 'معطّل'}
              </span>
            </div>

            {status.enabled ? (
              <button
                onClick={handleDisable2FA}
                className="w-full px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                تعطيل المصادقة الثنائية
              </button>
            ) : (
              <button
                onClick={handleEnable2FA}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                تفعيل المصادقة الثنائية
              </button>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Smartphone className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">ما هي المصادقة الثنائية؟</h3>
                <p className="text-sm text-blue-800 mb-3">
                  المصادقة الثنائية (2FA) هي طبقة أمان إضافية تتطلب ليس فقط كلمة المرور، بل
                  أيضاً رمز تحقق يتم إنشاؤه من تطبيق المصادقة على هاتفك المحمول.
                </p>
                <p className="text-sm font-medium text-blue-900 mb-2">تطبيقات المصادقة الموصى بها:</p>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Google Authenticator</li>
                  <li>• Microsoft Authenticator</li>
                  <li>• Authy</li>
                  <li>• 1Password</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Setup View */}
      {step === 'setup' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              الخطوة 1: امسح رمز QR
            </h2>

            <div className="space-y-6">
              {/* QR Code */}
              <div className="bg-slate-50 rounded-lg p-8 text-center">
                {status.qrCode ? (
                  <div className="inline-block bg-white p-4 rounded-lg shadow-sm">
                    <img
                      src={status.qrCode}
                      alt="QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto bg-slate-200 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Manual Setup */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Key className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      لا يمكنك مسح الرمز؟
                    </p>
                    <p className="text-sm text-amber-800 mb-2">
                      أدخل هذا المفتاح يدوياً في تطبيق المصادقة:
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-amber-300">
                  <code className="flex-1 font-mono text-sm text-slate-900 break-all">
                    {status.secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(status.secret!, 'secret')}
                    className="p-2 hover:bg-slate-100 rounded transition-colors"
                  >
                    {copiedSecret ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    الخطوة 2: أدخل رمز التحقق
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    disabled={verifying}
                  />
                  <p className="text-sm text-slate-600 mt-2">
                    أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={verifying || verificationCode.length !== 6}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {verifying ? 'جاري التحقق...' : 'تأكيد وتفعيل'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('status');
                      setVerificationCode('');
                    }}
                    disabled={verifying}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Verification Success View */}
      {step === 'verify' && status.backupCodes && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                تم تفعيل المصادقة الثنائية بنجاح!
              </h2>
              <p className="text-slate-600">
                احفظ رموز النسخ الاحتياطي التالية في مكان آمن
              </p>
            </div>

            {/* Backup Codes */}
            <div className="bg-slate-50 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900">رموز النسخ الاحتياطي</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                استخدم هذه الرموز لتسجيل الدخول في حال فقدت الوصول إلى تطبيق المصادقة. كل رمز يمكن
                استخدامه مرة واحدة فقط.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {status.backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-white rounded-lg p-3 border border-slate-200"
                  >
                    <code className="flex-1 font-mono text-sm text-slate-900">
                      {code}
                    </code>
                    <button
                      onClick={() => copyToClipboard(code, 'backup', index)}
                      className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                    >
                      {copiedBackupCode === index ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setStep('status');
                router.push('/admin/security');
              }}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              العودة إلى إعدادات الأمان
            </button>
          </div>
        </>
      )}
    </div>
  );
}
