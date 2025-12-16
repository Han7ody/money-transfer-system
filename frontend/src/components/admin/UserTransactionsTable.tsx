'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface Transaction {
  id: string;
  transactionRef: string;
  amountSent: number;
  amountReceived: number;
  fromCurrency: string;
  toCurrency: string;
  status: string;
  createdAt: string;
}

interface UserTransactionsTableProps {
  transactions: Transaction[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSort: (field: string) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PENDING: { label: 'بانتظار الإيصال', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  UNDER_REVIEW: { label: 'قيد المراجعة', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  APPROVED: { label: 'جاري المعالجة', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  COMPLETED: { label: 'مكتملة', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REJECTED: { label: 'مرفوضة', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

export const UserTransactionsTable: React.FC<UserTransactionsTableProps> = ({
  transactions,
  page,
  totalPages,
  onPageChange,
  onSort,
  sortField,
  sortOrder
}) => {
  const router = useRouter();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString('en-US')} ${currency}`;
  };

  const SortButton = ({ field, label }: { field: string; label: string }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-700"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-indigo-600' : ''}`} />
    </button>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">سجل المعاملات</h3>
      </div>

      <div className="overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">لا توجد معاملات</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-right px-6 py-3">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">المعاملة</span>
                </th>
                <th className="text-right px-6 py-3">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">المبلغ المرسل</span>
                </th>
                <th className="text-right px-6 py-3">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">المبلغ المستلم</span>
                </th>
                <th className="text-right px-6 py-3">
                  <SortButton field="status" label="الحالة" />
                </th>
                <th className="text-right px-6 py-3">
                  <SortButton field="createdAt" label="التاريخ" />
                </th>
                <th className="text-right px-6 py-3">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">الإجراء</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map(tx => {
                const status = statusConfig[tx.status] || statusConfig.PENDING;
                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-900">{tx.transactionRef}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {formatCurrency(tx.amountSent, tx.fromCurrency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">
                        {formatCurrency(tx.amountReceived, tx.toCurrency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{formatDate(tx.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/admin/transactions/${tx.id}`)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
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
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">صفحة {page} من {totalPages}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTransactionsTable;
