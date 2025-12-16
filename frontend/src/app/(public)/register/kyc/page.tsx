'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Camera, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

import { AuthShell } from '@/components/auth/AuthShell';
import { StepHeader } from '@/components/auth/StepHeader';
import { FileUpload } from '@/components/auth/FileUpload';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { authAPI } from '@/lib/api';

const steps = [
  { label: 'إنشاء الحساب', active: false },
  { label: 'تحقق البريد', active: false },
  { label: 'المعلومات', active: false },
  { label: 'التحقق', active: true }
];

export default function KycPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState({
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileSelect = (type: keyof typeof files) => (file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    if (errors[type]) {
      setErrors(prev => ({ ...prev, [type]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!files.idFront) {
      newErrors.idFront = 'صورة الهوية الأمامية مطلوبة';
    }
    if (!files.idBack) {
      newErrors.idBack = 'صورة الهوية الخلفية مطلوبة';
    }
    if (!files.selfie) {
      newErrors.selfie = 'صورة شخصية مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await authAPI.uploadKycDocuments({
        idFront: files.idFront!,
        idBack: files.idBack!,
        selfie: files.selfie!
      });

      if (response.success) {
        router.push('/register/status');
      } else {
        setErrors({ submit: response.message || 'حدث خطأ أثناء رفع الملفات' });
      }
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || 'حدث خطأ أثناء رفع الملفات' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = files.idFront && files.idBack && files.selfie;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <AuthShell
            title="التحقق من الهوية"
            subtitle="ارفع صور واضحة لوثائق الهوية"
            backHref="/register/profile"
          >
            <StepHeader 
              currentStep={4}
              totalSteps={4}
              steps={steps}
            />

            {/* Requirements Info */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">متطلبات الصور:</h3>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      صور واضحة وغير مشوشة
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      جميع النصوص مقروءة
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      حجم الملف أقل من 5 ميجابايت
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      صيغة JPG أو PNG أو PDF
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <FileUpload
                  label="الهوية الوطنية - الوجه الأمامي"
                  description="صورة واضحة للوجه الأمامي للهوية"
                  icon={FileText}
                  onFileSelect={handleFileSelect('idFront')}
                  error={errors.idFront}
                  file={files.idFront}
                />

                <FileUpload
                  label="الهوية الوطنية - الوجه الخلفي"
                  description="صورة واضحة للوجه الخلفي للهوية"
                  icon={FileText}
                  onFileSelect={handleFileSelect('idBack')}
                  error={errors.idBack}
                  file={files.idBack}
                />

                <FileUpload
                  label="صورة شخصية"
                  description="صورة شخصية واضحة مع إمساك الهوية"
                  icon={Camera}
                  accept="image/*"
                  onFileSelect={handleFileSelect('selfie')}
                  error={errors.selfie}
                  file={files.selfie}
                />
              </div>

              {errors.submit && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 text-center font-medium"
                >
                  {errors.submit}
                </motion.p>
              )}

              <PrimaryButton 
                type="submit" 
                loading={isSubmitting}
                disabled={!isFormValid}
              >
                رفع المستندات
              </PrimaryButton>
            </form>
          </AuthShell>
        </div>
      </div>
    </div>
  );
}