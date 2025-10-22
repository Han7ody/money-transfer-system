// src/app/(user)/transactions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { transactionAPI } from '@/lib/api';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await transactionAPI.getAll();
      if (response.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">معاملاتي</h1>
      {/* عرض قائمة المعاملات */}
    </div>
  );
}