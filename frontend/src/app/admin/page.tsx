'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { Loading } from '@/components/ui/Spinner';
import { adminAPI } from '@/lib/api';
import { formatNumber, formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import {
  Users, Activity, Clock, CheckCircle2, AlertCircle, Search,
  Eye, ArrowUpRight, ArrowDownRight, Receipt, Shield, TrendingUp,
  DollarSign, FileText, Zap
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

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

interface ChartDataItem {
  name: string;
  transactions: number;
  volume: number;
}

const AdminDashboardPage = () => {
  const router = useRouter();

  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTxs, setLoadingTxs] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [mounted, setMounted] = useState(false);

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

  // Handle client-side mounting and time updates
  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    };
    
    updateTime(); // Initial time
    const interval = setInterval(updateTime, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { fetchDashboardStats(); }, [fetchDashboardStats]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchTransactions(), 300);
    return () => clearTimeout(debounce);
  }, [fetchTransactions]);

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: any; label: string }> = {
      PENDING: { variant: 'warning', label: 'بانتظار الإيصال' },
      UNDER_REVIEW: { variant: 'warning', label: 'قيد المراجعة' },
      APPROVED: { variant: 'info', label: 'جاري المعالجة' },
      COMPLETED: { variant: 'success', label: 'مكتملة' },
      REJECTED: { variant: 'error', label: 'مرفوضة' }
    };
    const config = configs[status] || configs.PENDING;
    return <Badge variant={config.variant} dot>{config.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Dashboard Header */}
        <Card padding="lg" className="bg-gradient-to-br from-indigo-600 to-purple-700 border-0 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">لوحة التحكم</h1>
                <p className="text-indigo-100">نظرة عامة على نشاط المنصة</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-indigo-100">آخر تحديث</p>
              <p className="text-lg font-semibold en-digits">
                {mounted ? currentTime : '--:--:--'}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        {loadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} padding="lg">
                <div className="animate-pulse">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hover padding="lg" className="hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex items-center gap-1 text-sm text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="en-digits">+12%</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">معاملات اليوم</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 en-digits">
                {formatNumber(stats.todayTransactions || stats.totalTransactions)}
              </p>
            </Card>

            <Card hover padding="lg" className="hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">بانتظار المراجعة</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 en-digits">
                {formatNumber(stats.underReviewCount)}
              </p>
            </Card>

            <Card hover padding="lg" className="hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-center gap-1 text-sm text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="en-digits">+8%</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">مكتملة</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 en-digits">
                {formatNumber(stats.completedCount)}
              </p>
            </Card>

            <Card hover padding="lg" className="hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex items-center gap-1 text-sm text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="en-digits">+3%</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">إجمالي المستخدمين</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 en-digits">
                {formatNumber(stats.totalUsers)}
              </p>
            </Card>
          </div>
        )}

        {/* Charts & Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <Card padding="lg" className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>حجم التحويلات</CardTitle>
                  <CardDescription>آخر 7 أيام</CardDescription>
                </div>
                <select className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>هذا الأسبوع</option>
                  <option>هذا الشهر</option>
                  <option>آخر 3 أشهر</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
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
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="volume" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Alerts */}
          <Card padding="lg">
            <CardHeader>
              <CardTitle>تنبيهات عاجلة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Card padding="md" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 en-digits">
                        {formatNumber(stats?.underReviewCount || 0)} معاملات
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">بانتظار المراجعة</p>
                    </div>
                  </div>
                </Card>

                <Card padding="md" className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 en-digits">
                        {formatNumber(stats?.pendingCount || 0)} إيصالات
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">بانتظار التحقق</p>
                    </div>
                  </div>
                </Card>

                <Card padding="md" className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 en-digits">
                        {formatNumber(stats?.pendingKycCount || 0)} طلبات
                      </p>
                      <p className="text-xs text-indigo-700 dark:text-indigo-300">KYC بانتظار التحقق</p>
                    </div>
                  </div>
                </Card>

                <Button
                  onClick={() => router.push('/admin/transactions')}
                  variant="primary"
                  className="w-full mt-4"
                >
                  عرض جميع المعاملات
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>آخر المعاملات</CardTitle>
                <CardDescription>أحدث 10 معاملات في النظام</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                  className="w-48"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          </CardHeader>
          <CardContent>
            {loadingTxs ? (
              <Loading text="جاري تحميل المعاملات..." />
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">لا توجد معاملات</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow hover={false}>
                    <TableHead>المرجع</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <span className="font-mono text-sm text-slate-900 dark:text-slate-100 en-text">
                          {tx.transactionRef}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{tx.user.fullName}</p>
                          <p className="text-xs text-slate-500 en-text">{tx.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-400 en-digits">
                          {formatDate(tx.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 en-digits">
                            {formatNumber(tx.amountSent)} SDG
                          </p>
                          <p className="text-xs text-slate-500 en-digits">
                            ← {formatNumber(tx.amountReceived)} {tx.toCurrency?.code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => router.push(`/admin/transactions/${tx.id}`)}
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                        >
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              onClick={() => router.push('/admin/transactions')}
              variant="ghost"
              className="text-indigo-600 hover:text-indigo-700"
            >
              عرض جميع المعاملات ←
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
