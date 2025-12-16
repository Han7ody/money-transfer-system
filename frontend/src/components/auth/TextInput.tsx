'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  icon,
  showPasswordToggle = false,
  type: initialType = 'text',
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const type = showPasswordToggle ? (showPassword ? 'text' : 'password') : initialType;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          className={`
            w-full px-4 py-3.5 
            ${icon ? 'pr-12' : ''}
            ${showPasswordToggle ? 'pl-12' : ''}
            bg-white border-2 rounded-xl
            text-slate-900 placeholder:text-slate-400
            transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-blue-100
            ${error 
              ? 'border-red-500 focus:border-red-500' 
              : isFocused 
                ? 'border-blue-500' 
                : 'border-slate-200 hover:border-slate-300'
            }
            ${className}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
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