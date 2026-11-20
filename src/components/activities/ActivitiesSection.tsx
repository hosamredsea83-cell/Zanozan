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
import type { EquipmentItem, EquipmentTypeDefinition } from '../../types/equipment';
import type { NavigationItemKey } from '../layout/Sidebar';
import type { PlatformPricingSettings } from '../pricing/PricingToolManager';
import { ActivityCreationHub } from './ActivityCreationHub';
import { ActivityEditor, CategoryNode } from './ActivityEditor';
import { ActivityList } from './ActivityList';
import { ActivitiesMarketplace } from './ActivitiesMarketplace';
import { CategoriesManager } from './CategoriesManager';
import { ActivityCollection, CollectionsManager } from './CollectionsManager';
import { CustomTechnicalSpecsManager } from './CustomTechnicalSpecsManager';
import { DiscountsManager } from './DiscountsManager';
import { OffersManager } from './OffersManager';
import { PricingPropertiesManager } from './PricingPropertiesManager';

interface ActivitiesSectionProps {
  currentNavKey: NavigationItemKey;
  currentUser: AppUser;
  activities: Activity[];
  equipments: EquipmentItem[];
  equipmentTypes: EquipmentTypeDefinition[];
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
  setCustomTechnicalSpecs: React.Dispatch<React.SetStateAction<CustomTechnicalSpecItem[]>>;
  platformPricingSettings: PlatformPricingSettings;
  categoryTree: CategoryNode[];
  categoryRecords: CategoryRecord[];
  onNavigate: (key: NavigationItemKey) => void;
  onNewActivity: (preset?: string) => void;
  onSaveActivity: (updated: Activity) => Promise<Activity>;
  onDeleteActivity: (activityId: string) => void;
  onToggleStatus: (activityId: string, newStatus: ActivityStatus) => void;
  onToggleCompare: (activity: Activity) => void;
  onClearCompare: () => void;
  onToggleFavorite: (activityId: string) => void;
  onApplyOfferToActivity: (activityId: string, offer: SeasonalDiscount) => void;
  onRemoveOffer: (activityId: string, offerId: string) => void;
  onUpdateActivityPricing: (activityId: string, pricing: Activity['pricing']) => void;
  onCreateCategoryRecord: (payload: {
    id?: string;
    name: string;
    handle?: string;
    description?: string;
    parentId?: string | null;
    parentPath?: string[];
  }) => Promise<CategoryRecord>;
  onUpdateCategoryRecord: (
    id: string,
    updates: { name?: string; handle?: string; description?: string }
  ) => Promise<CategoryRecord>;
  onDeleteCategoryRecord: (id: string) => Promise<void>;
  onAddCategoryToTree: (path: string[], newName: string) => void;
  onResetCustomSpecsCatalog: () => Promise<void>;
  onPreviewActivity: (act: Activity, clientMode: boolean) => void;
}

export const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({
  currentNavKey,
  currentUser,
  activities,
  equipments,
  equipmentTypes,
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
  setCustomTechnicalSpecs,
  platformPricingSettings,
  categoryTree,
  categoryRecords,
  onNavigate,
  onNewActivity,
  onSaveActivity,
  onDeleteActivity,
  onToggleStatus,
  onToggleCompare,
  onClearCompare,
  onToggleFavorite,
  onApplyOfferToActivity,
  onRemoveOffer,
  onUpdateActivityPricing,
  onCreateCategoryRecord,
  onUpdateCategoryRecord,
  onDeleteCategoryRecord,
  onAddCategoryToTree,
  onResetCustomSpecsCatalog,
  onPreviewActivity
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
            }}
            onCancel={() => setIsEditingActivity(false)}
            currentUser={currentUser}
            equipments={equipments}
            equipmentTypes={equipmentTypes}
            allActivities={activities}
            onNavigateToEquipment={() => onNavigate('activity_equipment')}
            activityCollections={activityCollections}
            onAddActivityCollection={(newCol) =>
              setActivityCollections((prev) => [newCol, ...prev])
            }
            pricingProperties={pricingProperties}
            customTechnicalSpecs={customTechnicalSpecs}
            onNavigateToCustomSpecs={() => onNavigate('activity_custom_specs')}
            categoryTree={categoryTree}
            onAddCategoryToTree={onAddCategoryToTree}
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

      {currentNavKey === 'activity_categories' && (
        <CategoriesManager
          categoryTree={categoryTree}
          categoryRecords={categoryRecords}
          onCreateCategory={onCreateCategoryRecord}
          onUpdateCategory={onUpdateCategoryRecord}
          onDeleteCategory={onDeleteCategoryRecord}
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
            const isOwn =
              act.owner?.id === currentUser.id || act.owner?.name === currentUser.name;
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

      {currentNavKey === 'activity_custom_specs' && (
        <CustomTechnicalSpecsManager
          customSpecs={customTechnicalSpecs}
          onChangeCustomSpecs={setCustomTechnicalSpecs}
          activities={activities}
          onResetCatalog={onResetCustomSpecsCatalog}
        />
      )}
    </>
  );
};
