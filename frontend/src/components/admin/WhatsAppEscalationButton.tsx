'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import api from '@/lib/api';

interface WhatsAppEscalationButtonProps {
  entityType: 'TRANSACTION' | 'KYC' | 'USER';
  entityId: number;
  entityData: any;
}

export default function WhatsAppEscalationButton({ 
  entityType, 
  entityId, 
  entityData 
}: WhatsAppEscalationButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [loading, setLoading] = useState(false);

  const generateWhatsAppMessage = () => {
    const baseUrl = window.location.origin;
    
    const messages = {
      TRANSACTION: `🚨 تصعيد معاملة - ${priority}

رقم المعاملة: ${entityData.transactionRef || entityId}
المبلغ: ${entityData.amountSent || 'N/A'} ${entityData.fromCurrency?.code || ''}
الحالة: ${entityData.status || 'N/A'}

السبب: ${reason}

الرابط: ${baseUrl}/admin/transactions/${entityId}`,

      KYC: `🚨 تصعيد توثيق هوية - ${priority}

المستخدم: ${entityData.fullName || 'N/A'}
البريد: ${entityData.email || 'N/A'}
الهاتف: ${entityData.phone || 'N/A'}

السبب: ${reason}

الرابط: ${baseUrl}/admin/kyc/review/${entityId}`,

      USER: `🚨 تصعيد مستخدم - ${priority}

المستخدم: ${entityData.fullName || 'N/A'}
البريد: ${entityData.email || 'N/A'}
الهاتف: ${entityData.phone || 'N/A'}

السبب: ${reason}

الرابط: ${baseUrl}/admin/users/${entityId}`
    };

    return messages[entityType];
  };

  const handleEscalate = async () => {
    if (!reason.trim()) {
      alert('يرجى إدخال سبب التصعيد');
      return;
    }

    try {
      setLoading(true);

      // Log escalation in audit logs
      await api.post('/admin/support/escalate', {
        entityType,
        entityId,
        reason,
        priority
      });

      // Generate WhatsApp message
      const message = generateWhatsAppMessage();
      const whatsappNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '+249912345678';
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

      // Open WhatsApp Web
      window.open(whatsappUrl, '_blank');

      alert('تم تسجيل التصعيد وفتح WhatsApp');
      setShowModal(false);
      setReason('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل تسجيل التصعيد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm transition-all"
        title="Escalate via WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
        تصعيد عبر WhatsApp
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  تصعيد عبر WhatsApp
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  الأولوية
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="LOW">منخفض</option>
                  <option value="MEDIUM">متوسط</option>
                  <option value="HIGH">عالي</option>
                  <option value="URGENT">عاجل</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  سبب التصعيد <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="اكتب سبب التصعيد..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-800">
                  سيتم فتح WhatsApp Web مع رسالة جاهزة للإرسال إلى فريق الدعم
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleEscalate}
                  disabled={loading || !reason.trim()}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'جاري التصعيد...' : 'تصعيد'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
