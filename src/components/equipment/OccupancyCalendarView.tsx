import React, { useMemo, useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  Wrench,
  Truck,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2
} from 'lucide-react';
import type { Activity } from '../../types/activity';
import type { EquipmentItem } from '../../types/equipment';
import type { LogisticsVehicle } from '../../types/logistics';
import type { ResourceMaintenanceBlock } from '../../types/finance';
import type { BookingRequest } from '../trips/BookingQueueModal';
import type { TripBooking } from '../bookings/BookingsManagerView';
import {
  buildNormalizedBookingSlots,
  detectAllScheduleConflicts
} from '../../utils/conflictDetection';

interface OccupancyCalendarViewProps {
  activities: Activity[];
  equipments: EquipmentItem[];
  logisticsVehicles: LogisticsVehicle[];
  activityBookings: BookingRequest[];
  tripBookings: TripBooking[];
  maintenanceBlocks: ResourceMaintenanceBlock[];
  onAddMaintenanceBlock: (block: ResourceMaintenanceBlock) => void;
  onDeleteMaintenanceBlock: (blockId: string) => void;
}

function addDaysIso(baseIso: string, delta: number): string {
  const dt = new Date(`${baseIso}T12:00:00`);
  dt.setDate(dt.getDate() + delta);
  return dt.toISOString().split('T')[0];
}

export const OccupancyCalendarView: React.FC<OccupancyCalendarViewProps> = ({
  activities,
  equipments,
  logisticsVehicles,
  activityBookings,
  tripBookings,
  maintenanceBlocks,
  onAddMaintenanceBlock,
  onDeleteMaintenanceBlock
}) => {
  const [startDate, setStartDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [resourceKind, setResourceKind] = useState<'equipment' | 'vehicle'>('equipment');
  const [resourceId, setResourceId] = useState<string>(() => equipments[0]?.id || '');
  const [blockStart, setBlockStart] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [blockEnd, setBlockEnd] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [blockReason, setBlockReason] = useState<string>('صيانة دورية وفحص سلامة');
  const [licenseExpiry, setLicenseExpiry] = useState<string>('');

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDaysIso(startDate, i));
  }, [startDate]);

  const conflicts = useMemo(
    () =>
      detectAllScheduleConflicts({
        activities,
        activityBookings,
        tripBookings,
        equipments,
        logisticsVehicles,
        maintenanceBlocks
      }),
    [activities, activityBookings, tripBookings, equipments, logisticsVehicles, maintenanceBlocks]
  );

  const normalizedSlots = useMemo(
    () =>
      buildNormalizedBookingSlots({
        activities,
        activityBookings,
        tripBookings,
        equipments,
        logisticsVehicles
      }),
    [activities, activityBookings, tripBookings, equipments, logisticsVehicles]
  );

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const targetList = resourceKind === 'equipment' ? equipments : logisticsVehicles;
    const chosen = targetList.find((r) => r.id === resourceId) || targetList[0];
    if (!chosen || !blockReason.trim()) return;

    onAddMaintenanceBlock({
      id: `maint-${Date.now()}`,
      resourceKind,
      resourceId: chosen.id,
      resourceName: chosen.name,
      startDate: blockStart,
      endDate: blockEnd >= blockStart ? blockEnd : blockStart,
      reason: blockReason.trim(),
      licenseExpiryDate: licenseExpiry || undefined,
      createdAt: new Date().toISOString().split('T')[0]
    });
    setLicenseExpiry('');
  };

  const rows = useMemo(() => {
    const eqRows = equipments.map((eq) => ({
      kind: 'equipment' as const,
      id: eq.id,
      name: eq.name,
      subtitle: `${eq.operationalData?.capacityOrUnitLabel || '1 وحدة'} · ${eq.status === 'maintenance' ? 'تحت الصيانة' : 'تشغيلي'}`,
      inMaintenance: eq.status === 'maintenance' || eq.status === 'inactive'
    }));
    const vehRows = logisticsVehicles.map((v) => ({
      kind: 'vehicle' as const,
      id: v.id,
      name: v.name,
      subtitle: `${v.driverName || 'بدون سائق'} · ${v.passengerCapacity} راكب`,
      inMaintenance: v.status === 'maintenance' || v.status === 'inactive'
    }));
    return [...eqRows, ...vehRows];
  }, [equipments, logisticsVehicles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              تقويم إشغال المعدات والمركبات ومنع التعارض
            </h1>
            <p className="text-xs text-slate-400">
              مراقبة التداخل في مواعيد التشغيل بين الحجوزات، وجدولة الصيانة والتراخيص للمعدات والمركبات.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setStartDate(addDaysIso(startDate, -7))}
            className="p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 hover:text-white"
            title="الأسبوع السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono tabular-nums"
          />
          <button
            type="button"
            onClick={() => setStartDate(addDaysIso(startDate, 7))}
            className="p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 hover:text-white"
            title="الأسبوع التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conflict Detection Alerts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            {conflicts.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>فحص التداخلات وتعارض السعة والصيانة ({conflicts.length})</span>
          </h2>
        </div>

        {conflicts.length === 0 ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-300">
            لا توجد تعارضات تشغيلية أو تداخل مواعيد للمعدات والمركبات في الحجوزات النشطة.
          </div>
        ) : (
          <div className="space-y-2">
            {conflicts.map((conf) => (
              <div
                key={conf.id}
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  conf.severity === 'critical'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{conf.resourceName}</div>
                  <div>{conf.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7-Day Occupancy Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">جدول الإشغال الأسبوعي للأصول والمركبات</h2>
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[11px]">
              <tr>
                <th className="py-2.5 px-3 font-medium min-w-[210px]">المعدة / المركبة</th>
                {weekDays.map((day) => (
                  <th
                    key={day}
                    className="py-2.5 px-2.5 font-mono tabular-nums font-medium min-w-[125px] text-center"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    لا توجد معدات أو مركبات مسجلة لعرض جدول الإشغال.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.kind}-${row.id}`} className="hover:bg-slate-950/50">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {row.kind === 'equipment' ? (
                          <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{row.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{row.subtitle}</div>
                        </div>
                      </div>
                    </td>

                    {weekDays.map((day) => {
                      const dayBookings = normalizedSlots.filter(
                        (s) =>
                          s.date === day &&
                          (row.kind === 'equipment'
                            ? s.equipmentIds.includes(row.id)
                            : s.vehicleIds.includes(row.id))
                      );
                      const dayMaint = maintenanceBlocks.filter(
                        (b) =>
                          b.resourceKind === row.kind &&
                          b.resourceId === row.id &&
                          day >= b.startDate &&
                          day <= (b.endDate || b.startDate)
                      );
                      const hasConflict = conflicts.some(
                        (c) => c.date === day && c.resourceId === row.id
                      );

                      return (
                        <td
                          key={day}
                          className={`py-2 px-2 align-top border-r border-slate-800/60 ${
                            hasConflict ? 'bg-rose-500/10' : ''
                          }`}
                        >
                          {dayMaint.map((m) => (
                            <div
                              key={m.id}
                              className="mb-1 px-1.5 py-1 rounded bg-rose-500/20 border border-rose-500/30 text-[10px] text-rose-200 truncate"
                              title={m.reason}
                            >
                              صيانة: {m.reason}
                            </div>
                          ))}
                          {dayBookings.map((b) => (
                            <div
                              key={b.bookingId}
                              className="mb-1 px-1.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/30 text-[10px] text-cyan-200 truncate"
                              title={`${b.title} (${b.slotLabel})`}
                            >
                              #{b.bookingCode} · {b.slotLabel.split('-')[0]}
                            </div>
                          ))}
                          {dayMaint.length === 0 && dayBookings.length === 0 && (
                            <span className="block text-center text-[10px] text-slate-600">
                              {row.inMaintenance ? 'صيانة' : 'متاح'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Maintenance & License Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleCreateBlock}
          className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5"
        >
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Plus className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">جدولة صيانة أو حظر تشغيل لمعدة / مركبة</h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">النوع</label>
              <select
                value={resourceKind}
                onChange={(e) => {
                  const nextKind = e.target.value as 'equipment' | 'vehicle';
                  setResourceKind(nextKind);
                  const list = nextKind === 'equipment' ? equipments : logisticsVehicles;
                  setResourceId(list[0]?.id || '');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="equipment">معدة</option>
                <option value="vehicle">مركبة / لوجستيات</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">اختر الأصل</label>
              <select
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                {(resourceKind === 'equipment' ? equipments : logisticsVehicles).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">من تاريخ</label>
              <input
                type="date"
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">سبب الصيانة / الحظر</label>
            <input
              type="text"
              required
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              تاريخ انتهاء الترخيص / التأمين (اختياري)
            </label>
            <input
              type="date"
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
          >
            إضافة قيد الصيانة إلى التقويم
          </button>
        </form>

        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">
            سجل فترات الصيانة والتراخيص ({maintenanceBlocks.length})
          </h3>
          {maintenanceBlocks.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
              لا توجد فترات صيانة مجدولة حالياً.
            </div>
          ) : (
            <div className="space-y-2.5">
              {maintenanceBlocks.map((blk) => (
                <div
                  key={blk.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{blk.resourceName}</div>
                    <div className="text-slate-400 mt-0.5">{blk.reason}</div>
                    <div className="text-[11px] font-mono text-amber-300 mt-1">
                      {blk.startDate} → {blk.endDate}
                      {blk.licenseExpiryDate && ` · انتهاء الترخيص: ${blk.licenseExpiryDate}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteMaintenanceBlock(blk.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                    title="إلغاء الحظر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
