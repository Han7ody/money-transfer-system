'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { UserHeader } from '@/components/admin/UserHeader';
import { UserActions } from '@/components/admin/UserActions';
import { UserStats } from '@/components/admin/UserStats';
import { UserKYCSection } from '@/components/admin/UserKYCSection';
import { UserTransactionsTable } from '@/components/admin/UserTransactionsTable';
import { UserAuditLog } from '@/components/admin/UserAuditLog';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'active' | 'blocked' | 'under_review';
  kycStatus: 'verified' | 'pending' | 'rejected' | 'not_submitted' | null;
  tier: 'regular' | 'vip' | 'high_risk';
  kycSubmittedAt?: string;
}

interface Stats {
  totalTransactions: number;
  totalAmount: number;
  lastTransactionDate: string | null;
  rejectionRatio: number;
  fraudRisk: 'low' | 'medium' | 'high';
}

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

interface AuditItem {
  id: string;
  action: string;
  type: 'user' | 'admin' | 'system';
  timestamp: string;
  details?: string;
}

interface Document {
  id: string;
  type: string;
  uploadDate: string;
  status?: 'approved' | 'pending' | 'rejected';
  url: string;
  rejectionReason?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const CustomerProfilePage = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLog, setAuditLog] = useState<AuditItem[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txSortField, setTxSortField] = useState('createdAt');
  const [txSortOrder, setTxSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await adminAPI.getUserById(userId);

      if (response.success) {
        const { user: userData, stats: userStats, auditLog: userAudit, kycDocuments } = response.data;

        setUser({
          id: userData.id.toString(),
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          status: userData.status,
          kycStatus: userData.kycStatus,
          tier: userData.tier,
          kycSubmittedAt: userData.kycSubmittedAt
        });

        setStats({
          totalTransactions: userStats.totalTransactions,
          totalAmount: Number(userStats.totalAmount),
          lastTransactionDate: userStats.lastTransactionDate,
          rejectionRatio: userStats.rejectionRatio,
          fraudRisk: userStats.fraudRisk
        });

        if (kycDocuments && kycDocuments.length > 0) {
          setDocuments(kycDocuments.map((doc: any) => {
            const imageUrl = doc.frontImageUrl || doc.backImageUrl || doc.url || '';
            return {
              id: doc.id,
              type: doc.type || doc.documentType,
              uploadDate: doc.uploadDate,
              status: doc.status || 'pending',
              url: imageUrl && !imageUrl.startsWith('http') ? `${API_URL.replace('/api', '')}${imageUrl}` : imageUrl,
              rejectionReason: doc.rejectionReason
            };
          }));
        }

        setAuditLog(userAudit || []);
      } else {
        setError(response.message || 'فشل تحميل بيانات المستخدم');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await adminAPI.getUserTransactions(userId, {
        page: txPage,
        limit: 10,
        sortField: txSortField,
        sortOrder: txSortOrder
      });

      if (response.success) {
        setTransactions(response.data.transactions);
        setTxTotalPages(response.data.pagination.totalPages);
      }
    } catch (err) {
      // Silent error handling for transactions
    }
  }, [userId, txPage, txSortField, txSortOrder]);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId, fetchUserData]);

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    }
  }, [userId, fetchTransactions]);

  const handleBlock = async () => {
    if (!user) return;
    if (window.confirm('هل أنت متأكد من حظر هذا المستخدم؟')) {
      try {
        const response = await adminAPI.toggleUserStatus(parseInt(userId), false);
        if (response.success) {
          setUser(prev => prev ? { ...prev, status: 'blocked' } : null);
          fetchUserData();
        } else {
          alert('فشل حظر المستخدم');
        }
      } catch {
        alert('فشل حظر المستخدم');
      }
    }
  };

  const handleUnblock = async () => {
    if (!user) return;
    if (window.confirm('هل أنت متأكد من رفع الحظر عن هذا المستخدم؟')) {
      try {
        const response = await adminAPI.toggleUserStatus(parseInt(userId), true);
        if (response.success) {
          setUser(prev => prev ? { ...prev, status: 'active' } : null);
          fetchUserData();
        } else {
          alert('فشل رفع الحظر');
        }
      } catch {
        alert('فشل رفع الحظر');
      }
    }
  };

  const handleSendNotification = () => {
    alert('سيتم فتح نافذة إرسال الإشعار');
  };

  const handleManageKYC = () => {
    document.getElementById('kyc-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSort = (field: string) => {
    if (txSortField === field) {
      setTxSortOrder(txSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setTxSortField(field);
      setTxSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">جاري التحميل...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !user || !stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <p className="text-slate-700 mb-4">{error || 'المستخدم غير موجود'}</p>
            <button
              onClick={() => router.push('/admin/users')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              العودة للمستخدمين
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <UserHeader user={user} />

        <UserActions
          userId={userId}
          isBlocked={user.status === 'blocked'}
          onBlock={handleBlock}
          onUnblock={handleUnblock}
          onSendNotification={handleSendNotification}
          onManageKYC={handleManageKYC}
        />

        <UserStats stats={stats} />

        <UserKYCSection
          userId={userId}
          kycStatus={user.kycStatus}
          documents={documents}
          fraudRisk={stats.fraudRisk}
          lastUpdated={user.kycSubmittedAt}
        />

        <UserTransactionsTable
          transactions={transactions}
          page={txPage}
          totalPages={txTotalPages}
          onPageChange={setTxPage}
          onSort={handleSort}
          sortField={txSortField}
          sortOrder={txSortOrder}
        />

        <UserAuditLog auditLog={auditLog} />
      </div>
    </AdminLayout>
  );
};

export default CustomerProfilePage;
