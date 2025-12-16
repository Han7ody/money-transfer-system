'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Shield, Plus, Trash2, AlertCircle, CheckCircle2, XCircle, X, Globe } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface WhitelistedIP {
  id: number;
  ip_address: string;
  description: string;
  created_at: string;
  is_active: boolean;
}

export default function IPWhitelistPage() {
  const [ips, setIps] = useState<WhitelistedIP[]>([]);
  const [currentIP, setCurrentIP] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWhitelistedIPs();
  }, []);

  const fetchWhitelistedIPs = async () => {
    try {
      const response = await api.get('/security/ip-whitelist');
      setIps(response.data.ips || []);
      setCurrentIP(response.data.currentIP || '');
      setIsEnabled(response.data.isEnabled || false);
    } catch (error) {
      console.error('Failed to fetch whitelisted IPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async () => {
    if (!newIP.trim()) {
      alert('يرجى إدخال عنوان IP');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/security/ip-whitelist', {
        ipAddress: newIP.trim(),
        description: newDescription.trim()
      });

      setShowAddModal(false);
      setNewIP('');
      setNewDescription('');
      fetchWhitelistedIPs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل في إضافة عنوان IP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveIP = async (ipAddress: string) => {
    if (!confirm(`هل أنت متأكد من إزالة ${ipAddress} من القائمة البيضاء؟`)) {
      return;
    }

    try {
      await api.delete(`/security/ip-whitelist/${ipAddress}`);
      fetchWhitelistedIPs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل في إزالة عنوان IP');
    }
  };

  const handleAddCurrentIP = () => {
    setNewIP(currentIP);
    setShowAddModal(true);
  };

  const activeCount = ips.filter(ip => ip.is_active).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">القائمة البيضاء لعناوين IP</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              تحكم في عناوين IP المسموح لها بالوصول إلى لوحة الإدارة
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة عنوان IP
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي العناوين</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{ips.length}</p>
              </div>
              <Shield className="w-10 h-10 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">العناوين النشطة</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">حالة القائمة</p>
                <p className={`text-2xl font-bold mt-1 ${isEnabled ? 'text-green-600' : 'text-slate-600'}`}>
                  {isEnabled ? 'مفعّلة' : 'معطّلة'}
                </p>
              </div>
              {isEnabled ? (
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-slate-400" />
              )}
            </div>
          </div>
        </div>

        {/* Current IP Alert */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">عنوان IP الحالي</h3>
              <p className="text-indigo-800 dark:text-indigo-200 font-mono text-lg mb-2">{currentIP}</p>
              <button
                onClick={handleAddCurrentIP}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline"
              >
                إضافة عنوان IP الحالي إلى القائمة البيضاء
              </button>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className={`rounded-xl border p-4 ${
          isEnabled 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-5 h-5 ${isEnabled ? 'text-green-600' : 'text-slate-500'}`} />
            <div>
              <h3 className={`font-semibold ${isEnabled ? 'text-green-900 dark:text-green-100' : 'text-slate-900 dark:text-white'}`}>
                {isEnabled ? 'القائمة البيضاء مفعّلة' : 'القائمة البيضاء معطّلة'}
              </h3>
              <p className={`text-sm mt-1 ${isEnabled ? 'text-green-700 dark:text-green-200' : 'text-slate-600 dark:text-slate-400'}`}>
                {isEnabled 
                  ? 'يُسمح فقط لعناوين IP المدرجة في القائمة بالوصول إلى لوحة الإدارة' 
                  : 'يُسمح لجميع عناوين IP بالوصول إلى لوحة الإدارة'}
              </p>
            </div>
          </div>
        </div>

        {/* IP List Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    عنوان IP
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    الوصف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    تاريخ الإضافة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : ips.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      لا توجد عناوين IP في القائمة البيضاء
                    </td>
                  </tr>
                ) : (
                  ips.map((ip) => (
                    <tr key={ip.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                            {ip.ip_address}
                          </span>
                          {ip.ip_address === currentIP && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                              عنوانك الحالي
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {ip.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="en-digits">{new Date(ip.created_at).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRemoveIP(ip.ip_address)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="إزالة"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add IP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                إضافة عنوان IP جديد
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewIP('');
                  setNewDescription('');
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  عنوان IP *
                </label>
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="مثال: 192.168.1.1"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  الوصف (اختياري)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="مثال: مكتب الرياض"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewIP('');
                  setNewDescription('');
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddIP}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'جاري الإضافة...' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
