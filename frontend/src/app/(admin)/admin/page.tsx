'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, DollarSign, Activity, Clock,
  CheckCircle2, AlertCircle, LogOut, Menu, Search,
  Eye, ArrowUpRight, ArrowDownRight, Receipt, Settings, HelpCircle, Shield
} from 'lucide-react';
import { adminAPI, authAPI } from '@/lib/api';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { NotificationBell } from '@/components/admin/NotificationBell';
import { NotificationPopover } from '@/components/admin/NotificationPopover';
import { UserMenu } from '@/components/admin/UserMenu';

// Types
interface Transaction {
  id: string;
  transactionRef: string;
  status: string;
  amountSent: number;
  amountReceived: number;
  fromCurrency: { code: string };
  toCurrency: { code: string };
  createdAt: string;
  user: { fullName: string; email: string };
  receiptUrl?: string;
}

interface Stats {
  totalTransactions: number;
  pendingCount: number;
  underReviewCount: number;
  completedCount: number;
  totalUsers: number;
  todayTransactions?: number;
  todayVolume?: number;
  pendingKycCount?: number;
}

// Helper to format currency
const formatCurrency = (amount: number, currency = 'SDG') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Chart data type
interface ChartDataItem {
  name: string;
  transactions: number;
  volume: number;
}

const AdminDashboardPage = () => {
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTxs, setLoadingTxs] = useState(true);
  const [error, setError] = useState('');

  // Filtering
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await adminAPI.getDashboardStats();
      if (response.success) {
        setStats(response.data);
        if (response.data.weeklyChartData) {
          setChartData(response.data.weeklyChartData);
        }
      }
    } catch {
      setError('فشل تحميل الإحصائيات.');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoadingTxs(true);
      const params = {
        page: 1,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
      };
      const response = await adminAPI.getAllTransactions(params);
      if (response.success) {
        setTransactions(response.data.transactions);
      }
    } catch {
      setError('فشل تحميل المعاملات.');
    } finally {
      setLoadingTxs(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => { fetchDashboardStats(); }, [fetchDashboardStats]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchTransactions(), 300);
    return () => clearTimeout(debounce);
  }, [fetchTransactions]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { text: string; bg: string; label: string }> = {
      PENDING: { text: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', label: 'بانتظار الإيصال' },
      UNDER_REVIEW: { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'قيد المراجعة' },
      APPROVED: { text: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'جاري المعالجة' },
      COMPLETED: { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'مكتملة' },
      REJECTED: { text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', label: 'مرفوضة' }
    };
    return configs[status] || configs.PENDING;
  };

  // Stat Card Component
  const StatCard = ({ title, value, change, changeType, icon: Icon, color }: {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'up' | 'down';
    icon: React.ElementType;
    color: string;
  }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm ${changeType === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {changeType === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {change}
          </div>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );

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
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm"
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
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm"
            >
              <Users className="w-4 h-4" /> المستخدمين
            </button>
            <button
              onClick={() => router.push('/admin/settings')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm"
            >
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
              <div>
                <h1 className="text-lg font-semibold text-slate-900">لوحة التحكم</h1>
                <p className="text-sm text-slate-500">مرحباً بك في نظام راصد</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <NotificationBell onClick={() => setShowNotifications(!showNotifications)} />
                <NotificationPopover
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                />
              </div>

              {/* User Menu */}
              <UserMenu adminName="المدير" adminEmail="admin@rasid.com" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          {loadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="معاملات اليوم"
                value={stats.todayTransactions || stats.totalTransactions}
                change="+12%"
                changeType="up"
                icon={Activity}
                color="bg-indigo-600"
              />
              <StatCard
                title="بانتظار المراجعة"
                value={stats.underReviewCount}
                icon={Clock}
                color="bg-amber-500"
              />
              <StatCard
                title="مكتملة"
                value={stats.completedCount}
                change="+8%"
                changeType="up"
                icon={CheckCircle2}
                color="bg-emerald-500"
              />
              <StatCard
                title="إجمالي المستخدمين"
                value={stats.totalUsers}
                change="+3%"
                changeType="up"
                icon={Users}
                color="bg-violet-500"
              />
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-slate-900">حجم التحويلات</h3>
                  <p className="text-sm text-slate-500">آخر 7 أيام</p>
                </div>
                <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>هذا الأسبوع</option>
                  <option>هذا الشهر</option>
                  <option>آخر 3 أشهر</option>
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions & Alerts */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">تنبيهات عاجلة</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-800">{stats?.underReviewCount || 0} معاملات</p>
                    <p className="text-xs text-amber-600">بانتظار المراجعة</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <Receipt className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-orange-800">{stats?.pendingCount || 0} إيصالات</p>
                    <p className="text-xs text-orange-600">بانتظار التحقق</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-800">{stats?.pendingKycCount || 0} طلبات</p>
                    <p className="text-xs text-indigo-600">KYC بانتظار التحقق</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/admin/transactions')}
                  className="w-full mt-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  عرض جميع المعاملات
                </button>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">آخر المعاملات</h3>
                  <p className="text-sm text-slate-500">أحدث 10 معاملات في النظام</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="بحث..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="PENDING">بانتظار الإيصال</option>
                    <option value="UNDER_REVIEW">قيد المراجعة</option>
                    <option value="APPROVED">جاري المعالجة</option>
                    <option value="COMPLETED">مكتملة</option>
                    <option value="REJECTED">مرفوضة</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loadingTxs ? (
                <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">المرجع</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">العميل</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">التاريخ</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">المبلغ</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">الحالة</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map(tx => {
                      const cfg = getStatusConfig(tx.status);
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm text-slate-900">{tx.transactionRef}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{tx.user.fullName}</p>
                              <p className="text-xs text-slate-500">{tx.user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">{formatDate(tx.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{formatCurrency(tx.amountSent, 'SDG')}</p>
                              <p className="text-xs text-slate-500">← {tx.amountReceived} {tx.toCurrency?.code}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => router.push(`/admin/transactions/${tx.id}`)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4 text-slate-600" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => router.push('/admin/transactions')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                عرض جميع المعاملات ←
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
