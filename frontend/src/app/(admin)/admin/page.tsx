'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, DollarSign, Activity, Clock, 
  CheckCircle2, XCircle, AlertCircle, Search, 
  Download, Settings, Bell, LogOut, Menu, X as CloseIcon,
  Eye, Check, Ban, FileText, ArrowUpDown
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

  // Filtering and Pagination states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await adminAPI.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
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
    } catch (err) {
      setError('فشل تحميل المعاملات.');
    } finally {
      setLoadingTxs(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    const debounce = setTimeout(() => {
        fetchTransactions();
    }, 300); // Debounce search input
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
        // Refresh data
        fetchTransactions();
        fetchDashboardStats();
        if(showModal) setShowModal(false);
      } else {
        alert(`فشل الإجراء: ${response.message}`);
      }
    } catch (err) {
      alert('حدث خطأ أثناء تنفيذ الإجراء.');
    }
  };

  const handleApprove = (txId) => {
    if (window.confirm('هل أنت متأكد من الموافقة على هذه المعاملة؟')) {
      handleAction('approve', txId);
    }
  };

  const handleReject = (txId) => {
    const reason = prompt('الرجاء إدخال سبب الرفض:');
    if (reason) {
      handleAction('reject', txId, { rejectionReason: reason });
    }
  };
  
  const handleComplete = (txId) => {
    if (window.confirm('هل أنت متأكد من إتمام هذه المعاملة؟')) {
      handleAction('complete', txId);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    router.push('/login');
  };

  const getStatusConfig = (status) => {
    const configs = {
      'UNDER_REVIEW': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'قيد المراجعة' },
      'APPROVED': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: CheckCircle2, label: 'موافق عليها' },
      'COMPLETED': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, label: 'مكتملة' },
      'REJECTED': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle, label: 'مرفوضة' },
      'PENDING': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: AlertCircle, label: 'قيد الانتظار' }
    };
    return configs[status] || configs['PENDING'];
  };

  const StatCard = ({ title, value, icon, color, unit, subtext }) => {
    const Icon = icon;
    const colorClasses = {
        indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200',
        amber: 'from-amber-500 to-amber-600 shadow-amber-200',
        emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
        violet: 'from-violet-500 to-violet-600 shadow-violet-200',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color] || colorClasses.indigo} rounded-2xl p-6 text-white shadow-lg`}>
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <div>
                <p className="text-white/80 text-sm mb-2">{title}</p>
                <p className="text-4xl font-bold">{value} {unit}</p>
                {subtext && <p className="text-sm text-white/80 mt-2">{subtext}</p>}
            </div>
        </div>
    );
  };

  // Main component render
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed right-0 top-0 h-full bg-white border-l border-slate-200 transition-all duration-300 z-40 ${showSidebar ? 'w-72' : 'w-0'} overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">لوحة تحكم راصد</h2>
              <p className="text-xs text-slate-500">نظام راصد</p>
            </div>
          </div>
          <nav className="space-y-2">
          <nav className="space-y-2">
            <button
              onClick={() => router.push("/admin")}
              className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-semibold"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>لوحة التحكم</span>
            </button>
            <button
              onClick={() => router.push("/admin/users")}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>إدارة المستخدمين</span>
            </button>
          </nav>
          <div className="absolute bottom-6 left-6 right-6">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-all">
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${showSidebar ? 'mr-72' : 'mr-0'}`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowSidebar(!showSidebar)} className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">مرحباً، المدير</h1>
                <p className="text-sm text-slate-500">إليك ملخص اليوم</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          {loadingStats ? <p>جاري تحميل الإحصائيات...</p> : stats &&
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="إجمالي المعاملات" value={stats.totalTransactions} icon={Activity} color="indigo" subtext={`المبلغ: ${formatCurrency(stats.totalAmount)}`} />
              <StatCard title="قيد المراجعة" value={stats.underReviewCount} icon={Clock} color="amber" subtext="يحتاج لمراجعة فورية" />
              <StatCard title="معاملات مكتملة" value={stats.completedCount} icon={CheckCircle2} color="emerald" />
              <StatCard title="إجمالي المستخدمين" value={stats.totalUsers} icon={Users} color="violet" subtext={`${stats.activeUsers} نشط`} />
            </div>
          }

          {/* Filters & Actions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">المعاملات الأخيرة</h3>
                    <p className="text-sm text-slate-600">مراجعة وإدارة المعاملات</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="البحث..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 pr-12 pl-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 bg-white"
                    >
                        <option value="all">جميع الحالات</option>
                        <option value="UNDER_REVIEW">قيد المراجعة</option>
                        <option value="APPROVED">موافق عليها</option>
                        <option value="COMPLETED">مكتملة</option>
                        <option value="REJECTED">مرفوضة</option>
                    </select>
                </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {loadingTxs ? <p className='p-6'>جاري تحميل المعاملات...</p> : 
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">المعاملة</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">المستخدم</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">المبلغ</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">الحالة</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => {
                      const statusConfig = getStatusConfig(tx.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <p className="font-mono text-sm font-bold text-indigo-600">{tx.transactionRef}</p>
                            <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString('ar-EG')}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900 text-sm">{tx.user.fullName}</p>
                            <p className="text-xs text-slate-500">{tx.user.phone}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{formatCurrency(tx.amountSent, tx.fromCurrency.code)}</p>
                            <p className="text-sm text-emerald-600 font-semibold">→ {formatCurrency(tx.amountReceived, tx.toCurrency.code)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                              <StatusIcon className="w-4 h-4" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => { setSelectedTx(tx); setShowModal(true); }} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                                <Eye className="w-4 h-4 text-slate-600" />
                              </button>
                              {tx.status === 'UNDER_REVIEW' && (
                                <>
                                  <button onClick={() => handleApprove(tx.id)} className="w-9 h-9 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  </button>
                                  <button onClick={() => handleReject(tx.id)} className="w-9 h-9 rounded-lg bg-rose-100 hover:bg-rose-200 flex items-center justify-center">
                                    <Ban className="w-4 h-4 text-rose-600" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              }
            </div>
            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-600">صفحة {page} من {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  السابق
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  التالي
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Transaction Detail Modal */}
      {showModal && selectedTx && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 flex justify-between items-center z-10 rounded-t-3xl">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">تفاصيل المعاملة</h3>
                        <p className="text-sm text-slate-600 mt-1">المرجع: {selectedTx.transactionRef}</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center">
                        <CloseIcon className="w-6 h-6 text-slate-600" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* User & Amount Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" />المرسل</h4>
                            <p className="text-sm"><span className="font-semibold">الاسم:</span> {selectedTx.user.fullName}</p>
                            <p className="text-sm"><span className="font-semibold">الهاتف:</span> {selectedTx.user.phone}</p>
                            <p className="text-sm"><span className="font-semibold">البريد:</span> {selectedTx.user.email}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" />المستلم</h4>
                            <p className="text-sm"><span className="font-semibold">الاسم:</span> {selectedTx.recipientName}</p>
                            <p className="text-sm"><span className="font-semibold">الهاتف:</span> {selectedTx.recipientPhone}</p>
                        </div>
                    </div>

                    {/* Receipt */}
                    {selectedTx.receiptUrl &&
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-violet-600" />إيصال الدفع</h4>
                            <div className="bg-white rounded-xl p-4 border-2 border-slate-200">
                                <a href={selectedTx.receiptUrl} target="_blank" rel="noopener noreferrer">
                                    <img src={selectedTx.receiptUrl} alt="Receipt" className="max-h-96 w-auto mx-auto rounded-lg" />
                                </a>
                            </div>
                        </div>
                    }

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-slate-200">
                    {selectedTx.status === 'UNDER_REVIEW' && (
                        <>
                            <button onClick={() => handleApprove(selectedTx.id)} className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-4 rounded-xl">موافقة</button>
                            <button onClick={() => handleReject(selectedTx.id)} className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold py-4 rounded-xl">رفض</button>
                        </>
                    )}
                    {selectedTx.status === 'APPROVED' && (
                        <button onClick={() => handleComplete(selectedTx.id)} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-4 rounded-xl">تعليم كمكتمل</button>
                    )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;