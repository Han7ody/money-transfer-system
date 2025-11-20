'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, DollarSign, Activity, Clock, 
  CheckCircle2, XCircle, AlertCircle, Search, 
  LogOut, Menu, X as CloseIcon, Eye, Check, Ban, FileText
} from 'lucide-react';
import { adminAPI, authAPI } from '@/lib/api';

// Helper to format currency
const formatCurrency = (amount, currency = 'SDG') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
};

const AdminDashboardPage = () => {
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(true);

  // Data states
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTxs, setLoadingTxs] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [selectedTx, setSelectedTx] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Filtering and Pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await adminAPI.getDashboardStats();
      if (response.success) setStats(response.data);
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
        page,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
      };
      const response = await adminAPI.getAllTransactions(params);
      if (response.success) {
        setTransactions(response.data.transactions);
        setTotalPages(response.data.totalPages);
      }
    } catch {
      setError('فشل تحميل المعاملات.');
    } finally {
      setLoadingTxs(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => { fetchDashboardStats(); }, [fetchDashboardStats]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchTransactions(), 300);
    return () => clearTimeout(debounce);
  }, [fetchTransactions]);

  const handleAction = async (action, txId, data = {}) => {
    try {
      let response;
      switch (action) {
        case 'approve':
          response = await adminAPI.approveTransaction(txId, data);
          break;
        case 'reject':
          response = await adminAPI.rejectTransaction(txId, data);
          break;
        case 'complete':
          response = await adminAPI.completeTransaction(txId, data);
          break;
        default:
          return;
      }
      if (response.success) {
        fetchTransactions();
        fetchDashboardStats();
        setShowModal(false);
      } else alert(`فشل الإجراء: ${response.message}`);
    } catch {
      alert('حدث خطأ أثناء تنفيذ الإجراء.');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      UNDER_REVIEW: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock, label: 'قيد المراجعة' },
      APPROVED: { text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', icon: CheckCircle2, label: 'موافق عليها' },
      COMPLETED: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, label: 'مكتملة' },
      REJECTED: { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: XCircle, label: 'مرفوضة' },
      PENDING: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: AlertCircle, label: 'قيد الانتظار' }
    };
    return configs[status] || configs.PENDING;
  };

  const StatCard = ({ title, value, icon, color }) => {
    const Icon = icon;
    return (
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <p className="text-white/80 text-sm">{title}</p>
        <p className="text-4xl font-bold">{value}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">

      {/* Sidebar */}
      <aside className={`fixed right-0 top-0 h-full bg-white border-l transition-all ${showSidebar ? "w-72" : "w-0"} overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">لوحة تحكم راصد</h2>
              <p className="text-xs text-slate-500">نظام راصد</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button onClick={() => router.push("/admin")} className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl">
              <LayoutDashboard className="w-5 h-5" /> لوحة التحكم
            </button>

            <button onClick={() => router.push("/admin/users")} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl">
              <Users className="w-5 h-5" /> إدارة المستخدمين
            </button>
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <button onClick={() => { authAPI.logout(); router.push("/login"); }} className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl">
              <LogOut className="w-5 h-5" /> تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={`${showSidebar ? "mr-72" : "mr-0"} transition-all`}>

        <header className="bg-white border-b px-6 py-4 flex justify-between">
          <button onClick={() => setShowSidebar(!showSidebar)} className="w-10 h-10 flex items-center justify-center">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">مرحباً، المدير</h1>
            <p className="text-sm text-slate-500">إليك ملخص اليوم</p>
          </div>
        </header>

        <div className="p-6 space-y-6">

          {/* Stats */}
          {loadingStats ? <p>جاري تحميل...</p> : stats &&
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="إجمالي المعاملات" value={stats.totalTransactions} icon={Activity} />
              <StatCard title="قيد المراجعة" value={stats.underReviewCount} icon={Clock} />
              <StatCard title="مكتملة" value={stats.completedCount} icon={CheckCircle2} />
              <StatCard title="المستخدمين" value={stats.totalUsers} icon={Users} />
            </div>
          }

          {/* Transactions */}
          <div className="bg-white border rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">المعاملات الأخيرة</h3>

            <div className="mb-4 flex gap-4">
              <input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border p-3 rounded-lg w-64"
              />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border p-3 rounded-lg">
                <option value="all">جميع الحالات</option>
                <option value="UNDER_REVIEW">قيد المراجعة</option>
                <option value="APPROVED">موافق عليها</option>
                <option value="COMPLETED">مكتملة</option>
                <option value="REJECTED">مرفوضة</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              {loadingTxs ? <p>جاري التحميل...</p> :
                <table className="w-full">
                  <thead><tr>
                    <th>المعاملة</th>
                    <th>المستخدم</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr></thead>

                  <tbody>
                    {transactions.map(tx => {
                      const cfg = getStatusConfig(tx.status);
                      const Icon = cfg.icon;
                      return (
                        <tr key={tx.id} className="border-t">
                          <td>{tx.transactionRef}</td>
                          <td>{tx.user.fullName}</td>
                          <td>{formatCurrency(tx.amountSent)}</td>
                          <td>
                            <span className={`px-3 py-1 rounded-xl border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                              <Icon className="inline w-4 h-4" /> {cfg.label}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => { setSelectedTx(tx); setShowModal(true); }}>
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              }
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && selectedTx &&
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full">
            <h2 className="text-xl font-bold mb-4">تفاصيل المعاملة</h2>

            <p><b>المرجع:</b> {selectedTx.transactionRef}</p>
            <p><b>الاسم:</b> {selectedTx.user.fullName}</p>

            <div className="mt-4 text-right">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-200 rounded-lg">إغلاق</button>
            </div>
          </div>
        </div>
      }
    </div>
  );
};

export default AdminDashboardPage;
