'use client';

import React from 'react';
import { MapPin, User, Phone, Hash, CheckCircle, Clock, AlertCircle, Copy } from 'lucide-react';

interface CashPickupCardProps {
  transaction: {
    pickupCity?: string;
    assignedAgent?: {
      id: number;
      fullName: string;
      phone: string;
      city: string;
    };
    pickupCode?: string;
    pickupVerifiedAt?: string;
    status: string;
  };
  onAssignAgent: () => void;
  onConfirmPickup?: () => void;
}

export default function CashPickupCard({ transaction, onAssignAgent, onConfirmPickup }: CashPickupCardProps) {
  const hasAgent = !!transaction.assignedAgent;
  const isVerified = !!transaction.pickupVerifiedAt;

  const copyPickupCode = () => {
    if (transaction.pickupCode) {
      navigator.clipboard.writeText(transaction.pickupCode);
      // TODO: Add toast notification
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-600" />
          استلام نقدي
        </h3>
        {isVerified ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            تم التسليم
          </span>
        ) : hasAgent ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            بانتظار التسليم
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            بحاجة لوكيل
          </span>
        )}
      </div>

      {/* Pickup City */}
      <div className="mb-4 p-4 bg-white rounded-lg">
        <p className="text-xs text-slate-500 mb-1">مدينة الاستلام</p>
        <p className="text-lg font-semibold text-slate-900">{transaction.pickupCity || 'غير محدد'}</p>
      </div>

      {/* Agent Info */}
      {hasAgent ? (
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-lg">
            <p className="text-xs text-slate-500 mb-3">الوكيل المعين</p>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{transaction.assignedAgent.fullName}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                  <Phone className="w-4 h-4" />
                  {transaction.assignedAgent.phone}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" />
                  {transaction.assignedAgent.city}
                </div>
              </div>
            </div>
          </div>

          {/* Pickup Code */}
          {transaction.pickupCode && (
            <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
              <p className="text-xs text-slate-500 mb-2">رمز الاستلام</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-purple-600 tracking-wider font-mono">
                  {transaction.pickupCode}
                </p>
                <button
                  onClick={copyPickupCode}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  نسخ
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                ⚠️ يجب على المستلم تقديم هذا الرمز للوكيل
              </p>
            </div>
          )}

          {/* Verification Status */}
          {isVerified && transaction.pickupVerifiedAt ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <p className="text-sm text-emerald-800">
                  تم التسليم في <span className="en-digits">{new Date(transaction.pickupVerifiedAt).toLocaleDateString('en-GB')} {new Date(transaction.pickupVerifiedAt).toLocaleTimeString('en-GB', { hour12: false })}</span>
                </p>
              </div>
            </div>
          ) : transaction.status === 'READY_FOR_PICKUP' && onConfirmPickup && (
            <button
              onClick={onConfirmPickup}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              تأكيد الاستلام
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 inline ml-1" />
              يجب تعيين وكيل لإكمال عملية الاستلام النقدي
            </p>
          </div>
          <button
            onClick={onAssignAgent}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            تعيين وكيل
          </button>
        </div>
      )}
    </div>
  );
}
