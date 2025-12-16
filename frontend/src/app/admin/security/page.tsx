'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, History, Monitor, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/admin/AdminLayout';

export default function SecurityPage() {
  const router = useRouter();
  const { role } = useAuth();

  // Security cards configuration
  const securityCards = [
    {
      icon: <KeyRound className="w-8 h-8 text-indigo-600" />,
      title: 'تغيير كلمة المرور',
      description: 'قم بتحديث كلمة المرور الخاصة بك للحفاظ على أمان حسابك',
      path: '/admin/security/change-password',
      bgColor: 'bg-indigo-50',
      roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'VIEWER']
    },
    {
      icon: <History className="w-8 h-8 text-emerald-600" />,
      title: 'سجل تسجيل الدخول',
      description: 'عرض سجل تسجيلات الدخول وأماكن الوصول لحسابك',
      path: '/admin/security/login-history',
      bgColor: 'bg-emerald-50',
      roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'VIEWER']
    },
    {
      icon: <Monitor className="w-8 h-8 text-blue-600" />,
      title: 'الجلسات النشطة',
      description: 'إدارة وإنهاء الأجهزة والجلسات المتصلة بحسابك',
      path: '/admin/security/sessions',
      bgColor: 'bg-blue-50',
      roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'VIEWER']
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-purple-600" />,
      title: 'التحقق بخطوتين',
      description: 'تفعيل المصادقة الثنائية لحماية إضافية لحسابك',
      path: '/admin/security/2fa',
      bgColor: 'bg-purple-50',
      roles: ['SUPER_ADMIN', 'ADMIN']
    }
  ];

  // Filter cards by role
  const visibleCards = securityCards.filter(card =>
    role && card.roles.includes(role)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">إعدادات الأمان</h1>
        <p className="text-slate-600">
          إدارة إعدادات الأمان الخاصة بحسابك وعرض نشاط تسجيل الدخول
        </p>
      </div>

      {/* Security Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleCards.map((card, index) => (
          <button
            key={index}
            onClick={() => router.push(card.path)}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all text-right group"
          >
            <div className="flex items-start gap-4">
              <div className={`${card.bgColor} rounded-lg p-3 group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-600">
                  {card.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Security Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-2">نصائح الأمان</h3>
            <ul className="space-y-1.5 text-sm text-amber-800">
              <li>• استخدم كلمة مرور قوية تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز</li>
              <li>• قم بتغيير كلمة المرور بشكل دوري (كل 3-6 أشهر)</li>
              <li>• لا تشارك بيانات تسجيل الدخول مع أي شخص</li>
              <li>• تحقق من سجل تسجيل الدخول بانتظام للكشف عن أي نشاط غير عادي</li>
              <li>• قم بإنهاء الجلسات النشطة من الأجهزة التي لا تستخدمها</li>
              {role === 'SUPER_ADMIN' || role === 'ADMIN' ? (
                <li>• فعّل التحقق بخطوتين لحماية إضافية لحسابك</li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
