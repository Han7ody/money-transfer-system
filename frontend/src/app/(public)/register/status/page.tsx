'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, FileSearch, Mail, ArrowRight } from 'lucide-react';

// Progress Steps Component
const ProgressSteps = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { num: 1, label: 'إنشاء الحساب' },
    { num: 2, label: 'المعلومات الشخصية' },
    { num: 3, label: 'التحقق من الهوية' },
    { num: 4, label: 'الموافقة' }
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.num}>
          <div className="flex flex-col items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
              ${currentStep > step.num
                ? 'bg-emerald-500 text-white'
                : currentStep === step.num
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }
            `}>
              {currentStep > step.num ? <Check className="w-5 h-5" /> : step.num}
            </div>
            <span className={`text-xs mt-1 hidden sm:block ${
              currentStep >= step.num ? 'text-slate-700' : 'text-slate-400'
            }`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${
              currentStep > step.num ? 'bg-emerald-500' : 'bg-slate-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default function StatusPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user completed previous steps
    const registerData = localStorage.getItem('registerData');
    if (!registerData) {
      router.push('/register');
      return;
    }

    const data = JSON.parse(registerData);
    if (!data.kycSubmitted) {
      router.push('/register/kyc');
    }
  }, [router]);

  const verificationSteps = [
    {
      icon: FileSearch,
      title: 'مراجعة الوثائق',
      description: 'يتم التحقق من صحة وثائقك',
      status: 'in_progress'
    },
    {
      icon: Check,
      title: 'التحقق من الهوية',
      description: 'مطابقة البيانات مع الوثائق',
      status: 'pending'
    },
    {
      icon: Mail,
      title: 'إشعار النتيجة',
      description: 'سنرسل لك إشعاراً بالنتيجة',
      status: 'pending'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Main Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">قيد المراجعة</h1>
              <p className="text-sm text-slate-500 mt-2">
                تم استلام طلبك بنجاح وهو الآن قيد المراجعة
              </p>
            </div>

            {/* Progress */}
            <ProgressSteps currentStep={4} />

            {/* Timeline */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-medium text-slate-700 mb-4">مراحل التحقق</h3>
              <div className="space-y-4">
                {verificationSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === 'in_progress'
                        ? 'bg-amber-100'
                        : step.status === 'completed'
                          ? 'bg-emerald-100'
                          : 'bg-slate-100'
                    }`}>
                      <step.icon className={`w-4 h-4 ${
                        step.status === 'in_progress'
                          ? 'text-amber-600'
                          : step.status === 'completed'
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        step.status === 'pending' ? 'text-slate-400' : 'text-slate-900'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-medium">الوقت المتوقع:</span> من 24 إلى 48 ساعة عمل
              </p>
              <p className="text-xs text-blue-600 mt-1">
                سيتم إرسال إشعار على بريدك الإلكتروني عند اكتمال المراجعة
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                الذهاب للوحة التحكم
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/"
                className="w-full py-3 text-slate-600 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center"
              >
                العودة للرئيسية
              </Link>
            </div>

            {/* Support */}
            <p className="text-xs text-slate-500 text-center mt-6">
              هل لديك أسئلة؟{' '}
              <Link href="/support" className="text-indigo-600 hover:underline">
                تواصل مع الدعم
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
