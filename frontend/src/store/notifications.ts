import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminAPI } from '@/lib/api';

export type NotificationCategory =
  | 'pending_transaction'
  | 'pending_receipt'
  | 'pending_kyc'
  | 'completed_transfer'
  | 'verified_user'
  | 'support_message'
  | 'failed_login'
  | 'exchange_rate'
  | 'system_warning';

export type NotificationPriority = 'high' | 'normal' | 'system';

export interface Notification {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
  getGroupedNotifications: () => {
    high: Notification[];
    normal: Notification[];
    system: Notification[];
  };
}

// Mock seed data
const seedNotifications: Notification[] = [
  {
    id: '1',
    category: 'pending_transaction',
    priority: 'high',
    title: 'معاملة جديدة بانتظار الموافقة',
    description: 'تحويل بقيمة 5,000 ج.س من أحمد محمد',
    timestamp: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
    isRead: false,
    link: '/admin/transactions'
  },
  {
    id: '2',
    category: 'pending_receipt',
    priority: 'high',
    title: 'إيصال جديد بانتظار المراجعة',
    description: 'تم رفع إيصال للمعاملة #TXN-2024-001',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    isRead: false,
    link: '/admin/transactions'
  },
  {
    id: '3',
    category: 'pending_kyc',
    priority: 'high',
    title: 'طلب KYC جديد',
    description: 'مستخدم جديد ينتظر التحقق من الهوية',
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    isRead: false,
    link: '/admin/users'
  },
  {
    id: '4',
    category: 'completed_transfer',
    priority: 'normal',
    title: 'تحويل مكتمل',
    description: 'تم إتمام التحويل #TXN-2024-002 بنجاح',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    isRead: false,
    link: '/admin/transactions'
  },
  {
    id: '5',
    category: 'verified_user',
    priority: 'normal',
    title: 'مستخدم جديد موثق',
    description: 'تم التحقق من حساب سارة أحمد',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    isRead: true,
    link: '/admin/users'
  },
  {
    id: '6',
    category: 'support_message',
    priority: 'normal',
    title: 'رسالة دعم جديدة',
    description: 'استفسار من العميل حول رسوم التحويل',
    timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    isRead: false
  },
  {
    id: '7',
    category: 'exchange_rate',
    priority: 'system',
    title: 'تحديث سعر الصرف',
    description: 'تم تحديث سعر USD/SDG إلى 601.5',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: true,
    link: '/admin/settings/exchange-rates'
  },
  {
    id: '8',
    category: 'failed_login',
    priority: 'system',
    title: 'محاولة تسجيل دخول فاشلة',
    description: '3 محاولات فاشلة من IP: 192.168.1.100',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    isRead: false
  },
  {
    id: '9',
    category: 'system_warning',
    priority: 'system',
    title: 'تحذير النظام',
    description: 'استخدام الذاكرة وصل إلى 85%',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    isRead: true
  }
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isLoading: false,

      fetchNotifications: async () => {
        try {
          set({ isLoading: true });
          const response = await adminAPI.getAdminNotifications();
          if (response.success) {
            const notifications = response.data.map((n: any) => ({
              ...n,
              timestamp: new Date(n.timestamp)
            }));
            set({ notifications, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
          set({ isLoading: false });
        }
      },

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date(),
          isRead: false
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications]
        }));
      },

      markAsRead: async (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          )
        }));
        try {
          await adminAPI.markNotificationAsRead(id);
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      },

      markAllAsRead: async () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
        }));
        try {
          await adminAPI.markAllNotificationsAsRead();
        } catch (error) {
          console.error('Failed to mark all notifications as read:', error);
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length;
      },

      getGroupedNotifications: () => {
        const notifications = get().notifications;
        return {
          high: notifications.filter((n) => n.priority === 'high'),
          normal: notifications.filter((n) => n.priority === 'normal'),
          system: notifications.filter((n) => n.priority === 'system')
        };
      }
    }),
    {
      name: 'admin-notifications',
      partialize: (state) => ({
        notifications: state.notifications.map(n => ({
          ...n,
          timestamp: n.timestamp instanceof Date ? n.timestamp.toISOString() : n.timestamp
        }))
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.notifications = state.notifications.map(n => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
        }
      }
    }
  )
);

// Helper function to format relative time in Arabic
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;

  return date.toLocaleDateString('ar-SA');
};

// Get icon for notification category
export const getCategoryIcon = (category: NotificationCategory): string => {
  const icons: Record<NotificationCategory, string> = {
    pending_transaction: '💰',
    pending_receipt: '🧾',
    pending_kyc: '🪪',
    completed_transfer: '✅',
    verified_user: '👤',
    support_message: '💬',
    failed_login: '🔐',
    exchange_rate: '📊',
    system_warning: '⚠️'
  };
  return icons[category];
};
