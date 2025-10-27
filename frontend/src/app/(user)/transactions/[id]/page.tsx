'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { transactionAPI } from '@/lib/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ArrowRight, Clock, CheckCircle2, XCircle, User, Phone, Building, CreditCard, Calendar, ArrowLeftRight, Download, Share2, AlertCircle, Loader } from 'lucide-react';

const getStatusDisplay = (status) => {
  const statusConfig = {
    'PENDING': { icon: Clock, classes: { gradient: 'from-amber-50 to-amber-100', border: 'border-amber-200', background: 'bg-amber-500', textLabel: 'text-amber-900', textMessage: 'text-amber-700' }, label: 'في انتظار الدفع', message: 'المعاملة في انتظار رفع إيصال الدفع' },
    'UNDER_REVIEW': { icon: Clock, classes: { gradient: 'from-blue-50 to-blue-100', border: 'border-blue-200', background: 'bg-blue-500', textLabel: 'text-blue-900', textMessage: 'text-blue-700' }, label: 'قيد المراجعة', message: 'جاري مراجعة المعاملة من قبل الإدارة' },
    'APPROVED': { icon: CheckCircle2, classes: { gradient: 'from-violet-50 to-violet-100', border: 'border-violet-200', background: 'bg-violet-500', textLabel: 'text-violet-900', textMessage: 'text-violet-700' }, label: 'موافق عليها', message: 'تمت الموافقة وجاري تحويل المبلغ للمستلم' },
    'COMPLETED': { icon: CheckCircle2, classes: { gradient: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', background: 'bg-emerald-500', textLabel: 'text-emerald-900', textMessage: 'text-emerald-700' }, label: 'مكتملة', message: 'تم إتمام التحويل بنجاح' },
    'REJECTED': { icon: XCircle, classes: { gradient: 'from-rose-50 to-rose-100', border: 'border-rose-200', background: 'bg-rose-500', textLabel: 'text-rose-900', textMessage: 'text-rose-700' }, label: 'مرفوضة', message: 'تم رفض المعاملة - يرجى التواصل مع الدعم' },
    'CANCELLED': { icon: XCircle, classes: { gradient: 'from-slate-50 to-slate-100', border: 'border-slate-200', background: 'bg-slate-500', textLabel: 'text-slate-900', textMessage: 'text-slate-700' }, label: 'ملغاة', message: 'تم إلغاء المعاملة' },
  };
  return statusConfig[status] || statusConfig['PENDING'];
};

export default function TransactionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false); // 🛑 Fix for hydration mismatch

  useEffect(() => {
    setIsMounted(true);
    if (!id) {
        setLoading(false);
        return;
    }

    const fetchTransaction = async () => {
      setLoading(true);
      try {
        const res = await transactionAPI.getById(Number(id));
        if (res.success) {
          setTransaction(res.data);
        } else {
          setError(res.message || 'Failed to fetch transaction details.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred.');
      }
      setLoading(false);
    };

    fetchTransaction();
  }, [id]);

  const generatePdf = async (action = 'download') => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const width = pdfWidth - 40;
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 20, width, height);
    if (action === 'share') {
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], `${transaction.transactionRef}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({ title: `تفاصيل المعاملة: ${transaction.transactionRef}`, text: `إليك تفاصيل المعاملة المالية رقم ${transaction.transactionRef}`, files: [pdfFile] });
        } catch (error) { console.error('Error sharing:', error); }
      } else {
        alert('المشاركة غير مدعومة في هذا المتصفح، سيتم تحميل الملف بدلاً من ذلك.');
        pdf.save(`${transaction.transactionRef}.pdf`);
      }
    } else {
      pdf.save(`${transaction.transactionRef}.pdf`);
    }
    setIsGeneratingPdf(false);
  };

  // 🛑 Render loading state until component is mounted to prevent hydration mismatch
  if (!isMounted || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader className="w-10 h-10 text-indigo-600 animate-spin" /></div>;
  }

  if (error) return <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-600">Error: {error}</div>;
  if (!transaction) return <div className="min-h-screen flex items-center justify-center">Transaction not found.</div>;

  const statusDisplay = getStatusDisplay(transaction.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"><ArrowRight className="w-5 h-5" /><span>العودة للوحة التحكم</span></button>
          <div className="flex gap-2">
            <button onClick={() => generatePdf('download')} disabled={isGeneratingPdf} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center gap-2"><Download className="w-5 h-5 text-slate-600" />{isGeneratingPdf ? 'جاري الإنشاء...' : 'تحميل'}</button>
            <button onClick={() => generatePdf('share')} disabled={isGeneratingPdf} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center gap-2"><Share2 className="w-5 h-5 text-slate-600" />{isGeneratingPdf ? 'جاري الإنشاء...' : 'مشاركة'}</button>
          </div>
        </div>
        <div ref={printRef} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between mb-4">
            <div><h1 className="text-2xl font-bold text-slate-900 mb-2">تفاصيل المعاملة</h1><p className="text-slate-600">المرجع: <span className="font-mono font-bold text-indigo-600">{transaction.transactionRef}</span></p></div>
            <div className={`bg-gradient-to-br ${statusDisplay.classes.gradient} border-2 ${statusDisplay.classes.border} rounded-xl p-5`}><div className="flex items-center gap-4"><div className={`w-14 h-14 rounded-full ${statusDisplay.classes.background} flex items-center justify-center shadow-lg`}><StatusIcon className="w-7 h-7 text-white" /></div><div><p className={`${statusDisplay.classes.textLabel} font-bold text-lg mb-1`}>{statusDisplay.label}</p><p className={`${statusDisplay.classes.textMessage} text-sm`}>{statusDisplay.message}</p></div></div></div>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 shadow-xl my-6 text-white"><div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center"><div className="text-center md:text-right"><p className="text-white/80 text-sm font-medium mb-2">المبلغ المرسل</p><p className="text-4xl font-bold">{parseFloat(transaction.amountSent).toFixed(2)}</p><p className="text-white/90 text-sm mt-1">{transaction.fromCurrency.code}</p></div><div className="flex justify-center"><div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"><ArrowLeftRight className="w-7 h-7" /></div></div><div className="text-center md:text-left"><p className="text-white/80 text-sm font-medium mb-2">المبلغ المستلم</p><p className="text-4xl font-bold">{parseFloat(transaction.amountReceived).toFixed(2)}</p><p className="text-white/90 text-sm mt-1">{transaction.toCurrency.code}</p></div></div><div className="mt-6 pt-6 border-t border-white/20"><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-white/70 mb-1">سعر الصرف</p><p className="font-semibold">1 {transaction.fromCurrency.code} = {parseFloat(transaction.exchangeRate).toFixed(2)} {transaction.toCurrency.code}</p></div><div><p className="text-white/70 mb-1">العمولة</p><p className="font-semibold">{parseFloat(transaction.adminFee).toFixed(2)} {transaction.fromCurrency.code}</p></div></div></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"><div className="bg-slate-50 rounded-xl p-4 border"><h3 className="text-lg font-bold text-slate-900 mb-4">معلومات المرسل</h3><div className="space-y-4"><div><p className="text-xs font-semibold text-slate-500 mb-1">الاسم الكامل</p><p className="text-sm font-semibold text-slate-900">{transaction.senderName}</p></div><div><p className="text-xs font-semibold text-slate-500 mb-1">رقم الهاتف</p><p className="text-sm font-semibold text-slate-900">{transaction.senderPhone}</p></div><div><p className="text-xs font-semibold text-slate-500 mb-1">الدولة</p><p className="text-sm font-semibold text-slate-900">{transaction.senderCountry}</p></div></div></div><div className="bg-slate-50 rounded-xl p-4 border"><h3 className="text-lg font-bold text-slate-900 mb-4">معلومات المستلم</h3><div className="space-y-4"><div><p className="text-xs font-semibold text-slate-500 mb-1">الاسم الكامل</p><p className="text-sm font-semibold text-slate-900">{transaction.recipientName}</p></div><div><p className="text-xs font-semibold text-slate-500 mb-1">رقم الهاتف</p><p className="text-sm font-semibold text-slate-900">{transaction.recipientPhone}</p></div><div><p className="text-xs font-semibold text-slate-500 mb-1">الدولة</p><p className="text-sm font-semibold text-slate-900">{transaction.recipientCountry}</p></div></div></div></div>
          {transaction.recipientBankName && (<div className="bg-slate-50 rounded-xl p-4 border mb-6"><h3 className="text-lg font-bold text-slate-900 mb-4">التفاصيل البنكية</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><p className="text-xs font-semibold text-slate-500 mb-1">اسم البنك</p><p className="text-sm font-semibold text-slate-900">{transaction.recipientBankName}</p></div>{transaction.recipientAccountNumber && (<div><p className="text-xs font-semibold text-slate-500 mb-1">رقم الحساب</p><p className="text-sm font-mono font-semibold text-slate-900">{transaction.recipientAccountNumber}</p></div>)}</div></div>)}
          {transaction.history && transaction.history.length > 0 && (<div className="bg-slate-50 rounded-xl p-4 border"><h3 className="text-lg font-bold text-slate-900 mb-6">تاريخ المعاملة</h3><div className="relative"><div className="absolute right-6 top-0 bottom-0 w-0.5 bg-slate-200"></div><div className="space-y-6">{transaction.history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((entry, index) => { const display = getStatusDisplay(entry.newStatus); const Icon = display.icon; return (<div key={index} className="flex gap-4 relative"><div className={`${display.classes.background} w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-10 flex-shrink-0`}><Icon className="w-6 h-6 text-white" /></div><div className="flex-1 pt-2"><p className="font-bold text-slate-900 mb-1">{display.label}</p><p className="text-sm text-slate-600">{new Date(entry.createdAt).toLocaleString('ar-SA')}</p>{entry.notes && <p className="text-xs text-slate-500 mt-1">ملاحظات: {entry.notes}</p>}</div></div>);})}</div></div></div>)}
        </div>
      </div>
    </div>
  );
}
