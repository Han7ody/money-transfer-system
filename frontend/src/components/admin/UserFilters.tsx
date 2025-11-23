'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  countryFilter: string;
  onCountryChange: (value: string) => void;
  verificationFilter: string;
  onVerificationChange: (value: string) => void;
  onReset: () => void;
}

const countries = [
  { code: '', label: 'جميع الدول' },
  { code: 'SD', label: 'السودان' },
  { code: 'SA', label: 'السعودية' },
  { code: 'AE', label: 'الإمارات' },
  { code: 'EG', label: 'مصر' },
  { code: 'IN', label: 'الهند' },
];

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  countryFilter,
  onCountryChange,
  verificationFilter,
  onVerificationChange,
  onReset
}) => {
  const hasFilters = searchTerm || statusFilter !== 'all' || countryFilter || verificationFilter !== 'all';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، البريد، الهاتف، أو ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="all">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="blocked">محظور</option>
          <option value="new">جديد</option>
        </select>

        {/* Country Filter */}
        <select
          value={countryFilter}
          onChange={(e) => onCountryChange(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          {countries.map(country => (
            <option key={country.code} value={country.code}>
              {country.label}
            </option>
          ))}
        </select>

        {/* Verification Filter */}
        <div className="flex gap-2">
          <select
            value={verificationFilter}
            onChange={(e) => onVerificationChange(e.target.value)}
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          >
            <option value="all">جميع التحقق</option>
            <option value="verified">موثق</option>
            <option value="unverified">غير موثق</option>
          </select>

          {hasFilters && (
            <button
              onClick={onReset}
              className="px-3 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              مسح
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserFilters;
