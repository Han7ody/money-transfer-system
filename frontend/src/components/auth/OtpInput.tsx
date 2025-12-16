'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  length?: number;
  error?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  error
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (index: number, inputValue: string) => {
    if (inputValue.length > 1) return;
    
    const newValue = [...value];
    newValue[index] = inputValue;
    onChange(newValue);

    // Auto-focus next input
    if (inputValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    const newValue = pastedData.split('').concat(Array(length).fill('')).slice(0, length);
    onChange(newValue);
  };

  return (
    <div className="w-full">
      <div className="flex gap-3 justify-center" dir="ltr">
        {Array.from({ length }, (_, index) => (
          <motion.input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`
              w-12 h-14 text-center text-xl font-bold 
              border-2 rounded-xl 
              focus:outline-none focus:ring-4 focus:ring-blue-100
              transition-all duration-200
              ${error 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-slate-200 focus:border-blue-500 hover:border-slate-300'
              }
            `}
          />
        ))}
      </div>
      
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-red-600 font-medium text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};