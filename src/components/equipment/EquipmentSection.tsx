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
import type { NavigationItemKey } from '../layout/Sidebar';
import { CentralLibraryManager } from '../activities/CentralLibraryManager';
import { EquipmentManagement } from './EquipmentManagement';

interface EquipmentSectionProps {
  currentNavKey: NavigationItemKey;
  currentUser: AppUser;
  equipments: EquipmentItem[];
  equipmentTypes: EquipmentTypeDefinition[];
  equipmentProperties: EquipmentPropertyItem[];
  activities: Activity[];
  categoryRecords: CategoryRecord[];
  partners: PartnerRecord[];
  onCreatePartner: (
    payload: Omit<PartnerRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => PartnerRecord;
  onUpdatePartner: (updated: PartnerRecord) => void;
  onDeletePartner: (partnerId: string) => void;
  onCreateEquipment: (item: EquipmentItem) => void;
  onUpdateEquipment: (updated: EquipmentItem) => void;
  onDeleteEquipment: (equipmentId: string) => void;
  onChangeEquipmentStatus: (equipmentId: string, status: EquipmentStatus) => void;
  onSaveEquipmentTypes: (types: EquipmentTypeDefinition[]) => void;
  onChangeEquipmentProperties: (nextProps: EquipmentPropertyItem[]) => void;
  onResetEquipmentPropertiesCatalog: () => Promise<void>;
  onNavigate: (key: NavigationItemKey) => void;
  onOpenActivityInEditor: (act: Activity) => void;
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
  activities,
  categoryRecords,
  partners,
  onCreatePartner,
  onUpdatePartner,
  onDeletePartner,
  onCreateEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onChangeEquipmentStatus,
  onSaveEquipmentTypes,
  onChangeEquipmentProperties,
  onResetEquipmentPropertiesCatalog,
  onNavigate,
  onOpenActivityInEditor
}) => {
  const [pausedDraft, setPausedDraft] = useState<DraftSession | null>(null);
  const [restoredDraft, setRestoredDraft] = useState<{
    item: EquipmentItem;
    isNew: boolean;
  } | null>(null);

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
    currentNavKey === 'activity_equipment_manage' ||
    currentNavKey === 'activity_equipment_types' ||
    currentNavKey === 'activity_equipment_partners';

  const resolvedViewMode =
    currentNavKey === 'activity_equipment_add'
      ? 'create'
      : currentNavKey === 'activity_equipment_manage'
      ? 'manage'
      : currentNavKey === 'activity_equipment_types'
      ? 'types_builder'
      : currentNavKey === 'activity_equipment_partners'
      ? 'partners'
      : 'registry';

  const handleNavigateToPartnersPage = (draftItem: EquipmentItem, isNew: boolean) => {
    setPausedDraft({
      item: draftItem,
      isNew,
      returnToNav: currentNavKey
    });
    onNavigate('activity_equipment_partners');
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
      {currentNavKey === 'activity_meta_library' && (
        <CentralLibraryManager
          equipmentProperties={equipmentProperties}
          onChangeEquipmentProperties={onChangeEquipmentProperties}
          equipments={equipments}
          equipmentTypes={equipmentTypes}
          activities={activities}
          categoryRecords={categoryRecords}
          onResetCatalog={onResetEquipmentPropertiesCatalog}
        />
      )}

      {isEquipmentView && (
        <EquipmentManagement
          viewMode={resolvedViewMode}
          onReturnToManage={() => onNavigate('activity_equipment_manage')}
          equipments={equipments}
          equipmentTypes={equipmentTypes}
          equipmentProperties={equipmentProperties}
          activities={activities}
          currentUser={currentUser}
          partners={partners}
          onCreatePartner={onCreatePartner}
          onUpdatePartner={handleUpdatePartnerWithDraftSync}
          onDeletePartner={handleDeletePartnerWithDraftSync}
          onCreateEquipment={onCreateEquipment}
          onUpdateEquipment={onUpdateEquipment}
          onDeleteEquipment={onDeleteEquipment}
          onChangeEquipmentStatus={onChangeEquipmentStatus}
          onSaveEquipmentTypes={onSaveEquipmentTypes}
          onNavigateToEquipmentProperties={() => onNavigate('activity_meta_library')}
          onNavigateToPartnersPage={handleNavigateToPartnersPage}
          restoredDraft={restoredDraft}
          onConsumeRestoredDraft={() => setRestoredDraft(null)}
          pendingPartnersReturnDraft={
            currentNavKey === 'activity_equipment_partners' ? pausedDraft?.item || null : null
          }
          onSelectPartnerForDraft={handleSelectPartnerForDraft}
          onReturnToEquipmentDraft={handleReturnToEquipmentDraft}
          onOpenActivityInEditor={onOpenActivityInEditor}
        />
      )}
    </>
  );
};
