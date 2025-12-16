'use client';

import React, { useState } from 'react';
import { X, Package, AlertTriangle, CheckCircle, Loader2, Shield } from 'lucide-react';

interface ConfirmPickupModalProps {
  transaction: any;
  onClose: () => void;
  onConfirm: (pickupCode: string) => Promise<void>;
  loading: boolean;
}

export default function ConfirmPickupModal({
  transaction,
  onClose,
  onConfirm,
  loading
}: ConfirmPickupModalProps) {
  const [pickupCode, setPickupCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate pickup code format (6 digits)
    if (!/^\d{6}$/.test(pickupCode)) {
      setError('رمز الاستلام يجب أن يكون 6 أرقام');
      return;
    }

    try {
      await onConfirm(pickupCode);
    } catch (err: any) {
      setError(err.message || 'فشل في تأكيد الاستلام');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPickupCode('');
      setError('');
      onClose();
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${new Intl.NumberFormat('ar-SA').format(amount)} ${currency}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">تأكيد الاستلام النقدي</h3>
              <p className="text-sm text-slate-600">المعاملة: {transaction?.transactionRef}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Transaction Info */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">المبلغ:</span>
                <p className="font-medium text-slate-900">
                  {formatCurrency(transaction?.amountReceived, transaction?.toCurrency?.code)}
                </p>
              </div>
              <div>
                <span className="text-slate-600">المستلم:</span>
                <p className="font-medium text-slate-900">{transaction?.receiverDetails?.fullName || 'غير محدد'}</p>
              </div>
              <div>
                <span className="text-slate-600">المدينة:</span>
                <p className="font-medium text-slate-900">{transaction?.pickupCity}</p>
              </div>
              <div>
                <span className="text-slate-600">الوكيل:</span>
                <p className="font-medium text-slate-900">
                  {transaction?.assignedAgent?.fullName || 'غير محدد'}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">تأكد من صحة المعلومات</p>
                <p className="text-amber-700">
                  تأكد من أن المستلم قد استلم المبلغ كاملاً وأن رمز الاستلام صحيح قبل التأكيد.
                </p>
              </div>
            </div>
          </div>

          {/* Pickup Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              رمز الاستلام *
            </label>
            <div className="relative">
              <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={pickupCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPickupCode(value);
                  setError('');
                }}
                placeholder="أدخل رمز الاستلام (6 أرقام)"
                className="w-full pr-10 pl-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg font-mono tracking-widest"
                maxLength={6}
                disabled={loading}
                autoFocus
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 text-center">
              الرمز المكون من 6 أرقام الذي تم إرساله للمستلم
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || pickupCode.length !== 6}
              className="flex-1 px-4 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التأكيد...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  تأكيد الاستلام
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
