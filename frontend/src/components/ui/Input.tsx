'use client';

import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, hint, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
            {props.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 text-sm border rounded-xl
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
              ${Icon ? 'pr-10' : ''}
              ${error
                ? 'border-rose-300 bg-rose-50 text-rose-900 placeholder-rose-300'
                : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-rose-600">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
