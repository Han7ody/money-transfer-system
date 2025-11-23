'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description?: string;
  accept?: string;
  maxSize?: number; // in MB
  value?: File | null;
  preview?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
  required?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  accept = 'image/*',
  maxSize = 5,
  value,
  preview,
  onChange,
  error,
  required
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(preview || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`حجم الملف يجب أن يكون أقل من ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLocalPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Simulate upload progress
    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUploading(false);

    onChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setLocalPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500 mr-1">*</span>}
      </label>

      {localPreview || value ? (
        // Preview State
        <div className="relative border-2 border-slate-200 rounded-xl overflow-hidden">
          <img
            src={localPreview || ''}
            alt={label}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white rounded-lg text-slate-700 hover:bg-slate-100"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-white rounded-lg text-rose-600 hover:bg-rose-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          )}
          {!uploading && value && (
            <div className="absolute top-2 left-2 bg-emerald-500 text-white p-1 rounded-full">
              <Check className="w-3 h-3" />
            </div>
          )}
        </div>
      ) : (
        // Upload State
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : error
                ? 'border-rose-300 bg-rose-50'
                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }
          `}
        >
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              isDragging ? 'bg-indigo-100' : 'bg-slate-100'
            }`}>
              {uploading ? (
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              ) : (
                <ImageIcon className={`w-6 h-6 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
              )}
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              {isDragging ? 'أفلت الملف هنا' : 'اضغط أو اسحب الملف'}
            </p>
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              الحد الأقصى: {maxSize}MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="mt-1.5 text-sm text-rose-600">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
