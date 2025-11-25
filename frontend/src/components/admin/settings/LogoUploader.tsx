'use client';

import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface LogoUploaderProps {
  currentLogo: string | null;
  onUploadSuccess: (logoUrl: string) => void;
  onError: (error: string) => void;
}

export function LogoUploader({ currentLogo, onUploadSuccess, onError }: LogoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      onError('يرجى اختيار صورة بصيغة صحيحة (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      onError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const response = await apiClient.uploadLogo(file);
      if (response.success) {
        onUploadSuccess(response.data.logoUrl);
      } else {
        onError(response.message || 'فشل رفع الشعار');
        setPreview(currentLogo);
      }
    } catch (error: any) {
      onError(error.response?.data?.message || 'فشل رفع الشعار');
      setPreview(currentLogo);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadSuccess('');
  };

  return (
    <div className="space-y-3">
      {/* Preview Area */}
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50">
        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Logo Preview"
              className="max-h-32 rounded-lg shadow-sm"
            />
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">لم يتم اختيار شعار</p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div>
        <label className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري الرفع...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>{preview ? 'تغيير الشعار' : 'رفع شعار'}</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="sr-only"
          />
        </label>
        <p className="text-xs text-slate-500 mt-2">
          الصيغ المدعومة: JPG, PNG, GIF, WebP (الحد الأقصى: 5 ميجابايت)
        </p>
      </div>
    </div>
  );
}
