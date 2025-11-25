'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, Edit3, X, AlertTriangle,
  Globe, Lock, ArrowRight, Check
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

// Types
interface ExchangeRate {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  adminFeePercent: number;
  updatedAt: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

// Modal Component
const Modal = ({ isOpen, onClose, children, title }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Currency pairs configuration
const currencyPairs = [
  { from: 'SDG', to: 'INR' },
  { from: 'INR', to: 'SDG' },
  { from: 'SDG', to: 'USD' },
  { from: 'USD', to: 'SDG' },
  { from: 'SDG', to: 'EGP' },
  { from: 'EGP', to: 'SDG' },
  { from: 'SAR', to: 'SDG' },
  { from: 'SDG', to: 'SAR' },
];

// Mock global rates
const mockGlobalRates: Record<string, number> = {
  'SDG_INR': 0.138,
  'INR_SDG': 7.25,
  'SDG_USD': 0.00167,
  'USD_SDG': 600,
  'SDG_EGP': 0.082,
  'EGP_SDG': 12.2,
  'SAR_SDG': 160,
  'SDG_SAR': 0.00625,
};

const ExchangeRatesPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [error, setError] = useState('');

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);
  const [newRateValue, setNewRateValue] = useState('');
  const [newFeeValue, setNewFeeValue] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saving, setSaving] = useState(false);
  const [globalRateTooltip, setGlobalRateTooltip] = useState<string | null>(null);

  // Fetch exchange rates
  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getExchangeRates();
      if (response.success) {
        setRates(response.data);
      } else {
        // Fallback to mock rates if API fails
        const mockRates: ExchangeRate[] = currencyPairs.map((pair, index) => ({
          id: index + 1,
          fromCurrency: pair.from,
          toCurrency: pair.to,
          rate: mockGlobalRates[`${pair.from}_${pair.to}`] || 1,
          adminFeePercent: 2.5,
          updatedAt: new Date().toISOString()
        }));
        setRates(mockRates);
      }
    } catch (err) {
      console.error('Error fetching rates:', err);
      // Fallback to mock rates
      const mockRates: ExchangeRate[] = currencyPairs.map((pair, index) => ({
        id: index + 1,
        fromCurrency: pair.from,
        toCurrency: pair.to,
        rate: mockGlobalRates[`${pair.from}_${pair.to}`] || 1,
        adminFeePercent: 2.5,
        updatedAt: new Date().toISOString()
      }));
      setRates(mockRates);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Open edit modal
  const handleEdit = (rate: ExchangeRate) => {
    setSelectedRate(rate);
    setNewRateValue(rate.rate.toString());
    setNewFeeValue(rate.adminFeePercent.toString());
    setEditModalOpen(true);
  };

  // Save edit - show confirmation
  const handleSaveEdit = () => {
    if (!newRateValue || isNaN(Number(newRateValue)) || Number(newRateValue) <= 0) {
      return;
    }
    setEditModalOpen(false);
    setConfirmModalOpen(true);
    setPassword('');
    setPasswordError('');
  };

  // Confirm with password
  const handleConfirm = async () => {
    if (!password) {
      setPasswordError('يرجى إدخال كلمة المرور');
      return;
    }

    setSaving(true);
    setPasswordError('');

    try {
      // Call API to update exchange rate
      const response = await adminAPI.updateExchangeRate({
        fromCurrency: selectedRate!.fromCurrency,
        toCurrency: selectedRate!.toCurrency,
        rate: Number(newRateValue),
        adminFeePercent: Number(newFeeValue),
        password
      });

      if (response.success) {
        // Update local state
        setRates(prev => prev.map(r =>
          r.id === selectedRate!.id
            ? { ...r, rate: Number(newRateValue), adminFeePercent: Number(newFeeValue), updatedAt: new Date().toISOString() }
            : r
        ));
        setConfirmModalOpen(false);
        setSelectedRate(null);
      } else {
        setPasswordError(response.message || 'فشل تحديث السعر');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'كلمة المرور غير صحيحة');
    } finally {
      setSaving(false);
    }
  };

  // Fetch global rate (mock)
  const handleFetchGlobalRate = (rate: ExchangeRate) => {
    const key = `${rate.fromCurrency}_${rate.toCurrency}`;
    const globalRate = mockGlobalRates[key];
    if (globalRate) {
      setGlobalRateTooltip(key);
      setTimeout(() => setGlobalRateTooltip(null), 5000);
    }
  };

  // Apply global rate
  const handleApplyGlobalRate = (rate: ExchangeRate) => {
    const key = `${rate.fromCurrency}_${rate.toCurrency}`;
    const globalRate = mockGlobalRates[key];
    if (globalRate) {
      setSelectedRate(rate);
      setNewRateValue(globalRate.toString());
      setNewFeeValue(rate.adminFeePercent.toString());
      setEditModalOpen(true);
      setGlobalRateTooltip(null);
    }
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push('/admin/settings')}
          className="text-slate-500 hover:text-indigo-600"
        >
          الإعدادات
        </button>
        <ArrowRight className="w-4 h-4 text-slate-300 rotate-180" />
        <span className="text-slate-900 font-medium">أسعار الصرف</span>
      </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {/* Exchange Rates Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">أسعار الصرف الحالية</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500">جاري التحميل...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">زوج العملات</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">السعر الحالي</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">رسوم الإدارة %</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">آخر تحديث</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rates.map(rate => (
                      <tr key={rate.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{rate.fromCurrency}</span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{rate.toCurrency}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-lg font-semibold text-emerald-600">
                            {rate.rate.toFixed(6)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600">{rate.adminFeePercent}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">{formatDate(rate.updatedAt)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 relative">
                            <button
                              onClick={() => handleEdit(rate)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              تحديث
                            </button>
                            <button
                              onClick={() => handleFetchGlobalRate(rate)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                              title="الحصول على السعر العالمي"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </button>

                            {/* Global Rate Tooltip */}
                            {globalRateTooltip === `${rate.fromCurrency}_${rate.toCurrency}` && (
                              <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
                                <p className="text-xs text-slate-500 mb-2">السعر العالمي اليوم:</p>
                                <p className="font-mono font-semibold text-emerald-600 mb-2">
                                  {mockGlobalRates[`${rate.fromCurrency}_${rate.toCurrency}`]}
                                </p>
                                <button
                                  onClick={() => handleApplyGlobalRate(rate)}
                                  className="w-full px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-medium hover:bg-emerald-100"
                                >
                                  تطبيق هذا السعر
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="تعديل السعر"
      >
        {selectedRate && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-900">{selectedRate.fromCurrency}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-900">{selectedRate.toCurrency}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                السعر الجديد
              </label>
              <input
                type="number"
                value={newRateValue}
                onChange={(e) => setNewRateValue(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                step="0.000001"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                رسوم الإدارة (%)
              </label>
              <input
                type="number"
                value={newFeeValue}
                onChange={(e) => setNewFeeValue(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                step="0.1"
                min="0"
                max="100"
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                تعديل السعر سيؤثر فقط على المعاملات الجديدة.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!newRateValue || Number(newRateValue) <= 0}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="تأكيد التعديل"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-lg border border-rose-200">
            <Lock className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">
              هل أنت متأكد من تعديل سعر الصرف؟ هذه خطوة حساسة.
            </p>
          </div>

          {selectedRate && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">تغيير السعر:</p>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{selectedRate.fromCurrency} → {selectedRate.toCurrency}</span>
                <span className="text-slate-400">|</span>
                <span className="font-mono text-emerald-600">{newRateValue}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              أدخل كلمة المرور للتأكيد
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                passwordError ? 'border-rose-300' : 'border-slate-200'
              }`}
              placeholder="كلمة المرور"
            />
            {passwordError && (
              <p className="text-xs text-rose-600 mt-1">{passwordError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || !password}
              className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  تأكيد التعديل
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExchangeRatesPage;
