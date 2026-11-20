import React from 'react';
import type { Activity } from '../../types/activity';
import type { AppUser } from '../../types/auth';
import type { LogAuditEventInput } from '../../hooks/useAuditLogStore';
import type { NavigationItemKey } from '../layout/Sidebar';
import { ComparisonMatrix } from '../comparison/ComparisonMatrix';
import { ComboTripsManager } from './ComboTripsManager';
import { DailyScheduleView } from './DailyScheduleView';

interface TripsSectionProps {
  currentNavKey: NavigationItemKey;
  activities: Activity[];
  selectedCompareIds: string[];
  onToggleCompare: (activity: Activity) => void;
  onClearCompare: () => void;
  currentUser?: AppUser;
  onAuditLog?: (input: LogAuditEventInput) => void;
}

export const TripsSection: React.FC<TripsSectionProps> = ({
  currentNavKey,
  activities,
  selectedCompareIds,
  onToggleCompare,
  onClearCompare,
  currentUser,
  onAuditLog
}) => {
  return (
    <>
      {currentNavKey === 'compare_activities' && (
        <ComparisonMatrix
          activities={activities}
          selectedCompareIds={selectedCompareIds}
          onToggleCompare={onToggleCompare}
          onClearCompare={onClearCompare}
        />
      )}

      {currentNavKey === 'trips_combo' && (
        <ComboTripsManager
          activities={activities}
          currentUser={currentUser}
          onAuditLog={onAuditLog}
        />
      )}

      {currentNavKey === 'trips_schedule' && <DailyScheduleView activities={activities} />}
    </>
  );
};
