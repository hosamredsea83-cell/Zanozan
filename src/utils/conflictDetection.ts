import type { Activity } from '../types/activity';
import type { EquipmentItem } from '../types/equipment';
import type { LogisticsVehicle } from '../types/logistics';
import type { ResourceMaintenanceBlock } from '../types/finance';
import type { BookingRequest } from '../components/trips/BookingQueueModal';
import type { TripBooking } from '../components/bookings/BookingsManagerView';

export type ConflictType =
  | 'equipment_overlap'
  | 'vehicle_overlap'
  | 'maintenance_block'
  | 'capacity_exceeded';

export interface ScheduleConflict {
  id: string;
  severity: 'critical' | 'warning';
  type: ConflictType;
  date: string;
  slotLabel: string;
  resourceKind: 'equipment' | 'vehicle';
  resourceId: string;
  resourceName: string;
  bookingCodes: string[];
  bookingIds: string[];
  message: string;
}

interface NormalizedBookingSlot {
  bookingId: string;
  bookingCode: string;
  title: string;
  date: string;
  slotBucket: string;
  slotLabel: string;
  totalPax: number;
  equipmentIds: string[];
  vehicleIds: string[];
}

function normalizeSlotBucket(rawSlot: string): string {
  const clean = (rawSlot || '').trim().toLowerCase();
  if (!clean) return 'all_day';
  // Extract time token e.g. 09:00 / 14:30 / صباح / مساء
  const timeMatch = clean.match(/\d{1,2}:\d{2}/);
  if (timeMatch) {
    const isPm = clean.includes('م') || clean.includes('pm');
    const isAm = clean.includes('ص') || clean.includes('am');
    return `${timeMatch[0]}${isPm ? 'pm' : isAm ? 'am' : ''}`;
  }
  return clean.slice(0, 18);
}

function isDateWithinRange(date: string, start: string, end: string): boolean {
  if (!date || !start) return false;
  const effectiveEnd = end || start;
  return date >= start && date <= effectiveEnd;
}

export function buildNormalizedBookingSlots(params: {
  activities: Activity[];
  activityBookings: BookingRequest[];
  tripBookings: TripBooking[];
  equipments: EquipmentItem[];
  logisticsVehicles: LogisticsVehicle[];
}): NormalizedBookingSlot[] {
  const { activities, activityBookings, tripBookings, equipments, logisticsVehicles } = params;
  const results: NormalizedBookingSlot[] = [];

  for (const bk of activityBookings) {
    if (bk.status === 'rejected' || bk.status === 'auto_cancelled') continue;
    const act = activities.find((a) => a.id === bk.activityId || a.name === bk.activityName);
    const linkedEqIds = new Set<string>(act?.equipmentIds || []);
    equipments.forEach((eq) => {
      if (eq.linkedActivityIds?.includes(bk.activityId)) linkedEqIds.add(eq.id);
    });
    const linkedVehIds = new Set<string>();
    logisticsVehicles.forEach((v) => {
      if (
        act?.logistics?.assignedDriverOrVehicle &&
        (v.name === act.logistics.assignedDriverOrVehicle ||
          v.id === act.logistics.assignedDriverOrVehicle ||
          v.driverName === act.logistics.assignedDriverOrVehicle ||
          v.plateOrCode === act.logistics.assignedDriverOrVehicle)
      ) {
        linkedVehIds.add(v.id);
      }
    });

    results.push({
      bookingId: bk.id,
      bookingCode: bk.bookingCode,
      title: bk.activityName,
      date: bk.tripDate,
      slotBucket: normalizeSlotBucket(bk.slotLabel),
      slotLabel: bk.slotLabel,
      totalPax: bk.adultsCount + bk.childrenCount + bk.infantsCount,
      equipmentIds: Array.from(linkedEqIds),
      vehicleIds: Array.from(linkedVehIds)
    });
  }

  for (const tb of tripBookings) {
    if (tb.status === 'cancelled') continue;
    const matchedActs = activities.filter((a) => tb.linkedActivities.includes(a.name));
    const linkedEqIds = new Set<string>();
    const linkedVehIds = new Set<string>();
    matchedActs.forEach((act) => {
      (act.equipmentIds || []).forEach((id) => linkedEqIds.add(id));
      logisticsVehicles.forEach((v) => {
        if (
          act.logistics?.assignedDriverOrVehicle &&
          (v.name === act.logistics.assignedDriverOrVehicle ||
            v.id === act.logistics.assignedDriverOrVehicle ||
            v.driverName === act.logistics.assignedDriverOrVehicle ||
            v.plateOrCode === act.logistics.assignedDriverOrVehicle)
        ) {
          linkedVehIds.add(v.id);
        }
      });
    });

    results.push({
      bookingId: tb.id,
      bookingCode: tb.bookingCode,
      title: tb.tripTitle,
      date: tb.departureDate,
      slotBucket: normalizeSlotBucket(tb.departureTime),
      slotLabel: tb.departureTime,
      totalPax: tb.adultsCount + tb.childrenCount + tb.infantsCount,
      equipmentIds: Array.from(linkedEqIds),
      vehicleIds: Array.from(linkedVehIds)
    });
  }

  return results;
}

export function detectAllScheduleConflicts(params: {
  activities: Activity[];
  activityBookings: BookingRequest[];
  tripBookings: TripBooking[];
  equipments: EquipmentItem[];
  logisticsVehicles: LogisticsVehicle[];
  maintenanceBlocks: ResourceMaintenanceBlock[];
}): ScheduleConflict[] {
  const {
    activities,
    activityBookings,
    tripBookings,
    equipments,
    logisticsVehicles,
    maintenanceBlocks
  } = params;

  const slots = buildNormalizedBookingSlots({
    activities,
    activityBookings,
    tripBookings,
    equipments,
    logisticsVehicles
  });

  const conflicts: ScheduleConflict[] = [];
  const eqById = new Map(equipments.map((e) => [e.id, e]));
  const vehById = new Map(logisticsVehicles.map((v) => [v.id, v]));

  // 1. Check Maintenance Status & Scheduled Maintenance Blocks & Capacity
  for (const s of slots) {
    for (const eqId of s.equipmentIds) {
      const eq = eqById.get(eqId);
      if (!eq) continue;
      if (eq.status === 'maintenance' || eq.status === 'inactive') {
        conflicts.push({
          id: `conf-maint-eq-${eqId}-${s.bookingId}`,
          severity: 'critical',
          type: 'maintenance_block',
          date: s.date,
          slotLabel: s.slotLabel,
          resourceKind: 'equipment',
          resourceId: eq.id,
          resourceName: eq.name,
          bookingCodes: [s.bookingCode],
          bookingIds: [s.bookingId],
          message: `المعدة «${eq.name}» في حالة ${eq.status === 'maintenance' ? 'صيانة' : 'توقف'} ومرتبطة بالحجز #${s.bookingCode}.`
        });
      }
      for (const blk of maintenanceBlocks) {
        if (
          blk.resourceKind === 'equipment' &&
          blk.resourceId === eqId &&
          isDateWithinRange(s.date, blk.startDate, blk.endDate)
        ) {
          conflicts.push({
            id: `conf-blk-eq-${blk.id}-${s.bookingId}`,
            severity: 'critical',
            type: 'maintenance_block',
            date: s.date,
            slotLabel: s.slotLabel,
            resourceKind: 'equipment',
            resourceId: eq.id,
            resourceName: eq.name,
            bookingCodes: [s.bookingCode],
            bookingIds: [s.bookingId],
            message: `تعارض صيانة مجدولة للمعدة «${eq.name}» (${blk.reason}) مع الحجز #${s.bookingCode} يوم ${s.date}.`
          });
        }
      }
    }

    for (const vId of s.vehicleIds) {
      const veh = vehById.get(vId);
      if (!veh) continue;
      if (veh.status === 'maintenance' || veh.status === 'inactive') {
        conflicts.push({
          id: `conf-maint-veh-${vId}-${s.bookingId}`,
          severity: 'critical',
          type: 'maintenance_block',
          date: s.date,
          slotLabel: s.slotLabel,
          resourceKind: 'vehicle',
          resourceId: veh.id,
          resourceName: veh.name,
          bookingCodes: [s.bookingCode],
          bookingIds: [s.bookingId],
          message: `المركبة «${veh.name}» في حالة ${veh.status === 'maintenance' ? 'صيانة' : 'توقف'} ومرتبطة بالحجز #${s.bookingCode}.`
        });
      }
      if (veh.passengerCapacity > 0 && s.totalPax > veh.passengerCapacity) {
        conflicts.push({
          id: `conf-cap-veh-${vId}-${s.bookingId}`,
          severity: 'warning',
          type: 'capacity_exceeded',
          date: s.date,
          slotLabel: s.slotLabel,
          resourceKind: 'vehicle',
          resourceId: veh.id,
          resourceName: veh.name,
          bookingCodes: [s.bookingCode],
          bookingIds: [s.bookingId],
          message: `عدد ركاب الحجز #${s.bookingCode} (${s.totalPax}) يتجاوز سعة المركبة «${veh.name}» (${veh.passengerCapacity} راكب).`
        });
      }
      for (const blk of maintenanceBlocks) {
        if (
          blk.resourceKind === 'vehicle' &&
          blk.resourceId === vId &&
          isDateWithinRange(s.date, blk.startDate, blk.endDate)
        ) {
          conflicts.push({
            id: `conf-blk-veh-${blk.id}-${s.bookingId}`,
            severity: 'critical',
            type: 'maintenance_block',
            date: s.date,
            slotLabel: s.slotLabel,
            resourceKind: 'vehicle',
            resourceId: veh.id,
            resourceName: veh.name,
            bookingCodes: [s.bookingCode],
            bookingIds: [s.bookingId],
            message: `تعارض صيانة للمركبة «${veh.name}» (${blk.reason}) مع الحجز #${s.bookingCode} يوم ${s.date}.`
          });
        }
      }
    }
  }

  // 2. Overlap across different bookings on same date + slotBucket
  const eqUsageMap = new Map<string, NormalizedBookingSlot[]>();
  const vehUsageMap = new Map<string, NormalizedBookingSlot[]>();

  for (const s of slots) {
    for (const eqId of s.equipmentIds) {
      const k = `${eqId}::${s.date}::${s.slotBucket}`;
      const list = eqUsageMap.get(k) || [];
      list.push(s);
      eqUsageMap.set(k, list);
    }
    for (const vId of s.vehicleIds) {
      const k = `${vId}::${s.date}::${s.slotBucket}`;
      const list = vehUsageMap.get(k) || [];
      list.push(s);
      vehUsageMap.set(k, list);
    }
  }

  for (const [key, list] of eqUsageMap.entries()) {
    if (list.length < 2) continue;
    const eqId = key.split('::')[0];
    const eq = eqById.get(eqId);
    const unitLimit = 1;
    if (list.length > unitLimit) {
      conflicts.push({
        id: `conf-overlap-eq-${key}`,
        severity: 'critical',
        type: 'equipment_overlap',
        date: list[0].date,
        slotLabel: list[0].slotLabel,
        resourceKind: 'equipment',
        resourceId: eqId,
        resourceName: eq?.name || eqId,
        bookingCodes: list.map((b) => b.bookingCode),
        bookingIds: list.map((b) => b.bookingId),
        message: `تداخل تشغيل للمعدة «${eq?.name || eqId}» (${list.length} حجوزات في نفس الموعد ${list[0].date} · ${list[0].slotLabel} مقابل ${unitLimit} وحدة متاحة): ${list.map((b) => `#${b.bookingCode}`).join('، ')}.`
      });
    }
  }

  for (const [key, list] of vehUsageMap.entries()) {
    if (list.length < 2) continue;
    const vId = key.split('::')[0];
    const veh = vehById.get(vId);
    conflicts.push({
      id: `conf-overlap-veh-${key}`,
      severity: 'critical',
      type: 'vehicle_overlap',
      date: list[0].date,
      slotLabel: list[0].slotLabel,
      resourceKind: 'vehicle',
      resourceId: vId,
      resourceName: veh?.name || vId,
      bookingCodes: list.map((b) => b.bookingCode),
      bookingIds: list.map((b) => b.bookingId),
      message: `تداخل سائق/مركبة «${veh?.name || vId}» (${veh?.driverName || 'سائق'}) بين ${list.length} حجوزات في نفس الموعد (${list[0].date} · ${list[0].slotLabel}): ${list.map((b) => `#${b.bookingCode}`).join('، ')}.`
    });
  }

  return conflicts;
}

export function getConflictsForBooking(
  bookingId: string,
  allConflicts: ScheduleConflict[]
): ScheduleConflict[] {
  return allConflicts.filter((c) => c.bookingIds.includes(bookingId));
}
