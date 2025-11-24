'use client';

import React, { useState } from 'react';
import { FileText, Calendar, Eye, Check, X, ZoomIn } from 'lucide-react';

interface Document {
  id: string;
  type: 'id_front' | 'id_back' | 'selfie';
  uploadDate: string;
  status: 'approved' | 'pending' | 'rejected';
  url: string;
  rejectionReason?: string;
}

interface UserKYCSectionProps {
  documents: Document[];
  onApprove: (docId: string) => void;
  onReject: (docId: string, reason: string) => void;
}

const docTypeLabels: Record<string, string> = {
  id_front: 'الهوية (الأمام)',
  id_back: 'الهوية (الخلف)',
  selfie: 'صورة شخصية'
};

const statusConfig = {
  approved: { label: 'موافق عليها', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  pending: { label: 'قيد المراجعة', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  rejected: { label: 'مرفوضة', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

export const UserKYCSection: React.FC<UserKYCSectionProps> = ({
  documents,
  onApprove,
  onReject
}) => {
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [rejectDoc, setRejectDoc] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleReject = () => {
    if (rejectDoc && rejectReason.trim()) {
      onReject(rejectDoc.id, rejectReason);
      setRejectDoc(null);
      setRejectReason('');
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">وثائق التحقق (KYC)</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {documents.map(doc => {
            const status = statusConfig[doc.status];
            return (
              <div key={doc.id} className="border border-slate-200 rounded-lg overflow-hidden">
                {/* Document Preview */}
                <div className="aspect-video bg-slate-100 relative group">
                  <img
                    src={doc.url}
                    alt={docTypeLabels[doc.type]}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-doc.png';
                    }}
                  />
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <ZoomIn className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Document Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-900">
                        {docTypeLabels[doc.type]}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(doc.uploadDate)}</span>
                  </div>

                  {doc.rejectionReason && (
                    <p className="text-xs text-rose-600 mb-3">
                      سبب الرفض: {doc.rejectionReason}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-slate-600 border border-slate-200 rounded hover:bg-slate-50"
                    >
                      <Eye className="w-3 h-3" /> عرض
                    </button>
                    {doc.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onApprove(doc.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-emerald-600 border border-emerald-200 rounded hover:bg-emerald-50"
                        >
                          <Check className="w-3 h-3" /> قبول
                        </button>
                        <button
                          onClick={() => setRejectDoc(doc)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-rose-600 border border-rose-200 rounded hover:bg-rose-50"
                        >
                          <X className="w-3 h-3" /> رفض
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {documents.length === 0 && (
          <p className="text-center text-slate-500 py-8">لم يتم رفع أي وثائق بعد</p>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">{docTypeLabels[previewDoc.type]}</h4>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={previewDoc.url}
                alt={docTypeLabels[previewDoc.type]}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h4 className="text-lg font-semibold text-slate-900 mb-4">رفض الوثيقة</h4>
            <p className="text-sm text-slate-500 mb-4">
              يرجى إدخال سبب رفض وثيقة "{docTypeLabels[rejectDoc.type]}":
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              placeholder="مثال: الصورة غير واضحة..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectDoc(null); setRejectReason(''); }}
                className="flex-1 px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserKYCSection;
