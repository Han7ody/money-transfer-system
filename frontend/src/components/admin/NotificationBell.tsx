'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/store/notifications';

interface NotificationBellProps {
  onClick: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const unreadCount = useNotificationStore((state) => state.getUnreadCount());

  return (
    <button
      onClick={onClick}
      className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
      aria-label="الإشعارات"
    >
      <Bell className="w-5 h-5 text-slate-600" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
