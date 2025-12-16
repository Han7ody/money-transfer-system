'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Input, Modal, ModalContent, ModalFooter, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { Loading } from '@/components/ui/Spinner';
import api from '@/lib/api';
import { Users, Plus, Key, Ban, CheckCircle, Copy, RefreshCw, Mail, Phone, User, Shield } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/formatters';

interface Admin {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  role_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'reset'>('create');
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'ADMIN',
    username: '',
    password: ''
  });
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [resetReason, setResetReason] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async (bustCache = false) => {
    try {
      setLoading(true);
      const url = bustCache 
        ? `/admin-management/admins?_t=${Date.now()}`
        : '/admin-management/admins';
      const response = await api.get(url);
      setAdmins(response.data.data.admins || []);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCredentials = async (type: 'username' | 'password' | 'both') => {
    try {
      const response = await api.get('/admin-management/admins/generate-credentials?type=admin');
      if (type === 'username' || type === 'both') {
        setFormData(prev => ({ ...prev, username: response.data.data.username }));
      }
      if (type === 'password' || type === 'both') {
        setFormData(prev => ({ ...prev, password: response.data.data.password }));
      }
    } catch (error) {
      console.error('Failed to generate credentials:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const roleMap: Record<string, number> = {
        'SUPER_ADMIN': 1,
        'ADMIN': 2,
        'COMPLIANCE': 3,
        'SUPPORT': 4
      };

      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        roleId: roleMap[formData.role] || 2,
        username: formData.username,
        password: formData.password,
        isActive: true
      };

      const response = await api.post('/admin-management/admins', payload);
      setCredentials(response.data.data.credentials);
      await fetchAdmins(true);
      setShowModal(false);
      alert('تم إنشاء المشرف بنجاح');
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل إنشاء المشرف');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedAdmin) return;
    try {
      const response = await api.put(`/admin-management/admins/${selectedAdmin.id}/reset-password`, {
        reason: resetReason
      });
      setCredentials({ username: selectedAdmin.username, password: response.data.data.newPassword });
      alert('تم إعادة تعيين كلمة المرور بنجاح');
      setShowModal(false);
    } catch (error) {
      alert('فشل إعادة تعيين كلمة المرور');
    }
  };

  const handleSuspend = async (admin: Admin) => {
    if (!confirm('هل أنت متأكد من تعليق هذا المشرف؟')) return;
    try {
      await api.put(`/admin-management/admins/${admin.id}/suspend`, { reason: 'Admin action' });
      await fetchAdmins(true);
      alert('تم تعليق المشرف بنجاح');
    } catch (error) {
      alert('فشل تعليق المشرف');
    }
  };

  const handleActivate = async (admin: Admin) => {
    try {
      await api.put(`/admin-management/admins/${admin.id}/activate`);
      await fetchAdmins(true);
      alert('تم تفعيل المشرف بنجاح');
    } catch (error) {
      alert('فشل تفعيل المشرف');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('تم النسخ');
  };

  const getRoleBadge = (roleName: string) => {
    const roleConfig: Record<string, { variant: any; label: string }> = {
      SUPER_ADMIN: { variant: 'purple', label: 'مدير عام' },
      ADMIN: { variant: 'indigo', label: 'مشرف' },
      COMPLIANCE: { variant: 'warning', label: 'امتثال' },
      COMPLIANCE_OFFICER: { variant: 'warning', label: 'امتثال' },
      SUPPORT: { variant: 'info', label: 'دعم' },
      SUPPORT_AGENT: { variant: 'info', label: 'دعم' }
    };
    const config = roleConfig[roleName] || { variant: 'default', label: roleName };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const openCreateModal = () => {
    setModalType('create');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'ADMIN',
      username: '',
      password: ''
    });
    setShowModal(true);
  };

  const openResetModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setModalType('reset');
    setResetReason('');
    setShowModal(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <Card padding="lg" className="bg-gradient-to-br from-indigo-600 to-indigo-700 border-0 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">إدارة المشرفين</h1>
                <p className="text-indigo-100">إدارة حسابات المشرفين والصلاحيات</p>
              </div>
            </div>
            <Button
              onClick={openCreateModal}
              variant="secondary"
              size="lg"
              icon={<Plus className="w-5 h-5" />}
            >
              إضافة مشرف جديد
            </Button>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover padding="lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي المشرفين</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 en-digits">{formatNumber(admins.length)}</p>
              </div>
            </div>
          </Card>
          <Card hover padding="lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">نشط</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 en-digits">
                  {formatNumber(admins.filter(a => a.status === 'ACTIVE').length)}
                </p>
              </div>
            </div>
          </Card>
          <Card hover padding="lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">معلق</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 en-digits">
                  {formatNumber(admins.filter(a => a.status !== 'ACTIVE').length)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Admins Table */}
        <Card>
          {loading ? (
            <Loading text="جاري تحميل المشرفين..." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow hover={false}>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{admin.full_name}</div>
                        <div className="text-sm text-slate-500 en-text">{admin.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 en-text">
                        <Mail className="w-4 h-4" />
                        {admin.email}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(admin.role_name || admin.role)}</TableCell>
                    <TableCell>
                      {admin.status === 'ACTIVE' ? (
                        <Badge variant="success" dot>نشط</Badge>
                      ) : (
                        <Badge variant="error" dot>معلق</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 en-digits">
                      {formatDate(admin.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => openResetModal(admin)}
                          variant="ghost"
                          size="sm"
                          icon={<Key className="w-4 h-4" />}
                        >
                          إعادة تعيين
                        </Button>
                        {admin.status === 'ACTIVE' ? (
                          <Button
                            onClick={() => handleSuspend(admin)}
                            variant="ghost"
                            size="sm"
                            icon={<Ban className="w-4 h-4" />}
                            className="text-red-600 hover:bg-red-50"
                          >
                            تعليق
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleActivate(admin)}
                            variant="ghost"
                            size="sm"
                            icon={<CheckCircle className="w-4 h-4" />}
                            className="text-emerald-600 hover:bg-emerald-50"
                          >
                            تفعيل
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Create/Reset Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalType === 'create' ? 'إضافة مشرف جديد' : 'إعادة تعيين كلمة المرور'}
          size="md"
        >
          <ModalContent>
            {modalType === 'create' ? (
              <div className="space-y-4">
                <Input
                  label="الاسم الكامل"
                  placeholder="أدخل الاسم الكامل"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  icon={<User className="w-4 h-4" />}
                />
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  icon={<Mail className="w-4 h-4" />}
                />
                <Input
                  label="رقم الهاتف"
                  type="tel"
                  placeholder="+966xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  icon={<Phone className="w-4 h-4" />}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    الدور
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ADMIN">مشرف</option>
                    <option value="SUPER_ADMIN">مدير عام</option>
                    <option value="COMPLIANCE">امتثال</option>
                    <option value="SUPPORT">دعم</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Input
                    label="اسم المستخدم"
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => generateCredentials('username')}
                    variant="outline"
                    size="md"
                    icon={<RefreshCw className="w-4 h-4" />}
                    className="mt-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    label="كلمة المرور"
                    type="text"
                    placeholder="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => generateCredentials('password')}
                    variant="outline"
                    size="md"
                    icon={<RefreshCw className="w-4 h-4" />}
                    className="mt-8"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  السبب (اختياري)
                </label>
                <textarea
                  placeholder="أدخل سبب إعادة التعيين..."
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                />
              </div>
            )}
          </ModalContent>
          <ModalFooter>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={modalType === 'create' ? handleCreate : handleResetPassword}
              >
                {modalType === 'create' ? 'إنشاء' : 'إعادة تعيين'}
              </Button>
            </div>
          </ModalFooter>
        </Modal>

        {/* Credentials Display Modal */}
        <Modal
          isOpen={!!credentials}
          onClose={() => setCredentials(null)}
          title="بيانات الدخول"
          size="sm"
        >
          <ModalContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="flex-1 font-mono text-slate-900 dark:text-slate-100 en-text">{credentials?.username}</span>
                <Button
                  onClick={() => copyToClipboard(credentials?.username || '')}
                  variant="ghost"
                  size="sm"
                  icon={<Copy className="w-4 h-4" />}
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="flex-1 font-mono text-slate-900 dark:text-slate-100 en-text">{credentials?.password}</span>
                <Button
                  onClick={() => copyToClipboard(credentials?.password || '')}
                  variant="ghost"
                  size="sm"
                  icon={<Copy className="w-4 h-4" />}
                />
              </div>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button variant="primary" onClick={() => setCredentials(null)} className="w-full">
              إغلاق
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </AdminLayout>
  );
}
