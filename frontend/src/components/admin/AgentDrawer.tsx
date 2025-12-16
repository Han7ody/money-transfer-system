'use client';

import { X, User, Phone, MapPin, Activity, Ban, CheckCircle, Key, Bell, ExternalLink, TrendingUp, AlertCircle } from 'lucide-react';

interface Agent {
  id: number;
  fullName: string;
  phone: string;
  whatsapp?: string;
  city: string;
  status: string;
  activeTransactions: number;
  totalTransactions: number;
  currentDailyAmount: number;
  maxDailyAmount: number;
}

interface AgentDrawerProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuspend?: (id: number) => void;
  onActivate?: (id: number) => void;
  onResetPassword?: (id: number) => void;
}

export default function AgentDrawer({ agent, isOpen, onClose, onSuspend, onActivate, onResetPassword }: AgentDrawerProps) {
  if (!isOpen || !agent) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA').format(amount);
  };

  const dailyUsagePercent = (agent.currentDailyAmount / agent.maxDailyAmount) * 100;

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'نشط' },
      SUSPENDED: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'موقوف' },
      OUT_OF_CASH: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'نفذت السيولة' },
      ON_HOLD: { bg: 'bg-slate-50', text: 'text-slate-700', label: 'معلق' }
    };
    return badges[status] || badges.ACTIVE;
  };

  const statusBadge = getStatusBadge(agent.status);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-l from-purple-600 to-purple-700 text-white px-6 py-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تفاصيل الوكيل</h2>
              <p className="text-sm text-purple-100">معلومات كاملة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{agent.fullName}</h3>
                <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.label}
                </span>
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 mb-1">رقم الوكيل</p>
                <p className="text-sm font-mono font-semibold text-slate-900">#{agent.id.toString().padStart(6, '0')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">رقم الهاتف</p>
                  <p className="font-medium">{agent.phone}</p>
                </div>
              </div>

              {agent.whatsapp && (
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">واتساب</p>
                    <p className="font-medium">{agent.whatsapp}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">المدينة</p>
                  <p className="font-medium">{agent.city}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-600" />
              إجراءات الحساب
            </h4>
            <div className="space-y-2">
              {agent.status === 'ACTIVE' ? (
                <button
                  onClick={() => onSuspend?.(agent.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition-colors font-medium"
                >
                  <Ban className="w-5 h-5" />
                  تعليق الوكيل
                </button>
              ) : (
                <button
                  onClick={() => onActivate?.(agent.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  تفعيل الوكيل
                </button>
              )}

              <button
                onClick={() => onResetPassword?.(agent.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium"
              >
                <Key className="w-5 h-5" />
                إعادة تعيين كلمة المرور
              </button>

              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors font-medium"
              >
                <Bell className="w-5 h-5" />
                إرسال إشعار
              </button>
            </div>
          </div>

          {/* Activity Metrics */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              مقاييس الأداء
            </h4>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-medium mb-1">معاملات نشطة</p>
                <p className="text-2xl font-bold text-blue-900">{agent.activeTransactions}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                <p className="text-xs text-purple-600 font-medium mb-1">إجمالي المعاملات</p>
                <p className="text-2xl font-bold text-purple-900">{agent.totalTransactions}</p>
              </div>
            </div>

            {/* Daily Usage */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">الاستخدام اليومي</span>
                <span className="text-xs text-slate-500">{dailyUsagePercent.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all ${
                    dailyUsagePercent > 80 ? 'bg-rose-500' : dailyUsagePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(dailyUsagePercent, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{formatCurrency(agent.currentDailyAmount)} ر.س</span>
                <span className="text-slate-500">من {formatCurrency(agent.maxDailyAmount)} ر.س</span>
              </div>
            </div>

            {/* Performance Badge */}
            <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-emerald-900">معدل الرفض</p>
                <p className="text-sm text-emerald-700">2.3% (ممتاز)</p>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500 text-center">
              آخر نشاط: منذ 15 دقيقة
            </div>
          </div>

          {/* Full Profile Link */}
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium">
            <ExternalLink className="w-5 h-5" />
            عرض الملف الشخصي الكامل
          </button>
        </div>
      </div>
    </>
  );
}
