import React from 'react';
import type { Activity } from '../../types/activity';
import type { EquipmentItem } from '../../types/equipment';
import type { LogisticsVehicle } from '../../types/logistics';
import type { TripRecord } from '../../types/trip';
import type { MasterAddonItem } from '../../types/addon';
import type { PersonProfile } from '../../types/personProfile';
import type {
  InTripAddonRequestRecord,
  ResourceMaintenanceBlock,
  SelectedPaidAddonItem
} from '../../types/finance';
import type { AppUser } from '../../types/auth';
import type { LogAuditEventInput } from '../../hooks/useAuditLogStore';
import type { NavigationItemKey } from '../layout/Sidebar';
import type { BookingRequest } from '../trips/BookingQueueModal';
import { BookingsManagerView, TripBooking } from './BookingsManagerView';
import { InTripRequestsView } from './InTripRequestsView';

interface BookingsSectionProps {
  currentNavKey: NavigationItemKey;
  activities: Activity[];
  trips: TripRecord[];
  masterAddons: MasterAddonItem[];
  personProfiles?: PersonProfile[];
  equipments?: EquipmentItem[];
  logisticsVehicles?: LogisticsVehicle[];
  maintenanceBlocks?: ResourceMaintenanceBlock[];
  activityBookings: BookingRequest[];
  setActivityBookings: React.Dispatch<React.SetStateAction<BookingRequest[]>>;
  tripBookings: TripBooking[];
  setTripBookings: React.Dispatch<React.SetStateAction<TripBooking[]>>;
  inTripRequests: InTripAddonRequestRecord[];
  setInTripRequests: React.Dispatch<React.SetStateAction<InTripAddonRequestRecord[]>>;
  onApproveBooking: (req: BookingRequest) => void;
  onCompleteActivityBooking?: (req: BookingRequest) => void;
  onRejectBooking: (bookingId: string, reason: string) => void;
  onOwnerCancelActivityBooking?: (booking: BookingRequest, reason: string) => void;
  onOwnerCancelTripBooking?: (booking: TripBooking, reason: string) => void;
  onSettleBookingRefund?: (bookingId: string, kind: 'activity_booking' | 'trip_booking') => void;
  onBookingMutated?: (
    booking: BookingRequest | TripBooking,
    kind: 'activity_booking' | 'trip_booking'
  ) => void;
  onTripBookingStatusUpdated?: (
    updatedTripBooking: TripBooking,
    previousStatus: TripBooking['status']
  ) => void;
  partnerOptions?: Array<{ id: string; name: string; role: string }>;
  currentUser?: AppUser;
  onAuditLog?: (input: LogAuditEventInput) => void;
  onRegisterCompanyCustomer?: (input: {
    name: string;
    phone: string;
    nationality: string;
  }) => void;
}

export const BookingsSection: React.FC<BookingsSectionProps> = ({
  currentNavKey,
  activities,
  trips,
  masterAddons,
  personProfiles = [],
  equipments = [],
  logisticsVehicles = [],
  maintenanceBlocks = [],
  activityBookings,
  setActivityBookings,
  tripBookings,
  setTripBookings,
  inTripRequests,
  setInTripRequests,
  onApproveBooking,
  onCompleteActivityBooking,
  onRejectBooking,
  onOwnerCancelActivityBooking,
  onOwnerCancelTripBooking,
  onSettleBookingRefund,
  onBookingMutated,
  onTripBookingStatusUpdated,
  partnerOptions = [],
  currentUser,
  onAuditLog,
  onRegisterCompanyCustomer
}) => {
  if (
    currentNavKey !== 'bookings_activities' &&
    currentNavKey !== 'bookings_trips' &&
    currentNavKey !== 'bookings_in_trip_requests'
  ) {
    return null;
  }

  const syncLinkedBookingWithRequests = (
    nextRequests: InTripAddonRequestRecord[],
    bookingId?: string,
    bookingKind?: 'activity_booking' | 'trip_booking'
  ) => {
    if (!bookingId || !bookingKind) return;

    const matchingDuringTripItems: SelectedPaidAddonItem[] = nextRequests
      .filter((r) => r.linkedBookingId === bookingId && r.linkedBookingKind === bookingKind)
      .flatMap((r) =>
        r.items.map((it) => ({
          ...it,
          stage: 'during_trip' as const
        }))
      );

    if (bookingKind === 'activity_booking') {
      let mutated: BookingRequest | null = null;
      setActivityBookings((prev) =>
        prev.map((bk) => {
          if (bk.id !== bookingId) return bk;
          const prevAddons = bk.selectedPaidAddons || [];
          const prevEGP = prevAddons.reduce((s, a) => s + a.unitPriceEGP * a.quantity, 0);
          const prevEUR = prevAddons.reduce((s, a) => s + a.unitPriceEUR * a.quantity, 0);
          const baseEGP = Math.max(0, bk.totalPriceEGP - prevEGP);
          const baseEUR = Math.max(0, bk.totalPriceEUR - prevEUR);

          const nonDuringTrip = prevAddons.filter((a) => a.stage !== 'during_trip');
          const nextAddons = [...nonDuringTrip, ...matchingDuringTripItems];
          const nextAddonsEGP = nextAddons.reduce(
            (s, a) => s + a.unitPriceEGP * a.quantity,
            0
          );
          const nextAddonsEUR = Number(
            nextAddons.reduce((s, a) => s + a.unitPriceEUR * a.quantity, 0).toFixed(2)
          );

          mutated = {
            ...bk,
            selectedPaidAddons: nextAddons.length > 0 ? nextAddons : undefined,
            totalPriceEGP:
              bk.customerType === 'egyptian' ? baseEGP + nextAddonsEGP : bk.totalPriceEGP,
            totalPriceEUR:
              bk.customerType === 'foreigner' ? baseEUR + nextAddonsEUR : bk.totalPriceEUR
          };
          return mutated;
        })
      );
      if (mutated) onBookingMutated?.(mutated, 'activity_booking');
    } else {
      let mutated: TripBooking | null = null;
      setTripBookings((prev) =>
        prev.map((tb) => {
          if (tb.id !== bookingId) return tb;
          const prevAddons = tb.selectedPaidAddons || [];
          const prevEGP = prevAddons.reduce((s, a) => s + a.unitPriceEGP * a.quantity, 0);
          const prevEUR = prevAddons.reduce((s, a) => s + a.unitPriceEUR * a.quantity, 0);
          const baseEGP = Math.max(0, tb.totalPriceEGP - prevEGP);
          const baseEUR = Math.max(0, tb.totalPriceEUR - prevEUR);

          const nonDuringTrip = prevAddons.filter((a) => a.stage !== 'during_trip');
          const nextAddons = [...nonDuringTrip, ...matchingDuringTripItems];
          const nextAddonsEGP = nextAddons.reduce(
            (s, a) => s + a.unitPriceEGP * a.quantity,
            0
          );
          const nextAddonsEUR = Number(
            nextAddons.reduce((s, a) => s + a.unitPriceEUR * a.quantity, 0).toFixed(2)
          );

          mutated = {
            ...tb,
            selectedPaidAddons: nextAddons.length > 0 ? nextAddons : undefined,
            totalPriceEGP:
              tb.customerType === 'egyptian' ? baseEGP + nextAddonsEGP : tb.totalPriceEGP,
            totalPriceEUR:
              tb.customerType === 'foreigner' ? baseEUR + nextAddonsEUR : tb.totalPriceEUR
          };
          return mutated;
        })
      );
      if (mutated) onBookingMutated?.(mutated, 'trip_booking');
    }
  };

  if (currentNavKey === 'bookings_in_trip_requests') {
    return (
      <InTripRequestsView
        activities={activities}
        trips={trips}
        masterAddons={masterAddons}
        activityBookings={activityBookings}
        tripBookings={tripBookings}
        personProfiles={personProfiles}
        inTripRequests={inTripRequests}
        onAddRequest={(record) => {
          const next = [record, ...inTripRequests];
          setInTripRequests(next);
          syncLinkedBookingWithRequests(
            next,
            record.linkedBookingId,
            record.linkedBookingKind
          );
          if (currentUser) {
            onAuditLog?.({
              actor: currentUser,
              action: 'create',
              domain: 'booking',
              entityId: record.id,
              entityName: record.targetTitle,
              summary: `سجّل ${currentUser.name} طلبات إضافية (${record.requestCode}) للعميل «${record.customerName}» أثناء «${record.targetTitle}»`
            });
          }
        }}
        onUpdateRequest={(updated) => {
          const next = inTripRequests.map((r) => (r.id === updated.id ? updated : r));
          setInTripRequests(next);
          syncLinkedBookingWithRequests(
            next,
            updated.linkedBookingId,
            updated.linkedBookingKind
          );
          if (currentUser) {
            onAuditLog?.({
              actor: currentUser,
              action: 'update',
              domain: 'booking',
              entityId: updated.id,
              entityName: updated.targetTitle,
              summary: `عدّل ${currentUser.name} كميات طلب أثناء الرحلة (${updated.requestCode}) للعميل «${updated.customerName}»`
            });
          }
        }}
        onDeleteRequest={(requestId) => {
          const target = inTripRequests.find((r) => r.id === requestId);
          const next = inTripRequests.filter((r) => r.id !== requestId);
          setInTripRequests(next);
          if (target) {
            syncLinkedBookingWithRequests(
              next,
              target.linkedBookingId,
              target.linkedBookingKind
            );
            if (currentUser) {
              onAuditLog?.({
                actor: currentUser,
                action: 'delete',
                domain: 'booking',
                entityId: requestId,
                entityName: target.targetTitle,
                summary: `حذف ${currentUser.name} طلب أثناء الرحلة (${target.requestCode}) للعميل «${target.customerName}»`
              });
            }
          }
        }}
      />
    );
  }

  return (
    <BookingsManagerView
      mode={currentNavKey === 'bookings_activities' ? 'activities' : 'trips'}
      activities={activities}
      equipments={equipments}
      logisticsVehicles={logisticsVehicles}
      maintenanceBlocks={maintenanceBlocks}
      activityBookings={activityBookings}
      onRegisterCompanyCustomer={onRegisterCompanyCustomer}
      onApproveActivityBooking={onApproveBooking}
      onCompleteActivityBooking={onCompleteActivityBooking}
      onRejectActivityBooking={onRejectBooking}
      onOwnerCancelActivityBooking={onOwnerCancelActivityBooking}
      onAddActivityBooking={(b) => {
        setActivityBookings((prev) => [b, ...prev]);
        onBookingMutated?.(b, 'activity_booking');
        if (currentUser) {
          onAuditLog?.({
            actor: currentUser,
            action: 'create',
            domain: 'booking',
            entityId: b.id,
            entityName: b.activityName,
            summary: `أضاف ${currentUser.name} حجز نشاط للعميل «${b.customerName}»`
          });
        }
      }}
      onUpdateActivityBooking={(updated) => {
        setActivityBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        onBookingMutated?.(updated, 'activity_booking');
        if (currentUser) {
          onAuditLog?.({
            actor: currentUser,
            action: 'update',
            domain: 'booking',
            entityId: updated.id,
            entityName: updated.activityName,
            summary: `حدّث ${currentUser.name} طلبات الإضافات المدفوعة للحجز #${updated.bookingCode}`
          });
        }
      }}
      tripBookings={tripBookings}
      onOwnerCancelTripBooking={onOwnerCancelTripBooking}
      onSettleBookingRefund={onSettleBookingRefund}
      partnerOptions={partnerOptions}
      onUpdateTripBooking={(updated) => {
        setTripBookings((prev) => prev.map((tb) => (tb.id === updated.id ? updated : tb)));
        onBookingMutated?.(updated, 'trip_booking');
        if (currentUser) {
          onAuditLog?.({
            actor: currentUser,
            action: 'update',
            domain: 'booking',
            entityId: updated.id,
            entityName: updated.tripTitle,
            summary: `حدّث ${currentUser.name} طلبات الإضافات المدفوعة لحجز الرحلة #${updated.bookingCode}`
          });
        }
      }}
      onUpdateTripBookingStatus={(id, status) => {
        const target = tripBookings.find((tb) => tb.id === id);
        if (!target) return;
        const nextPaymentStatus = status === 'completed' ? 'paid' : target.paymentStatus;
        const updatedTripBooking: TripBooking = {
          ...target,
          status,
          paymentStatus: nextPaymentStatus
        };
        setTripBookings((prev) =>
          prev.map((tb) => (tb.id === id ? updatedTripBooking : tb))
        );
        onTripBookingStatusUpdated?.(updatedTripBooking, target.status);
        if (currentUser) {
          onAuditLog?.({
            actor: currentUser,
            action: 'status_change',
            domain: 'booking',
            entityId: id,
            entityName: target.tripTitle || id,
            summary: `غيّر ${currentUser.name} حالة حجز الرحلة «${target.tripTitle || id}» إلى «${status}»`
          });
        }
      }}
      onAddTripBooking={(tb) => {
        setTripBookings((prev) => [tb, ...prev]);
        onBookingMutated?.(tb, 'trip_booking');
        if (currentUser) {
          onAuditLog?.({
            actor: currentUser,
            action: 'create',
            domain: 'booking',
            entityId: tb.id,
            entityName: tb.tripTitle,
            summary: `أضاف ${currentUser.name} حجز رحلة للعميل «${tb.customerName}»`
          });
        }
      }}
      onDeleteTripBooking={(id) => {
        const target = tripBookings.find((tb) => tb.id === id);
        setTripBookings((prev) => prev.filter((tb) => tb.id !== id));
        if (currentUser) {
          onAuditLog?.({
            actor: currentUser,
            action: 'delete',
            domain: 'booking',
            entityId: id,
            entityName: target?.tripTitle || id,
            summary: `حذف ${currentUser.name} حجز الرحلة «${target?.tripTitle || id}»`
          });
        }
      }}
    />
  );
};

