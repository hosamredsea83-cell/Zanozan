import React, { useState } from 'react';
import { Activity } from '../../types/activity';
import { Clock, Calendar, Users, MapPin, CheckCircle2, AlertTriangle, Compass, Shield } from 'lucide-react';

interface DailyScheduleViewProps {
  activities: Activity[];
}

export const DailyScheduleView: React.FC<DailyScheduleViewProps> = ({ activities }) => {
  const [selectedDay, setSelectedDay] = useState<string>('today');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Days list
  const days = [
    { id: 'today', label: 'اليوم (السبت)' },
    { id: 'sun', label: 'الأحد' },
    { id: 'mon', label: 'الإثنين' },
    { id: 'tue', label: 'الثلاثاء' },
    { id: 'wed', label: 'الأربعاء' },
    { id: 'thu', label: 'الخميس' },
    { id: 'fri', label: 'الجمعة' }
  ];

  // Flatten all slots across published activities
  const allScheduledSlots = activities.flatMap((act) =>
    act.slots.map((slot) => ({
      slotId: slot.id,
      activityId: act.id,
      activityName: act.name,
      primaryCategory: act.primaryCategory,
      city: act.location.city,
      primarySite: act.location.primarySite,
      timeLabel: slot.timeLabel,
      maxCapacity: slot.maxCapacity,
      bookedCount: slot.bookedCount,
      availableCount: slot.availableCount,
      ownerCompany: act.owner.companyName,
      driverVehicle: act.logistics.assignedDriverOrVehicle || 'نقل مجمّع عند الطلب'
    }))
  );

  const filteredSlots = allScheduledSlots.filter((slot) =>
    selectedFilter === 'all' ? true : slot.primaryCategory === selectedFilter
  );

  return (
    <div className="space-y-6">
      {/* Header and Day Picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>جدول مواعيد انطلاق الرحلات اليومية (بند 9 & 18)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            البنود 67 إلى 73: ربط مواعيد الانطلاق بالسعة الاستيعابية لكل رحلة وتتبع الشواغر لحظياً.
          </p>
        </div>

        {/* Days selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          {days.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDay(d.id)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedDay === d.id
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-semibold">تصفية نوع الرحلة:</span>
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            selectedFilter === 'all'
              ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30 font-bold'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          الكل ({allScheduledSlots.length})
        </button>
        <button
          onClick={() => setSelectedFilter('yacht')}
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            selectedFilter === 'yacht'
              ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30 font-bold'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          ⛵ رحلات اليخوت
        </button>
        <button
          onClick={() => setSelectedFilter('horse_riding')}
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            selectedFilter === 'horse_riding'
              ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30 font-bold'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          🐎 جولات الخيول
        </button>
        <button
          onClick={() => setSelectedFilter('safari')}
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            selectedFilter === 'safari'
              ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30 font-bold'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          🏜️ قوافل السفاري
        </button>
        <button
          onClick={() => setSelectedFilter('diving')}
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            selectedFilter === 'diving'
              ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30 font-bold'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          🤿 لانشات الغوص
        </button>
      </div>

      {/* Slots Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSlots.map((slot) => {
          const isFull = slot.availableCount === 0;
          const occupancyPct = Math.round((slot.bookedCount / (slot.maxCapacity || 1)) * 100);

          return (
            <div
              key={`${slot.activityId}-${slot.slotId}`}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/50">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{slot.timeLabel}</span>
                  </div>

                  {isFull ? (
                    <span className="text-[11px] font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/50">
                      مكتمل العدد (مغلق)
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> متاح لاستقبال الحجز
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{slot.activityName}</h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-tajawal">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>{slot.city} · {slot.primarySite}</span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-mono text-slate-300">
                    <span>نسبة الإشغال: {occupancyPct}%</span>
                    <span className="text-cyan-300 font-bold">شاغر: {slot.availableCount} فرد</span>
                  </div>

                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? 'bg-red-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                    <span>محجوز: {slot.bookedCount} فرد</span>
                    <span>السعة الإجمالية: {slot.maxCapacity} فرد</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>المالك: <span className="text-slate-200">{slot.ownerCompany}</span></div>
                  <div>وسيلة النقل: <span className="text-slate-300 font-mono">{slot.driverVehicle}</span></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
