'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`
        w-full py-3.5 px-6 
        bg-gradient-to-r from-blue-600 to-blue-700 
        text-white font-semibold rounded-xl 
        shadow-lg hover:shadow-xl 
        transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          جاري المعالجة...
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};