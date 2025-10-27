'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { transactionAPI, authAPI } from '@/lib/api';
import { ArrowUpRight, Clock, CheckCircle2, XCircle, TrendingUp, Users, DollarSign, Bell, Search, Eye, Loader, LogOut, User as UserIcon } from 'lucide-react';

const getStatusBadge = (status) => {
  const statusConfig = {
    'COMPLETED': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'مكتمل', icon: CheckCircle2 },
    'PENDING': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'في انتظار الدفع', icon: Clock },
    'UNDER_REVIEW': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'قيد المراجعة', icon: Clock },
    'REJECTED': { bg: 'bg-rose-50', text: 'text-rose-700', label: 'مرفوض', icon: XCircle },
    'CANCELLED': { bg: 'bg-slate-50', text: 'text-slate-700', label: 'ملغي', icon: XCircle },
  };
  
  const config = statusConfig[status] || statusConfig['PENDING'];
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, PENDING: 0, COMPLETED: 0, REJECTED: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, totalPages: 1 });
  const [activeTab, setActiveTab] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchDashboardData = useCallback(async (page = 1, status = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const statusFilter = status === 'all' ? undefined : status.toUpperCase();
      const res = await transactionAPI.getAll({ page, limit: pagination.limit, status: statusFilter });
      
      if (res.success) {
        setTransactions(res.data.transactions);
        setPagination(res.data.pagination);
        if (status === 'all' && page === 1) {
          const allTransactionsRes = await transactionAPI.getAll({ limit: 1000 });
          if(allTransactionsRes.success) {
            const allTxs = allTransactionsRes.data.transactions;
            const newStats = {
              total: allTxs.length,
              PENDING: allTxs.filter(t => t.status === 'PENDING' || t.status === 'UNDER_REVIEW').length,
              COMPLETED: allTxs.filter(t => t.status === 'COMPLETED').length,
              REJECTED: allTxs.filter(t => t.status === 'REJECTED' || t.status === 'CANCELLED').length,
            };
            setStats(newStats);
          }
        }
      } else {
        setError(res.message || 'Failed to fetch transactions.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching data.');
    }
    setLoading(false);
  }, [pagination.limit]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await authAPI.getCurrentUser();
        if (res.success) {
          setUser(res.data);
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };
    loadUser();
    fetchDashboardData(pagination.page, activeTab);
  }, [fetchDashboardData, router, pagination.page, activeTab]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(p => ({ ...p, page: newPage }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">لوحة التحكم</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-slate-100 rounded-lg transition">
                <Bell className="w-5 h-5 text-slate-600" />
              </button>
              {user && (
                <div className="relative">
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 pr-4 border-r border-slate-200 cursor-pointer">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
                      <p className="text-xs text-slate-500">{user.role}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {user.fullName?.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  
                  {isDropdownOpen && (
                    <div 
                      className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 border animate-in fade-in-5 slide-in-from-top-2"
                      onMouseLeave={() => setIsDropdownOpen(false)}
                    >
                      <a href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
                        <UserIcon className="w-4 h-4" />
                        <span>الملف الشخصي</span>
                      </a>
                      <button 
                        onClick={() => authAPI.logout()} 
                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">مرحباً بك مجدداً, {user?.fullName?.split(' ')[0]}! 👋</h2>
          <p className="text-slate-600">إليك ملخص معاملاتك اليوم</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"><p className="text-slate-600 text-sm font-medium mb-1">إجمالي التحويلات</p><p className="text-3xl font-bold text-slate-900">{stats.total}</p></div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"><p className="text-slate-600 text-sm font-medium mb-1">قيد الانتظار</p><p className="text-3xl font-bold text-amber-600">{stats.PENDING}</p></div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"><p className="text-slate-600 text-sm font-medium mb-1">مكتملة</p><p className="text-3xl font-bold text-emerald-600">{stats.COMPLETED}</p></div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"><p className="text-slate-600 text-sm font-medium mb-1">مرفوضة</p><p className="text-3xl font-bold text-rose-600">{stats.REJECTED}</p></div>
        </div>

        <div className="mb-8">
          <button onClick={() => router.push('/new-transfer')} className="group bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all duration-300 flex items-center gap-3">
            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            إنشاء تحويل جديد
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">المعاملات الأخيرة</h3>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-16 text-red-600">Error: {error}</div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">المرجع</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">المستلم</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">المبلغ</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">الحالة</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">التاريخ</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4"><span className="font-mono text-sm font-semibold text-slate-900">{tx.transactionRef}</span></td>
                      <td className="px-6 py-4"><span className="text-sm font-medium text-slate-900">{tx.recipientName}</span></td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-bold text-slate-900">{parseFloat(tx.amountSent).toFixed(2)} {tx.fromCurrency.code}</div>
                          <div className="text-slate-500">→ {parseFloat(tx.amountReceived).toFixed(2)} {tx.toCurrency.code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(tx.status)}</td>
                      <td className="px-6 py-4"><span className="text-sm text-slate-600">{new Date(tx.createdAt).toLocaleDateString()}</span></td>
                      <td className="px-6 py-4">
                        <button onClick={() => router.push(`/transactions/${tx.id}`)} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
                          <Eye className="w-4 h-4" />
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-600">صفحة {pagination.page} من {pagination.totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">السابق</button>
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">التالي</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}