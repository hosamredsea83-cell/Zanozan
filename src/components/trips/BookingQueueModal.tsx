import React, { useState } from 'react';
import { Activity } from '../../types/activity';
import { 
  X, Clock, CheckCircle2, AlertTriangle, Users, MapPin, 
  Calendar, Phone, ShieldCheck, DollarSign, Car, Timer 
} from 'lucide-react';

export interface BookingRequest {
  id: string;
  bookingCode: string;
  activityId: string;
  activityName: string;
  slotLabel: string;
  tripDate: string;
  customerName: string;
  customerPhone: string;
  customerType: 'egyptian' | 'foreigner';
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  totalPriceEGP: number;
  totalPriceEUR: number;
  requiresPickup: boolean;
  pickupLocation: string;
  deadlineMinutesRemaining: number;
  status: 'pending_approval' | 'approved' | 'rejected' | 'auto_cancelled';
  rejectionReason?: string;
  createdAt: string;
}

export const INITIAL_BOOKING_REQUESTS: BookingRequest[] = [
  {
    id: 'req-101',
    bookingCode: 'ZN-84920',
    activityId: 'act-yacht-01',
    activityName: 'رحلة يخت ملكي VIP خاص - جزيرة الجفتون',
    slotLabel: '09:00 ص - الرحلة الصباحية',
    tripDate: '2026-11-09',
    customerName: 'كارل شنايدر (Karl Schneider)',
    customerPhone: '+49 170 8291032',
    customerType: 'foreigner',
    adultsCount: 4,
    childrenCount: 2,
    infantsCount: 0,
    totalPriceEGP: 0,
    totalPriceEUR: 320,
    requiresPickup: true,
    pickupLocation: 'فندق شتايجنبرجر ألدو بيتش - الغردقة',
    deadlineMinutesRemaining: 112,
    status: 'pending_approval',
    createdAt: 'منذ 38 دقيقة'
  },
  {
    id: 'req-102',
    bookingCode: 'ZN-84921',
    activityId: 'act-safari-02',
    activityName: 'سفاري الدفع الرباعي ATV والعشاء البدوي الفلكلوري',
    slotLabel: '02:30 م - رحلة الغروب والعشاء',
    tripDate: '2026-11-08',
    customerName: 'م. أحمد الشربيني',
    customerPhone: '+20 102 998 1234',
    customerType: 'egyptian',
    adultsCount: 3,
    childrenCount: 1,
    infantsCount: 0,
    totalPriceEGP: 2200,
    totalPriceEUR: 0,
    requiresPickup: true,
    pickupLocation: 'منتجع الجونة - مدخل رقم 2',
    deadlineMinutesRemaining: 45,
    status: 'pending_approval',
    createdAt: 'منذ ساعة و15 دقيقة'
  },
  {
    id: 'req-103',
    bookingCode: 'ZN-84922',
    activityId: 'act-diving-03',
    activityName: 'تجربة الغوص الاحترافي واستكشاف حطام السفن',
    slotLabel: '08:00 ص - غطستان مع معدات كاملة',
    tripDate: '2026-11-10',
    customerName: 'إيلينا بوبوفا (Elena Popova)',
    customerPhone: '+7 925 432 9811',
    customerType: 'foreigner',
    adultsCount: 2,
    childrenCount: 0,
    infantsCount: 0,
    totalPriceEGP: 0,
    totalPriceEUR: 170,
    requiresPickup: false,
    pickupLocation: 'الوصول المباشر لمركز الغوص بمارينا',
    deadlineMinutesRemaining: 175,
    status: 'pending_approval',
    createdAt: 'منذ 15 دقيقة'
  }
];

interface BookingQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  requests?: BookingRequest[];
  onApproveBooking?: (booking: BookingRequest) => void;
  onRejectBooking?: (bookingId: string, reason: string) => void;
}

export const BookingQueueModal: React.FC<BookingQueueModalProps> = ({
  isOpen,
  onClose,
  activities,
  requests: controlledRequests,
  onApproveBooking,
  onRejectBooking
}) => {
  const [localRequests, setLocalRequests] = useState<BookingRequest[]>(INITIAL_BOOKING_REQUESTS);
  const requests = controlledRequests ?? localRequests;
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('عدم توافر أماكن بالسعة القصوى المطلوبة');

  if (!isOpen) return null;

  const handleApprove = (req: BookingRequest) => {
    if (!controlledRequests) {
      setLocalRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'approved' } : r))
      );
    }
    if (onApproveBooking) {
      onApproveBooking(req);
    }
  };

  const handleReject = (id: string) => {
    if (!controlledRequests) {
      setLocalRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'rejected', rejectionReason: rejectReason } : r
        )
      );
    }
    if (onRejectBooking) {
      onRejectBooking(id, rejectReason);
    }
    setRejectingId(null);
  };

  const pendingCount = requests.filter((r) => r.status === 'pending_approval').length;
  const displayedRequests =
    filter === 'pending'
      ? requests.filter((r) => r.status === 'pending_approval')
      : requests;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-tajawal">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  طلبات الحجز الواردة ومهلة الاعتماد
                </h3>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                    {pendingCount} بانتظار الاعتماد
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                وفقاً للبند 4 (النقاط 24-30): تحديد مهلة الاعتماد والإلغاء التلقائي عند انتهاء الوقت.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filter === 'pending'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                قيد الانتظار ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filter === 'all'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل ({requests.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {displayedRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/50 mb-3" />
              <p className="text-sm font-semibold text-slate-300">لا توجد طلبات معلقة حالياً</p>
              <p className="text-xs text-slate-500 mt-1">
                تم اعتماد أو معالجة جميع حجوزات الأنشطة السياحية بنجاح.
              </p>
            </div>
          ) : (
            displayedRequests.map((req) => {
              const isUrgent = req.deadlineMinutesRemaining < 60;

              return (
                <div
                  key={req.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4.5 space-y-3.5 hover:border-slate-700 transition-all"
                >
                  {/* Top Bar: Code, Time remaining countdown, Activity Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                        #{req.bookingCode}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate max-w-md">
                        {req.activityName}
                      </h4>
                    </div>

                    {req.status === 'pending_approval' ? (
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
                          isUrgent
                            ? 'bg-rose-950/40 border-rose-600/50 text-rose-300 animate-pulse'
                            : 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                        }`}
                      >
                        <Timer className="w-3.5 h-3.5" />
                        <span>
                          متبقي: {Math.floor(req.deadlineMinutesRemaining / 60)} س و{' '}
                          {req.deadlineMinutesRemaining % 60} د
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          (إلغاء تلقائي بعدها)
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                          req.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-800/40'
                        }`}
                      >
                        {req.status === 'approved' ? '✓ تم الاعتماد بنجاح' : '✗ تم رفض الطلب'}
                      </span>
                    )}
                  </div>

                  {/* Booking Core Metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">العميل والاتصال:</span>
                      <span className="text-white font-semibold block">{req.customerName}</span>
                      <span className="text-slate-400 font-mono text-[11px] dir-ltr inline-block">
                        {req.customerPhone}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">الموعد والانطلاق:</span>
                      <span className="text-slate-200 font-semibold block font-mono">
                        {req.tripDate}
                      </span>
                      <span className="text-cyan-400 text-[11px] block">{req.slotLabel}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">الأفراد والركاب:</span>
                      <span className="text-white font-mono font-bold block">
                        {req.adultsCount} بالغ · {req.childrenCount} طفل
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {req.customerType === 'egyptian' ? 'تسعير مصريين' : 'تسعير أجانب'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">القيمة الإجمالية:</span>
                      <span className="text-sm font-bold font-mono text-emerald-400 block">
                        {req.customerType === 'egyptian'
                          ? `${req.totalPriceEGP.toLocaleString()} ج.م`
                          : `€${req.totalPriceEUR}`}
                      </span>
                      <span className="text-[10px] text-slate-500">مستحقة التحصيل</span>
                    </div>
                  </div>

                  {/* Logistics Section */}
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Car className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-slate-400">نقطة الاستقبال:</span>
                      <span className="font-medium text-white">{req.pickupLocation}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {req.createdAt}
                    </span>
                  </div>

                  {/* Action Buttons for Pending */}
                  {req.status === 'pending_approval' && (
                    <div className="pt-2 flex items-center justify-between">
                      {rejectingId === req.id ? (
                        <div className="flex-1 flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-rose-900/40">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="سبب رفض الحجز..."
                            className="flex-1 bg-slate-950 border border-slate-850 px-2 py-1 rounded text-xs text-white"
                          />
                          <button
                            onClick={() => handleReject(req.id)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold"
                          >
                            تأكيد الرفض
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full justify-end">
                          <button
                            onClick={() => setRejectingId(req.id)}
                            className="px-3 py-1.5 rounded-lg border border-rose-800/40 text-rose-300 hover:bg-rose-950/40 text-xs font-semibold transition-colors"
                          >
                            رفض الحجز
                          </button>
                          <button
                            onClick={() => handleApprove(req)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>اعتماد الحجز وتثبيت المقاعد</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {req.status === 'rejected' && req.rejectionReason && (
                    <div className="text-[11px] text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-900/40">
                      سبب الرفض: {req.rejectionReason}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>نظام التنبيهات المباشر لحجوزات الأنشطة والرحلات البحرية والغوص والسفاري</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
