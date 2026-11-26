import React from 'react';
import type {
  Activity,
  CategoryRecord,
  CustomTechnicalSpecItem,
  PricingPropertyItem
} from '../../types/activity';
import type { TripRecord, TripStatus } from '../../types/trip';
import type { AppUser } from '../../types/auth';
import type {
  EquipmentItem,
  EquipmentPropertyItem,
  EquipmentTypeDefinition
} from '../../types/equipment';
import type { MasterAddonItem } from '../../types/addon';
import type {
  CityRecord,
  CountryRecord,
  EquipmentUnitKindItem,
  InclusionCatalogItem,
  InclusionKind,
  MeetingPointRecord,
  SpecGroupRecord
} from '../../types/masterReference';
import type { LogisticsVehicle } from '../../types/logistics';
import type { LogAuditEventInput } from '../../hooks/useAuditLogStore';
import type { NavigationItemKey } from '../layout/Sidebar';
import type { ActivityCollection } from '../activities/CollectionsManager';
import type { CategoryNode } from '../reference/creation/creationReferenceData';
import { ComparisonMatrix } from '../comparison/ComparisonMatrix';
import { ComboTripsManager } from './ComboTripsManager';
import { DailyScheduleView } from './DailyScheduleView';
import { TripCreationHub } from './TripCreationHub';
import { TripEditor } from './TripEditor';
import type {
  RegisteredSupplierRecord,
  SupplierPricingJournalEntry
} from '../../types/supplierJournal';
import type { ActivityCostProfile, OperationalCostLineItem } from '../../types/operationalCost';
import type { PersonProfile } from '../../types/personProfile';
import type { PlatformPricingSettings } from '../pricing/PricingToolManager';

interface TripsSectionProps {
  currentNavKey: NavigationItemKey;
  activities: Activity[];
  trips: TripRecord[];
  isEditingTrip: boolean;
  setIsEditingTrip: (editing: boolean) => void;
  selectedTripForEdit: TripRecord | null;
  setSelectedTripForEdit: (trip: TripRecord | null) => void;
  onNewTrip: (preset?: string) => void;
  onSaveTrip: (updated: TripRecord) => Promise<TripRecord>;
  onDeleteTrip: (tripId: string) => void;
  onToggleTripStatus: (tripId: string, newStatus: TripStatus) => void;
  onPreviewTrip: (trip: TripRecord, clientMode: boolean) => void;
  equipments: EquipmentItem[];
  equipmentTypes: EquipmentTypeDefinition[];
  equipmentUnitKinds?: EquipmentUnitKindItem[];
  equipmentProperties: EquipmentPropertyItem[];
  logisticsVehicles?: LogisticsVehicle[];
  masterAddons: MasterAddonItem[];
  specGroups: SpecGroupRecord[];
  inclusionsCatalog: InclusionCatalogItem[];
  onCreateInclusionItem: (input: {
    label: string;
    kind: InclusionKind;
    linkedCategoryIds?: string[];
  }) => InclusionCatalogItem;
  activityCollections: ActivityCollection[];
  setActivityCollections: React.Dispatch<React.SetStateAction<ActivityCollection[]>>;
  pricingProperties: PricingPropertyItem[];
  customTechnicalSpecs: CustomTechnicalSpecItem[];
  categoryTree: CategoryNode[];
  categoryRecords: CategoryRecord[];
  onAddCategoryToTree: (path: string[], newName: string) => void;
  onNavigate: (key: NavigationItemKey) => void;
  selectedCompareIds: string[];
  onToggleCompare: (activity: Activity) => void;
  onClearCompare: () => void;
  currentUser: AppUser;
  onAuditLog?: (input: LogAuditEventInput) => void;
  registeredSuppliers?: RegisteredSupplierRecord[];
  supplierJournals?: SupplierPricingJournalEntry[];
  onAddRegisteredSupplier?: (input: {
    id?: string;
    name: string;
    companyName: string;
    phone: string;
    tier: string;
  }) => Promise<RegisteredSupplierRecord>;
  onSubscribeSupplierToPlatform?: (supplierId: string) => Promise<{
    supplier: RegisteredSupplierRecord;
    user: AppUser;
    migratedActivitiesCount: number;
    migratedTripsCount: number;
  } | null>;
  onSwitchToSubscribedUser?: (user: AppUser) => void;
  countriesRef?: CountryRecord[];
  citiesRef?: CityRecord[];
  meetingPointsRef?: MeetingPointRecord[];
  onCreateCountryRef?: (input: { name: string; code?: string }) => CountryRecord;
  onCreateCityRef?: (input: { countryId: string; name: string }) => CityRecord;
  onCreateMeetingPointRef?: (input: {
    countryId?: string;
    cityId: string;
    name: string;
    pointType?: 'meeting_point' | 'site' | 'both';
  }) => MeetingPointRecord;
  costProfiles?: ActivityCostProfile[];
  personProfiles?: PersonProfile[];
  platformPricingSettings?: PlatformPricingSettings;
  onSaveCostProfile?: (
    draft: Omit<ActivityCostProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'auditTrail'> & {
      id?: string;
    }
  ) => ActivityCostProfile;
  onSyncCostItemsToLedger?: (input: {
    entityId: string;
    entityName: string;
    computedItems: Array<{ item: OperationalCostLineItem; impactEGP: number }>;
  }) => Promise<number>;
}

export const TripsSection: React.FC<TripsSectionProps> = ({
  currentNavKey,
  activities,
  trips,
  isEditingTrip,
  setIsEditingTrip,
  selectedTripForEdit,
  setSelectedTripForEdit,
  onNewTrip,
  onSaveTrip,
  onDeleteTrip,
  onToggleTripStatus,
  onPreviewTrip,
  equipments,
  equipmentTypes,
  equipmentUnitKinds = [],
  equipmentProperties,
  logisticsVehicles = [],
  masterAddons,
  specGroups,
  inclusionsCatalog,
  onCreateInclusionItem,
  activityCollections,
  setActivityCollections,
  pricingProperties,
  customTechnicalSpecs,
  categoryTree,
  categoryRecords,
  onAddCategoryToTree,
  onNavigate,
  selectedCompareIds,
  onToggleCompare,
  onClearCompare,
  currentUser,
  onAuditLog,
  registeredSuppliers,
  supplierJournals,
  onAddRegisteredSupplier,
  onSubscribeSupplierToPlatform,
  onSwitchToSubscribedUser,
  countriesRef = [],
  citiesRef = [],
  meetingPointsRef = [],
  onCreateCountryRef,
  onCreateCityRef,
  onCreateMeetingPointRef,
  costProfiles = [],
  personProfiles = [],
  platformPricingSettings,
  onSaveCostProfile,
  onSyncCostItemsToLedger
}) => {
  return (
    <>
      {currentNavKey === 'trip_add' &&
        (isEditingTrip && selectedTripForEdit ? (
          <TripEditor
            key={selectedTripForEdit.id}
            trip={selectedTripForEdit}
            isNewTrip={!trips.some((t) => t.id === selectedTripForEdit.id)}
            onSave={async (updated) => {
              const persisted = await onSaveTrip(updated);
              setSelectedTripForEdit(persisted);
              setIsEditingTrip(false);
            }}
            onCancel={() => setIsEditingTrip(false)}
            currentUser={currentUser}
            equipments={equipments}
            equipmentTypes={equipmentTypes}
            equipmentUnitKinds={equipmentUnitKinds}
            equipmentProperties={equipmentProperties}
            logisticsVehicles={logisticsVehicles}
            masterAddons={masterAddons}
            allTrips={trips}
            onNavigateToEquipment={() => onNavigate('activity_equipment')}
            activityCollections={activityCollections}
            onAddActivityCollection={(newCol) =>
              setActivityCollections((prev) => [newCol, ...prev])
            }
            pricingProperties={pricingProperties}
            customTechnicalSpecs={customTechnicalSpecs}
            specGroups={specGroups}
            inclusionsCatalog={inclusionsCatalog}
            categoryRecords={categoryRecords}
            onCreateInclusionItem={onCreateInclusionItem}
            onNavigateToCustomSpecs={() => onNavigate('unified_reference')}
            onNavigateToAddonsLibrary={() => onNavigate('unified_reference')}
            categoryTree={categoryTree}
            onAddCategoryToTree={onAddCategoryToTree}
            registeredSuppliers={registeredSuppliers}
            supplierJournals={supplierJournals}
            onAddRegisteredSupplier={onAddRegisteredSupplier}
            onSubscribeSupplierToPlatform={onSubscribeSupplierToPlatform}
            onSwitchToSubscribedUser={onSwitchToSubscribedUser}
            countriesRef={countriesRef}
            citiesRef={citiesRef}
            meetingPointsRef={meetingPointsRef}
            onCreateCountryRef={onCreateCountryRef}
            onCreateCityRef={onCreateCityRef}
            onCreateMeetingPointRef={onCreateMeetingPointRef}
            costProfiles={costProfiles}
            personProfiles={personProfiles}
            platformPricingSettings={platformPricingSettings}
            onSaveCostProfile={onSaveCostProfile}
            onSyncCostItemsToLedger={onSyncCostItemsToLedger}
          />
        ) : (
          <TripCreationHub
            trips={trips}
            currentUser={currentUser}
            onAddNewTrip={(preset) => onNewTrip(preset)}
            onEditTrip={(trip) => {
              setSelectedTripForEdit(trip);
              setIsEditingTrip(true);
            }}
            onDeleteTrip={onDeleteTrip}
            onToggleStatus={onToggleTripStatus}
            onViewTrip={(trip) => onPreviewTrip(trip, false)}
            onNavigateToCollections={() => onNavigate('activity_collections')}
            equipments={equipments}
            equipmentTypes={equipmentTypes}
          />
        ))}

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
