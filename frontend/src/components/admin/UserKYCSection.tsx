'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Shield, AlertCircle, CheckCircle, Clock, FileText, ExternalLink } from 'lucide-react';

interface Document {
  id: string;
  type: string;
  uploadDate: string;
  status?: 'approved' | 'pending' | 'rejected';
  url: string;
  rejectionReason?: string;
}

interface UserKYCSectionProps {
  userId: string;
  kycStatus: 'verified' | 'pending' | 'rejected' | 'not_submitted' | null;
  documents: Document[];
  fraudRisk?: 'low' | 'medium' | 'high';
  lastUpdated?: string;
}

export const UserKYCSection: React.FC<UserKYCSectionProps> = ({
  userId,
  kycStatus,
  documents,
  fraudRisk = 'low',
  lastUpdated
}) => {
  const router = useRouter();

  const getStatusConfig = () => {
    const configs = {
      verified: { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200',
        label: 'موثق', 
        icon: CheckCircle 
      },
      pending: { 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        border: 'border-amber-200',
        label: 'قيد المراجعة', 
        icon: Clock 
      },
      rejected: { 
        bg: 'bg-rose-50', 
        text: 'text-rose-700', 
        border: 'border-rose-200',
        label: 'مرفوض', 
        icon: AlertCircle 
      },
      not_submitted: { 
        bg: 'bg-slate-50', 
        text: 'text-slate-700', 
        border: 'border-slate-200',
        label: 'لم يُرسل', 
        icon: FileText 
      }
    };
    return configs[kycStatus || 'not_submitted'] || configs.not_submitted;
  };

  const getRiskBadge = () => {
    const badges = {
      low: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'مخاطر منخفضة' },
      medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'مخاطر متوسطة' },
      high: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'مخاطر عالية' }
    };
    return badges[fraudRisk];
  };

  const statusConfig = getStatusConfig();
  const riskBadge = getRiskBadge();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6" id="kyc-section">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">حالة التوثيق</h3>
            <p className="text-sm text-slate-500">KYC Status</p>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${statusConfig.bg} ${statusConfig.border}`}>
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={`w-4 h-4 ${statusConfig.text}`} />
            <span className="text-xs text-slate-600">حالة التوثيق</span>
          </div>
          <p className={`text-lg font-semibold ${statusConfig.text}`}>{statusConfig.label}</p>
        </div>

        <div className={`p-4 rounded-lg border ${riskBadge.bg} border-slate-200`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className={`w-4 h-4 ${riskBadge.text}`} />
            <span className="text-xs text-slate-600">مستوى المخاطر</span>
          </div>
          <p className={`text-lg font-semibold ${riskBadge.text}`}>{riskBadge.label}</p>
        </div>

        <div className="p-4 rounded-lg border bg-slate-50 border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-slate-600" />
            <span className="text-xs text-slate-600">عدد الوثائق</span>
          </div>
          <p className="text-lg font-semibold text-slate-900">{documents.length} ملف</p>
        </div>
      </div>

      {/* Document Thumbnails */}
      {documents.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 mb-3">الوثائق المرفوعة</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {documents.map((doc) => (
              <div key={doc.id} className="relative group">
                <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  {doc.url ? (
                    <img 
                      src={doc.url} 
                      alt={doc.type}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 text-center">{doc.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <p className="text-xs text-slate-500 mb-4">
          آخر تحديث: <span className="en-digits">{new Date(lastUpdated).toLocaleDateString('en-GB')}</span>
        </p>
      )}

      {/* Primary Action Button */}
      <button
        onClick={() => router.push(`/admin/kyc/review/${userId}`)}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm hover:shadow-md"
      >
        <Shield className="w-5 h-5" />
        <span>عرض صفحة مراجعة التحقق</span>
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
};

export default UserKYCSection;
