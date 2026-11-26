import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  Ban,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Edit3,
  Factory,
  FolderTree,
  Globe,
  Layers,
  Link2,
  ListChecks,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  Wrench,
  X
} from 'lucide-react';
import type {
  Activity,
  CategoryRecord,
  CustomTechnicalSpecItem,
  MetaFieldType
} from '../../types/activity';
import type { MasterAddonItem } from '../../types/addon';
import { MASTER_ADDON_CATEGORIES } from '../../types/addon';
import type { AppUser } from '../../types/auth';
import type {
  EquipmentItem,
  EquipmentPropertyItem,
  EquipmentTypeDefinition
} from '../../types/equipment';
import type {
  AssetCatalogScope,
  CityRecord,
  CountryRecord,
  EquipmentUnitKindItem,
  InclusionCatalogItem,
  InclusionKind,
  InheritanceResolution,
  ManufacturerModelRecord,
  ManufacturerRecord,
  MasterGroupScope,
  MeetingPointRecord,
  SpecGroupRecord
} from '../../types/masterReference';
import {
  LOGISTICS_CATEGORY_LABELS,
  type LogisticsVehicle
} from '../../types/logistics';
import type { CategoryNode } from '../activities/ActivityEditor';
import {
  LOGISTICS_CATEGORY_TO_UNIT_KIND_ID,
  evaluateCategoryInheritance,
  resolveCategoryAncestorChain,
  resolveCategoryCompatibility
} from '../../utils/masterReferenceResolver';
import { toggleCategoryLinkOnArrays } from '../../hooks/useMasterReferenceStore';
import { REAL_EQUIPMENT_CATEGORIES } from '../../db/localSpecsAndEquipmentDb';

export type UnifiedReferenceTab =
  | 'groups'
  | 'inclusions'
  | 'equipment'
  | 'addons'
  | 'manufacturers'
  | 'locations'
  | 'table';

interface UnifiedMasterReferenceHubProps {
  initialTab?: UnifiedReferenceTab;
  currentUser: AppUser;
  activities: Activity[];
  categoryTree: CategoryNode[];
  categoryRecords: CategoryRecord[];
  onCreateCategory: (payload: {
    id?: string;
    name: string;
    handle?: string;
    description?: string;
    parentId?: string | null;
    parentPath?: string[];
  }) => Promise<CategoryRecord>;
  onUpdateCategory: (
    id: string,
    updates: { name?: string; handle?: string; description?: string }
  ) => Promise<CategoryRecord>;
  onDeleteCategory: (id: string) => Promise<void>;
  specGroups: SpecGroupRecord[];
  onCreateSpecGroup: (input: {
    name: string;
    scope: MasterGroupScope;
    description?: string;
    linkedCategoryIds?: string[];
    linkedUnitKindIds?: string[];
  }) => SpecGroupRecord;
  onUpdateSpecGroup: (id: string, patch: Partial<SpecGroupRecord>) => void;
  onDeleteSpecGroup: (id: string) => void;
  customTechnicalSpecs: CustomTechnicalSpecItem[];
  onChangeCustomTechnicalSpecs: React.Dispatch<
    React.SetStateAction<CustomTechnicalSpecItem[]>
  >;
  equipmentProperties: EquipmentPropertyItem[];
  onChangeEquipmentProperties: (nextProps: EquipmentPropertyItem[]) => void;
  inclusionsCatalog: InclusionCatalogItem[];
  onCreateInclusionItem: (input: {
    label: string;
    kind: InclusionKind;
    linkedCategoryIds?: string[];
  }) => InclusionCatalogItem;
  onUpdateInclusionItem: (id: string, patch: Partial<InclusionCatalogItem>) => void;
  onDeleteInclusionItem: (id: string) => void;
  equipmentTypes: EquipmentTypeDefinition[];
  onSaveEquipmentTypes: (types: EquipmentTypeDefinition[]) => void;
  equipments: EquipmentItem[];
  logisticsVehicles?: LogisticsVehicle[];
  masterAddons: MasterAddonItem[];
  onCreateMasterAddon: (
    payload: Omit<
      MasterAddonItem,
      | 'id'
      | 'createdById'
      | 'createdByName'
      | 'createdByCompany'
      | 'createdAtTime'
      | 'updatedById'
      | 'updatedByName'
      | 'updatedByCompany'
      | 'updatedAtTime'
    >
  ) => MasterAddonItem;
  onUpdateMasterAddon: (id: string, patch: Partial<MasterAddonItem>) => void;
  onDeleteMasterAddon: (id: string) => void;
  equipmentUnitKinds?: EquipmentUnitKindItem[];
  onCreateEquipmentUnitKind?: (input: {
    name: string;
    domainScope?: AssetCatalogScope;
    defaultCategoryId?: string;
    defaultTypeId?: string;
    linkedCategoryIds?: string[];
    description?: string;
  }) => EquipmentUnitKindItem;
  onUpdateEquipmentUnitKind?: (id: string, patch: Partial<EquipmentUnitKindItem>) => void;
  onDeleteEquipmentUnitKind?: (id: string) => void;
  manufacturers?: ManufacturerRecord[];
  onCreateManufacturer?: (input: {
    name: string;
    applicableTo?: AssetCatalogScope;
    linkedUnitKindIds?: string[];
  }) => ManufacturerRecord;
  onUpdateManufacturer?: (id: string, patch: Partial<ManufacturerRecord>) => void;
  onDeleteManufacturer?: (id: string) => void;
  manufacturerModels?: ManufacturerModelRecord[];
  onCreateManufacturerModel?: (input: {
    manufacturerId: string;
    name: string;
    applicableTo?: AssetCatalogScope;
    unitKindId?: string;
  }) => ManufacturerModelRecord;
  onUpdateManufacturerModel?: (id: string, patch: Partial<ManufacturerModelRecord>) => void;
  onDeleteManufacturerModel?: (id: string) => void;
  countriesRef?: CountryRecord[];
  onCreateCountryRef?: (input: { name: string; code?: string }) => CountryRecord;
  onUpdateCountryRef?: (id: string, patch: Partial<CountryRecord>) => void;
  onDeleteCountryRef?: (id: string) => void;
  citiesRef?: CityRecord[];
  onCreateCityRef?: (input: { countryId: string; name: string }) => CityRecord;
  onUpdateCityRef?: (id: string, patch: Partial<CityRecord>) => void;
  onDeleteCityRef?: (id: string) => void;
  meetingPointsRef?: MeetingPointRecord[];
  onCreateMeetingPointRef?: (input: {
    countryId?: string;
    cityId: string;
    name: string;
    pointType?: 'meeting_point' | 'site' | 'both';
  }) => MeetingPointRecord;
  onUpdateMeetingPointRef?: (id: string, patch: Partial<MeetingPointRecord>) => void;
  onDeleteMeetingPointRef?: (id: string) => void;
  onResetAllMasterReference: () => Promise<void>;
}

const FIELD_TYPE_LABELS: Record<MetaFieldType, string> = {
  text: 'نص',
  number: 'رقم',
  boolean: 'نعم / لا',
  single_choice: 'اختيار من قائمة',
  multi_choice: 'اختيار متعدد'
};

const SCOPE_LABELS: Record<MasterGroupScope, string> = {
  activity_spec: 'مجموعة مواصفات النشاط',
  equipment_library: 'مجموعة خصائص المعدات المركزية'
};

interface TableRowItem {
  uid: string;
  entityType: 'spec_group' | 'custom_spec' | 'eq_prop' | 'inclusion' | 'eq_type' | 'addon';
  entityTypeLabel: string;
  id: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  linkedCount: number;
  inheritance: InheritanceResolution;
}

function InheritanceBadge({ res }: { res: InheritanceResolution }) {
  if (res.status === 'direct') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
        <Check className="w-3 h-3" />
        <span>مرتبط مباشرة</span>
      </span>
    );
  }
  if (res.status === 'inherited') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
        <Link2 className="w-3 h-3" />
        <span>موروث من: {res.sourceCategoryName}</span>
      </span>
    );
  }
  if (res.status === 'excluded') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/70 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
        <Ban className="w-3 h-3" />
        <span>مستثنى لهذا الفرع</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[10px]">
      غير مرتبط بهذه الفئة
    </span>
  );
}

export const UnifiedMasterReferenceHub: React.FC<UnifiedMasterReferenceHubProps> = ({
  initialTab = 'groups',
  categoryTree,
  categoryRecords,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  specGroups,
  onCreateSpecGroup,
  onUpdateSpecGroup,
  onDeleteSpecGroup,
  customTechnicalSpecs,
  onChangeCustomTechnicalSpecs,
  equipmentProperties,
  onChangeEquipmentProperties,
  inclusionsCatalog,
  onCreateInclusionItem,
  onUpdateInclusionItem,
  onDeleteInclusionItem,
  equipmentTypes,
  onSaveEquipmentTypes,
  equipments,
  logisticsVehicles = [],
  masterAddons,
  onCreateMasterAddon,
  onUpdateMasterAddon,
  onDeleteMasterAddon,
  equipmentUnitKinds = [],
  onCreateEquipmentUnitKind,
  onUpdateEquipmentUnitKind,
  onDeleteEquipmentUnitKind,
  manufacturers = [],
  onCreateManufacturer,
  onUpdateManufacturer,
  onDeleteManufacturer,
  manufacturerModels = [],
  onCreateManufacturerModel,
  onUpdateManufacturerModel,
  onDeleteManufacturerModel,
  countriesRef = [],
  onCreateCountryRef,
  onUpdateCountryRef,
  onDeleteCountryRef,
  citiesRef = [],
  onCreateCityRef,
  onUpdateCityRef,
  onDeleteCityRef,
  meetingPointsRef = [],
  onCreateMeetingPointRef,
  onUpdateMeetingPointRef,
  onDeleteMeetingPointRef,
  onResetAllMasterReference
}) => {
  const [activeTab, setActiveTab] = useState<UnifiedReferenceTab>(initialTab);
  // Cascading Level Blocks path (array of selected CategoryRecord IDs from L1 -> Ln).
  // Starts empty so Level 1 block shows first, and each deeper block reveals automatically upon selection.
  const [selectedIdPath, setSelectedIdPath] = useState<string[]>([]);
  const [catSearchQuery, setCatSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showInlineResetConfirm, setShowInlineResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Inline Category CRUD state inside blocks (Zero Popups Rule)
  const [inlineAddBlockLevel, setInlineAddBlockLevel] = useState<number | null>(null);
  const [inlineAddName, setInlineAddName] = useState('');
  const [inlineAddDesc, setInlineAddDesc] = useState('');
  const [inlineEditBlockLevel, setInlineEditBlockLevel] = useState<number | null>(null);
  const [inlineEditName, setInlineEditName] = useState('');
  const [inlineEditDesc, setInlineEditDesc] = useState('');
  const [inlineDeleteBlockLevel, setInlineDeleteBlockLevel] = useState<number | null>(null);
  const [catFormError, setCatFormError] = useState<string | null>(null);

  // Spec Group state
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SpecGroupRecord | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupScopeInput, setGroupScopeInput] = useState<MasterGroupScope>('activity_spec');
  const [groupDescInput, setGroupDescInput] = useState('');
  const [groupUnitKindIdsInput, setGroupUnitKindIdsInput] = useState<string[]>([]);

  // Property inside group form state
  const [showPropFormForGroupId, setShowPropFormForGroupId] = useState<string | null>(null);
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [propLabelInput, setPropLabelInput] = useState('');
  const [propTypeInput, setPropTypeInput] = useState<MetaFieldType>('text');
  const [propUnitInput, setPropUnitInput] = useState('');
  const [propOptionsInput, setPropOptionsInput] = useState('');
  const [propDefaultInput, setPropDefaultInput] = useState('');
  const [propIsRequired, setPropIsRequired] = useState(true);
  const [propIsPublic, setPropIsPublic] = useState(true);
  const [propUnitKindIdsInput, setPropUnitKindIdsInput] = useState<string[]>([]);

  // Inclusion form state
  const [newIncLabel, setNewIncLabel] = useState('');
  const [newIncKind, setNewIncKind] = useState<InclusionKind>('included');
  const [editingIncId, setEditingIncId] = useState<string | null>(null);
  const [editingIncLabel, setEditingIncLabel] = useState('');

  // Equipment & Logistics Category Compatibility Tab state
  const [showAddEqUnitKind, setShowAddEqUnitKind] = useState(false);
  const [newEqUnitKindInput, setNewEqUnitKindInput] = useState('');
  const [showAddLogUnitKind, setShowAddLogUnitKind] = useState(false);
  const [newLogUnitKindInput, setNewLogUnitKindInput] = useState('');
  const [showLegacyEqTypes, setShowLegacyEqTypes] = useState(false);

  // Equipment Type form state
  const [showEqTypeForm, setShowEqTypeForm] = useState(false);
  const [eqTypeNameInput, setEqTypeNameInput] = useState('');
  const [eqTypeDescInput, setEqTypeDescInput] = useState('');

  // Addon form state
  const [showAddonForm, setShowAddonForm] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [addonTitle, setAddonTitle] = useState('');
  const [addonCategory, setAddonCategory] = useState<string>(MASTER_ADDON_CATEGORIES[0]);
  const [addonUnit, setAddonUnit] = useState('للفرد');
  const [addonPriceEGP, setAddonPriceEGP] = useState('350');
  const [addonPriceEUR, setAddonPriceEUR] = useState('12');
  const [addonDesc, setAddonDesc] = useState('');

  // Master Table tab filters, sorting, multi-select
  const [tableSearch, setTableSearch] = useState('');
  const [tableDomainFilter, setTableDomainFilter] = useState<string>('all');
  const [tableLinkFilter, setTableLinkFilter] = useState<string>('all');
  const [tableSortBy, setTableSortBy] = useState<'title' | 'type' | 'linked'>('type');
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedTableUids, setSelectedTableUids] = useState<string[]>([]);

  // Manufacturers / Models / Unit Kinds tab state
  const [catalogDomain, setCatalogDomain] = useState<'equipment' | 'logistics'>('equipment');
  const [selectedUnitKindId, setSelectedUnitKindId] = useState<string | null>(null);
  const [selectedMfgId, setSelectedMfgId] = useState<string | null>(null);
  const [linkExistingMfgId, setLinkExistingMfgId] = useState('');
  const [newUnitKindName, setNewUnitKindName] = useState('');
  const [editingUnitKindId, setEditingUnitKindId] = useState<string | null>(null);
  const [editingUnitKindName, setEditingUnitKindName] = useState('');
  const [newMfgName, setNewMfgName] = useState('');
  const [newMfgScope, setNewMfgScope] = useState<AssetCatalogScope>('equipment');
  const [editingMfgId, setEditingMfgId] = useState<string | null>(null);
  const [editingMfgName, setEditingMfgName] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editingModelName, setEditingModelName] = useState('');

  // Countries / Cities / Meeting Points tab state
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [newCountryName, setNewCountryName] = useState('');
  const [editingCountryId, setEditingCountryId] = useState<string | null>(null);
  const [editingCountryName, setEditingCountryName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCityName, setEditingCityName] = useState('');
  const [newMeetingPointName, setNewMeetingPointName] = useState('');
  const [editingMeetingPointId, setEditingMeetingPointId] = useState<string | null>(null);
  const [editingMeetingPointName, setEditingMeetingPointName] = useState('');

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Clean any deleted IDs from selectedIdPath and derive the active deepest category
  const validSelectedIdPath = useMemo(() => {
    const validIds = new Set(categoryRecords.map((r) => r.id));
    const cleaned: string[] = [];
    for (const id of selectedIdPath) {
      if (!validIds.has(id)) break;
      cleaned.push(id);
    }
    return cleaned;
  }, [selectedIdPath, categoryRecords]);

  const effectiveSelectedCategory = useMemo(() => {
    const deepestId =
      validSelectedIdPath.length > 0
        ? validSelectedIdPath[validSelectedIdPath.length - 1]
        : null;
    return deepestId ? categoryRecords.find((r) => r.id === deepestId) || null : null;
  }, [categoryRecords, validSelectedIdPath]);

  const activeCategoryId = effectiveSelectedCategory?.id || null;

  const ancestorChain = useMemo(
    () => resolveCategoryAncestorChain(activeCategoryId, categoryRecords),
    [activeCategoryId, categoryRecords]
  );

  const compatibilitySnapshot = useMemo(
    () =>
      resolveCategoryCompatibility({
        categoryPath: ancestorChain.slice().reverse().map((c) => c.name),
        categoryRecords,
        specGroups,
        customTechnicalSpecs,
        equipmentProperties,
        inclusionsCatalog,
        equipmentTypes,
        equipmentUnitKinds,
        equipments,
        logisticsVehicles,
        masterAddons,
        selectedCategoryIdOverride: activeCategoryId
      }),
    [
      ancestorChain,
      categoryRecords,
      specGroups,
      customTechnicalSpecs,
      equipmentProperties,
      inclusionsCatalog,
      equipmentTypes,
      equipmentUnitKinds,
      equipments,
      logisticsVehicles,
      masterAddons,
      activeCategoryId
    ]
  );

  const equipmentOnlyUnitKinds = useMemo(
    () =>
      equipmentUnitKinds.filter(
        (uk) => uk.isActive && (uk.domainScope === 'equipment' || uk.domainScope === 'both')
      ),
    [equipmentUnitKinds]
  );

  const logisticsOnlyUnitKinds = useMemo(
    () =>
      equipmentUnitKinds.filter(
        (uk) => uk.isActive && (uk.domainScope === 'logistics' || uk.domainScope === 'both')
      ),
    [equipmentUnitKinds]
  );

  const unitKindNameById = useMemo(
    () => new Map(equipmentUnitKinds.map((uk) => [uk.id, uk.name])),
    [equipmentUnitKinds]
  );

  const getInheritance = (item: {
    linkedCategoryIds?: string[];
    excludedCategoryIds?: string[];
  }): InheritanceResolution =>
    evaluateCategoryInheritance(item, activeCategoryId, ancestorChain);

  // =========================================================================
  // Cascading Blocks Helpers & Inline CRUD Handlers (Zero Popups)
  // =========================================================================
  const visibleBlockLevels = validSelectedIdPath.length + 1;

  const getLevelMeta = (levelIdx: number) => {
    switch (levelIdx) {
      case 0:
        return { title: 'المستوى 1: التصنيف الأساسي', placeholder: '-- اختر التصنيف الأساسي --' };
      case 1:
        return { title: 'المستوى 2: التصنيف الفرعي', placeholder: '-- اختر المستوى الثاني --' };
      case 2:
        return { title: 'المستوى 3: النوع المتخصص', placeholder: '-- اختر المستوى الثالث --' };
      case 3:
        return { title: 'المستوى 4: الفئة الدقيقة', placeholder: '-- اختر المستوى الرابع --' };
      default:
        return {
          title: `المستوى ${levelIdx + 1}: التصنيف الفرعي ${levelIdx + 1}`,
          placeholder: `-- اختر المستوى ${levelIdx + 1} --`
        };
    }
  };

  const getNodesAtBlockLevel = (levelIdx: number): CategoryNode[] => {
    if (levelIdx === 0) return categoryTree;
    let currentNodes: CategoryNode[] = categoryTree;
    for (let i = 0; i < levelIdx; i += 1) {
      const selectedId = validSelectedIdPath[i];
      if (!selectedId) return [];
      const match = currentNodes.find((n) => n.id === selectedId);
      if (!match) return [];
      currentNodes = match.children || [];
    }
    return currentNodes;
  };

  const quickSearchMatches = useMemo(() => {
    const q = catSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return categoryRecords
      .filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
      .slice(0, 8);
  }, [catSearchQuery, categoryRecords]);

  const handleJumpToSearchedCategory = (catId: string) => {
    const chain = resolveCategoryAncestorChain(catId, categoryRecords);
    const idPath = chain.slice().reverse().map((c) => c.id);
    setSelectedIdPath(idPath);
    setCatSearchQuery('');
    setInlineAddBlockLevel(null);
    setInlineEditBlockLevel(null);
    setInlineDeleteBlockLevel(null);
    setCatFormError(null);
  };

  const handleInlineAddCategory = async (levelIdx: number) => {
    if (!inlineAddName.trim()) {
      setCatFormError('اسم الفئة مطلوب');
      return;
    }
    const parentId = levelIdx === 0 ? null : validSelectedIdPath[levelIdx - 1] ?? null;
    try {
      const created = await onCreateCategory({
        name: inlineAddName.trim(),
        description: inlineAddDesc.trim(),
        parentId
      });
      setSelectedIdPath((prev) => [...prev.slice(0, levelIdx), created.id]);
      setInlineAddBlockLevel(null);
      setInlineAddName('');
      setInlineAddDesc('');
      setCatFormError(null);
      notify(`✓ تمت إضافة الفئة «${created.name}» بنجاح وفتح مستواها التالي`);
    } catch (err) {
      setCatFormError(err instanceof Error ? err.message : 'تعذر حفظ الفئة');
    }
  };

  const handleInlineEditCategory = async (targetId: string) => {
    if (!inlineEditName.trim()) {
      setCatFormError('اسم الفئة مطلوب');
      return;
    }
    try {
      const updated = await onUpdateCategory(targetId, {
        name: inlineEditName.trim(),
        description: inlineEditDesc.trim()
      });
      setInlineEditBlockLevel(null);
      setCatFormError(null);
      notify(`✓ تم تحديث الفئة «${updated.name}»`);
    } catch (err) {
      setCatFormError(err instanceof Error ? err.message : 'تعذر تحديث الفئة');
    }
  };

  const handleInlineDeleteCategory = async (rec: CategoryRecord, levelIdx: number) => {
    try {
      await onDeleteCategory(rec.id);
      setSelectedIdPath((prev) => prev.slice(0, levelIdx));
      setInlineDeleteBlockLevel(null);
      setCatFormError(null);
      notify(`تم حذف الفئة «${rec.name}»`);
    } catch (err) {
      setInlineDeleteBlockLevel(null);
      notify(`⚠️ ${err instanceof Error ? err.message : 'تعذر حذف الفئة'}`);
    }
  };

  // =========================================================================
  // Category Link / Exclude Toggle Handlers
  // =========================================================================
  const toggleGroupLink = (grp: SpecGroupRecord, mode: 'link' | 'exclude' | 'clear') => {
    if (!activeCategoryId) return;
    const next = toggleCategoryLinkOnArrays(
      grp.linkedCategoryIds,
      grp.excludedCategoryIds,
      activeCategoryId,
      mode
    );
    onUpdateSpecGroup(grp.id, next);
  };

  const toggleCustomSpecLink = (
    spec: CustomTechnicalSpecItem,
    mode: 'link' | 'exclude' | 'clear'
  ) => {
    if (!activeCategoryId) return;
    const next = toggleCategoryLinkOnArrays(
      spec.linkedCategoryIds,
      spec.excludedCategoryIds,
      activeCategoryId,
      mode
    );
    onChangeCustomTechnicalSpecs((prev) =>
      prev.map((s) => (s.id === spec.id ? { ...s, ...next } : s))
    );
  };

  const toggleEqPropLink = (
    prop: EquipmentPropertyItem,
    mode: 'link' | 'exclude' | 'clear'
  ) => {
    if (!activeCategoryId) return;
    const next = toggleCategoryLinkOnArrays(
      prop.linkedCategoryIds,
      prop.excludedCategoryIds,
      activeCategoryId,
      mode
    );
    onChangeEquipmentProperties(
      equipmentProperties.map((p) => (p.id === prop.id ? { ...p, ...next } : p))
    );
  };

  const toggleInclusionLink = (
    inc: InclusionCatalogItem,
    mode: 'link' | 'exclude' | 'clear'
  ) => {
    if (!activeCategoryId) return;
    const next = toggleCategoryLinkOnArrays(
      inc.linkedCategoryIds,
      inc.excludedCategoryIds,
      activeCategoryId,
      mode
    );
    onUpdateInclusionItem(inc.id, next);
  };

  const toggleEqTypeLink = (
    eqType: EquipmentTypeDefinition,
    mode: 'link' | 'exclude' | 'clear'
  ) => {
    if (!activeCategoryId) return;
    const next = toggleCategoryLinkOnArrays(
      eqType.linkedCategoryIds,
      eqType.excludedCategoryIds,
      activeCategoryId,
      mode
    );
    onSaveEquipmentTypes(
      equipmentTypes.map((t) => (t.id === eqType.id ? { ...t, ...next } : t))
    );
  };

  const toggleUnitKindCategoryLink = (
    uk: EquipmentUnitKindItem,
    mode: 'link' | 'exclude' | 'clear'
  ) => {
    if (!activeCategoryId || !onUpdateEquipmentUnitKind) return;
    const next = toggleCategoryLinkOnArrays(
      uk.linkedCategoryIds,
      uk.excludedCategoryIds,
      activeCategoryId,
      mode
    );
    onUpdateEquipmentUnitKind(uk.id, next);
  };

  const toggleSpecGroupUnitKind = (grp: SpecGroupRecord, ukId: string) => {
    const curr = new Set(grp.linkedUnitKindIds ?? []);
    if (curr.has(ukId)) {
      curr.delete(ukId);
    } else {
      curr.add(ukId);
    }
    onUpdateSpecGroup(grp.id, { linkedUnitKindIds: Array.from(curr) });
  };

  const toggleEqPropUnitKind = (prop: EquipmentPropertyItem, ukId: string) => {
    const curr = new Set(prop.linkedUnitKindIds ?? []);
    if (curr.has(ukId)) {
      curr.delete(ukId);
    } else {
      curr.add(ukId);
    }
    onChangeEquipmentProperties(
      equipmentProperties.map((p) =>
        p.id === prop.id ? { ...p, linkedUnitKindIds: Array.from(curr) } : p
      )
    );
  };

  const toggleAddonLink = (
    addon: MasterAddonItem,
    mode: 'link' | 'exclude' | 'clear'
  ) => {
    if (!activeCategoryId) return;
    const next = toggleCategoryLinkOnArrays(
      addon.linkedCategoryIds,
      addon.excludedCategoryIds,
      activeCategoryId,
      mode
    );
    onUpdateMasterAddon(addon.id, next);
  };

  // =========================================================================
  // Group & Property CRUD handlers
  // =========================================================================
  const handleSaveGroupForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameInput.trim()) return;
    const resolvedUnitKinds =
      groupScopeInput === 'equipment_library' ? groupUnitKindIdsInput : [];
    if (editingGroup) {
      onUpdateSpecGroup(editingGroup.id, {
        name: groupNameInput.trim(),
        scope: groupScopeInput,
        description: groupDescInput.trim(),
        linkedUnitKindIds: resolvedUnitKinds
      });
      if (editingGroup.scope === 'activity_spec') {
        onChangeCustomTechnicalSpecs((prev) =>
          prev.map((s) =>
            s.groupId === editingGroup.id ? { ...s, groupTitle: groupNameInput.trim() } : s
          )
        );
      }
      notify(`✓ تم تعديل مجموعة «${groupNameInput.trim()}»`);
    } else {
      const created = onCreateSpecGroup({
        name: groupNameInput.trim(),
        scope: groupScopeInput,
        description: groupDescInput.trim(),
        linkedCategoryIds: activeCategoryId ? [activeCategoryId] : [],
        linkedUnitKindIds: resolvedUnitKinds
      });
      setSelectedGroupId(created.id);
      notify(`✓ تمت إضافة مجموعة «${created.name}» وربطها بالفئة المختارة`);
    }
    setShowGroupForm(false);
    setEditingGroup(null);
    setGroupNameInput('');
    setGroupDescInput('');
    setGroupUnitKindIdsInput([]);
  };

  const openPropForm = (
    groupId: string,
    existingSpec?: CustomTechnicalSpecItem,
    existingEqProp?: EquipmentPropertyItem
  ) => {
    setShowPropFormForGroupId(groupId);
    const parentGrp = specGroups.find((g) => g.id === groupId);
    if (existingSpec) {
      setEditingPropId(existingSpec.id);
      setPropLabelInput(existingSpec.label);
      setPropTypeInput(existingSpec.type);
      setPropUnitInput(existingSpec.unit || '');
      setPropOptionsInput((existingSpec.options || []).join('، '));
      setPropDefaultInput(String(existingSpec.defaultValue ?? ''));
      setPropIsRequired(existingSpec.isRequired);
      setPropIsPublic(existingSpec.isPublicForClient);
      setPropUnitKindIdsInput([]);
    } else if (existingEqProp) {
      setEditingPropId(existingEqProp.id);
      setPropLabelInput(existingEqProp.label);
      setPropTypeInput(existingEqProp.type);
      setPropUnitInput(existingEqProp.unit || '');
      setPropOptionsInput((existingEqProp.options || []).join('، '));
      setPropDefaultInput('');
      setPropIsRequired(existingEqProp.isMandatoryDefault);
      setPropIsPublic(existingEqProp.isPublicDefault);
      setPropUnitKindIdsInput(existingEqProp.linkedUnitKindIds ?? parentGrp?.linkedUnitKindIds ?? []);
    } else {
      setEditingPropId(null);
      setPropLabelInput('');
      setPropTypeInput('text');
      setPropUnitInput('');
      setPropOptionsInput('');
      setPropDefaultInput('');
      setPropIsRequired(true);
      setPropIsPublic(true);
      setPropUnitKindIdsInput(parentGrp?.linkedUnitKindIds ?? []);
    }
  };

  const handleSavePropertyInGroup = (grp: SpecGroupRecord) => {
    if (!propLabelInput.trim()) return;
    const parsedOptions =
      propTypeInput === 'single_choice' || propTypeInput === 'multi_choice'
        ? propOptionsInput
            .split(/[,،]+/)
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;

    if (grp.scope === 'activity_spec') {
      const parsedDefault =
        propTypeInput === 'boolean'
          ? propDefaultInput === 'true' || propDefaultInput === 'نعم'
          : propTypeInput === 'number'
          ? parseFloat(propDefaultInput) || 0
          : propDefaultInput || (parsedOptions?.[0] ?? '');

      if (editingPropId) {
        onChangeCustomTechnicalSpecs((prev) =>
          prev.map((s) =>
            s.id === editingPropId
              ? {
                  ...s,
                  label: propLabelInput.trim(),
                  type: propTypeInput,
                  unit: propUnitInput.trim() || undefined,
                  options: parsedOptions,
                  defaultValue: parsedDefault,
                  isRequired: propIsRequired,
                  isPublicForClient: propIsPublic
                }
              : s
          )
        );
        notify(`✓ تم تعديل الخاصية «${propLabelInput.trim()}»`);
      } else {
        const newSpec: CustomTechnicalSpecItem = {
          id: `cspec-${Date.now().toString(36)}`,
          groupId: grp.id,
          groupTitle: grp.name,
          label: propLabelInput.trim(),
          type: propTypeInput,
          unit: propUnitInput.trim() || undefined,
          defaultValue: parsedDefault,
          options: parsedOptions,
          isPublicForClient: propIsPublic,
          isRequired: propIsRequired,
          isActive: true,
          order: customTechnicalSpecs.length + 1,
          linkedCategoryIds:
            grp.linkedCategoryIds.length > 0
              ? [...grp.linkedCategoryIds]
              : activeCategoryId
              ? [activeCategoryId]
              : [],
          excludedCategoryIds: []
        };
        onChangeCustomTechnicalSpecs((prev) => [...prev, newSpec]);
        notify(`✓ تمت إضافة الخاصية «${newSpec.label}» داخل مجموعة «${grp.name}»`);
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (editingPropId) {
        onChangeEquipmentProperties(
          equipmentProperties.map((p) =>
            p.id === editingPropId
              ? {
                  ...p,
                  label: propLabelInput.trim(),
                  type: propTypeInput,
                  unit: propUnitInput.trim() || undefined,
                  options: parsedOptions,
                  isMandatoryDefault: propIsRequired,
                  isPublicDefault: propIsPublic,
                  linkedUnitKindIds: propUnitKindIdsInput,
                  updatedAt: today
                }
              : p
          )
        );
        notify(`✓ تم تعديل خاصية المعدات «${propLabelInput.trim()}»`);
      } else {
        const defaultCatKey = REAL_EQUIPMENT_CATEGORIES[0]?.id || 'yacht';
        const keySlug = `prop_${Date.now().toString(36)}`;
        const createdProp: EquipmentPropertyItem = {
          id: `eqp-${Date.now().toString(36)}`,
          groupId: grp.id,
          category: defaultCatKey,
          key: keySlug,
          label: propLabelInput.trim(),
          type: propTypeInput,
          unit: propUnitInput.trim() || undefined,
          options: parsedOptions,
          isMandatoryDefault: propIsRequired,
          isPublicDefault: propIsPublic,
          description: `خاصية ضمن ${grp.name}`,
          linkedCategoryIds:
            grp.linkedCategoryIds.length > 0
              ? [...grp.linkedCategoryIds]
              : activeCategoryId
              ? [activeCategoryId]
              : [],
          excludedCategoryIds: [],
          linkedUnitKindIds: propUnitKindIdsInput,
          createdAt: today,
          updatedAt: today
        };
        onChangeEquipmentProperties([...equipmentProperties, createdProp]);
        notify(`✓ تمت إضافة خاصية المعدات «${createdProp.label}»`);
      }
    }

    setShowPropFormForGroupId(null);
    setEditingPropId(null);
  };

  // =========================================================================
  // Master Table Rows (All items across unified reference for Standing Rule 1)
  // =========================================================================
  const allTableRows = useMemo<TableRowItem[]>(() => {
    const rows: TableRowItem[] = [];

    specGroups.forEach((g) => {
      rows.push({
        uid: `spec_group:${g.id}`,
        entityType: 'spec_group',
        entityTypeLabel: SCOPE_LABELS[g.scope],
        id: g.id,
        title: g.name,
        subtitle: g.description || 'مجموعة مواصفات رئيسية',
        isActive: g.isActive,
        linkedCount: g.linkedCategoryIds.length,
        inheritance: getInheritance(g)
      });
    });

    customTechnicalSpecs.forEach((s) => {
      rows.push({
        uid: `custom_spec:${s.id}`,
        entityType: 'custom_spec',
        entityTypeLabel: 'خاصية نشاط',
        id: s.id,
        title: s.label,
        subtitle: `${s.groupTitle} · ${FIELD_TYPE_LABELS[s.type]}`,
        isActive: s.isActive,
        linkedCount: (s.linkedCategoryIds || []).length,
        inheritance: getInheritance(s)
      });
    });

    equipmentProperties.forEach((p) => {
      rows.push({
        uid: `eq_prop:${p.id}`,
        entityType: 'eq_prop',
        entityTypeLabel: 'خاصية معدات',
        id: p.id,
        title: p.label,
        subtitle: `${FIELD_TYPE_LABELS[p.type]}${p.unit ? ` (${p.unit})` : ''}`,
        isActive: true,
        linkedCount: (p.linkedCategoryIds || []).length,
        inheritance: getInheritance(p)
      });
    });

    inclusionsCatalog.forEach((inc) => {
      rows.push({
        uid: `inclusion:${inc.id}`,
        entityType: 'inclusion',
        entityTypeLabel: inc.kind === 'included' ? 'ما يشمله' : 'ما لا يشمله',
        id: inc.id,
        title: inc.label,
        subtitle: inc.kind === 'included' ? 'مشمول مجاناً' : 'غير مشمول / برسوم',
        isActive: inc.isActive,
        linkedCount: inc.linkedCategoryIds.length,
        inheritance: getInheritance(inc)
      });
    });

    equipmentTypes.forEach((eqType) => {
      rows.push({
        uid: `eq_type:${eqType.id}`,
        entityType: 'eq_type',
        entityTypeLabel: 'نوع / قالب معدات',
        id: eqType.id,
        title: eqType.name,
        subtitle: eqType.description || 'قالب معدات متوافق',
        isActive: true,
        linkedCount: (eqType.linkedCategoryIds || []).length,
        inheritance: getInheritance(eqType)
      });
    });

    masterAddons.forEach((addon) => {
      rows.push({
        uid: `addon:${addon.id}`,
        entityType: 'addon',
        entityTypeLabel: 'إضافة مدفوعة',
        id: addon.id,
        title: addon.title,
        subtitle: `${addon.category} · ${addon.suggestedPriceEGP} ج.م / €${addon.suggestedPriceEUR}`,
        isActive: addon.isActive,
        linkedCount: (addon.linkedCategoryIds || []).length,
        inheritance: getInheritance(addon)
      });
    });

    return rows;
  }, [
    specGroups,
    customTechnicalSpecs,
    equipmentProperties,
    inclusionsCatalog,
    equipmentTypes,
    masterAddons,
    activeCategoryId,
    ancestorChain
  ]);

  const filteredSortedTableRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    const list = allTableRows.filter((row) => {
      if (tableDomainFilter !== 'all' && row.entityType !== tableDomainFilter) return false;
      if (tableLinkFilter === 'compatible') {
        if (row.inheritance.status !== 'direct' && row.inheritance.status !== 'inherited') {
          return false;
        }
      } else if (tableLinkFilter !== 'all' && row.inheritance.status !== tableLinkFilter) {
        return false;
      }
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        row.subtitle.toLowerCase().includes(q) ||
        row.entityTypeLabel.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (tableSortBy === 'title') cmp = a.title.localeCompare(b.title, 'ar');
      else if (tableSortBy === 'type') cmp = a.entityTypeLabel.localeCompare(b.entityTypeLabel, 'ar');
      else cmp = a.linkedCount - b.linkedCount;
      return tableSortDir === 'asc' ? cmp : -cmp;
    });
  }, [allTableRows, tableSearch, tableDomainFilter, tableLinkFilter, tableSortBy, tableSortDir]);

  const handleBulkLinkAction = (mode: 'link' | 'exclude' | 'clear') => {
    if (!activeCategoryId || selectedTableUids.length === 0) return;
    selectedTableUids.forEach((uid) => {
      const [type, id] = uid.split(':');
      if (type === 'spec_group') {
        const g = specGroups.find((x) => x.id === id);
        if (g) toggleGroupLink(g, mode);
      } else if (type === 'custom_spec') {
        const s = customTechnicalSpecs.find((x) => x.id === id);
        if (s) toggleCustomSpecLink(s, mode);
      } else if (type === 'eq_prop') {
        const p = equipmentProperties.find((x) => x.id === id);
        if (p) toggleEqPropLink(p, mode);
      } else if (type === 'inclusion') {
        const inc = inclusionsCatalog.find((x) => x.id === id);
        if (inc) toggleInclusionLink(inc, mode);
      } else if (type === 'eq_type') {
        const eqT = equipmentTypes.find((x) => x.id === id);
        if (eqT) toggleEqTypeLink(eqT, mode);
      } else if (type === 'addon') {
        const a = masterAddons.find((x) => x.id === id);
        if (a) toggleAddonLink(a, mode);
      }
    });
    const label =
      mode === 'link' ? 'ربط' : mode === 'exclude' ? 'استثناء' : 'فك ربط';
    notify(`✓ تم ${label} ${selectedTableUids.length} عنصر بالفئة الحالية`);
    setSelectedTableUids([]);
  };

  return (
    <div className="space-y-5">
      {/* Top Unified Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
              <FolderTree className="w-4 h-4" />
              <span>المرجع المركزي الموحد للبيانات والعلاقات</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              المرجع الموحد — الفئات · المجموعات · الخصائص · المشمولات · المعدات · الإضافات
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              شاشة واحدة بدون نوافذ منبثقة: ابنِ شجرة الفئات عبر البلوكات المتتالية أدناه، ثم اربط المجموعات والخصائص والمشمولات والمعدات والإضافات مباشرة في نفس النموذج.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowInlineResetConfirm((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-500/50 text-xs font-bold text-slate-300 hover:text-rose-300 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة تهيئة المرجع النظيف (4 ركائز)</span>
          </button>
        </div>

        {/* Inline Reset Confirmation Bar (Zero Popups) */}
        {showInlineResetConfirm && (
          <div className="bg-amber-950/35 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-300">
                  تأكيد إعادة تهيئة المرجع الموحد (الركائز الأربعة)
                </div>
                <p className="text-slate-300 mt-0.5">
                  سيتم استعادة شجرة الفئات الأربعة الرئيسية وجميع المجموعات والخصائص والمشمولات وأنواع المعدات والإضافات المترابطة إلى وضع البداية النظيف.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowInlineResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    await onResetAllMasterReference();
                    setSelectedIdPath([]);
                    notify('✓ تمت إعادة تهيئة المرجع الموحد بالكامل بنجاح');
                    setShowInlineResetConfirm(false);
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
              >
                {isResetting ? 'جاري التهيئة...' : 'تأكيد إعادة التهيئة'}
              </button>
            </div>
          </div>
        )}
      </div>

      {toastMsg && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between animate-fade-in ${
            toastMsg.startsWith('⚠️')
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/* Cascading Multi-Level Category Blocks (البلوكات الشجرية المتتالية)  */}
      {/* ================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-cyan-400" />
              <span>التصنيف متعدد المستويات — البلوكات الشجرية المتتالية</span>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                {categoryRecords.length} فئة
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              يبدأ الاختيار ببلوك المستوى الأول، وعند تحديد أو إضافة أي تصنيف يظهر بلوك المستوى التالي تلقائياً في نفس النموذج دون أي نوافذ منبثقة.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={catSearchQuery}
              onChange={(e) => setCatSearchQuery(e.target.value)}
              placeholder="بحث سريع والانتقال للفئة في البلوكات..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {quickSearchMatches.length > 0 && (
              <div className="mt-1 bg-slate-950 border border-cyan-500/40 rounded-xl p-1.5 space-y-1 shadow-xl">
                {quickSearchMatches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleJumpToSearchedCategory(m.id)}
                    className="w-full text-right px-2.5 py-1.5 rounded-lg hover:bg-cyan-950/50 text-xs text-slate-200 hover:text-white flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="font-semibold truncate">{m.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 shrink-0">L{m.level}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Cascading Level Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
          {Array.from({ length: visibleBlockLevels }, (_, levelIdx) => {
            const children = getNodesAtBlockLevel(levelIdx);
            const meta = getLevelMeta(levelIdx);
            const selectedIdAtLevel = validSelectedIdPath[levelIdx] || '';
            const selectedRecAtLevel = selectedIdAtLevel
              ? categoryRecords.find((r) => r.id === selectedIdAtLevel) || null
              : null;
            const parentRecAtLevel =
              levelIdx > 0
                ? categoryRecords.find((r) => r.id === validSelectedIdPath[levelIdx - 1]) || null
                : null;
            const isAddingHere = inlineAddBlockLevel === levelIdx;
            const isEditingHere = inlineEditBlockLevel === levelIdx && Boolean(selectedRecAtLevel);
            const isDeletingHere = inlineDeleteBlockLevel === levelIdx && Boolean(selectedRecAtLevel);

            return (
              <div
                key={`block-lvl-${levelIdx}`}
                className={`bg-slate-950 border rounded-xl p-3.5 flex flex-col justify-between space-y-2.5 transition-all ${
                  selectedIdAtLevel ? 'border-cyan-500/50 shadow-sm' : 'border-slate-800'
                }`}
              >
                {/* Block Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs gap-1">
                    <span className="font-bold text-slate-200">{meta.title}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {children.length} خيارات
                    </span>
                  </div>

                  {/* Level Dropdown Selector */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedIdAtLevel}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedIdPath((prev) =>
                          val ? [...prev.slice(0, levelIdx), val] : prev.slice(0, levelIdx)
                        );
                        setInlineAddBlockLevel(null);
                        setInlineEditBlockLevel(null);
                        setInlineDeleteBlockLevel(null);
                        setCatFormError(null);
                      }}
                      className="flex-1 min-w-0 bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">
                        {children.length === 0 ? '-- لا توجد تصنيفات فرعية بعد --' : meta.placeholder}
                      </option>
                      {children.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>

                    {selectedRecAtLevel && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setInlineEditBlockLevel(isEditingHere ? null : levelIdx);
                            setInlineEditName(selectedRecAtLevel.name);
                            setInlineEditDesc(selectedRecAtLevel.description || '');
                            setInlineAddBlockLevel(null);
                            setInlineDeleteBlockLevel(null);
                            setCatFormError(null);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 cursor-pointer"
                          title="تعديل هذه الفئة داخل البلوك"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInlineDeleteBlockLevel(isDeletingHere ? null : levelIdx);
                            setInlineAddBlockLevel(null);
                            setInlineEditBlockLevel(null);
                            setCatFormError(null);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-700 text-rose-400 cursor-pointer"
                          title="حذف هذه الفئة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedRecAtLevel?.description && !isEditingHere && (
                    <p className="text-[10px] text-slate-400 leading-relaxed px-1">
                      {selectedRecAtLevel.description}
                    </p>
                  )}
                </div>

                {/* Inline Edit Form inside Block (Zero Popups) */}
                {isEditingHere && selectedRecAtLevel && (
                  <div className="bg-slate-900 border border-cyan-500/40 rounded-lg p-2.5 space-y-2 text-xs">
                    <div className="text-[11px] font-bold text-cyan-300">
                      تعديل الفئة في نفس البلوك:
                    </div>
                    {catFormError && (
                      <div className="text-[10px] text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded px-2 py-1">
                        {catFormError}
                      </div>
                    )}
                    <input
                      type="text"
                      value={inlineEditName}
                      onChange={(e) => setInlineEditName(e.target.value)}
                      placeholder="اسم الفئة *"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                    />
                    <input
                      type="text"
                      value={inlineEditDesc}
                      onChange={(e) => setInlineEditDesc(e.target.value)}
                      placeholder="وصف مختصر (اختياري)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setInlineEditBlockLevel(null);
                          setCatFormError(null);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px] cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleInlineEditCategory(selectedRecAtLevel.id)}
                        className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] cursor-pointer"
                      >
                        حفظ التعديل
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Delete Confirmation inside Block (Zero Popups) */}
                {isDeletingHere && selectedRecAtLevel && (
                  <div className="bg-rose-950/40 border border-rose-500/40 rounded-lg p-2.5 space-y-2 text-[11px]">
                    <div className="text-rose-200 leading-relaxed">
                      حذف <strong>«{selectedRecAtLevel.name}»</strong> وأي فروع تابعة لها؟
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInlineDeleteBlockLevel(null)}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 cursor-pointer"
                      >
                        تراجع
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleInlineDeleteCategory(selectedRecAtLevel, levelIdx)}
                        className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                      >
                        تأكيد الحذف
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Add Form or Trigger Button inside Block (Zero Popups) */}
                {isAddingHere ? (
                  <div className="bg-slate-900 border border-emerald-500/40 rounded-lg p-2.5 space-y-2 text-xs">
                    <div className="text-[11px] font-bold text-emerald-300">
                      {levelIdx === 0
                        ? 'إضافة تصنيف رئيسي جديد (المستوى 1):'
                        : `إضافة فئة فرعية تحت «${parentRecAtLevel?.name}»:`}
                    </div>
                    {catFormError && (
                      <div className="text-[10px] text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded px-2 py-1">
                        {catFormError}
                      </div>
                    )}
                    <input
                      type="text"
                      autoFocus
                      value={inlineAddName}
                      onChange={(e) => setInlineAddName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleInlineAddCategory(levelIdx);
                        }
                      }}
                      placeholder="اكتب اسم التصنيف الجديد..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      value={inlineAddDesc}
                      onChange={(e) => setInlineAddDesc(e.target.value)}
                      placeholder="وصف مختصر (اختياري)..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setInlineAddBlockLevel(null);
                          setInlineAddName('');
                          setInlineAddDesc('');
                          setCatFormError(null);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px] cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleInlineAddCategory(levelIdx)}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                      >
                        حفظ في البلوك
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setInlineAddBlockLevel(levelIdx);
                      setInlineAddName('');
                      setInlineAddDesc('');
                      setInlineEditBlockLevel(null);
                      setInlineDeleteBlockLevel(null);
                      setCatFormError(null);
                    }}
                    className="w-full text-right text-[11px] text-cyan-400 hover:text-cyan-300 py-1 px-1 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {levelIdx === 0
                        ? '+ تصنيف رئيسي جديد بالمستوى 1'
                        : `+ إضافة تصنيف تحت (${parentRecAtLevel?.name || 'المستوى السابق'})`}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Category Relations & Catalog Workspace (Full Width in Same Form) */}
      <div className="space-y-4">
        {/* Selected Category Summary Bar */}
        {effectiveSelectedCategory ? (
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                  <span>المسار الهرمي المختار:</span>
                  {ancestorChain
                    .slice()
                    .reverse()
                    .map((c, idx, arr) => (
                      <React.Fragment key={c.id}>
                        <span
                          className={`font-semibold ${
                            c.id === effectiveSelectedCategory.id
                              ? 'text-cyan-300'
                              : 'text-slate-300'
                          }`}
                        >
                          {c.name}
                        </span>
                        {idx < arr.length - 1 && <span>←</span>}
                      </React.Fragment>
                    ))}
                </div>
                <h3 className="text-base font-bold text-white">
                  {effectiveSelectedCategory.name}
                </h3>
                {effectiveSelectedCategory.description && (
                  <p className="text-xs text-slate-400">
                    {effectiveSelectedCategory.description}
                  </p>
                )}
              </div>

              {ancestorChain.length > 1 && (
                <div className="text-[11px] bg-cyan-950/40 border border-cyan-500/30 rounded-xl px-3 py-2 text-cyan-200 max-w-xs">
                  توريث نشط من الفئة الأب:{' '}
                  <strong>{ancestorChain[1]?.name}</strong> (مع إمكانية الاستثناء أو الإضافة المخصصة لهذا الفرع).
                </div>
              )}
            </div>

            {/* Compatibility Summary Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80 text-center text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
                <div className="text-[10px] text-slate-400">مجموعات النشاط</div>
                <div className="text-sm font-bold font-mono text-cyan-300">
                  {compatibilitySnapshot.compatibleActivityGroups.length}
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
                <div className="text-[10px] text-slate-400">مجموعات المعدات</div>
                <div className="text-sm font-bold font-mono text-amber-300">
                  {compatibilitySnapshot.compatibleLibraryGroups.length}
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
                <div className="text-[10px] text-slate-400">مشمول / غير مشمول</div>
                <div className="text-sm font-bold font-mono text-emerald-300">
                  {compatibilitySnapshot.compatibleInclusions.length} /{' '}
                  {compatibilitySnapshot.compatibleExclusions.length}
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
                <div className="text-[10px] text-slate-400">معدات متوافقة</div>
                <div className="text-sm font-bold font-mono text-white">
                  {compatibilitySnapshot.compatibleEquipments.length}
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2">
                <div className="text-[10px] text-slate-400">إضافات مدفوعة</div>
                <div className="text-sm font-bold font-mono text-cyan-300">
                  {compatibilitySnapshot.compatibleMasterAddons.length}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-200">
            <FolderTree className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              اختر تصنيفاً من <strong>بلوك المستوى 1</strong> أعلاه (أو أضف تصنيفاً جديداً داخله) لعرض وإدارة علاقات التوريث والربط معه، وسيظهر بلوك المستوى التالي تلقائياً.
            </span>
          </div>
        )}

          {/* Tabs Navigation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'groups' as const, label: 'المجموعات والخصائص', icon: Layers },
              { id: 'inclusions' as const, label: 'ما يشمله وما لا يشمله', icon: Tag },
              { id: 'equipment' as const, label: 'المعدات ووسائل النقل المتوافقة', icon: Wrench },
              { id: 'addons' as const, label: 'الإضافات الاختيارية المدفوعة', icon: Sparkles },
              {
                id: 'manufacturers' as const,
                label: 'الشركات المصنعة والموديلات وأنواع المعدات',
                icon: Factory
              },
              {
                id: 'locations' as const,
                label: 'مرجع البلاد والمدن ونقاط الالتقاء',
                icon: Globe
              },
              { id: 'table' as const, label: 'جدول المكتبة الشاملة والربط', icon: ListChecks }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-950'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ============================================================== */}
          {/* TAB 1: Spec Groups -> Properties                              */}
          {/* ============================================================== */}
          {activeTab === 'groups' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    المجموعات والخصائص المرتبطة بالفئة ({effectiveSelectedCategory?.name})
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    أنشئ مجموعة مواصفات (للنشاط أو لمكتبة المعدات)، واربط مجموعات المعدات بأنواعها (مركب، يخت، لانش، باتش باجي...) لتظهر تلقائياً عند اختيار النوع.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingGroup(null);
                    setGroupNameInput('');
                    setGroupScopeInput('activity_spec');
                    setGroupDescInput('');
                    setGroupUnitKindIdsInput([]);
                    setShowGroupForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مجموعة مواصفات</span>
                </button>
              </div>

              {showGroupForm && (
                <form
                  onSubmit={handleSaveGroupForm}
                  className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">
                      {editingGroup ? `تعديل مجموعة: ${editingGroup.name}` : 'إضافة مجموعة مواصفات جديدة'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowGroupForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">اسم المجموعة *</label>
                      <input
                        type="text"
                        required
                        value={groupNameInput}
                        onChange={(e) => setGroupNameInput(e.target.value)}
                        placeholder="مثال: مواصفات المراكب واليخوت"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">نطاق المجموعة</label>
                      <select
                        value={groupScopeInput}
                        onChange={(e) => setGroupScopeInput(e.target.value as MasterGroupScope)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                      >
                        <option value="activity_spec">مواصفات نشاط مخصصة</option>
                        <option value="equipment_library">مكتبة خصائص المعدات المركزية</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">وصف مختصر</label>
                    <input
                      type="text"
                      value={groupDescInput}
                      onChange={(e) => setGroupDescInput(e.target.value)}
                      placeholder="وصف دور هذه المجموعة..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  {groupScopeInput === 'equipment_library' && equipmentOnlyUnitKinds.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-800">
                      <label className="block text-[11px] text-amber-300 font-semibold">
                        أنواع المعدات المرتبطة بهذه المجموعة (تحديد متعدد):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {equipmentOnlyUnitKinds.map((uk) => {
                          const checked = groupUnitKindIdsInput.includes(uk.id);
                          return (
                            <button
                              key={uk.id}
                              type="button"
                              onClick={() =>
                                setGroupUnitKindIdsInput((prev) =>
                                  prev.includes(uk.id)
                                    ? prev.filter((id) => id !== uk.id)
                                    : [...prev, uk.id]
                                )
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                                checked
                                  ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                              }`}
                            >
                              {checked ? <Check className="w-3 h-3 text-amber-300" /> : <Plus className="w-3 h-3 text-slate-400" />}
                              <span>{uk.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGroupForm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                    >
                      {editingGroup ? 'حفظ التعديلات' : 'إنشاء وربط بالفئة الحالية'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {specGroups.map((grp) => {
                  const res = getInheritance(grp);
                  const isExpanded = selectedGroupId === grp.id;
                  const specsInGrp =
                    grp.scope === 'activity_spec'
                      ? customTechnicalSpecs.filter(
                          (s) =>
                            s.groupId === grp.id ||
                            (!s.groupId &&
                              s.groupTitle.trim().toLowerCase() === grp.name.trim().toLowerCase())
                        )
                      : [];
                  const eqPropsInGrp =
                    grp.scope === 'equipment_library'
                      ? equipmentProperties.filter((p) => p.groupId === grp.id)
                      : [];
                  const propsCount =
                    grp.scope === 'activity_spec' ? specsInGrp.length : eqPropsInGrp.length;

                  return (
                    <div
                      key={grp.id}
                      className={`border rounded-xl p-3.5 space-y-3 transition-colors ${
                        res.status === 'direct' || res.status === 'inherited'
                          ? 'bg-slate-950 border-cyan-500/35'
                          : res.status === 'excluded'
                          ? 'bg-slate-950/60 border-rose-500/30 opacity-80'
                          : 'bg-slate-950/50 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedGroupId((prev) => (prev === grp.id ? null : grp.id))
                          }
                          className="flex items-center gap-2 text-right cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-cyan-400 shrink-0" />
                          ) : (
                            <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-white">
                                {grp.name}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                                {SCOPE_LABELS[grp.scope]}
                              </span>
                              <span className="text-[10px] font-mono text-cyan-300">
                                ({propsCount} خاصية)
                              </span>
                              <InheritanceBadge res={res} />
                            </div>
                            {grp.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{grp.description}</p>
                            )}
                            {grp.scope === 'equipment_library' && (grp.linkedUnitKindIds ?? []).length > 0 && (
                              <p className="text-[11px] text-amber-300/90 mt-0.5">
                                الأنواع المرتبطة:{' '}
                                {(grp.linkedUnitKindIds ?? [])
                                  .map((id) => unitKindNameById.get(id))
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}
                          </div>
                        </button>

                        {/* Group Controls */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          {res.status === 'direct' ? (
                            <button
                              type="button"
                              onClick={() => toggleGroupLink(grp, 'clear')}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-700 text-slate-300 hover:text-rose-300 cursor-pointer"
                            >
                              فك الربط المباشر
                            </button>
                          ) : res.status === 'inherited' ? (
                            <button
                              type="button"
                              onClick={() => toggleGroupLink(grp, 'exclude')}
                              className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 cursor-pointer"
                            >
                              استثناء لهذا الفرع
                            </button>
                          ) : res.status === 'excluded' ? (
                            <button
                              type="button"
                              onClick={() => toggleGroupLink(grp, 'clear')}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-950/60 border border-slate-700 text-emerald-300 cursor-pointer"
                            >
                              إلغاء الاستثناء
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleGroupLink(grp, 'link')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-bold cursor-pointer"
                            >
                              + ربط بالفئة
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingGroup(grp);
                              setGroupNameInput(grp.name);
                              setGroupScopeInput(grp.scope);
                              setGroupDescInput(grp.description || '');
                              setGroupUnitKindIdsInput(grp.linkedUnitKindIds ?? []);
                              setShowGroupForm(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 cursor-pointer"
                            title="تعديل المجموعة"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteSpecGroup(grp.id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-rose-400 border border-slate-800 cursor-pointer"
                            title="حذف المجموعة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Properties inside Group Drill-down */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-800/80 space-y-3">
                          {grp.scope === 'equipment_library' && equipmentOnlyUnitKinds.length > 0 && (
                            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                              <span className="block text-[11px] font-bold text-amber-300">
                                ربط مجموعة المواصفات بأنواع المعدات (عند اختيار النوع في إدارة المعدات تظهر مواصفاته تلقائياً):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {equipmentOnlyUnitKinds.map((uk) => {
                                  const isLinked = (grp.linkedUnitKindIds ?? []).includes(uk.id);
                                  return (
                                    <button
                                      key={uk.id}
                                      type="button"
                                      onClick={() => toggleSpecGroupUnitKind(grp, uk.id)}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                                        isLinked
                                          ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      {isLinked ? (
                                        <Check className="w-3 h-3 text-amber-300" />
                                      ) : (
                                        <Plus className="w-3 h-3 text-slate-500" />
                                      )}
                                      <span>{uk.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-cyan-300">
                              خصائص مجموعة «{grp.name}»:
                            </span>
                            <button
                              type="button"
                              onClick={() => openPropForm(grp.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>إضافة خاصية للمجموعة</span>
                            </button>
                          </div>

                          {showPropFormForGroupId === grp.id && (
                            <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-3 space-y-2.5 text-xs">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] text-slate-300 mb-1">
                                    اسم الخاصية *
                                  </label>
                                  <input
                                    type="text"
                                    value={propLabelInput}
                                    onChange={(e) => setPropLabelInput(e.target.value)}
                                    placeholder="مثال: أقصى عمق غوص"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-300 mb-1">
                                    نوع الحقل
                                  </label>
                                  <select
                                    value={propTypeInput}
                                    onChange={(e) =>
                                      setPropTypeInput(e.target.value as MetaFieldType)
                                    }
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                                  >
                                    {Object.entries(FIELD_TYPE_LABELS).map(([k, v]) => (
                                      <option key={k} value={k}>
                                        {v}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-300 mb-1">
                                    وحدة القياس (اختياري)
                                  </label>
                                  <input
                                    type="text"
                                    value={propUnitInput}
                                    onChange={(e) => setPropUnitInput(e.target.value)}
                                    placeholder="متر، راكب، ساعة..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                                  />
                                </div>
                              </div>

                              {(propTypeInput === 'single_choice' ||
                                propTypeInput === 'multi_choice') && (
                                <div>
                                  <label className="block text-[10px] text-slate-300 mb-1">
                                    الخيارات المتاحة (مفصولة بفاصلة)
                                  </label>
                                  <input
                                    type="text"
                                    value={propOptionsInput}
                                    onChange={(e) => setPropOptionsInput(e.target.value)}
                                    placeholder="خيار 1، خيار 2، خيار 3"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                                  />
                                </div>
                              )}

                              {grp.scope === 'equipment_library' && equipmentOnlyUnitKinds.length > 0 && (
                                <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                                  <label className="block text-[10px] text-amber-300 font-semibold">
                                    أنواع المعدات المرتبطة بهذه الصفة (اختيار متعدد):
                                  </label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {equipmentOnlyUnitKinds.map((uk) => {
                                      const checked = propUnitKindIdsInput.includes(uk.id);
                                      return (
                                        <button
                                          key={uk.id}
                                          type="button"
                                          onClick={() =>
                                            setPropUnitKindIdsInput((prev) =>
                                              prev.includes(uk.id)
                                                ? prev.filter((id) => id !== uk.id)
                                                : [...prev, uk.id]
                                            )
                                          }
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold cursor-pointer ${
                                            checked
                                              ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                          }`}
                                        >
                                          {checked ? (
                                            <Check className="w-2.5 h-2.5 text-amber-300" />
                                          ) : (
                                            <Plus className="w-2.5 h-2.5 text-slate-500" />
                                          )}
                                          <span>{uk.name}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-3 text-[11px]">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                                    <input
                                      type="checkbox"
                                      checked={propIsRequired}
                                      onChange={(e) => setPropIsRequired(e.target.checked)}
                                    />
                                    <span>إلزامي افتراضياً</span>
                                  </label>
                                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                                    <input
                                      type="checkbox"
                                      checked={propIsPublic}
                                      onChange={(e) => setPropIsPublic(e.target.checked)}
                                    />
                                    <span>ظاهر للعميل</span>
                                  </label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowPropFormForGroupId(null)}
                                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300"
                                  >
                                    إلغاء
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSavePropertyInGroup(grp)}
                                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                  >
                                    {editingPropId ? 'حفظ التعديل' : 'إضافة الخاصية'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Property Rows */}
                          {grp.scope === 'activity_spec' ? (
                            specsInGrp.length === 0 ? (
                              <div className="text-[11px] text-slate-500 p-3 bg-slate-900/40 rounded-lg text-center">
                                لا توجد خصائص داخل هذه المجموعة بعد.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {specsInGrp.map((spec) => {
                                  const specRes =
                                    (spec.linkedCategoryIds && spec.linkedCategoryIds.length > 0) ||
                                    (spec.excludedCategoryIds && spec.excludedCategoryIds.length > 0)
                                      ? getInheritance(spec)
                                      : res;
                                  return (
                                    <div
                                      key={spec.id}
                                      className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs"
                                    >
                                      <div className="space-y-0.5">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="font-semibold text-white">
                                            {spec.label}
                                          </span>
                                          <span className="text-[10px] text-cyan-400 font-mono">
                                            {FIELD_TYPE_LABELS[spec.type]}
                                            {spec.unit ? ` · ${spec.unit}` : ''}
                                          </span>
                                          <InheritanceBadge res={specRes} />
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 text-[10px]">
                                        {specRes.status === 'excluded' ? (
                                          <button
                                            type="button"
                                            onClick={() => toggleCustomSpecLink(spec, 'clear')}
                                            className="px-2 py-0.5 rounded bg-slate-950 border border-emerald-500/40 text-emerald-300 cursor-pointer"
                                          >
                                            تفعيل للفرع
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => toggleCustomSpecLink(spec, 'exclude')}
                                            className="px-2 py-0.5 rounded bg-slate-950 border border-rose-500/30 text-rose-300 cursor-pointer"
                                          >
                                            استثناء للفرع
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => openPropForm(grp.id, spec)}
                                          className="p-1 text-cyan-300 hover:text-white cursor-pointer"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onChangeCustomTechnicalSpecs((prev) =>
                                              prev.filter((x) => x.id !== spec.id)
                                            )
                                          }
                                          className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          ) : eqPropsInGrp.length === 0 ? (
                            <div className="text-[11px] text-slate-500 p-3 bg-slate-900/40 rounded-lg text-center">
                              لا توجد خصائص معدات داخل هذه المجموعة بعد.
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {eqPropsInGrp.map((prop) => {
                                const propRes =
                                  (prop.linkedCategoryIds && prop.linkedCategoryIds.length > 0) ||
                                  (prop.excludedCategoryIds && prop.excludedCategoryIds.length > 0)
                                    ? getInheritance(prop)
                                    : res;
                                return (
                                  <div
                                    key={prop.id}
                                    className="space-y-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-semibold text-white">{prop.label}</span>
                                        <span className="text-[10px] text-amber-300 font-mono">
                                          {FIELD_TYPE_LABELS[prop.type]}
                                          {prop.unit ? ` · ${prop.unit}` : ''}
                                        </span>
                                        {(prop.linkedUnitKindIds ?? []).length > 0 && (
                                          <span className="text-[10px] text-cyan-300/90">
                                            · الأنواع:{' '}
                                            {(prop.linkedUnitKindIds ?? [])
                                              .map((id) => unitKindNameById.get(id))
                                              .filter(Boolean)
                                              .join(' · ')}
                                          </span>
                                        )}
                                        <InheritanceBadge res={propRes} />
                                      </div>
                                      <div className="flex items-center gap-1 text-[10px]">
                                        {propRes.status === 'excluded' ? (
                                          <button
                                            type="button"
                                            onClick={() => toggleEqPropLink(prop, 'clear')}
                                            className="px-2 py-0.5 rounded bg-slate-950 border border-emerald-500/40 text-emerald-300 cursor-pointer"
                                          >
                                            تفعيل للفرع
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => toggleEqPropLink(prop, 'exclude')}
                                            className="px-2 py-0.5 rounded bg-slate-950 border border-rose-500/30 text-rose-300 cursor-pointer"
                                          >
                                            استثناء للفرع
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => openPropForm(grp.id, undefined, prop)}
                                          className="p-1 text-cyan-300 hover:text-white cursor-pointer"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onChangeEquipmentProperties(
                                              equipmentProperties.filter((x) => x.id !== prop.id)
                                            )
                                          }
                                          className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                    {equipmentOnlyUnitKinds.length > 0 && (
                                      <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-800/60">
                                        <span className="text-[10px] text-slate-400 ml-1">
                                          ربط الصفة بالنوع:
                                        </span>
                                        {equipmentOnlyUnitKinds.map((uk) => {
                                          const linkedToUk = (prop.linkedUnitKindIds ?? []).includes(uk.id);
                                          return (
                                            <button
                                              key={uk.id}
                                              type="button"
                                              onClick={() => toggleEqPropUnitKind(prop, uk.id)}
                                              className={`px-1.5 py-0.5 rounded border text-[10px] cursor-pointer ${
                                                linkedToUk
                                                  ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200 font-semibold'
                                                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                                              }`}
                                            >
                                              {linkedToUk ? `✓ ${uk.name}` : uk.name}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: Inclusions & Exclusions                                 */}
          {/* ============================================================== */}
          {activeTab === 'inclusions' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white">
                  ما يشمله وما لا يشمله — مرتبط بالفئة ({effectiveSelectedCategory?.name})
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  أضف أو عدّل أو اربط البنود المشمولة وغير المشمولة، لتظهر تلقائياً عند اختيار هذه الفئة أو أي فرع يرث منها.
                </p>
              </div>

              {/* Add new inclusion/exclusion */}
              <div className="flex flex-col sm:flex-row gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs">
                <select
                  value={newIncKind}
                  onChange={(e) => setNewIncKind(e.target.value as InclusionKind)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
                >
                  <option value="included">✓ مشمول مجاناً</option>
                  <option value="excluded">✕ غير مشمول / برسوم</option>
                </select>
                <input
                  type="text"
                  value={newIncLabel}
                  onChange={(e) => setNewIncLabel(e.target.value)}
                  placeholder="اكتب البند الجديد لإضافته وربطه بهذه الفئة..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newIncLabel.trim()) return;
                    onCreateInclusionItem({
                      label: newIncLabel.trim(),
                      kind: newIncKind,
                      linkedCategoryIds: activeCategoryId ? [activeCategoryId] : []
                    });
                    notify(`✓ تمت إضافة «${newIncLabel.trim()}» وربطه بالفئة الحالية`);
                    setNewIncLabel('');
                  }}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer whitespace-nowrap"
                >
                  + إضافة وربط بالفئة
                </button>
              </div>

              {(['included', 'excluded'] as const).map((kind) => {
                const items = inclusionsCatalog.filter((i) => i.kind === kind);
                return (
                  <div key={kind} className="space-y-2 pt-2">
                    <h5
                      className={`text-xs font-bold ${
                        kind === 'included' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {kind === 'included'
                        ? `✓ بنود المشمول مجاناً (${items.length})`
                        : `✕ بنود غير المشمول (${items.length})`}
                    </h5>
                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const res = getInheritance(item);
                        const isEditing = editingIncId === item.id;
                        return (
                          <div
                            key={item.id}
                            className={`flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border text-xs ${
                              res.status === 'direct' || res.status === 'inherited'
                                ? 'bg-slate-950 border-slate-700'
                                : 'bg-slate-950/40 border-slate-800/70 opacity-75'
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5 flex-1">
                                  <input
                                    type="text"
                                    value={editingIncLabel}
                                    onChange={(e) => setEditingIncLabel(e.target.value)}
                                    className="flex-1 bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editingIncLabel.trim()) {
                                        onUpdateInclusionItem(item.id, {
                                          label: editingIncLabel.trim()
                                        });
                                        notify('✓ تم تحديث البند');
                                      }
                                      setEditingIncId(null);
                                    }}
                                    className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[11px]"
                                  >
                                    حفظ
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="font-semibold text-white">{item.label}</span>
                                  <InheritanceBadge res={res} />
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px]">
                              {res.status === 'direct' ? (
                                <button
                                  type="button"
                                  onClick={() => toggleInclusionLink(item, 'clear')}
                                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-rose-300 cursor-pointer"
                                >
                                  فك الربط
                                </button>
                              ) : res.status === 'inherited' ? (
                                <button
                                  type="button"
                                  onClick={() => toggleInclusionLink(item, 'exclude')}
                                  className="px-2 py-1 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 cursor-pointer"
                                >
                                  استثناء للفرع
                                </button>
                              ) : res.status === 'excluded' ? (
                                <button
                                  type="button"
                                  onClick={() => toggleInclusionLink(item, 'clear')}
                                  className="px-2 py-1 rounded bg-slate-900 border border-emerald-500/40 text-emerald-300 cursor-pointer"
                                >
                                  إلغاء الاستثناء
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleInclusionLink(item, 'link')}
                                  className="px-2 py-1 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-bold cursor-pointer"
                                >
                                  + ربط بالفئة
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingIncId(item.id);
                                  setEditingIncLabel(item.label);
                                }}
                                className="p-1.5 rounded bg-slate-900 text-cyan-300 border border-slate-800 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteInclusionItem(item.id)}
                                className="p-1.5 rounded bg-slate-900 text-rose-400 border border-slate-800 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: Compatible Equipment & Logistics (2 Isolated Blocks)    */}
          {/* ============================================================== */}
          {activeTab === 'equipment' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    المعدات ووسائل النقل المتوافقة مع ({effectiveSelectedCategory?.name || 'اختر فئة أولاً'})
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    تحديد متعدد لأنواع المعدات في بلوك مستقل وأنواع وسائل النقل (اللوجستيات) في بلوك مستقل للفئة المختارة، مع توريث تلقائي للفروع وإمكانية الاستثناء.
                  </p>
                </div>
                {effectiveSelectedCategory && (
                  <span className="text-[11px] text-cyan-300 tabular-nums">
                    {compatibilitySnapshot.compatibleEquipmentUnitKinds.length} نوع معدة ·{' '}
                    {compatibilitySnapshot.compatibleLogisticsUnitKinds.length} وسيلة نقل
                  </span>
                )}
              </div>

              {!activeCategoryId ? (
                <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-5 text-center text-xs text-amber-200">
                  اختر فئة من <strong>بلوك التصنيف</strong> أعلاه أولاً لتحديد المعدات ووسائل النقل المتوافقة معها (مع دعم التحديد المتعدد لكل بلوك).
                </div>
              ) : (
                <>
                  {/* Two Isolated Multi-Select Blocks */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* BLOCK 1: Equipment Unit Kinds */}
                    <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-white">
                              بلوك 1: المعدات المتوافقة مع الفئة
                            </h5>
                            <span className="text-[10px] text-slate-400 tabular-nums">
                              محدد {compatibilitySnapshot.compatibleEquipmentUnitKinds.length} من أصل{' '}
                              {equipmentOnlyUnitKinds.length} نوع معدة
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px]">
                          {onUpdateEquipmentUnitKind && (
                            <button
                              type="button"
                              onClick={() => {
                                equipmentOnlyUnitKinds.forEach((uk) => {
                                  const res = getInheritance(uk);
                                  if (res.status !== 'direct' && res.status !== 'inherited') {
                                    toggleUnitKindCategoryLink(uk, 'link');
                                  }
                                });
                                notify(`✓ تم ربط كافة أنواع المعدات بفئة «${effectiveSelectedCategory?.name}»`);
                              }}
                              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 hover:border-cyan-500/60 cursor-pointer"
                            >
                              تحديد الكل
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowAddEqUnitKind((p) => !p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>إضافة نوع معدة</span>
                          </button>
                        </div>
                      </div>

                      {showAddEqUnitKind && (
                        <div className="flex gap-2 bg-slate-900 border border-cyan-500/40 rounded-xl p-2.5 text-xs">
                          <input
                            type="text"
                            value={newEqUnitKindInput}
                            onChange={(e) => setNewEqUnitKindInput(e.target.value)}
                            placeholder="اسم نوع المعدة (مثال: جيت سكي، كاياك...)"
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = newEqUnitKindInput.trim();
                              if (!trimmed || !onCreateEquipmentUnitKind) return;
                              const created = onCreateEquipmentUnitKind({
                                name: trimmed,
                                domainScope: 'equipment',
                                linkedCategoryIds: [activeCategoryId]
                              });
                              setNewEqUnitKindInput('');
                              setShowAddEqUnitKind(false);
                              notify(`✓ تمت إضافة «${created.name}» وربطها بالفئة`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-bold cursor-pointer"
                          >
                            حفظ وربط
                          </button>
                        </div>
                      )}

                      <div className="space-y-2 max-h-[380px] overflow-y-auto pl-1">
                        {equipmentOnlyUnitKinds.map((uk) => {
                          const res = getInheritance(uk);
                          const isChecked = res.status === 'direct' || res.status === 'inherited';
                          const matchingFleetCount = equipments.filter(
                            (e) =>
                              (e.classification || '').trim().toLowerCase() ===
                              uk.name.trim().toLowerCase()
                          ).length;

                          return (
                            <div
                              key={uk.id}
                              className={`flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
                                isChecked
                                  ? 'bg-cyan-950/35 border-cyan-500/50'
                                  : res.status === 'excluded'
                                  ? 'bg-slate-900/50 border-rose-500/30 opacity-80'
                                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (res.status === 'direct') toggleUnitKindCategoryLink(uk, 'clear');
                                  else if (res.status === 'inherited') toggleUnitKindCategoryLink(uk, 'exclude');
                                  else if (res.status === 'excluded') toggleUnitKindCategoryLink(uk, 'clear');
                                  else toggleUnitKindCategoryLink(uk, 'link');
                                }}
                                className="flex items-center gap-2.5 text-right flex-1 min-w-0 cursor-pointer"
                              >
                                <span
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    isChecked
                                      ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                                      : 'bg-slate-950 border-slate-700 text-transparent'
                                  }`}
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold text-white">{uk.name}</span>
                                    <span className="text-[10px] text-slate-400 tabular-nums">
                                      · {matchingFleetCount} مسجلة
                                    </span>
                                  </div>
                                  {uk.description && (
                                    <p className="text-[10px] text-slate-400 truncate">{uk.description}</p>
                                  )}
                                </div>
                              </button>

                              <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                                <InheritanceBadge res={res} />
                                {res.status === 'direct' ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleUnitKindCategoryLink(uk, 'clear')}
                                    className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-300 hover:text-rose-300 cursor-pointer"
                                  >
                                    فك الربط
                                  </button>
                                ) : res.status === 'inherited' ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleUnitKindCategoryLink(uk, 'exclude')}
                                    className="px-2 py-1 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 cursor-pointer"
                                  >
                                    استثناء
                                  </button>
                                ) : res.status === 'excluded' ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleUnitKindCategoryLink(uk, 'clear')}
                                    className="px-2 py-1 rounded bg-slate-950 border border-emerald-500/40 text-emerald-300 cursor-pointer"
                                  >
                                    إلغاء الاستثناء
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggleUnitKindCategoryLink(uk, 'link')}
                                    className="px-2 py-1 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-bold cursor-pointer"
                                  >
                                    + ربط
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* BLOCK 2: Logistics / Transport Unit Kinds */}
                    <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-white">
                              بلوك 2: وسائل النقل واللوجستيات المتوافقة مع الفئة
                            </h5>
                            <span className="text-[10px] text-slate-400 tabular-nums">
                              محدد {compatibilitySnapshot.compatibleLogisticsUnitKinds.length} من أصل{' '}
                              {logisticsOnlyUnitKinds.length} وسيلة نقل
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px]">
                          {onUpdateEquipmentUnitKind && (
                            <button
                              type="button"
                              onClick={() => {
                                logisticsOnlyUnitKinds.forEach((uk) => {
                                  const res = getInheritance(uk);
                                  if (res.status !== 'direct' && res.status !== 'inherited') {
                                    toggleUnitKindCategoryLink(uk, 'link');
                                  }
                                });
                                notify(`✓ تم ربط كافة وسائل النقل بفئة «${effectiveSelectedCategory?.name}»`);
                              }}
                              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-300 hover:border-emerald-500/60 cursor-pointer"
                            >
                              تحديد الكل
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowAddLogUnitKind((p) => !p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>إضافة وسيلة نقل</span>
                          </button>
                        </div>
                      </div>

                      {showAddLogUnitKind && (
                        <div className="flex gap-2 bg-slate-900 border border-emerald-500/40 rounded-xl p-2.5 text-xs">
                          <input
                            type="text"
                            value={newLogUnitKindInput}
                            onChange={(e) => setNewLogUnitKindInput(e.target.value)}
                            placeholder="اسم وسيلة النقل (مثال: أتوبيس VIP، سيارة عائلية...)"
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = newLogUnitKindInput.trim();
                              if (!trimmed || !onCreateEquipmentUnitKind) return;
                              const created = onCreateEquipmentUnitKind({
                                name: trimmed,
                                domainScope: 'logistics',
                                linkedCategoryIds: [activeCategoryId]
                              });
                              setNewLogUnitKindInput('');
                              setShowAddLogUnitKind(false);
                              notify(`✓ تمت إضافة وسيلة النقل «${created.name}» وربطها بالفئة`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                          >
                            حفظ وربط
                          </button>
                        </div>
                      )}

                      <div className="space-y-2 max-h-[380px] overflow-y-auto pl-1">
                        {logisticsOnlyUnitKinds.map((uk) => {
                          const res = getInheritance(uk);
                          const isChecked = res.status === 'direct' || res.status === 'inherited';
                          const matchingVehiclesCount = logisticsVehicles.filter(
                            (v) =>
                              LOGISTICS_CATEGORY_TO_UNIT_KIND_ID[v.category] === uk.id ||
                              (LOGISTICS_CATEGORY_LABELS[v.category] || '').trim().toLowerCase() ===
                                uk.name.trim().toLowerCase()
                          ).length;

                          return (
                            <div
                              key={uk.id}
                              className={`flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
                                isChecked
                                  ? 'bg-emerald-950/35 border-emerald-500/50'
                                  : res.status === 'excluded'
                                  ? 'bg-slate-900/50 border-rose-500/30 opacity-80'
                                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (res.status === 'direct') toggleUnitKindCategoryLink(uk, 'clear');
                                  else if (res.status === 'inherited') toggleUnitKindCategoryLink(uk, 'exclude');
                                  else if (res.status === 'excluded') toggleUnitKindCategoryLink(uk, 'clear');
                                  else toggleUnitKindCategoryLink(uk, 'link');
                                }}
                                className="flex items-center gap-2.5 text-right flex-1 min-w-0 cursor-pointer"
                              >
                                <span
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    isChecked
                                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                      : 'bg-slate-950 border-slate-700 text-transparent'
                                  }`}
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold text-white">{uk.name}</span>
                                    <span className="text-[10px] text-slate-400 tabular-nums">
                                      · {matchingVehiclesCount} مسجلة
                                    </span>
                                  </div>
                                  {uk.description && (
                                    <p className="text-[10px] text-slate-400 truncate">{uk.description}</p>
                                  )}
                                </div>
                              </button>

                              <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                                <InheritanceBadge res={res} />
                                {res.status === 'direct' ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleUnitKindCategoryLink(uk, 'clear')}
                                    className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-300 hover:text-rose-300 cursor-pointer"
                                  >
                                    فك الربط
                                  </button>
                                ) : res.status === 'inherited' ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleUnitKindCategoryLink(uk, 'exclude')}
                                    className="px-2 py-1 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 cursor-pointer"
                                  >
                                    استثناء
                                  </button>
                                ) : res.status === 'excluded' ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleUnitKindCategoryLink(uk, 'clear')}
                                    className="px-2 py-1 rounded bg-slate-950 border border-emerald-500/40 text-emerald-300 cursor-pointer"
                                  >
                                    إلغاء الاستثناء
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggleUnitKindCategoryLink(uk, 'link')}
                                    className="px-2 py-1 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-bold cursor-pointer"
                                  >
                                    + ربط
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Compatible Registered Fleet & Transport Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-cyan-300 block tabular-nums">
                        المعدات المسجلة المتوافقة مع «{effectiveSelectedCategory?.name}» (
                        {compatibilitySnapshot.compatibleEquipments.length}):
                      </span>
                      {compatibilitySnapshot.compatibleEquipments.length === 0 ? (
                        <p className="text-[11px] text-slate-500">
                          لا توجد معدات مسجلة مطابقة للأنواع المحددة لهذه الفئة حالياً.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {compatibilitySnapshot.compatibleEquipments.map((eq) => (
                            <div
                              key={eq.id}
                              className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/25 text-xs flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-white truncate">{eq.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {eq.classification} · {eq.ownerCompanyName}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-cyan-300 shrink-0">
                                {eq.id}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-emerald-300 block tabular-nums">
                        وسائل النقل المسجلة المتوافقة مع «{effectiveSelectedCategory?.name}» (
                        {compatibilitySnapshot.compatibleLogisticsVehicles.length}):
                      </span>
                      {compatibilitySnapshot.compatibleLogisticsVehicles.length === 0 ? (
                        <p className="text-[11px] text-slate-500">
                          لا توجد مركبات نقل مسجلة مطابقة للوسائل المحددة لهذه الفئة حالياً.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {compatibilitySnapshot.compatibleLogisticsVehicles.map((veh) => (
                            <div
                              key={veh.id}
                              className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/25 text-xs flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-white truncate">{veh.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {LOGISTICS_CATEGORY_LABELS[veh.category]} · {veh.passengerCapacity} راكب ·{' '}
                                  {veh.city}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-300 shrink-0">
                                {veh.plateOrCode}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Collapsible Legacy Equipment Type Templates */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLegacyEqTypes((p) => !p)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showLegacyEqTypes ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronLeft className="w-3.5 h-3.5" />
                    )}
                    <span>قوالب التصنيفات المرجعية الإجمالية ({equipmentTypes.length})</span>
                  </button>
                  {showLegacyEqTypes && (
                    <button
                      type="button"
                      onClick={() => setShowEqTypeForm((p) => !p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة قالب إجمالي</span>
                    </button>
                  )}
                </div>

                {showLegacyEqTypes && (
                  <div className="space-y-2 pt-2">
                    {showEqTypeForm && (
                      <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-3.5 space-y-2.5 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={eqTypeNameInput}
                            onChange={(e) => setEqTypeNameInput(e.target.value)}
                            placeholder="اسم القالب..."
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                          />
                          <input
                            type="text"
                            value={eqTypeDescInput}
                            onChange={(e) => setEqTypeDescInput(e.target.value)}
                            placeholder="وصف مختصر للقالب..."
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowEqTypeForm(false)}
                            className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!eqTypeNameInput.trim()) return;
                              const today = new Date().toISOString().split('T')[0];
                              const newType: EquipmentTypeDefinition = {
                                id: `eqt-${Date.now().toString(36)}`,
                                key: `custom_${Date.now().toString(36)}`,
                                name: eqTypeNameInput.trim(),
                                category: eqTypeNameInput.trim(),
                                description: eqTypeDescInput.trim(),
                                linkedCategoryIds: activeCategoryId ? [activeCategoryId] : [],
                                excludedCategoryIds: [],
                                specGroups: [],
                                createdAt: today,
                                updatedAt: today
                              };
                              onSaveEquipmentTypes([...equipmentTypes, newType]);
                              notify(`✓ تمت إضافة القالب «${newType.name}» وربطه بالفئة الحالية`);
                              setEqTypeNameInput('');
                              setEqTypeDescInput('');
                              setShowEqTypeForm(false);
                            }}
                            className="px-4 py-1.5 rounded bg-cyan-600 text-white font-bold"
                          >
                            حفظ وربط بالفئة
                          </button>
                        </div>
                      </div>
                    )}

                    {equipmentTypes.map((eqType) => {
                      const res = getInheritance(eqType);
                      const fleetCount = equipments.filter((e) => e.typeId === eqType.id).length;
                      return (
                        <div
                          key={eqType.id}
                          className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white">{eqType.name}</span>
                            <span className="text-[10px] text-slate-400 tabular-nums">
                              · {fleetCount} معدة مسجلة
                            </span>
                            <InheritanceBadge res={res} />
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            {res.status === 'direct' ? (
                              <button
                                type="button"
                                onClick={() => toggleEqTypeLink(eqType, 'clear')}
                                className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 cursor-pointer"
                              >
                                فك الربط
                              </button>
                            ) : res.status === 'inherited' ? (
                              <button
                                type="button"
                                onClick={() => toggleEqTypeLink(eqType, 'exclude')}
                                className="px-2 py-1 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 cursor-pointer"
                              >
                                استثناء للفرع
                              </button>
                            ) : res.status === 'excluded' ? (
                              <button
                                type="button"
                                onClick={() => toggleEqTypeLink(eqType, 'clear')}
                                className="px-2 py-1 rounded bg-slate-900 border border-emerald-500/40 text-emerald-300 cursor-pointer"
                              >
                                إلغاء الاستثناء
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleEqTypeLink(eqType, 'link')}
                                className="px-2 py-1 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-bold cursor-pointer"
                              >
                                + ربط بالفئة
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: Paid Add-ons                                            */}
          {/* ============================================================== */}
          {activeTab === 'addons' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    مكتبة الإضافات الاختيارية المدفوعة — مرتبطة بالفئة ({effectiveSelectedCategory?.name})
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    لا تظهر لصاحب النشاط عند البحث في صفحة إنشاء النشاط إلا الإضافات المرتبطة بالفئة المختارة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddonId(null);
                    setAddonTitle('');
                    setAddonCategory(MASTER_ADDON_CATEGORIES[0]);
                    setAddonUnit('للفرد');
                    setAddonPriceEGP('350');
                    setAddonPriceEUR('12');
                    setAddonDesc('');
                    setShowAddonForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة خدمة اختيارية</span>
                </button>
              </div>

              {showAddonForm && (
                <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-300 mb-1">اسم الخدمة *</label>
                      <input
                        type="text"
                        value={addonTitle}
                        onChange={(e) => setAddonTitle(e.target.value)}
                        placeholder="مثال: جلسة تصوير تحت الماء"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-300 mb-1">تصنيف الخدمة</label>
                      <select
                        value={addonCategory}
                        onChange={(e) => setAddonCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      >
                        {MASTER_ADDON_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-300 mb-1">الوحدة</label>
                      <input
                        type="text"
                        value={addonUnit}
                        onChange={(e) => setAddonUnit(e.target.value)}
                        placeholder="للفرد / للرحلة"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-300 mb-1">
                          السعر المقترح (ج.م)
                        </label>
                        <input
                          type="number"
                          value={addonPriceEGP}
                          onChange={(e) => setAddonPriceEGP(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-300 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-300 mb-1">
                          السعر المقترح (€)
                        </label>
                        <input
                          type="number"
                          value={addonPriceEUR}
                          onChange={(e) => setAddonPriceEUR(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={addonDesc}
                    onChange={(e) => setAddonDesc(e.target.value)}
                    placeholder="وصف مختصر للخدمة..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddonForm(false)}
                      className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!addonTitle.trim()) return;
                        if (editingAddonId) {
                          onUpdateMasterAddon(editingAddonId, {
                            title: addonTitle.trim(),
                            category: addonCategory,
                            unitLabel: addonUnit.trim() || 'للفرد',
                            suggestedPriceEGP: Math.max(0, parseFloat(addonPriceEGP) || 0),
                            suggestedPriceEUR: Math.max(0, parseFloat(addonPriceEUR) || 0),
                            description: addonDesc.trim()
                          });
                          notify(`✓ تم تعديل الإضافة «${addonTitle.trim()}»`);
                        } else {
                          onCreateMasterAddon({
                            title: addonTitle.trim(),
                            category: addonCategory,
                            unitLabel: addonUnit.trim() || 'للفرد',
                            suggestedPriceEGP: Math.max(0, parseFloat(addonPriceEGP) || 0),
                            suggestedPriceEUR: Math.max(0, parseFloat(addonPriceEUR) || 0),
                            description: addonDesc.trim(),
                            isActive: true,
                            linkedCategoryIds: activeCategoryId ? [activeCategoryId] : [],
                            excludedCategoryIds: []
                          });
                          notify(`✓ تمت إضافة «${addonTitle.trim()}» وربطها بالفئة الحالية`);
                        }
                        setShowAddonForm(false);
                      }}
                      className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      {editingAddonId ? 'حفظ التعديلات' : 'إضافة وربط بالفئة'}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {masterAddons.map((addon) => {
                  const res = getInheritance(addon);
                  return (
                    <div
                      key={addon.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white">{addon.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                            {addon.category}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-300">
                            {addon.suggestedPriceEGP} ج.م / €{addon.suggestedPriceEUR}
                          </span>
                          <InheritanceBadge res={res} />
                        </div>
                        {addon.description && (
                          <p className="text-[11px] text-slate-400 truncate">{addon.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                        {res.status === 'direct' ? (
                          <button
                            type="button"
                            onClick={() => toggleAddonLink(addon, 'clear')}
                            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-rose-300 cursor-pointer"
                          >
                            فك الربط
                          </button>
                        ) : res.status === 'inherited' ? (
                          <button
                            type="button"
                            onClick={() => toggleAddonLink(addon, 'exclude')}
                            className="px-2.5 py-1 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 cursor-pointer"
                          >
                            استثناء للفرع
                          </button>
                        ) : res.status === 'excluded' ? (
                          <button
                            type="button"
                            onClick={() => toggleAddonLink(addon, 'clear')}
                            className="px-2.5 py-1 rounded bg-slate-900 border border-emerald-500/40 text-emerald-300 cursor-pointer"
                          >
                            إلغاء الاستثناء
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleAddonLink(addon, 'link')}
                            className="px-2.5 py-1 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-bold cursor-pointer"
                          >
                            + ربط بالفئة
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddonId(addon.id);
                            setAddonTitle(addon.title);
                            setAddonCategory(addon.category);
                            setAddonUnit(addon.unitLabel);
                            setAddonPriceEGP(String(addon.suggestedPriceEGP));
                            setAddonPriceEUR(String(addon.suggestedPriceEUR));
                            setAddonDesc(addon.description);
                            setShowAddonForm(true);
                          }}
                          className="p-1.5 rounded bg-slate-900 text-cyan-300 border border-slate-800 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteMasterAddon(addon.id)}
                          className="p-1.5 rounded bg-slate-900 text-rose-400 border border-slate-800 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: Comprehensive Filterable/Sortable Multi-Select Table    */}
          {/* ============================================================== */}
          {activeTab === 'table' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    جدول المكتبة الشاملة — الفلترة والربط الجماعي بالفئة ({effectiveSelectedCategory?.name})
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ابحث وفلتر حسب النوع أو حالة الربط، وحدد عناصر متعددة للربط أو الاستثناء دفعة واحدة.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-cyan-300">
                  {filteredSortedTableRows.length} سجل معروض
                </span>
              </div>

              {/* Filter Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="relative sm:col-span-2">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="بحث بالاسم أو الوصف..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-2 text-white"
                  />
                </div>
                <select
                  value={tableDomainFilter}
                  onChange={(e) => setTableDomainFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200"
                >
                  <option value="all">كل أنواع السجلات</option>
                  <option value="spec_group">مجموعات المواصفات</option>
                  <option value="custom_spec">خصائص النشاط</option>
                  <option value="eq_prop">خصائص المعدات</option>
                  <option value="inclusion">ما يشمله / لا يشمله</option>
                  <option value="eq_type">أنواع المعدات</option>
                  <option value="addon">الإضافات المدفوعة</option>
                </select>
                <select
                  value={tableLinkFilter}
                  onChange={(e) => setTableLinkFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200"
                >
                  <option value="all">كل حالات الربط</option>
                  <option value="compatible">المتوافق مع الفئة (مباشر + موروث)</option>
                  <option value="direct">مرتبط مباشرة فقط</option>
                  <option value="inherited">موروث من الأب فقط</option>
                  <option value="excluded">مستثنى لهذا الفرع</option>
                  <option value="none">غير مرتبط بالفئة</option>
                </select>
              </div>

              {/* Multi-select Bulk Actions Bar */}
              {selectedTableUids.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-cyan-950/50 border border-cyan-500/40 rounded-xl px-3.5 py-2 text-xs">
                  <span className="font-bold text-cyan-200">
                    تم تحديد {selectedTableUids.length} سجل — إجراء جماعي على فئة «{effectiveSelectedCategory?.name}»:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBulkLinkAction('link')}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                    >
                      ربط المحدد بالفئة
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkLinkAction('exclude')}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                    >
                      استثناء المحدد
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkLinkAction('clear')}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
                    >
                      فك الربط/الاستثناء
                    </button>
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 w-8">
                        <input
                          type="checkbox"
                          checked={
                            filteredSortedTableRows.length > 0 &&
                            filteredSortedTableRows.every((r) => selectedTableUids.includes(r.uid))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTableUids(filteredSortedTableRows.map((r) => r.uid));
                            } else {
                              setSelectedTableUids([]);
                            }
                          }}
                        />
                      </th>
                      <th className="p-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setTableSortBy('title');
                            setTableSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                          }}
                          className="inline-flex items-center gap-1 font-bold hover:text-cyan-300 cursor-pointer"
                        >
                          <span>العنصر</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="p-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setTableSortBy('type');
                            setTableSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                          }}
                          className="inline-flex items-center gap-1 font-bold hover:text-cyan-300 cursor-pointer"
                        >
                          <span>النطاق</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="p-2.5">حالة التوريث والعلاقة بالفئة</th>
                      <th className="p-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setTableSortBy('linked');
                            setTableSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                          }}
                          className="inline-flex items-center gap-1 font-bold hover:text-cyan-300 cursor-pointer"
                        >
                          <span>روابط</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredSortedTableRows.map((row) => {
                      const isChecked = selectedTableUids.includes(row.uid);
                      return (
                        <tr
                          key={row.uid}
                          className={isChecked ? 'bg-cyan-950/20' : 'hover:bg-slate-900/50'}
                        >
                          <td className="p-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setSelectedTableUids((prev) =>
                                  prev.includes(row.uid)
                                    ? prev.filter((u) => u !== row.uid)
                                    : [...prev, row.uid]
                                )
                              }
                            />
                          </td>
                          <td className="p-2.5">
                            <div className="font-bold text-white">{row.title}</div>
                            <div className="text-[10px] text-slate-400">{row.subtitle}</div>
                          </td>
                          <td className="p-2.5 text-slate-300">{row.entityTypeLabel}</td>
                          <td className="p-2.5">
                            <InheritanceBadge res={row.inheritance} />
                          </td>
                          <td className="p-2.5 font-mono text-cyan-300">{row.linkedCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: Manufacturers, Models & Equipment Unit Kinds            */}
          {/* ============================================================== */}
          {activeTab === 'manufacturers' && (() => {
            const isLogisticsDomain = catalogDomain === 'logistics';
            const domainUnitKinds = equipmentUnitKinds.filter(
              (uk) => uk.domainScope === catalogDomain || uk.domainScope === 'both'
            );
            const activeUnitKind =
              selectedUnitKindId
                ? domainUnitKinds.find((uk) => uk.id === selectedUnitKindId) || null
                : null;

            const domainManufacturers = manufacturers.filter(
              (m) => m.applicableTo === 'both' || m.applicableTo === catalogDomain
            );

            const visibleManufacturers = activeUnitKind
              ? domainManufacturers.filter((m) =>
                  (m.linkedUnitKindIds ?? []).includes(activeUnitKind.id)
                )
              : domainManufacturers;

            const unlinkedManufacturersForKind = activeUnitKind
              ? domainManufacturers.filter(
                  (m) => !(m.linkedUnitKindIds ?? []).includes(activeUnitKind.id)
                )
              : [];

            const activeMfg =
              visibleManufacturers.find((m) => m.id === selectedMfgId) ||
              visibleManufacturers[0] ||
              null;

            const activeMfgModels = activeMfg
              ? manufacturerModels.filter(
                  (mdl) =>
                    mdl.manufacturerId === activeMfg.id &&
                    (mdl.applicableTo === 'both' || mdl.applicableTo === catalogDomain) &&
                    (!activeUnitKind || !mdl.unitKindId || mdl.unitKindId === activeUnitKind.id)
                )
              : [];

            const scopeLabel = (s: AssetCatalogScope) =>
              s === 'equipment'
                ? 'معدات'
                : s === 'logistics'
                ? 'نقل وسيارات'
                : 'معدات ونقل';

            return (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Factory className="w-4 h-4 text-cyan-400" />
                      <span>الشركات المصنعة والموديلات وأنواع الوحدات</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      اختر القسم من القائمة أعلاه لعزل المعدات عن اللوجستيات، ثم اختر النوع لعرض الشركات المصنعة وموديلاتها الخاصة به.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
                    <span>
                      {domainUnitKinds.length} {isLogisticsDomain ? 'نوع نقل' : 'نوع معدة'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{domainManufacturers.length} شركة مصنعة</span>
                    <span aria-hidden="true">·</span>
                    <span>{manufacturerModels.length} موديل</span>
                  </div>
                </div>

                {/* Top Isolated Section Selector: Equipment vs Logistics */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="mfg-domain-selector"
                      className="text-xs font-bold text-slate-200 whitespace-nowrap"
                    >
                      اختيار القسم:
                    </label>
                    <select
                      id="mfg-domain-selector"
                      value={catalogDomain}
                      onChange={(e) => {
                        const nextDomain = e.target.value as 'equipment' | 'logistics';
                        setCatalogDomain(nextDomain);
                        setSelectedUnitKindId(null);
                        setSelectedMfgId(null);
                        setLinkExistingMfgId('');
                        setNewMfgScope(nextDomain);
                      }}
                      className="bg-slate-900 border border-cyan-500/40 rounded-lg px-3.5 py-2 text-xs md:text-sm font-bold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="equipment">
                        المعدات (يخت، لانش، مركب، باتش باجي، غوص، سفاري...)
                      </option>
                      <option value="logistics">
                        اللوجستيات — وسائل النقل (سيارات، فان، كوستر، أتوبيسات...)
                      </option>
                    </select>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isLogisticsDomain
                      ? 'يعرض أنواع وسائل النقل والشركات المصنعة للسيارات والحافلات فقط'
                      : 'يعرض أنواع المعدات البحرية والصحراوية وشركاتها المصنعة فقط'}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                  {/* Column 1: Unit Kinds (Isolated per Domain) */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        {isLogisticsDomain ? (
                          <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>
                          {isLogisticsDomain
                            ? 'أنواع وسائل النقل (اللوجستيات)'
                            : 'أنواع المعدات'}
                        </span>
                      </div>
                      {activeUnitKind ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUnitKindId(null);
                            setLinkExistingMfgId('');
                          }}
                          className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                        >
                          عرض كل الأنواع
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          {domainUnitKinds.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
                      {domainUnitKinds.map((uk) => {
                        const isUkSelected = activeUnitKind?.id === uk.id;
                        const linkedMfgCount = domainManufacturers.filter((m) =>
                          (m.linkedUnitKindIds ?? []).includes(uk.id)
                        ).length;
                        return (
                          <div
                            key={uk.id}
                            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                              isUkSelected
                                ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                                : 'bg-slate-900/90 border-slate-800/80 text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            {editingUnitKindId === uk.id ? (
                              <div className="flex-1 flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editingUnitKindName}
                                  onChange={(e) => setEditingUnitKindName(e.target.value)}
                                  className="flex-1 min-w-0 bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-white text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!editingUnitKindName.trim()) return;
                                    onUpdateEquipmentUnitKind?.(uk.id, {
                                      name: editingUnitKindName.trim()
                                    });
                                    setEditingUnitKindId(null);
                                    notify(`✓ تم تحديث النوع «${editingUnitKindName.trim()}»`);
                                  }}
                                  className="px-2 py-1 rounded bg-cyan-600 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  حفظ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUnitKindId(null)}
                                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedUnitKindId(isUkSelected ? null : uk.id);
                                    setLinkExistingMfgId('');
                                  }}
                                  className="flex-1 text-right min-w-0 cursor-pointer"
                                >
                                  <div className="font-semibold text-slate-100 truncate">
                                    {uk.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                                    <span className="font-mono tabular-nums text-cyan-400">
                                      {linkedMfgCount} شركة
                                    </span>
                                    {uk.description && (
                                      <>
                                        <span aria-hidden="true">·</span>
                                        <span className="truncate">{uk.description}</span>
                                      </>
                                    )}
                                  </div>
                                </button>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUnitKindId(uk.id);
                                      setEditingUnitKindName(uk.name);
                                    }}
                                    className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                                    title="تعديل"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteEquipmentUnitKind?.(uk.id);
                                      if (selectedUnitKindId === uk.id) setSelectedUnitKindId(null);
                                      notify(`تم حذف النوع «${uk.name}»`);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Add Bar */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newUnitKindName}
                          onChange={(e) => setNewUnitKindName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newUnitKindName.trim() && onCreateEquipmentUnitKind) {
                              e.preventDefault();
                              const created = onCreateEquipmentUnitKind({
                                name: newUnitKindName.trim(),
                                domainScope: catalogDomain
                              });
                              setSelectedUnitKindId(created.id);
                              setNewUnitKindName('');
                              notify(`✓ تمت إضافة «${created.name}»`);
                            }
                          }}
                          placeholder={
                            isLogisticsDomain
                              ? 'أضف نوع نقل (ليموزين، ميني فان، باص...)'
                              : 'أضف نوع معدة (يخت، لانش، باتش باجي...)'
                          }
                          className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          disabled={!newUnitKindName.trim() || !onCreateEquipmentUnitKind}
                          onClick={() => {
                            if (!newUnitKindName.trim() || !onCreateEquipmentUnitKind) return;
                            const created = onCreateEquipmentUnitKind({
                              name: newUnitKindName.trim(),
                              domainScope: catalogDomain
                            });
                            setSelectedUnitKindId(created.id);
                            setNewUnitKindName('');
                            notify(`✓ تمت إضافة «${created.name}»`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة نوع</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Manufacturers */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white min-w-0">
                        <Car className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">
                          {activeUnitKind
                            ? `شركات: ${activeUnitKind.name}`
                            : isLogisticsDomain
                            ? 'الشركات المصنعة للنقل والسيارات'
                            : 'الشركات المصنعة للمعدات'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                        {visibleManufacturers.length}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                      {visibleManufacturers.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center">
                          {activeUnitKind
                            ? `لا توجد شركات مصنعة مرتبطة بنوع «${activeUnitKind.name}» بعد — أضف أو اربط شركة من الأسفل.`
                            : 'لا توجد شركات مصنعة مسجلة في هذا القسم.'}
                        </p>
                      ) : (
                        visibleManufacturers.map((mfg) => {
                          const isSelected = activeMfg?.id === mfg.id;
                          const modelsCount = manufacturerModels.filter(
                            (mdl) =>
                              mdl.manufacturerId === mfg.id &&
                              (mdl.applicableTo === 'both' || mdl.applicableTo === catalogDomain) &&
                              (!activeUnitKind || !mdl.unitKindId || mdl.unitKindId === activeUnitKind.id)
                          ).length;
                          const linkedKindNames = (mfg.linkedUnitKindIds ?? [])
                            .map((kId) => domainUnitKinds.find((u) => u.id === kId)?.name)
                            .filter(Boolean) as string[];
                          return (
                            <div
                              key={mfg.id}
                              className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                                isSelected
                                  ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                                  : 'bg-slate-900/90 border-slate-800/80 text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              {editingMfgId === mfg.id ? (
                                <div className="flex-1 flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingMfgName}
                                    onChange={(e) => setEditingMfgName(e.target.value)}
                                    className="flex-1 min-w-0 bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-white text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!editingMfgName.trim()) return;
                                      onUpdateManufacturer?.(mfg.id, {
                                        name: editingMfgName.trim()
                                      });
                                      setEditingMfgId(null);
                                      notify(`✓ تم تحديث الشركة «${editingMfgName.trim()}»`);
                                    }}
                                    className="px-2 py-1 rounded bg-cyan-600 text-white text-[10px] font-bold cursor-pointer"
                                  >
                                    حفظ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingMfgId(null)}
                                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedMfgId(mfg.id)}
                                    className="flex-1 text-right min-w-0 cursor-pointer"
                                  >
                                    <div className="font-semibold truncate">{mfg.name}</div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                                      <span>{scopeLabel(mfg.applicableTo)}</span>
                                      <span aria-hidden="true">·</span>
                                      <span className="font-mono tabular-nums text-cyan-400">
                                        {modelsCount} موديل
                                      </span>
                                      {!activeUnitKind && linkedKindNames.length > 0 && (
                                        <>
                                          <span aria-hidden="true">·</span>
                                          <span className="truncate text-slate-300">
                                            {linkedKindNames.join('، ')}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </button>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {activeUnitKind && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextIds = (mfg.linkedUnitKindIds ?? []).filter(
                                            (id) => id !== activeUnitKind.id
                                          );
                                          onUpdateManufacturer?.(mfg.id, {
                                            linkedUnitKindIds: nextIds
                                          });
                                          notify(
                                            `تم فك ربط «${mfg.name}» من نوع «${activeUnitKind.name}»`
                                          );
                                        }}
                                        className="p-1 text-slate-400 hover:text-amber-300 cursor-pointer"
                                        title={`فك ربط الشركة من ${activeUnitKind.name}`}
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMfgId(mfg.id);
                                        setEditingMfgName(mfg.name);
                                      }}
                                      className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                                      title="تعديل"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteManufacturer?.(mfg.id);
                                        if (selectedMfgId === mfg.id) setSelectedMfgId(null);
                                        notify(`تم حذف الشركة المصنعة «${mfg.name}»`);
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                      title="حذف"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Link existing manufacturer to selected unit kind */}
                    {activeUnitKind && unlinkedManufacturersForKind.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                        <select
                          value={linkExistingMfgId}
                          onChange={(e) => setLinkExistingMfgId(e.target.value)}
                          className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                        >
                          <option value="">-- ربط شركة مسجلة بنوع «{activeUnitKind.name}» --</option>
                          {unlinkedManufacturersForKind.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!linkExistingMfgId || !onUpdateManufacturer}
                          onClick={() => {
                            const target = manufacturers.find((m) => m.id === linkExistingMfgId);
                            if (!target || !onUpdateManufacturer) return;
                            const nextIds = Array.from(
                              new Set([...(target.linkedUnitKindIds ?? []), activeUnitKind.id])
                            );
                            onUpdateManufacturer(target.id, { linkedUnitKindIds: nextIds });
                            setSelectedMfgId(target.id);
                            setLinkExistingMfgId('');
                            notify(`✓ تم ربط «${target.name}» بنوع «${activeUnitKind.name}»`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                        >
                          ربط
                        </button>
                      </div>
                    )}

                    {/* Bottom Add Manufacturer Bar */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newMfgName}
                          onChange={(e) => setNewMfgName(e.target.value)}
                          placeholder={
                            activeUnitKind
                              ? `أضف شركة لنوع «${activeUnitKind.name}»...`
                              : isLogisticsDomain
                              ? 'اسم شركة النقل (مثال: كيا، مرسيدس...)'
                              : 'اسم شركة المعدات (مثال: Azimut، Yamaha...)'
                          }
                          className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                        <select
                          value={newMfgScope}
                          onChange={(e) => setNewMfgScope(e.target.value as AssetCatalogScope)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                        >
                          <option value={catalogDomain}>
                            {isLogisticsDomain ? 'نقل فقط' : 'معدات فقط'}
                          </option>
                          <option value="both">معدات ونقل</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        disabled={!newMfgName.trim() || !onCreateManufacturer}
                        onClick={() => {
                          if (!newMfgName.trim() || !onCreateManufacturer) return;
                          const created = onCreateManufacturer({
                            name: newMfgName.trim(),
                            applicableTo: newMfgScope,
                            linkedUnitKindIds: activeUnitKind ? [activeUnitKind.id] : []
                          });
                          setSelectedMfgId(created.id);
                          setNewMfgName('');
                          notify(
                            activeUnitKind
                              ? `✓ تمت إضافة «${created.name}» وربطها بنوع «${activeUnitKind.name}»`
                              : `✓ تمت إضافة الشركة المصنعة «${created.name}»`
                          );
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {activeUnitKind
                            ? `إضافة شركة لـ «${activeUnitKind.name}»`
                            : 'إضافة شركة مصنعة'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Column 3: Models for Selected Manufacturer */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="text-xs font-bold text-white truncate">
                        {activeMfg
                          ? activeUnitKind
                            ? `موديلات ${activeMfg.name} (${activeUnitKind.name})`
                            : `موديلات: ${activeMfg.name}`
                          : 'الموديلات'}
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400 tabular-nums">
                        {activeMfgModels.length}
                      </span>
                    </div>

                    {!activeMfg ? (
                      <p className="text-xs text-slate-500 py-8 text-center">
                        اختر شركة مصنعة من العمود الأوسط لعرض وإضافة موديلاتها.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
                          {activeMfgModels.length === 0 ? (
                            <p className="text-xs text-slate-500 py-6 text-center">
                              لا توجد موديلات مسجلة لهذه الشركة في هذا القسم بعد — أضف أول موديل من الأسفل.
                            </p>
                          ) : (
                            activeMfgModels.map((mdl) => (
                              <div
                                key={mdl.id}
                                className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs"
                              >
                                {editingModelId === mdl.id ? (
                                  <div className="flex-1 flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={editingModelName}
                                      onChange={(e) => setEditingModelName(e.target.value)}
                                      className="flex-1 min-w-0 bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-white text-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!editingModelName.trim()) return;
                                        onUpdateManufacturerModel?.(mdl.id, {
                                          name: editingModelName.trim()
                                        });
                                        setEditingModelId(null);
                                        notify(`✓ تم تحديث الموديل «${editingModelName.trim()}»`);
                                      }}
                                      className="px-2 py-1 rounded bg-cyan-600 text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      حفظ
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingModelId(null)}
                                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="font-semibold text-slate-100 truncate">
                                      {mdl.name}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingModelId(mdl.id);
                                          setEditingModelName(mdl.name);
                                        }}
                                        className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                                        title="تعديل"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onDeleteManufacturerModel?.(mdl.id);
                                          notify(`تم حذف الموديل «${mdl.name}»`);
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                        title="حذف"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {/* Bottom Add Model Bar */}
                        <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newModelName}
                            onChange={(e) => setNewModelName(e.target.value)}
                            onKeyDown={(e) => {
                              if (
                                e.key === 'Enter' &&
                                newModelName.trim() &&
                                onCreateManufacturerModel
                              ) {
                                e.preventDefault();
                                const created = onCreateManufacturerModel({
                                  manufacturerId: activeMfg.id,
                                  name: newModelName.trim(),
                                  applicableTo: catalogDomain,
                                  unitKindId: activeUnitKind?.id
                                });
                                setNewModelName('');
                                notify(`✓ تمت إضافة الموديل «${created.name}»`);
                              }
                            }}
                            placeholder={`موديل جديد لـ ${activeMfg.name}...`}
                            className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            type="button"
                            disabled={!newModelName.trim() || !onCreateManufacturerModel}
                            onClick={() => {
                              if (!newModelName.trim() || !onCreateManufacturerModel) return;
                              const created = onCreateManufacturerModel({
                                manufacturerId: activeMfg.id,
                                name: newModelName.trim(),
                                applicableTo: catalogDomain,
                                unitKindId: activeUnitKind?.id
                              });
                              setNewModelName('');
                              notify(`✓ تمت إضافة الموديل «${created.name}»`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة موديل</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* TAB 7: Cascading Countries -> Cities -> Meeting Points        */}
          {/* ============================================================== */}
          {activeTab === 'locations' && (() => {
            const activeCountry =
              countriesRef.find((c) => c.id === selectedCountryId) || countriesRef[0] || null;
            const countryCities = activeCountry
              ? citiesRef.filter((ct) => ct.countryId === activeCountry.id)
              : [];
            const activeCity =
              countryCities.find((ct) => ct.id === selectedCityId) || countryCities[0] || null;
            const cityPoints = activeCity
              ? meetingPointsRef.filter((mp) => mp.cityId === activeCity.id)
              : [];

            return (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span>مرجع البلاد والمدن ونقاط الالتقاء والمواقع</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      قوائم هرمية مرتبطة: الدولة ← المدينة ← نقطة الالتقاء أو موقع التنفيذ، متاحة مباشرة في إنشاء الأنشطة والرحلات واللوجستيات مع زر إضافة تحت كل قائمة.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
                    <span>{countriesRef.length} دولة</span>
                    <span aria-hidden="true">·</span>
                    <span>{citiesRef.length} مدينة</span>
                    <span aria-hidden="true">·</span>
                    <span>{meetingPointsRef.length} نقطة / موقع</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                  {/* Column 1: Countries */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white">1. الدول</span>
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {countriesRef.length}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
                      {countriesRef.map((cnt) => {
                        const isSelected = activeCountry?.id === cnt.id;
                        const citiesCount = citiesRef.filter(
                          (ct) => ct.countryId === cnt.id
                        ).length;
                        return (
                          <div
                            key={cnt.id}
                            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                              isSelected
                                ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                                : 'bg-slate-900/90 border-slate-800/80 text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            {editingCountryId === cnt.id ? (
                              <div className="flex-1 flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editingCountryName}
                                  onChange={(e) => setEditingCountryName(e.target.value)}
                                  className="flex-1 min-w-0 bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-white text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!editingCountryName.trim()) return;
                                    onUpdateCountryRef?.(cnt.id, {
                                      name: editingCountryName.trim()
                                    });
                                    setEditingCountryId(null);
                                    notify(`✓ تم تحديث اسم الدولة «${editingCountryName.trim()}»`);
                                  }}
                                  className="px-2 py-1 rounded bg-cyan-600 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  حفظ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCountryId(null)}
                                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountryId(cnt.id);
                                    setSelectedCityId(null);
                                  }}
                                  className="flex-1 text-right min-w-0 cursor-pointer"
                                >
                                  <div className="font-semibold truncate">{cnt.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                                    {citiesCount} مدينة
                                  </div>
                                </button>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCountryId(cnt.id);
                                      setEditingCountryName(cnt.name);
                                    }}
                                    className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                                    title="تعديل"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteCountryRef?.(cnt.id);
                                      if (selectedCountryId === cnt.id) setSelectedCountryId(null);
                                      notify(`تم حذف الدولة «${cnt.name}»`);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newCountryName}
                        onChange={(e) => setNewCountryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newCountryName.trim() && onCreateCountryRef) {
                            e.preventDefault();
                            const created = onCreateCountryRef({ name: newCountryName.trim() });
                            setSelectedCountryId(created.id);
                            setSelectedCityId(null);
                            setNewCountryName('');
                            notify(`✓ تمت إضافة دولة «${created.name}»`);
                          }
                        }}
                        placeholder="أضف دولة جديدة..."
                        className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        disabled={!newCountryName.trim() || !onCreateCountryRef}
                        onClick={() => {
                          if (!newCountryName.trim() || !onCreateCountryRef) return;
                          const created = onCreateCountryRef({ name: newCountryName.trim() });
                          setSelectedCountryId(created.id);
                          setSelectedCityId(null);
                          setNewCountryName('');
                          notify(`✓ تمت إضافة دولة «${created.name}»`);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة دولة</span>
                      </button>
                    </div>
                  </div>

                  {/* Column 2: Cities for Selected Country */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white truncate">
                        {activeCountry ? `2. مدن ${activeCountry.name}` : '2. المدن'}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400 tabular-nums">
                        {countryCities.length}
                      </span>
                    </div>

                    {!activeCountry ? (
                      <p className="text-xs text-slate-500 py-8 text-center">
                        اختر دولة لعرض وإضافة مدنها.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
                          {countryCities.length === 0 ? (
                            <p className="text-xs text-slate-500 py-6 text-center">
                              لا توجد مدن مسجلة في {activeCountry.name} بعد.
                            </p>
                          ) : (
                            countryCities.map((ct) => {
                              const isSelected = activeCity?.id === ct.id;
                              const ptsCount = meetingPointsRef.filter(
                                (mp) => mp.cityId === ct.id
                              ).length;
                              return (
                                <div
                                  key={ct.id}
                                  className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                                    isSelected
                                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                                      : 'bg-slate-900/90 border-slate-800/80 text-slate-200 hover:border-slate-700'
                                  }`}
                                >
                                  {editingCityId === ct.id ? (
                                    <div className="flex-1 flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={editingCityName}
                                        onChange={(e) => setEditingCityName(e.target.value)}
                                        className="flex-1 min-w-0 bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-white text-xs"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!editingCityName.trim()) return;
                                          onUpdateCityRef?.(ct.id, {
                                            name: editingCityName.trim()
                                          });
                                          setEditingCityId(null);
                                          notify(`✓ تم تحديث مدينة «${editingCityName.trim()}»`);
                                        }}
                                        className="px-2 py-1 rounded bg-cyan-600 text-white text-[10px] font-bold cursor-pointer"
                                      >
                                        حفظ
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingCityId(null)}
                                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedCityId(ct.id)}
                                        className="flex-1 text-right min-w-0 cursor-pointer"
                                      >
                                        <div className="font-semibold truncate">{ct.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                                          {ptsCount} نقطة التقاء
                                        </div>
                                      </button>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingCityId(ct.id);
                                            setEditingCityName(ct.name);
                                          }}
                                          className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                                          title="تعديل"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onDeleteCityRef?.(ct.id);
                                            if (selectedCityId === ct.id) setSelectedCityId(null);
                                            notify(`تم حذف مدينة «${ct.name}»`);
                                          }}
                                          className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                          title="حذف"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newCityName}
                            onChange={(e) => setNewCityName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newCityName.trim() && onCreateCityRef) {
                                e.preventDefault();
                                const created = onCreateCityRef({
                                  countryId: activeCountry.id,
                                  name: newCityName.trim()
                                });
                                setSelectedCityId(created.id);
                                setNewCityName('');
                                notify(`✓ تمت إضافة مدينة «${created.name}»`);
                              }
                            }}
                            placeholder={`أضف مدينة في ${activeCountry.name}...`}
                            className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            type="button"
                            disabled={!newCityName.trim() || !onCreateCityRef}
                            onClick={() => {
                              if (!newCityName.trim() || !onCreateCityRef) return;
                              const created = onCreateCityRef({
                                countryId: activeCountry.id,
                                name: newCityName.trim()
                              });
                              setSelectedCityId(created.id);
                              setNewCityName('');
                              notify(`✓ تمت إضافة مدينة «${created.name}»`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة مدينة</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Column 3: Meeting Points & Sites for Selected City */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">
                          {activeCity ? `3. نقاط التقاء ${activeCity.name}` : '3. نقاط الالتقاء'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 tabular-nums">
                        {cityPoints.length}
                      </span>
                    </div>

                    {!activeCity ? (
                      <p className="text-xs text-slate-500 py-8 text-center">
                        اختر مدينة لعرض وإضافة نقاط الالتقاء ومواقع التنفيذ الخاصة بها.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
                          {cityPoints.length === 0 ? (
                            <p className="text-xs text-slate-500 py-6 text-center">
                              لا توجد نقاط التقاء مسجلة لمدينة {activeCity.name} بعد.
                            </p>
                          ) : (
                            cityPoints.map((mp) => (
                              <div
                                key={mp.id}
                                className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs"
                              >
                                {editingMeetingPointId === mp.id ? (
                                  <div className="flex-1 flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={editingMeetingPointName}
                                      onChange={(e) => setEditingMeetingPointName(e.target.value)}
                                      className="flex-1 min-w-0 bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-white text-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!editingMeetingPointName.trim()) return;
                                        onUpdateMeetingPointRef?.(mp.id, {
                                          name: editingMeetingPointName.trim()
                                        });
                                        setEditingMeetingPointId(null);
                                        notify(
                                          `✓ تم تحديث نقطة الالتقاء «${editingMeetingPointName.trim()}»`
                                        );
                                      }}
                                      className="px-2 py-1 rounded bg-cyan-600 text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      حفظ
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingMeetingPointId(null)}
                                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="font-semibold text-slate-100 truncate">
                                      {mp.name}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMeetingPointId(mp.id);
                                          setEditingMeetingPointName(mp.name);
                                        }}
                                        className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                                        title="تعديل"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onDeleteMeetingPointRef?.(mp.id);
                                          notify(`تم حذف نقطة الالتقاء «${mp.name}»`);
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                        title="حذف"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newMeetingPointName}
                            onChange={(e) => setNewMeetingPointName(e.target.value)}
                            onKeyDown={(e) => {
                              if (
                                e.key === 'Enter' &&
                                newMeetingPointName.trim() &&
                                onCreateMeetingPointRef
                              ) {
                                e.preventDefault();
                                const created = onCreateMeetingPointRef({
                                  countryId: activeCity.countryId,
                                  cityId: activeCity.id,
                                  name: newMeetingPointName.trim(),
                                  pointType: 'both'
                                });
                                setNewMeetingPointName('');
                                notify(`✓ تمت إضافة نقطة الالتقاء «${created.name}»`);
                              }
                            }}
                            placeholder={`نقطة التقاء جديدة في ${activeCity.name}...`}
                            className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            type="button"
                            disabled={!newMeetingPointName.trim() || !onCreateMeetingPointRef}
                            onClick={() => {
                              if (!newMeetingPointName.trim() || !onCreateMeetingPointRef) return;
                              const created = onCreateMeetingPointRef({
                                countryId: activeCity.countryId,
                                cityId: activeCity.id,
                                name: newMeetingPointName.trim(),
                                pointType: 'both'
                              });
                              setNewMeetingPointName('');
                              notify(`✓ تمت إضافة نقطة الالتقاء «${created.name}»`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة نقطة</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
};
