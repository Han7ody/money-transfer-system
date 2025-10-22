// frontend/src/app/(admin)/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { adminAPI, authAPI } from '@/lib/api';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

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
      const [statsRes, txRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getAllTransactions()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (txRes.success) setTransactions(txRes.data.transactions);
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
      console.error('Error