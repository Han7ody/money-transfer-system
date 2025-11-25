'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Filter,
  Loader2,
  Eye,
  Calendar,
  User,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { AuditLog, AuditLogFilters } from '@/types/audit';
import { AuditLogDrawer } from '@/components/admin/AuditLogDrawer';

export default function AuditLogsPage() {
  const router = useRouter();
  const { role } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
    action: '',
    entity: '',
    adminId: undefined,
    startDate: '',
    endDate: '',
    search: ''
  });

  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableEntities, setAvailableEntities] = useState<string[]>([]);
  const [availableAdmins, setAvailableAdmins] = useState<Array<{ id: number; name: string; email: string }>>([]);

  useEffect(() => {
    if (role && role !== 'SUPER_ADMIN') {
      router.push('/unauthorized');
    }
  }, [role, router]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (role === 'SUPER_ADMIN') {
      fetchLogs();
    }
  }, [currentPage, role]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.getAuditLogStats();
      if (response.success) {
        setAvailableActions(Object.keys(response.data.logsByAction || {}));
        setAvailableEntities(Object.keys(response.data.logsByEntity || {}));
        setAvailableAdmins(
          (response.data.logsByAdmin || []).map((admin: any) => ({
            id: admin.adminId,
            name: admin.adminName,
            email: admin.adminEmail || ''
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        ...filters,
        page: currentPage,
        limit
      };

      Object.keys(params).forEach((key) => {
        if (params[key as keyof typeof params] === '' || params[key as keyof typeof params] === undefined) {
          delete params[key as keyof typeof params];
        }
      });

      const response = await apiClient.getAuditLogs(params);

      if (response.success) {
        // Handle both response.data.logs and response.data as array
        const logsData = response.data.logs || response.data;
        setLogs(Array.isArray(logsData) ? logsData : []);

        // Handle pagination data
        const totalCount = response.data.pagination?.total || response.total || 0;
        setTotal(totalCount);
        setTotalPages(Math.ceil(totalCount / limit));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل تحميل سجل التغييرات');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      action: '',
      entity: '',
      adminId: undefined,
      startDate: '',
      endDate: '',
      search: ''
    });
    setCurrentPage(1);
    setTimeout(fetchLogs, 100);
  };

  const handleViewDetails = async (log: AuditLog) => {
    try {
      const response = await apiClient.getAuditLogById(log.id);
      if (response.success) {
        setSelectedLog(response.data);
        setDrawerOpen(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل تحميل تفاصيل السجل');
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.startsWith('UPDATE_')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (action === 'LOGIN' || action === 'LOGOUT') return 'bg-green-100 text-green-700 border-green-200';
    if (action.startsWith('SECURITY_')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">سجل التغيّرات</h1>
        <p className="text-slate-600">عرض كافة عمليات التعديل التي تمت على إعدادات المنصة.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">تصفية السجلات</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-full">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              بحث (البريد الإلكتروني أو نوع العملية)
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="ابحث في السجلات..."
                className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">نوع العملية</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">الكل</option>
              {availableActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">الكيان</label>
            <select
              value={filters.entity}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">الكل</option>
              {availableEntities.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">المسؤول</label>
            <select
              value={filters.adminId || ''}
              onChange={(e) => handleFilterChange('adminId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">الكل</option>
              {availableAdmins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">من تاريخ</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            تطبيق الفلاتر
          </button>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            إعادة تعيين
          </button>
          <div className="mr-auto text-sm text-slate-600">
            إجمالي السجلات: <span className="font-semibold">{total}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">لا توجد سجلات تغيّرات حتى الآن.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" dir="rtl">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      المسؤول
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      نوع العملية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      الكيان
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      الوصف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{formatDate(log.createdAt)}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            {log.admin ? (
                              <>
                                <p className="text-sm font-medium text-slate-900">{log.admin.fullName}</p>
                                <p className="text-xs text-slate-500">{log.admin.email}</p>
                              </>
                            ) : (
                              <p className="text-sm text-slate-500">غير معروف</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-700">{log.entity}</p>
                            {log.entityId && (
                              <p className="text-xs text-slate-500 font-mono">#{log.entityId}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 max-w-xs truncate">
                          {log.oldValue && log.newValue ? 'تم تحديث البيانات' : 'عملية جديدة'}
                        </p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">
                    صفحة {currentPage} من {totalPages}
                  </span>
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AuditLogDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} log={selectedLog} />
    </div>
  );
}
