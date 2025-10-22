'use client';

import React, { useState, useEffect } from 'react';
import { authAPI, transactionAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Define types for our data to make the component type-safe
interface User {
  fullName: string;
  role: string;
}

interface Transaction {
  id: number;
  transactionRef: string;
  recipientName: string;
  amountSent: number;
  fromCurrency: { code: string };
  amountReceived: number;
  toCurrency: { code: string };
  status: string;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  completed: number;
}

const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'UNDER_REVIEW': 'bg-blue-100 text-blue-800',
    'APPROVED': 'bg-green-100 text-green-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'REJECTED': 'bg-red-100 text-red-800',
    'CANCELLED': 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Check for token, redirect if not found
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Load user info and transactions in parallel
        const [userData, txData] = await Promise.all([
          authAPI.getCurrentUser(),
          transactionAPI.getAll()
        ]);

        if (userData.success) {
          setUser(userData.data);
        } else {
          throw new Error('Failed to fetch user data');
        }

        if (txData.success) {
          setTransactions(txData.data.transactions);
          updateStats(txData.data.transactions);
        } else {
          throw new Error('Failed to fetch transactions');
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
        if (err.response?.status === 401) {
            authAPI.logout(); // Redirect to login if unauthorized
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const updateStats = (transactions: Transaction[]) => {
    setStats({
      total: transactions.length,
      pending: transactions.filter(tx => tx.status === 'PENDING' || tx.status === 'UNDER_REVIEW').length,
      completed: transactions.filter(tx => tx.status === 'COMPLETED').length,
    });
  };

  const handleLogout = () => {
    authAPI.logout();
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">Money Transfer</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">{user?.fullName}</span>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-700 font-medium">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage your money transfers</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Transactions</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Pending</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Completed</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <a href="/new-transfer" className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            New Transfer
          </a>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.length > 0 ? (
                  transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{tx.transactionRef}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{tx.recipientName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {tx.amountSent} {tx.fromCurrency.code} → {parseFloat(tx.amountReceived.toString()).toFixed(2)} {tx.toCurrency.code}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm">
                        <a href={`/transaction-details?id=${tx.id}`} className="text-indigo-600 hover:text-indigo-700">View</a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No transactions yet. Create your first transfer!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}