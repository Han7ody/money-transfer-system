'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/lib/api';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCaseDetails();
  }, []);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/compliance/aml-cases/${params.id}`);
      setCaseData(response.data.data);
    } catch (error: any) {
      console.error('Error fetching case:', error);
      setError(error.response?.data?.message || 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'INVESTIGATING': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'RESOLVED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'ESCALATED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading case details...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !caseData) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 mb-4">{error || 'Case not found'}</div>
          <button
            onClick={() => router.push('/admin/compliance/cases')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Cases
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {caseData.case_number}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{caseData.title}</p>
          </div>
          <button
            onClick={() => router.push('/admin/compliance/cases')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Back to Cases
          </button>
        </div>

        {/* Case Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Case Information</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseData.status)}`}>
                  {caseData.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Severity</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(caseData.severity)}`}>
                  {caseData.severity}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Case Type</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{caseData.case_type}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">User</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {caseData.user_name} ({caseData.user_email})
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Created By</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{caseData.created_by_name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Created At</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                <span className="en-digits">{new Date(caseData.created_at).toLocaleDateString('en-GB')} {new Date(caseData.created_at).toLocaleTimeString('en-GB', { hour12: false })}</span>
              </dd>
            </div>
            {caseData.assigned_to_name && (
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Assigned To</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{caseData.assigned_to_name}</dd>
              </div>
            )}
            {caseData.resolved_by_name && (
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Resolved By</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{caseData.resolved_by_name}</dd>
              </div>
            )}
          </dl>

          {caseData.description && (
            <div className="mt-4">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{caseData.description}</dd>
            </div>
          )}

          {caseData.resolution_notes && (
            <div className="mt-4">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Resolution Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{caseData.resolution_notes}</dd>
            </div>
          )}
        </div>

        {/* Linked Alerts */}
        {caseData.alerts && caseData.alerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Linked AML Alerts</h2>
            <div className="space-y-3">
              {caseData.alerts.map((alert: any) => (
                <div key={alert.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{alert.type}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{alert.message}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Log */}
        {caseData.activities && caseData.activities.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Log</h2>
            <div className="space-y-3">
              {caseData.activities.map((activity: any) => (
                <div key={activity.id} className="border-l-2 border-blue-500 pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{activity.activity_type}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {activity.admin_name} - <span className="en-digits">{new Date(activity.created_at).toLocaleDateString('en-GB')} {new Date(activity.created_at).toLocaleTimeString('en-GB', { hour12: false })}</span>
                      </div>
                      {activity.notes && (
                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">{activity.notes}</div>
                      )}
                    </div>
                    {activity.old_value && activity.new_value && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.old_value} → {activity.new_value}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
