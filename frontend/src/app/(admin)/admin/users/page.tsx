'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, DollarSign, LogOut, Menu, Bell, ChevronDown,
  Receipt, Settings, HelpCircle, ArrowLeft, ChevronLeft, ChevronRight,
  Download, RefreshCw
} from 'lucide-react';
import { adminAPI, authAPI } from '@/lib/api';
import { UserFilters } from '@/components/admin/UserFilters';
import { UserTable } from '@/components/admin/UserTable';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  transactionCount: number;
  isActive: boolean;
  isVerified: boolean;
  isNew: boolean;
  createdAt: string;
}

const UsersManagementPage = () => {
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(true);

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 15;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | undefined> = {
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        country: countryFilter || undefined,
        verified: verificationFilter === 'all' ? undefined : verificationFilter,
      };

      const response = await adminAPI.getAllUsers(params);
      if (response.success) {
        // Transform API response to match our User interface
        const transformedUsers = (response.data.users || response.data || []).map((user: any) => ({
          id: user.id?.toString() || user.id,
          fullName: user.fullName || user.name || 'غير محدد',
          email: user.email || '',
          phone: user.phone || '',
          country: user.country || 'SD',
          transactionCount: user._count?.transactions || user.transactionCount || 0,
          isActive: user.isActive !== false,
          isVerified: user.isVerified || false,
          isNew: user.isNew || (new Date().getTime() - new Date(user.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000),
          createdAt: user.createdAt
        }));

        setUsers(transformedUsers);
        setTotalPages(response.data.pagination?.totalPages || response.data.totalPages || 1);
        setTotalCount(response.data.pagination?.total || response.data.total || transformedUsers.length);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, countryFilter, verificationFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleToggleBlock = async (userId: string, block: boolean) => {
    try {
      const response = await adminAPI.toggleUserStatus(parseInt(userId), !block);
      if (response.success) {
        fetchUsers();
      } else {
        alert('فشل تحديث حالة المستخدم');
      }
    } catch {
      alert('حدث خطأ أثناء تحديث حالة المستخدم');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCountryFilter('');
    setVerificationFilter('all');
    setPage(1);
  };

  // Calculate pagination display
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed right-0 top-0 h-full bg-white border-l border-slate-200 transition-all z-40 ${showSidebar ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="p-5 h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">راصد</h2>
              <p className="text-xs text-slate-500">لوحة التحكم</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            <button
              onClick={() => router.push('/admin')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm"
            >
              <LayoutDashboard className="w-4 h-4" /> الرئيسية
            </button>
            <button
              onClick={() => router.push('/admin/transactions')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm"
            >
              <Receipt className="w-4 h-4" /> المعاملات
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm"
            >
              <Users className="w-4 h-4" /> المستخدمين
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">
              <Settings className="w-4 h-4" /> الإعدادات
            </button>
          </nav>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-100 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">
              <HelpCircle className="w-4 h-4" /> المساعدة
            </button>
            <button
              onClick={() => { authAPI.logout(); router.push('/login'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-lg text-sm"
            >
              <LogOut className="w-4 h-4" /> تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${showSidebar ? 'mr-64' : 'mr-0'} transition-all min-h-screen`}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" /> رجوع
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">م</span>
                </div>
                <span className="text-sm font-medium text-slate-700">المدير</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">إدارة المستخدمين</h1>
              <p className="text-sm text-slate-500 mt-1">
                عرض وإدارة حسابات المستخدمين والتحكم في الصلاحيات
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                className="px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> تحديث
              </button>
              <button className="px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" /> تصدير
              </button>
            </div>
          </div>

          {/* Filters */}
          <UserFilters
            searchTerm={searchTerm}
            onSearchChange={(value) => { setSearchTerm(value); setPage(1); }}
            statusFilter={statusFilter}
            onStatusChange={(value) => { setStatusFilter(value); setPage(1); }}
            countryFilter={countryFilter}
            onCountryChange={(value) => { setCountryFilter(value); setPage(1); }}
            verificationFilter={verificationFilter}
            onVerificationChange={(value) => { setVerificationFilter(value); setPage(1); }}
            onReset={resetFilters}
          />

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {/* Users Table */}
          <UserTable
            users={users}
            loading={loading}
            onToggleBlock={handleToggleBlock}
          />

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  عرض {startItem}–{endItem} من {totalCount} مستخدم
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Page numbers */}
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UsersManagementPage;
