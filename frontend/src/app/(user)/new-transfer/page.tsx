// frontend/src/app/(user)/new-transfer/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Upload, CheckCircle } from 'lucide-react';
// 🛑 تم التصحيح: استخدام المسار المطلق @/ بدلاً من المسار النسبي الخاطئ
import { transactionAPI } from '@/lib/api';

export default function NewTransferPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [exchangeRate, setExchangeRate] = useState<any>(null);

  const [formData, setFormData] = useState({
    senderName: '',
    senderPhone: '',
    senderCountry: 'Sudan',
    recipientName: '',
    recipientPhone: '',
    recipientCountry: 'India',
    recipientBankName: '',
    recipientAccountNumber: '',
    fromCurrencyCode: 'SDG',
    toCurrencyCode: 'INR',
    amountSent: ''
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    // يجب تشغيل loadExchangeRate فقط إذا كان المستخدم أدخل مبلغاً
    if (formData.amountSent && parseFloat(formData.amountSent) > 0) {
      loadExchangeRate();
    }
  }, [formData.fromCurrencyCode, formData.toCurrencyCode, formData.amountSent]);

  const loadExchangeRate = async () => {
    // تأكد أن أسعار الصرف موجودة في قاعدة البيانات (من خلال Seed)
    try {
      const response = await transactionAPI.getExchangeRate(
        formData.fromCurrencyCode,
        formData.toCurrencyCode
      );
      if (response.success) {
        setExchangeRate(response.data);
      } else {
        // رسالة تنبيه للمستخدم إذا لم يتوفر سعر الصرف
        console.error('Exchange rate error:', response.message);
        setExchangeRate(null); 
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      setExchangeRate(null);
    }
  };

  const calculateReceived = () => {
    if (!exchangeRate || !formData.amountSent) return 0;
    const amount = parseFloat(formData.amountSent);
    const fee = (amount * exchangeRate.adminFeePercent) / 100;
    const afterFee = amount - fee;
    return (afterFee * exchangeRate.rate).toFixed(2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await transactionAPI.create(formData);
      if (response.success) {
        setTransactionId(response.data.id);
        setTransactionRef(response.data.transactionRef);
        setStep(2);
      } else {
        alert(response.message || 'فشل إنشاء التحويل');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'حدث خطأ: تأكد من تشغيل الخادم وتوفر أسعار الصرف');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !transactionId) return;

    setLoading(true);
    try {
      const response = await transactionAPI.uploadReceipt(transactionId, receiptFile);
      if (response.success) {
        alert('تم رفع الإيصال بنجاح! المعاملة قيد المراجعة');
        router.push('/dashboard');
      } else {
        alert('فشل رفع الإيصال');
      }
    } catch (error) {
      alert('حدث خطأ أثناء رفع الإيصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للوحة التحكم
          </button>
          <h1 className="text-3xl font-bold text-gray-900">إنشاء تحويل جديد</h1>
          <p className="text-gray-600 mt-2">املأ البيانات التالية لإرسال الأموال</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-indigo-600' : 'text-green-600'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step === 1 ? 'bg-indigo-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className="font-medium">بيانات التحويل</span>
          </div>
          <div className="flex-1 h-1 bg-gray-300 max-w-[100px]"></div>
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-white'
            }`}>
              2
            </div>
            <span className="font-medium">رفع الإيصال</span>
          </div>
        </div>

        {/* Step 1: Transfer Form */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleCreateTransaction} className="space-y-6">
              {/* Currency & Amount */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">من عملة</label>
                    <select
                      name="fromCurrencyCode"
                      value={formData.fromCurrencyCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="SDG">SDG - الجنيه السوداني</option>
                      <option value="INR">INR - الروبية الهندية</option>
                      <option value="USD">USD - الدولار الأمريكي</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">إلى عملة</label>
                    <select
                      name="toCurrencyCode"
                      value={formData.toCurrencyCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="INR">INR - الروبية الهندية</option>
                      <option value="SDG">SDG - الجنيه السوداني</option>
                      <option value="USD">USD - الدولار الأمريكي</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ</label>
                    <input
                      type="number"
                      name="amountSent"
                      value={formData.amountSent}
                      onChange={handleChange}
                      min="1"
                      step="0.01"
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="1000"
                      required
                    />
                  </div>
                </div>
                {exchangeRate && formData.amountSent && (
                  <div className="mt-4 text-sm text-blue-800">
                    <p><strong>سعر الصرف:</strong> 1 {formData.fromCurrencyCode} = {exchangeRate.rate} {formData.toCurrencyCode}</p>
                    <p><strong>العمولة ({exchangeRate.adminFeePercent}%):</strong> {((parseFloat(formData.amountSent) * exchangeRate.adminFeePercent) / 100).toFixed(2)} {formData.fromCurrencyCode}</p>
                    <p className="text-lg font-bold text-green-600 mt-2">
                      <strong>المستلم سيحصل على:</strong> {calculateReceived()} {formData.toCurrencyCode}
                    </p>
                  </div>
                )}
                {!exchangeRate && formData.amountSent && parseFloat(formData.amountSent) > 0 && (
                  <div className="mt-4 text-sm text-red-500 font-medium">
                    ⚠️ لم يتم العثور على سعر صرف بين هذه العملات.
                  </div>
                )}
              </div>

              {/* Sender Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">معلومات المرسل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="senderName"
                    value={formData.senderName}
                    onChange={handleChange}
                    placeholder="الاسم الكامل"
                    className="px-4 py-2 border rounded-lg"
                    required
                  />
                  <input
                    type="tel"
                    name="senderPhone"
                    value={formData.senderPhone}
                    onChange={handleChange}
                    placeholder="رقم الهاتف"
                    className="px-4 py-2 border rounded-lg"
                    required
                  />
                  <select
                    name="senderCountry"
                    value={formData.senderCountry}
                    onChange={handleChange}
                    className="px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="Sudan">السودان</option>
                    <option value="India">الهند</option>
                    <option value="United States">الولايات المتحدة</option>
                  </select>
                </div>
              </div>

              {/* Recipient Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">معلومات المستلم</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleChange}
                    placeholder="الاسم الكامل *"
                    className="px-4 py-2 border rounded-lg"
                    required
                  />
                  <input
                    type="tel"
                    name="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={handleChange}
                    placeholder="رقم الهاتف *"
                    className="px-4 py-2 border rounded-lg"
                    required
                  />
                  <select
                    name="recipientCountry"
                    value={formData.recipientCountry}
                    onChange={handleChange}
                    className="px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="India">الهند</option>
                    <option value="Sudan">السودان</option>
                    <option value="United States">الولايات المتحدة</option>
                  </select>
                  <input
                    type="text"
                    name="recipientBankName"
                    value={formData.recipientBankName}
                    onChange={handleChange}
                    placeholder="اسم البنك (اختياري)"
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    name="recipientAccountNumber"
                    value={formData.recipientAccountNumber}
                    onChange={handleChange}
                    placeholder="رقم الحساب (اختياري)"
                    className="px-4 py-2 border rounded-lg md:col-span-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !exchangeRate || !formData.amountSent || parseFloat(formData.amountSent) <= 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-lg"
              >
                {loading ? 'جاري الإنشاء...' : 'إنشاء التحويل'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Upload Receipt */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900">تم إنشاء التحويل بنجاح!</h3>
              <p className="text-gray-600 mt-2">
                الرقم المرجعي: <span className="font-mono font-bold text-indigo-600">{transactionRef}</span>
              </p>
            </div>

            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">الخطوة التالية: رفع إيصال الدفع</p>
              <p className="text-sm text-yellow-700 mt-1">
                يرجى تحويل المبلغ ورفع إثبات الدفع لإكمال المعاملة
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رفع الإيصال (صورة أو PDF)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-2">المقبول: JPG, PNG, GIF, PDF (حد أقصى 5MB)</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUploadReceipt}
                disabled={!receiptFile || loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                {loading ? 'جاري الرفع...' : 'رفع الإيصال'}
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
              >
                تخطي (رفع لاحقاً)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}