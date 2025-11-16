// frontend/src/app/(admin)/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { User, ShieldCheck, ShieldOff, Search, Loader } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
      };

      const response = await adminAPI.getAllUsers(params);
      if (response.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
      alert('فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, statusFilter, page]);

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    if (!window.confirm(`هل أنت متأكد من ${!currentStatus ? 'تفعيل' : 'حظر'} هذا المستخدم؟`)) {
      return;
    }

    try {
      const response = await adminAPI.toggleUserStatus(userId, !currentStatus);
      if (response.success) {
        // Update UI
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
        alert(response.message);
      } else {
        alert(`فشل: ${response.message}`);
      }
    } catch (err) {
      console.error('Failed to toggle user status', err);
      alert('حدث خطأ أثناء تحديث حالة المستخدم');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">إدارة المستخدمين</h1>
          <p className="text-slate-600">عرض وإدارة حسابات المستخدمين</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 bg-white"
            >
              <option value="all">جميع المستخدمين</option>
              <option value="active">نشط</option>
              <option value="blocked">محظور</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">المستخدم</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">التواصل</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">الدولة</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">المعاملات</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">الحالة</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{user.fullName}</div>
                      <div className="text-sm text-slate-500">#{user.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-800">{user.email}</div>
                      <div className="text-sm text-slate-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{user.country}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-indigo-600">{user._count?.transactions || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-xl ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {user.isActive ? 'نشط' : 'محظور'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${user.isActive ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                        >
                          {user.isActive ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                          {user.isActive ? 'حظر' : 'تفعيل'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">صفحة {page} من {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
