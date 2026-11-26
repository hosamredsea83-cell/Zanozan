import React, { useEffect, useState } from 'react';
import type { Activity, CategoryRecord } from '../../types/activity';
import type { AppUser } from '../../types/auth';
import type {
  EquipmentItem,
  EquipmentPropertyItem,
  EquipmentStatus,
  EquipmentTypeDefinition
} from '../../types/equipment';
import type { PartnerRecord } from '../../types/partner';
import type { PersonProfile } from '../../types/personProfile';
import type {
  AssetCatalogScope,
  EquipmentUnitKindItem,
  ManufacturerModelRecord,
  ManufacturerRecord,
  SpecGroupRecord
} from '../../types/masterReference';
import type { NavigationItemKey } from '../layout/Sidebar';
import { EquipmentManagement } from './EquipmentManagement';

interface EquipmentSectionProps {
  currentNavKey: NavigationItemKey;
  currentUser: AppUser;
  equipments: EquipmentItem[];
  equipmentTypes: EquipmentTypeDefinition[];
  equipmentProperties: EquipmentPropertyItem[];
  specGroups?: SpecGroupRecord[];
  activities: Activity[];
  categoryRecords: CategoryRecord[];
  partners: PartnerRecord[];
  personProfiles?: PersonProfile[];
  preselectedProfileForAsset?: PersonProfile | null;
  onConsumePreselectedProfile?: () => void;
  onCreatePartner: (
    payload: Omit<PartnerRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => PartnerRecord;
  onUpdatePartner: (updated: PartnerRecord) => void;
  onDeletePartner: (partnerId: string) => void;
  onCreateEquipment: (item: EquipmentItem) => void;
  onUpdateEquipment: (updated: EquipmentItem) => void;
  onDeleteEquipment: (equipmentId: string) => void;
  onSyncEquipmentActivities?: (equipmentId: string, linkedActivityIds: string[]) => void;
  onChangeEquipmentStatus: (equipmentId: string, status: EquipmentStatus) => void;
  onSaveEquipmentTypes: (types: EquipmentTypeDefinition[]) => void;
  equipmentUnitKinds?: EquipmentUnitKindItem[];
  manufacturers?: ManufacturerRecord[];
  manufacturerModels?: ManufacturerModelRecord[];
  onCreateEquipmentUnitKind?: (input: {
    name: string;
    domainScope?: AssetCatalogScope;
    defaultCategoryId?: string;
    defaultTypeId?: string;
    description?: string;
  }) => EquipmentUnitKindItem;
  onCreateManufacturer?: (input: {
    name: string;
    applicableTo?: AssetCatalogScope;
    linkedUnitKindIds?: string[];
  }) => ManufacturerRecord;
  onCreateManufacturerModel?: (input: {
    manufacturerId: string;
    name: string;
    applicableTo?: AssetCatalogScope;
    unitKindId?: string;
  }) => ManufacturerModelRecord;
  onNavigate: (key: NavigationItemKey) => void;
  onOpenActivityInEditor: (act: Activity) => void;
  externalRestoredDraft?: { item: EquipmentItem; isNew: boolean } | null;
  onConsumeExternalRestoredDraft?: () => void;
  onOpenAddActivityFromEquipment?: (
    draftItem: EquipmentItem,
    isNew: boolean,
    returnToNav: NavigationItemKey,
    presetCategoryPath: string[]
  ) => void;
}

interface DraftSession {
  item: EquipmentItem;
  isNew: boolean;
  returnToNav: NavigationItemKey;
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({
  currentNavKey,
  currentUser,
  equipments,
  equipmentTypes,
  equipmentProperties,
  specGroups = [],
  activities,
  categoryRecords,
  partners,
  personProfiles = [],
  preselectedProfileForAsset,
  onConsumePreselectedProfile,
  onCreatePartner,
  onUpdatePartner,
  onDeletePartner,
  onCreateEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onSyncEquipmentActivities,
  onChangeEquipmentStatus,
  onSaveEquipmentTypes,
  equipmentUnitKinds = [],
  manufacturers = [],
  manufacturerModels = [],
  onCreateEquipmentUnitKind,
  onCreateManufacturer,
  onCreateManufacturerModel,
  onNavigate,
  onOpenActivityInEditor,
  externalRestoredDraft = null,
  onConsumeExternalRestoredDraft,
  onOpenAddActivityFromEquipment
}) => {
  const [pausedDraft, setPausedDraft] = useState<DraftSession | null>(null);
  const [restoredDraft, setRestoredDraft] = useState<{
    item: EquipmentItem;
    isNew: boolean;
  } | null>(null);

  const effectiveRestoredDraft = externalRestoredDraft || restoredDraft;
  const handleConsumeEffectiveRestoredDraft = () => {
    if (externalRestoredDraft) onConsumeExternalRestoredDraft?.();
    if (restoredDraft) setRestoredDraft(null);
  };

  useEffect(() => {
    if (pausedDraft && pausedDraft.item.ownerId !== currentUser.id) {
      setPausedDraft(null);
    }
    if (restoredDraft && restoredDraft.item.ownerId !== currentUser.id) {
      setRestoredDraft(null);
    }
  }, [currentUser.id]);

  // Clear paused draft if user navigates away via sidebar rather than return buttons
  useEffect(() => {
    if (pausedDraft && currentNavKey !== 'activity_equipment_partners') {
      setPausedDraft(null);
    }
  }, [currentNavKey]);

  const isEquipmentView =
    currentNavKey === 'activity_equipment' ||
    currentNavKey === 'activity_equipment_add' ||
    currentNavKey === 'activity_equipment_manage';

  const resolvedViewMode =
    currentNavKey === 'activity_equipment_add'
      ? 'create'
      : currentNavKey === 'activity_equipment_manage'
      ? 'manage'
      : currentNavKey === 'activity_equipment_partners'
      ? 'partners'
      : 'registry';

  const handleNavigateToPartnersPage = (draftItem: EquipmentItem, isNew: boolean) => {
    setPausedDraft({
      item: draftItem,
      isNew,
      returnToNav: currentNavKey
    });
    onNavigate('person_profiles');
  };

  const handleSelectPartnerForDraft = (partner: PartnerRecord) => {
    if (!pausedDraft) return;
    const updatedItem: EquipmentItem = {
      ...pausedDraft.item,
      partnerId: partner.id,
      partnerName: partner.name,
      partnerCompanyName: partner.companyName,
      ownershipDetails:
        pausedDraft.item.ownershipType === 'rented'
          ? `مستأجرة بعقد تشغيل — المؤجر: ${partner.companyName} (${partner.name})`
          : `مشاركة تشغيل مع الشريك: ${partner.name} — ${partner.companyName}`
    };
    const targetNav = pausedDraft.returnToNav;
    setRestoredDraft({ item: updatedItem, isNew: pausedDraft.isNew });
    setPausedDraft(null);
    onNavigate(targetNav);
  };

  const handleReturnToEquipmentDraft = () => {
    if (!pausedDraft) return;
    const targetNav = pausedDraft.returnToNav;
    setRestoredDraft({ item: pausedDraft.item, isNew: pausedDraft.isNew });
    setPausedDraft(null);
    onNavigate(targetNav);
  };

  const handleUpdatePartnerWithDraftSync = (updated: PartnerRecord) => {
    onUpdatePartner(updated);
    if (pausedDraft && pausedDraft.item.partnerId === updated.id) {
      setPausedDraft({
        ...pausedDraft,
        item: {
          ...pausedDraft.item,
          partnerName: updated.name,
          partnerCompanyName: updated.companyName,
          ownershipDetails:
            pausedDraft.item.ownershipType === 'rented'
              ? `مستأجرة بعقد تشغيل — المؤجر: ${updated.companyName} (${updated.name})`
              : `مشاركة تشغيل مع الشريك: ${updated.name} — ${updated.companyName}`
        }
      });
    }
  };

  const handleDeletePartnerWithDraftSync = (partnerId: string) => {
    onDeletePartner(partnerId);
    if (pausedDraft && pausedDraft.item.partnerId === partnerId) {
      setPausedDraft({
        ...pausedDraft,
        item: {
          ...pausedDraft.item,
          partnerId: undefined,
          partnerName: undefined,
          partnerCompanyName: undefined
        }
      });
    }
  };

  return (
    <>

      {isEquipmentView && (
        <EquipmentManagement
          viewMode={resolvedViewMode}
          onReturnToManage={() => onNavigate('activity_equipment_manage')}
          equipments={equipments}
          equipmentTypes={equipmentTypes}
          equipmentProperties={equipmentProperties}
          specGroups={specGroups}
          categoryRecords={categoryRecords}
          activities={activities}
          currentUser={currentUser}
          partners={partners}
          personProfiles={personProfiles}
          onCreatePartner={onCreatePartner}
          onUpdatePartner={handleUpdatePartnerWithDraftSync}
          onDeletePartner={handleDeletePartnerWithDraftSync}
          onCreateEquipment={onCreateEquipment}
          onUpdateEquipment={onUpdateEquipment}
          onDeleteEquipment={onDeleteEquipment}
          onSyncEquipmentActivities={onSyncEquipmentActivities}
          onChangeEquipmentStatus={onChangeEquipmentStatus}
          onSaveEquipmentTypes={onSaveEquipmentTypes}
          onNavigateToEquipmentProperties={() => onNavigate('unified_reference')}
          onNavigateToPartnersPage={handleNavigateToPartnersPage}
          restoredDraft={effectiveRestoredDraft}
          onConsumeRestoredDraft={handleConsumeEffectiveRestoredDraft}
          pendingPartnersReturnDraft={null}
          onSelectPartnerForDraft={handleSelectPartnerForDraft}
          onReturnToEquipmentDraft={handleReturnToEquipmentDraft}
          preselectedProfileForAsset={preselectedProfileForAsset}
          onConsumePreselectedProfile={onConsumePreselectedProfile}
          equipmentUnitKinds={equipmentUnitKinds}
          manufacturers={manufacturers}
          manufacturerModels={manufacturerModels}
          onCreateEquipmentUnitKind={onCreateEquipmentUnitKind}
          onCreateManufacturer={onCreateManufacturer}
          onCreateManufacturerModel={onCreateManufacturerModel}
          onOpenActivityInEditor={onOpenActivityInEditor}
          onAddNewActivityForEquipment={
            onOpenAddActivityFromEquipment
              ? (draftItem, isNew, presetCategoryPath) =>
                  onOpenAddActivityFromEquipment(
                    draftItem,
                    isNew,
                    currentNavKey,
                    presetCategoryPath
                  )
              : undefined
          }
        />
      )}
    </>
  );
};
