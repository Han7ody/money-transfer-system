'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCheck, ExternalLink, AlertTriangle, Activity, Bell, Loader2 } from 'lucide-react';
import {
  useNotificationStore,
  formatRelativeTime,
  getCategoryIcon,
  Notification
} from '@/store/notifications';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}> = ({ notification, onMarkAsRead }) => {
  const router = useRouter();

  const handleClick = () => {
    onMarkAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        notification.isRead
          ? 'bg-white hover:bg-slate-50'
          : 'bg-indigo-50/50 hover:bg-indigo-50'
      }`}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">
        {getCategoryIcon(notification.category)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${notification.isRead ? 'text-slate-700' : 'font-medium text-slate-900'}`}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
          {notification.description}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          {formatRelativeTime(notification.timestamp)}
        </p>
      </div>
    </div>
  );
};

const NotificationGroup: React.FC<{
  title: string;
  icon: React.ReactNode;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  colorClass: string;
}> = ({ title, icon, notifications, onMarkAsRead, colorClass }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="mb-4">
      <div className={`flex items-center gap-2 px-3 py-2 ${colorClass} rounded-lg mb-2`}>
        {icon}
        <span className="text-xs font-medium">{title}</span>
        <span className="text-xs opacity-70">({notifications.length})</span>
      </div>
      <div className="space-y-1">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
          />
        ))}
      </div>
    </div>
  );
};

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  isOpen,
  onClose
}) => {
  const router = useRouter();
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    getGroupedNotifications,
    getUnreadCount
  } = useNotificationStore();

  // Fetch notifications when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const grouped = getGroupedNotifications();
  const unreadCount = getUnreadCount();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Popover */}
      <div className="absolute left-0 top-full mt-2 w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-600" />
            <h3 className="font-semibold text-slate-900">الإشعارات</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                {unreadCount} جديد
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-y-auto p-3">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">جاري التحميل...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl mb-3 block">🎉</span>
              <p className="text-sm text-slate-500">لا توجد إشعارات جديدة الآن.</p>
            </div>
          ) : (
            <>
              {/* High Priority */}
              <NotificationGroup
                title="تحتاج إجراء عاجل"
                icon={<AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                notifications={grouped.high}
                onMarkAsRead={markAsRead}
                colorClass="bg-rose-50 text-rose-700"
              />

              {/* Normal Activity */}
              <NotificationGroup
                title="نشاط عام"
                icon={<Activity className="w-3.5 h-3.5 text-emerald-600" />}
                notifications={grouped.normal}
                onMarkAsRead={markAsRead}
                colorClass="bg-emerald-50 text-emerald-700"
              />

              {/* System Alerts */}
              <NotificationGroup
                title="تنبيهات النظام"
                icon={<Bell className="w-3.5 h-3.5 text-amber-600" />}
                notifications={grouped.system}
                onMarkAsRead={markAsRead}
                colorClass="bg-amber-50 text-amber-700"
              />
            </>
          )}
        </div>

        {/* Footer Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              تحديد الكل كمقروء
            </button>
            <button
              onClick={() => {
                onClose();
                router.push('/admin/notifications');
              }}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              عرض جميع الإشعارات
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPopover;
