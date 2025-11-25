'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Lock,
  Camera,
  Save,
  Loader2
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

interface AdminProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAdminProfile();

      if (response.success) {
        setProfile(response.data);
        setFullName(response.data.fullName);
        setEmail(response.data.email);
      } else {
        setError(response.message || 'فشل في تحميل الملف الشخصي');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء تحميل الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      setError('جميع الحقول مطلوبة');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await adminAPI.updateAdminProfile({
        fullName: fullName.trim(),
        email: email.trim()
      });

      if (response.success) {
        setSuccess('تم تحديث الملف الشخصي بنجاح');
        setProfile(response.data);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'فشل في تحديث الملف الشخصي');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء تحديث الملف الشخصي');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SUPPORT':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'VIEWER':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'مدير رئيسي';
      case 'ADMIN':
        return 'مدير';
      case 'SUPPORT':
        return 'دعم فني';
      case 'VIEWER':
        return 'مشاهد';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-700">فشل في تحميل الملف الشخصي</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">حساب الإدمن</h2>
          <p className="text-sm text-slate-500 mt-1">إدارة معلومات الحساب الشخصي</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {profile.fullName.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{profile.fullName}</h3>
              <p className="text-sm text-slate-500">{profile.email}</p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Camera className="w-4 h-4" />
              تحديث الصورة
            </button>
          </div>

          {/* Full Name Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <User className="w-4 h-4" />
              الاسم الكامل
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="أدخل الاسم الكامل"
              required
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Mail className="w-4 h-4" />
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="أدخل البريد الإلكتروني"
              required
            />
          </div>

          {/* Role Field (Read-only) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Shield className="w-4 h-4" />
              الدور الوظيفي
            </label>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 text-sm font-medium border rounded-lg ${getRoleBadgeColor(profile.role)}`}>
                {getRoleLabel(profile.role)}
              </span>
              <span className="text-xs text-slate-500">لا يمكن تعديل الدور من هنا</span>
            </div>
          </div>

          {/* Created At Field (Read-only) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Calendar className="w-4 h-4" />
              تاريخ الإنشاء
            </label>
            <div className="px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-600">
              {formatDate(profile.createdAt)}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Additional Settings Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">إعدادات إضافية</h2>
          <p className="text-sm text-slate-500 mt-1">إدارة الأمان والخصوصية</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Change Password Button */}
          <button
            onClick={() => router.push('/admin/security/change-password')}
            className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-right">
                <h3 className="font-medium text-slate-900">تغيير كلمة المرور</h3>
                <p className="text-sm text-slate-500">تحديث كلمة المرور الخاصة بك</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
