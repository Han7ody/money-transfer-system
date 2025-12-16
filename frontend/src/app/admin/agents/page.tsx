'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, Button, Badge, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, ModalContent, ModalFooter } from '@/components/ui';
import { Loading } from '@/components/ui/Spinner';
import { adminAPI } from '@/lib/api';
import { Plus, Search, User, Phone, MapPin, Eye, Ban, CheckCircle, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/formatters';

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

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'create'>('view');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAgents();
  }, [page, statusFilter]);

  const fetchAgents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllAgents({
        search: searchQuery || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        limit: 20
      });
      setAgents(response.data.agents);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل تحميل الوكلاء');
      console.error('Fetch agents error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchAgents();
  };

  const handleStatusChange = async (agentId: number, newStatus: string) => {
    try {
      await adminAPI.updateAgentStatus(agentId, newStatus);
      fetchAgents();
      alert('تم تحديث حالة الوكيل بنجاح');
    } catch (err) {
      alert('فشل تحديث حالة الوكيل');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      ACTIVE: { variant: 'success', label: 'نشط' },
      PENDING: { variant: 'warning', label: 'قيد المراجعة' },
      SUSPENDED: { variant: 'error', label: 'معلق' },
      INACTIVE: { variant: 'default', label: 'غير نشط' }
    };
    const config = statusConfig[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant} dot>{config.label}</Badge>;
  };

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'ACTIVE').length,
    pending: agents.filter(a => a.status === 'PENDING').length,
    suspended: agents.filter(a => a.status === 'SUSPENDED').length
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <Card padding="lg" className="bg-gradient-to-br from-emerald-600 to-teal-700 border-0 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">إدارة الوكلاء</h1>
                <p className="text-emerald-100">إدارة وكلاء الاستلام النقدي</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setModalType('create');
                setShowModal(true);
              }}
              variant="secondary"
              size="lg"
              icon={<Plus className="w-5 h-5" />}
            >
              إضافة وكيل جديد
            </Button>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card hover padding="lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي الوكلاء</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 en-digits">{formatNumber(stats.total)}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 en-digits">{formatNumber(stats.active)}</p>
              </div>
            </div>
          </Card>
          <Card hover padding="lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">قيد المراجعة</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 en-digits">{formatNumber(stats.pending)}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 en-digits">{formatNumber(stats.suspended)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="md">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="البحث بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">جميع الحالات</option>
                <option value="ACTIVE">نشط</option>
                <option value="PENDING">قيد المراجعة</option>
                <option value="SUSPENDED">معلق</option>
              </select>
              <Button onClick={handleSearch} variant="primary" icon={<Search className="w-4 h-4" />}>
                بحث
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <CardContent>
              <p className="text-red-700 dark:text-red-400 text-center font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Agents Table */}
        <Card>
          {loading ? (
            <Loading text="جاري تحميل الوكلاء..." />
          ) : agents.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">لا يوجد وكلاء</h3>
              <p className="text-slate-600 dark:text-slate-400">لم يتم العثور على أي وكلاء</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow hover={false}>
                  <TableHead>الاسم</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المعاملات النشطة</TableHead>
                  <TableHead>إجمالي المعاملات</TableHead>
                  <TableHead>الحد اليومي</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{agent.fullName}</div>
                          <div className="text-sm text-slate-500 en-digits">#{formatNumber(agent.id)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 en-digits">
                        <Phone className="w-4 h-4" />
                        {agent.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4" />
                        {agent.city}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(agent.status)}</TableCell>
                    <TableCell>
                      <Badge variant="info"><span className="en-digits">{formatNumber(agent.activeTransactions)}</span></Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-slate-900 dark:text-slate-100 en-digits">{formatNumber(agent.totalTransactions)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-slate-900 dark:text-slate-100 en-digits">
                          {formatNumber(agent.currentDailyAmount)} / {formatNumber(agent.maxDailyAmount)}
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${(agent.currentDailyAmount / agent.maxDailyAmount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setSelectedAgent(agent);
                            setModalType('view');
                            setShowModal(true);
                          }}
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                        >
                          عرض
                        </Button>
                        {agent.status === 'ACTIVE' ? (
                          <Button
                            onClick={() => handleStatusChange(agent.id, 'SUSPENDED')}
                            variant="ghost"
                            size="sm"
                            icon={<Ban className="w-4 h-4" />}
                            className="text-red-600 hover:bg-red-50"
                          >
                            تعليق
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleStatusChange(agent.id, 'ACTIVE')}
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

        {/* Agent Details Modal */}
        <Modal
          isOpen={showModal && modalType === 'view' && !!selectedAgent}
          onClose={() => setShowModal(false)}
          title="تفاصيل الوكيل"
          size="lg"
        >
          <ModalContent>
            {selectedAgent && (
              <div className="space-y-6">
                {/* Agent Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">الاسم الكامل</label>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedAgent.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">رقم الهاتف</label>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 en-digits">{selectedAgent.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">المدينة</label>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedAgent.city}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">الحالة</label>
                    <div className="mt-1">{getStatusBadge(selectedAgent.status)}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card padding="md" className="text-center">
                    <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 en-digits">{formatNumber(selectedAgent.totalTransactions)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">إجمالي المعاملات</p>
                  </Card>
                  <Card padding="md" className="text-center">
                    <Activity className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 en-digits">{formatNumber(selectedAgent.activeTransactions)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">معاملات نشطة</p>
                  </Card>
                  <Card padding="md" className="text-center">
                    <DollarSign className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 en-digits">{formatNumber(selectedAgent.currentDailyAmount)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">المبلغ اليومي</p>
                  </Card>
                </div>
              </div>
            )}
          </ModalContent>
          <ModalFooter>
            <Button variant="primary" onClick={() => setShowModal(false)}>
              إغلاق
            </Button>
          </ModalFooter>
        </Modal>

        {/* Create Agent Modal */}
        <Modal
          isOpen={showModal && modalType === 'create'}
          onClose={() => setShowModal(false)}
          title="إضافة وكيل جديد"
          size="md"
        >
          <ModalContent>
            <div className="space-y-4">
              <Input label="الاسم الكامل" placeholder="أدخل الاسم الكامل" icon={<User className="w-4 h-4" />} />
              <Input label="رقم الهاتف" placeholder="+966xxxxxxxxx" icon={<Phone className="w-4 h-4" />} />
              <Input label="المدينة" placeholder="الرياض" icon={<MapPin className="w-4 h-4" />} />
              <Input label="الحد اليومي" type="number" placeholder="50000" icon={<DollarSign className="w-4 h-4" />} />
            </div>
          </ModalContent>
          <ModalFooter>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                إلغاء
              </Button>
              <Button variant="primary">
                إضافة
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      </div>
    </AdminLayout>
  );
}
