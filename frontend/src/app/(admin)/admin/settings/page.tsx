'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Settings,
  Shield,
  Mail,
  FileText,
  ChevronLeft,
  Clock,
  Bell
} from 'lucide-react';

interface SettingCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export default function SettingsPage() {
  const router = useRouter();

  const settingCards: SettingCard[] = [
    {
      title: 'أسعار الصرف',
      description: 'إدارة أسعار صرف العملات ورسوم التحويل',
      icon: <DollarSign className="w-6 h-6" />,
      href: '/admin/settings/exchange-rates',
      color: 'bg-emerald-500'
    },
    {
      title: 'الإعدادات العامة',
      description: 'تكوين الإعدادات العامة للمنصة',
      icon: <Settings className="w-6 h-6" />,
      href: '/admin/settings/general',
      color: 'bg-blue-500'
    },
    {
      title: 'إعدادات الإشعارات',
      description: 'تكوين إعدادات الإشعارات والتنبيهات',
      icon: <Bell className="w-6 h-6" />,
      href: '/admin/settings/notifications',
      color: 'bg-indigo-500'
    },
    {
      title: 'إعدادات البريد',
      description: 'تكوين SMTP وقوالب البريد الإلكتروني',
      icon: <Mail className="w-6 h-6" />,
      href: '/admin/settings/smtp',
      color: 'bg-purple-500'
    },
    {
      title: 'السياسات',
      description: 'إدارة سياسات المنصة والشروط والأحكام',
      icon: <FileText className="w-6 h-6" />,
      href: '/admin/settings/policies',
      color: 'bg-orange-500'
    },
    {
      title: 'سجل التغييرات',
      description: 'عرض جميع عمليات التعديل التي تمت على إعدادات المنصة',
      icon: <Clock className="w-6 h-6" />,
      href: '/admin/settings/logs',
      color: 'bg-slate-600'
    }
  ];

  return (
    <div className="space-y-6">

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingCards.map((card) => (
          <button
            key={card.href}
            onClick={() => router.push(card.href)}
            className="bg-white rounded-xl border border-slate-200 p-6 text-right hover:shadow-lg hover:border-indigo-200 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-white`}>
                {card.icon}
              </div>
              <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mt-4">{card.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{card.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
