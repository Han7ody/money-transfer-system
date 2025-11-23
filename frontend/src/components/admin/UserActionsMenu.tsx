'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoreVertical, User, Edit3, History, Send, Ban, CheckCircle
} from 'lucide-react';

interface UserActionsMenuProps {
  userId: string;
  isBlocked: boolean;
  onToggleBlock: (userId: string, block: boolean) => void;
}

export const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  userId,
  isBlocked,
  onToggleBlock
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
          <button
            onClick={() => {
              router.push(`/admin/users/${userId}`);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <User className="w-4 h-4" /> عرض الملف الشخصي
          </button>

          <button
            onClick={() => {
              router.push(`/admin/users/${userId}/edit`);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Edit3 className="w-4 h-4" /> تعديل المستخدم
          </button>

          <button
            onClick={() => {
              router.push(`/admin/users/${userId}/transactions`);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <History className="w-4 h-4" /> سجل المعاملات
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Send className="w-4 h-4" /> إرسال إشعار
          </button>

          <div className="border-t border-slate-100 my-1"></div>

          {isBlocked ? (
            <button
              onClick={() => {
                onToggleBlock(userId, false);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
            >
              <CheckCircle className="w-4 h-4" /> إلغاء الحظر
            </button>
          ) : (
            <button
              onClick={() => {
                onToggleBlock(userId, true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
            >
              <Ban className="w-4 h-4" /> حظر المستخدم
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserActionsMenu;
