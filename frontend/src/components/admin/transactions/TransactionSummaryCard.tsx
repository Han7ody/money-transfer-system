'use client';

import React from 'react';
import { ArrowRight, DollarSign, TrendingUp, Calendar } from 'lucide-react';

interface TransactionSummaryCardProps {
  transaction: {
    amountSent: number;
    amountReceived: number;
    exchangeRate: number;
    adminFee: number;
    fromCurrency: { code: string; name: string };
    toCurrency: { code: string; name: string };
    createdAt: string;
  };
}

export default function TransactionSummaryCard({ transaction }: TransactionSummaryCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount) + ' ' + currency;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">ملخص المعاملة</h3>

      {/* Amount Flow */}
      <div className="flex items-center justify-between p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl mb-6">
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-2">المبلغ المرسل</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(transaction.amountSent, transaction.fromCurrency.code)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{transaction.fromCurrency.name}</p>
        </div>

        <div className="flex items-center gap-2 px-4">
          <ArrowRight className="w-5 h-5 text-slate-400" />
          <div className="text-center">
            <p className="text-xs text-slate-500">سعر الصرف</p>
            <p className="text-sm font-semibold text-indigo-600">{transaction.exchangeRate}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400" />
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-500 mb-2">المبلغ المستلم</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(transaction.amountReceived, transaction.toCurrency.code)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{transaction.toCurrency.code}</p>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-500">رسوم الإدارة</p>
          </div>
          <p className="text-lg font-semibold text-slate-900">
            {transaction.adminFee}%
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-500">سعر الصرف</p>
          </div>
          <p className="text-lg font-semibold text-slate-900">
            {transaction.exchangeRate}
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-500">تاريخ الإنشاء</p>
          </div>
          <p className="text-sm font-semibold text-slate-900 en-digits">
            {new Date(transaction.createdAt).toLocaleDateString('en-GB', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
