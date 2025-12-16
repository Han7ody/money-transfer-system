'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Edit3, Send, Search, ToggleLeft, ToggleRight, X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface EmailTemplate {
  id: number;
  name: string;
  displayName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  variables: string[];
  isActive: boolean;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [searchTerm, filterActive]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterActive !== null) params.append('isActive', String(filterActive));

      const response = await fetch(`http://localhost:5000/api/admin/system/settings/email-templates?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (template: EmailTemplate) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/system/settings/email-templates/${template.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEditingTemplate(data.data);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/system/settings/email-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: editingTemplate.displayName,
          subject: editingTemplate.subject,
          bodyHtml: editingTemplate.bodyHtml,
          bodyText: editingTemplate.bodyText,
          isActive: editingTemplate.isActive
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'تم حفظ القالب بنجاح' });
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        setMessage({ type: 'error', text: data.message || 'فشل في حفظ القالب' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail || !editingTemplate) return;

    setTesting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/system/settings/email-templates/${editingTemplate.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ testEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'تم إرسال رسالة الاختبار بنجاح' });
        setShowTestModal(false);
        setTestEmail('');
      } else {
        setMessage({ type: 'error', text: data.message || 'فشل في إرسال رسالة الاختبار' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setTesting(false);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">قوالب البريد الإلكتروني</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            إدارة قوالب الرسائل الإلكترونية
          </p>
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

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث في القوالب..."
              className="w-full pr-10 pl-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <select
            value={filterActive === null ? 'all' : String(filterActive)}
            onChange={(e) => setFilterActive(e.target.value === 'all' ? null : e.target.value === 'true')}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="all">الكل</option>
            <option value="true">مفعّل</option>
            <option value="false">غير مفعّل</option>
          </select>
        </div>

        {/* Templates Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    اسم القالب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    آخر تعديل
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      لا توجد قوالب
                    </td>
                  </tr>
                ) : (
                  templates.map((template) => (
                    <tr key={template.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {template.displayName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                          {template.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {template.isActive ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <ToggleRight className="w-5 h-5" />
                            <span className="text-sm">مفعّل</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400">
                            <ToggleLeft className="w-5 h-5" />
                            <span className="text-sm">غير مفعّل</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="en-digits">{new Date(template.updatedAt).toLocaleDateString('en-GB')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(template)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTemplate(template);
                              setShowTestModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTemplate && !showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                تعديل القالب: {editingTemplate.displayName}
              </h2>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  اسم القالب
                </label>
                <input
                  type="text"
                  value={editingTemplate.displayName}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, displayName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  عنوان الرسالة
                </label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Body HTML */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  محتوى الرسالة (HTML)
                </label>
                <textarea
                  value={editingTemplate.bodyHtml}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, bodyHtml: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
                />
              </div>

              {/* Variables */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  المتغيرات المتاحة:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {editingTemplate.variables.map((variable) => (
                    <span
                      key={variable}
                      className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-sm font-mono"
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingTemplate.isActive}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  تفعيل القالب
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => setShowTestModal(true)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  إرسال تجريبي
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                إرسال رسالة تجريبية
              </h2>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  البريد الإلكتروني للاختبار
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {testing ? 'جاري الإرسال...' : 'إرسال'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
