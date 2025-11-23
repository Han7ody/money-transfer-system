'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Bell, Receipt, ShieldCheck, Ban, Unlock } from 'lucide-react';

interface UserActionsProps {
  userId: string;
  isBlocked: boolean;
  onBlock: () => void;
  onUnblock: () => void;
  onSendNotification: () => void;
  onManageKYC: () => void;
}

export const UserActions: React.FC<UserActionsProps> = ({
  userId,
  isBlocked,
  onBlock,
  onUnblock,
  onSendNotification,
  onManageKYC
}) => {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => router.push(`/admin/users/${userId}/edit`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Edit3 className="w-4 h-4" /> تعديل البيانات
        </button>

        <button
          onClick={onSendNotification}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          <Bell className="w-4 h-4" /> إرسال إشعار
        </button>

        <button
          onClick={() => router.push(`/admin/transactions?userId=${userId}`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          <Receipt className="w-4 h-4" /> عرض التحويلات
        </button>

        <button
          onClick={onManageKYC}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          <ShieldCheck className="w-4 h-4" /> إدارة التحقق
        </button>

        <div className="flex-1"></div>

        {isBlocked ? (
          <button
            onClick={onUnblock}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
          >
            <Unlock className="w-4 h-4" /> رفع الحظر
          </button>
        ) : (
          <button
            onClick={onBlock}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors"
          >
            <Ban className="w-4 h-4" /> حظر الحساب
          </button>
        )}
      </div>
    </div>
  );
};

export default UserActions;
