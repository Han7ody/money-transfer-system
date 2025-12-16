'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Show warning 2 minutes before timeout

export default function SessionTimeoutModal() {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(120);
  const router = useRouter();

  useEffect(() => {
    let lastActivity = Date.now();
    let warningTimeout: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const resetTimer = () => {
      lastActivity = Date.now();
      setShowWarning(false);
      
      // Clear existing timers
      if (warningTimeout) clearTimeout(warningTimeout);
      if (countdownInterval) clearInterval(countdownInterval);

      // Set new warning timer
      warningTimeout = setTimeout(() => {
        setShowWarning(true);
        setRemainingSeconds(120);

        // Start countdown
        countdownInterval = setInterval(() => {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              handleTimeout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);
    };

    const handleTimeout = () => {
      // Clear session and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/admin/login?timeout=true');
    };

    const handleActivity = () => {
      if (!showWarning) {
        resetTimer();
      }
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (warningTimeout) clearTimeout(warningTimeout);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [router, showWarning]);

  const handleExtendSession = async () => {
    try {
      await api.post('/security/sessions/refresh');
      setShowWarning(false);
      
      // Reset activity tracking
      const event = new Event('mousedown');
      document.dispatchEvent(event);
    } catch (error) {
      // Session might be expired, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/admin/login?timeout=true');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  if (!showWarning) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" dir="rtl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="mr-4">
            <h3 className="text-lg font-semibold text-gray-900">
              تحذير انتهاء الجلسة
            </h3>
            <p className="text-sm text-gray-600">
              ستنتهي جلستك قريباً بسبب عدم النشاط
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <p className="text-sm text-gray-600">
              الوقت المتبقي قبل تسجيل الخروج التلقائي
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExtendSession}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            تمديد الجلسة
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            تسجيل الخروج
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          سيتم تسجيل خروجك تلقائياً بعد 30 دقيقة من عدم النشاط
        </p>
      </div>
    </div>
  );
}
