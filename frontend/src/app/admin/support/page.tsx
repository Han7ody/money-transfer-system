'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import { 
  MessageSquare, 
  Phone, 
  Filter, 
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  ExternalLink
} from 'lucide-react';

interface SupportRequest {
  id: number;
  customer_phone: string;
  customer_name: string;
  customer_full_name?: string;
  issue_category: string;
  issue_description: string;
  status: 'OPEN' | 'RESOLVED' | 'ESCALATED';
  priority: string;
  assigned_admin_name?: string;
  notes_count: number;
  created_at: string;
  updated_at: string;
}

export default function SupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    category: ''
  });
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);

      const response = await api.get(`/support?${params.toString()}`);
      setRequests(response.data.data.requests || []);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
      RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      ESCALATED: 'bg-rose-100 text-rose-700 border-rose-200'
    };
    const icons = {
      OPEN: <Clock className="w-4 h-4" />,
      RESOLVED: <CheckCircle className="w-4 h-4" />,
      ESCALATED: <AlertTriangle className="w-4 h-4" />
    };
    const labels = {
      OPEN: 'مفتوح',
      RESOLVED: 'تم الحل',
      ESCALATED: 'تم التصعيد'
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      GENERAL: 'عام',
      KYC: 'توثيق الهوية',
      TRANSACTION: 'معاملة',
      AGENT: 'وكيل',
      COMPLAINT: 'شكوى'
    };
    return labels[category] || category;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with WhatsApp CTA */}
        <div className="bg-gradient-to-l from-emerald-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-8 h-8" />
                <h1 className="text-3xl font-bold">الدعم الفني</h1>
              </div>
              <p className="text-emerald-100">إدارة طلبات الدعم والتواصل مع العملاء عبر واتساب</p>
            </div>
            <button
              onClick={() => openWhatsApp('917009172764')}
              className="flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-lg font-bold hover:bg-emerald-50 transition-colors shadow-lg"
            >
              <Phone className="w-5 h-5" />
              تواصل عبر واتساب
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">كل الحالات</option>
              <option value="OPEN">مفتوح</option>
              <option value="ESCALATED">تم التصعيد</option>
              <option value="RESOLVED">تم الحل</option>
            </select>

            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">كل الفئات</option>
              <option value="GENERAL">عام</option>
              <option value="KYC">توثيق الهوية</option>
              <option value="TRANSACTION">معاملة</option>
              <option value="AGENT">وكيل</option>
              <option value="COMPLAINT">شكوى</option>
            </select>
          </div>
        </div>

        {/* Support Requests Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <MessageSquare className="w-16 h-16 mb-3 text-slate-300" />
              <p>لا توجد طلبات دعم</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">رقم الطلب</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">العميل</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">الفئة</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">الوصف</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">الحالة</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">المسؤول</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        #{request.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {request.customer_name || request.customer_full_name || 'غير محدد'}
                            </div>
                            <div className="text-xs text-slate-500">{request.customer_phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getCategoryLabel(request.issue_category)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {request.issue_description || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {request.assigned_admin_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openWhatsApp(request.customer_phone)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                        >
                          <Phone className="w-4 h-4" />
                          رد عبر واتساب
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
