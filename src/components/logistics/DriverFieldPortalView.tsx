import React, { useMemo, useState } from 'react';
import {
  Navigation,
  Phone,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  Truck,
  Utensils,
  ReceiptText,
  Calendar,
  Coins,
  Wallet as WalletIcon
} from 'lucide-react';
import type { Activity } from '../../types/activity';
import type { AppUser } from '../../types/auth';
import type { LogisticsVehicle } from '../../types/logistics';
import type {
  BookingFinancialAllocation,
  DriverMissionRecord,
  DriverMissionStatus,
  Wallet
} from '../../types/finance';
import type { BookingRequest } from '../trips/BookingQueueModal';
import type { TripBooking } from '../bookings/BookingsManagerView';
import type { NavigationItemKey } from '../layout/Sidebar';

interface DriverFieldPortalViewProps {
  currentUser?: AppUser;
  wallet?: Wallet;
  allocations?: BookingFinancialAllocation[];
  activities: Activity[];
  activityBookings: BookingRequest[];
  tripBookings: TripBooking[];
  logisticsVehicles: LogisticsVehicle[];
  driverMissions: DriverMissionRecord[];
  onUpdateMissionStatus: (
    bookingId: string,
    bookingKind: 'activity_booking' | 'trip_booking',
    status: DriverMissionStatus
  ) => void;
  onNavigate: (key: NavigationItemKey) => void;
}

const STATUS_STEPS: Array<{
  key: DriverMissionStatus;
  label: string;
  activeClass: string;
}> = [
  { key: 'en_route', label: 'في الطريق', activeClass: 'bg-cyan-600 text-white border-cyan-500' },
  { key: 'picked_up', label: 'تم الاستلام', activeClass: 'bg-amber-600 text-white border-amber-500' },
  { key: 'arrived', label: 'وصل للنشاط', activeClass: 'bg-indigo-600 text-white border-indigo-500' },
  { key: 'completed', label: 'مكتملة', activeClass: 'bg-emerald-600 text-white border-emerald-500' }
];

export const DriverFieldPortalView: React.FC<DriverFieldPortalViewProps> = ({
  currentUser,
  wallet,
  allocations = [],
  activities,
  activityBookings,
  tripBookings,
  logisticsVehicles,
  driverMissions,
  onUpdateMissionStatus,
  onNavigate
}) => {
  const [dateFilter, setDateFilter] = useState<'all' | 'today'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  const todayIso = new Date().toISOString().split('T')[0];

  const missions = useMemo(() => {
    const missionMap = new Map(driverMissions.map((m) => [m.bookingId, m]));

    const actItems = activityBookings
      .filter((b) => b.status !== 'rejected' && b.status !== 'auto_cancelled')
      .map((b) => {
        const act = activities.find((a) => a.id === b.activityId);
        const assignedRef = act?.logistics?.assignedDriverOrVehicle;
        const linkedVeh = logisticsVehicles.find(
          (v) =>
            (assignedRef &&
              (v.id === assignedRef || v.name === assignedRef || v.driverName === assignedRef)) ||
            (act?.location?.city && v.city === act.location.city)
        );
        const record = missionMap.get(b.id);
        return {
          bookingId: b.id,
          bookingKind: 'activity_booking' as const,
          bookingCode: b.bookingCode,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          title: b.activityName,
          date: b.tripDate,
          timeLabel: b.slotLabel,
          pickupLocation: b.pickupLocation || act?.logistics?.pickupPoint || 'نقطة الالتقاء الرئيسية',
          dropoffLocation: act?.logistics?.dropoffPoint || act?.location?.primarySite || 'موقع النشاط',
          pax: b.adultsCount + b.childrenCount + b.infantsCount,
          requiresPickup: b.requiresPickup,
          vehicleLabel: linkedVeh ? `${linkedVeh.name} (${linkedVeh.driverName})` : act?.logistics?.assignedDriverOrVehicle || 'غير محدد',
          status: record?.status || ('assigned' as DriverMissionStatus)
        };
      });

    const tripItems = tripBookings
      .filter((tb) => tb.status !== 'cancelled')
      .map((tb) => {
        const record = missionMap.get(tb.id);
        return {
          bookingId: tb.id,
          bookingKind: 'trip_booking' as const,
          bookingCode: tb.bookingCode,
          customerName: tb.customerName,
          customerPhone: tb.customerPhone,
          title: tb.tripTitle,
          date: tb.departureDate,
          timeLabel: tb.departureTime,
          pickupLocation: tb.transportInfo || 'نقطة الانطلاق المتفق عليها',
          dropoffLocation: tb.tripTitle,
          pax: tb.adultsCount + tb.childrenCount + tb.infantsCount,
          requiresPickup: true,
          vehicleLabel: tb.transportInfo,
          status: record?.status || ('assigned' as DriverMissionStatus)
        };
      });

    return [...actItems, ...tripItems].filter((m) => {
      if (dateFilter === 'today' && m.date !== todayIso) return false;
      if (statusFilter === 'completed' && m.status !== 'completed') return false;
      if (statusFilter === 'active' && m.status === 'completed') return false;
      return true;
    });
  }, [
    activityBookings,
    tripBookings,
    activities,
    logisticsVehicles,
    driverMissions,
    dateFilter,
    statusFilter,
    todayIso
  ]);

  const allocationMap = useMemo(() => {
    const map = new Map<string, BookingFinancialAllocation>();
    allocations.forEach((a) => map.set(a.bookingId, a));
    return map;
  }, [allocations]);

  const driverEarnedTotalEGP = useMemo(() => {
    let sum = 0;
    for (const alloc of allocations) {
      if (alloc.status === 'refunded') continue;
      for (const p of alloc.payouts) {
        if (
          p.partnerRole === 'driver' &&
          (!currentUser || p.partyUserId === currentUser.id || p.walletId === wallet?.id)
        ) {
          sum += p.amountEGP;
        }
      }
    }
    return Math.round(sum);
  }, [allocations, currentUser, wallet?.id]);

  const counts = useMemo(() => {
    const completed = missions.filter((m) => m.status === 'completed').length;
    const totalPax = missions.reduce((s, m) => s + m.pax, 0);
    return { total: missions.length, completed, pending: missions.length - completed, totalPax };
  }, [missions]);

  return (
    <div className="space-y-5">
      {/* Mobile-First Top Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">تطبيق السائق والمندوب الميداني</h1>
              <p className="text-xs text-slate-400">
                مهام التوصيل، فتح الموقع على خرائط جوجل، وتحديث حالة استلام العملاء بلمسة واحدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setDateFilter(dateFilter === 'all' ? 'today' : 'all')}
              className="min-h-[44px] px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white flex items-center gap-2 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>{dateFilter === 'today' ? 'عرض: اليوم فقط' : 'عرض: كل المواعيد'}</span>
            </button>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {[
                { key: 'all', label: 'الكل' },
                { key: 'active', label: 'جارية' },
                { key: 'completed', label: 'مكتملة' }
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setStatusFilter(st.key as 'all' | 'active' | 'completed')}
                  className={`min-h-[36px] px-3 rounded-lg font-bold whitespace-nowrap ${
                    statusFilter === st.key
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">إجمالي المهام</span>
            <span className="text-lg font-bold text-white font-mono tabular-nums">
              {counts.total}
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">مهام متبقية</span>
            <span className="text-lg font-bold text-amber-300 font-mono tabular-nums">
              {counts.pending}
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">تم توصيلها</span>
            <span className="text-lg font-bold text-emerald-300 font-mono tabular-nums">
              {counts.completed}
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">إجمالي الركاب</span>
            <span className="text-lg font-bold text-cyan-300 font-mono tabular-nums">
              {counts.totalPax}
            </span>
          </div>
        </div>

        {/* Driver Earnings Strip */}
        <div className="bg-slate-950 border border-emerald-800/40 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="grid grid-cols-3 gap-4 flex-1">
            <div>
              <span className="text-[11px] text-slate-400 block">رصيد المحفظة (€)</span>
              <span className="text-sm font-bold text-cyan-300 font-mono tabular-nums">
                €{(wallet?.balanceEUR ?? 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">مستحقاتي من الحجوزات</span>
              <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                {driverEarnedTotalEGP.toLocaleString('en-US')} ج.م
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">عهدة الكاش باليد</span>
              <span className="text-sm font-bold text-amber-300 font-mono tabular-nums">
                {(wallet?.cashOnHandEGP ?? 0).toLocaleString('en-US')} ج.م
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('partner_earnings')}
            className="min-h-[40px] px-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            <span>كشف مستحقاتي المالية</span>
          </button>
        </div>
      </div>

      {/* Mission Cards Grid (1-col mobile, 2-col tablet/desktop) */}
      {missions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-400">
          لا توجد مهام توصيل حالياً ضمن الفلتر المحدد.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {missions.map((m) => {
            const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              m.pickupLocation
            )}`;
            const cleanTel = m.customerPhone.replace(/[^\d+]/g, '');

            return (
              <div
                key={m.bookingId}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-cyan-400 font-mono tabular-nums">
                        #{m.bookingCode} · {m.date} · {m.timeLabel}
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5 truncate">
                        {m.customerName}
                      </h3>
                      <div className="text-xs text-slate-400 truncate">{m.title}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(() => {
                        const alloc = allocationMap.get(m.bookingId);
                        const drvPayout = alloc?.payouts.find((p) => p.partnerRole === 'driver');
                        if (!drvPayout || drvPayout.amountEGP <= 0) return null;
                        return (
                          <div className="bg-emerald-950/40 border border-emerald-700/40 rounded-xl px-2.5 py-1.5 text-center">
                            <WalletIcon className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                            <span className="text-[11px] font-mono font-bold text-emerald-300 tabular-nums">
                              {drvPayout.amountEGP.toLocaleString()} ج.م
                            </span>
                          </div>
                        );
                      })()}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-center">
                        <Users className="w-3.5 h-3.5 text-cyan-400 mx-auto" />
                        <span className="text-xs font-mono font-bold text-white tabular-nums">
                          {m.pax} راكب
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pickup & Destination */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">نقطة الاستلام:</span>
                        <span className="text-white font-semibold">{m.pickupLocation}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">الوجهة / المركبة:</span>
                        <span className="text-slate-200">{m.dropoffLocation}</span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">
                          المركبة/السائق: {m.vehicleLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Phone & Google Maps Navigation (44px+ touch targets) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <a
                      href={`tel:${cleanTel}`}
                      className="min-h-[44px] px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      <span className="font-mono tabular-nums truncate">{m.customerPhone}</span>
                    </a>

                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <Navigation className="w-4 h-4 shrink-0" />
                      <span>فتح في خرائط جوجل</span>
                    </a>
                  </div>
                </div>

                {/* Thumb-zone 44px Status Progression + Quick Ops Links */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STATUS_STEPS.map((st) => {
                      const active = m.status === st.key;
                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() =>
                            onUpdateMissionStatus(m.bookingId, m.bookingKind, st.key)
                          }
                          className={`min-h-[44px] px-2 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-1 whitespace-nowrap ${
                            active
                              ? st.activeClass
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {active && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                          <span>{st.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('bookings_in_trip_requests')}
                      className="min-h-[40px] px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Utensils className="w-3.5 h-3.5 shrink-0" />
                      <span>طلب أثناء الرحلة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('finance_cashier')}
                      className="min-h-[40px] px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <ReceiptText className="w-3.5 h-3.5 shrink-0" />
                      <span>تحصيل نقدي</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
