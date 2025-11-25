'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  LayoutDashboard, Users, DollarSign, Clock, CheckCircle2, AlertCircle,
  LogOut, Menu, Bell, ChevronDown, Receipt, Settings, HelpCircle,
  ArrowLeft, ExternalLink, Check, X, Send, User, Phone, Mail,
  CreditCard, Building, Calendar, FileText, Copy, ArrowRight
} from 'lucide-react';
import { adminAPI, authAPI } from '@/lib/api';

// Types
interface Transaction {
  id: string;
  transactionRef: string;
  status: string;
  amountSent: number;
  amountReceived: number;
  exchangeRate: number;
  fromCurrency: { code: string; name: string };
  toCurrency: { code: string; name: string };
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  receiptUrl?: string;
  receiptUploadedAt?: string;
  approvedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  recipient?: {
    name: string;
    phone: string;
    bankName?: string;
    accountNumber?: string;
  };
  adminNotes?: string;
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
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const TransactionDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;

  const [showSidebar, setShowSidebar] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchTransaction = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTransactionById(transactionId);
      if (response.success) {
        setTransaction(response.data);
      } else {
        setError('فشل تحميل تفاصيل المعاملة');
      }
    } catch {
      setError('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId, fetchTransaction]);

  const handleAction = async (action: string, data: Record<string, unknown> = {}) => {
    if (!transaction) return;

    try {
      setActionLoading(true);
      let response;
      switch (action) {
        case 'approve':
          response = await adminAPI.approveTransaction(transaction.id, data);
          break;
        case 'reject':
          response = await adminAPI.rejectTransaction(transaction.id, data);
          break;
        case 'complete':
          response = await adminAPI.completeTransaction(transaction.id, data);
          break;
        default:
          return;
      }
      if (response.success) {
        fetchTransaction();
        setShowRejectModal(false);
        setRejectReason('');
      } else {
        alert(`فشل الإجراء: ${response.message}`);
      }
    } catch {
      alert('حدث خطأ أثناء تنفيذ الإجراء.');
    } finally {
      setActionLoading(false);
    }
  };

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

  // Timeline steps
  const getTimelineSteps = (tx: Transaction) => {
    const steps = [
      {
        id: 1,
        label: 'تم إنشاء الطلب',
        description: 'تم تقديم طلب التحويل',
        date: tx.createdAt,
        completed: true,
        active: tx.status === 'PENDING'
      },
      {
        id: 2,
        label: 'بانتظار الإيصال',
        description: 'في انتظار رفع إيصال الدفع',
        date: tx.receiptUploadedAt,
        completed: !!tx.receiptUploadedAt || ['UNDER_REVIEW', 'APPROVED', 'COMPLETED'].includes(tx.status),
        active: tx.status === 'PENDING' && !tx.receiptUploadedAt
      },
      {
        id: 3,
        label: 'قيد المراجعة',
        description: 'جاري مراجعة الإيصال',
        date: tx.receiptUploadedAt,
        completed: ['APPROVED', 'COMPLETED'].includes(tx.status),
        active: tx.status === 'UNDER_REVIEW'
      },
      {
        id: 4,
        label: 'جاري المعالجة',
        description: 'جاري تنفيذ التحويل',
        date: tx.approvedAt,
        completed: tx.status === 'COMPLETED',
        active: tx.status === 'APPROVED'
      },
      {
        id: 5,
        label: 'مكتمل',
        description: 'تم إكمال التحويل بنجاح',
        date: tx.completedAt,
        completed: tx.status === 'COMPLETED',
        active: false
      }
    ];

    // If rejected, modify the timeline
    if (tx.status === 'REJECTED') {
      return steps.map(step => ({
        ...step,
        active: false,
        rejected: step.id === 3 // Mark review step as rejected
      }));
    }

    return steps;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-slate-700">{error || 'المعاملة غير موجودة'}</p>
          <button
            onClick={() => router.push('/admin/transactions')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
          >
            العودة للمعاملات
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(transaction.status);
  const timelineSteps = getTimelineSteps(transaction);

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed right-0 top-0 h-full bg-white border-l border-slate-200 transition-all z-40 ${showSidebar ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="p-5 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">راصد</h2>
              <p className="text-xs text-slate-500">لوحة التحكم</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <button onClick={() => router.push('/admin')} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">
              <LayoutDashboard className="w-4 h-4" /> الرئيسية
            </button>
            <button onClick={() => router.push('/admin/transactions')} className="w-full flex items-center gap-3 px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm">
              <Receipt className="w-4 h-4" /> المعاملات
            </button>
            <button onClick={() => router.push('/admin/users')} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">
              <Users className="w-4 h-4" /> المستخدمين
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">
              <Settings className="w-4 h-4" /> الإعدادات
            </button>
          </nav>

          <div className="pt-4 border-t border-slate-100 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">
              <HelpCircle className="w-4 h-4" /> المساعدة
            </button>
            <button onClick={() => { authAPI.logout(); router.push('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-lg text-sm">
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
              <button onClick={() => setShowSidebar(!showSidebar)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <button onClick={() => router.push('/admin/transactions')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                <ArrowLeft className="w-4 h-4" /> العودة للمعاملات
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
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-bold text-slate-900">{transaction.transactionRef}</h1>
                  <button onClick={() => copyToClipboard(transaction.transactionRef)} className="p-1 hover:bg-slate-100 rounded">
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <p className="text-sm text-slate-500">تم إنشاؤها في {formatDate(transaction.createdAt)}</p>
              </div>
              <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.bg} ${statusConfig.text}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Transfer Details */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">تفاصيل التحويل</h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">المبلغ المرسل</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(transaction.amountSent, 'SDG')}</p>
                    <p className="text-xs text-slate-500">{transaction.fromCurrency?.name || 'SDG'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                    <div className="text-center px-4">
                      <p className="text-xs text-slate-500">سعر الصرف</p>
                      <p className="text-sm font-medium text-slate-700">{transaction.exchangeRate}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">المبلغ المستلم</p>
                    <p className="text-2xl font-bold text-emerald-600">{transaction.amountReceived?.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{transaction.toCurrency?.code || 'INR'}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-6">مسار المعاملة</h3>
                <div className="relative">
                  {timelineSteps.map((step, index) => (
                    <div key={step.id} className="flex gap-4 pb-6 last:pb-0">
                      {/* Line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.completed
                            ? 'bg-emerald-100 text-emerald-600'
                            : step.active
                              ? 'bg-indigo-100 text-indigo-600'
                              : 'rejected' in step && step.rejected
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-slate-100 text-slate-400'
                        }`}>
                          {step.completed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : 'rejected' in step && step.rejected ? (
                            <X className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-medium">{step.id}</span>
                          )}
                        </div>
                        {index < timelineSteps.length - 1 && (
                          <div className={`w-0.5 flex-1 mt-2 ${
                            step.completed ? 'bg-emerald-200' : 'bg-slate-200'
                          }`}></div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-2">
                        <p className={`font-medium ${
                          step.completed || step.active ? 'text-slate-900' : 'text-slate-500'
                        }`}>{step.label}</p>
                        <p className="text-sm text-slate-500">{step.description}</p>
                        {step.date && step.completed && (
                          <p className="text-xs text-slate-400 mt-1">{formatDate(step.date)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rejection reason */}
                {transaction.status === 'REJECTED' && transaction.rejectionReason && (
                  <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                    <p className="text-sm font-medium text-rose-800">سبب الرفض:</p>
                    <p className="text-sm text-rose-700 mt-1">{transaction.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Recipient Info */}
              {transaction.recipient && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">معلومات المستلم</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">الاسم</p>
                        <p className="text-sm font-medium text-slate-900">{transaction.recipient.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">الهاتف</p>
                        <p className="text-sm font-medium text-slate-900">{transaction.recipient.phone}</p>
                      </div>
                    </div>
                    {transaction.recipient.bankName && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Building className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">البنك</p>
                          <p className="text-sm font-medium text-slate-900">{transaction.recipient.bankName}</p>
                        </div>
                      </div>
                    )}
                    {transaction.recipient.accountNumber && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">رقم الحساب</p>
                          <p className="text-sm font-medium text-slate-900">{transaction.recipient.accountNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Actions & User Info */}
            <div className="space-y-6">
              {/* Actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">الإجراءات</h3>
                <div className="space-y-3">
                  {transaction.receiptUrl && (
                    <a
                      href={transaction.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> عرض الإيصال
                    </a>
                  )}

                  {transaction.status === 'UNDER_REVIEW' && (
                    <>
                      <button
                        onClick={() => handleAction('approve')}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> موافقة
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> رفض
                      </button>
                    </>
                  )}

                  {transaction.status === 'APPROVED' && (
                    <button
                      onClick={() => handleAction('complete')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> إكمال التحويل
                    </button>
                  )}

                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                    <Send className="w-4 h-4" /> إرسال إشعار للعميل
                  </button>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">معلومات العميل</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600">
                        {transaction.user.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{transaction.user.fullName}</p>
                      <p className="text-xs text-slate-500">عميل</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{transaction.user.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{transaction.user.phone}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/admin/users/${transaction.user.id}`)}
                    className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-2"
                  >
                    عرض ملف العميل ←
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="flex-1 px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (rejectReason.trim()) {
                    handleAction('reject', { rejectionReason: rejectReason });
                  }
                }}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 px-4 py-2.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetailsPage;
