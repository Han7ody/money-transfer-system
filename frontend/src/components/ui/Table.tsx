import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => (
  <div className="w-full overflow-x-auto">
    <table className={`w-full border-collapse ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <thead className={`bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 ${className}`}>
    {children}
  </thead>
);

export const TableBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <tbody className={`divide-y divide-slate-200 dark:divide-slate-700 ${className}`}>
    {children}
  </tbody>
);

export const TableRow: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}> = ({ 
  children, 
  className = '',
  onClick,
  hover = true
}) => (
  <tr
    onClick={onClick}
    className={`
      transition-colors
      ${hover ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  align?: 'left' | 'center' | 'right';
}> = ({ 
  children, 
  className = '',
  align = 'right'
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <th className={`px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 ${alignClasses[align]} ${className}`}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  align?: 'left' | 'center' | 'right';
}> = ({ 
  children, 
  className = '',
  align = 'right'
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <td className={`px-6 py-4 text-sm text-slate-600 dark:text-slate-400 ${alignClasses[align]} ${className}`}>
      {children}
    </td>
  );
};
