'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Receipt, Settings, HelpCircle,
  DollarSign, Menu, Shield
} from 'lucide-react';
import { authAPI } from '@/lib/api';
import { NotificationBell } from '@/components/admin/NotificationBell';
import { NotificationPopover } from '@/components/admin/NotificationPopover';
import { UserMenu } from '@/components/admin/UserMenu';

// Navigation items
const navItems = [
  { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/admin/transactions', label: 'المعاملات', icon: Receipt },
  { href: '/admin/users', label: 'المستخدمين', icon: Users },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

// Page titles mapping
const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/admin': { title: 'لوحة التحكم', subtitle: 'مرحباً بك في نظام راصد' },
  '/admin/transactions': { title: 'إدارة المعاملات', subtitle: 'عرض وإدارة جميع التحويلات' },
  '/admin/users': { title: 'إدارة المستخدمين', subtitle: 'عرض وإدارة حسابات المستخدمين' },
  '/admin/settings': { title: 'إعدادات النظام', subtitle: 'تكوين إعدادات المنصة' },
  '/admin/settings/exchange-rates': { title: 'أسعار الصرف', subtitle: 'إدارة أسعار صرف العملات' },
  '/admin/settings/logs': { title: 'سجل التغييرات', subtitle: 'عرض سجل عمليات التعديل' },
  '/admin/settings/general': { title: 'الإعدادات العامة', subtitle: 'تكوين الإعدادات العامة' },
  '/admin/settings/notifications': { title: 'إعدادات الإشعارات', subtitle: 'تكوين إعدادات الإشعارات' },
  '/admin/settings/smtp': { title: 'إعدادات البريد', subtitle: 'تكوين SMTP والبريد الإلكتروني' },
  '/admin/settings/policies': { title: 'السياسات', subtitle: 'إدارة سياسات المنصة' },
};

// RBAC Permissions
type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'VIEWER';

const rolePermissions: Record<Role, { routes: string[]; canWrite: boolean }> = {
  SUPER_ADMIN: {
    routes: ['*'], // Full access
    canWrite: true
  },
  ADMIN: {
    routes: ['/admin', '/admin/transactions', '/admin/users'],
    canWrite: true
  },
  SUPPORT: {
    routes: ['/admin', '/admin/transactions', '/admin/users'],
    canWrite: false
  },
  VIEWER: {
    routes: ['/admin', '/admin/transactions', '/admin/users'],
    canWrite: false
  }
};

const checkRouteAccess = (pathname: string, role: Role): boolean => {
  const permissions = rolePermissions[role];
  if (permissions.routes.includes('*')) return true;

  // Check if route or parent route is allowed
  return permissions.routes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userRole, setUserRole] = useState<Role>('ADMIN');

  // Get current page info
  const currentPage = pageTitles[pathname] || { title: 'لوحة التحكم', subtitle: '' };

  // Check if nav item is active
  const isNavActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  // Check route access on pathname change
  useEffect(() => {
    // Get user role from localStorage or API
    const storedRole = localStorage.getItem('userRole') as Role;
    if (storedRole) {
      setUserRole(storedRole);
    }

    // Check access
    if (!checkRouteAccess(pathname, userRole)) {
      router.push('/admin?error=unauthorized');
    }
  }, [pathname, userRole, router]);

  // Handle unauthorized error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'unauthorized') {
      // You can show a toast here
      console.warn('ليس لديك صلاحية للوصول إلى هذه الصفحة.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed right-0 top-0 h-full bg-white border-l border-slate-200 transition-all z-40 ${showSidebar ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="p-5 h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">راصد</h2>
              <p className="text-xs text-slate-500">لوحة التحكم</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.href);

              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-100 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">
              <HelpCircle className="w-4 h-4" /> المساعدة
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${showSidebar ? 'mr-64' : 'mr-0'} transition-all min-h-screen`}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{currentPage.title}</h1>
                <p className="text-sm text-slate-500">{currentPage.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <NotificationBell onClick={() => setShowNotifications(!showNotifications)} />
                <NotificationPopover
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                />
              </div>

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
