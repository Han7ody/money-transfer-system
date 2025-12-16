'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, ExternalLink, Check, X, Send, User, Phone, Mail,
  CreditCard, Building, Calendar, Copy, ArrowRight, MapPin,
  Clock, CheckCircle2, AlertCircle, FileText, Hash, Banknote,
  Users as UsersIcon, Shield, TrendingUp, Eye, Download, Printer
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { Breadcrumb } from '@/components/ui';

// Import new components (we'll create these)
import AdminLayout from '@/components/admin/AdminLayout';
import SenderInfoCard from '@/components/admin/transactions/SenderInfoCard';
import TransactionSummaryCard from '@/components/admin/transactions/TransactionSummaryCard';
import ReceiverInfoCard from '@/components/admin/transactions/ReceiverInfoCard';
import CashPickupCard from '@/components/admin/transactions/CashPickupCard';
import QuickActionsPanel from '@/components/admin/transactions/QuickActionsPanel';
import TransactionTimeline from '@/components/admin/transactions/TransactionTimeline';
import AuditLogCard from '@/components/admin/transactions/AuditLogCard';
import RejectModal from '@/components/admin/transactions/RejectModal';
import AssignAgentModal from '@/components/admin/transactions/AssignAgentModal';
import ConfirmPickupModal from '@/components/admin/transactions/ConfirmPickupModal';
import WhatsAppEscalationButton from '@/components/admin/WhatsAppEscalationButton';
import DebugPanel from '@/components/admin/DebugPanel';

// Types
interface Transaction {
  id: number;
  transactionRef: string;
  status: string;
  amountSent: number;
  amountReceived: number;
  exchangeRate: number;
  adminFee: number;
  fromCurrency: { code: string; name: string };
  toCurrency: { code: string; name: string };
  payoutMethod: string;
  payoutCurrency: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    kycStatus: string;
    totalTransactions: number;
  };
  receiptUrl?: string;
  receiptUploadedAt?: string;
  approvedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  rejectionCategory?: string;
  receiverDetails?: any;
  recipientName?: string;
  recipientPhone?: string;
  recipientBankName?: string;
  recipientAccountNumber?: string;
  recipientIfscCode?: string;
  recipientBranch?: string;
  pickupCity?: string;
  assignedAgent?: {
    id: number;
    fullName: string;
    phone: string;
    city: string;
  };
  assignedAgentId?: number;
  pickupCode?: string;
  pickupVerifiedAt?: string;
  adminNotes?: string;
}

const TransactionDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAssignAgentModal, setShowAssignAgentModal] = useState(false);
  const [showConfirmPickupModal, setShowConfirmPickupModal] = useState(false);
  
  // Success message
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleAction = async (action: string, data: any = {}) => {
    if (!transaction) return;

    try {
      setActionLoading(true);
      let response;
      
      switch (action) {
        case 'approve':
          response = await adminAPI.approveTransaction(transaction.id, data);
          setSuccessMessage('تمت الموافقة على المعاملة بنجاح');
          break;
        case 'reject':
          response = await adminAPI.rejectTransaction(transaction.id, data);
          setSuccessMessage('تم رفض المعاملة');
          break;
        case 'complete':
          response = await adminAPI.completeTransaction(transaction.id, data);
          setSuccessMessage('تم إكمال المعاملة بنجاح');
          break;
        case 'assignAgent':
          response = await adminAPI.assignAgent(transaction.id, data.agentId);
          setSuccessMessage('تم تعيين الوكيل بنجاح');
          break;
        case 'confirmPickup':
          response = await adminAPI.confirmPickup(transaction.id, data.pickupCode);
          setSuccessMessage('تم تأكيد الاستلام بنجاح');
          break;
        default:
          return;
      }
      
      if (response?.success) {
        await fetchTransaction();
        setShowRejectModal(false);
        setShowAssignAgentModal(false);
        setShowConfirmPickupModal(false);
      }
    } catch (err: any) {
      console.error('Action error:', err);
      alert(err.response?.data?.message || 'حدث خطأ أثناء تنفيذ العملية');
    } finally {
      setActionLoading(false);
    }
  };

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { text: string; bg: string; label: string; icon: any }> = {
      PENDING: { 
        text: 'text-orange-700', 
        bg: 'bg-orange-50 border-orange-200', 
        label: 'بانتظار الإيصال',
        icon: Clock
      },
      UNDER_REVIEW: { 
        text: 'text-amber-700', 
        bg: 'bg-amber-50 border-amber-200', 
        label: 'قيد المراجعة',
        icon: Eye
      },
      APPROVED: { 
        text: 'text-blue-700', 
        bg: 'bg-blue-50 border-blue-200', 
        label: 'جاري المعالجة',
        icon: TrendingUp
      },
      READY_FOR_PICKUP: { 
        text: 'text-purple-700', 
        bg: 'bg-purple-50 border-purple-200', 
        label: 'جاهز للاستلام',
        icon: MapPin
      },
      COMPLETED: { 
        text: 'text-emerald-700', 
        bg: 'bg-emerald-50 border-emerald-200', 
        label: 'مكتملة',
        icon: CheckCircle2
      },
      REJECTED: { 
        text: 'text-rose-700', 
        bg: 'bg-rose-50 border-rose-200', 
        label: 'مرفوضة',
        icon: X
      }
    };
    return configs[status] || configs.PENDING;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">جاري تحميل تفاصيل المعاملة...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !transaction) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">خطأ في تحميل المعاملة</h2>
            <p className="text-slate-600 mb-6">{error || 'المعاملة غير موجودة'}</p>
            <button
              onClick={() => router.push('/admin/transactions')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              العودة للمعاملات
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statusConfig = getStatusConfig(transaction.status);
  const StatusIcon = statusConfig.icon;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push('/admin/transactions')}
            className="text-slate-500 hover:text-indigo-600 transition-colors"
          >
            المعاملات
          </button>
          <ArrowRight className="w-4 h-4 text-slate-300 rotate-180" />
          <span className="text-slate-900 font-medium">{transaction.transactionRef}</span>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{transaction.transactionRef}</h1>
                <button
                  onClick={() => copyToClipboard(transaction.transactionRef)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  title="نسخ رقم المعاملة"
                >
                  <Copy className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>تم الإنشاء: <span className="en-digits">{new Date(transaction.createdAt).toLocaleDateString('en-GB')}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(transaction.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <WhatsAppEscalationButton
                entityType="TRANSACTION"
                entityId={transaction.id}
                entityData={transaction}
              />
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon className="w-4 h-4" />
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Transaction Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sender Info */}
            <SenderInfoCard sender={transaction.user} />

            {/* Transaction Summary */}
            <TransactionSummaryCard transaction={transaction} />

            {/* Receiver Info */}
            <ReceiverInfoCard
              receiver={{
                fullName: transaction.recipientName,
                phone: transaction.recipientPhone,
                bankName: transaction.recipientBankName,
                accountNumber: transaction.recipientAccountNumber,
                ifscCode: transaction.recipientIfscCode,
                branch: transaction.recipientBranch,
                pickupCity: transaction.pickupCity,
                ...transaction.receiverDetails
              }}
              payoutMethod={transaction.payoutMethod || 'BANK_TRANSFER'}
              payoutCurrency={transaction.toCurrency?.code || ''}
            />

            {/* Cash Pickup Section */}
            {transaction.payoutMethod === 'CASH_PICKUP' && (
              <CashPickupCard
                transaction={transaction}
                onAssignAgent={() => setShowAssignAgentModal(true)}
                onConfirmPickup={() => setShowConfirmPickupModal(true)}
              />
            )}

            {/* Timeline */}
            <TransactionTimeline transaction={transaction} />
          </div>

          {/* Right Column - Actions & Logs */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActionsPanel
              transaction={transaction}
              onAction={handleAction}
              onReject={() => setShowRejectModal(true)}
              onAssignAgent={() => setShowAssignAgentModal(true)}
              onConfirmPickup={() => setShowConfirmPickupModal(true)}
              loading={actionLoading}
            />

            {/* Audit Log */}
            <AuditLogCard transactionId={transaction.id} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRejectModal && (
        <RejectModal
          onClose={() => setShowRejectModal(false)}
          onConfirm={(data: any) => handleAction('reject', data)}
          loading={actionLoading}
        />
      )}

      {showAssignAgentModal && transaction.pickupCity && (
        <AssignAgentModal
          pickupCity={transaction.pickupCity}
          transactionAmount={transaction.amountReceived}
          onClose={() => setShowAssignAgentModal(false)}
          onAssign={(agentId: number) => handleAction('assignAgent', { agentId })}
          loading={actionLoading}
        />
      )}

      {showConfirmPickupModal && (
        <ConfirmPickupModal
          transaction={transaction}
          onClose={() => setShowConfirmPickupModal(false)}
          onConfirm={(pickupCode: string) => handleAction('confirmPickup', { pickupCode })}
          loading={actionLoading}
        />
      )}
    </AdminLayout>
  );
};

export default TransactionDetailsPage;
