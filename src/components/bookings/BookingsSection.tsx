import React from 'react';
import type { Activity } from '../../types/activity';
import type { AppUser } from '../../types/auth';
import type { LogAuditEventInput } from '../../hooks/useAuditLogStore';
import type { NavigationItemKey } from '../layout/Sidebar';
import type { BookingRequest } from '../trips/BookingQueueModal';
import { BookingsManagerView, TripBooking } from './BookingsManagerView';

interface BookingsSectionProps {
  currentNavKey: NavigationItemKey;
  activities: Activity[];
  activityBookings: BookingRequest[];
  setActivityBookings: React.Dispatch<React.SetStateAction<BookingRequest[]>>;
  tripBookings: TripBooking[];
  setTripBookings: React.Dispatch<React.SetStateAction<TripBooking[]>>;
  onApproveBooking: (req: BookingRequest) => void;
  onRejectBooking: (bookingId: string, reason: string) => void;
  currentUser?: AppUser;
  onAuditLog?: (input: LogAuditEventInput) => void;
}

export const BookingsSection: React.FC<BookingsSectionProps> = ({
  currentNavKey,
  activities,
  activityBookings,
  setActivityBookings,
  tripBookings,
  setTripBookings,
  onApproveBooking,
  onRejectBooking,
  currentUser,
  onAuditLog
}) => {
  if (currentNavKey !== 'bookings_activities' && currentNavKey !== 'bookings_trips') {
    return null;
  }

  return (
    <BookingsManagerView
      mode={currentNavKey === 'bookings_activities' ? 'activities' : 'trips'}
      activities={activities}
      activityBookings={activityBookings}
      onApproveActivityBooking={onApproveBooking}
      onRejectActivityBooking={onRejectBooking}
      onAddActivityBooking={(b) => {
        setActivityBookings((prev) => [b, ...prev]);
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
      tripBookings={tripBookings}
      onUpdateTripBookingStatus={(id, status) => {
        const target = tripBookings.find((tb) => tb.id === id);
        setTripBookings((prev) => prev.map((tb) => (tb.id === id ? { ...tb, status } : tb)));
        if (currentUser) {
          onAuditLog?.({
            actor: currentUser,
            action: 'status_change',
            domain: 'booking',
            entityId: id,
            entityName: target?.tripTitle || id,
            summary: `غيّر ${currentUser.name} حالة حجز الرحلة «${target?.tripTitle || id}» إلى «${status}»`
          });
        }
      }}
      onAddTripBooking={(tb) => {
        setTripBookings((prev) => [tb, ...prev]);
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
