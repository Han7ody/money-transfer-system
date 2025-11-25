'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Settings, Construction } from 'lucide-react';

export default function GeneralSettingsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push('/admin/settings')}
          className="text-slate-500 hover:text-indigo-600"
        >
          الإعدادات
        </button>
        <ArrowRight className="w-4 h-4 text-slate-300 rotate-180" />
        <span className="text-slate-900 font-medium">الإعدادات العامة</span>
      </div>

      {/* Under Development */}
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Construction className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">قيد التطوير</h2>
        <p className="text-slate-500 mb-6">
          هذه الصفحة قيد التطوير حالياً. سيتم إضافة إعدادات المنصة العامة قريباً.
        </p>
        <button
          onClick={() => router.push('/admin/settings')}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
        >
          العودة للإعدادات
        </button>
      </div>
    </div>
  );
}
