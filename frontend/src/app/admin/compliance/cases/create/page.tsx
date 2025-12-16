'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CreditCard, AlertTriangle, X, Check } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  _count: {
    transactions: number;
  };
}

interface Transaction {
  id: number;
  transactionRef: string;
  amountSent: number;
  recipientName: string;
  status: string;
  createdAt: string;
}

export default function CreateAMLCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    transactionId: '',
    caseType: 'SUSPICIOUS',
    severity: 'MEDIUM',
    title: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showTransactionDropdown, setShowTransactionDropdown] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
      if (!target.closest('.transaction-dropdown-container')) {
        setShowTransactionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch initial users and when search query changes
  useEffect(() => {
    if (userSearchQuery.length >= 2) {
      fetchUsers();
    } else if (userSearchQuery.length === 0 && showUserDropdown) {
      // Show initial list of users when no search query but dropdown is open
      fetchInitialUsers();
    } else if (userSearchQuery.length > 0 && userSearchQuery.length < 2) {
      setAllUsers([]);
    }
  }, [userSearchQuery, showUserDropdown]);

  // Fetch initial users on component mount
  useEffect(() => {
    fetchInitialUsers();
  }, []);

  // Fetch user transactions when user is selected
  useEffect(() => {
    if (formData.userId) {
      fetchUserTransactions(parseInt(formData.userId));
    } else {
      setUserTransactions([]);
      setSelectedTransaction(null);
    }
  }, [formData.userId]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoadingUsers(true);
      const response = await api.get(`/admin/users?search=${userSearchQuery}&limit=20&page=${page}&status=active`);
      
      if (page === 1) {
        setAllUsers(response.data.data.users || []);
      } else {
        setAllUsers(prev => [...prev, ...(response.data.data.users || [])]);
      }
      
      setHasMoreUsers((response.data.data.users || []).length === 20);
      setShowUserDropdown(true);
    } catch (err) {
      // Silent error handling
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchInitialUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get('/admin/users?limit=20&page=1&status=active');
      setAllUsers(response.data.data.users || []);
      setHasMoreUsers((response.data.data.users || []).length === 20);
    } catch (err) {
      // Silent error handling
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchUserTransactions = async (userId: number) => {
    try {
      setLoadingTransactions(true);
      const response = await api.get(`/admin/users/${userId}/transactions?limit=50`);
      setUserTransactions(response.data.data.transactions || []);
    } catch (err) {
      setUserTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.title) {
      setError('المستخدم وعنوان القضية مطلوبان');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const payload = {
        userId: parseInt(formData.userId),
        transactionId: formData.transactionId ? parseInt(formData.transactionId) : undefined,
        caseType: formData.caseType,
        severity: formData.severity,
        title: formData.title,
        description: formData.description,
        suspendUser: true // Always suspend user when creating AML case
      };

      const response = await api.post('/compliance/aml-cases', payload);
      
      if (response.data.success) {
        setSuccess('تم إنشاء قضية مكافحة غسل الأموال بنجاح. تم تعليق حساب المستخدم وإرسال إشعار بالبريد الإلكتروني.');
        setTimeout(() => {
          router.push('/admin/compliance/cases');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في إنشاء قضية مكافحة غسل الأموال');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setFormData(prev => ({
      ...prev,
      userId: user.id.toString(),
      transactionId: '' // Reset transaction selection
    }));
    setUserSearchQuery(user.fullName);
    setShowUserDropdown(false);
    setSelectedTransaction(null);
  };

  const handleTransactionSelect = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormData(prev => ({
      ...prev,
      transactionId: transaction.id.toString()
    }));
    setTransactionSearchQuery(transaction.transactionRef);
    setShowTransactionDropdown(false);
  };

  const clearUserSelection = () => {
    setSelectedUser(null);
    setUserSearchQuery('');
    setFormData(prev => ({
      ...prev,
      userId: '',
      transactionId: ''
    }));
    setUserTransactions([]);
    setSelectedTransaction(null);
  };

  const clearTransactionSelection = () => {
    setSelectedTransaction(null);
    setTransactionSearchQuery('');
    setFormData(prev => ({
      ...prev,
      transactionId: ''
    }));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCountryName = (code: string) => {
    const countries: Record<string, string> = {
      'SD': 'السودان',
      'SA': 'السعودية', 
      'AE': 'الإمارات',
      'EG': 'مصر',
      'IN': 'الهند',
    };
    return countries[code] || code;
  };



  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">إنشاء قضية مكافحة غسل الأموال</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">إنشاء قضية تحقيق جديدة لمكافحة غسل الأموال وتمويل الإرهاب</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            ← العودة
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* User Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  اختيار المستخدم *
                </label>
                
                {/* Selected User Display */}
                {selectedUser ? (
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {selectedUser.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{selectedUser.fullName}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              الهاتف: {selectedUser.phone}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              الدولة: {getCountryName(selectedUser.country)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              المعاملات: {selectedUser._count.transactions}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={clearUserSelection}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative user-dropdown-container">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        onFocus={() => setShowUserDropdown(true)}
                        className="w-full pr-10 pl-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:text-slate-100 placeholder-slate-400"
                        placeholder="ابحث عن المستخدم بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                      />
                    </div>
                    
                    {/* Users Dropdown */}
                    {showUserDropdown && allUsers.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-80 overflow-hidden">
                        <div className="max-h-80 overflow-y-auto">
                          {allUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => handleUserSelect(user)}
                              className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                    {user.fullName.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{user.fullName}</p>
                                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                      #{user.id}
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                      {user.phone}
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                      {user._count.transactions} معاملة
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {user.isVerified && (
                                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                    </div>
                                  )}
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                                    user.isActive 
                                      ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800' 
                                      : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800'
                                  }`}>
                                    {user.isActive ? 'نشط' : 'محظور'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {hasMoreUsers && (
                            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                              <button
                                onClick={() => {
                                  setUserPage(prev => prev + 1);
                                  fetchUsers(userPage + 1);
                                }}
                                disabled={loadingUsers}
                                className="w-full text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50"
                              >
                                {loadingUsers ? 'جاري التحميل...' : 'تحميل المزيد'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {loadingUsers && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm text-slate-500 dark:text-slate-400">جاري البحث عن المستخدمين...</span>
                        </div>
                      </div>
                    )}
                    
                    {userSearchQuery.length >= 2 && !loadingUsers && allUsers.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">لا يوجد مستخدمين مطابقين للبحث</p>
                      </div>
                    )}
                    
                    {showUserDropdown && !loadingUsers && allUsers.length === 0 && userSearchQuery.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">جاري تحميل المستخدمين...</p>
                      </div>
                    )}
                  </div>
                )}
                
                {userSearchQuery.length > 0 && userSearchQuery.length < 2 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">أدخل حرفين على الأقل للبحث</p>
                )}
                
                {!selectedUser && allUsers.length > 0 && userSearchQuery.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    يوجد {allUsers.length} مستخدم متاح. انقر في حقل البحث لعرض القائمة.
                  </p>
                )}
              </div>
            </div>

            {/* Transaction Selection */}
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    اختيار المعاملة (اختياري)
                  </label>
                  
                  {/* Selected Transaction Display */}
                  {selectedTransaction ? (
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{selectedTransaction.transactionRef}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">إلى: {selectedTransaction.recipientName}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                المبلغ: ${selectedTransaction.amountSent}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(selectedTransaction.status)}`}>
                                {selectedTransaction.status}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(selectedTransaction.createdAt).toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={clearTransactionSelection}
                          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative transaction-dropdown-container">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={transactionSearchQuery}
                          onChange={(e) => {
                            setTransactionSearchQuery(e.target.value);
                            setShowTransactionDropdown(e.target.value.length > 0);
                          }}
                          onFocus={() => setShowTransactionDropdown(true)}
                          className="w-full pr-10 pl-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:text-slate-100 placeholder-slate-400"
                          placeholder="ابحث في المعاملات برقم المرجع أو اسم المستلم..."
                        />
                      </div>
                      
                      {/* Transactions Dropdown */}
                      {showTransactionDropdown && (transactionSearchQuery || userTransactions.length > 0) && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-hidden">
                          <div className="max-h-60 overflow-y-auto">
                            {userTransactions
                              .filter(transaction => {
                                if (!transactionSearchQuery) return true; // Show all transactions when no search
                                return transaction.transactionRef.toLowerCase().includes(transactionSearchQuery.toLowerCase()) ||
                                       transaction.recipientName.toLowerCase().includes(transactionSearchQuery.toLowerCase());
                              })
                              .map((transaction) => (
                                <div
                                  key={transaction.id}
                                  onClick={() => handleTransactionSelect(transaction)}
                                  className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 dark:text-slate-100">{transaction.transactionRef}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">إلى: {transaction.recipientName}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                          {new Date(transaction.createdAt).toLocaleDateString('ar-SA')}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">${transaction.amountSent}</p>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(transaction.status)}`}>
                                        {transaction.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      
                      {loadingTransactions && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-slate-500 dark:text-slate-400">جاري تحميل المعاملات...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Transactions List */}
                {!selectedTransaction && !transactionSearchQuery && userTransactions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      معاملات المستخدم الأخيرة
                    </label>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        {userTransactions.slice(0, 10).map((transaction, index) => (
                          <div
                            key={transaction.id}
                            onClick={() => handleTransactionSelect(transaction)}
                            className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors ${
                              index !== userTransactions.slice(0, 10).length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{transaction.transactionRef}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">إلى: {transaction.recipientName}</p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500">
                                    {new Date(transaction.createdAt).toLocaleDateString('ar-SA')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">${transaction.amountSent}</p>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(transaction.status)}`}>
                                  {transaction.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {userTransactions.length > 10 && (
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 border-t border-slate-100 dark:border-slate-600 text-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            عرض 10 من أصل {userTransactions.length} معاملة
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {!loadingTransactions && userTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">لا توجد معاملات لهذا المستخدم</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Case Type */}
              <div>
                <label htmlFor="caseType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  نوع القضية
                </label>
                <select
                  id="caseType"
                  name="caseType"
                  value={formData.caseType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="VELOCITY">معاملات سريعة</option>
                  <option value="STRUCTURING">تجزئة المبالغ</option>
                  <option value="HIGH_RISK">عالي المخاطر</option>
                  <option value="SUSPICIOUS">نشاط مشبوه</option>
                  <option value="FRAUD">احتيال</option>
                </select>
              </div>

              {/* Severity */}
              <div>
                <label htmlFor="severity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  مستوى الخطورة
                </label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="LOW">منخفض</option>
                  <option value="MEDIUM">متوسط</option>
                  <option value="HIGH">عالي</option>
                  <option value="CRITICAL">حرج</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                عنوان القضية *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:text-slate-100 placeholder-slate-400"
                placeholder="أدخل عنوان القضية"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الوصف
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none"
                placeholder="أدخل وصف القضية والأنشطة المشبوهة المكتشفة"
              />
            </div>

            {/* Warning Message */}
            {selectedUser && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">تحذير: تعليق الحساب</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      سيتم تعليق حساب المستخدم <strong>{selectedUser.fullName}</strong> تلقائياً عند إنشاء هذه القضية.
                      سيتم إرسال إشعار بالبريد الإلكتروني للمستخدم بشأن تعليق الحساب.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading || !formData.userId || !formData.title}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    إنشاء القضية وتعليق الحساب
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}