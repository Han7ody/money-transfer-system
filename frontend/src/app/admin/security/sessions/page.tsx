'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Monitor, Smartphone, Tablet, MapPin, Clock, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Session {
  id: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  location?: string;
  lastActive: string;
  isCurrent: boolean;
  createdAt: string;
}

export default function SessionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getActiveSessions();
      setSessions(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل تحميل الجلسات النشطة');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm('هل أنت متأكد من إنهاء هذه الجلسة؟')) {
      return;
    }

    setTerminatingId(sessionId);
    setError('');
    setSuccess('');
    try {
      await apiClient.terminateSession(sessionId);
      setSuccess('تم إنهاء الجلسة بنجاح');

      // Remove session from list
      setSessions(sessions.filter((s) => s.id !== sessionId));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل إنهاء الجلسة');
    } finally {
      setTerminatingId(null);
    }
  };

  const handleTerminateAllOthers = async () => {
    if (!confirm('هل أنت متأكد من إنهاء جميع الجلسات الأخرى؟ سيتم تسجيل خروجك من جميع الأجهزة الأخرى.')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await apiClient.terminateAllOtherSessions();
      setSuccess('تم إنهاء جميع الجلسات الأخرى بنجاح');

      // Keep only current session
      setSessions(sessions.filter((s) => s.isCurrent));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل إنهاء الجلسات');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    const type = deviceType.toLowerCase();
    if (type.includes('mobile')) {
      return <Smartphone className="w-6 h-6 text-indigo-600" />;
    } else if (type.includes('tablet')) {
      return <Tablet className="w-6 h-6 text-indigo-600" />;
    }
    return <Monitor className="w-6 h-6 text-indigo-600" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'نشط الآن';
    if (diffMins < 60) return `نشط منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `نشط منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `نشط منذ ${diffDays} يوم`;

    return `نشط في ${date.toLocaleDateString('en-GB')}`;
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
        <span className="text-slate-900 font-medium">الجلسات النشطة</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Monitor className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">الجلسات النشطة</h1>
            <p className="text-sm text-slate-600">
              إدارة الأجهزة المتصلة بحسابك ({sessions.length} جلسة نشطة)
            </p>
          </div>
        </div>

        {sessions.length > 1 && (
          <button
            onClick={handleTerminateAllOthers}
            className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            إنهاء جميع الجلسات الأخرى
          </button>
        )}
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

      {/* Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">إدارة الجلسات</p>
            <p>
              يمكنك إنهاء الجلسات النشطة من الأجهزة التي لا تستخدمها. عند إنهاء جلسة، سيتم تسجيل
              الخروج من ذلك الجهاز فوراً.
            </p>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">لا توجد جلسات نشطة</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`bg-white rounded-xl border shadow-sm p-6 ${
                session.isCurrent
                  ? 'border-indigo-300 ring-2 ring-indigo-100'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Device Icon */}
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getDeviceIcon(session.deviceType)}
                  </div>

                  {/* Session Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {session.browser} على {session.os}
                      </h3>
                      {session.isCurrent && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          الجلسة الحالية
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-slate-400" />
                        <span className="font-mono">{session.ipAddress}</span>
                      </div>
                      {session.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>{session.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{formatDate(session.lastActive)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!session.isCurrent && (
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    disabled={terminatingId === session.id}
                    className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {terminatingId === session.id ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري الإنهاء...
                      </span>
                    ) : (
                      'إنهاء الجلسة'
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Monitor className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">نصائح الأمان:</p>
            <ul className="space-y-1">
              <li>• راجع الجلسات النشطة بانتظام وقم بإنهاء أي جلسة غير معروفة</li>
              <li>• إذا لاحظت جلسة من جهاز أو موقع لا تعرفه، قم بإنهائها فوراً</li>
              <li>• استخدم ميزة "إنهاء جميع الجلسات الأخرى" إذا كنت تشك في اختراق حسابك</li>
              <li>• قم بتسجيل الخروج من الأجهزة العامة بعد الاستخدام</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
