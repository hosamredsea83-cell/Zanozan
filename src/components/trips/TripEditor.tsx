import React from 'react';
import type { TripRecord } from '../../types/trip';
import type {
  CategoryRecord,
  CustomTechnicalSpecItem,
  PricingPropertyItem
} from '../../types/activity';
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
import type { ActivityCollection } from '../activities/CollectionsManager';
import type { CategoryNode } from '../reference/creation/creationReferenceData';
import { CreationReferenceEditor } from '../reference/creation/CreationReferenceEditor';
import {
  TRIP_TERMINOLOGY,
  type EntityCreationOverrides
} from '../reference/creation/entityCreationTerminology';
import type {
  RegisteredSupplierRecord,
  SupplierPricingJournalEntry
} from '../../types/supplierJournal';
import type { ActivityCostProfile, OperationalCostLineItem } from '../../types/operationalCost';
import type { PersonProfile } from '../../types/personProfile';
import type { PlatformPricingSettings } from '../pricing/PricingToolManager';

interface TripEditorProps {
  trip: TripRecord;
  onSave: (updatedTrip: TripRecord) => void | Promise<void>;
  onCancel: () => void;
  currentUser?: AppUser;
  equipments?: EquipmentItem[];
  equipmentTypes?: EquipmentTypeDefinition[];
  equipmentUnitKinds?: EquipmentUnitKindItem[];
  equipmentProperties?: EquipmentPropertyItem[];
  logisticsVehicles?: LogisticsVehicle[];
  masterAddons?: MasterAddonItem[];
  allTrips?: TripRecord[];
  onNavigateToEquipment?: () => void;
  activityCollections?: ActivityCollection[];
  onAddActivityCollection?: (col: ActivityCollection) => void;
  pricingProperties?: PricingPropertyItem[];
  customTechnicalSpecs?: CustomTechnicalSpecItem[];
  specGroups?: SpecGroupRecord[];
  inclusionsCatalog?: InclusionCatalogItem[];
  categoryRecords?: CategoryRecord[];
  onCreateInclusionItem?: (input: {
    label: string;
    kind: InclusionKind;
    linkedCategoryIds?: string[];
  }) => InclusionCatalogItem;
  onNavigateToCustomSpecs?: () => void;
  onNavigateToAddonsLibrary?: () => void;
  categoryTree?: CategoryNode[];
  onAddCategoryToTree?: (path: string[], newName: string) => void;
  isNewTrip?: boolean;
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

// Extension point for future Trip-only Editor customizations without affecting Activities
const tripEditorOverrides: EntityCreationOverrides = {};

export const TripEditor: React.FC<TripEditorProps> = ({
  trip,
  onSave,
  onCancel,
  currentUser,
  equipments = [],
  equipmentTypes = [],
  equipmentUnitKinds = [],
  equipmentProperties = [],
  logisticsVehicles = [],
  masterAddons = [],
  allTrips = [],
  onNavigateToEquipment,
  activityCollections,
  onAddActivityCollection,
  pricingProperties = [],
  customTechnicalSpecs = [],
  specGroups = [],
  inclusionsCatalog = [],
  categoryRecords = [],
  onCreateInclusionItem,
  onNavigateToCustomSpecs,
  onNavigateToAddonsLibrary,
  categoryTree,
  onAddCategoryToTree,
  isNewTrip,
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
    <CreationReferenceEditor
      terms={TRIP_TERMINOLOGY}
      overrides={tripEditorOverrides}
      activity={trip}
      onSave={async (updated) => {
        await onSave({
          ...(updated as TripRecord),
          entityKind: 'trip'
        });
      }}
      onCancel={onCancel}
      currentUser={currentUser}
      equipments={equipments}
      equipmentTypes={equipmentTypes}
      equipmentUnitKinds={equipmentUnitKinds}
      equipmentProperties={equipmentProperties}
      logisticsVehicles={logisticsVehicles}
      masterAddons={masterAddons}
      allActivities={allTrips}
      onNavigateToEquipment={onNavigateToEquipment}
      activityCollections={activityCollections}
      onAddActivityCollection={onAddActivityCollection}
      pricingProperties={pricingProperties}
      customTechnicalSpecs={customTechnicalSpecs}
      specGroups={specGroups}
      inclusionsCatalog={inclusionsCatalog}
      categoryRecords={categoryRecords}
      onCreateInclusionItem={onCreateInclusionItem}
      onNavigateToCustomSpecs={onNavigateToCustomSpecs}
      onNavigateToAddonsLibrary={onNavigateToAddonsLibrary}
      categoryTree={categoryTree}
      onAddCategoryToTree={onAddCategoryToTree}
      isNewActivity={isNewTrip}
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
  );
};
