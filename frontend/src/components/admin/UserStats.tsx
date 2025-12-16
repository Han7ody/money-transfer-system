'use client';

import React from 'react';
import { Activity, DollarSign, Calendar, AlertTriangle, TrendingDown } from 'lucide-react';

interface UserStatsProps {
  stats: {
    totalTransactions: number;
    totalAmount: number;
    lastTransactionDate: string | null;
    rejectionRatio: number;
    fraudRisk: 'low' | 'medium' | 'high';
  };
}

const riskConfig = {
  low: { label: 'منخفض', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  medium: { label: 'متوسط', bg: 'bg-amber-100', text: 'text-amber-700' },
  high: { label: 'عالي', bg: 'bg-rose-100', text: 'text-rose-700' }
};

export const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  const risk = riskConfig[stats.fraudRisk];

  const formatDate = (date: string | null) => {
    if (!date) return 'لا يوجد';
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SDG',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">إحصائيات المستخدم</h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Transactions */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500">إجمالي المعاملات</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{stats.totalTransactions}</p>
        </div>

        {/* Total Amount */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500">إجمالي المبلغ</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.totalAmount)}</p>
        </div>

        {/* Last Transaction */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500">آخر معاملة</span>
          </div>
          <p className="text-sm font-medium text-slate-900">{formatDate(stats.lastTransactionDate)}</p>
        </div>

        {/* Rejection Ratio */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500">نسبة الرفض</span>
          </div>
          <p className={`text-xl font-bold ${stats.rejectionRatio > 30 ? 'text-rose-600' : 'text-slate-900'}`}>
            {stats.rejectionRatio}%
          </p>
        </div>

        {/* Fraud Risk */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500">مؤشر المخاطر</span>
          </div>
          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${risk.bg} ${risk.text}`}>
            {risk.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserStats;
