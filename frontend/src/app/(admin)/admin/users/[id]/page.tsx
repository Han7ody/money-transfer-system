'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  LayoutDashboard, Users, DollarSign, LogOut, Menu, Bell, ChevronDown,
  Receipt, Settings, HelpCircle, AlertCircle
} from 'lucide-react';
import { adminAPI, authAPI } from '@/lib/api';
import { UserHeader } from '@/components/admin/UserHeader';
import { UserActions } from '@/components/admin/UserActions';
import { UserStats } from '@/components/admin/UserStats';
import { UserKYCSection } from '@/components/admin/UserKYCSection';
import { UserTransactionsTable } from '@/components/admin/UserTransactionsTable';
import { UserAuditLog } from '@/components/admin/UserAuditLog';

// Types
interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'active' | 'blocked' | 'under_review';
  kycStatus: 'verified' | 'pending' | 'rejected';
  tier: 'regular' | 'vip' | 'high_risk';
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
  type: 'id_card' | 'address_proof' | 'selfie';
  uploadDate: string;
  status: 'approved' | 'pending' | 'rejected';
  url: string;
  rejectionReason?: string;
}

// Mock KYC documents (KYC system not implemented yet)
const mockDocuments: Document[] = [
  {
    id: '1',
    type: 'id_card',
    uploadDate: '2024-01-16T10:00:00Z',
    status: 'approved',
    url: '/placeholder-id.png'
  },
  {
    id: '2',
    type: 'address_proof',
    uploadDate: '2024-01-16T10:30:00Z',
    status: 'pending',
    url: '/placeholder-address.png'
  },
  {
    id: '3',
    type: 'selfie',
    uploadDate: '2024-01-16T11:00:00Z',
    status: 'rejected',
    url: '/placeholder-selfie.png',
    rejectionReason: 'الصورة غير واضحة'
  }
];

const CustomerProfilePage = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLog, setAuditLog] = useState<AuditItem[]>([]);

  // Pagination & sorting for transactions
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txSortField, setTxSortField] = useState('createdAt');
  const [txSortOrder, setTxSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await adminAPI.getUserById(userId);

      if (response.success) {
        const { user: userData, stats: userStats, auditLog: userAudit } = response.data;

        setUser({
          id: userData.id.toString(),
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          status: userData.status,
          kycStatus: userData.kycStatus,
          tier: userData.tier
        });

        setStats({
          totalTransactions: userStats.totalTransactions,
          totalAmount: Number(userStats.totalAmount),
          lastTransactionDate: userStats.lastTransactionDate,
          rejectionRatio: userStats.rejectionRatio,
          fraudRisk: userStats.fraudRisk
        });

        setAuditLog(userAudit || []);
      } else {
        setError(response.message || 'فشل تحميل بيانات المستخدم');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch user transactions
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
      console.error('Error fetching transactions:', err);
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
          // Refresh audit log
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
          // Refresh audit log
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

  const handleApproveDoc = (docId: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === docId ? { ...doc, status: 'approved' as const } : doc
    ));
  };

  const handleRejectDoc = (docId: string, reason: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === docId ? { ...doc, status: 'rejected' as const, rejectionReason: reason } : doc
    ));
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !user || !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-slate-700 mb-4">{error || 'المستخدم غير موجود'}</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
          >
            العودة للمستخدمين
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed right-0 top-0 h-full bg-white border-l border-slate-200 transition-all z-40 ${showSidebar ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="p-5 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">راصد</h2>
              <p className="text-xs text-slate-500">لوحة التحكم</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <button onClick={() => router.push('/admin')} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">
              <LayoutDashboard className="w-4 h-4" /> الرئيسية
            </button>
            <button onClick={() => router.push('/admin/transactions')} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">
              <Receipt className="w-4 h-4" /> المعاملات
            </button>
            <button onClick={() => router.push('/admin/users')} className="w-full flex items-center gap-3 px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm">
              <Users className="w-4 h-4" /> المستخدمين
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">
              <Settings className="w-4 h-4" /> الإعدادات
            </button>
          </nav>

          <div className="pt-4 border-t border-slate-100 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">
              <HelpCircle className="w-4 h-4" /> المساعدة
            </button>
            <button onClick={() => { authAPI.logout(); router.push('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-lg text-sm">
              <LogOut className="w-4 h-4" /> تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${showSidebar ? 'mr-64' : 'mr-0'} transition-all min-h-screen`}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">م</span>
                </div>
                <span className="text-sm font-medium text-slate-700">المدير</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Header */}
          <UserHeader user={user} />

          {/* Actions Bar */}
          <UserActions
            userId={userId}
            isBlocked={user.status === 'blocked'}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
            onSendNotification={handleSendNotification}
            onManageKYC={handleManageKYC}
          />

          {/* Stats */}
          <UserStats stats={stats} />

          {/* KYC Documents */}
          <div id="kyc-section">
            <UserKYCSection
              documents={documents}
              onApprove={handleApproveDoc}
              onReject={handleRejectDoc}
            />
          </div>

          {/* Transactions Table */}
          <UserTransactionsTable
            transactions={transactions}
            page={txPage}
            totalPages={txTotalPages}
            onPageChange={setTxPage}
            onSort={handleSort}
            sortField={txSortField}
            sortOrder={txSortOrder}
          />

          {/* Audit Log */}
          <UserAuditLog auditLog={auditLog} />
        </div>
      </main>
    </div>
  );
};

export default CustomerProfilePage;
