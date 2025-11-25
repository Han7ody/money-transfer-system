'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, Download, RefreshCw
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
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
    <div className="space-y-6">
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
  );
};

export default UsersManagementPage;
