'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { SecondaryButton } from '@/components/auth/SecondaryButton';

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8"
          >
            {/* Success Animation */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-center mb-8"
            >
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 w-20 h-20 bg-green-200 rounded-full mx-auto"
                />
              </div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-slate-900 mb-2"
              >
                تم إنشاء حسابك بنجاح!
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-slate-600"
              >
                شكراً لك على انضمامك إلينا
              </motion.p>
            </motion.div>

            {/* Status Timeline */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-4 mb-8"
            >
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl"
              >
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">تم إنشاء الحساب</p>
                  <p className="text-sm text-green-700">تم التحقق من البريد الإلكتروني</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl"
              >
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">تم حفظ المعلومات الشخصية</p>
                  <p className="text-sm text-green-700">البيانات الأساسية مكتملة</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl"
              >
                <div className="relative">
                  <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </motion.div>
                </div>
                <div>
                  <p className="font-semibold text-amber-900">مراجعة وثائق الهوية</p>
                  <p className="text-sm text-amber-700">قيد المراجعة - سيتم الرد خلال 24 ساعة</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Next Steps Info */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8"
            >
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">الخطوات التالية:</h3>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                      سنراجع وثائق الهوية المرفوعة
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                      ستصلك رسالة بريد إلكتروني بالنتيجة
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                      بعد الموافقة يمكنك البدء في إرسال الأموال
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="space-y-4"
            >
              <Link href="/login">
                <PrimaryButton className="w-full">
                  تسجيل الدخول إلى حسابك
                </PrimaryButton>
              </Link>
              
              <Link href="/">
                <SecondaryButton className="w-full">
                  العودة إلى الصفحة الرئيسية
                </SecondaryButton>
              </Link>
            </motion.div>

            {/* Support Link */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center mt-8 pt-6 border-t border-slate-200"
            >
              <p className="text-sm text-slate-500 mb-2">تحتاج مساعدة؟</p>
              <Link 
                href="/support" 
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                تواصل مع الدعم الفني
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}