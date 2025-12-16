'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react';

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admin?: any;
  mode: 'create' | 'edit' | 'reset';
}

export default function AdminManagementModal({ isOpen, onClose, onSuccess, admin, mode }: AdminManagementModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'ADMIN',
    username: '',
    password: '',
    isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState<'username' | 'password' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin && mode === 'edit') {
      setFormData({
        fullName: admin.full_name || '',
        email: admin.email || '',
        phone: admin.phone || '',
        role: admin.role || 'ADMIN',
        username: admin.username || '',
        password: '',
        isActive: admin.is_active ?? true
      });
    }
  }, [admin, mode]);

  const generateCredentials = async (type: 'username' | 'password' | 'both') => {
    // Placeholder - will be connected to API
    const randomUsername = `admin_${Math.random().toString(36).substring(2, 8)}`;
    const randomPassword = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12).toUpperCase();
    
    if (type === 'username' || type === 'both') {
      setFormData(prev => ({ ...prev, username: randomUsername }));
    }
    if (type === 'password' || type === 'both') {
      setFormData(prev => ({ ...prev, password: randomPassword }));
    }
  };

  const copyToClipboard = async (text: string, type: 'username' | 'password') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Placeholder - will be connected to API
    setTimeout(() => {
      if (mode === 'create') {
        setCredentials({ username: formData.username, password: formData.password });
      }
      setLoading(false);
      if (mode !== 'create') {
        onSuccess();
        onClose();
      }
    }, 1000);
  };

  if (!isOpen) return null;

  if (credentials) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">تم إنشاء المشرف بنجاح</h2>
            <p className="text-slate-600">احفظ بيانات الدخول التالية</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <label className="text-xs font-medium text-slate-500 mb-2 block">اسم المستخدم</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-slate-900">{credentials.username}</code>
                <button
                  onClick={() => copyToClipboard(credentials.username, 'username')}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {copied === 'username' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <label className="text-xs font-medium text-slate-500 mb-2 block">كلمة المرور</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-slate-900">{credentials.password}</code>
                <button
                  onClick={() => copyToClipboard(credentials.password, 'password')}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {copied === 'password' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setCredentials(null);
              onSuccess();
              onClose();
            }}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {mode === 'create' && 'إضافة مشرف جديد'}
            {mode === 'edit' && 'تعديل المشرف'}
            {mode === 'reset' && 'إعادة تعيين كلمة المرور'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'reset' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  السبب (اختياري)
                </label>
                <textarea
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="اذكر سبب إعادة تعيين كلمة المرور..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  الاسم الكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="أدخل الاسم الكامل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  البريد الإلكتروني <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="example@domain.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="+966 5X XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  الدور <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="ADMIN">مشرف</option>
                  <option value="SUPER_ADMIN">مدير عام</option>
                  <option value="COMPLIANCE">مسؤول امتثال</option>
                  <option value="SUPPORT">دعم فني</option>
                </select>
              </div>

              {mode === 'create' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      اسم المستخدم <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="username"
                      />
                      <button
                        type="button"
                        onClick={() => generateCredentials('username')}
                        className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                        title="توليد تلقائي"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      كلمة المرور <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => generateCredentials('password')}
                        className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                        title="توليد تلقائي"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                  الحساب نشط
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري الحفظ...' : mode === 'create' ? 'إنشاء' : mode === 'edit' ? 'حفظ التغييرات' : 'إعادة تعيين'}
          </button>
        </div>
      </div>
    </div>
  );
}
