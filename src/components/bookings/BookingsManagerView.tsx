import React, { useMemo, useState } from 'react';
import { Activity } from '../../types/activity';
import { BookingRequest } from '../trips/BookingQueueModal';
import {
  CalendarCheck,
  Ship,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Phone,
  Car,
  Timer,
  X,
  Ticket,
  Calendar,
  MapPin,
  CreditCard,
  Eye,
  Trash2
} from 'lucide-react';

export interface TripBooking {
  id: string;
  bookingCode: string;
  tripTitle: string;
  tripType: 'combo' | 'private_charter' | 'group_trip';
  linkedActivities: string[];
  departureDate: string;
  departureTime: string;
  customerName: string;
  customerPhone: string;
  customerType: 'egyptian' | 'foreigner';
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  totalPriceEGP: number;
  totalPriceEUR: number;
  paymentStatus: 'paid' | 'deposit' | 'pending';
  transportInfo: string;
  status: 'pending_approval' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export const INITIAL_TRIP_BOOKINGS: TripBooking[] = [
  {
    id: 'trp-bk-201',
    bookingCode: 'TR-5104',
    tripTitle: 'باقة المغامرة الذهبية المتكاملة (يخت ملكي + سفاري بدوي)',
    tripType: 'combo',
    linkedActivities: ['رحلة يخت ملكي VIP خاص - جزيرة الجفتون', 'سفاري الدفع الرباعي ATV والعشاء البدوي'],
    departureDate: '2026-11-14',
    departureTime: '09:00 ص',
    customerName: 'م. طارق المنياوي وعائلته',
    customerPhone: '+20 100 554 8812',
    customerType: 'egyptian',
    adultsCount: 4,
    childrenCount: 2,
    infantsCount: 1,
    totalPriceEGP: 6250,
    totalPriceEUR: 0,
    paymentStatus: 'paid',
    transportInfo: 'ميني باص سياحي مكيّف - فندق صن رايز الغردقة',
    status: 'confirmed',
    notes: 'توفير وجبات أطفال وسترات نجاة مقاس صغير',
    createdAt: 'منذ ساعتين'
  },
  {
    id: 'trp-bk-202',
    bookingCode: 'TR-5105',
    tripTitle: 'رحلة يخت خاص VIP بالكامل - محمية جزر الجفتون وأورانج باي',
    tripType: 'private_charter',
    linkedActivities: ['رحلة يخت ملكي VIP خاص - جزيرة الجفتون'],
    departureDate: '2026-11-15',
    departureTime: '08:30 ص',
    customerName: 'Lukas Weber & Group',
    customerPhone: '+49 151 7742 9901',
    customerType: 'foreigner',
    adultsCount: 8,
    childrenCount: 0,
    infantsCount: 0,
    totalPriceEGP: 0,
    totalPriceEUR: 450,
    paymentStatus: 'deposit',
    transportInfo: 'فان مرسيدس خاص VIP - الجونة (أبو تيج مارينا)',
    status: 'pending_approval',
    notes: 'طلب غداء مأكولات بحرية ومصور فوتوغرافي على اليخت',
    createdAt: 'منذ 25 دقيقة'
  },
  {
    id: 'trp-bk-203',
    bookingCode: 'TR-5106',
    tripTitle: 'باقة الفرسان وشبه الغواصة العائلية',
    tripType: 'combo',
    linkedActivities: ['جولة شبه الغواصة البانورامية', 'ركوب الخيل العربي على الشاطئ'],
    departureDate: '2026-11-16',
    departureTime: '10:00 ص',
    customerName: 'Claire Moreau',
    customerPhone: '+33 6 44 12 88 05',
    customerType: 'foreigner',
    adultsCount: 2,
    childrenCount: 2,
    infantsCount: 0,
    totalPriceEGP: 0,
    totalPriceEUR: 72,
    paymentStatus: 'paid',
    transportInfo: 'توصيل مشترك - سهل حشيش',
    status: 'confirmed',
    createdAt: 'أمس 06:40 م'
  },
  {
    id: 'trp-bk-204',
    bookingCode: 'TR-5107',
    tripTitle: 'رحلة جماعية منظمة - سنوركلينج شعاب الفانوس والدلافين',
    tripType: 'group_trip',
    linkedActivities: ['تجربة الغوص الاحترافي والسنوركلينج'],
    departureDate: '2026-11-12',
    departureTime: '09:30 ص',
    customerName: 'أ. سارة عبد الرحمن',
    customerPhone: '+20 111 320 4490',
    customerType: 'egyptian',
    adultsCount: 5,
    childrenCount: 1,
    infantsCount: 1,
    totalPriceEGP: 3100,
    totalPriceEUR: 0,
    paymentStatus: 'paid',
    transportInfo: 'حافلة سياحية رقم 412 - الممشى السياحي',
    status: 'completed',
    createdAt: 'منذ يومين'
  }
];

interface BookingsManagerViewProps {
  mode: 'activities' | 'trips';
  activities: Activity[];
  activityBookings: BookingRequest[];
  onApproveActivityBooking: (booking: BookingRequest) => void;
  onRejectActivityBooking: (bookingId: string, reason: string) => void;
  onAddActivityBooking: (booking: BookingRequest) => void;
  tripBookings: TripBooking[];
  onUpdateTripBookingStatus: (bookingId: string, status: TripBooking['status']) => void;
  onAddTripBooking: (booking: TripBooking) => void;
  onDeleteTripBooking: (bookingId: string) => void;
}

export const BookingsManagerView: React.FC<BookingsManagerViewProps> = ({
  mode,
  activities,
  activityBookings,
  onApproveActivityBooking,
  onRejectActivityBooking,
  onAddActivityBooking,
  tripBookings,
  onUpdateTripBookingStatus,
  onAddTripBooking,
  onDeleteTripBooking
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [nationalityFilter, setNationalityFilter] = useState<'all' | 'egyptian' | 'foreigner'>('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('عدم توافر أماكن بالسعة القصوى المطلوبة');
  const [selectedDetails, setSelectedDetails] = useState<BookingRequest | TripBooking | null>(null);

  // Add New Booking Modal state
  const [showAddModal, setShowAddModal] = useState(false);

  // Activity booking form state
  const [selectedActId, setSelectedActId] = useState(activities[0]?.id || '');
  const [selectedSlotLabel, setSelectedSlotLabel] = useState(activities[0]?.slots[0]?.timeLabel || '09:00 ص');
  const [actCustomerName, setActCustomerName] = useState('');
  const [actCustomerPhone, setActCustomerPhone] = useState('');
  const [actCustomerType, setActCustomerType] = useState<'egyptian' | 'foreigner'>('egyptian');
  const [actTripDate, setActTripDate] = useState('2026-11-15');
  const [actAdults, setActAdults] = useState(2);
  const [actChildren, setActChildren] = useState(1);
  const [actInfants, setActInfants] = useState(0);
  const [actPickup, setActPickup] = useState('مارينا الغردقة الجديدة');

  // Trip booking form state
  const [tripTitle, setTripTitle] = useState('باقة المغامرة الذهبية المتكاملة (يخت ملكي + سفاري بدوي)');
  const [tripType, setTripType] = useState<TripBooking['tripType']>('combo');
  const [tripDate, setTripDate] = useState('2026-11-18');
  const [tripTime, setTripTime] = useState('09:00 ص');
  const [tripCustomerName, setTripCustomerName] = useState('');
  const [tripCustomerPhone, setTripCustomerPhone] = useState('');
  const [tripCustomerType, setTripCustomerType] = useState<'egyptian' | 'foreigner'>('egyptian');
  const [tripAdults, setTripAdults] = useState(2);
  const [tripChildren, setTripChildren] = useState(0);
  const [tripInfants, setTripInfants] = useState(0);
  const [tripPrice, setTripPrice] = useState(2500);
  const [tripPaymentStatus, setTripPaymentStatus] = useState<TripBooking['paymentStatus']>('deposit');
  const [tripTransport, setTripTransport] = useState('نقل سياحي مكيّف - الغردقة');

  const selectedActivity = useMemo(
    () => activities.find((a) => a.id === selectedActId) || activities[0],
    [activities, selectedActId]
  );

  const estimatedActPrice = useMemo(() => {
    if (!selectedActivity) return { egp: 0, eur: 0 };
    if (actCustomerType === 'egyptian') {
      const p = selectedActivity.pricing.egyptianB2C;
      return {
        egp: actAdults * p.adultEGP + actChildren * p.childEGP + actInfants * p.infantEGP,
        eur: 0
      };
    }
    const p = selectedActivity.pricing.foreignerB2C;
    return {
      egp: 0,
      eur: actAdults * p.adultEUR + actChildren * p.childEUR + actInfants * p.infantEUR
    };
  }, [selectedActivity, actCustomerType, actAdults, actChildren, actInfants]);

  const filteredActivityBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activityBookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (nationalityFilter !== 'all' && b.customerType !== nationalityFilter) return false;
      if (!q) return true;
      return (
        b.bookingCode.toLowerCase().includes(q) ||
        b.activityName.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.toLowerCase().includes(q)
      );
    });
  }, [activityBookings, searchQuery, statusFilter, nationalityFilter]);

  const filteredTripBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tripBookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (nationalityFilter !== 'all' && b.customerType !== nationalityFilter) return false;
      if (!q) return true;
      return (
        b.bookingCode.toLowerCase().includes(q) ||
        b.tripTitle.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.toLowerCase().includes(q)
      );
    });
  }, [tripBookings, searchQuery, statusFilter, nationalityFilter]);

  const stats = useMemo(() => {
    if (mode === 'activities') {
      const pending = activityBookings.filter((b) => b.status === 'pending_approval').length;
      const approved = activityBookings.filter((b) => b.status === 'approved').length;
      const totalEGP = activityBookings
        .filter((b) => b.status !== 'rejected' && b.status !== 'auto_cancelled')
        .reduce((sum, b) => sum + b.totalPriceEGP, 0);
      const totalEUR = activityBookings
        .filter((b) => b.status !== 'rejected' && b.status !== 'auto_cancelled')
        .reduce((sum, b) => sum + b.totalPriceEUR, 0);
      return { total: activityBookings.length, pending, confirmed: approved, totalEGP, totalEUR };
    }
    const pending = tripBookings.filter((b) => b.status === 'pending_approval').length;
    const confirmed = tripBookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').length;
    const totalEGP = tripBookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalPriceEGP, 0);
    const totalEUR = tripBookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalPriceEUR, 0);
    return { total: tripBookings.length, pending, confirmed, totalEGP, totalEUR };
  }, [mode, activityBookings, tripBookings]);

  const handleCreateActivityBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !actCustomerName.trim()) return;
    const newBooking: BookingRequest = {
      id: `req-${Date.now().toString().slice(-4)}`,
      bookingCode: `ZN-${Math.floor(85000 + Math.random() * 9999)}`,
      activityId: selectedActivity.id,
      activityName: selectedActivity.name,
      slotLabel: selectedSlotLabel || selectedActivity.slots[0]?.timeLabel || '09:00 ص',
      tripDate: actTripDate,
      customerName: actCustomerName.trim(),
      customerPhone: actCustomerPhone.trim() || '+20 100 000 0000',
      customerType: actCustomerType,
      adultsCount: actAdults,
      childrenCount: actChildren,
      infantsCount: actInfants,
      totalPriceEGP: estimatedActPrice.egp,
      totalPriceEUR: estimatedActPrice.eur,
      requiresPickup: Boolean(actPickup.trim()),
      pickupLocation: actPickup.trim() || 'الوصول المباشر للموقع',
      deadlineMinutesRemaining: 120,
      status: 'pending_approval',
      createdAt: 'الآن'
    };
    onAddActivityBooking(newBooking);
    setActCustomerName('');
    setActCustomerPhone('');
    setShowAddModal(false);
  };

  const handleCreateTripBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripCustomerName.trim() || !tripTitle.trim()) return;
    const newTripBooking: TripBooking = {
      id: `trp-bk-${Date.now().toString().slice(-4)}`,
      bookingCode: `TR-${Math.floor(5200 + Math.random() * 4500)}`,
      tripTitle: tripTitle.trim(),
      tripType,
      linkedActivities: activities.slice(0, 2).map((a) => a.name),
      departureDate: tripDate,
      departureTime: tripTime,
      customerName: tripCustomerName.trim(),
      customerPhone: tripCustomerPhone.trim() || '+20 100 000 0000',
      customerType: tripCustomerType,
      adultsCount: tripAdults,
      childrenCount: tripChildren,
      infantsCount: tripInfants,
      totalPriceEGP: tripCustomerType === 'egyptian' ? tripPrice : 0,
      totalPriceEUR: tripCustomerType === 'foreigner' ? tripPrice : 0,
      paymentStatus: tripPaymentStatus,
      transportInfo: tripTransport.trim() || 'نقل سياحي مشترك',
      status: 'pending_approval',
      createdAt: 'الآن'
    };
    onAddTripBooking(newTripBooking);
    setTripCustomerName('');
    setTripCustomerPhone('');
    setShowAddModal(false);
  };

  const tripTypeLabel = (t: TripBooking['tripType']) => {
    if (t === 'combo') return 'رحلة مجمعة (Combo)';
    if (t === 'private_charter') return 'يخت / رحلة خاصة VIP';
    return 'رحلة جماعية منظمة';
  };

  const paymentStatusBadge = (s: TripBooking['paymentStatus']) => {
    if (s === 'paid') return { label: 'مدفوع بالكامل', cls: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50' };
    if (s === 'deposit') return { label: 'عربون مدفوع', cls: 'bg-amber-950/70 text-amber-300 border-amber-700/50' };
    return { label: 'بانتظار السداد', cls: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            {mode === 'activities' ? <CalendarCheck className="w-6 h-6" /> : <Ship className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-white">
              {mode === 'activities' ? 'إدارة الحجوزات › حجوزات الأنشطة' : 'إدارة الحجوزات › حجوزات الرحلات'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'activities'
                ? 'متابعة واعتماد طلبات حجز الأنشطة السياحية الفردية، مواعيد التشغيل، ونقاط الاستقبال.'
                : 'متابعة حجوزات الرحلات المجمعة (Combo)، الرحلات الخاصة VIP، وحجوزات المجموعات والنقل المشترك.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-950/40 transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{mode === 'activities' ? '+ تسجيل حجز نشاط' : '+ تسجيل حجز رحلة'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 block">
            {mode === 'activities' ? 'إجمالي حجوزات الأنشطة' : 'إجمالي حجوزات الرحلات'}
          </span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">{stats.total}</span>
        </div>

        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4">
          <span className="text-[11px] text-amber-300/80 block">بانتظار الاعتماد</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">{stats.pending}</span>
        </div>

        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-4">
          <span className="text-[11px] text-emerald-300/80 block">حجوزات مؤكدة / مكتملة</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">{stats.confirmed}</span>
        </div>

        <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-4">
          <span className="text-[11px] text-cyan-300/80 block">إجمالي قيمة الحجوزات النشطة</span>
          <div className="flex flex-wrap items-baseline gap-2 mt-1">
            <span className="text-lg font-bold font-mono text-white">{stats.totalEGP.toLocaleString()} ج.م</span>
            <span className="text-sm font-bold font-mono text-cyan-400">/ €{stats.totalEUR.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              mode === 'activities'
                ? 'ابحث بكود الحجز (ZN-...) أو اسم العميل أو النشاط...'
                : 'ابحث بكود الرحلة (TR-...) أو اسم العميل أو الباقة...'
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            {(mode === 'activities'
              ? [
                  { id: 'all', label: 'الكل' },
                  { id: 'pending_approval', label: 'قيد الانتظار' },
                  { id: 'approved', label: 'مؤكد' },
                  { id: 'rejected', label: 'مرفوض' }
                ]
              : [
                  { id: 'all', label: 'الكل' },
                  { id: 'pending_approval', label: 'قيد الانتظار' },
                  { id: 'confirmed', label: 'مؤكد' },
                  { id: 'completed', label: 'مكتمل' },
                  { id: 'cancelled', label: 'ملغي' }
                ]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === tab.id ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Nationality Filter */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            {[
              { id: 'all', label: 'كل الجنسيات' },
              { id: 'egyptian', label: 'مصري (EGP)' },
              { id: 'foreigner', label: 'أجنبي (EUR)' }
            ].map((nf) => (
              <button
                key={nf.id}
                type="button"
                onClick={() => setNationalityFilter(nf.id as 'all' | 'egyptian' | 'foreigner')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  nationalityFilter === nf.id ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {nf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LIST: ACTIVITY BOOKINGS */}
      {mode === 'activities' && (
        <div className="space-y-3">
          {filteredActivityBookings.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-xs">
              لا توجد حجوزات أنشطة مطابقة لمعايير البحث الحالية.
            </div>
          ) : (
            filteredActivityBookings.map((req) => {
              const isUrgent = req.deadlineMinutesRemaining < 60;
              return (
                <div
                  key={req.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded shrink-0">
                        #{req.bookingCode}
                      </span>
                      <h3 className="text-sm font-bold text-white truncate">{req.activityName}</h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'pending_approval' ? (
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold ${
                            isUrgent
                              ? 'bg-rose-950/40 border-rose-600/50 text-rose-300'
                              : 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                          }`}
                        >
                          <Timer className="w-3.5 h-3.5" />
                          متبقي {Math.floor(req.deadlineMinutesRemaining / 60)} س و {req.deadlineMinutesRemaining % 60} د
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                            req.status === 'approved'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/40'
                              : 'bg-rose-950/70 text-rose-300 border-rose-700/40'
                          }`}
                        >
                          {req.status === 'approved' ? '✓ تم الاعتماد وتثبيت المقاعد' : '✗ مرفوض'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedDetails(req)}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                        title="عرض تفاصيل الحجز"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">العميل والاتصال</span>
                      <span className="text-white font-semibold block">{req.customerName}</span>
                      <span dir="ltr" className="text-slate-400 font-mono text-[11px] inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {req.customerPhone}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">موعد التشغيل</span>
                      <span className="text-slate-200 font-mono font-semibold block">{req.tripDate}</span>
                      <span className="text-cyan-400 text-[11px]">{req.slotLabel}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">تفاصيل الأفراد</span>
                      <span className="text-white font-mono font-bold block">
                        {req.adultsCount} بالغ · {req.childrenCount} طفل
                        {req.infantsCount > 0 ? ` · ${req.infantsCount} رضيع` : ''}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {req.customerType === 'egyptian' ? 'تسعير مصري (EGP)' : 'تسعير أجنبي (EUR)'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">القيمة الإجمالية</span>
                      <span className="text-sm font-bold font-mono text-emerald-400 block">
                        {req.customerType === 'egyptian'
                          ? `${req.totalPriceEGP.toLocaleString()} ج.م`
                          : `€${req.totalPriceEUR.toLocaleString()}`}
                      </span>
                      <span className="text-[10px] text-slate-500">{req.createdAt}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Car className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-slate-400">نقطة الاستقبال:</span>
                      <span className="text-white font-medium">{req.pickupLocation}</span>
                    </div>

                    {req.status === 'pending_approval' && (
                      <div className="flex items-center gap-2 justify-end">
                        {rejectingId === req.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="bg-slate-900 border border-rose-800/50 rounded-lg px-2 py-1 text-xs text-white"
                              placeholder="سبب الرفض..."
                            />
                            <button
                              type="button"
                              onClick={() => {
                                onRejectActivityBooking(req.id, rejectReason);
                                setRejectingId(null);
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              تأكيد
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingId(null)}
                              className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setRejectingId(req.id)}
                              className="px-3 py-1.5 rounded-lg border border-rose-800/50 text-rose-300 hover:bg-rose-950/50 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              رفض
                            </button>
                            <button
                              type="button"
                              onClick={() => onApproveActivityBooking(req)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>اعتماد الحجز</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {req.status === 'rejected' && req.rejectionReason && (
                    <div className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-900/40 rounded-lg px-3 py-1.5">
                      سبب الرفض: {req.rejectionReason}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* LIST: TRIP BOOKINGS */}
      {mode === 'trips' && (
        <div className="space-y-3">
          {filteredTripBookings.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-xs">
              لا توجد حجوزات رحلات مطابقة لمعايير البحث الحالية.
            </div>
          ) : (
            filteredTripBookings.map((tb) => {
              const payBadge = paymentStatusBadge(tb.paymentStatus);
              return (
                <div
                  key={tb.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-700/40 px-2.5 py-0.5 rounded shrink-0">
                        #{tb.bookingCode}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300">
                        {tripTypeLabel(tb.tripType)}
                      </span>
                      <h3 className="text-sm font-bold text-white truncate">{tb.tripTitle}</h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${payBadge.cls}`}>
                        {payBadge.label}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          tb.status === 'confirmed'
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/40'
                            : tb.status === 'completed'
                              ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700/40'
                              : tb.status === 'cancelled'
                                ? 'bg-rose-950/70 text-rose-300 border-rose-700/40'
                                : 'bg-amber-950/60 text-amber-300 border-amber-700/40'
                        }`}
                      >
                        {tb.status === 'confirmed'
                          ? '✓ مؤكد'
                          : tb.status === 'completed'
                            ? '✓ مكتمل'
                            : tb.status === 'cancelled'
                              ? '✗ ملغي'
                              : '⏳ بانتظار الاعتماد'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">العميل / المجموعة</span>
                      <span className="text-white font-semibold block">{tb.customerName}</span>
                      <span dir="ltr" className="text-slate-400 font-mono text-[11px] inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {tb.customerPhone}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">تاريخ وموعد الرحلة</span>
                      <span className="text-slate-200 font-mono font-semibold block">{tb.departureDate}</span>
                      <span className="text-cyan-400 text-[11px]">الانطلاق: {tb.departureTime}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">الركاب المشاركون</span>
                      <span className="text-white font-mono font-bold block">
                        {tb.adultsCount} بالغ · {tb.childrenCount} طفل
                        {tb.infantsCount > 0 ? ` · ${tb.infantsCount} رضيع` : ''}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {tb.customerType === 'egyptian' ? 'تسعير مصري (EGP)' : 'تسعير أجنبي (EUR)'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">إجمالي قيمة الرحلة</span>
                      <span className="text-sm font-bold font-mono text-emerald-400 block">
                        {tb.customerType === 'egyptian'
                          ? `${tb.totalPriceEGP.toLocaleString()} ج.م`
                          : `€${tb.totalPriceEUR.toLocaleString()}`}
                      </span>
                      <span className="text-[10px] text-slate-500">{tb.createdAt}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Car className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-slate-400">النقل والانتقالات:</span>
                      <span className="text-white font-medium">{tb.transportInfo}</span>
                    </div>

                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      {tb.status === 'pending_approval' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onUpdateTripBookingStatus(tb.id, 'cancelled')}
                            className="px-3 py-1.5 rounded-lg border border-rose-800/50 text-rose-300 hover:bg-rose-950/50 text-xs font-semibold cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateTripBookingStatus(tb.id, 'confirmed')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>اعتماد الرحلة</span>
                          </button>
                        </>
                      )}
                      {tb.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => onUpdateTripBookingStatus(tb.id, 'completed')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تأكيد إتمام الرحلة</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedDetails(tb)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 cursor-pointer"
                        title="التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTripBooking(tb.id)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="حذف السجل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">
                  تفاصيل الحجز #{selectedDetails.bookingCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetails(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                <div className="text-slate-400">
                  {'activityName' in selectedDetails ? 'النشاط السياحي:' : 'اسم الرحلة / الباقة:'}
                </div>
                <div className="text-white font-bold text-sm">
                  {'activityName' in selectedDetails ? selectedDetails.activityName : selectedDetails.tripTitle}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <span className="text-slate-400 block text-[11px]">العميل</span>
                  <span className="text-white font-semibold block mt-0.5">{selectedDetails.customerName}</span>
                  <span dir="ltr" className="text-cyan-400 font-mono text-[11px]">{selectedDetails.customerPhone}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <span className="text-slate-400 block text-[11px]">الموعد</span>
                  <span className="text-white font-mono font-semibold block mt-0.5">
                    {'tripDate' in selectedDetails ? selectedDetails.tripDate : selectedDetails.departureDate}
                  </span>
                  <span className="text-cyan-400 text-[11px]">
                    {'slotLabel' in selectedDetails ? selectedDetails.slotLabel : selectedDetails.departureTime}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">الأفراد</span>
                  <span className="text-white font-mono font-bold">
                    {selectedDetails.adultsCount} بالغ · {selectedDetails.childrenCount} طفل · {selectedDetails.infantsCount} رضيع
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-slate-400 block text-[11px]">الإجمالي</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">
                    {selectedDetails.customerType === 'egyptian'
                      ? `${selectedDetails.totalPriceEGP.toLocaleString()} ج.م`
                      : `€${selectedDetails.totalPriceEUR.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {'linkedActivities' in selectedDetails && selectedDetails.linkedActivities.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                  <span className="text-slate-400 block text-[11px]">الأنشطة المشمولة بالرحلة:</span>
                  {selectedDetails.linkedActivities.map((act, i) => (
                    <div key={i} className="text-cyan-300 text-[11px]">• {act}</div>
                  ))}
                </div>
              )}

              {'notes' in selectedDetails && selectedDetails.notes && (
                <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-amber-200">
                  ملاحظات: {selectedDetails.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDetails(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                {mode === 'activities' ? (
                  <CalendarCheck className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Ship className="w-4 h-4 text-cyan-400" />
                )}
                <span>{mode === 'activities' ? 'تسجيل حجز نشاط جديد' : 'تسجيل حجز رحلة جديدة'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mode === 'activities' ? (
              <form onSubmit={handleCreateActivityBooking} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">اختر النشاط</label>
                  <select
                    value={selectedActId}
                    onChange={(e) => {
                      const nextAct = activities.find((a) => a.id === e.target.value);
                      setSelectedActId(e.target.value);
                      if (nextAct?.slots[0]) setSelectedSlotLabel(nextAct.slots[0].timeLabel);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {activities.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">تاريخ النشاط</label>
                    <input
                      type="date"
                      value={actTripDate}
                      onChange={(e) => setActTripDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">موعد الانطلاق</label>
                    <select
                      value={selectedSlotLabel}
                      onChange={(e) => setSelectedSlotLabel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      {(selectedActivity?.slots.length
                        ? selectedActivity.slots
                        : [{ id: 'def', timeLabel: '09:00 ص' }]
                      ).map((sl) => (
                        <option key={sl.id} value={sl.timeLabel}>
                          {sl.timeLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">اسم العميل</label>
                    <input
                      type="text"
                      required
                      value={actCustomerName}
                      onChange={(e) => setActCustomerName(e.target.value)}
                      placeholder="الاسم الكامل..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">رقم الهاتف</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={actCustomerPhone}
                      onChange={(e) => setActCustomerPhone(e.target.value)}
                      placeholder="+20 10..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">فئة التسعير</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActCustomerType('egyptian')}
                      className={`py-2 rounded-xl border font-bold cursor-pointer ${
                        actCustomerType === 'egyptian'
                          ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      مصري (EGP)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActCustomerType('foreigner')}
                      className={`py-2 rounded-xl border font-bold cursor-pointer ${
                        actCustomerType === 'foreigner'
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      أجنبي (EUR)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">بالغ</label>
                    <input
                      type="number"
                      min={1}
                      value={actAdults}
                      onChange={(e) => setActAdults(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-center font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">طفل</label>
                    <input
                      type="number"
                      min={0}
                      value={actChildren}
                      onChange={(e) => setActChildren(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-center font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">رضيع</label>
                    <input
                      type="number"
                      min={0}
                      value={actInfants}
                      onChange={(e) => setActInfants(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-center font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">نقطة الاستقبال</label>
                  <input
                    type="text"
                    value={actPickup}
                    onChange={(e) => setActPickup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">التكلفة المحسوبة تلقائياً:</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {actCustomerType === 'egyptian'
                      ? `${estimatedActPrice.egp.toLocaleString()} ج.م`
                      : `€${estimatedActPrice.eur.toLocaleString()}`}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer"
                  >
                    حفظ الحجز
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateTripBooking} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">عنوان الرحلة / الباقة</label>
                  <input
                    type="text"
                    required
                    value={tripTitle}
                    onChange={(e) => setTripTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">نوع الرحلة</label>
                    <select
                      value={tripType}
                      onChange={(e) => setTripType(e.target.value as TripBooking['tripType'])}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white"
                    >
                      <option value="combo">رحلة مجمعة (Combo)</option>
                      <option value="private_charter">رحلة خاصة VIP</option>
                      <option value="group_trip">رحلة جماعية</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">التاريخ</label>
                    <input
                      type="date"
                      value={tripDate}
                      onChange={(e) => setTripDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">الساعة</label>
                    <input
                      type="text"
                      value={tripTime}
                      onChange={(e) => setTripTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">اسم العميل / المسؤول</label>
                    <input
                      type="text"
                      required
                      value={tripCustomerName}
                      onChange={(e) => setTripCustomerName(e.target.value)}
                      placeholder="الاسم الكامل..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">رقم الهاتف</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={tripCustomerPhone}
                      onChange={(e) => setTripCustomerPhone(e.target.value)}
                      placeholder="+20 10..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">بالغ</label>
                    <input
                      type="number"
                      min={1}
                      value={tripAdults}
                      onChange={(e) => setTripAdults(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-center font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">طفل</label>
                    <input
                      type="number"
                      min={0}
                      value={tripChildren}
                      onChange={(e) => setTripChildren(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-center font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">رضيع</label>
                    <input
                      type="number"
                      min={0}
                      value={tripInfants}
                      onChange={(e) => setTripInfants(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-center font-mono text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">الجنسية</label>
                    <select
                      value={tripCustomerType}
                      onChange={(e) => setTripCustomerType(e.target.value as 'egyptian' | 'foreigner')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white"
                    >
                      <option value="egyptian">مصري (ج.م)</option>
                      <option value="foreigner">أجنبي (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">
                      الإجمالي ({tripCustomerType === 'egyptian' ? 'ج.م' : '€'})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={tripPrice}
                      onChange={(e) => setTripPrice(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 font-mono text-emerald-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">حالة السداد</label>
                    <select
                      value={tripPaymentStatus}
                      onChange={(e) => setTripPaymentStatus(e.target.value as TripBooking['paymentStatus'])}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white"
                    >
                      <option value="paid">مدفوع بالكامل</option>
                      <option value="deposit">عربون مدفوع</option>
                      <option value="pending">بانتظار السداد</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">بيانات النقل والانتقالات</label>
                  <input
                    type="text"
                    value={tripTransport}
                    onChange={(e) => setTripTransport(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer"
                  >
                    حفظ حجز الرحلة
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
