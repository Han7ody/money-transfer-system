'use client';

import React from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UserActionsMenu } from './UserActionsMenu';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  transactionCount: number;
  isActive: boolean;
  isVerified: boolean;
  isNew: boolean;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  loading: boolean;
  onToggleBlock: (userId: string, block: boolean) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  onToggleBlock
}) => {
  const getStatus = (user: User): 'active' | 'blocked' | 'new' | 'unverified' => {
    if (!user.isActive) return 'blocked';
    if (user.isNew) return 'new';
    if (!user.isVerified) return 'unverified';
    return 'active';
  };

  const getCountryName = (code: string) => {
    const countries: Record<string, string> = {
      'SD': 'السودان',
      'SA': 'السعودية',
      'AE': 'الإمارات',
      'EG': 'مصر',
      'IN': 'الهند',
    };
    return countries[code] || code;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-8 text-center">
          <p className="text-slate-500">لا يوجد مستخدمين</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                ID
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                الاسم
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                البريد الإلكتروني
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                الدولة
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                المعاملات
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-sm text-slate-600">#{user.id}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-indigo-600">
                        {user.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
                      <p className="text-xs text-slate-500">{user.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">{user.email}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">{getCountryName(user.country)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-900">{user.transactionCount}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={getStatus(user)} />
                </td>
                <td className="px-6 py-4">
                  <UserActionsMenu
                    userId={user.id}
                    isBlocked={!user.isActive}
                    onToggleBlock={onToggleBlock}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
