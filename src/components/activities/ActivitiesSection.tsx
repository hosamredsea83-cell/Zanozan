import React from 'react';
import type {
  Activity,
  ActivityStatus,
  CategoryRecord,
  CustomTechnicalSpecItem,
  PricingPropertyItem,
  SeasonalDiscount
} from '../../types/activity';
import type { AppUser } from '../../types/auth';
import type { EquipmentItem, EquipmentPropertyItem, EquipmentTypeDefinition } from '../../types/equipment';
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
import type { MasterAddonItem } from '../../types/addon';
import type { NavigationItemKey } from '../layout/Sidebar';
import type { PlatformPricingSettings } from '../pricing/PricingToolManager';
import type { ActivityCostProfile, OperationalCostLineItem } from '../../types/operationalCost';
import type { PersonProfile } from '../../types/personProfile';
import { ActivityCreationHub } from './ActivityCreationHub';
import { ActivityEditor, CategoryNode } from './ActivityEditor';
import { ActivityList } from './ActivityList';
import { ActivitiesMarketplace } from './ActivitiesMarketplace';
import { ActivityCollection, CollectionsManager } from './CollectionsManager';
import { DiscountsManager } from './DiscountsManager';
import { OffersManager } from './OffersManager';
import { PricingPropertiesManager } from './PricingPropertiesManager';
import { activityBelongsToOwner } from '../../db/localActivitiesDb';
import type {
  RegisteredSupplierRecord,
  SupplierPricingJournalEntry
} from '../../types/supplierJournal';

interface ActivitiesSectionProps {
  currentNavKey: NavigationItemKey;
  currentUser: AppUser;
  activities: Activity[];
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
  isEditingActivity: boolean;
  setIsEditingActivity: (editing: boolean) => void;
  selectedActivityForEdit: Activity | null;
  setSelectedActivityForEdit: (act: Activity | null) => void;
  selectedCompareIds: string[];
  favoriteIds: string[];
  activityCollections: ActivityCollection[];
  setActivityCollections: React.Dispatch<React.SetStateAction<ActivityCollection[]>>;
  pricingProperties: PricingPropertyItem[];
  setPricingProperties: React.Dispatch<React.SetStateAction<PricingPropertyItem[]>>;
  customTechnicalSpecs: CustomTechnicalSpecItem[];
  platformPricingSettings: PlatformPricingSettings;
  categoryTree: CategoryNode[];
  categoryRecords: CategoryRecord[];
  onNavigate: (key: NavigationItemKey) => void;
  onNewActivity: (preset?: string) => void;
  onSaveActivity: (updated: Activity) => Promise<Activity>;
  onAfterSaveActivity?: (persisted: Activity) => void;
  onCancelActivityEdit?: () => void;
  onDeleteActivity: (activityId: string) => void;
  onToggleStatus: (activityId: string, newStatus: ActivityStatus) => void;
  onToggleCompare: (activity: Activity) => void;
  onClearCompare: () => void;
  onToggleFavorite: (activityId: string) => void;
  onApplyOfferToActivity: (activityId: string, offer: SeasonalDiscount) => void;
  onRemoveOffer: (activityId: string, offerId: string) => void;
  onUpdateActivityPricing: (activityId: string, pricing: Activity['pricing']) => void;
  onAddCategoryToTree: (path: string[], newName: string) => void;
  onPreviewActivity: (act: Activity, clientMode: boolean) => void;
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

export const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({
  currentNavKey,
  currentUser,
  activities,
  equipments,
  equipmentTypes,
  equipmentUnitKinds = [],
  equipmentProperties,
  logisticsVehicles = [],
  masterAddons,
  specGroups,
  inclusionsCatalog,
  onCreateInclusionItem,
  isEditingActivity,
  setIsEditingActivity,
  selectedActivityForEdit,
  setSelectedActivityForEdit,
  selectedCompareIds,
  favoriteIds,
  activityCollections,
  setActivityCollections,
  pricingProperties,
  setPricingProperties,
  customTechnicalSpecs,
  platformPricingSettings,
  categoryTree,
  categoryRecords,
  onNavigate,
  onNewActivity,
  onSaveActivity,
  onAfterSaveActivity,
  onCancelActivityEdit,
  onDeleteActivity,
  onToggleStatus,
  onToggleCompare,
  onClearCompare,
  onToggleFavorite,
  onApplyOfferToActivity,
  onRemoveOffer,
  onUpdateActivityPricing,
  onAddCategoryToTree,
  onPreviewActivity,
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
  onSaveCostProfile,
  onSyncCostItemsToLedger
}) => {
  return (
    <>
      {currentNavKey === 'activity_add' &&
        (isEditingActivity && selectedActivityForEdit ? (
          <ActivityEditor
            key={selectedActivityForEdit.id}
            activity={selectedActivityForEdit}
            isNewActivity={!activities.some((a) => a.id === selectedActivityForEdit.id)}
            onSave={async (updated) => {
              const persisted = await onSaveActivity(updated);
              setSelectedActivityForEdit(persisted);
              setIsEditingActivity(false);
              onAfterSaveActivity?.(persisted);
            }}
            onCancel={() => {
              setIsEditingActivity(false);
              onCancelActivityEdit?.();
            }}
            currentUser={currentUser}
            equipments={equipments}
            equipmentTypes={equipmentTypes}
            equipmentUnitKinds={equipmentUnitKinds}
            equipmentProperties={equipmentProperties}
            logisticsVehicles={logisticsVehicles}
            masterAddons={masterAddons}
            allActivities={activities}
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
          <ActivityCreationHub
            activities={activities}
            currentUser={currentUser}
            onAddNewActivity={(preset) => onNewActivity(preset)}
            onEditActivity={(act) => {
              setSelectedActivityForEdit(act);
              setIsEditingActivity(true);
            }}
            onDeleteActivity={onDeleteActivity}
            onToggleStatus={onToggleStatus}
            onViewActivity={(act) => onPreviewActivity(act, false)}
            onNavigateToCollections={() => onNavigate('activity_collections')}
            equipments={equipments}
            equipmentTypes={equipmentTypes}
          />
        ))}

      {currentNavKey === 'activity_collections' && (
        <CollectionsManager
          activities={activities}
          currentUser={currentUser}
          collections={activityCollections}
          onCollectionsChange={setActivityCollections}
          onNavigateToActivityAdd={() => onNewActivity()}
        />
      )}

      {currentNavKey === 'activity_manage' && (
        <ActivityList
          activities={activities}
          currentUser={currentUser}
          onSelectActivity={(act) => onPreviewActivity(act, false)}
          onEditActivity={(act) => {
            setSelectedActivityForEdit(act);
            setIsEditingActivity(true);
            onNavigate('activity_add');
          }}
          onDeleteActivity={onDeleteActivity}
          onToggleStatus={onToggleStatus}
          onCompareActivity={onToggleCompare}
          selectedCompareIds={selectedCompareIds}
          equipments={equipments}
          equipmentTypes={equipmentTypes}
        />
      )}

      {currentNavKey === 'activity_marketplace' && (
        <ActivitiesMarketplace
          activities={activities}
          currentUser={currentUser}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          compareIds={selectedCompareIds}
          onToggleCompare={onToggleCompare}
          onClearCompare={onClearCompare}
          onSelectActivity={(act) => {
            const isOwn = activityBelongsToOwner(act, currentUser);
            onPreviewActivity(act, !isOwn);
          }}
          onEditActivity={(act) => {
            setSelectedActivityForEdit(act);
            setIsEditingActivity(true);
            onNavigate('activity_add');
          }}
          equipments={equipments}
          equipmentTypes={equipmentTypes}
          platformPricingSettings={platformPricingSettings}
        />
      )}

      {currentNavKey === 'activity_offers' && (
        <OffersManager
          activities={activities}
          onApplyOfferToActivity={onApplyOfferToActivity}
          onRemoveOffer={onRemoveOffer}
        />
      )}

      {currentNavKey === 'activity_discounts' && (
        <DiscountsManager
          activities={activities}
          onUpdateActivityPricing={onUpdateActivityPricing}
        />
      )}

      {currentNavKey === 'activity_pricing_properties' && (
        <PricingPropertiesManager
          pricingProperties={pricingProperties}
          onChangePricingProperties={setPricingProperties}
        />
      )}
    </>
  );
};
