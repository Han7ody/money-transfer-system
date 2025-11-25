'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  User,
  Lock,
  Shield,
  Moon,
  Sun,
  Globe,
  LogOut,
  Clock
} from 'lucide-react';
import { authAPI, adminAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface UserMenuProps {
  adminName?: string;
  adminEmail?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  adminName: propAdminName,
  adminEmail: propAdminEmail
}) => {
  const router = useRouter();
  const { role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [lastLogin, setLastLogin] = useState<string>('');
  const [adminName, setAdminName] = useState(propAdminName || 'المدير');
  const [adminEmail, setAdminEmail] = useState(propAdminEmail || 'admin@rasid.com');

  useEffect(() => {
    // Fetch admin profile from backend
    const fetchAdminProfile = async () => {
      try {
        const response = await adminAPI.getAdminProfile();
        if (response.success) {
          setAdminName(response.data.fullName);
          setAdminEmail(response.data.email);
          if (response.data.lastLoginAt) {
            setLastLogin(new Date(response.data.lastLoginAt).toLocaleString('ar-SA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin profile:', error);
      }
    };

    fetchAdminProfile();

    // Fallback for last login
    if (!lastLogin) {
      const storedLastLogin = localStorage.getItem('admin_last_login');
      if (storedLastLogin) {
        setLastLogin(storedLastLogin);
      } else {
        const now = new Date().toLocaleString('ar-SA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        setLastLogin(now);
        localStorage.setItem('admin_last_login', now);
      }
    }

    // Check dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    // In production, you'd trigger i18n language change here
  };

  const handleLogout = () => {
    authAPI.logout();
    localStorage.removeItem('admin_last_login');
    router.push('/login');
  };

  // Define all menu items with role requirements
  const allMenuItems = [
    {
      icon: <User className="w-4 h-4" />,
      label: 'الملف الشخصي',
      onClick: () => router.push('/admin/profile'),
      roles: ['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'VIEWER']
    },
    {
      icon: <Lock className="w-4 h-4" />,
      label: 'تغيير كلمة المرور',
      onClick: () => router.push('/admin/security/password'),
      roles: ['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'VIEWER']
    },
    {
      icon: <Shield className="w-4 h-4" />,
      label: 'إعدادات الأمان',
      onClick: () => router.push('/admin/security'),
      roles: ['SUPER_ADMIN'] // Only super admins can access security settings
    },
    { type: 'divider' },
    {
      icon: isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      label: isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن',
      onClick: toggleDarkMode,
      hasToggle: true,
      roles: ['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'VIEWER']
    },
    {
      icon: <Globe className="w-4 h-4" />,
      label: language === 'ar' ? 'English' : 'العربية',
      onClick: toggleLanguage,
      roles: ['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'VIEWER']
    },
    { type: 'divider' },
    {
      icon: <LogOut className="w-4 h-4" />,
      label: 'تسجيل الخروج',
      onClick: handleLogout,
      danger: true,
      roles: ['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'VIEWER']
    }
  ];

  // Filter menu items based on current user role
  const menuItems = allMenuItems.filter(item => {
    if (item.type === 'divider') return true;
    return role && item.roles?.includes(role);
  });

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-white">
            {adminName.charAt(0)}
          </span>
        </div>
        <span className="text-sm font-medium text-slate-700 hidden sm:block">
          {adminName}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
            {/* User Info Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <p className="font-semibold text-slate-900">{adminName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{adminEmail}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>آخر دخول: {lastLogin}</span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => {
                if (item.type === 'divider') {
                  return (
                    <div key={index} className="my-2 border-t border-slate-100" />
                  );
                }

                return (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick?.();
                      if (!item.hasToggle) {
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      item.danger
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={item.danger ? 'text-rose-500' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-right">{item.label}</span>
                    {item.hasToggle && (
                      <div
                        className={`w-8 h-4 rounded-full transition-colors ${
                          isDarkMode ? 'bg-indigo-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 ${
                            isDarkMode ? 'translate-x-0.5' : 'translate-x-4'
                          }`}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
