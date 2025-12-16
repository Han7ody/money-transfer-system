'use client';

import React from 'react';
import { User, Phone, Building, CreditCard, Hash, MapPin, FileText } from 'lucide-react';

interface ReceiverInfoCardProps {
  receiver: any;
  payoutMethod: string;
  payoutCurrency: string;
}

export default function ReceiverInfoCard({ receiver, payoutMethod, payoutCurrency }: ReceiverInfoCardProps) {
  // Handle both receiverDetails object and direct transaction fields
  const receiverData = receiver || {};
  
  // Check if we have at least a name
  if (!receiverData.fullName) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">معلومات المستلم</h3>
        <p className="text-sm text-slate-500">لا توجد معلومات متاحة</p>
      </div>
    );
  }

  // Determine which fields to show based on country and method
  const getFieldsConfig = () => {
    const currency = payoutCurrency || '';
    
    // India (INR)
    if (currency === 'INR') {
      if (payoutMethod === 'UPI') {
        return [
          { key: 'fullName', label: 'الاسم الكامل', icon: User },
          { key: 'phone', label: 'رقم الهاتف', icon: Phone },
          { key: 'upiId', label: 'معرف UPI', icon: Hash },
        ];
      }
      if (payoutMethod === 'IMPS' || payoutMethod === 'BANK_TRANSFER') {
        return [
          { key: 'fullName', label: 'الاسم الكامل', icon: User },
          { key: 'phone', label: 'رقم الهاتف', icon: Phone },
          { key: 'bankName', label: 'اسم البنك', icon: Building },
          { key: 'accountNumber', label: 'رقم الحساب', icon: CreditCard },
          { key: 'ifscCode', label: 'رمز IFSC', icon: Hash },
          { key: 'branch', label: 'الفرع', icon: Building },
        ];
      }
    }
    
    // Sudan (SDG)
    if (currency === 'SDG') {
      if (payoutMethod === 'CASH_PICKUP') {
        return [
          { key: 'fullName', label: 'الاسم الكامل', icon: User },
          { key: 'phone', label: 'رقم الهاتف', icon: Phone },
          { key: 'pickupCity', label: 'مدينة الاستلام', icon: MapPin },
        ];
      }
      if (payoutMethod === 'BANK_TRANSFER') {
        return [
          { key: 'fullName', label: 'الاسم الكامل', icon: User },
          { key: 'accountNumber', label: 'رقم الحساب', icon: CreditCard },
          { key: 'bankName', label: 'اسم البنك', icon: Building },
          { key: 'branch', label: 'الفرع', icon: Building },
        ];
      }
    }
    
    // UAE (AED)
    if (currency === 'AED') {
      if (payoutMethod === 'CASH_PICKUP') {
        return [
          { key: 'fullName', label: 'الاسم الكامل', icon: User },
          { key: 'phone', label: 'رقم الهاتف', icon: Phone },
          { key: 'emirate', label: 'الإمارة', icon: MapPin },
          { key: 'idType', label: 'نوع الهوية', icon: FileText },
          { key: 'idNumber', label: 'رقم الهوية', icon: Hash },
        ];
      }
      if (payoutMethod === 'BANK_TRANSFER') {
        return [
          { key: 'fullName', label: 'الاسم الكامل', icon: User },
          { key: 'phone', label: 'رقم الهاتف', icon: Phone },
          { key: 'iban', label: 'IBAN', icon: CreditCard },
          { key: 'bankName', label: 'اسم البنك', icon: Building },
        ];
      }
    }

    // USA (USD)
    if (currency === 'USD') {
      if (payoutMethod === 'ACH_TRANSFER') {
        return [
          { key: 'fullName', label: 'الاسم الكامل', icon: User },
          { key: 'routingNumber', label: 'Routing Number', icon: Hash },
          { key: 'accountNumber', label: 'رقم الحساب', icon: CreditCard },
        ];
      }
      if (payoutMethod === 'WIRE_TRANSFER') {
        return [
          { key: 'fullName', label: 'الاسم الكامل', icon: User },
          { key: 'swiftCode', label: 'SWIFT Code', icon: Hash },
          { key: 'routingNumber', label: 'Routing Number', icon: Hash },
          { key: 'accountNumber', label: 'رقم الحساب', icon: CreditCard },
          { key: 'bankName', label: 'اسم البنك', icon: Building },
        ];
      }
    }
    
    // Default
    return [
      { key: 'fullName', label: 'الاسم الكامل', icon: User },
      { key: 'phone', label: 'رقم الهاتف', icon: Phone },
      { key: 'accountNumber', label: 'رقم الحساب', icon: CreditCard },
    ];
  };

  const fields = getFieldsConfig();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">معلومات المستلم</h3>
        {payoutMethod && (
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
            {payoutMethod.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const Icon = field.icon;
          const value = receiverData[field.key];
          
          if (!value) return null;
          
          return (
            <div key={field.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-0.5">{field.label}</p>
                <p className="text-sm font-medium text-slate-900 truncate">{value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
