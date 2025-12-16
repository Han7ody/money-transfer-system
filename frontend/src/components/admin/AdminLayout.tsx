'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Menu, DollarSign, ChevronDown } from 'lucide-react';
import { UserMenu } from '@/components/admin/UserMenu';
import { authAPI } from '@/lib/api';
import { adminMenuItems } from './sidebar/menuConfig';
import SessionTimeoutModal from './SessionTimeoutModal';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Multi-section accordion state - allows multiple sections to be open
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    '/admin/compliance': true,
    '/admin/settings': true,
    '/admin/system': false
  });

  // Load from localStorage after mount to avoid hydration mismatch
  React.useEffect(() => {
    const saved = localStorage.getItem('sidebar-expanded-menus');
    if (saved) {
      try {
        setExpandedMenus(JSON.parse(saved));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const isActive = (href: string, hasChildren?: boolean) => {
    // Exact match for dashboard
    if (href === '/admin') return pathname === href;
    
    // KYC routes - handle both /admin/kyc and deprecated /admin/users/kyc
    if (href === '/admin/kyc') {
      return pathname?.startsWith('/admin/kyc') || pathname?.startsWith('/admin/users/kyc');
    }
    
    // Users route - exclude KYC routes
    if (href === '/admin/users') {
      return pathname?.startsWith('/admin/users') && !pathname?.startsWith('/admin/users/kyc');
    }
    
    // Settings - include security routes
    if (href === '/admin/settings') {
      return pathname?.startsWith('/admin/settings') || pathname?.startsWith('/admin/security');
    }
    
    // System routes
    if (href === '/admin/system') {
      return pathname?.startsWith('/admin/system');
    }
    
    // For parent items with children, check if any child is active
    if (hasChildren) {
      return pathname?.startsWith(href);
    }
    
    // Default: check if pathname starts with href
    return pathname?.startsWith(href);
  };

  const toggleSubmenu = (href: string) => {
    setExpandedMenus(prev => {
      const newState = {
        ...prev,
        [href]: !prev[href]
      };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-expanded-menus', JSON.stringify(newState));
      }
      return newState;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 h-full bg-white border-l border-slate-200 transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <h2 className="font-bold text-slate-900">راصد</h2>
                  <p className="text-xs text-slate-500">لوحة التحكم</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const active = isActive(item.href, hasChildren);
              const isExpanded = expandedMenus[item.href] || false;
              
              return (
                <div key={item.href}>
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        toggleSubmenu(item.href);
                        // Don't navigate for parent items with children
                      } else {
                        router.push(item.href);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium before:absolute before:right-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:bg-indigo-600 before:rounded-l'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-right">{item.name}</span>
                        {hasChildren && (
                          <ChevronDown 
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        )}
                      </>
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {hasChildren && isExpanded && sidebarOpen && (
                    <div className="mr-4 mt-1 space-y-1">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(child.href, false);
                        
                        return (
                          <button
                            key={child.href}
                            onClick={() => router.push(child.href)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                              childActive
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <ChildIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{child.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-slate-100 space-y-1">
            <button
              onClick={() => {
                authAPI.logout();
                router.push('/login');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-sm transition-all duration-200"
              title={!sidebarOpen ? 'تسجيل الخروج' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>تسجيل الخروج</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`${sidebarOpen ? 'mr-64' : 'mr-20'} transition-all duration-300`}>
        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Left: Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            {/* Right: Profile */}
            <div className="flex items-center gap-3">
              {/* User Menu with Dark Mode */}
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Session Timeout Modal */}
      <SessionTimeoutModal />
    </div>
  );
}
