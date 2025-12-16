'use client';

import React, { useState, useEffect } from 'react';
import { FileText, User, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface AuditLogCardProps {
  transactionId: number;
}

interface AuditLog {
  id: number;
  action: string;
  adminName: string;
  timestamp: string;
  details?: string;
  oldValue?: any;
  newValue?: any;
}

export default function AuditLogCard({ transactionId }: AuditLogCardProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      try {
        const { adminAPI } = await import('@/lib/api');
        const response = await adminAPI.getAuditLogs({ transactionId });
        
        if (response.success && Array.isArray(response.data)) {
          setLogs(response.data);
        } else {
          setLogs([]);
        }
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [transactionId]);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      TRANSACTION_CREATED: 'إنشاء المعاملة',
      RECEIPT_UPLOADED: 'رفع الإيصال',
      STATUS_CHANGED: 'تغيير الحالة',
      APPROVED: 'الموافقة',
      REJECTED: 'الرفض',
      COMPLETED: 'الإكمال',
      AGENT_ASSIGNED: 'تعيين وكيل',
      PICKUP_VERIFIED: 'تأكيد الاستلام',
      NOTIFICATION_SENT: 'إرسال إشعار'
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'text-blue-600 bg-blue-50';
    if (action.includes('APPROVED') || action.includes('COMPLETED')) return 'text-emerald-600 bg-emerald-50';
    if (action.includes('REJECTED')) return 'text-rose-600 bg-rose-50';
    if (action.includes('ASSIGNED')) return 'text-purple-600 bg-purple-50';
    return 'text-slate-600 bg-slate-50';
  };

  const displayedLogs = expanded ? logs : (Array.isArray(logs) ? logs.slice(0, 3) : []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          سجل التدقيق
        </h3>
        <span className="text-xs text-slate-500">{Array.isArray(logs) ? logs.length : 0} إجراء</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : !Array.isArray(logs) || logs.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">لا توجد سجلات متاحة</p>
      ) : (
        <>
          <div className="space-y-3">
            {displayedLogs.map((log, index) => (
              <div
                key={log.id}
                className="pb-3 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getActionColor(log.action)}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 mb-0.5">
                      {getActionLabel(log.action)}
                    </p>
                    {log.details && (
                      <p className="text-xs text-slate-500 mb-1">{log.details}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.adminName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    
                    {/* Show value changes */}
                    {log.oldValue && log.newValue && (
                      <div className="mt-2 p-2 bg-slate-50 rounded text-xs">
                        <span className="text-rose-600">
                          {JSON.stringify(log.oldValue)}
                        </span>
                        {' → '}
                        <span className="text-emerald-600">
                          {JSON.stringify(log.newValue)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {Array.isArray(logs) && logs.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-1 transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  عرض أقل
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  عرض المزيد ({logs.length - 3})
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
