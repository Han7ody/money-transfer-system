'use client';

import React from 'react';
import { X, Calendar, User, Globe, Monitor, Database } from 'lucide-react';
import { AuditLog } from '@/types/audit';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLog | null;
}

export function AuditLogDrawer({ isOpen, onClose, log }: AuditLogDrawerProps) {
  if (!isOpen || !log) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatJSON = (value: any) => {
    if (!value) return 'لا توجد بيانات';
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed left-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
        dir="rtl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">تفاصيل السجل</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Metadata Section */}
          <div className="bg-slate-50 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-slate-900 mb-3">معلومات العملية</h3>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">التاريخ والوقت</p>
                <p className="text-sm text-slate-600">{formatDate(log.createdAt)}</p>
              </div>
            </div>

            {log.admin && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">المسؤول</p>
                  <p className="text-sm text-slate-900 font-medium">{log.admin.fullName}</p>
                  <p className="text-sm text-slate-600">{log.admin.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">الكيان</p>
                <p className="text-sm text-slate-600">
                  {log.entity}
                  {log.entityId && (
                    <span className="ml-2 px-2 py-0.5 bg-slate-200 rounded text-xs font-mono">
                      #{log.entityId}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {log.ipAddress && (
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">عنوان IP</p>
                  <p className="text-sm text-slate-600 font-mono">{log.ipAddress}</p>
                </div>
              </div>
            )}

            {log.userAgent && (
              <div className="flex items-start gap-3">
                <Monitor className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">المتصفح</p>
                  <p className="text-sm text-slate-600 break-all">{log.userAgent}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Details */}
          <div className="bg-indigo-50 rounded-xl p-5">
            <h3 className="font-semibold text-indigo-900 mb-2">نوع العملية</h3>
            <p className="text-lg font-bold text-indigo-700">{log.action}</p>
          </div>

          {/* Old Value Section */}
          {log.oldValue && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">القيمة السابقة</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                <pre className="p-4 text-xs font-mono text-red-900 overflow-x-auto whitespace-pre-wrap break-words">
                  {formatJSON(log.oldValue)}
                </pre>
              </div>
            </div>
          )}

          {/* New Value Section */}
          {log.newValue && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">القيمة الجديدة</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden">
                <pre className="p-4 text-xs font-mono text-green-900 overflow-x-auto whitespace-pre-wrap break-words">
                  {formatJSON(log.newValue)}
                </pre>
              </div>
            </div>
          )}

          {/* ID */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              معرف السجل: <span className="font-mono">{log.id}</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
