// frontend/src/app/(admin)/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
// تم تضمين transactionAPI هنا لأنها تحتوي على دالة جلب العملات (getCurrencies)
import { adminAPI, authAPI, transactionAPI } from '@/lib/api'; 

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // 🛑 حالة نموذج تعديل أسعار الصرف (جديد)
  const [rateForm, setRateForm] = useState({
    fromCode: 'SDG',
    toCode: 'INR',
    rate: '',
    fee: ''
  });
  const [rateLoading, setRateLoading] = useState(false);
  const [currencies, setCurrencies] = useState<any[]>([]); // لتخزين العملات

  useEffect(() => {
    checkAdminAccess();
    loadDashboard();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (!response.success || response.data.role !== 'ADMIN') {
        alert('غير مصرح لك بالدخول');
        router.push('/dashboard');
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const loadDashboard = async () => {
    try {
      // 🛑 طلب جلب العملات مضاف إلى Promise.all
      const [statsRes, txRes, currenciesRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getAllTransactions(),
        transactionAPI.getCurrencies() // نفترض وجود هذه الدالة في transactionAPI
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (txRes.success) setTransactions(txRes.data.transactions);
      if (currenciesRes.success) setCurrencies(currenciesRes.data); // حفظ العملات المتاحة

    } catch (error) {
      console.error('Error loading dashboard:', error); 
    } finally {
      setLoading(false); 
    }
  };

  const loadTransactions = async (status?: string) => {
    try {
      const params = status ? { status } : {};
      const response = await adminAPI.getAllTransactions(params);
      if (response.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };


  // 🛑 الدالة الجديدة: معالجة تحديث سعر الصرف
  const handleRateUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Basic validation
      if (!rateForm.rate || !rateForm.fee) {
          alert('الرجاء إدخال سعر الصرف والعمولة.');
          return;
      }

      setRateLoading(true);

      try {
          const rate = parseFloat(rateForm.rate);
          const fee = parseFloat(rateForm.fee);

          // Check for NaN after parsing
          if (isNaN(rate) || isNaN(fee)) {
              alert('الرجاء إدخال قيم رقمية صالحة.');
              setRateLoading(false); // Stop loading
              return;
          }

          const response = await adminAPI.updateExchangeRate({
              fromCurrencyCode: rateForm.fromCode,
              toCurrencyCode: rateForm.toCode,
              rate: rate,
              adminFeePercent: fee
          });

          if (response.success) {
              alert('تم تحديث سعر الصرف بنجاح!');
              // إعادة تعيين النموذج بعد النجاح
              setRateForm({ fromCode: 'SDG', toCode: 'INR', rate: '', fee: '' }); 
              // loadDashboard(); // يمكن إعادة تحميل البيانات
          } else {
              alert(response.message || 'فشل التحديث.');
          }
      } catch (error) {
          alert('حدث خطأ أثناء تحديث سعر الصرف. تأكد من أن الخادم يعمل.');
      } finally {
          setRateLoading(false);
      }
  };

      const viewTransaction = async (id: number) => {
        try {
          // استخدام getById لجلب سجل واحد
          const response = await transactionAPI.getById(id);
          const tx = response.data;
    
          if (tx) {
            setSelectedTx(tx);
            setShowModal(true);
          }
        } catch (error) {
          alert('فشل تحميل التفاصيل');
        }
      };
      
      const handleApprove = async () => {
        if (!selectedTx) return;
        try {
          // 🛑 استدعاء API للموافقة
          const response = await adminAPI.approveTransaction(selectedTx.id, {});
          if (response.success) {
            alert('تمت الموافقة على المعاملة بنجاح.');
            setShowModal(false);
            loadDashboard(); // تحديث البيانات
          } else {
            alert(response.message || 'فشلت الموافقة.');
          }
        } catch (error) {
          alert('حدث خطأ. حاول مرة أخرى.');
        }
      };
    
      const handleReject = async () => {
        if (!selectedTx) return;
        const reason = prompt('الرجاء إدخال سبب الرفض:');
        if (reason) {
          try {
            // 🛑 استدعاء API للرفض
            const response = await adminAPI.rejectTransaction(selectedTx.id, { rejectionReason: reason });
            if (response.success) {
              alert('تم رفض المعاملة.');
              setShowModal(false);
              loadDashboard();
            } else {
              alert(response.message || 'فشل الرفض.');
            }
          } catch (error) {
            alert('حدث خطأ. حاول مرة أخرى.');
          }
        }
      };
    
      const handleComplete = async () => {
        if (!selectedTx) return;
        try {
          // 🛑 استدعاء API للإكمال
          const response = await adminAPI.completeTransaction(selectedTx.id, {});
          if (response.success) {
            alert('تم تعليم المعاملة كمكتملة.');
            setShowModal(false);
            loadDashboard();
          } else {
            alert(response.message || 'فشل الإكمال.');
          }
        } catch (error) {
          alert('حدث خطأ. حاول مرة أخرى.');
        }
      };
  const getStatusBadge = (status: string) => { /* ... الكود كما هو ... */ };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-indigo-600">لوحة تحكم الإدارة</h1>
              <nav className="flex gap-4">
                <Link href="/admin" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
                  Dashboard
                </Link>
                <Link href="/admin/users" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
                  Users
                </Link>
              </nav>
            </div>
            <button
              onClick={() => {
                authAPI.logout();
              }}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي المعاملات</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalTransactions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">قيد المراجعة</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.underReviewCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className className="text-sm text-gray-600">مكتملة</p>
                <p className="text-2xl font-bold text-green-600">{stats?.completedCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">المستخدمين</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🛑 نموذج تعديل أسعار الصرف (النموذج الجديد) */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">تعديل أسعار الصرف</h3>
            <form onSubmit={handleRateUpdate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                
                {/* من عملة */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">من</label>
                    <select name="fromCode" value={rateForm.fromCode} onChange={(e) => setRateForm({...rateForm, fromCode: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                        {/* استخدام العملات المجوبة من الـ API */}
                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                    </select>
                </div>

                {/* إلى عملة */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">إلى</label>
                    <select name="toCode" value={rateForm.toCode} onChange={(e) => setRateForm({...rateForm, toCode: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                        {/* استخدام العملات المجوبة من الـ API */}
                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                    </select>
                </div>
                
                {/* سعر الصرف (Rate) */}
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">السعر (Rate)</label>
                    <input type="number" name="rate" value={rateForm.rate} onChange={(e) => setRateForm({...rateForm, rate: e.target.value})} step="0.0001" placeholder="مثال: 0.025" required className="w-full px-3 py-2 border rounded-lg" />
                </div>

                {/* العمولة (Fee) */}
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">العمولة (%)</label>
                    <input type="number" name="fee" value={rateForm.fee} onChange={(e) => setRateForm({...rateForm, fee: e.target.value})} step="0.01" placeholder="مثال: 2.00" required className="w-full px-3 py-2 border rounded-lg" />
                </div>

                {/* زر التحديث */}
                <button type="submit" disabled={rateLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 rounded-lg">
                    {rateLoading ? 'جاري الحفظ...' : 'تحديث'}
                </button>

            </form>
        </div>


        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              loadTransactions(e.target.value);
            }}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">جميع الحالات</option>
            <option value="PENDING">قيد الانتظار</option>
            <option value="UNDER_REVIEW">قيد المراجعة</option>
            <option value="APPROVED">موافق عليها</option>
            <option value="COMPLETED">مكتملة</option>
            <option value="REJECTED">مرفوضة</option>
          </select>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">المعاملات</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المرجع</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المرسل</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستلم</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      لا توجد معاملات
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono font-medium">{tx.transactionRef}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>{tx.senderName}</div>
                        <div className="text-xs text-gray-500">{tx.senderPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{tx.recipientName}</div>
                        <div className="text-xs text-gray-500">{tx.recipientPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{tx.amountSent} {tx.fromCurrency.code}</div>
                        <div className="text-xs text-gray-500">
                          → {parseFloat(tx.amountReceived).toFixed(2)} {tx.toCurrency.code}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(tx.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => viewTransaction(tx.id)}
                          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                        >
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">تفاصيل المعاملة</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Transaction Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">المرجع</p>
                    <p className="font-mono font-bold">{selectedTx.transactionRef}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">الحالة</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedTx.status)}`}>
                      {selectedTx.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">المبلغ المرسل</p>
                    <p className="font-bold">{selectedTx.amountSent} {selectedTx.fromCurrency.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">المبلغ المستلم</p>
                    <p className="font-bold text-green-600">
                      {parseFloat(selectedTx.amountReceived).toFixed(2)} {selectedTx.toCurrency.code}
                    </p>
                  </div>
                </div>

                {/* Sender & Recipient */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">المرسل</h4>
                    <p className="text-sm text-gray-600">{selectedTx.senderName}</p>
                    <p className="text-sm text-gray-600">{selectedTx.senderPhone}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">المستلم</h4>
                    <p className="text-sm text-gray-600">{selectedTx.recipientName}</p>
                    <p className="text-sm text-gray-600">{selectedTx.recipientPhone}</p>
                  </div>
                </div>

                {/* Receipt */}
                {selectedTx.receiptFilePath && (
                  <div>
                    <h4 className="font-semibold mb-2">إيصال الدفع</h4>
                    <img
                      src={`http://localhost:5000/${selectedTx.receiptFilePath}`}
                      alt="Receipt"
                      className="max-w-full h-64 object-contain border rounded-lg"
                    />
                  </div>
                )}

                {/* Actions */}
                {selectedTx.status === 'UNDER_REVIEW' && (
                  <div className="flex gap-4">
                    <button
                      onClick={handleApprove}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg"
                    >
                      موافقة
                    </button>
                    <button
                      onClick={handleReject}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg"
                    >
                      رفض
                    </button>
                  </div>
                )}

                {selectedTx.status === 'APPROVED' && (
                  <button
                    onClick={handleComplete}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg"
                  >
                    تعليم كمكتمل
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}