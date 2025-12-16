'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Clock, DollarSign, User, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface PendingApproval {
  id: number;
  transactionRef: string;
  senderName: string;
  amountSent: number;
  fromCurrency: string;
  toCurrency: string;
  status: string;
  createdAt: string;
  firstApprover?: string;
}

export default function PendingApprovalsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      // Fetch transactions that are UNDER_REVIEW and high value
      const response = await api.get('/transactions?status=UNDER_REVIEW');
      const highValueTxs = response.data.transactions.filter(
        (tx: any) => Number(tx.amountSent) >= 5000
      );
      setTransactions(highValueTxs);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pending Second Approvals</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            High-value transactions awaiting second approval
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Maker-Checker Workflow</h3>
              <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                Transactions ≥ $5,000 require approval from two different admins for security.
              </p>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Sender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No transactions pending second approval
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{tx.transactionRef}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-900 dark:text-white">{tx.senderName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-slate-900 dark:text-white">
                            <span className="en-digits">{Number(tx.amountSent).toLocaleString('en-US')}</span> {tx.fromCurrency}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-amber-700 dark:text-amber-300">
                            Pending 2nd Approval
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="en-digits">{new Date(tx.createdAt).toLocaleDateString('en-GB')}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => router.push(`/admin/transactions/${tx.id}`)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
