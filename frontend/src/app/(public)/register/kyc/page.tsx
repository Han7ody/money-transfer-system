'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Shield, Info } from 'lucide-react';
import { FileUpload } from '@/components/ui/FileUpload';
import { authAPI, getAuthToken } from '@/lib/api';

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

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [documents, setDocuments] = useState({
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user is authenticated
    const token = getAuthToken();
    if (!token) {
      router.push('/register');
    }
  }, [router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!documents.idFront) {
      newErrors.idFront = 'صورة الوجه الأمامي للهوية مطلوبة';
    }
    if (!documents.idBack) {
      newErrors.idBack = 'صورة الوجه الخلفي للهوية مطلوبة';
    }
    if (!documents.selfie) {
      newErrors.selfie = 'الصورة الشخصية مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await authAPI.uploadKycDocuments({
        idFront: documents.idFront!,
        idBack: documents.idBack!,
        selfie: documents.selfie!
      });

      if (response.success) {
        // --- بداية التعديل: حفظ حالة النجاح ---
        const currentData = localStorage.getItem('registerData');
        if (currentData) {
          const data = JSON.parse(currentData);
          localStorage.setItem('registerData', JSON.stringify({
            ...data,
            kycSubmitted: true
          }));
        }
        // --- نهاية التعديل ---

        router.push('/register/status');
      } else {
        setErrors({ submit: response.message || 'حدث خطأ أثناء رفع الوثائق' });
      }
    } catch (error: unknown) {
      console.error('KYC upload error:', error);
      const getErrorMessage = (e: unknown): string => {
        if (!e) return 'حدث خطأ أثناء رفع الوثائق';
        if (typeof e === 'string') return e;
        if (typeof e === 'object' && e !== null) {
          const obj = e as Record<string, unknown>;
          const response = obj.response as Record<string, unknown> | undefined;
          const data = response?.data as Record<string, unknown> | undefined;
          const message = data?.message ?? obj.message;
          if (typeof message === 'string') return message;
        }
        return 'حدث خطأ أثناء رفع الوثائق';
      };
      const errorMessage = getErrorMessage(error);
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/register/profile" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">العودة</span>
          </Link>
          <div className="text-sm text-slate-500">الخطوة 3 من 4</div>
        </div>

        {/* Main Card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">التحقق من الهوية</h1>
              <p className="text-sm text-slate-500 mt-1">ارفع وثائقك للتحقق من هويتك</p>
            </div>

            {/* Progress */}
            <ProgressSteps currentStep={3} />

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">نصائح للصور الواضحة:</p>
                  <ul className="text-xs space-y-1 text-blue-700">
                    <li>• تأكد من وضوح جميع التفاصيل</li>
                    <li>• تجنب الانعكاسات والظلال</li>
                    <li>• التقط الصور في إضاءة جيدة</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ID Front */}
              <FileUpload
                label="الوجه الأمامي للهوية"
                description="صورة واضحة للوجه الأمامي لبطاقة الهوية"
                accept="image/*"
                maxSize={5}
                value={documents.idFront}
                onChange={(file) => {
                  setDocuments(prev => ({ ...prev, idFront: file }));
                  if (errors.idFront) setErrors(prev => ({ ...prev, idFront: '' }));
                }}
                error={errors.idFront}
                required
              />

              {/* ID Back */}
              <FileUpload
                label="الوجه الخلفي للهوية"
                description="صورة واضحة للوجه الخلفي لبطاقة الهوية"
                accept="image/*"
                maxSize={5}
                value={documents.idBack}
                onChange={(file) => {
                  setDocuments(prev => ({ ...prev, idBack: file }));
                  if (errors.idBack) setErrors(prev => ({ ...prev, idBack: '' }));
                }}
                error={errors.idBack}
                required
              />

              {/* Selfie */}
              <FileUpload
                label="صورة شخصية (سيلفي)"
                description="صورة واضحة لوجهك مع الهوية بجانبك"
                accept="image/*"
                maxSize={5}
                value={documents.selfie}
                onChange={(file) => {
                  setDocuments(prev => ({ ...prev, selfie: file }));
                  if (errors.selfie) setErrors(prev => ({ ...prev, selfie: '' }));
                }}
                error={errors.selfie}
                required
              />

              {errors.submit && (
                <p className="text-sm text-rose-600 text-center">{errors.submit}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري رفع الوثائق...
                  </>
                ) : (
                  'إرسال للمراجعة'
                )}
              </button>
            </form>

            {/* Privacy Note */}
            <p className="text-xs text-slate-500 text-center mt-4">
              وثائقك محمية ومشفرة ولن يتم مشاركتها مع أي طرف ثالث
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}