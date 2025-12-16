'use client';

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface RejectModalProps {
  onClose: () => void;
  onConfirm: (data: { rejectionCategory: string; rejectionReason: string; adminNotes?: string }) => void;
  loading: boolean;
}

export default function RejectModal({ onClose, onConfirm, loading }: RejectModalProps) {
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const categories = [
    { value: 'INCORRECT_DATA', label: 'بيانات غير صحيحة' },
    { value: 'KYC_INCOMPLETE', label: 'التوثيق غير مكتمل' },
    { value: 'FRAUD_SUSPECTED', label: 'اشتباه في احتيال' },
    { value: 'LIMIT_EXCEEDED', label: 'تجاوز الحد المسموح' },
    { value: 'INVALID_RECEIPT', label: 'إيصال غير صالح' },
    { value: 'DUPLICATE_TRANSACTION', label: 'معاملة مكررة' },
    { value: 'OTHER', label: 'أخرى' }
  ];

  const predefinedReasons: Record<string, string[]> = {
    INCORRECT_DATA: [
      'بيانات البنك غير صحيحة',
      'رقم الحساب غير صحيح',
      'معلومات المستلم غير مطابقة',
      'بيانات ناقصة'
    ],
    KYC_INCOMPLETE: [
      'لم يتم رفع وثائق التوثيق',
      'وثائق التوثيق منتهية الصلاحية',
      'وثائق التوثيق غير واضحة',
      'بحاجة لمستندات إضافية'
    ],
    FRAUD_SUSPECTED: [
      'نشاط مشبوه',
      'إيصال مزور',
      'معلومات متضاربة',
      'محاولة احتيال'
    ],
    LIMIT_EXCEEDED: [
      'تجاوز الحد اليومي',
      'تجاوز الحد الشهري',
      'تجاوز حد المعاملة الواحدة'
    ],
    INVALID_RECEIPT: [
      'الإيصال غير واضح',
      'الإيصال لا يطابق المبلغ',
      'الإيصال منتهي الصلاحية',
      'الإيصال مستخدم مسبقاً'
    ],
    DUPLICATE_TRANSACTION: [
      'معاملة مكررة',
      'تم معالجة هذا الإيصال مسبقاً'
    ],
    OTHER: []
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category && reason.trim()) {
      onConfirm({
        rejectionCategory: category,
        rejectionReason: reason,
        adminNotes: notes || undefined
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">رفض المعاملة</h3>
              <p className="text-sm text-slate-500">يرجى تحديد سبب الرفض</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              تصنيف سبب الرفض <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setReason(''); // Reset reason when category changes
              }}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              required
            >
              <option value="">اختر التصنيف</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Predefined Reasons */}
          {category && predefinedReasons[category]?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                أسباب شائعة (اختياري)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {predefinedReasons[category].map((predefinedReason) => (
                  <button
                    key={predefinedReason}
                    type="button"
                    onClick={() => setReason(predefinedReason)}
                    className={`px-4 py-2.5 text-sm text-right rounded-lg border transition-colors ${
                      reason === predefinedReason
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {predefinedReason}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              سبب الرفض التفصيلي <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="اكتب سبب الرفض بالتفصيل..."
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              سيتم إرسال هذا السبب للعميل عبر البريد الإلكتروني
            </p>
          </div>

          {/* Admin Notes (Internal) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ملاحظات داخلية (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="ملاحظات للفريق الإداري فقط (لن تظهر للعميل)..."
            />
          </div>

          {/* Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">تنبيه</p>
                <p>سيتم إرسال إشعار للعميل بسبب الرفض. تأكد من كتابة سبب واضح ومفهوم.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!category || !reason.trim() || loading}
              className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'جاري الرفض...' : 'تأكيد الرفض'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
