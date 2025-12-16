'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';
import { 
  AlertTriangle, 
  Briefcase, 
  Shield, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  AlertCircle,
  FileText,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  aml: {
    totalAlerts: number;
    openAlerts: number;
  };
  cases: {
    open_cases: number;
    investigating_cases: number;
    resolved_cases: number;
    escalated_cases: number;
    critical_cases: number;
    high_cases: number;
    total_cases: number;
  };
  kyc: {
    pending: number;
    approved: number;
    rejected: number;
  };
  fraud: {
    high_risk_users: number;
    flagged_users: number;
    avg_fraud_score: number;
  };
}

export default function ComplianceDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/compliance/dashboard');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <p className="text-slate-600">فشل تحميل بيانات لوحة التحكم</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-l from-indigo-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8" />
            <h1 className="text-3xl font-bold">لوحة الامتثال</h1>
          </div>
          <p className="text-indigo-100 text-sm">
            نظرة شاملة على مقاييس الامتثال والمراقبة المالية
          </p>
        </div>

        {/* AML Monitoring Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-bold text-slate-900">مراقبة AML</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <StatCard
              title="إجمالي التنبيهات"
              value={stats.aml.totalAlerts}
              color="blue"
              icon={<AlertTriangle className="w-6 h-6" />}
              trend="+12% من الشهر الماضي"
            />
            <StatCard
              title="التنبيهات المفتوحة"
              value={stats.aml.openAlerts}
              color="red"
              icon={<AlertCircle className="w-6 h-6" />}
              trend="يتطلب اهتمام فوري"
            />
          </div>
        </div>

        {/* AML Cases Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-bold text-slate-900">حالات AML</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="حالات مفتوحة"
              value={stats.cases.open_cases}
              color="yellow"
              icon={<Briefcase className="w-5 h-5" />}
              compact
            />
            <StatCard
              title="قيد التحقيق"
              value={stats.cases.investigating_cases}
              color="blue"
              icon={<Search className="w-5 h-5" />}
              compact
            />
            <StatCard
              title="تم الحل"
              value={stats.cases.resolved_cases}
              color="green"
              icon={<CheckCircle className="w-5 h-5" />}
              compact
            />
            <StatCard
              title="تم التصعيد"
              value={stats.cases.escalated_cases}
              color="red"
              icon={<TrendingUp className="w-5 h-5" />}
              compact
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <StatCard
              title="حالات حرجة"
              value={stats.cases.critical_cases}
              color="red"
              icon={<AlertCircle className="w-5 h-5" />}
              compact
            />
            <StatCard
              title="أولوية عالية"
              value={stats.cases.high_cases}
              color="orange"
              icon={<AlertTriangle className="w-5 h-5" />}
              compact
            />
            <StatCard
              title="إجمالي الحالات"
              value={stats.cases.total_cases}
              color="gray"
              icon={<BarChart3 className="w-5 h-5" />}
              compact
            />
          </div>
        </div>

        {/* KYC Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-bold text-slate-900">التحقق من الهوية (KYC)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              title="قيد المراجعة"
              value={stats.kyc.pending}
              color="yellow"
              icon={<Clock className="w-6 h-6" />}
            />
            <StatCard
              title="تم الموافقة"
              value={stats.kyc.approved}
              color="green"
              icon={<CheckCircle className="w-6 h-6" />}
            />
            <StatCard
              title="مرفوض"
              value={stats.kyc.rejected}
              color="red"
              icon={<XCircle className="w-6 h-6" />}
            />
          </div>
        </div>

        {/* Fraud Detection Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-bold text-slate-900">كشف الاحتيال</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              title="مستخدمون عالي المخاطر"
              value={stats.fraud.high_risk_users}
              color="red"
              icon={<AlertTriangle className="w-6 h-6" />}
            />
            <StatCard
              title="مستخدمون مُعلّمون"
              value={stats.fraud.flagged_users}
              color="orange"
              icon={<AlertCircle className="w-6 h-6" />}
            />
            <StatCard
              title="متوسط درجة الاحتيال"
              value={Math.round(stats.fraud.avg_fraud_score || 0)}
              color="blue"
              icon={<TrendingUp className="w-6 h-6" />}
              suffix="/100"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            إجراءات سريعة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionButton
              href="/admin/compliance/aml-alerts"
              label="عرض تنبيهات AML"
              icon={<AlertTriangle className="w-5 h-5" />}
              color="red"
            />
            <ActionButton
              href="/admin/compliance/cases"
              label="إدارة الحالات"
              icon={<Briefcase className="w-5 h-5" />}
              color="blue"
            />
            <ActionButton
              href="/admin/compliance/reports"
              label="إنشاء تقرير"
              icon={<FileText className="w-5 h-5" />}
              color="green"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'gray';
  icon: React.ReactNode;
  trend?: string;
  suffix?: string;
  compact?: boolean;
}

function StatCard({ title, value, color, icon, trend, suffix, compact }: StatCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'bg-blue-100 text-blue-600'
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: 'bg-emerald-100 text-emerald-600'
    },
    red: {
      bg: 'bg-gradient-to-br from-rose-50 to-rose-100',
      border: 'border-rose-200',
      text: 'text-rose-700',
      icon: 'bg-rose-100 text-rose-600'
    },
    yellow: {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: 'bg-amber-100 text-amber-600'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: 'bg-orange-100 text-orange-600'
    },
    gray: {
      bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-700',
      icon: 'bg-slate-100 text-slate-600'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm text-slate-600 font-medium mb-2">{title}</p>
          <p className={`${compact ? 'text-3xl' : 'text-4xl'} font-bold ${colors.text}`}>
            <span className="en-digits">{value.toLocaleString('en-US')}</span>
            {suffix && <span className="text-lg mr-1">{suffix}</span>}
          </p>
          {trend && !compact && (
            <p className="text-xs text-slate-500 mt-2">{trend}</p>
          )}
        </div>
        <div className={`${colors.icon} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  color: 'red' | 'blue' | 'green';
}

function ActionButton({ href, label, icon, color }: ActionButtonProps) {
  const colorClasses = {
    red: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  return (
    <a
      href={href}
      className={`flex items-center gap-3 p-4 rounded-lg border transition-all hover:shadow-md ${colorClasses[color]}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <span className="font-semibold">{label}</span>
    </a>
  );
}
