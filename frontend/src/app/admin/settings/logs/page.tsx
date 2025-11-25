'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Search,
  Filter,
  Calendar,
  User,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Shield,
  Settings,
  DollarSign,
  UserCheck,
  LogIn,
  LogOut,
  Key,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

interface AuditLog {
  id: number;
  adminId: number | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: {
    id: number;
    fullName: string;
    email: string;
  } | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Action type labels and colors
const actionConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  UPDATE_EXCHANGE_RATE: { label: 'تحديث سعر الصرف', color: 'bg-blue-100 text-blue-700', icon: <DollarSign className="w-3.5 h-3.5" /> },
  CREATE_EXCHANGE_RATE: { label: 'إنشاء سعر صرف', color: 'bg-green-100 text-green-700', icon: <DollarSign className="w-3.5 h-3.5" /> },
  UPDATE_GENERAL_SETTINGS: { label: 'تحديث الإعدادات العامة', color: 'bg-blue-100 text-blue-700', icon: <Settings className="w-3.5 h-3.5" /> },
  UPDATE_SMTP: { label: 'تحديث إعدادات SMTP', color: 'bg-blue-100 text-blue-700', icon: <Settings className="w-3.5 h-3.5" /> },
  UPDATE_SECURITY_SETTINGS: { label: 'تحديث إعدادات الأمان', color: 'bg-orange-100 text-orange-700', icon: <Shield className="w-3.5 h-3.5" /> },
  ADMIN_LOGIN: { label: 'تسجيل دخول', color: 'bg-green-100 text-green-700', icon: <LogIn className="w-3.5 h-3.5" /> },
  ADMIN_LOGOUT: { label: 'تسجيل خروج', color: 'bg-slate-100 text-slate-700', icon: <LogOut className="w-3.5 h-3.5" /> },
  PASSWORD_CHANGE: { label: 'تغيير كلمة المرور', color: 'bg-red-100 text-red-700', icon: <Key className="w-3.5 h-3.5" /> },
  APPROVE_KYC: { label: 'الموافقة على KYC', color: 'bg-green-100 text-green-700', icon: <UserCheck className="w-3.5 h-3.5" /> },
  REJECT_KYC: { label: 'رفض KYC', color: 'bg-red-100 text-red-700', icon: <UserCheck className="w-3.5 h-3.5" /> },
  APPROVE_TRANSACTION: { label: 'الموافقة على معاملة', color: 'bg-green-100 text-green-700', icon: <DollarSign className="w-3.5 h-3.5" /> },
  REJECT_TRANSACTION: { label: 'رفض معاملة', color: 'bg-red-100 text-red-700', icon: <DollarSign className="w-3.5 h-3.5" /> },
  COMPLETE_TRANSACTION: { label: 'إتمام معاملة', color: 'bg-emerald-100 text-emerald-700', icon: <DollarSign className="w-3.5 h-3.5" /> },
  UPDATE_USER: { label: 'تحديث مستخدم', color: 'bg-blue-100 text-blue-700', icon: <User className="w-3.5 h-3.5" /> },
  DELETE_USER: { label: 'حذف مستخدم', color: 'bg-red-100 text-red-700', icon: <User className="w-3.5 h-3.5" /> }
};

// Entity labels
const entityLabels: Record<string, string> = {
  SystemSettings: 'إعدادات النظام',
  ExchangeRates: 'أسعار الصرف',
  User: 'المستخدمين',
  Transaction: 'المعاملات',
  Auth: 'المصادقة'
};

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getAuditLogs({
        page,
        limit: 20,
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined
      });

      if (response.success) {
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter, startDate, endDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const clearFilters = () => {
    setSearch('');
    setActionFilter('');
    setEntityFilter('');
    setStartDate('');
    setEndDate('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionConfig = (action: string) => {
    return actionConfig[action] || {
      label: action,
      color: 'bg-slate-100 text-slate-700',
      icon: <Settings className="w-3.5 h-3.5" />
    };
  };

  const getChangeDescription = (log: AuditLog): string => {
    if (log.action === 'UPDATE_EXCHANGE_RATE' && log.newValue) {
      const { fromCurrency, toCurrency, rate } = log.newValue;
      return `تم تعديل سعر ${fromCurrency} → ${toCurrency} إلى ${rate}`;
    }
    if (log.action === 'ADMIN_LOGIN') {
      return 'تسجيل دخول إلى لوحة التحكم';
    }
    if (log.action === 'ADMIN_LOGOUT') {
      return 'تسجيل خروج من لوحة التحكم';
    }
    return entityLabels[log.entity] || log.entity;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push('/admin/settings')}
            className="text-slate-500 hover:text-indigo-600"
          >
            الإعدادات
          </button>
          <ArrowRight className="w-4 h-4 text-slate-300 rotate-180" />
          <span className="text-slate-900 font-medium">سجل التغييرات</span>
        </div>
        <button
          onClick={() => fetchLogs(pagination.page)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث في السجلات..."
              className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            بحث
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${
              showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            فلترة
          </button>
        </form>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نوع الإجراء</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">الكل</option>
                {Object.entries(actionConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الكيان</label>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">الكل</option>
                {Object.entries(entityLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">من تاريخ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-4">
              <button
                onClick={clearFilters}
                className="text-sm text-slate-600 hover:text-indigo-600"
              >
                مسح الفلاتر
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">جاري التحميل...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">لا توجد سجلات تغييرات حتى الآن.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">التاريخ / الوقت</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">المسؤول</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الإجراء</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الكيان</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">الوصف</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const config = getActionConfig(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {log.admin ? (
                            <div>
                              <p className="text-sm font-medium text-slate-900">{log.admin.fullName}</p>
                              <p className="text-xs text-slate-500">{log.admin.email}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">غير معروف</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                            {config.icon}
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">
                            {entityLabels[log.entity] || log.entity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-600 max-w-xs truncate">
                            {getChangeDescription(log)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedLog(log);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  عرض {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchLogs(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchLogs(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">تفاصيل السجل</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Log Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">المسؤول</p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedLog.admin?.fullName || 'غير معروف'}
                  </p>
                  <p className="text-xs text-slate-500">{selectedLog.admin?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">التاريخ</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDate(selectedLog.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">الإجراء</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getActionConfig(selectedLog.action).color}`}>
                    {getActionConfig(selectedLog.action).icon}
                    {getActionConfig(selectedLog.action).label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">الكيان</p>
                  <p className="text-sm font-medium text-slate-900">
                    {entityLabels[selectedLog.entity] || selectedLog.entity}
                  </p>
                </div>
              </div>

              {/* IP & User Agent */}
              {(selectedLog.ipAddress || selectedLog.userAgent) && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs font-semibold text-slate-600 mb-2">معلومات الجلسة</p>
                  {selectedLog.ipAddress && (
                    <p className="text-xs text-slate-600 mb-1">
                      <span className="font-medium">IP:</span> {selectedLog.ipAddress}
                    </p>
                  )}
                  {selectedLog.userAgent && (
                    <p className="text-xs text-slate-600 break-all">
                      <span className="font-medium">User Agent:</span> {selectedLog.userAgent}
                    </p>
                  )}
                </div>
              )}

              {/* Old & New Values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">القيمة السابقة</p>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 overflow-x-auto">
                    <pre className="text-xs text-red-700 whitespace-pre-wrap" dir="ltr">
                      {selectedLog.oldValue
                        ? JSON.stringify(selectedLog.oldValue, null, 2)
                        : 'لا توجد قيمة سابقة'}
                    </pre>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">القيمة الجديدة</p>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 overflow-x-auto">
                    <pre className="text-xs text-green-700 whitespace-pre-wrap" dir="ltr">
                      {selectedLog.newValue
                        ? JSON.stringify(selectedLog.newValue, null, 2)
                        : 'لا توجد قيمة جديدة'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
