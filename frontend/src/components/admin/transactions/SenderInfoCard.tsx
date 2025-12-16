'use client';

import React from 'react';
import { Mail, Phone, Shield, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';

interface SenderInfoCardProps {
  sender: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    kycStatus?: string;
    totalTransactions?: number;
  };
}

export default function SenderInfoCard({ sender }: SenderInfoCardProps) {
  const getKycBadge = (status?: string) => {
    const badges: Record<string, { bg: string; text: string; label: string; icon: any }> = {
      APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'موثق', icon: CheckCircle },
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'قيد المراجعة', icon: Clock },
      REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'مرفوض', icon: XCircle },
      NOT_SUBMITTED: { bg: 'bg-slate-50', text: 'text-slate-700', label: 'غير مقدم', icon: Shield },
    };
    return badges[status || 'NOT_SUBMITTED'] || badges.NOT_SUBMITTED;
  };

  const kycBadge = getKycBadge(sender.kycStatus);
  const KycIcon = kycBadge.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">معلومات المرسل</h3>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${kycBadge.bg} ${kycBadge.text}`}>
          <KycIcon className="w-3.5 h-3.5" />
          {kycBadge.label}
        </span>
      </div>

      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-white">
            {sender.fullName.charAt(0)}
          </span>
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-slate-900 mb-1">{sender.fullName}</h4>
          <p className="text-sm text-slate-500">معرف العميل: #{sender.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">البريد الإلكتروني</p>
            <p className="text-sm font-medium text-slate-900 truncate">{sender.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-0.5">رقم الهاتف</p>
            <p className="text-sm font-medium text-slate-900">{sender.phone}</p>
          </div>
        </div>

        {sender.totalTransactions !== undefined && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-0.5">إجمالي المعاملات</p>
              <p className="text-sm font-medium text-slate-900">{sender.totalTransactions} معاملة</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-0.5">حالة التوثيق</p>
            <p className="text-sm font-medium text-slate-900">{kycBadge.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
