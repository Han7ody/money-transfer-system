'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, TrendingUp, AlertCircle, CheckCircle, Search } from 'lucide-react';

interface Agent {
  id: number;
  fullName: string;
  phone: string;
  whatsapp?: string;
  city: string;
  status: string;
  maxDailyAmount: number;
  maxPerTransaction: number;
  currentDailyAmount: number;
  activeTransactions: number;
}

interface AssignAgentModalProps {
  pickupCity: string;
  transactionAmount: number;
  onClose: () => void;
  onAssign: (agentId: number) => void;
  loading: boolean;
}

export default function AssignAgentModal({
  pickupCity,
  transactionAmount,
  onClose,
  onAssign,
  loading
}: AssignAgentModalProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAgents, setLoadingAgents] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      setLoadingAgents(true);
      try {
        // Import adminAPI
        const { adminAPI } = await import('@/lib/api');
        const response = await adminAPI.getAvailableAgents({
          city: pickupCity,
          amount: transactionAmount
        });
        
        if (response.success) {
          setAgents(response.data);
        } else {
          // Fallback to mock data if API fails
          console.warn('Failed to fetch agents, using mock data');
          setAgents([]);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
        // Use empty array on error
        setAgents([]);
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, [pickupCity, transactionAmount]);

  const filteredAgents = agents.filter(agent =>
    agent.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.phone.includes(searchQuery)
  );

  const canHandleTransaction = (agent: Agent) => {
    if (transactionAmount > agent.maxPerTransaction) {
      return { can: false, reason: 'المبلغ يتجاوز حد المعاملة الواحدة' };
    }
    if (agent.currentDailyAmount + transactionAmount > agent.maxDailyAmount) {
      return { can: false, reason: 'سيتجاوز الحد اليومي' };
    }
    if (agent.status !== 'ACTIVE') {
      return { can: false, reason: 'الوكيل غير نشط' };
    }
    return { can: true, reason: '' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA').format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'نشط' },
      SUSPENDED: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'موقوف' },
      OUT_OF_CASH: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'نفذت السيولة' },
      ON_HOLD: { bg: 'bg-slate-50', text: 'text-slate-700', label: 'معلق' }
    };
    return badges[status] || badges.ACTIVE;
  };

  const handleAssign = () => {
    if (selectedAgent) {
      onAssign(selectedAgent.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">تعيين وكيل</h3>
              <p className="text-sm text-slate-500">
                المدينة: {pickupCity} • المبلغ: {formatCurrency(transactionAmount)} SDG
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن وكيل بالاسم أو رقم الهاتف..."
              className="w-full pr-10 pl-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Agents List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingAgents ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-4 border border-slate-200 rounded-lg">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">لا يوجد وكلاء متاحين في {pickupCity}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAgents.map((agent) => {
                const availability = canHandleTransaction(agent);
                const statusBadge = getStatusBadge(agent.status);
                const isSelected = selectedAgent?.id === agent.id;
                const remainingDaily = agent.maxDailyAmount - agent.currentDailyAmount;
                const dailyUsagePercent = (agent.currentDailyAmount / agent.maxDailyAmount) * 100;

                return (
                  <button
                    key={agent.id}
                    onClick={() => availability.can && setSelectedAgent(agent)}
                    disabled={!availability.can}
                    className={`w-full p-4 border-2 rounded-xl text-right transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : availability.can
                          ? 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                          : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-purple-100' : 'bg-slate-100'
                        }`}>
                          <User className={`w-6 h-6 ${isSelected ? 'text-purple-600' : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-1">{agent.fullName}</h4>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {agent.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {agent.city}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="p-2 bg-white rounded-lg">
                        <p className="text-xs text-slate-500 mb-0.5">معاملات نشطة</p>
                        <p className="text-sm font-semibold text-slate-900">{agent.activeTransactions}</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg">
                        <p className="text-xs text-slate-500 mb-0.5">حد المعاملة</p>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(agent.maxPerTransaction)}</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg">
                        <p className="text-xs text-slate-500 mb-0.5">متبقي يومي</p>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(remainingDaily)}</p>
                      </div>
                    </div>

                    {/* Daily Usage Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>الاستخدام اليومي</span>
                        <span>{dailyUsagePercent.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            dailyUsagePercent > 80 ? 'bg-rose-500' : dailyUsagePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${dailyUsagePercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Availability Status */}
                    {!availability.can && (
                      <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <p className="text-xs text-rose-700">{availability.reason}</p>
                      </div>
                    )}

                    {isSelected && availability.can && (
                      <div className="flex items-center gap-2 p-2 bg-purple-100 border border-purple-200 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <p className="text-xs text-purple-700 font-medium">تم الاختيار</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 text-slate-700 border border-slate-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedAgent || loading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'جاري التعيين...' : 'تعيين الوكيل'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
