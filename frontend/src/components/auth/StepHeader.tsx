'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  active: boolean;
}

interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  steps: Step[];
  title?: string;
  subtitle?: string;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  currentStep,
  totalSteps,
  steps,
  title,
  subtitle
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {(title || subtitle) && (
        <div className="text-center mb-6">
          {title && (
            <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
          )}
          {subtitle && (
            <p className="text-slate-500">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300 shadow-lg
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-slate-100 text-slate-400'
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
                </motion.div>
                
                <span className={`
                  text-xs mt-2 font-medium transition-colors duration-300
                  ${isActive 
                    ? 'text-blue-600' 
                    : isCompleted 
                      ? 'text-green-600' 
                      : 'text-slate-400'
                  }
                `}>
                  {step.label}
                </span>
              </div>
              
              {stepNumber < totalSteps && (
                <div className={`
                  w-12 h-0.5 mx-2 transition-colors duration-300 mt-[-20px]
                  ${stepNumber < currentStep ? 'bg-green-500' : 'bg-slate-200'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </motion.div>
  );
};