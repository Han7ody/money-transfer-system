'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@/components/ui';
import { Loading } from '@/components/ui/Spinner';
import api from '@/lib/api';
import { Shield, Save, Users, CreditCard, AlertTriangle, Settings, BarChart3, Lock, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { formatNumber } from '@/lib/formatters';

interface Permission {
  permission: string;
  enabled: boolean;
}

interface Role {
  role: string;
  permissions: Permission[];
}

const permissionGroups = {
  users: {
    title: 'إدارة المستخدمين',
    icon: Users,
    color: 'blue',
    permissions: ['MANAGE_USERS', 'BLOCK_USERS', 'VIEW_USER_DETAILS']
  },
  kyc: {
    title: 'توثيق الهوية (KYC)',
    icon: Shield,
    color: 'emerald',
    permissions: ['KYC_REVIEW', 'KYC_APPROVE', 'KYC_REJECT']
  },
  transactions: {
    title: 'المعاملات',
    icon: CreditCard,
    color: 'purple',
    permissions: ['TRANSACTION_APPROVAL', 'VIEW_TRANSACTIONS', 'CANCEL_TRANSACTIONS']
  },
  compliance: {
    title: 'الامتثال',
    icon: AlertTriangle,
    color: 'orange',
    permissions: ['COMPLIANCE_DASHBOARD', 'AML_MONITORING', 'GENERATE_REPORTS']
  },
  agents: {
    title: 'إدارة الوكلاء',
    icon: Users,
    color: 'indigo',
    permissions: ['MANAGE_AGENTS', 'APPROVE_AGENTS', 'SUSPEND_AGENTS']
  },
  reports: {
    title: 'التقارير',
    icon: BarChart3,
    color: 'cyan',
    permissions: ['VIEW_REPORTS', 'EXPORT_REPORTS', 'SCHEDULE_REPORTS']
  },
  system: {
    title: 'إعدادات النظام',
    icon: Settings,
    color: 'slate',
    permissions: ['SYSTEM_SETTINGS', 'MANAGE_ADMINS', 'MANAGE_ROLES', 'SECURITY_SETTINGS']
  }
};

const permissionLabels: Record<string, { label: string; description: string }> = {
  MANAGE_USERS: { label: 'إدارة المستخدمين', description: 'إضافة وتعديل وحذف المستخدمين' },
  BLOCK_USERS: { label: 'حظر المستخدمين', description: 'حظر وإلغاء حظر حسابات المستخدمين' },
  VIEW_USER_DETAILS: { label: 'عرض تفاصيل المستخدمين', description: 'الوصول إلى معلومات المستخدمين الكاملة' },
  KYC_REVIEW: { label: 'مراجعة توثيق الهوية', description: 'مراجعة طلبات توثيق الهوية' },
  KYC_APPROVE: { label: 'الموافقة على KYC', description: 'الموافقة على طلبات التوثيق' },
  KYC_REJECT: { label: 'رفض KYC', description: 'رفض طلبات التوثيق' },
  TRANSACTION_APPROVAL: { label: 'الموافقة على المعاملات', description: 'الموافقة على المعاملات المعلقة' },
  VIEW_TRANSACTIONS: { label: 'عرض المعاملات', description: 'الوصول إلى سجل المعاملات' },
  CANCEL_TRANSACTIONS: { label: 'إلغاء المعاملات', description: 'إلغاء المعاملات النشطة' },
  COMPLIANCE_DASHBOARD: { label: 'لوحة الامتثال', description: 'الوصول إلى لوحة معلومات الامتثال' },
  AML_MONITORING: { label: 'مراقبة AML', description: 'مراقبة الأنشطة المشبوهة' },
  GENERATE_REPORTS: { label: 'إنشاء التقارير', description: 'إنشاء تقارير الامتثال' },
  MANAGE_AGENTS: { label: 'إدارة الوكلاء', description: 'إضافة وتعديل الوكلاء' },
  APPROVE_AGENTS: { label: 'الموافقة على الوكلاء', description: 'الموافقة على طلبات الوكلاء' },
  SUSPEND_AGENTS: { label: 'تعليق الوكلاء', description: 'تعليق وتفعيل حسابات الوكلاء' },
  VIEW_REPORTS: { label: 'عرض التقارير', description: 'الوصول إلى التقارير' },
  EXPORT_REPORTS: { label: 'تصدير التقارير', description: 'تصدير التقارير بصيغ مختلفة' },
  SCHEDULE_REPORTS: { label: 'جدولة التقارير', description: 'جدولة التقارير الدورية' },
  SYSTEM_SETTINGS: { label: 'إعدادات النظام', description: 'تعديل إعدادات النظام العامة' },
  MANAGE_ADMINS: { label: 'إدارة المشرفين', description: 'إضافة وتعديل المشرفين' },
  MANAGE_ROLES: { label: 'إدارة الصلاحيات', description: 'تعديل صلاحيات الأدوار' },
  SECURITY_SETTINGS: { label: 'إعدادات الأمان', description: 'إدارة إعدادات الأمان والحماية' }
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'مدير عام',
  ADMIN: 'مشرف',
  COMPLIANCE: 'مسؤول امتثال',
  COMPLIANCE_OFFICER: 'مسؤول امتثال',
  SUPPORT: 'دعم فني',
  SUPPORT_AGENT: 'دعم فني',
  CASH_AGENT: 'وكيل نقدي'
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'purple',
  ADMIN: 'indigo',
  COMPLIANCE: 'orange',
  COMPLIANCE_OFFICER: 'orange',
  SUPPORT: 'blue',
  SUPPORT_AGENT: 'blue',
  CASH_AGENT: 'emerald'
};

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin-management/roles');
      const rolesData = response.data.data.roles || [];
      setRoles(rolesData);
      
      if (rolesData.length > 0 && !selectedRole) {
        setSelectedRole(rolesData[0].role);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل تحميل الأدوار');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentRole = () => {
    return roles.find(r => r.role === selectedRole);
  };

  const togglePermission = (permission: string) => {
    setRoles(prevRoles =>
      prevRoles.map(role => {
        if (role.role === selectedRole) {
          return {
            ...role,
            permissions: role.permissions.map(p =>
              p.permission === permission ? { ...p, enabled: !p.enabled } : p
            )
          };
        }
        return role;
      })
    );
  };

  const saveRole = async () => {
    const role = getCurrentRole();
    if (!role) return;

    try {
      setSaving(true);
      await api.put(`/admin-management/roles/${role.role}/permissions`, {
        permissions: role.permissions
      });
      alert('تم حفظ الصلاحيات بنجاح');
    } catch (error) {
      alert('فشل حفظ الصلاحيات');
    } finally {
      setSaving(false);
    }
  };

  const currentRole = getCurrentRole();
  const enabledCount = currentRole?.permissions.filter(p => p.enabled).length || 0;
  const totalCount = currentRole?.permissions.length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Modern Header */}
        <Card padding="lg" className="bg-gradient-to-br from-indigo-600 to-purple-700 border-0 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">إدارة الصلاحيات</h1>
                <p className="text-indigo-100">تكوين صلاحيات الأدوار المختلفة في النظام</p>
              </div>
            </div>
            <Button
              onClick={saveRole}
              disabled={saving || !currentRole}
              variant="secondary"
              size="lg"
              loading={saving}
              icon={<Save className="w-5 h-5" />}
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <CardContent>
              <p className="text-red-700 dark:text-red-400 text-center font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Loading text="جاري تحميل الأدوار..." />
        ) : roles.length === 0 ? (
          <Card padding="lg" className="text-center">
            <div className="py-12">
              <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">لا توجد أدوار</h3>
              <p className="text-slate-600 dark:text-slate-400">لم يتم العثور على أي أدوار في النظام</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar - Roles List */}
            <div className="col-span-12 lg:col-span-3">
              <Card padding="md" className="sticky top-6">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-indigo-600" />
                    <CardTitle className="text-lg">الأدوار</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {roles.map((role) => {
                      const isSelected = selectedRole === role.role;
                      const roleColor = roleColors[role.role] || 'indigo';
                      
                      return (
                        <button
                          key={role.role}
                          onClick={() => setSelectedRole(role.role)}
                          className={`
                            w-full text-right px-4 py-3.5 rounded-xl font-medium 
                            transition-all duration-200
                            ${isSelected
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span>{roleLabels[role.role] || role.role}</span>
                            {isSelected && <Sparkles className="w-4 h-4" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Permissions */}
            <div className="col-span-12 lg:col-span-9">
              {currentRole && (
                <Card padding="lg">
                  {/* Role Header */}
                  <CardHeader>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-2xl">
                            {roleLabels[currentRole.role] || currentRole.role}
                          </CardTitle>
                          <Badge variant={roleColors[currentRole.role] as any || 'indigo'} size="lg">
                            {currentRole.role}
                          </Badge>
                        </div>
                        <CardDescription>
                          قم بتفعيل أو تعطيل الصلاحيات المتاحة لهذا الدور
                        </CardDescription>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-indigo-600 en-digits">{formatNumber(enabledCount)}/{formatNumber(totalCount)}</div>
                        <div className="text-sm text-slate-500">صلاحية مفعلة</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(permissionGroups).map(([key, group]) => {
                        const Icon = group.icon;
                        const groupPermissions = currentRole.permissions.filter(p => 
                          group.permissions.includes(p.permission)
                        );
                        
                        if (groupPermissions.length === 0) return null;

                        const enabledInGroup = groupPermissions.filter(p => p.enabled).length;
                        
                        return (
                          <Card key={key} padding="md" hover className="border-2">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{group.title}</h4>
                                  <p className="text-sm text-slate-500"><span className="en-digits">{formatNumber(enabledInGroup)}</span> من <span className="en-digits">{formatNumber(groupPermissions.length)}</span> مفعلة</p>
                                </div>
                              </div>
                              <Badge variant={enabledInGroup === groupPermissions.length ? 'success' : 'default'}>
                                <span className="en-digits">{Math.round((enabledInGroup / groupPermissions.length) * 100)}%</span>
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {groupPermissions.map((perm) => {
                                const permInfo = permissionLabels[perm.permission];
                                if (!permInfo) return null;

                                return (
                                  <div
                                    key={perm.permission}
                                    className="relative group"
                                    onMouseEnter={() => setShowTooltip(perm.permission)}
                                    onMouseLeave={() => setShowTooltip(null)}
                                  >
                                    <label
                                      className={`
                                        flex items-center gap-3 p-4 rounded-xl cursor-pointer
                                        transition-all duration-200 border-2
                                        ${perm.enabled
                                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }
                                      `}
                                    >
                                      {/* Custom Toggle Switch */}
                                      <div className="relative flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={perm.enabled}
                                          onChange={() => togglePermission(perm.permission)}
                                          className="sr-only peer"
                                        />
                                        <div className={`
                                          w-11 h-6 rounded-full transition-colors
                                          ${perm.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}
                                        `}>
                                          <div className={`
                                            w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5
                                            ${perm.enabled ? 'translate-x-5.5' : 'translate-x-0.5'}
                                          `} />
                                        </div>
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-sm font-medium truncate ${
                                            perm.enabled 
                                              ? 'text-indigo-700 dark:text-indigo-400' 
                                              : 'text-slate-700 dark:text-slate-300'
                                          }`}>
                                            {permInfo.label}
                                          </span>
                                          {perm.enabled && <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                                        </div>
                                      </div>

                                      <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    </label>

                                    {/* Tooltip */}
                                    {showTooltip === perm.permission && (
                                      <div className="absolute z-10 bottom-full left-0 mb-2 w-64 animate-fadeIn">
                                        <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl">
                                          {permInfo.description}
                                          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900" />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
