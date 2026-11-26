import React from 'react';
import type { TripRecord, TripStatus } from '../../types/trip';
import type { AppUser } from '../../types/auth';
import type { EquipmentItem, EquipmentTypeDefinition } from '../../types/equipment';
import { CreationReferenceHub } from '../reference/creation/CreationReferenceHub';
import {
  TRIP_TERMINOLOGY,
  type EntityCreationOverrides
} from '../reference/creation/entityCreationTerminology';

interface TripCreationHubProps {
  trips: TripRecord[];
  currentUser: AppUser;
  onAddNewTrip: (presetCategory?: string) => void;
  onEditTrip: (trip: TripRecord) => void;
  onDeleteTrip: (tripId: string) => void;
  onToggleStatus: (tripId: string, newStatus: TripStatus) => void;
  onViewTrip?: (trip: TripRecord) => void;
  onNavigateToCollections?: () => void;
  equipments?: EquipmentItem[];
  equipmentTypes?: EquipmentTypeDefinition[];
}

// Extension point for future Trip-only Hub customizations without affecting Activities
const tripHubOverrides: EntityCreationOverrides = {};

export const TripCreationHub: React.FC<TripCreationHubProps> = ({
  trips,
  currentUser,
  onAddNewTrip,
  onEditTrip,
  onDeleteTrip,
  onToggleStatus,
  onViewTrip,
  onNavigateToCollections,
  equipments = [],
  equipmentTypes = []
}) => {
  return (
    <CreationReferenceHub
      terms={TRIP_TERMINOLOGY}
      overrides={tripHubOverrides}
      activities={trips}
      currentUser={currentUser}
      onAddNewActivity={onAddNewTrip}
      onEditActivity={(act) => onEditTrip(act as TripRecord)}
      onDeleteActivity={onDeleteTrip}
      onToggleStatus={onToggleStatus}
      onViewActivity={onViewTrip ? (act) => onViewTrip(act as TripRecord) : undefined}
      onNavigateToCollections={onNavigateToCollections}
      equipments={equipments}
      equipmentTypes={equipmentTypes}
    />
  );
};
