'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full py-3.5 px-6 
        border-2 border-slate-300 
        text-slate-700 font-semibold rounded-xl 
        hover:bg-slate-50 hover:border-slate-400
        transition-all duration-200 
        flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
};