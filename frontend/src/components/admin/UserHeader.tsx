'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone } from 'lucide-react';

interface UserHeaderProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    status: 'active' | 'blocked' | 'under_review';
    kycStatus: 'verified' | 'pending' | 'rejected' | null;
    tier: 'regular' | 'vip' | 'high_risk';
  };
}

const statusConfig = {
  active: { label: 'نشط', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  blocked: { label: 'محظور', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  under_review: { label: 'قيد المراجعة', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
};

const kycConfig = {
  verified: { label: 'موثق', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  pending: { label: 'قيد الانتظار', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  rejected: { label: 'مرفوض', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

const tierConfig = {
  regular: { label: 'عادي', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  vip: { label: 'VIP', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  high_risk: { label: 'عالي المخاطر', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

export const UserHeader: React.FC<UserHeaderProps> = ({ user }) => {
  const router = useRouter();
  const status = statusConfig[user.status];
  const kyc = kycConfig[user.kycStatus as keyof typeof kycConfig] || { label: 'لم يقدم', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  const tier = tierConfig[user.tier];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>

          <div>
            <p className="text-sm text-slate-500 mb-1">عرض ملف العميل</p>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">{user.fullName}</h1>

            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                <span dir="ltr">{user.phone}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
            {status.label}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${kyc.bg} ${kyc.text} ${kyc.border}`}>
            KYC: {kyc.label}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${tier.bg} ${tier.text} ${tier.border}`}>
            {tier.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserHeader;
