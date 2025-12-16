'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AlertTriangle, CheckCircle, Clock, XCircle, Filter } from 'lucide-react';
import api from '@/lib/api';

interface AMLAlert {
  id: number;
  user_name: string;
  user_email: string;
  transaction_ref: string;
  type: string;
  severity: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AMLAlertsPage() {
  const [alerts, setAlerts] = useState<AMLAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', severity: '', type: '' });

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.severity) params.append('severity', filter.severity);
      if (filter.type) params.append('type', filter.type);

      const response = await api.get(`/compliance/aml-alerts?${params.toString()}`);
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch AML alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'UNDER_REVIEW': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'RESOLVED': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'FALSE_POSITIVE': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AML Alerts</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor suspicious activity and compliance alerts
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="FALSE_POSITIVE">False Positive</option>
            </select>

            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            >
              <option value="">All Severity</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="VELOCITY">Velocity</option>
              <option value="STRUCTURING">Structuring</option>
            </select>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No AML alerts found
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(alert.status)}
                          <span className="text-sm text-slate-900 dark:text-white">
                            {alert.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                        {alert.type}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 dark:text-white">{alert.user_name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{alert.user_email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                        {alert.transaction_ref || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {alert.message}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="en-digits">{new Date(alert.created_at).toLocaleDateString('en-GB')}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
