'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, userAPI, transactionAPI } from '@/lib/api';
import { User, Mail, Phone, MapPin, Calendar, Shield, Bell, CreditCard, LogOut, Edit2, Save, X, Camera, Lock, DollarSign, ArrowRight, Loader } from 'lucide-react';

const ProfilePage = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Data States
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalTransactions: 0, completedTransactions: 0 });
  const [loading, setLoading] = useState({ user: true, stats: true });

  // Form States
  const [editData, setEditData] = useState(null);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notificationPrefs, setNotificationPrefs] = useState(null);

  // UI Feedback States
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const showMessage = (type, text) => {
    setStatus({ loading: false, [type]: text });
    setTimeout(() => setStatus({ loading: false, error: null, success: null }), 5000);
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await authAPI.getCurrentUser();
        if (userRes.success) {
          setUser(userRes.data);
          setEditData(userRes.data);
          setNotificationPrefs({
            notificationsOnEmail: userRes.data.notificationsOnEmail,
            notificationsOnSms: userRes.data.notificationsOnSms,
            notificationsOnTransactionUpdate: userRes.data.notificationsOnTransactionUpdate,
            notificationsOnMarketing: userRes.data.notificationsOnMarketing,
          });
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
      setLoading(prev => ({ ...prev, user: false }));

      try {
        const txRes = await transactionAPI.getAll({ limit: 1000 });
        if (txRes.success) {
          setStats({
            totalTransactions: txRes.data.pagination.total,
            completedTransactions: txRes.data.transactions.filter(t => t.status === 'COMPLETED').length
          });
        }
      } catch (error) {
        console.error("Failed to fetch transaction stats");
      }
      setLoading(prev => ({ ...prev, stats: false }));
    };
    fetchData();
  }, [router]);

  const handleSaveProfile = async () => {
    setStatus({ loading: true, error: null, success: null });
    try {
      const res = await userAPI.updateCurrent({ 
        fullName: editData.fullName, 
        phone: editData.phone, 
        country: editData.country 
      });
      if (res.success) {
        setUser(res.data);
        setIsEditing(false);
        showMessage('success', 'تم تحديث الملف الشخصي بنجاح!');
      } else {
        showMessage('error', res.message || 'فشل تحديث الملف الشخصي.');
      }
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'حدث خطأ.');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showMessage('error', 'كلمتا المرور الجديدتان غير متطابقتين.');
    }
    setStatus({ loading: true, error: null, success: null });
    try {
      const res = await authAPI.changePassword({ 
        currentPassword: passwordData.currentPassword, 
        newPassword: passwordData.newPassword 
      });
      if (res.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showMessage('success', 'تم تغيير كلمة المرور بنجاح!');
      } else {
        showMessage('error', res.message || 'فشل تغيير كلمة المرور.');
      }
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'كلمة المرور الحالية غير صحيحة.');
    }
  };

  const handleSaveNotifications = async () => {
    setStatus({ loading: true, error: null, success: null });
    try {
      const res = await userAPI.updateNotificationSettings(notificationPrefs);
      if (res.success) {
        showMessage('success', 'تم حفظ إعدادات الإشعارات!');
      } else {
        showMessage('error', res.message || 'فشل حفظ الإعدادات.');
      }
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'حدث خطأ.');
    }
  };

  if (loading.user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="bg-white border-b sticky top-0 z-10"><div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between"><div className="flex items-center gap-3"><h1 className="text-xl font-bold">الملف الشخصي</h1></div><button onClick={() => router.back()} className="flex items-center gap-2 font-medium"><ArrowRight className="w-5 h-5" /><span>العودة</span></button></div></header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-8 mb-8 text-white shadow-xl relative">
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-2xl bg-white/20 flex items-center justify-center text-5xl font-bold">{user.fullName?.charAt(0)}</div>
            <div className="flex-1 text-center md:text-right">
              <h2 className="text-3xl font-bold mb-2">{user.fullName}</h2>
              <p className="text-indigo-100 mb-4">{user.email}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>عضو منذ {new Date(user.createdAt).toLocaleDateString('ar-SA')}</span></div>
                <div className="flex items-center gap-2"><CreditCard className="w-4 h-4" /><span>{stats.totalTransactions} معاملة</span></div>
              </div>
            </div>
            <div className="flex gap-3">
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold flex items-center gap-2"><Edit2 className="w-5 h-5" />تعديل</button>
              ) : (
                <><button onClick={handleSaveProfile} disabled={status.loading} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2"><Save className="w-5 h-5" />{status.loading ? 'جاري الحفظ...' : 'حفظ'}</button><button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-white/20 text-white rounded-xl font-bold flex items-center gap-2"><X className="w-5 h-5" />إلغاء</button></>
              )}
            </div>
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 space-y-2 shadow-sm">
              <button onClick={() => setActiveTab('personal')} className={`w-full text-right px-4 py-3 font-bold rounded-xl flex items-center gap-3 ${activeTab === 'personal' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50'}`}><User />المعلومات الشخصية</button>
              <button onClick={() => setActiveTab('security')} className={`w-full text-right px-4 py-3 font-bold rounded-xl flex items-center gap-3 ${activeTab === 'security' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50'}`}><Shield />الأمان</button>
              <button onClick={() => setActiveTab('notifications')} className={`w-full text-right px-4 py-3 font-bold rounded-xl flex items-center gap-3 ${activeTab === 'notifications' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50'}`}><Bell />الإشعارات</button>
              <button onClick={() => authAPI.logout()} className={`w-full text-right px-4 py-3 font-bold rounded-xl flex items-center gap-3 text-rose-600 hover:bg-rose-50`}><LogOut />تسجيل الخروج</button>
            </div>
          </div>

          <div className="lg:col-span-3">
            {status.error && <div className="p-4 mb-4 bg-rose-100 text-rose-700 rounded-xl"><b>خطأ:</b> {status.error}</div>}
            {status.success && <div className="p-4 mb-4 bg-emerald-100 text-emerald-700 rounded-xl"><b>نجاح:</b> {status.success}</div>}

            {activeTab === 'personal' && (
              <div className="bg-white rounded-2xl p-8 shadow-sm"><h3 className="text-xl font-bold mb-6">المعلومات الأساسية</h3><div className="space-y-6">
                <div><label className="block text-sm font-bold mb-2">الاسم الكامل</label><input type="text" value={editData?.fullName || ''} onChange={(e) => setEditData({ ...editData, fullName: e.target.value })} disabled={!isEditing} className="w-full p-3 border-2 rounded-xl disabled:bg-slate-50"/></div>
                <div><label className="block text-sm font-bold mb-2">البريد الإلكتروني</label><input type="email" value={editData?.email || ''} disabled className="w-full p-3 border-2 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"/></div>
                <div><label className="block text-sm font-bold mb-2">رقم الهاتف</label><input type="tel" value={editData?.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} disabled={!isEditing} className="w-full p-3 border-2 rounded-xl disabled:bg-slate-50"/></div>
                <div><label className="block text-sm font-bold mb-2">الدولة</label><input type="text" value={editData?.country || ''} onChange={(e) => setEditData({ ...editData, country: e.target.value })} disabled={!isEditing} className="w-full p-3 border-2 rounded-xl disabled:bg-slate-50"/></div>
              </div></div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl p-8 shadow-sm"><h3 className="text-xl font-bold mb-6">تغيير كلمة المرور</h3><div className="space-y-6 max-w-md">
                <div><label className="block text-sm font-bold mb-2">كلمة المرور الحالية</label><input type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full p-3 border-2 rounded-xl"/></div>
                <div><label className="block text-sm font-bold mb-2">كلمة المرور الجديدة</label><input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full p-3 border-2 rounded-xl"/></div>
                <div><label className="block text-sm font-bold mb-2">تأكيد كلمة المرور الجديدة</label><input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full p-3 border-2 rounded-xl"/></div>
                <button onClick={handleChangePassword} disabled={status.loading} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl">{status.loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}</button>
              </div></div>
            )}

            {activeTab === 'notifications' && notificationPrefs && (
              <div className="bg-white rounded-2xl p-8 shadow-sm"><h3 className="text-xl font-bold mb-6">إعدادات الإشعارات</h3><div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-xl"><label htmlFor="email-notif">إشعارات البريد الإلكتروني</label><input id="email-notif" type="checkbox" checked={notificationPrefs.notificationsOnEmail} onChange={e => setNotificationPrefs({...notificationPrefs, notificationsOnEmail: e.target.checked})} /></div>
                <div className="flex justify-between items-center p-4 border rounded-xl"><label htmlFor="sms-notif">إشعارات الرسائل النصية</label><input id="sms-notif" type="checkbox" checked={notificationPrefs.notificationsOnSms} onChange={e => setNotificationPrefs({...notificationPrefs, notificationsOnSms: e.target.checked})} /></div>
                <div className="flex justify-between items-center p-4 border rounded-xl"><label htmlFor="tx-notif">تحديثات المعاملات</label><input id="tx-notif" type="checkbox" checked={notificationPrefs.notificationsOnTransactionUpdate} onChange={e => setNotificationPrefs({...notificationPrefs, notificationsOnTransactionUpdate: e.target.checked})} /></div>
                <div className="flex justify-between items-center p-4 border rounded-xl"><label htmlFor="market-notif">العروض والتحديثات</label><input id="market-notif" type="checkbox" checked={notificationPrefs.notificationsOnMarketing} onChange={e => setNotificationPrefs({...notificationPrefs, notificationsOnMarketing: e.target.checked})} /></div>
                <button onClick={handleSaveNotifications} disabled={status.loading} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl">{status.loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</button>
              </div></div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;