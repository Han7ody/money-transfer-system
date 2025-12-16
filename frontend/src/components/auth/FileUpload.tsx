'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, X, FileText } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File | null) => void;
  error?: string;
  file?: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  icon: Icon,
  accept = "image/*,.pdf",
  maxSize = 5,
  onFileSelect,
  error,
  file
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      onFileSelect(null);
      setPreview(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      return;
    }

    // Validate file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      return;
    }

    onFileSelect(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = () => {
    handleFileChange(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <label className="block text-sm font-semibold text-slate-700 mb-3">
        {label}
      </label>
      
      <div
        className={`
          relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : error 
              ? 'border-red-300 bg-red-50' 
              : file 
                ? 'border-green-300 bg-green-50' 
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept={accept}
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {file ? (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            
            <div>
              <p className="font-semibold text-green-700">{file.name}</p>
              <p className="text-sm text-slate-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            
            {preview && (
              <div className="flex justify-center">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-24 h-24 object-cover rounded-lg border-2 border-green-200"
                />
              </div>
            )}
            
            {file.type === 'application/pdf' && (
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-red-100 rounded-lg border-2 border-red-200 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-red-600" />
                </div>
              </div>
            )}
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="absolute top-2 left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex justify-center">
              <Icon className="w-12 h-12 text-slate-400" />
            </div>
            
            <div>
              <p className="font-semibold text-slate-700 mb-1">{label}</p>
              <p className="text-sm text-slate-500 mb-3">{description}</p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Upload className="w-5 h-5" />
              <span className="font-semibold">اختر ملف أو اسحبه هنا</span>
            </div>
            
            <p className="text-xs text-slate-400">
              JPG, PNG أو PDF • حد أقصى {maxSize} MB
            </p>
          </motion.div>
        )}
      </div>
      
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-600 font-medium"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
};