'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, CheckCircle2, AlertCircle,
  Search, Eye, MoreVertical, Check, X, Send, Edit3, ExternalLink, ChevronLeft, ChevronRight,
  Calendar, Filter, Download, RefreshCw, Receipt
} from 'lucide-react';
import { EmptyState, Pagination } from '@/components/ui';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';

// Types
interface Transaction {
  id: string;
  transactionRef: string;
  status: string;
  amountSent: number;
  amountReceived: number;
  exchangeRate: number;
  fromCurrency: { code: string };
  toCurrency: { code: string };
  createdAt: string;
  user: { fullName: string; email: string; phone: string };
  receiptUrl?: string;
  recipient?: {
    name: string;
    phone: string;
    bankName?: string;
    accountNumber?: string;
  };
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

const TransactionsPage = () => {
  const router = useRouter();

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering and Pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTxForReject, setSelectedTxForReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
      const response = await adminAPI.getAllTransactions(params);
      if (response.success) {
        setTransactions(response.data.transactions);
        setTotalPages(response.data.pagination?.totalPages || response.data.totalPages || 1);
        setTotalCount(response.data.pagination?.total || response.data.total || 0);
      }
    } catch {
      setError('فشل تحميل المعاملات.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchTransactions(), 300);
    return () => clearTimeout(debounce);
  }, [fetchTransactions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = async (action: string, txId: string, data: Record<string, unknown> = {}) => {
    try {
      let response;
      const transactionId = parseInt(txId, 10);
      switch (action) {
        case 'approve':
          response = await adminAPI.approveTransaction(transactionId, data);
          break;
        case 'reject':
          response = await adminAPI.rejectTransaction(transactionId, data as any);
          break;
        case 'complete':
          response = await adminAPI.completeTransaction(transactionId, data);
          break;
        default:
          return;
      }
      if (response.success) {
        fetchTransactions();
        setActiveDropdown(null);
        setShowRejectModal(false);
        setRejectReason('');
      } else {
        alert(`فشل الإجراء: ${response.message}`);
      }
    } catch {
      alert('حدث خطأ أثناء تنفيذ الإجراء.');
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { text: string; bg: string; dot: string; label: string }> = {
      PENDING: { text: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500', label: 'بانتظار الإيصال' },
      UNDER_REVIEW: { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: 'قيد المراجعة' },
      APPROVED: { text: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', label: 'جاري المعالجة' },
      COMPLETED: { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'مكتملة' },
      REJECTED: { text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500', label: 'مرفوضة' }
    };
    return configs[status] || configs.PENDING;
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">إدارة المعاملات</h1>
          <p className="text-slate-600">عرض وإدارة جميع التحويلات</p>
        </div>
          {/* Filters Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-900">الفلاتر</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو المرجع..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="w-full pl-3 pr-9 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="PENDING">بانتظار الإيصال</option>
                <option value="UNDER_REVIEW">قيد المراجعة</option>
                <option value="APPROVED">جاري المعالجة</option>
                <option value="COMPLETED">مكتملة</option>
                <option value="REJECTED">مرفوضة</option>
              </select>

              {/* Date From */}
              <div className="relative">
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-full pl-3 pr-9 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="من تاريخ"
                />
              </div>

              {/* Date To */}
              <div className="relative">
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-full pl-3 pr-9 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="إلى تاريخ"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-3 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  مسح
                </button>
                <button
                  onClick={fetchTransactions}
                  className="px-3 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">المعاملات</h3>
                <p className="text-sm text-slate-500">{totalCount} معاملة إجمالاً</p>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                <Download className="w-4 h-4" /> تصدير
              </button>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12">
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded flex-1"></div>
                        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : transactions.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="لا توجد معاملات"
                  description="لم يتم العثور على أي معاملات تطابق معايير البحث"
                />
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">المرجع</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">العميل</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">التاريخ</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">المبلغ المرسل</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">المبلغ المستلم</th>
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
                            <span className="font-mono text-sm font-medium text-slate-900">{tx.transactionRef}</span>
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
                            <span className="text-sm font-medium text-slate-900">{formatCurrency(tx.amountSent, 'SDG')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-700 en-digits">{tx.amountReceived?.toLocaleString('en-US')} {tx.toCurrency?.code}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative" ref={activeDropdown === tx.id ? dropdownRef : null}>
                              <button
                                onClick={() => setActiveDropdown(activeDropdown === tx.id ? null : tx.id)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-600" />
                              </button>

                              {activeDropdown === tx.id && (
                                <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                                  <button
                                    onClick={() => { router.push(`/admin/transactions/${tx.id}`); setActiveDropdown(null); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <Eye className="w-4 h-4" /> عرض التفاصيل
                                  </button>

                                  {tx.receiptUrl && (
                                    <a
                                      href={tx.receiptUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                      onClick={() => setActiveDropdown(null)}
                                    >
                                      <ExternalLink className="w-4 h-4" /> عرض الإيصال
                                    </a>
                                  )}

                                  {tx.status === 'UNDER_REVIEW' && (
                                    <>
                                      <div className="border-t border-slate-100 my-1"></div>
                                      <button
                                        onClick={() => handleAction('approve', tx.id)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                                      >
                                        <Check className="w-4 h-4" /> موافقة
                                      </button>
                                      <button
                                        onClick={() => { setSelectedTxForReject(tx.id); setShowRejectModal(true); setActiveDropdown(null); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                      >
                                        <X className="w-4 h-4" /> رفض
                                      </button>
                                    </>
                                  )}

                                  {tx.status === 'APPROVED' && (
                                    <>
                                      <div className="border-t border-slate-100 my-1"></div>
                                      <button
                                        onClick={() => handleAction('complete', tx.id)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                      >
                                        <CheckCircle2 className="w-4 h-4" /> إكمال التحويل
                                      </button>
                                    </>
                                  )}

                                  <div className="border-t border-slate-100 my-1"></div>
                                  <button
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => setActiveDropdown(null)}
                                  >
                                    <Send className="w-4 h-4" /> إرسال إشعار
                                  </button>
                                  <button
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => setActiveDropdown(null)}
                                  >
                                    <Edit3 className="w-4 h-4" /> تعديل
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={totalCount}
                  itemsPerPage={15}
                />
              </div>
            )}
          </div>
        </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">رفض المعاملة</h3>
            <p className="text-sm text-slate-500 mb-4">يرجى إدخال سبب الرفض:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              placeholder="سبب الرفض..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); setSelectedTxForReject(null); }}
                className="flex-1 px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (selectedTxForReject && rejectReason.trim()) {
                    handleAction('reject', selectedTxForReject, { rejectionReason: rejectReason });
                  }
                }}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TransactionsPage;
