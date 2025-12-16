'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KycIndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/kyc/queue');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">جاري التحميل...</p>
      </div>
    </div>
  );
}
