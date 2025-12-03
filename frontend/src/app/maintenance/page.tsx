'use client';

import React from 'react';
import { Wrench, Clock } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-10 h-10 text-amber-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">النظام تحت الصيانة</h1>

          {/* Description */}
          <p className="text-slate-600 mb-6">
            نعتذر عن الإزعاج. نحن نعمل على تحسين الخدمة حالياً. يرجى المحاولة لاحقاً.
          </p>

          {/* Status */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-amber-700">
              <Clock className="w-5 h-5" />
              <span className="font-medium">سيكون النظام متاحاً قريباً</span>
            </div>
          </div>

          {/* Support Contact */}
          <div className="pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-4">
              في حالة وجود أي استفسارات، يمكنك التواصل معنا
            </p>
            <a
              href="mailto:support@rasid.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
            >
              البريد الإلكتروني للدعم
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
