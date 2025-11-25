'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, History, Monitor, MapPin, Clock, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface LoginHistoryEntry {
  id: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  status: 'success' | 'failed';
  deviceType: string;
  browser: string;
  os: string;
}

export default function LoginHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLoginHistory();
  }, [currentPage]);

  const fetchLoginHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getLoginHistory({
        page: currentPage,
        limit: itemsPerPage
      });

      setLoginHistory(response.data);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل تحميل سجل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType.toLowerCase().includes('mobile')) {
      return '📱';
    } else if (deviceType.toLowerCase().includes('tablet')) {
      return '📱';
    }
    return '💻';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;

    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <span className="text-slate-900 font-medium">سجل تسجيل الدخول</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
            <History className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">سجل تسجيل الدخول</h1>
            <p className="text-sm text-slate-600">عرض جميع محاولات تسجيل الدخول لحسابك</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">تنبيه أمني</p>
            <p>
              إذا لاحظت أي نشاط مشبوه أو محاولات تسجيل دخول غير معروفة، قم بتغيير كلمة المرور فوراً
              والتواصل مع فريق الدعم.
            </p>
          </div>
        </div>
      </div>

      {/* Login History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : loginHistory.length === 0 ? (
          <div className="text-center py-20">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">لا يوجد سجل لتسجيل الدخول</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" dir="rtl">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      الجهاز
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      عنوان IP
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      الموقع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      التاريخ والوقت
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loginHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.status === 'success' ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-medium text-green-700">نجح</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-medium text-red-700">فشل</span>
                          </div>
                        )}
                      </td>

                      {/* Device */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getDeviceIcon(entry.deviceType)}</span>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {entry.browser}
                            </p>
                            <p className="text-xs text-slate-500">{entry.os}</p>
                          </div>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700 font-mono">
                            {entry.ipAddress}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">
                            {entry.location || 'غير معروف'}
                          </span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
                <span className="text-sm text-slate-600">
                  صفحة {currentPage} من {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Security Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">نصائح أمنية:</p>
            <ul className="space-y-1">
              <li>• راجع سجل تسجيل الدخول بانتظام للتحقق من عدم وجود نشاط غير مصرح به</li>
              <li>• تحقق من عناوين IP والمواقع الجغرافية للتأكد من أنها معروفة لك</li>
              <li>• إذا لاحظت محاولات دخول فاشلة متعددة، قم بتغيير كلمة المرور فوراً</li>
              <li>• لا تقم بتسجيل الدخول من أجهزة أو شبكات عامة غير موثوقة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
