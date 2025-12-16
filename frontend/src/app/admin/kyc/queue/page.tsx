'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';

interface KycUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city?: string;
  kycSubmittedAt: string;
  kycStatus: string;
  fraudScore: number;
  hoursSinceSubmission: number;
  kycDocuments: any[];
}

export default function KycQueuePage() {
  const router = useRouter();
  const [users, setUsers] = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    country: '',
    search: '',
    status: 'PENDING'
  });
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, escalated: 0 });

  useEffect(() => {
    fetchQueue();
    fetchStats();
  }, [filters]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && users.length > 0 && !loading) {
        router.push(`/admin/kyc/review/${users[0].id}`);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [users, loading, router]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.country) params.append('country', filters.country);
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/admin/kyc/queue?${params.toString()}`);
      const queueData = response.data?.data || response.data;
      setUsers(queueData?.users || []);
    } catch (error) {
      console.error('Failed to fetch KYC queue:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/kyc/stats');
      const statsData = response.data?.data || response.data;
      setStats(statsData || { pending: 0, approved: 0, rejected: 0, escalated: 0 });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({ pending: 0, approved: 0, rejected: 0, escalated: 0 });
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">مخاطر عالية</span>;
    if (score >= 50) return <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700">مخاطر متوسطة</span>;
    return <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">مخاطر منخفضة</span>;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactElement> = {
      PENDING: <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">قيد المراجعة</span>,
      APPROVED: <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">معتمد</span>,
      REJECTED: <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">مرفوض</span>,
      NOT_SUBMITTED: <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">لم يُرسل</span>
    };
    return badges[status] || badges.PENDING;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">مراجعة وثائق التحقق</h1>
          <p className="text-slate-600 mt-2">مراجعة واعتماد وثائق هوية المستخدمين</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-5 border border-blue-200">
            <div className="text-sm text-blue-700 font-medium mb-1">معروضة للمراجعة</div>
            <div className="text-3xl font-bold text-blue-600">{stats.pending}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-5 border border-green-200">
            <div className="text-sm text-green-700 font-medium mb-1">تمت الموافقة</div>
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm p-5 border border-red-200">
            <div className="text-sm text-red-700 font-medium mb-1">مرفوضة</div>
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm p-5 border border-orange-200">
            <div className="text-sm text-orange-700 font-medium mb-1">محالة للتحقيق</div>
            <div className="text-3xl font-bold text-orange-600">{stats.escalated}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">البحث</label>
              <input
                type="text"
                placeholder="الاسم، البريد الإلكتروني، أو رقم الهاتف..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الدولة</label>
              <select
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">جميع الدول</option>
                <option value="Sudan">السودان</option>
                <option value="Egypt">مصر</option>
                <option value="Saudi Arabia">السعودية</option>
                <option value="UAE">الإمارات</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">حالة الطلب</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="PENDING">قيد المراجعة</option>
                <option value="APPROVED">معتمد</option>
                <option value="REJECTED">مرفوض</option>
                <option value="NOT_SUBMITTED">لم يُرسل</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-slate-600">جاري التحميل...</p>
            </div>
          ) : !users || users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">✓</div>
              <p className="text-xl font-bold text-slate-700">لا توجد طلبات قيد المراجعة</p>
              <p className="text-slate-500 mt-2">جميع الطلبات تمت مراجعتها</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-l from-indigo-50 to-indigo-100">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-indigo-900">اسم المستخدم</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-indigo-900">المدينة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-indigo-900">تاريخ الإرسال</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-indigo-900">مستوى المخاطر</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-indigo-900">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-indigo-900">عدد الملفات</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-indigo-900">الإجراء</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-indigo-50 transition-colors cursor-pointer ${
                      index === 0 && filters.status === 'PENDING' ? 'bg-indigo-50 border-r-4 border-indigo-500' : ''
                    }`}
                    onClick={() => router.push(`/admin/kyc/review/${user.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{user.fullName}</div>
                          <div className="text-xs text-slate-600">{user.email}</div>
                          <div className="text-xs text-slate-500">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.city || user.country}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{formatDate(user.kycSubmittedAt)}</div>
                      <div className="text-xs text-slate-500">منذ {Math.floor(user.hoursSinceSubmission)} ساعة</div>
                    </td>
                    <td className="px-6 py-4">{getRiskBadge(user.fraudScore)}</td>
                    <td className="px-6 py-4">{getStatusBadge(user.kycStatus)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{user.kycDocuments.length} ملف</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/kyc/review/${user.id}`);
                        }}
                        className="px-6 py-2 bg-gradient-to-l from-indigo-600 to-indigo-700 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg"
                      >
                        مراجعة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {users.length > 0 && filters.status === 'PENDING' && (
          <div className="text-center text-sm text-slate-600">
            <p>اضغط <kbd className="px-2 py-1 bg-slate-200 rounded font-mono">Enter</kbd> لفتح أول طلب</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
