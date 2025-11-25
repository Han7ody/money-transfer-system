// frontend/src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't override Content-Type for FormData (let browser set it with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect during registration flow
      const isRegistrationRoute = window.location.pathname.startsWith('/register');
      if (!isRegistrationRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================

export const authAPI = {
  // Step 1: Register with email/password
  register: async (data: {
    fullName: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post('/auth/register', data);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Step 1B: Verify registration OTP
  verifyRegistrationOtp: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-registration-otp', { email, otp });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  // Resend OTP during registration
  resendOtp: async (email: string) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  // Step 2: Update profile
  updateProfile: async (data: {
    phone: string;
    country: string;
    city: string;
    dateOfBirth: string;
    nationality: string;
  }) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // Step 3: Upload KYC documents
  uploadKycDocuments: async (files: {
    idFront: File;
    idBack: File;
    selfie: File;
  }) => {
    const formData = new FormData();
    formData.append('idFront', files.idFront);
    formData.append('idBack', files.idBack);
    formData.append('selfie', files.selfie);

    // Don't set Content-Type manually - let axios set it with boundary
    const response = await api.post('/kyc/upload', formData);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  sendVerificationOtp: async () => {
    const response = await api.post('/auth/send-verification-otp');
    return response.data;
  },

  verifyOtp: async (otp: string) => {
    const response = await api.post('/auth/verify-otp', { otp });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data: {
    token: string;
    newPassword: string;
  }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
};

// ==================== TRANSACTION API ====================

export const transactionAPI = {
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  uploadReceipt: async (transactionId: number, file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    
    const response = await api.post(
      `/transactions/${transactionId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  cancel: async (id: number) => {
    const response = await api.post(`/transactions/${id}/cancel`);
    return response.data;
  },

  getExchangeRate: async (from: string, to: string) => {
    const response = await api.get('/exchange-rate', { params: { from, to } });
    return response.data;
  },

  // 🛑 الدالة المضافة لجلب العملات (مطلوبة في Admin Dashboard)
  getCurrencies: async () => {
    // نستخدم مسار Admin لأنه يتطلب صلاحية جلب العملات كلها
    const response = await api.get('/api/currencies');
    return response.data;
  }
};

// ==================== ADMIN API ====================

export const adminAPI = {
  getAllTransactions: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await api.get('/api/transactions', { params });
    return response.data;
  },

  getTransactionById: async (id: string) => {
    const response = await api.get(`/api/transactions/${id}`);
    return response.data;
  },

  approveTransaction: async (id: number, data: {
    paymentMethod?: string;
    paymentReference?: string;
    adminNotes?: string;
  }) => {
    const response = await api.post(`/api/transactions/${id}/approve`, data);
    return response.data;
  },

  rejectTransaction: async (id: number, data: {
    rejectionReason: string;
    adminNotes?: string;
  }) => {
    const response = await api.post(`/api/transactions/${id}/reject`, data);
    return response.data;
  },

  completeTransaction: async (id: number, data?: { adminNotes?: string }) => {
    const response = await api.post(`/api/transactions/${id}/complete`, data);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },

  updateExchangeRate: async (data: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    adminFeePercent: number;
    password: string;
  }) => {
    const response = await api.post('/api/exchange-rates', data);
    return response.data;
  },

  getExchangeRates: async () => {
    const response = await api.get('/api/exchange-rates');
    return response.data;
  },

  getAllUsers: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/api/users', { params });
    return response.data;
  },

  toggleUserStatus: async (userId: number, isActive: boolean) => {
    const response = await api.put(`/api/users/${userId}/status`, { isActive });
    return response.data;
  },

  approveKycDocument: async (docId: string) => {
    const response = await api.post(`/api/kyc/${docId}/approve`);
    return response.data;
  },

  rejectKycDocument: async (docId: string, reason: string) => {
    const response = await api.post(`/api/kyc/${docId}/reject`, { reason });
    return response.data;
  },

  getUserById: async (userId: string) => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  getUserTransactions: async (userId: string, params?: {
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: string;
  }) => {
    const response = await api.get(`/api/users/${userId}/transactions`, { params });
    return response.data;
  },

  // Admin Notifications
  getAdminNotifications: async () => {
    const response = await api.get('/api/notifications');
    return response.data;
  },

  markNotificationAsRead: async (id: string) => {
    const response = await api.post(`/api/notifications/${id}/read`);
    return response.data;
  },

  markAllNotificationsAsRead: async () => {
    const response = await api.post('/api/notifications/read-all');
    return response.data;
  },

  // Admin Profile
  getAdminProfile: async () => {
    const response = await api.get('/api/profile');
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
    adminId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const response = await api.get('/api/audit-logs', { params });
    return response.data;
  },

  getAuditLogById: async (id: number) => {
    const response = await api.get(`/api/audit-logs/${id}`);
    return response.data;
  },

  getAuditLogStats: async () => {
    const response = await api.get('/api/audit-logs/stats');
    return response.data;
  }
};

// ==================== USER API ====================

export const userAPI = {
  updateCurrent: async (data: {
    fullName: string;
    phone: string;
    country: string;
  }) => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  updateNotificationSettings: async (data: {
    notificationsOnEmail: boolean;
    notificationsOnSms: boolean;
    notificationsOnTransactionUpdate: boolean;
    notificationsOnMarketing: boolean;
  }) => {
    const response = await api.put('/users/me/notification-settings', data);
    return response.data;
  },
};

// ==================== NOTIFICATION API ====================

export const notificationAPI = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  }
};

// ==================== HELPER FUNCTIONS ====================

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'ADMIN';
};

export default api;