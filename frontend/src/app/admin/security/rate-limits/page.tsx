'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Edit3, Trash2, ToggleLeft, ToggleRight,
  Clock, Shield, AlertTriangle, CheckCircle2, X
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface RateLimit {
  id: number;
  endpoint: string;
  method: string;
  maxRequests: number;
  windowMs: number;
  message?: string;
  isActive: boolean;
  createdAt: string;
  creator?: {
    fullName: string;
    email: string;
  };
}

export default function RateLimitsPage() {
  const router = useRouter();
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLimit, setEditingLimit] = useState<RateLimit | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    endpoint: '',
    method: 'POST',
    maxRequests: 60,
    windowMs: 60000,
    message: ''
  });

  // Fetch rate limits
  const fetchRateLimits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/security/rate-limits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRateLimits(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching rate limits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateLimits();
  }, []);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/security/rate-limits/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      if (response.ok) {
        setRateLimits(prev => 
          prev.map(limit => 
            limit.id === id ? { ...limit, isActive: !currentStatus } : limit
          )
        );
      }
    } catch (error) {
      console.error('Error toggling rate limit:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rate limit?')) {
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/security/rate-limits/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setRateLimits(prev => prev.filter(limit => limit.id !== id));
      }
    } catch (error) {
      console.error('Error deleting rate limit:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingLimit
        ? `http://localhost:5000/api/admin/security/rate-limits/${editingLimit.id}`
        : 'http://localhost:5000/api/admin/security/rate-limits';
      
      const response = await fetch(url, {
        method: editingLimit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        await fetchRateLimits();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving rate limit:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      endpoint: '',
      method: 'POST',
      maxRequests: 60,
      windowMs: 60000,
      message: ''
    });
    setEditingLimit(null);
  };

  const openEditModal = (limit: RateLimit) => {
    setEditingLimit(limit);
    setFormData({
      endpoint: limit.endpoint,
      method: limit.method,
      maxRequests: limit.maxRequests,
      windowMs: limit.windowMs,
      message: limit.message || ''
    });
    setShowModal(true);
  };

  const formatWindowMs = (ms: number): string => {
    if (ms < 60000) return `${ms / 1000}s`;
    if (ms < 3600000) return `${ms / 60000}m`;
    return `${ms / 3600000}h`;
  };

  const getMethodColor = (method: string): string => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      ALL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    return colors[method] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const activeCount = rateLimits.filter(l => l.isActive).length;
  const inactiveCount = rateLimits.length - activeCount;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rate Limits</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage API rate limiting configurations
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Rate Limit
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Rules</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{rateLimits.length}</p>
              </div>
              <Shield className="w-10 h-10 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Inactive</p>
                <p className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-1">{inactiveCount}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-slate-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Protected Endpoints</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeCount}</p>
              </div>
              <Clock className="w-10 h-10 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Rate Limits Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Window
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : rateLimits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No rate limits configured
                    </td>
                  </tr>
                ) : (
                  rateLimits.map((limit) => (
                    <tr key={limit.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {limit.endpoint}
                        </div>
                        {limit.message && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {limit.message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(limit.method)}`}>
                          {limit.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                        {limit.maxRequests} requests
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                        {formatWindowMs(limit.windowMs)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(limit.id, limit.isActive)}
                          disabled={actionLoading}
                          className="flex items-center gap-2"
                        >
                          {limit.isActive ? (
                            <>
                              <ToggleRight className="w-5 h-5 text-green-600" />
                              <span className="text-sm text-green-600">Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 text-slate-400" />
                              <span className="text-sm text-slate-500 dark:text-slate-400">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(limit)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(limit.id)}
                            disabled={actionLoading}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingLimit ? 'Edit Rate Limit' : 'Add Rate Limit'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Endpoint
                </label>
                <input
                  type="text"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  placeholder="/api/auth/login"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  required
                  disabled={!!editingLimit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Method
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  required
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="ALL">ALL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Max Requests
                </label>
                <input
                  type="number"
                  value={formData.maxRequests || ''}
                  onChange={(e) => setFormData({ ...formData, maxRequests: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="10000"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Window (milliseconds)
                </label>
                <input
                  type="number"
                  value={formData.windowMs || ''}
                  onChange={(e) => setFormData({ ...formData, windowMs: parseInt(e.target.value) || 0 })}
                  min="1000"
                  max="3600000"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {formatWindowMs(formData.windowMs)} window
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Error Message (Optional)
                </label>
                <input
                  type="text"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Too many requests. Please try again later."
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : editingLimit ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
