'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  showLoginLink?: boolean;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  children,
  title,
  subtitle,
  backHref,
  showLoginLink = true
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          {backHref ? (
            <Link href={backHref} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">العودة</span>
            </Link>
          ) : (
            <div />
          )}
          
          {showLoginLink && (
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              لديك حساب؟ تسجيل الدخول
            </Link>
          )}
        </motion.div>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <span className="text-white text-2xl font-bold">ر</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-slate-900 mb-2"
              >
                {title}
              </motion.h1>
              
              {subtitle && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-slate-500"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};