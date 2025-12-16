'use client';

import React from 'react';
import { CheckCircle, Clock, Eye, TrendingUp, MapPin, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface TransactionTimelineProps {
  transaction: {
    status: string;
    createdAt: string;
    receiptUploadedAt?: string;
    approvedAt?: string;
    completedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    rejectionCategory?: string;
    assignedAgent?: any;
    pickupVerifiedAt?: string;
  };
}

export default function TransactionTimeline({ transaction }: TransactionTimelineProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimelineSteps = () => {
    const steps = [
      {
        id: 1,
        label: 'تم إنشاء الطلب',
        description: 'تم تقديم طلب التحويل',
        date: transaction.createdAt,
        completed: true,
        active: transaction.status === 'PENDING',
        icon: CheckCircle
      },
      {
        id: 2,
        label: 'رفع الإيصال',
        description: 'تم رفع إيصال الدفع',
        date: transaction.receiptUploadedAt,
        completed: !!transaction.receiptUploadedAt || ['UNDER_REVIEW', 'APPROVED', 'READY_FOR_PICKUP', 'COMPLETED'].includes(transaction.status),
        active: transaction.status === 'PENDING' && !transaction.receiptUploadedAt,
        icon: Clock
      },
      {
        id: 3,
        label: 'قيد المراجعة',
        description: 'جاري مراجعة الإيصال والتحقق',
        date: transaction.receiptUploadedAt,
        completed: ['APPROVED', 'READY_FOR_PICKUP', 'COMPLETED'].includes(transaction.status),
        active: transaction.status === 'UNDER_REVIEW',
        icon: Eye
      },
      {
        id: 4,
        label: 'تمت الموافقة',
        description: 'تمت الموافقة على المعاملة',
        date: transaction.approvedAt,
        completed: ['READY_FOR_PICKUP', 'COMPLETED'].includes(transaction.status),
        active: transaction.status === 'APPROVED',
        icon: TrendingUp
      },
    ];

    // Add Ready for Pickup step if applicable
    if (transaction.assignedAgent) {
      steps.push({
        id: 5,
        label: 'جاهز للاستلام',
        description: 'تم تعيين وكيل وإرسال رمز الاستلام',
        date: transaction.approvedAt,
        completed: transaction.status === 'COMPLETED',
        active: transaction.status === 'READY_FOR_PICKUP',
        icon: MapPin
      });
    }

    // Final step
    steps.push({
      id: steps.length + 1,
      label: 'مكتمل',
      description: 'تم إكمال التحويل بنجاح',
      date: transaction.completedAt,
      completed: transaction.status === 'COMPLETED',
      active: false,
      icon: CheckCircle2
    });

    // If rejected, modify the timeline
    if (transaction.status === 'REJECTED') {
      return steps.map((step, index) => ({
        ...step,
        active: false,
        rejected: index === 2, // Mark review step as rejected
        completed: index < 2
      }));
    }

    return steps;
  };

  const steps = getTimelineSteps();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">مسار المعاملة</h3>
      
      <div className="relative">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isRejected = 'rejected' in step && step.rejected;
          
          return (
            <div key={step.id} className="flex gap-4 pb-6 last:pb-0">
              {/* Line */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                  step.completed
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                    : step.active
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-600 animate-pulse'
                      : isRejected
                        ? 'bg-rose-50 border-rose-500 text-rose-600'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {isRejected ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-2 min-h-[40px] ${
                    step.completed ? 'bg-emerald-200' : 'bg-slate-200'
                  }`}></div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-2">
                <p className={`font-semibold mb-1 ${
                  step.completed || step.active ? 'text-slate-900' : 'text-slate-500'
                }`}>
                  {step.label}
                </p>
                <p className="text-sm text-slate-500 mb-1">{step.description}</p>
                {step.date && (step.completed || step.active) && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(step.date)}
                  </p>
                )}
                
                {/* Active indicator */}
                {step.active && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>
                    قيد التنفيذ
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rejection reason */}
      {transaction.status === 'REJECTED' && transaction.rejectionReason && (
        <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-800 mb-1">سبب الرفض</p>
              {transaction.rejectionCategory && (
                <p className="text-xs text-rose-600 mb-2">
                  التصنيف: {transaction.rejectionCategory.replace(/_/g, ' ')}
                </p>
              )}
              <p className="text-sm text-rose-700">{transaction.rejectionReason}</p>
              {transaction.rejectedAt && (
                <p className="text-xs text-rose-500 mt-2">
                  تم الرفض في: {formatDate(transaction.rejectedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pickup verification info */}
      {transaction.pickupVerifiedAt && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800 mb-1">تم تأكيد الاستلام</p>
              <p className="text-xs text-emerald-600">
                تم التسليم للمستلم في: {formatDate(transaction.pickupVerifiedAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
