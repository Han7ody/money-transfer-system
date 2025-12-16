'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowRight, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight,
  CheckCircle, X, FileText, AlertCircle, Clock, MapPin, Calendar,
  User, Phone, Mail, MessageSquare, Code
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import DebugPanel from '@/components/admin/DebugPanel';
import WhatsAppEscalationButton from '@/components/admin/WhatsAppEscalationButton';
import api from '@/lib/api';

interface KycReviewData {
  user: any;
  fraudScore: number;
  fraudMatches: any[];
  documents: any[];
  notes: any[];
  actionHistory: any[];
}

const REJECT_REASONS = [
  'الوثيقة غير واضحة',
  'الصورة غير مطابقة للهوية',
  'البيانات غير متناسقة',
  'الهوية منتهية الصلاحية',
  'لا يمكن قراءة النص',
  'الهوية لا تخص حامل الحساب',
  'صورة السيلفي غير مطابقة',
  'استخدمت صورة شاشة',
  'أخرى'
];

const REQUEST_MORE_DOCS = [
  'صورة أوضح للهوية',
  'رفع صورة الوجه (سيلفي) مرة أخرى',
  'نسخة خلفية للهوية',
  'إثبات عنوان سكن',
  'كشف حساب بنكي'
];

export default function KycReviewPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);

  const [data, setData] = useState<KycReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  
  // Action states
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'more'>('approve');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Notes
  const [newNote, setNewNote] = useState('');
  
  // Debug mode
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugData, setDebugData] = useState({
    apiLogs: [],
    stateTransitions: [],
    permissionChecks: [],
    routingParams: { userId, pathname: `/admin/kyc/review/${userId}` },
    contextData: {}
  });

  useEffect(() => {
    fetchReviewData();
  }, [userId]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/kyc/review/${userId}`);
      const reviewData = response.data?.data || response.data;
      setData(reviewData);
      if (reviewData?.documents && reviewData.documents.length > 0) {
        setSelectedDoc(reviewData.documents[0]);
      }
    } catch (error) {
      console.error('Failed to fetch review data:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchDocument = (direction: number) => {
    if (!data?.documents || data.documents.length === 0) return;
    const currentIndex = data.documents.findIndex(d => d.id === selectedDoc?.id);
    const newIndex = (currentIndex + direction + data.documents.length) % data.documents.length;
    setSelectedDoc(data.documents[newIndex]);
  };

  const handleAction = async () => {
    let reason = '';
    
    if (actionType === 'reject') {
      if (selectedReasons.length === 0) {
        alert('يرجى اختيار سبب واحد على الأقل');
        return;
      }
      reason = selectedReasons.join(', ');
      if (selectedReasons.includes('أخرى') && customReason.trim()) {
        reason += `: ${customReason}`;
      }
    } else if (actionType === 'more') {
      if (selectedReasons.length === 0) {
        alert('يرجى اختيار مستند واحد على الأقل');
        return;
      }
      reason = `طلب المستندات التالية: ${selectedReasons.join(', ')}`;
    } else if (actionType === 'approve') {
      if (!customReason.trim()) {
        alert('يرجى إدخال سبب الموافقة');
        return;
      }
      reason = customReason;
    }

    try {
      setActionLoading(true);
      const endpoint = actionType === 'more' ? 'request-more' : actionType;
      await api.post(`/admin/kyc/${userId}/${endpoint}`, { reason });
      
      alert(`تم ${actionType === 'approve' ? 'قبول' : actionType === 'reject' ? 'رفض' : 'طلب المستندات من'} الطلب بنجاح`);
      router.push('/admin/kyc/queue');
    } catch (error: any) {
      alert(error.response?.data?.message || 'فشل تنفيذ الإجراء');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await api.post(`/admin/kyc/${userId}/notes`, { message: newNote });
      setNewNote('');
      await fetchReviewData();
    } catch (error) {
      alert('فشل إضافة الملاحظة');
    }
  };

  const getDocumentUrl = (doc: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    if (doc.viewSide === 'back' && doc.backImageUrl) return `${baseUrl}${doc.backImageUrl}`;
    if (doc.frontImageUrl) return `${baseUrl}${doc.frontImageUrl}`;
    if (doc.backImageUrl) return `${baseUrl}${doc.backImageUrl}`;
    return '';
  };

  const getDocumentLabel = (doc: any) => {
    if (doc.documentType === 'NATIONAL_ID') return 'بطاقة الهوية';
    if (doc.documentType === 'SELFIE') return 'صورة شخصية';
    if (doc.documentType === 'PASSPORT') return 'جواز السفر';
    return 'وثيقة';
  };

  const getRiskBadge = () => {
    const score = data?.fraudScore || 0;
    if (score >= 80) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'مخاطر عالية' };
    if (score >= 50) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'مخاطر متوسطة' };
    return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'مخاطر منخفضة' };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">جاري تحميل البيانات...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-600">فشل تحميل البيانات</div>
        </div>
      </AdminLayout>
    );
  }

  const riskBadge = getRiskBadge();

  return (
    <AdminLayout>
      <div className="space-y-4" dir="rtl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push('/admin/kyc/queue')}
            className="text-slate-500 hover:text-indigo-600 transition-colors"
          >
            قائمة المراجعة
          </button>
          <ArrowRight className="w-4 h-4 text-slate-300 rotate-180" />
          <span className="text-slate-900 font-medium">{data.user.fullName}</span>
        </div>

        {/* User Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {data.user.fullName.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{data.user.fullName}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {data.user.country}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span className="en-digits">{new Date(data.user.kycSubmittedAt).toLocaleDateString('en-GB')}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border}`}>
              <AlertCircle className="w-5 h-5" />
              {riskBadge.label} ({data.fraudScore})
            </span>
          </div>
        </div>

        {/* Main Grid: 75/25 Split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left: Document Viewer (75%) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Document Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 flex-wrap">
                {data.documents.map((doc) => {
                  if (doc.documentType === 'NATIONAL_ID' && doc.frontImageUrl && doc.backImageUrl) {
                    return (
                      <div key={doc.id} className="flex gap-2">
                        <button
                          onClick={() => setSelectedDoc({ ...doc, viewSide: 'front' })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedDoc?.id === doc.id && selectedDoc?.viewSide === 'front'
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          الهوية (أمامي)
                        </button>
                        <button
                          onClick={() => setSelectedDoc({ ...doc, viewSide: 'back' })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedDoc?.id === doc.id && selectedDoc?.viewSide === 'back'
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          الهوية (خلفي)
                        </button>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedDoc?.id === doc.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {getDocumentLabel(doc)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Display */}
            <div className="bg-slate-900 rounded-xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => switchDocument(-1)}
                    className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => switchDocument(1)}
                    className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                    className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <span className="text-white text-sm min-w-[70px] text-center font-medium">{zoom}%</span>
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setRotation((rotation + 90) % 360)}
                    className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-8 flex items-center justify-center min-h-[600px] bg-slate-950">
                {selectedDoc && (
                  <img
                    src={getDocumentUrl(selectedDoc)}
                    alt={getDocumentLabel(selectedDoc)}
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease'
                    }}
                    className="max-w-full max-h-[600px] object-contain rounded-lg shadow-2xl"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right: Decision Panel (25%) */}
          <div className="space-y-4">
            {/* User Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                بيانات المستخدم
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs">{data.user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4" />
                  <span>{data.user.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span className="en-digits">{data.user.dateOfBirth ? new Date(data.user.dateOfBirth).toLocaleDateString('en-GB') : 'غير متوفر'}</span>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                ملاحظات المراجع
              </h3>
              
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="أضف ملاحظة..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-2 resize-none"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إضافة ملاحظة
              </button>
              
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {data.notes.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">لا توجد ملاحظات</p>
                ) : (
                  data.notes.map((note: any) => (
                    <div key={note.id} className="border-r-2 border-indigo-600 pr-2 py-2 bg-slate-50 rounded text-xs">
                      <p className="text-slate-900 font-medium">{note.message}</p>
                      <p className="text-slate-500 mt-1">
                        <span className="en-digits">{new Date(note.createdAt).toLocaleDateString('en-GB')} {new Date(note.createdAt).toLocaleTimeString('en-GB', { hour12: false })}</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action History */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                سجل الإجراءات
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {data.actionHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">لا توجد إجراءات</p>
                ) : (
                  data.actionHistory.map((action: any) => (
                    <div key={action.id} className="border-r-2 border-slate-300 pr-2 py-2 bg-slate-50 rounded text-xs">
                      <p className="text-slate-900 font-semibold">{action.action}</p>
                      {action.reason && <p className="text-slate-600 mt-1">{action.reason}</p>}
                      <p className="text-slate-500 mt-1">
                        <span className="en-digits">{new Date(action.createdAt).toLocaleDateString('en-GB')} {new Date(action.createdAt).toLocaleTimeString('en-GB', { hour12: false })}</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActionType('approve');
                  setShowActionModal(true);
                  setSelectedReasons([]);
                  setCustomReason('');
                }}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-md transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                قبول
              </button>
              <button
                onClick={() => {
                  setActionType('reject');
                  setShowActionModal(true);
                  setSelectedReasons([]);
                  setCustomReason('');
                }}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-md transition-all"
              >
                <X className="w-5 h-5" />
                رفض
              </button>
              <button
                onClick={() => {
                  setActionType('more');
                  setShowActionModal(true);
                  setSelectedReasons([]);
                  setCustomReason('');
                }}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md transition-all"
              >
                <FileText className="w-5 h-5" />
                طلب مستندات
              </button>
              <WhatsAppEscalationButton
                entityType="KYC"
                entityId={userId}
                entityData={data.user}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDebugPanel(true)}
                className="px-4 py-3 bg-amber-500/20 text-amber-600 rounded-lg hover:bg-amber-500/30 font-semibold transition-all flex items-center gap-2"
                title="Internal Debug Mode"
              >
                <Code className="w-5 h-5" />
                ℹ Debug
              </button>
              <button
                onClick={() => router.push('/admin/kyc/queue')}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>

        {/* Action Modal */}
        {showActionModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" dir="rtl">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    {actionType === 'approve' && 'اعتماد الوثائق'}
                    {actionType === 'reject' && 'رفض الطلب'}
                    {actionType === 'more' && 'طلب وثائق إضافية'}
                  </h2>
                  <button
                    onClick={() => setShowActionModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {actionType === 'reject' && (
                  <>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      اختر سبب الرفض <span className="text-red-600">*</span>
                    </label>
                    <div className="space-y-2 mb-4">
                      {REJECT_REASONS.map((reason) => (
                        <label
                          key={reason}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedReasons.includes(reason)
                              ? 'border-red-600 bg-red-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedReasons.includes(reason)}
                            onChange={() => {
                              setSelectedReasons(prev =>
                                prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
                              );
                            }}
                            className="w-4 h-4 text-red-600 rounded"
                          />
                          <span className="text-sm font-medium text-slate-900">{reason}</span>
                        </label>
                      ))}
                    </div>
                    
                    {selectedReasons.includes('أخرى') && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          تفاصيل إضافية
                        </label>
                        <textarea
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="اكتب السبب هنا..."
                          rows={4}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
                        />
                      </div>
                    )}
                  </>
                )}

                {actionType === 'more' && (
                  <>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      اختر المستندات المطلوبة <span className="text-indigo-600">*</span>
                    </label>
                    <div className="space-y-2 mb-4">
                      {REQUEST_MORE_DOCS.map((doc) => (
                        <label
                          key={doc}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedReasons.includes(doc)
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedReasons.includes(doc)}
                            onChange={() => {
                              setSelectedReasons(prev =>
                                prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
                              );
                            }}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="text-sm font-medium text-slate-900">{doc}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {actionType === 'approve' && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      سبب الموافقة <span className="text-green-600">*</span>
                    </label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="اكتب سبب الموافقة..."
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                    />
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAction}
                    disabled={actionLoading}
                    className={`flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                      actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                      actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {actionLoading ? 'جاري التنفيذ...' : 'تأكيد'}
                  </button>
                  <button
                    onClick={() => setShowActionModal(false)}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Panel */}
        {showDebugPanel && (
          <DebugPanel
            onClose={() => setShowDebugPanel(false)}
            debugData={debugData}
          />
        )}
      </div>
    </AdminLayout>
  );
}
