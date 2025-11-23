'use client';

import React from 'react';
import {
  UserPlus, Upload, FileX, Ban, FileCheck, RefreshCw, CheckCircle,
  AlertCircle, Send, Shield
} from 'lucide-react';

interface AuditItem {
  id: string;
  action: string;
  type: 'user' | 'admin' | 'system';
  timestamp: string;
  details?: string;
}

interface UserAuditLogProps {
  auditLog: AuditItem[];
}

const actionIcons: Record<string, React.ElementType> = {
  'account_created': UserPlus,
  'receipt_uploaded': Upload,
  'document_rejected': FileX,
  'document_approved': FileCheck,
  'user_blocked': Ban,
  'user_unblocked': CheckCircle,
  'kyc_submitted': Shield,
  'notification_sent': Send,
  'profile_updated': RefreshCw,
  'default': AlertCircle
};

const typeConfig = {
  user: { bg: 'bg-blue-100', text: 'text-blue-600' },
  admin: { bg: 'bg-violet-100', text: 'text-violet-600' },
  system: { bg: 'bg-slate-100', text: 'text-slate-600' }
};

export const UserAuditLog: React.FC<UserAuditLogProps> = ({ auditLog }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIcon = (action: string) => {
    const iconKey = Object.keys(actionIcons).find(key => action.toLowerCase().includes(key));
    return actionIcons[iconKey || 'default'];
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">سجل النشاط</h3>

      {auditLog.length === 0 ? (
        <p className="text-center text-slate-500 py-8">لا يوجد نشاط مسجل</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-0 bottom-0 right-4 w-0.5 bg-slate-200"></div>

          {/* Timeline items */}
          <div className="space-y-6">
            {auditLog.map((item, index) => {
              const Icon = getIcon(item.action);
              const type = typeConfig[item.type];

              return (
                <div key={item.id} className="flex gap-4 relative">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${type.bg}`}>
                    <Icon className={`w-4 h-4 ${type.text}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <p className="text-sm text-slate-900">{item.action}</p>
                    {item.details && (
                      <p className="text-xs text-slate-500 mt-1">{item.details}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{formatTimestamp(item.timestamp)}</p>
                  </div>

                  {/* Type badge */}
                  <span className={`text-xs px-2 py-0.5 rounded h-fit ${type.bg} ${type.text}`}>
                    {item.type === 'user' ? 'مستخدم' : item.type === 'admin' ? 'مدير' : 'نظام'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAuditLog;
