"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { transactionAPI } from '@/lib/api'; // 🛑 استيراد الـ API الحقيقي
import { ArrowLeft, Upload, CheckCircle2, User, Phone, Building, CreditCard, Info, ArrowLeftRight, Calculator, XCircle, AlertTriangle } from 'lucide-react';

// -----------------------------------------------------------
// مكون عرض الرسائل (Alert/Notification Component)
// -----------------------------------------------------------
const AlertMessage = ({ type, text }) => {
  if (!text) return null;
  const baseClasses = "flex items-center gap-3 p-4 rounded-xl font-medium mb-6 transition-all duration-300";
  let icon, classes;

  switch (type) {
    case 'success':
      icon = <CheckCircle2 className="w-5 h-5" />;
      classes = `${baseClasses} bg-emerald-100 text-emerald-800 border border-emerald-300`;
      break;
    case 'error':
      icon = <XCircle className="w-5 h-5" />;
      classes = `${baseClasses} bg-red-100 text-red-800 border border-red-300`;
      break;
    case 'warning':
    default:
      icon = <AlertTriangle className="w-5 h-5" />;
      classes = `${baseClasses} bg-amber-100 text-amber-800 border border-amber-300`;
      break;
  }

  return (
    <div className={classes}>
      {icon}
      <p className="text-sm">{text}</p>
    </div>
  );
};


// -----------------------------------------------------------
// المكون الرئيسي: NewTransferPage
// -----------------------------------------------------------
export default function NewTransferPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const router = useRouter(); // 🛑 لإدارة التنقل
  
  const [formData, setFormData] = useState({
    fromCurrencyCode: 'SDG',
    toCurrencyCode: 'INR',
    amountSent: '',
    senderName: '',
    senderPhone: '',
    senderCountry: 'السودان', 
    recipientCountry: 'الهند',
    recipientName: '',
    recipientPhone: '',
    recipientBankName: '',
    recipientAccountNumber: ''
  });

  // دالة مساعدة لعرض الرسائل
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    const timer = setTimeout(() => setMessage({ type: '', text: '' }), 6000);
    return () => clearTimeout(timer);
  }, []);

  // 🛑 دالة للعودة إلى لوحة التحكم
  const goToDashboard = () => {
    router.push('/dashboard');
  };

  // دالة جلب سعر الصرف
  const loadExchangeRate = useCallback(async () => {
    const { fromCurrencyCode, toCurrencyCode, amountSent } = formData;
    if (!amountSent || parseFloat(amountSent) <= 0) {
        setExchangeRate(null);
        return;
    }
    
    setMessage({ type: '', text: '' });
    
    try {
      // 🛑 استدعاء الـ API الحقيقي
      const response = await transactionAPI.getExchangeRate(
        fromCurrencyCode,
        toCurrencyCode
      );
      if (response.success) {
        setExchangeRate(response.data);
      } else {
        setExchangeRate(null);
        showMessage('warning', response.message || 'لم يتم العثور على سعر صرف لهذا التحويل حاليًا.');
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      setExchangeRate(null);
      const errorMsg = error.response?.data?.message || 'خطأ في الاتصال: فشل جلب أسعار الصرف.';
      showMessage('error', errorMsg);
    }
  }, [formData.fromCurrencyCode, formData.toCurrencyCode, formData.amountSent, showMessage]);

  // 🛑 تحسين: استخدام Debounce لجلب سعر الصرف
  useEffect(() => {
    const handler = setTimeout(() => {
        loadExchangeRate();
    }, 500); // تأخير 500ms

    return () => {
        clearTimeout(handler);
    };
  }, [formData.amountSent, formData.fromCurrencyCode, formData.toCurrencyCode, loadExchangeRate]);

  // دالة حساب المبلغ المستلَم
  const calculateAmount = () => {
    if (!exchangeRate || !formData.amountSent) return { fee: 0, afterFee: 0, received: 0 };

    const amount = parseFloat(formData.amountSent) || 0;
    const fee = (amount * exchangeRate.adminFeePercent) / 100;
    const afterFee = amount - fee;
    const received = afterFee * exchangeRate.rate;
    return { fee, afterFee, received };
  };

  const { fee, received } = calculateAmount();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // -----------------------------------------------------------
  // دالة إنشاء التحويل (Step 1 Submit)
  // -----------------------------------------------------------
  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    if (!exchangeRate || parseFloat(formData.amountSent) <= 0) {
        showMessage('error', 'يجب إدخال مبلغ صحيح وتوفر سعر صرف للمتابعة.');
        setLoading(false);
        return;
    }

    try {
      const apiData = {
          ...formData,
          amountSent: parseFloat(formData.amountSent),
      };
      
      // 🛑 استدعاء الـ API الحقيقي
      const response = await transactionAPI.create(apiData);
      if (response.success) {
        setTransactionId(response.data.id);
        setTransactionRef(response.data.transactionRef);
        setStep(2);
        showMessage('success', 'تم إنشاء طلب التحويل بنجاح. يرجى إتمام الدفع ورفع الإيصال.');
      } else {
        showMessage('error', response.message || 'فشل إنشاء التحويل. يرجى مراجعة البيانات.');
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'حدث خطأ غير متوقع أثناء إرسال البيانات.';
      showMessage('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };


  // -----------------------------------------------------------
  // دالة رفع الإيصال (Step 2 Submit)
  // -----------------------------------------------------------
  const handleUploadReceipt = async () => {
    if (!receiptFile || !transactionId) {
        showMessage('error', 'يرجى اختيار ملف الإيصال أولاً.');
        return;
    }

    setMessage({ type: '', text: '' });
    setLoading(true);
    
    try {
      // 🛑 استدعاء الـ API الحقيقي
      const response = await transactionAPI.uploadReceipt(transactionId, receiptFile);
      if (response.success) {
        showMessage('success', 'تم رفع الإيصال بنجاح! المعاملة قيد المراجعة.');
        // 🛑 العودة إلى لوحة التحكم بعد نجاح الرفع
        setTimeout(goToDashboard, 2000); 
      } else {
        showMessage('error', response.message || 'فشل رفع الإيصال. يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء رفع الإيصال. يرجى التحقق من حجم الملف ونوعه.';
      showMessage('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------
  // عرض الواجهة
  // -----------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* 🛑 زر العودة يستخدم الآن router */}
        <button 
          onClick={goToDashboard}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> 
          <span className="font-medium">العودة للوحة التحكم</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">إنشاء تحويل جديد</h1>
          <p className="text-slate-600">أكمل البيانات التالية لإرسال الأموال بسرعة وأمان</p>
        </div>

        <AlertMessage type={message.type} text={message.text} />

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className={`flex items-center gap-3 ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg transition-all ${
              step === 1 ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white scale-110' : 
              step > 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className="font-bold">بيانات التحويل</span>
          </div>
          <div className={`h-1 w-24 rounded-full transition-all ${step > 1 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
          <div className={`flex items-center gap-3 ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg transition-all ${
              step === 2 ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white scale-110' : 'bg-slate-200 text-slate-500'
            }`}>
              2
            </div>
            <span className="font-bold">رفع الإيصال</span>
          </div>
        </div>

        {/* Step 1: Transfer Details */}
        {step === 1 && (
          <form onSubmit={handleCreateTransaction} className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5" />
                <h3 className="font-bold text-lg">حاسبة التحويل</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">من عملة</label>
                  <select 
                    name="fromCurrencyCode"
                    value={formData.fromCurrencyCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="SDG">SDG - الجنيه السوداني</option>
                    <option value="INR">INR - الروبية الهندية</option>
                    <option value="USD">USD - الدولار الأمريكي</option>
                  </select>
                </div>

                <div className="flex items-end justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">إلى عملة</label>
                  <select 
                    name="toCurrencyCode"
                    value={formData.toCurrencyCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="INR">INR - الروبية الهندية</option>
                    <option value="SDG">SDG - الجنيه السوداني</option>
                    <option value="USD">USD - الدولار الأمريكي</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-white/80 text-sm font-medium mb-2">المبلغ المرسل</label>
                <input 
                  type="number"
                  name="amountSent"
                  value={formData.amountSent}
                  onChange={handleChange}
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white text-2xl font-bold placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="0.00"
                />
              </div>

              {exchangeRate && formData.amountSent && parseFloat(formData.amountSent) > 0 ? (
                <div className="mt-6 space-y-2 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">سعر الصرف:</span>
                    <span className="font-bold">1 {formData.fromCurrencyCode} = {exchangeRate.rate} {formData.toCurrencyCode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">العمولة ({exchangeRate.adminFeePercent}%):</span>
                    <span className="font-bold">{fee.toFixed(2)} {formData.fromCurrencyCode}</span>
                  </div>
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/90 font-medium">المستلم سيحصل على:</span>
                      <span className="text-3xl font-bold text-white">{received.toFixed(2)} {formData.toCurrencyCode}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm text-center">
                    <p className="text-white/80 font-medium">يرجى إدخال مبلغ صحيح وجلب سعر الصرف للمتابعة.</p>
                </div>
              )}
            </div>

            {/* Sender Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">معلومات المرسل</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم الكامل *</label>
                  <input 
                    type="text"
                    name="senderName"
                    value={formData.senderName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="أحمد محمد علي"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">رقم الهاتف *</label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="tel"
                      name="senderPhone"
                      value={formData.senderPhone}
                      onChange={handleChange}
                      className="w-full pr-12 pl-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="+249 123 456 789"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">معلومات المستلم</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم الكامل *</label>
                  <input 
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="راجيش كومار"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">رقم الهاتف *</label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="tel"
                      name="recipientPhone"
                      value={formData.recipientPhone}
                      onChange={handleChange}
                      className="w-full pr-12 pl-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">اسم البنك (اختياري)</label>
                  <div className="relative">
                    <Building className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text"
                      name="recipientBankName"
                      value={formData.recipientBankName}
                      onChange={handleChange}
                      className="w-full pr-12 pl-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="State Bank of India"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">رقم الحساب (اختياري)</label>
                  <div className="relative">
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text"
                      name="recipientAccountNumber"
                      value={formData.recipientAccountNumber}
                      onChange={handleChange}
                      className="w-full pr-12 pl-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="1234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    <strong>ملاحظة:</strong> تأكد من صحة معلومات المستلم البنكية لضمان وصول المبلغ بنجاح
                  </p>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || !exchangeRate || !formData.amountSent || parseFloat(formData.amountSent) <= 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg"
            >
              {loading ? 'جاري إنشاء التحويل...' : 'متابعة إلى رفع الإيصال'}
              <ArrowLeft className={`w-5 h-5 transition-all ${loading ? 'opacity-0' : 'rotate-180'}`} />
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">تم إنشاء التحويل بنجاح!</h3>
              <p className="text-slate-600 mb-4">
                الرقم المرجعي: <span className="font-mono font-bold text-indigo-600 text-lg select-all">{transactionRef}</span>
              </p>
              <div className="inline-block px-6 py-3 bg-indigo-50 rounded-xl">
                <p className="text-sm text-indigo-800 font-medium">
                  المبلغ المطلوب تحويله: <strong className="text-lg">{parseFloat(formData.amountSent).toFixed(2)} {formData.fromCurrencyCode}</strong>
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-lg mb-2">الخطوة التالية: إتمام الدفع</h4>
                  <p className="text-amber-800 mb-3">يرجى تحويل المبلغ إلى الحساب التالي:</p>
                  <div className="space-y-2 bg-white/60 p-4 rounded-lg">
                    <p className="text-sm"><strong>اسم البنك:</strong> بنك الخرطوم</p>
                    <p className="text-sm"><strong>رقم الحساب:</strong> 1234567890</p>
                    <p className="text-sm"><strong>اسم الحساب:</strong> Money Transfer Services</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-4">رفع إيصال الدفع</h3>
              <p className="text-slate-600 mb-6">قم برفع صورة أو ملف PDF للإيصال لإكمال المعاملة</p>
              
              <label htmlFor="receipt-upload" className="block cursor-pointer">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-all">
                    {receiptFile ? (
                        <div className="flex flex-col items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                            <h4 className="font-bold text-slate-900">تم اختيار الملف:</h4>
                            <p className="text-sm text-slate-600">{receiptFile.name}</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h4 className="font-bold text-slate-900 mb-2">اضغط لرفع الملف</h4>
                            <p className="text-sm text-slate-600 mb-4">أو اسحب الملف وأفلته هنا</p>
                        </>
                    )}
                  
                  <p className="text-xs text-slate-500">JPG, PNG, GIF, PDF (حد أقصى 5MB)</p>
                  <input 
                    id="receipt-upload"
                    type="file" 
                    className="hidden" 
                    accept="image/*,application/pdf" 
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </div>
              </label>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleUploadReceipt}
                disabled={loading || !receiptFile}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <Upload className="w-5 h-5" />
                {loading ? 'جاري الرفع...' : 'رفع الإيصال والإرسال'}
              </button>
              <button 
                onClick={() => setStep(1)}
                className="px-8 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                رجوع
              </button>
            </div>

            <button 
              onClick={goToDashboard}
              className="w-full text-slate-600 hover:text-slate-900 font-medium py-3 transition-colors"
            >
              تخطي (سأرفع الإيصال لاحقاً)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}