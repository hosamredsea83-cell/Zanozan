import React, { useEffect, useMemo, useState } from 'react';
import type {
  EquipmentItem,
  EquipmentPropertyItem,
  EquipmentStatus,
  EquipmentTypeDefinition
} from '../../types/equipment';
import type { Activity, CategoryRecord } from '../../types/activity';
import type { AppUser } from '../../types/auth';
import type { PartnerRecord } from '../../types/partner';
import type { PersonProfile } from '../../types/personProfile';
import type {
  AssetCatalogScope,
  EquipmentUnitKindItem,
  ManufacturerModelRecord,
  ManufacturerRecord,
  SpecGroupRecord
} from '../../types/masterReference';
import { equipmentBelongsToEditableUser } from '../../utils/assetCustodyHelpers';
import { buildDynamicSpecsFromType } from './equipmentHelpers';
import { CompanyEquipmentTable } from './CompanyEquipmentTable';
import { EquipmentForm } from './EquipmentForm';
import { EquipmentCardsRegistry } from './EquipmentCardsRegistry';
import { EquipmentTypesBuilder } from './EquipmentTypesBuilder';
import { EquipmentInspectModal } from './EquipmentInspectModal';
import { PartnersRegistryPanel } from './PartnersRegistryPanel';
import { CheckCircle2, Plus, Sliders, Wrench, X } from 'lucide-react';

interface EquipmentManagementProps {
  equipments: EquipmentItem[];
  equipmentTypes: EquipmentTypeDefinition[];
  categoryRecords?: CategoryRecord[];
  activities: Activity[];
  currentUser: AppUser;
  partners?: PartnerRecord[];
  personProfiles?: PersonProfile[];
  onCreatePartner?: (
    payload: Omit<PartnerRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ) => PartnerRecord;
  onUpdatePartner?: (updated: PartnerRecord) => void;
  onDeletePartner?: (partnerId: string) => void;
  onCreateEquipment: (item: EquipmentItem) => void;
  onUpdateEquipment: (item: EquipmentItem) => void;
  onDeleteEquipment: (equipmentId: string) => void;
  onSyncEquipmentActivities?: (equipmentId: string, linkedActivityIds: string[]) => void;
  onChangeEquipmentStatus: (equipmentId: string, status: EquipmentStatus) => void;
  onSaveEquipmentTypes: (types: EquipmentTypeDefinition[]) => void;
  onOpenActivityInEditor?: (activity: Activity) => void;
  viewMode?: 'registry' | 'manage' | 'create' | 'types_builder' | 'partners';
  onReturnToManage?: () => void;
  equipmentProperties?: EquipmentPropertyItem[];
  specGroups?: SpecGroupRecord[];
  onNavigateToEquipmentProperties?: () => void;
  onNavigateToPartnersPage?: (draftItem: EquipmentItem, isNew: boolean) => void;
  restoredDraft?: { item: EquipmentItem; isNew: boolean } | null;
  onConsumeRestoredDraft?: () => void;
  pendingPartnersReturnDraft?: EquipmentItem | null;
  onSelectPartnerForDraft?: (partner: PartnerRecord) => void;
  onReturnToEquipmentDraft?: () => void;
  preselectedProfileForAsset?: PersonProfile | null;
  onConsumePreselectedProfile?: () => void;
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
  onAddNewActivityForEquipment?: (
    draftItem: EquipmentItem,
    isNew: boolean,
    presetCategoryPath: string[]
  ) => void;
}

export const EquipmentManagement: React.FC<EquipmentManagementProps> = ({
  equipments,
  equipmentTypes,
  categoryRecords = [],
  activities,
  currentUser,
  partners = [],
  personProfiles = [],
  onCreatePartner,
  onUpdatePartner,
  onDeletePartner,
  onCreateEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onSyncEquipmentActivities,
  onChangeEquipmentStatus,
  onSaveEquipmentTypes,
  onOpenActivityInEditor,
  viewMode = 'registry',
  onReturnToManage,
  equipmentProperties = [],
  specGroups = [],
  onNavigateToEquipmentProperties,
  onNavigateToPartnersPage,
  restoredDraft,
  onConsumeRestoredDraft,
  pendingPartnersReturnDraft,
  onSelectPartnerForDraft,
  onReturnToEquipmentDraft,
  preselectedProfileForAsset,
  onConsumePreselectedProfile,
  equipmentUnitKinds = [],
  manufacturers = [],
  manufacturerModels = [],
  onCreateEquipmentUnitKind,
  onCreateManufacturer,
  onCreateManufacturerModel,
  onAddNewActivityForEquipment
}) => {
  const activeTab =
    viewMode === 'types_builder'
      ? 'types_builder'
      : viewMode === 'partners'
      ? 'partners'
      : 'registry';

  const [scopeFilter, setScopeFilter] = useState<'mine' | 'all'>('mine');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(null);
  const [isNewMode, setIsNewMode] = useState(false);
  const [inspectEquipment, setInspectEquipment] = useState<EquipmentItem | null>(null);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const getTypeName = (typeId: string) =>
    equipmentTypes.find((t) => t.id === typeId)?.name || 'نوع مخصص';

  const myEquipments = useMemo(
    () => equipments.filter((eq) => equipmentBelongsToEditableUser(eq, currentUser)),
    [equipments, currentUser]
  );

  const visibleEquipments = useMemo(() => {
    const base = scopeFilter === 'mine' ? myEquipments : equipments;
    return base.filter((eq) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        eq.name.toLowerCase().includes(q) ||
        (eq.translations?.en?.name || '').toLowerCase().includes(q) ||
        eq.id.toLowerCase().includes(q) ||
        eq.classification.toLowerCase().includes(q) ||
        eq.description.toLowerCase().includes(q) ||
        getTypeName(eq.typeId).toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || eq.typeId === typeFilter;
      const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [scopeFilter, myEquipments, equipments, searchQuery, typeFilter, statusFilter, equipmentTypes]);

  const openCreateEquipment = (linkedProfile?: PersonProfile | null) => {
    const newId = `EQ-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];
    const isSelfProfile =
      linkedProfile &&
      linkedProfile.linkedUserId === currentUser.id &&
      (linkedProfile.subscriptionStatus === 'native_member' ||
        linkedProfile.subscriptionStatus === 'subscribed_isolated');

    const draft: EquipmentItem = {
      id: newId,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerCompanyName: currentUser.companyName,
      name: '',
      typeId: '',
      linkedCategoryIds: [],
      classification: '',
      description: '',
      translations: {
        en: {
          name: '',
          description: ''
        }
      },
      media: [
        {
          id: `eq-med-${Date.now()}`,
          url: '/src/assets/images/zanoza_yacht_hurghada_1794046061468.jpg',
          title: 'الصورة الرئيسية للمعدة',
          type: 'image',
          isCover: true,
          isPublicForClient: true
        }
      ],
      operationalData: {
        serialOrRegistrationNo: '',
        modelYear: '2026',
        capacityOrUnitLabel: '',
        maintenanceStatus: 'ready',
        lastInspectionDate: today,
        internalNotes: ''
      },
      status: 'available',
      ownershipType: linkedProfile && !isSelfProfile ? 'partner_shared' : 'owned',
      partnerId: linkedProfile && !isSelfProfile ? linkedProfile.id : undefined,
      partnerName: linkedProfile && !isSelfProfile ? linkedProfile.name : undefined,
      partnerCompanyName:
        linkedProfile && !isSelfProfile ? linkedProfile.companyName : undefined,
      personCustody:
        linkedProfile && !isSelfProfile
          ? {
              personProfileId: linkedProfile.id,
              personName: linkedProfile.name,
              personStatus:
                linkedProfile.subscriptionStatus === 'subscribed_isolated'
                  ? 'subscribed_isolated'
                  : 'external_pending',
              addedByUserId: linkedProfile.addedByUserId || currentUser.id,
              addedByUserName: linkedProfile.addedByUserName || currentUser.name,
              claimedUserId:
                linkedProfile.subscriptionStatus === 'subscribed_isolated'
                  ? linkedProfile.linkedUserId
                  : undefined
            }
          : undefined,
      ownershipDetails:
        linkedProfile && !isSelfProfile
          ? `مشاركة تشغيل مع المورد: ${linkedProfile.name} — ${linkedProfile.companyName}`
          : `صاحب النشاط: ${currentUser.name} — ${currentUser.companyName}`,
      dynamicSpecs: [],
      extraData: [],
      showToClientDefault: true,
      linkedActivityIds: [],
      allowGeneralActivityLinking: false,
      createdAt: today,
      updatedAt: today
    };
    setIsNewMode(true);
    setFormValidationError(null);
    setEditingEquipment(draft);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (restoredDraft && viewMode !== 'partners') {
      setIsNewMode(restoredDraft.isNew);
      setEditingEquipment(restoredDraft.item);
      onConsumeRestoredDraft?.();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (viewMode === 'create') {
      openCreateEquipment(preselectedProfileForAsset);
      if (preselectedProfileForAsset) {
        onConsumePreselectedProfile?.();
      }
    } else if (viewMode === 'registry' || viewMode === 'manage' || viewMode === 'partners') {
      setEditingEquipment(null);
    }
  }, [viewMode, currentUser.id, preselectedProfileForAsset]);

  const openEditEquipment = (eq: EquipmentItem) => {
    const typeDef = equipmentTypes.find((t) => t.id === eq.typeId);
    const syncedSpecs = typeDef
      ? buildDynamicSpecsFromType(typeDef, eq.dynamicSpecs)
      : eq.dynamicSpecs;
    const existingLinkedIds = activities
      .filter((act) => (act.equipmentIds || []).includes(eq.id))
      .map((act) => act.id);
    setIsNewMode(false);
    setEditingEquipment({
      ...eq,
      linkedActivityIds: existingLinkedIds,
      allowGeneralActivityLinking: Boolean(eq.allowGeneralActivityLinking),
      translations: {
        en: {
          name: eq.translations?.en?.name || '',
          description: eq.translations?.en?.description || ''
        }
      },
      dynamicSpecs: syncedSpecs
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEquipmentTypeChange = (newTypeId: string) => {
    if (!editingEquipment) return;
    const typeDef = equipmentTypes.find((t) => t.id === newTypeId);
    setEditingEquipment({
      ...editingEquipment,
      typeId: newTypeId,
      dynamicSpecs: typeDef
        ? buildDynamicSpecsFromType(typeDef, editingEquipment.dynamicSpecs)
        : editingEquipment.dynamicSpecs
    });
  };

  const handleSaveEquipmentForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment || !editingEquipment.name.trim()) return;

    if (
      categoryRecords.length > 0 &&
      (!editingEquipment.linkedCategoryIds || editingEquipment.linkedCategoryIds.length === 0)
    ) {
      setFormValidationError(
        'لابد من اختيار فئة واحدة على الأقل من قائمة البحث لربط المعدة بها، حتى تظهر تلقائياً عند إنشاء نشاط جديد.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setFormValidationError(null);
    const updatedItem: EquipmentItem = {
      ...editingEquipment,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (isNewMode) {
      onCreateEquipment(updatedItem);
      onSyncEquipmentActivities?.(updatedItem.id, updatedItem.linkedActivityIds || []);
      notify(`✓ تم إنشاء ملف المعدة المستقل "${updatedItem.name}" برقم ${updatedItem.id}`);
    } else {
      onUpdateEquipment(updatedItem);
      onSyncEquipmentActivities?.(updatedItem.id, updatedItem.linkedActivityIds || []);
      notify(
        `✓ تم حفظ تعديلات المعدة "${updatedItem.name}" ومزامنتها مع كافة الأنشطة المرتبطة`
      );
    }
    setEditingEquipment(null);
    if (viewMode === 'create' && onReturnToManage) {
      onReturnToManage();
    }
  };

  const handleCancelForm = () => {
    setFormValidationError(null);
    setEditingEquipment(null);
    if (viewMode === 'create' && onReturnToManage) {
      onReturnToManage();
    }
  };

  const noopCreatePartner = (
    payload: Omit<PartnerRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ): PartnerRecord => ({
    ...payload,
    id: `prt-${Date.now()}`,
    ownerId: currentUser.id,
    createdAt: '',
    updatedAt: ''
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {toastMsg && (
        <aside
          role="status"
          className="fixed bottom-6 left-6 z-50 bg-emerald-950 border border-emerald-500/60 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </aside>
      )}

      {/* Header Banner (div:nth-of-type(1) when visible) */}
      {(activeTab === 'types_builder' ||
        Boolean(editingEquipment) ||
        (viewMode !== 'manage' && activeTab !== 'partners')) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {activeTab === 'types_builder' ? (
                <Sliders className="w-5 h-5 text-emerald-400" />
              ) : (
                <Wrench className="w-5 h-5 text-cyan-400" />
              )}
              <h2 className="text-lg md:text-xl font-bold text-white">
                {activeTab === 'types_builder'
                  ? 'انواع المعدات والمواصفات'
                  : 'إدارة المعدات والأصول التشغيلية (Equipment Management)'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              {activeTab === 'types_builder'
                ? 'إدارة أنواع المعدات المسجلة بالمنصة وتكوين مجموعات وحقول المواصفات الديناميكية لكل نوع.'
                : `ملفات مستقلة للمعدات مرتبطة بصاحب النشاط (${currentUser.name})، بنظام مواصفات ديناميكي حسب نوع كل معدة، وقابلة للربط المرن مع أكثر من نشاط دون تكرار البيانات.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === 'types_builder' ? (
              <button
                type="button"
                onClick={() => setShowNewTypeForm((prev) => !prev)}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showNewTypeForm ? 'إغلاق نموذج النوع' : '+ إضافة نوع معدة جديد'}</span>
              </button>
            ) : editingEquipment ? (
              <button
                type="button"
                onClick={handleCancelForm}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>العودة لسجل المعدات</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openCreateEquipment()}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ تسجيل معدة جديدة</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content View */}
      {activeTab === 'partners' ? (
        <PartnersRegistryPanel
          partners={partners}
          equipments={equipments}
          selectedPartnerId={pendingPartnersReturnDraft?.partnerId}
          onSelectPartner={
            pendingPartnersReturnDraft && onSelectPartnerForDraft
              ? (partner) => onSelectPartnerForDraft(partner)
              : undefined
          }
          onReturnToForm={
            pendingPartnersReturnDraft && onReturnToEquipmentDraft
              ? onReturnToEquipmentDraft
              : undefined
          }
          returnFormLabel={
            pendingPartnersReturnDraft
              ? `العودة لنموذج: ${pendingPartnersReturnDraft.name || 'معدة جديدة'}`
              : undefined
          }
          onCreatePartner={(payload) => {
            const created = (onCreatePartner || noopCreatePartner)(payload);
            notify(`✓ تم إضافة الشريك "${created.name}" إلى سجل الشركاء`);
            return created;
          }}
          onUpdatePartner={(updated) => {
            onUpdatePartner?.(updated);
            notify(`✓ تم تحديث بيانات الشريك "${updated.name}" ومزامنة المعدات المرتبطة`);
          }}
          onDeletePartner={(id) => {
            onDeletePartner?.(id);
            notify('تم حذف الشريك من سجل الشركاء');
          }}
        />
      ) : activeTab === 'registry' && editingEquipment ? (
        <EquipmentForm
          editingEquipment={editingEquipment}
          setEditingEquipment={setEditingEquipment}
          isNewMode={isNewMode}
          activities={activities}
          equipmentTypes={equipmentTypes}
          equipmentProperties={equipmentProperties}
          specGroups={specGroups}
          categoryRecords={categoryRecords}
          categoryValidationError={formValidationError}
          onClearCategoryValidationError={() => setFormValidationError(null)}
          onNavigateToEquipmentProperties={onNavigateToEquipmentProperties}
          currentUser={currentUser}
          partners={partners}
          personProfiles={personProfiles}
          onOpenPartnersRegistry={() => {
            if (editingEquipment && onNavigateToPartnersPage) {
              onNavigateToPartnersPage(editingEquipment, isNewMode);
            }
          }}
          onEquipmentTypeChange={handleEquipmentTypeChange}
          equipmentUnitKinds={equipmentUnitKinds}
          manufacturers={manufacturers}
          manufacturerModels={manufacturerModels}
          onCreateEquipmentUnitKind={onCreateEquipmentUnitKind}
          onCreateManufacturer={onCreateManufacturer}
          onCreateManufacturerModel={onCreateManufacturerModel}
          onAddNewActivityFromForm={
            onAddNewActivityForEquipment && editingEquipment
              ? (presetCategoryPath) =>
                  onAddNewActivityForEquipment(editingEquipment, isNewMode, presetCategoryPath)
              : undefined
          }
          onSubmit={handleSaveEquipmentForm}
          onCancel={handleCancelForm}
        />
      ) : activeTab === 'registry' && viewMode === 'manage' ? (
        <CompanyEquipmentTable
          equipments={equipments}
          equipmentTypes={equipmentTypes}
          activities={activities}
          currentUser={currentUser}
          onEditEquipment={openEditEquipment}
          onDeleteEquipment={(eqId, eqName) => {
            onDeleteEquipment(eqId);
            notify(`تم حذف المعدة "${eqName}" وفك ارتباطها من سجل الشركة`);
          }}
          onInspectEquipment={(eq) => setInspectEquipment(eq)}
          onAddEquipment={() => openCreateEquipment()}
        />
      ) : activeTab === 'registry' ? (
        <EquipmentCardsRegistry
          equipments={equipments}
          myEquipments={myEquipments}
          visibleEquipments={visibleEquipments}
          equipmentTypes={equipmentTypes}
          activities={activities}
          currentUser={currentUser}
          scopeFilter={scopeFilter}
          setScopeFilter={setScopeFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onCreateEquipment={() => openCreateEquipment()}
          onEditEquipment={openEditEquipment}
          onDeleteEquipment={(eqId, eqName) => {
            onDeleteEquipment(eqId);
            notify(`تم حذف المعدة "${eqName}" وفك ارتباطها`);
          }}
          onChangeEquipmentStatus={(eqId, status, eqName) => {
            onChangeEquipmentStatus(eqId, status);
            notify(`تم تحديث حالة المعدة "${eqName}"`);
          }}
          onInspectEquipment={(eq) => setInspectEquipment(eq)}
          onOpenActivityInEditor={onOpenActivityInEditor}
        />
      ) : (
        <EquipmentTypesBuilder
          equipments={equipments}
          equipmentTypes={equipmentTypes}
          equipmentProperties={equipmentProperties}
          onSaveEquipmentTypes={onSaveEquipmentTypes}
          onNavigateToEquipmentProperties={onNavigateToEquipmentProperties}
          showNewTypeForm={showNewTypeForm}
          setShowNewTypeForm={setShowNewTypeForm}
          notify={notify}
        />
      )}

      {/* Client vs Owner Inspect Modal */}
      <EquipmentInspectModal
        equipment={inspectEquipment}
        onClose={() => setInspectEquipment(null)}
      />
    </div>
  );
};
