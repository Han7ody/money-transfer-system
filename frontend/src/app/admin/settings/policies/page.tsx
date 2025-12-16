'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Save, AlertCircle, CheckCircle2, X, Eye } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Policy {
  id: number;
  type: string;
  title: string;
  content: string;
  version: string;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

const POLICY_TYPES = [
  { type: 'TERMS', label: 'شروط الاستخدام', icon: '📋' },
  { type: 'PRIVACY', label: 'سياسة الخصوصية', icon: '🔒' },
  { type: 'REFUND', label: 'سياسة الاسترجاع', icon: '↩️' }
];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Record<string, Policy>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('TERMS');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    version: '1.0',
    isPublished: false
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    const policy = policies[activeTab];
    if (policy) {
      setFormData({
        title: policy.title,
        content: policy.content,
        version: policy.version,
        isPublished: policy.isPublished
      });
    } else {
      const policyType = POLICY_TYPES.find(p => p.type === activeTab);
      setFormData({
        title: policyType?.label || '',
        content: '',
        version: '1.0',
        isPublished: false
      });
    }
  }, [activeTab, policies]);

  const fetchPolicies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/system/settings/policies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const policiesMap: Record<string, Policy> = {};
        data.data.forEach((policy: Policy) => {
          policiesMap[policy.type] = policy;
        });
        setPolicies(policiesMap);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/system/settings/policies/${activeTab}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'تم حفظ السياسة بنجاح' });
        fetchPolicies();
      } else {
        setMessage({ type: 'error', text: data.message || 'فشل في حفظ السياسة' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600 dark:text-slate-400">جاري التحميل...</div>
        </div>
      </AdminLayout>
    );
  }

  const currentPolicy = policies[activeTab];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة السياسات</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              إدارة شروط الاستخدام وسياسات الخصوصية
            </p>
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            معاينة
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="flex-1">{message.text}</p>
            <button onClick={() => setMessage(null)} className="flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex">
              {POLICY_TYPES.map((policyType) => (
                <button
                  key={policyType.type}
                  onClick={() => setActiveTab(policyType.type)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === policyType.type
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="mr-2">{policyType.icon}</span>
                  {policyType.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                العنوان
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                المحتوى (HTML)
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={20}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
                required
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                يمكنك استخدام HTML لتنسيق المحتوى
              </p>
            </div>

            {/* Version and Published */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  الإصدار
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-8">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  نشر السياسة (جعلها مرئية للمستخدمين)
                </label>
              </div>
            </div>

            {/* Info */}
            {currentPolicy && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">آخر تحديث:</span>
                    <span className="mr-2 text-slate-900 dark:text-white">
                      <span className="en-digits">{new Date(currentPolicy.updatedAt).toLocaleDateString('en-GB')} {new Date(currentPolicy.updatedAt).toLocaleTimeString('en-GB', { hour12: false })}</span>
                    </span>
                  </div>
                  {currentPolicy.publishedAt && (
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">تاريخ النشر:</span>
                      <span className="mr-2 text-slate-900 dark:text-white">
                        <span className="en-digits">{new Date(currentPolicy.publishedAt).toLocaleDateString('en-GB')} {new Date(currentPolicy.publishedAt).toLocaleTimeString('en-GB', { hour12: false })}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                معاينة: {formData.title}
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 max-h-[70vh] overflow-y-auto">
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
