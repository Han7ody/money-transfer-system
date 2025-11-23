import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'blocked' | 'new' | 'unverified' | 'verified';
  size?: 'sm' | 'md';
}

const statusConfig = {
  active: {
    label: 'نشط',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  blocked: {
    label: 'محظور',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500'
  },
  new: {
    label: 'جديد',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500'
  },
  unverified: {
    label: 'غير موثق',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500'
  },
  verified: {
    label: 'موثق',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status];

  return (
    <span className={`
      inline-flex items-center gap-1.5 border rounded-full font-medium
      ${config.bg} ${config.text} ${config.border}
      ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
