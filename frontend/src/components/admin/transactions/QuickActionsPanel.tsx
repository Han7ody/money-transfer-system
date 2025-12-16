'use client';

import React from 'react';
import { Check, X, Send, ExternalLink, Download, Printer, UserPlus, CheckCircle } from 'lucide-react';

interface QuickActionsPanelProps {
  transaction: any;
  onAction: (action: string, data?: any) => void;
  onReject: () => void;
  onAssignAgent: () => void;
  onConfirmPickup?: () => void;
  loading: boolean;
}

export default function QuickActionsPanel({ 
  transaction, 
  onAction, 
  onReject, 
  onAssignAgent,
  onConfirmPickup,
  loading 
}: QuickActionsPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">إجراءات سريعة</h3>
      
      <div className="space-y-3">
        {/* View Receipt */}
        {transaction.receiptUrl && (
          <a
            href={transaction.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            عرض الإيصال
          </a>
        )}

        {/* Status-specific actions */}
        {transaction.status === 'UNDER_REVIEW' && (
          <>
            <button
              onClick={() => onAction('approve')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              {loading ? 'جاري الموافقة...' : 'موافقة'}
            </button>
            <button
              onClick={onReject}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              رفض
            </button>
          </>
        )}

        {/* Assign Agent for Cash Pickup */}
        {transaction.payoutMethod === 'CASH_PICKUP' && 
         transaction.status === 'APPROVED' && 
         !transaction.assignedAgent && (
          <button
            onClick={onAssignAgent}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-4 h-4" />
            تعيين وكيل
          </button>
        )}

        {/* Complete Transaction (for non-cash pickup) */}
        {transaction.status === 'APPROVED' && 
         transaction.payoutMethod !== 'CASH_PICKUP' && (
          <button
            onClick={() => onAction('complete')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            {loading ? 'جاري الإكمال...' : 'إكمال التحويل'}
          </button>
        )}

        {/* Confirm Pickup - For READY_FOR_PICKUP status */}
        {transaction.status === 'READY_FOR_PICKUP' && 
         !transaction.pickupVerifiedAt && 
         onConfirmPickup && (
          <button
            onClick={onConfirmPickup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            {loading ? 'جاري التأكيد...' : 'تأكيد الاستلام'}
          </button>
        )}

        {/* Ready for Pickup - Complete after verification */}
        {transaction.status === 'READY_FOR_PICKUP' && 
         transaction.pickupVerifiedAt && (
          <button
            onClick={() => onAction('complete')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            {loading ? 'جاري الإكمال...' : 'إكمال المعاملة'}
          </button>
        )}

        {/* Divider */}
        {(transaction.status === 'UNDER_REVIEW' || 
          transaction.status === 'APPROVED' || 
          transaction.status === 'READY_FOR_PICKUP') && (
          <div className="border-t border-slate-200 my-2"></div>
        )}

        {/* Send Notification */}
        <button
          onClick={() => onAction('sendNotification')}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          إرسال إشعار للعميل
        </button>

        {/* Download Receipt */}
        {transaction.receiptUrl && (
          <a
            href={transaction.receiptUrl}
            download
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            تحميل الإيصال
          </a>
        )}

        {/* Print */}
        <button
          onClick={() => window.print()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          طباعة
        </button>
      </div>

      {/* Status Info */}
      {transaction.status === 'READY_FOR_PICKUP' && !transaction.pickupVerifiedAt && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            ⏳ بانتظار تأكيد الوكيل للتسليم
          </p>
        </div>
      )}
    </div>
  );
}
