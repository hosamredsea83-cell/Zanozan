import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Activity, CategoryRecord } from '../../types/activity';
import { activityBelongsToOwner } from '../../db/localActivitiesDb';
import type {
  EquipmentItem,
  EquipmentMediaItem,
  EquipmentPropertyItem,
  EquipmentSpecFieldType,
  EquipmentSpecFieldValue,
  EquipmentStatus,
  EquipmentTypeDefinition
} from '../../types/equipment';
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
import type { Asset } from '../MediaUploadSection';
import { StandardMediaUploader } from '../shared/StandardMediaUploader';
import { ReferenceSelectWithAdd } from '../shared/ReferenceSelectWithAdd';
import { EquipmentOwnershipSyncField } from './EquipmentOwnershipSyncField';
import { buildDynamicSpecsFromType, STATUS_META } from './equipmentHelpers';
import {
  evaluateCategoryInheritance,
  isInheritanceCompatible,
  resolveCategoryAncestorChain,
  resolveCategoryByPath,
  resolveEquipmentSpecsForForm,
  type ResolvedEquipmentLibGroup
} from '../../utils/masterReferenceResolver';
import {
  Building2,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  FolderTree,
  Globe,
  Languages,
  Link2,
  Plus,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Video,
  X
} from 'lucide-react';

interface EquipmentFormProps {
  editingEquipment: EquipmentItem;
  setEditingEquipment: React.Dispatch<React.SetStateAction<EquipmentItem | null>>;
  isNewMode: boolean;
  activities?: Activity[];
  equipmentTypes: EquipmentTypeDefinition[];
  equipmentProperties?: EquipmentPropertyItem[];
  specGroups?: SpecGroupRecord[];
  categoryRecords?: CategoryRecord[];
  categoryValidationError?: string | null;
  onClearCategoryValidationError?: () => void;
  onNavigateToEquipmentProperties?: () => void;
  currentUser: AppUser;
  partners: PartnerRecord[];
  personProfiles?: PersonProfile[];
  onOpenPartnersRegistry: () => void;
  onEquipmentTypeChange?: (newTypeId: string) => void;
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
  onAddNewActivityFromForm?: (presetCategoryPath: string[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const STATUS_DESCRIPTIONS: Record<EquipmentStatus, string> = {
  available: 'المعدة متاحة للربط المباشر بالأنشطة والرحلات وتظهر للعميل إذا كان خيار العرض العام مفعلاً.',
  in_use: 'المعدة مشغولة حالياً ضمن نشاط أو رحلة جارية، مع استمرار ظهورها في الأنشطة المرتبطة.',
  maintenance: 'المعدة في الصيانة الدورية — تنبيه تشغيلي داخلي للمالك والطاقم.',
  inactive: 'المعدة موقوفة مؤقتاً ولا تظهر على بطاقات العميل النهائي حتى إعادة تفعيلها.'
};

export const EquipmentForm: React.FC<EquipmentFormProps> = ({
  editingEquipment,
  setEditingEquipment,
  isNewMode,
  activities = [],
  equipmentTypes,
  equipmentProperties = [],
  specGroups = [],
  categoryRecords = [],
  categoryValidationError = null,
  onClearCategoryValidationError,
  onNavigateToEquipmentProperties,
  currentUser,
  partners,
  personProfiles = [],
  onOpenPartnersRegistry,
  onEquipmentTypeChange,
  equipmentUnitKinds = [],
  manufacturers = [],
  manufacturerModels = [],
  onCreateEquipmentUnitKind,
  onCreateManufacturer,
  onCreateManufacturerModel,
  onAddNewActivityFromForm,
  onSubmit,
  onCancel
}) => {
  const [customSpecLabel, setCustomSpecLabel] = useState('');
  const [customSpecType, setCustomSpecType] = useState<EquipmentSpecFieldType>('text');
  const [customSpecUnit, setCustomSpecUnit] = useState('');
  const [customSpecValue, setCustomSpecValue] = useState('');
  const [customSpecPublic, setCustomSpecPublic] = useState(true);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newExtraLabel, setNewExtraLabel] = useState('');
  const [newExtraValue, setNewExtraValue] = useState('');
  const [newExtraPublic, setNewExtraPublic] = useState(true);

  const [catSearchQuery, setCatSearchQuery] = useState('');
  const [isCatListOpen, setIsCatListOpen] = useState(false);
  const catPickerRef = useRef<HTMLDivElement>(null);

  const [activeLibGroupId, setActiveLibGroupId] = useState<string | null>(null);
  const [activityLinkTab, setActivityLinkTab] = useState<'owner' | 'general'>('owner');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [filterActivitiesByEqCategory, setFilterActivitiesByEqCategory] = useState(true);

  // Instant translation state
  const [isInstantTranslating, setIsInstantTranslating] = useState(false);
  const [translateDirection, setTranslateDirection] = useState<'ar_to_en' | 'en_to_ar'>('ar_to_en');
  const [translateFeedback, setTranslateFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const translationCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isCatListOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (catPickerRef.current && !catPickerRef.current.contains(event.target as Node)) {
        setIsCatListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCatListOpen]);

  const categoryOptions = useMemo(() => {
    const byId = new Map(categoryRecords.map((r) => [r.id, r]));
    return categoryRecords.map((rec) => {
      const names: string[] = [];
      const visited = new Set<string>();
      let curr: CategoryRecord | undefined = rec;
      while (curr && !visited.has(curr.id)) {
        visited.add(curr.id);
        names.unshift(curr.name);
        curr = curr.parentId ? byId.get(curr.parentId) : undefined;
      }
      return {
        record: rec,
        fullPath: names.join(' ← ')
      };
    });
  }, [categoryRecords]);

  const filteredCategoryOptions = useMemo(() => {
    const q = catSearchQuery.trim().toLowerCase();
    if (!q) return categoryOptions;
    return categoryOptions.filter(
      (opt) =>
        opt.record.name.toLowerCase().includes(q) ||
        opt.fullPath.toLowerCase().includes(q) ||
        opt.record.description.toLowerCase().includes(q)
    );
  }, [categoryOptions, catSearchQuery]);

  const selectedCategoryIds = editingEquipment.linkedCategoryIds || [];
  const linkedActivityIds = editingEquipment.linkedActivityIds || [];

  const myOwnedActivities = useMemo(
    () => activities.filter((act) => activityBelongsToOwner(act, currentUser)),
    [activities, currentUser]
  );

  const selectedCategoryMatchInfo = useMemo(() => {
    const ancestorIds = new Set<string>();
    const branchNames = new Set<string>();
    const selectedIdSet = new Set(selectedCategoryIds);

    selectedCategoryIds.forEach((catId) => {
      const chain = resolveCategoryAncestorChain(catId, categoryRecords);
      chain.forEach((rec) => {
        ancestorIds.add(rec.id);
        if (rec.name?.trim()) branchNames.add(rec.name.trim().toLowerCase());
      });
    });

    // Include descendants of any selected category so parent selection surfaces child-category activities
    const childrenByParent = new Map<string, CategoryRecord[]>();
    categoryRecords.forEach((rec) => {
      if (rec.parentId) {
        const list = childrenByParent.get(rec.parentId) || [];
        list.push(rec);
        childrenByParent.set(rec.parentId, list);
      }
    });
    const queue = [...selectedCategoryIds];
    const descendantIds = new Set<string>();
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const children = childrenByParent.get(curr) || [];
      children.forEach((child) => {
        if (!descendantIds.has(child.id)) {
          descendantIds.add(child.id);
          if (child.name?.trim()) branchNames.add(child.name.trim().toLowerCase());
          queue.push(child.id);
        }
      });
    }

    const firstCategoryPath =
      selectedCategoryIds.length > 0
        ? resolveCategoryAncestorChain(selectedCategoryIds[0], categoryRecords)
            .slice()
            .reverse()
            .map((r) => r.name)
        : [];

    const selectedNamesLabel = selectedCategoryIds
      .map((id) => categoryRecords.find((r) => r.id === id)?.name)
      .filter(Boolean)
      .join(' · ');

    return {
      selectedIdSet,
      ancestorIds,
      descendantIds,
      branchNames,
      firstCategoryPath,
      selectedNamesLabel
    };
  }, [selectedCategoryIds, categoryRecords]);

  const matchesEquipmentCategory = (act: Activity) => {
    if (selectedCategoryIds.length === 0) return false;
    const actCat = resolveCategoryByPath(act.categoryPath || [], categoryRecords);
    if (actCat) {
      if (
        selectedCategoryMatchInfo.selectedIdSet.has(actCat.id) ||
        selectedCategoryMatchInfo.ancestorIds.has(actCat.id) ||
        selectedCategoryMatchInfo.descendantIds.has(actCat.id)
      ) {
        return true;
      }
      const actChain = resolveCategoryAncestorChain(actCat.id, categoryRecords);
      if (actChain.some((r) => selectedCategoryMatchInfo.selectedIdSet.has(r.id))) {
        return true;
      }
    }
    const actCats = (act.categoryPath || []).map((seg) => seg.trim().toLowerCase());
    return actCats.some((seg) => selectedCategoryMatchInfo.branchNames.has(seg));
  };

  const categoryScopedOwnerActivities = useMemo(
    () =>
      filterActivitiesByEqCategory
        ? myOwnedActivities.filter(matchesEquipmentCategory)
        : myOwnedActivities,
    [myOwnedActivities, filterActivitiesByEqCategory, selectedCategoryIds, selectedCategoryMatchInfo, categoryRecords]
  );

  const categoryScopedAllActivities = useMemo(
    () =>
      filterActivitiesByEqCategory
        ? activities.filter(matchesEquipmentCategory)
        : activities,
    [activities, filterActivitiesByEqCategory, selectedCategoryIds, selectedCategoryMatchInfo, categoryRecords]
  );

  const visibleActivitiesForLink = useMemo(() => {
    const base =
      activityLinkTab === 'owner' ? categoryScopedOwnerActivities : categoryScopedAllActivities;
    const q = activitySearchQuery.trim().toLowerCase();
    return base.filter((act) => {
      if (!q) return true;
      return (
        act.name.toLowerCase().includes(q) ||
        (act.translations?.en?.name || '').toLowerCase().includes(q) ||
        act.id.toLowerCase().includes(q) ||
        (act.location?.city || '').toLowerCase().includes(q) ||
        (act.categoryPath || []).join(' ').toLowerCase().includes(q) ||
        (act.owner?.name || '').toLowerCase().includes(q) ||
        (act.owner?.companyName || '').toLowerCase().includes(q)
      );
    });
  }, [
    activityLinkTab,
    categoryScopedOwnerActivities,
    categoryScopedAllActivities,
    activitySearchQuery
  ]);

  const linkedActivitiesBreakdown = useMemo(() => {
    const ownIdSet = new Set(myOwnedActivities.map((a) => a.id));
    let ownCount = 0;
    let generalCount = 0;
    linkedActivityIds.forEach((id) => {
      if (ownIdSet.has(id)) ownCount += 1;
      else generalCount += 1;
    });
    return { ownCount, generalCount };
  }, [linkedActivityIds, myOwnedActivities]);

  const handleToggleActivityLink = (activityId: string) => {
    setEditingEquipment((prev) => {
      if (!prev) return prev;
      const current = prev.linkedActivityIds || [];
      const exists = current.includes(activityId);
      return {
        ...prev,
        linkedActivityIds: exists
          ? current.filter((id) => id !== activityId)
          : [...current, activityId]
      };
    });
  };

  const handleSelectAllVisibleActivities = () => {
    const visibleIds = visibleActivitiesForLink.map((a) => a.id);
    if (visibleIds.length === 0) return;
    setEditingEquipment((prev) => {
      if (!prev) return prev;
      const merged = new Set([...(prev.linkedActivityIds || []), ...visibleIds]);
      return { ...prev, linkedActivityIds: Array.from(merged) };
    });
  };

  const handleClearVisibleActivities = () => {
    const visibleSet = new Set(visibleActivitiesForLink.map((a) => a.id));
    setEditingEquipment((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        linkedActivityIds: (prev.linkedActivityIds || []).filter((id) => !visibleSet.has(id))
      };
    });
  };

  const equipmentOnlyUnitKinds = useMemo(
    () =>
      equipmentUnitKinds.filter(
        (uk) => uk.isActive && (uk.domainScope === 'equipment' || uk.domainScope === 'both')
      ),
    [equipmentUnitKinds]
  );

  const selectedUnitKind = useMemo(
    () =>
      equipmentOnlyUnitKinds.find(
        (uk) =>
          uk.name.trim().toLowerCase() ===
          (editingEquipment.classification || '').trim().toLowerCase()
      ) ?? null,
    [equipmentOnlyUnitKinds, editingEquipment.classification]
  );

  const buildDynamicSpecsFromLibGroups = (groups: ResolvedEquipmentLibGroup[]) =>
    groups
      .filter((g) => g.properties.length > 0)
      .map((g) => ({
        groupId: g.group.id,
        title: g.group.name,
        fields: g.properties.map((p) => ({
          fieldId: p.id,
          key: p.key,
          label: p.label,
          type: p.type,
          unit: p.unit,
          options: p.options,
          value:
            p.type === 'boolean'
              ? false
              : p.type === 'multi_choice'
              ? []
              : p.type === 'number'
              ? 0
              : p.options?.[0] ?? '',
          isRequired: p.isMandatoryDefault,
          isPublicForClient: p.isPublicDefault
        }))
      }));

  // Resolve compatible equipment_library spec groups & properties by selected unit kind and categories
  const compatibleLibraryGroups = useMemo<ResolvedEquipmentLibGroup[]>(
    () =>
      resolveEquipmentSpecsForForm({
        selectedUnitKindId: selectedUnitKind?.id ?? null,
        selectedCategoryIds,
        categoryRecords,
        specGroups,
        equipmentProperties
      }),
    [selectedUnitKind?.id, selectedCategoryIds, categoryRecords, specGroups, equipmentProperties]
  );

  const compatibleEquipmentTypes = useMemo(() => {
    if (selectedCategoryIds.length === 0) return equipmentTypes;
    const chainsBySelected = selectedCategoryIds.map((catId) => ({
      catId,
      chain: resolveCategoryAncestorChain(catId, categoryRecords)
    }));
    const matched = equipmentTypes.filter((eqType) =>
      chainsBySelected.some((entry) =>
        isInheritanceCompatible(evaluateCategoryInheritance(eqType, entry.catId, entry.chain))
      )
    );
    return matched.length > 0 ? matched : equipmentTypes;
  }, [selectedCategoryIds, categoryRecords, equipmentTypes]);

  const selectedLibraryGroup = activeLibGroupId
    ? compatibleLibraryGroups.find((g) => g.group.id === activeLibGroupId) ?? null
    : null;

  useEffect(() => {
    if (activeLibGroupId && !compatibleLibraryGroups.some((g) => g.group.id === activeLibGroupId)) {
      setActiveLibGroupId(null);
    }
  }, [activeLibGroupId, compatibleLibraryGroups]);

  const handleInstantTranslate = async () => {
    const arName = editingEquipment.name.trim();
    const arDesc = editingEquipment.description.trim();
    const enName = editingEquipment.translations?.en?.name?.trim() || '';
    const enDesc = editingEquipment.translations?.en?.description?.trim() || '';

    const isArToEn = translateDirection === 'ar_to_en';
    const sourceLang: 'ar' | 'en' = isArToEn ? 'ar' : 'en';
    const targetLang: 'ar' | 'en' = isArToEn ? 'en' : 'ar';

    const items: Array<{ key: 'name' | 'description'; text: string }> = [];
    if (isArToEn) {
      if (arName) items.push({ key: 'name', text: arName });
      if (arDesc) items.push({ key: 'description', text: arDesc });
      if (items.length === 0) {
        setTranslateFeedback({
          type: 'error',
          message: 'يرجى كتابة اسم المعدة أو وصفها بالعربية أولاً للترجمة إلى الإنجليزية'
        });
        return;
      }
    } else {
      if (enName) items.push({ key: 'name', text: enName });
      if (enDesc) items.push({ key: 'description', text: enDesc });
      if (items.length === 0) {
        setTranslateFeedback({
          type: 'error',
          message: 'يرجى كتابة اسم المعدة أو وصفها بالإنجليزية أولاً للترجمة إلى العربية'
        });
        return;
      }
    }

    const cache = translationCacheRef.current;
    const resolvedMap: Record<string, string> = {};
    const uncachedItems: Array<{ key: 'name' | 'description'; text: string }> = [];

    for (const item of items) {
      const cacheKey = `${sourceLang}:${targetLang}:${item.text}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        resolvedMap[item.key] = cached;
      } else {
        uncachedItems.push(item);
      }
    }

    const applyTranslations = (map: Record<string, string>) => {
      setEditingEquipment((prev) => {
        if (!prev) return prev;
        if (isArToEn) {
          return {
            ...prev,
            translations: {
              ...prev.translations,
              en: {
                name: map.name?.trim() || prev.translations?.en?.name || '',
                description: map.description?.trim() || prev.translations?.en?.description || ''
              }
            }
          };
        }
        return {
          ...prev,
          name: map.name?.trim() || prev.name,
          description: map.description?.trim() || prev.description
        };
      });
      setTranslateFeedback({
        type: 'success',
        message: isArToEn
          ? 'تمت الترجمة الفورية لاسم المعدة ووصفها إلى الإنجليزية'
          : 'تمت الترجمة الفورية لاسم المعدة ووصفها إلى العربية'
      });
    };

    if (uncachedItems.length === 0) {
      applyTranslations(resolvedMap);
      return;
    }

    setIsInstantTranslating(true);
    setTranslateFeedback(null);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 9000);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ items: uncachedItems, sourceLang, targetLang })
      });

      const rawBody = await response.text();
      let data: { translations?: Record<string, string>; error?: string } = {};
      if (rawBody) {
        try {
          data = JSON.parse(rawBody) as {
            translations?: Record<string, string>;
            error?: string;
          };
        } catch {
          throw new Error(`استجابة غير صالحة من خادم الترجمة (${response.status})`);
        }
      }

      if (!response.ok || !data.translations) {
        throw new Error(data.error || `تعذرت الترجمة الفورية حالياً (${response.status})`);
      }

      for (const item of uncachedItems) {
        const translated = data.translations[item.key]?.trim();
        if (translated) {
          resolvedMap[item.key] = translated;
          if (cache.size >= 400) {
            const oldest = cache.keys().next().value;
            if (oldest) cache.delete(oldest);
          }
          cache.set(`${sourceLang}:${targetLang}:${item.text}`, translated);
        }
      }

      applyTranslations(resolvedMap);
    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';
      setTranslateFeedback({
        type: 'error',
        message: isTimeout
          ? 'انتهت مهلة الاتصال بخدمة الترجمة، يرجى المحاولة مرة أخرى'
          : error instanceof Error && error.message
          ? error.message
          : 'تعذر إتمام الترجمة الفورية، يرجى المحاولة مرة أخرى'
      });
    } finally {
      window.clearTimeout(timeoutId);
      setIsInstantTranslating(false);
    }
  };

  const handleToggleCategoryLink = (catId: string, catName: string) => {
    const exists = selectedCategoryIds.includes(catId);
    const nextIds = exists
      ? selectedCategoryIds.filter((id) => id !== catId)
      : [...selectedCategoryIds, catId];
    setEditingEquipment((prev) => {
      if (!prev) return prev;
      const shouldFillClassification = !exists && !prev.classification.trim();
      return {
        ...prev,
        linkedCategoryIds: nextIds,
        classification: shouldFillClassification ? catName : prev.classification
      };
    });
    if (nextIds.length > 0) {
      onClearCategoryValidationError?.();
    }
  };

  const handleOpenLibraryGroup = (groupId: string, groupName: string) => {
    setActiveLibGroupId((prev) => (prev === groupId ? null : groupId));
    setEditingEquipment((prev) => {
      if (!prev) return prev;
      const exists = prev.dynamicSpecs.some(
        (g) => g.groupId === groupId || g.title.trim().toLowerCase() === groupName.trim().toLowerCase()
      );
      if (exists) return prev;
      return {
        ...prev,
        dynamicSpecs: [
          ...prev.dynamicSpecs,
          {
            groupId,
            title: groupName,
            fields: []
          }
        ]
      };
    });
  };

  const handleToggleLibraryProp = (groupId: string, groupName: string, prop: EquipmentPropertyItem) => {
    setEditingEquipment((prev) => {
      if (!prev) return prev;
      const existingGroup = prev.dynamicSpecs.find(
        (g) => g.groupId === groupId || g.title.trim().toLowerCase() === groupName.trim().toLowerCase()
      );
      const newField: EquipmentSpecFieldValue = {
        fieldId: prop.id,
        key: prop.key,
        label: prop.label,
        type: prop.type,
        unit: prop.unit,
        options: prop.options,
        value:
          prop.type === 'boolean'
            ? false
            : prop.type === 'multi_choice'
            ? []
            : prop.type === 'number'
            ? 0
            : prop.options?.[0] ?? '',
        isRequired: prop.isMandatoryDefault,
        isPublicForClient: prop.isPublicDefault,
        isCustom: false
      };

      if (existingGroup) {
        const hasField = existingGroup.fields.some(
          (f) => f.key === prop.key || f.fieldId === prop.id
        );
        return {
          ...prev,
          dynamicSpecs: prev.dynamicSpecs.map((g) =>
            g.groupId === existingGroup.groupId
              ? {
                  ...g,
                  fields: hasField
                    ? g.fields.filter((f) => f.key !== prop.key && f.fieldId !== prop.id)
                    : [...g.fields, newField]
                }
              : g
          )
        };
      }

      return {
        ...prev,
        dynamicSpecs: [
          ...prev.dynamicSpecs,
          {
            groupId,
            title: groupName,
            fields: [newField]
          }
        ]
      };
    });
  };

  const handleRemoveSpecGroup = (groupId: string) => {
    setEditingEquipment((prev) =>
      prev
        ? {
            ...prev,
            dynamicSpecs: prev.dynamicSpecs.filter((g) => g.groupId !== groupId)
          }
        : prev
    );
  };

  const handleRemoveSpecField = (groupId: string, fieldId: string) => {
    setEditingEquipment((prev) =>
      prev
        ? {
            ...prev,
            dynamicSpecs: prev.dynamicSpecs.map((g) =>
              g.groupId === groupId
                ? { ...g, fields: g.fields.filter((f) => f.fieldId !== fieldId) }
                : g
            )
          }
        : prev
    );
  };

  const handleSpecFieldChange = (
    groupId: string,
    fieldId: string,
    newVal: string | number | boolean | string[]
  ) => {
    setEditingEquipment((prev) =>
      prev
        ? {
            ...prev,
            dynamicSpecs: prev.dynamicSpecs.map((g) =>
              g.groupId === groupId
                ? {
                    ...g,
                    fields: g.fields.map((f) =>
                      f.fieldId === fieldId ? { ...f, value: newVal } : f
                    )
                  }
                : g
            )
          }
        : prev
    );
  };

  const handleToggleSpecVisibility = (groupId: string, fieldId: string) => {
    setEditingEquipment((prev) =>
      prev
        ? {
            ...prev,
            dynamicSpecs: prev.dynamicSpecs.map((g) =>
              g.groupId === groupId
                ? {
                    ...g,
                    fields: g.fields.map((f) =>
                      f.fieldId === fieldId
                        ? { ...f, isPublicForClient: !f.isPublicForClient }
                        : f
                    )
                  }
                : g
            )
          }
        : prev
    );
  };

  const handleAddCustomSpecToEquipment = () => {
    if (!customSpecLabel.trim()) return;
    const customGroupId = 'custom-eq-specs';
    const newField: EquipmentSpecFieldValue = {
      fieldId: `cf-${Date.now()}`,
      key: `custom_${Date.now()}`,
      label: customSpecLabel.trim(),
      type: customSpecType,
      unit: customSpecUnit.trim() || undefined,
      value:
        customSpecType === 'boolean'
          ? customSpecValue === 'true'
          : customSpecType === 'number'
          ? Number(customSpecValue) || 0
          : customSpecValue.trim(),
      isRequired: false,
      isPublicForClient: customSpecPublic,
      isCustom: true
    };

    const hasCustomGroup = editingEquipment.dynamicSpecs.some(
      (g) => g.groupId === customGroupId
    );
    const updatedSpecs = hasCustomGroup
      ? editingEquipment.dynamicSpecs.map((g) =>
          g.groupId === customGroupId ? { ...g, fields: [...g.fields, newField] } : g
        )
      : [
          ...editingEquipment.dynamicSpecs,
          {
            groupId: customGroupId,
            title: 'مواصفات إضافية مخصصة لهذه المعدة',
            fields: [newField]
          }
        ];

    setEditingEquipment({ ...editingEquipment, dynamicSpecs: updatedSpecs });
    setCustomSpecLabel('');
    setCustomSpecUnit('');
    setCustomSpecValue('');
  };

  const handleAddExtraField = () => {
    if (!newExtraLabel.trim()) return;
    setEditingEquipment({
      ...editingEquipment,
      extraData: [
        ...editingEquipment.extraData,
        {
          id: `ext-${Date.now()}`,
          label: newExtraLabel.trim(),
          value: newExtraValue.trim() || '—',
          isPublicForClient: newExtraPublic
        }
      ]
    });
    setNewExtraLabel('');
    setNewExtraValue('');
  };

  const handleAddVideoMedia = () => {
    if (!newVideoUrl.trim()) return;
    const newMedia: EquipmentMediaItem = {
      id: `eq-vid-${Date.now()}`,
      url: newVideoUrl.trim(),
      youtubeUrl: newVideoUrl.trim(),
      title: newVideoTitle.trim() || 'فيديو تعريفي للمعدة',
      type: 'video',
      isCover: false,
      isPublicForClient: true
    };
    setEditingEquipment({
      ...editingEquipment,
      media: [...editingEquipment.media, newMedia]
    });
    setNewVideoUrl('');
    setNewVideoTitle('');
  };

  const handleRemoveMediaItem = (mediaId: string) => {
    setEditingEquipment({
      ...editingEquipment,
      media: editingEquipment.media.filter((m) => m.id !== mediaId)
    });
  };

  const handleToggleMediaVisibility = (mediaId: string) => {
    setEditingEquipment({
      ...editingEquipment,
      media: editingEquipment.media.map((m) =>
        m.id === mediaId ? { ...m, isPublicForClient: !m.isPublicForClient } : m
      )
    });
  };

  const handleMediaAssetsUpdate = (assets: Asset[]) => {
    const existingVideos = editingEquipment.media.filter((m) => m.type === 'video');
    const existingImageVisibility = new Map(
      editingEquipment.media
        .filter((m) => m.type === 'image')
        .map((m) => [m.url, m.isPublicForClient])
    );
    const mappedImages: EquipmentMediaItem[] = assets.map((asset, idx) => ({
      id: asset.id,
      url: asset.url,
      title: asset.name || `صورة ${idx + 1}`,
      type: 'image',
      isCover: idx === 0,
      isPublicForClient: existingImageVisibility.get(asset.url) ?? true,
      fileSizeBytes: asset.sizeBytes
    }));
    setEditingEquipment({
      ...editingEquipment,
      media: [...mappedImages, ...existingVideos]
    });
  };

  const totalDynamicFieldsCount = editingEquipment.dynamicSpecs.reduce(
    (sum, grp) => sum + grp.fields.length,
    0
  );
  const currentStatusMeta = STATUS_META[editingEquipment.status];
  const videoItems = editingEquipment.media.filter((m) => m.type === 'video');
  const imageItems = editingEquipment.media.filter((m) => m.type === 'image');

  return (
    <div className="w-full animate-fade-in">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Top Action Header Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-cyan-400 font-mono">
              معرف المعدة المستقل: {editingEquipment.id} · المالك: {editingEquipment.ownerName}
            </span>
            <h3 className="text-base md:text-lg font-bold text-white">
              {isNewMode
                ? 'تسجيل ملف معدة جديد مستقل'
                : `تعديل ملف المعدة: ${editingEquipment.name}`}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>العودة للسجل</span>
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              {isNewMode ? 'حفظ وإنشاء ملف المعدة' : 'حفظ التعديلات والمزامنة'}
            </button>
          </div>
        </div>

        {categoryValidationError && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs font-semibold flex items-center justify-between gap-2">
            <span>⚠️ {categoryValidationError}</span>
            {onClearCategoryValidationError && (
              <button
                type="button"
                onClick={onClearCategoryValidationError}
                className="text-rose-300 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================
              MAIN COLUMN (8 cols) — Strict User-Ordered Sections
          ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. الاسم والوصف بالعربي والإنجليزي + زر ترجمة فورية */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>اسم المعدة والوصف (بالعربية والإنجليزية)</span>
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={translateDirection}
                    onChange={(e) =>
                      setTranslateDirection(e.target.value as 'ar_to_en' | 'en_to_ar')
                    }
                    disabled={isInstantTranslating}
                    aria-label="اتجاه الترجمة"
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="ar_to_en">AR-EN (عربي ← إنجليزي)</option>
                    <option value="en_to_ar">EN-AR (إنجليزي ← عربي)</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleInstantTranslate}
                    disabled={isInstantTranslating}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Languages
                      className={`w-3.5 h-3.5 ${isInstantTranslating ? 'animate-spin' : ''}`}
                    />
                    <span>{isInstantTranslating ? 'جاري الترجمة...' : 'ترجمة فورية'}</span>
                  </button>
                </div>
              </div>

              {translateFeedback && (
                <div
                  className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    translateFeedback.type === 'success'
                      ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-700/50 text-rose-200'
                  }`}
                >
                  <span>{translateFeedback.message}</span>
                  <button
                    type="button"
                    onClick={() => setTranslateFeedback(null)}
                    className="p-0.5 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* اسم المعدة بالعربي و بالإنجليزية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    اسم المعدة بالعربي *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يخت النيل الذهبي، جواد أصيل، كاميرا Sony A7..."
                    value={editingEquipment.name}
                    onChange={(e) =>
                      setEditingEquipment({ ...editingEquipment, name: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    اسم المعدة بالإنجليزية
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="Equipment name in English..."
                    value={editingEquipment.translations?.en?.name || ''}
                    onChange={(e) =>
                      setEditingEquipment({
                        ...editingEquipment,
                        translations: {
                          ...editingEquipment.translations,
                          en: {
                            name: e.target.value,
                            description: editingEquipment.translations?.en?.description || ''
                          }
                        }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>
              </div>

              {/* نوع / تصنيف المعدة + الشركة المصنعة والموديل (مرجع قاعدة البيانات) */}
              {(() => {
                const unitKindOptions = equipmentOnlyUnitKinds.map((uk) => ({
                  id: uk.id,
                  label: uk.name,
                  meta: uk.description || undefined
                }));
                const selectedUnitKindValue =
                  selectedUnitKind?.id || editingEquipment.classification || '';

                const scopedManufacturers = manufacturers.filter(
                  (m) =>
                    m.applicableTo === 'equipment' ||
                    m.applicableTo === 'both' ||
                    (selectedUnitKind && (m.linkedUnitKindIds ?? []).includes(selectedUnitKind.id))
                );
                const equipmentManufacturers = selectedUnitKind
                  ? scopedManufacturers.filter((m) =>
                      (m.linkedUnitKindIds ?? []).includes(selectedUnitKind.id)
                    )
                  : scopedManufacturers;

                const resolvedManufacturer =
                  equipmentManufacturers.find((m) => m.id === editingEquipment.manufacturerId) ||
                  equipmentManufacturers.find((m) => m.name === editingEquipment.manufacturerName) ||
                  null;
                const selectedManufacturerId =
                  resolvedManufacturer?.id || editingEquipment.manufacturerId || '';

                const availableModels = selectedManufacturerId
                  ? manufacturerModels.filter(
                      (mdl) =>
                        mdl.manufacturerId === selectedManufacturerId &&
                        (!selectedUnitKind ||
                          !mdl.unitKindId ||
                          mdl.unitKindId === selectedUnitKind.id)
                    )
                  : [];
                const resolvedModel =
                  availableModels.find((mdl) => mdl.id === editingEquipment.modelId) ||
                  availableModels.find((mdl) => mdl.name === editingEquipment.modelName) ||
                  null;
                const selectedModelId = resolvedModel?.id || editingEquipment.modelId || '';

                const applyUnitKindSelection = (
                  chosenName: string,
                  categoryId?: string,
                  typeId?: string,
                  unitKindId?: string
                ) => {
                  const fallbackPresetMap: Record<
                    string,
                    { categoryId: string; typeId: string }
                  > = {
                    سيارة: { categoryId: 'cat-safari-4x4', typeId: 'eqt-safari_vehicle' },
                    يخت: { categoryId: 'cat-marine-yacht-vip', typeId: 'eqt-yacht' },
                    'مركب نيلي': { categoryId: 'cat-leisure-equestrian-nile', typeId: 'eqt-yacht' },
                    مركب: { categoryId: 'cat-marine-yacht-shared', typeId: 'eqt-yacht' },
                    لانش: { categoryId: 'cat-marine-speedboat', typeId: 'eqt-yacht' },
                    'باتش باجي': { categoryId: 'cat-safari-quad', typeId: 'eqt-safari_vehicle' },
                    'سيارة سفاري 4x4': { categoryId: 'cat-safari-4x4', typeId: 'eqt-safari_vehicle' },
                    'معدات غوص وسنوركلينج': { categoryId: 'cat-diving-pro', typeId: 'eqt-diving_gear' },
                    'غواصة / مركب زجاجي': {
                      categoryId: 'cat-leisure-glassboat',
                      typeId: 'eqt-leisure_gear'
                    },
                    'ألعاب مائية / باراشوت': {
                      categoryId: 'cat-leisure-watersports',
                      typeId: 'eqt-leisure_gear'
                    },
                    'فروسية / فلوكة': {
                      categoryId: 'cat-leisure-equestrian-nile',
                      typeId: 'eqt-leisure_gear'
                    }
                  };
                  const matchedKindObj = unitKindId
                    ? equipmentUnitKinds.find((uk) => uk.id === unitKindId)
                    : equipmentUnitKinds.find(
                        (uk) => uk.name.trim().toLowerCase() === chosenName.trim().toLowerCase()
                      );
                  const resolvedFallback = fallbackPresetMap[chosenName];
                  const effectiveCategoryId =
                    categoryId ||
                    matchedKindObj?.defaultCategoryId ||
                    matchedKindObj?.linkedCategoryIds?.[0] ||
                    resolvedFallback?.categoryId;
                  const effectiveTypeId =
                    typeId || matchedKindObj?.defaultTypeId || resolvedFallback?.typeId;

                  const currentMfg = editingEquipment.manufacturerId
                    ? manufacturers.find((m) => m.id === editingEquipment.manufacturerId)
                    : manufacturers.find((m) => m.name === editingEquipment.manufacturerName);
                  const keepCurrentMfg =
                    !unitKindId ||
                    (currentMfg && (currentMfg.linkedUnitKindIds ?? []).includes(unitKindId));

                  const nextCategories =
                    effectiveCategoryId &&
                    !(editingEquipment.linkedCategoryIds || []).includes(effectiveCategoryId)
                      ? [...(editingEquipment.linkedCategoryIds || []), effectiveCategoryId]
                      : editingEquipment.linkedCategoryIds || [];

                  const resolvedLibSpecs = resolveEquipmentSpecsForForm({
                    selectedUnitKindId: matchedKindObj?.id ?? unitKindId ?? null,
                    selectedCategoryIds: nextCategories,
                    categoryRecords,
                    specGroups,
                    equipmentProperties
                  });
                  const autoLibSpecValues = buildDynamicSpecsFromLibGroups(resolvedLibSpecs);
                  const typeDef = effectiveTypeId
                    ? equipmentTypes.find((t) => t.id === effectiveTypeId)
                    : undefined;

                  const hasEmptyOrDefaultSpecs =
                    editingEquipment.dynamicSpecs.length === 0 ||
                    (isNewMode &&
                      editingEquipment.dynamicSpecs.every((g) =>
                        g.fields.every(
                          (f) =>
                            !f.isCustom &&
                            (f.value === '' ||
                              f.value === 0 ||
                              f.value === false ||
                              (Array.isArray(f.value) && f.value.length === 0) ||
                              (f.options && f.options[0] === f.value))
                        )
                      ));

                  const nextDynamicSpecs = hasEmptyOrDefaultSpecs
                    ? autoLibSpecValues.length > 0
                      ? autoLibSpecValues
                      : typeDef
                      ? buildDynamicSpecsFromType(typeDef, [])
                      : editingEquipment.dynamicSpecs
                    : editingEquipment.dynamicSpecs;

                  setEditingEquipment({
                    ...editingEquipment,
                    classification: chosenName,
                    typeId: effectiveTypeId || editingEquipment.typeId,
                    linkedCategoryIds: nextCategories,
                    manufacturerId: keepCurrentMfg ? editingEquipment.manufacturerId : undefined,
                    manufacturerName: keepCurrentMfg ? editingEquipment.manufacturerName : undefined,
                    modelId: keepCurrentMfg ? editingEquipment.modelId : undefined,
                    modelName: keepCurrentMfg ? editingEquipment.modelName : undefined,
                    dynamicSpecs: nextDynamicSpecs
                  });
                  if (effectiveCategoryId && onClearCategoryValidationError) {
                    onClearCategoryValidationError();
                  }
                };

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ReferenceSelectWithAdd
                        label="نوع المعدة / الوحدة (يخت، مركب نيلي، لانش، باتش باجي، سيارة سفاري 4x4...)"
                        value={selectedUnitKindValue}
                        options={unitKindOptions}
                        placeholder="-- اختر نوع المعدة من المرجع --"
                        addLabel="إضافة نوع معدة جديد"
                        addInputPlaceholder="مثال: مركب نيلي، جيت سكي، دراجة صحراوية..."
                        legacyFallbackLabel={editingEquipment.classification}
                        onChange={(selectedId) => {
                          if (!selectedId) {
                            setEditingEquipment({ ...editingEquipment, classification: '' });
                            return;
                          }
                          const matched = equipmentUnitKinds.find((uk) => uk.id === selectedId);
                          if (matched) {
                            applyUnitKindSelection(
                              matched.name,
                              matched.defaultCategoryId,
                              matched.defaultTypeId,
                              matched.id
                            );
                          } else {
                            applyUnitKindSelection(selectedId);
                          }
                        }}
                        onAddNew={(newName) => {
                          const created = onCreateEquipmentUnitKind
                            ? onCreateEquipmentUnitKind({
                                name: newName,
                                domainScope: 'equipment'
                              })
                            : null;
                          applyUnitKindSelection(
                            created ? created.name : newName,
                            created?.defaultCategoryId,
                            created?.defaultTypeId,
                            created?.id
                          );
                        }}
                      />

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 block">
                          تصنيف فرعي / وصف النوع (اختياري)
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: باتش باجي بولاريس 400cc أو لانش سبيد بوت..."
                          value={editingEquipment.classification}
                          onChange={(e) =>
                            setEditingEquipment({
                              ...editingEquipment,
                              classification: e.target.value
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ReferenceSelectWithAdd
                        label={
                          selectedUnitKind
                            ? `الشركة المصنعة (${selectedUnitKind.name})`
                            : 'الشركة المصنعة (Manufacturer)'
                        }
                        value={selectedManufacturerId}
                        options={equipmentManufacturers.map((m) => ({ id: m.id, label: m.name }))}
                        placeholder={
                          selectedUnitKind && equipmentManufacturers.length === 0
                            ? `لا توجد شركات مرتبطة بـ «${selectedUnitKind.name}» — أضف من الأسفل`
                            : '-- اختر الشركة المصنعة --'
                        }
                        addLabel={
                          selectedUnitKind
                            ? `إضافة شركة مصنعة لـ «${selectedUnitKind.name}»`
                            : 'إضافة شركة مصنعة جديدة'
                        }
                        addInputPlaceholder="مثال: نيسان، تويوتا، Polaris، Azimut..."
                        legacyFallbackLabel={editingEquipment.manufacturerName}
                        onChange={(mfgId) => {
                          const mfg = manufacturers.find((m) => m.id === mfgId);
                          setEditingEquipment({
                            ...editingEquipment,
                            manufacturerId: mfg ? mfg.id : undefined,
                            manufacturerName: mfg ? mfg.name : undefined,
                            modelId: undefined,
                            modelName: undefined
                          });
                        }}
                        onAddNew={(newName) => {
                          if (!onCreateManufacturer) return;
                          const created = onCreateManufacturer({
                            name: newName,
                            applicableTo:
                              selectedUnitKind?.domainScope === 'both' ? 'both' : 'equipment',
                            linkedUnitKindIds: selectedUnitKind ? [selectedUnitKind.id] : []
                          });
                          setEditingEquipment({
                            ...editingEquipment,
                            manufacturerId: created.id,
                            manufacturerName: created.name,
                            modelId: undefined,
                            modelName: undefined
                          });
                        }}
                      />

                      <ReferenceSelectWithAdd
                        label="الموديل / الطراز (Model)"
                        value={selectedModelId}
                        disabled={!selectedManufacturerId}
                        disabledHint="-- اختر الشركة المصنعة أولاً --"
                        options={availableModels.map((mdl) => ({ id: mdl.id, label: mdl.name }))}
                        placeholder="-- اختر الموديل --"
                        addLabel="إضافة موديل جديد"
                        addInputPlaceholder="مثال: Fly 60، Sportsman 450..."
                        legacyFallbackLabel={editingEquipment.modelName}
                        onChange={(mdlId) => {
                          const mdl = availableModels.find((m) => m.id === mdlId);
                          setEditingEquipment({
                            ...editingEquipment,
                            modelId: mdl ? mdl.id : undefined,
                            modelName: mdl ? mdl.name : undefined
                          });
                        }}
                        onAddNew={(newName) => {
                          if (!onCreateManufacturerModel || !selectedManufacturerId) return;
                          const created = onCreateManufacturerModel({
                            manufacturerId: selectedManufacturerId,
                            name: newName,
                            applicableTo:
                              selectedUnitKind?.domainScope === 'both' ? 'both' : 'equipment',
                            unitKindId: selectedUnitKind?.id
                          });
                          setEditingEquipment({
                            ...editingEquipment,
                            modelId: created.id,
                            modelName: created.name
                          });
                        }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* وصف المعدة بالعربي و بالإنجليزية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    وصف المعدة بالعربي
                  </label>
                  <textarea
                    rows={4}
                    value={editingEquipment.description}
                    onChange={(e) =>
                      setEditingEquipment({ ...editingEquipment, description: e.target.value })
                    }
                    placeholder="اشرح مميزات المعدة وتجهيزاتها وتجربة العميل بها بالعربية..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    وصف المعدة بالإنجليزية
                  </label>
                  <textarea
                    rows={4}
                    dir="ltr"
                    value={editingEquipment.translations?.en?.description || ''}
                    onChange={(e) =>
                      setEditingEquipment({
                        ...editingEquipment,
                        translations: {
                          ...editingEquipment.translations,
                          en: {
                            name: editingEquipment.translations?.en?.name || '',
                            description: e.target.value
                          }
                        }
                      })
                    }
                    placeholder="Describe equipment highlights and guest experience in English..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 2. قسم الوسائط والصور */}
            <div className="space-y-3">
              <StandardMediaUploader
                title="Media / وسائط وصور المعدة"
                initialFiles={imageItems.map((m, i) => ({
                  id: m.id,
                  url: m.url,
                  name: m.title,
                  extension: 'jpg',
                  sizeBytes: m.fileSizeBytes || 1200000,
                  dateAdded: Date.now() - i * 1000
                }))}
                maxFiles={12}
                onUpdate={handleMediaAssetsUpdate}
                ownerTier={currentUser.tier || 'افتراضي'}
              />

              {/* Optional per-image client visibility controls */}
              {imageItems.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">
                      صلاحية ظهور الصور المرفوعة للعميل ({imageItems.length}):
                    </span>
                    <span>الصورة الأولى تُعتمد كغلاف للمعدة</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {imageItems.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => handleToggleMediaVisibility(img.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                          img.isPublicForClient !== false
                            ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300'
                            : 'bg-amber-950/40 border-amber-700/40 text-amber-300'
                        }`}
                      >
                        {img.isPublicForClient !== false ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        <span className="truncate max-w-[140px]">
                          {idx === 0 ? 'غلاف: ' : ''}
                          {img.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Video attachment */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-2">
                  <Video className="w-4 h-4 text-rose-400" />
                  <span>إرفاق فيديو للمعدة (YouTube / رابط مباشر):</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="عنوان الفيديو"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="https://youtube.com/watch?v=..."
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddVideoMedia}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-semibold cursor-pointer"
                  >
                    + إرفاق الفيديو للمعدة
                  </button>
                </div>

                {videoItems.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {videoItems.map((vid) => (
                      <div
                        key={vid.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{vid.title}</div>
                          <div dir="ltr" className="text-[10px] font-mono text-cyan-400 truncate">
                            {vid.url}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleMediaVisibility(vid.id)}
                            className={`p-1 rounded border text-[10px] cursor-pointer ${
                              vid.isPublicForClient !== false
                                ? 'border-emerald-700/50 text-emerald-300'
                                : 'border-amber-700/50 text-amber-300'
                            }`}
                            title={vid.isPublicForClient !== false ? 'يظهر للعميل' : 'داخلي'}
                          >
                            {vid.isPublicForClient !== false ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMediaItem(vid.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                            title="حذف الفيديو"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. قسم الفئات المرتبطة بالمعدة */}
            <div
              ref={catPickerRef}
              className={`bg-slate-900 border rounded-2xl p-5 space-y-3 text-xs ${
                categoryValidationError
                  ? 'border-rose-500/70 ring-1 ring-rose-500/30'
                  : selectedCategoryIds.length > 0
                  ? 'border-cyan-500/40'
                  : 'border-amber-500/40'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <label className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-cyan-400" />
                    <span>الفئات المرتبطة بالمعدة (التصنيف متعدد المستويات)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    اختر فئة واحدة أو أكثر لربط المعدة بها؛ تظهر هذه المعدة وصفات معداتها تلقائياً عند إنشاء نشاط أو رحلة ضمن هذه الفئات أو فروعها.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300">
                  {selectedCategoryIds.length} فئة مرتبطة
                </span>
              </div>

              {selectedCategoryIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCategoryIds.map((id) => {
                    const match = categoryOptions.find((o) => o.record.id === id);
                    if (!match) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-[11px] font-semibold"
                      >
                        <span className="text-[10px] font-mono text-cyan-400">
                          L{match.record.level}
                        </span>
                        <span>{match.fullPath}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryLink(id, match.record.name)}
                          className="text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="إزالة الربط بهذه الفئة"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search Input + Expandable Results List (X close + outside click dismiss) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={catSearchQuery}
                      onFocus={() => setIsCatListOpen(true)}
                      onChange={(e) => {
                        setCatSearchQuery(e.target.value);
                        setIsCatListOpen(true);
                      }}
                      placeholder="ابحث في الفئات لربط المعدة بها (مثال: اليخوت، الغوص، السفاري، الغواصات...)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pr-8 pl-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCatListOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 cursor-pointer shrink-0"
                  >
                    {isCatListOpen ? (
                      <>
                        <X className="w-3.5 h-3.5 text-rose-400" />
                        <span>إغلاق القائمة</span>
                      </>
                    ) : (
                      <>
                        <span>عرض قائمة الفئات</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {isCatListOpen && (
                  <div className="bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                    <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-cyan-300">
                        اختر الفئات المرتبطة بالمعدة ({filteredCategoryOptions.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCatListOpen(false)}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="إغلاق القائمة"
                        aria-label="إغلاق القائمة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/80">
                      {filteredCategoryOptions.length === 0 ? (
                        <div className="p-4 text-center text-[11px] text-slate-400">
                          لا توجد فئات مطابقة للبحث «{catSearchQuery}».
                        </div>
                      ) : (
                        filteredCategoryOptions.map((opt) => {
                          const isChecked = selectedCategoryIds.includes(opt.record.id);
                          return (
                            <button
                              key={opt.record.id}
                              type="button"
                              onClick={() =>
                                handleToggleCategoryLink(opt.record.id, opt.record.name)
                              }
                              className={`w-full text-right px-3 py-2 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                                isChecked
                                  ? 'bg-cyan-950/50 text-white font-semibold'
                                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400">
                                    L{opt.record.level}
                                  </span>
                                  <span className="truncate">{opt.record.name}</span>
                                </div>
                                {opt.record.level > 1 && (
                                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                    {opt.fullPath}
                                  </div>
                                )}
                              </div>
                              <span
                                className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${
                                  isChecked
                                    ? 'bg-cyan-600 border-cyan-500 text-white'
                                    : 'bg-slate-900 border-slate-700 text-transparent'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. المواصفات الديناميكية للمعدة (صفات المعدات من المرجع الموحد + القالب + المخصص) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>المواصفات الديناميكية للمعدة</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    صفات ومواصفات المعدة المستقلة (تُحفظ داخل ملف المعدة وتظهر تحت قسم المعدات المستخدمة في بطاقة النشاط/الرحلة).
                  </p>
                </div>
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-2.5 py-1 rounded-lg">
                  {totalDynamicFieldsCount} صفة مضافة
                </span>
              </div>

              {/* Unified Master Reference: equipment_library groups & properties */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
                {!selectedUnitKind && selectedCategoryIds.length === 0 ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-200">
                          مواصفات المعدة تظهر تلقائياً حسب نوع المعدة أو الفئة
                        </p>
                        <p className="text-[11px] text-slate-400">
                          اختر نوع المعدة (مثل: مركب، يخت، لانش، باتش باجي) أو اختر الفئة المرتبطة بالأعلى لتظهر لك المواصفات المربوطة به من المرجع الموحد.
                        </p>
                      </div>
                    </div>
                    {onNavigateToEquipmentProperties && (
                      <button
                        type="button"
                        onClick={onNavigateToEquipmentProperties}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer shrink-0"
                      >
                        المرجع الموحد ←
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {selectedUnitKind
                              ? `مجموعات صفات نوع «${selectedUnitKind.name}» (${compatibleLibraryGroups.length} مجموعة):`
                              : `مجموعات صفات المعدات المتوافقة (${compatibleLibraryGroups.length} مجموعة):`}
                          </span>
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {selectedUnitKind
                            ? `تُعرض تلقائياً المواصفات المربوطة بنوع «${selectedUnitKind.name}». انقر على المجموعة لعرض صفاتها أو أضفها بضغطة واحدة.`
                            : 'انقر على أي مجموعة لعرض صفات المعدات الخاصة بها وتحديد الصفات المناسبة لهذه المعدة.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {compatibleLibraryGroups.some((g) => g.properties.length > 0) && (
                          <button
                            type="button"
                            onClick={() => {
                              const incoming = buildDynamicSpecsFromLibGroups(compatibleLibraryGroups);
                              setEditingEquipment((prev) => {
                                if (!prev) return prev;
                                const merged = [...prev.dynamicSpecs];
                                for (const incGrp of incoming) {
                                  const idx = merged.findIndex((m) => m.groupId === incGrp.groupId);
                                  if (idx >= 0) {
                                    const existingKeys = new Set(merged[idx].fields.map((f) => f.key));
                                    const missingFields = incGrp.fields.filter(
                                      (f) => !existingKeys.has(f.key)
                                    );
                                    if (missingFields.length > 0) {
                                      merged[idx] = {
                                        ...merged[idx],
                                        fields: [...merged[idx].fields, ...missingFields]
                                      };
                                    }
                                  } else {
                                    merged.push(incGrp);
                                  }
                                }
                                return { ...prev, dynamicSpecs: merged };
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/35 border border-amber-500/40 text-amber-200 text-[11px] font-bold cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>
                              {selectedUnitKind
                                ? `إدراج كافة مواصفات «${selectedUnitKind.name}»`
                                : 'إدراج كافة الصفات المتوافقة'}
                            </span>
                          </button>
                        )}
                        {onNavigateToEquipmentProperties && (
                          <button
                            type="button"
                            onClick={onNavigateToEquipmentProperties}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                          >
                            إدارة صفات المعدات ←
                          </button>
                        )}
                      </div>
                    </div>

                    {compatibleLibraryGroups.length > 0 ? (
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap gap-2">
                          {compatibleLibraryGroups.map((libGrp) => {
                            const isActive = activeLibGroupId === libGrp.group.id;
                            const isInserted = editingEquipment.dynamicSpecs.some(
                              (g) =>
                                g.groupId === libGrp.group.id ||
                                g.title.trim().toLowerCase() ===
                                  libGrp.group.name.trim().toLowerCase()
                            );
                            return (
                              <button
                                key={libGrp.group.id}
                                type="button"
                                onClick={() =>
                                  handleOpenLibraryGroup(libGrp.group.id, libGrp.group.name)
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                                  isActive
                                    ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                                    : isInserted
                                    ? 'bg-emerald-950/40 hover:bg-slate-800 border-emerald-500/50 text-emerald-300'
                                    : 'bg-slate-900 hover:bg-slate-800 border-amber-500/35 text-amber-300'
                                }`}
                              >
                                {isInserted ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                                )}
                                <span>{libGrp.group.name}</span>
                                <span className="text-[10px] font-mono bg-amber-950/70 px-1.5 rounded tabular-nums">
                                  {libGrp.properties.length}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {selectedLibraryGroup && (
                          <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="font-bold text-amber-300">
                                صفات مجموعة «{selectedLibraryGroup.group.name}» (انقر لإضافة أو إلغاء الصفة):
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveLibGroupId(null)}
                                className="text-slate-400 hover:text-white cursor-pointer"
                              >
                                إخفاء
                              </button>
                            </div>
                            {selectedLibraryGroup.properties.length === 0 ? (
                              <p className="text-[11px] text-slate-500">
                                لا توجد صفات مضافة داخل هذه المجموعة للفئة المختارة حالياً.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {selectedLibraryGroup.properties.map((prop) => {
                                  const matchedGrp = editingEquipment.dynamicSpecs.find(
                                    (g) =>
                                      g.groupId === selectedLibraryGroup.group.id ||
                                      g.title.trim().toLowerCase() ===
                                        selectedLibraryGroup.group.name.trim().toLowerCase()
                                  );
                                  const isAdded = Boolean(
                                    matchedGrp?.fields.some(
                                      (f) => f.key === prop.key || f.fieldId === prop.id
                                    )
                                  );
                                  return (
                                    <button
                                      key={prop.id}
                                      type="button"
                                      onClick={() =>
                                        handleToggleLibraryProp(
                                          selectedLibraryGroup.group.id,
                                          selectedLibraryGroup.group.name,
                                          prop
                                        )
                                      }
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                                        isAdded
                                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                                          : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
                                      }`}
                                    >
                                      {isAdded ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Plus className="w-3 h-3 text-amber-400" />
                                      )}
                                      <span>{prop.label}</span>
                                      {prop.unit && (
                                        <span className="text-[9px] text-slate-400 font-mono">
                                          ({prop.unit})
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        لا توجد مجموعات صفات معدات مرتبطة بهذه الفئة في المرجع الموحد بعد.
                      </p>
                    )}

                    {/* Optional equipment type template loader */}
                    {compatibleEquipmentTypes.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-300 font-semibold">
                          قالب نوع معدة جاهز (اختياري):
                        </span>
                        <select
                          value={editingEquipment.typeId}
                          onChange={(e) => {
                            const nextId = e.target.value;
                            if (onEquipmentTypeChange) {
                              onEquipmentTypeChange(nextId);
                            } else {
                              setEditingEquipment({ ...editingEquipment, typeId: nextId });
                            }
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">-- بدون قالب مسبق (تحديد يدوي للصفات) --</option>
                          {compatibleEquipmentTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.specGroups.reduce((s, g) => s + g.fields.length, 0)} صفة)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Added Dynamic Spec Groups & Values */}
              {editingEquipment.dynamicSpecs.length > 0 ? (
                <div className="space-y-3">
                  {editingEquipment.dynamicSpecs.map((group) => (
                    <div
                      key={group.groupId}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-bold text-cyan-300">{group.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecGroup(group.groupId)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-[10px] font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>حذف المجموعة</span>
                        </button>
                      </div>

                      {group.fields.length === 0 ? (
                        <p className="text-[11px] text-slate-500">
                          انقر على صفات المجموعة من القائمة بالأعلى لإضافتها هنا.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {group.fields.map((field) => (
                            <div
                              key={field.fieldId}
                              className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <label className="text-[11px] font-semibold text-white truncate">
                                  {field.label} {field.unit ? `(${field.unit})` : ''}{' '}
                                  {field.isRequired && <span className="text-rose-400">*</span>}
                                </label>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleSpecVisibility(group.groupId, field.fieldId)
                                    }
                                    className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer ${
                                      field.isPublicForClient
                                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                                        : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                                    }`}
                                  >
                                    {field.isPublicForClient ? (
                                      <Eye className="w-3 h-3" />
                                    ) : (
                                      <EyeOff className="w-3 h-3" />
                                    )}
                                    <span>{field.isPublicForClient ? 'يظهر للعميل' : 'داخلي'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveSpecField(group.groupId, field.fieldId)
                                    }
                                    className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                                    title="حذف الصفة"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {field.type === 'boolean' ? (
                                <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(field.value)}
                                    onChange={(e) =>
                                      handleSpecFieldChange(
                                        group.groupId,
                                        field.fieldId,
                                        e.target.checked
                                      )
                                    }
                                    className="accent-cyan-500 w-4 h-4"
                                  />
                                  <span>{field.value ? 'متوفر / نعم' : 'غير متوفر / لا'}</span>
                                </label>
                              ) : field.type === 'single_choice' && field.options ? (
                                <select
                                  value={String(field.value || '')}
                                  onChange={(e) =>
                                    handleSpecFieldChange(
                                      group.groupId,
                                      field.fieldId,
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                                >
                                  <option value="">اختر...</option>
                                  {field.options.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : field.type === 'multi_choice' && field.options ? (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {field.options.map((opt) => {
                                    const arr = Array.isArray(field.value) ? field.value : [];
                                    const checked = arr.includes(opt);
                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                          const next = checked
                                            ? arr.filter((x) => x !== opt)
                                            : [...arr, opt];
                                          handleSpecFieldChange(
                                            group.groupId,
                                            field.fieldId,
                                            next
                                          );
                                        }}
                                        className={`text-[10px] px-2 py-1 rounded border transition-colors cursor-pointer ${
                                          checked
                                            ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200 font-bold'
                                            : 'bg-slate-950 border-slate-800 text-slate-400'
                                        }`}
                                      >
                                        {checked ? '✓ ' : '+ '}
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <input
                                  type={field.type === 'number' ? 'number' : 'text'}
                                  value={String(field.value ?? '')}
                                  onChange={(e) =>
                                    handleSpecFieldChange(
                                      group.groupId,
                                      field.fieldId,
                                      field.type === 'number'
                                        ? Number(e.target.value) || 0
                                        : e.target.value
                                    )
                                  }
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white font-mono"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-4 text-center text-[11px] text-slate-400">
                  لم تتم إضافة مواصفات ديناميكية لهذه المعدة بعد — اختر مجموعة من المرجع الموحد بالأعلى أو أضف مواصفة مخصصة أدناه.
                </div>
              )}

              {/* Custom per-equipment spec adder */}
              <div className="bg-slate-950/70 border border-dashed border-slate-700 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-cyan-300 block">
                  + إضافة مواصفة مخصصة لهذه المعدة تحديداً:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <input
                    type="text"
                    placeholder="اسم الصفة"
                    value={customSpecLabel}
                    onChange={(e) => setCustomSpecLabel(e.target.value)}
                    className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <select
                    value={customSpecType}
                    onChange={(e) => setCustomSpecType(e.target.value as EquipmentSpecFieldType)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
                  >
                    <option value="text">نص</option>
                    <option value="number">رقم</option>
                    <option value="boolean">نعم / لا</option>
                  </select>
                  <input
                    type="text"
                    placeholder="الوحدة (اختياري)"
                    value={customSpecUnit}
                    onChange={(e) => setCustomSpecUnit(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="القيمة"
                    value={customSpecValue}
                    onChange={(e) => setCustomSpecValue(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCustomSpecPublic(!customSpecPublic)}
                      className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 cursor-pointer"
                      title="الظهور للعميل"
                    >
                      {customSpecPublic ? 'عام' : 'داخلي'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomSpecToEquipment}
                      className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold cursor-pointer"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </div>

              {/* Extra data rows */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-200 block">
                  بيانات إضافية حسب طبيعة المعدة:
                </span>
                {editingEquipment.extraData.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {editingEquipment.extraData.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-[11px]"
                      >
                        <span>
                          <strong className="text-white">{ex.label}:</strong>{' '}
                          <span className="text-cyan-300">{ex.value}</span>{' '}
                          <span className="text-[9px] text-slate-500">
                            ({ex.isPublicForClient ? 'للعميل' : 'داخلي'})
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingEquipment({
                              ...editingEquipment,
                              extraData: editingEquipment.extraData.filter(
                                (item) => item.id !== ex.id
                              )
                            })
                          }
                          className="text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="البند (مثال: اسم القبطان أو الشهادة)"
                    value={newExtraLabel}
                    onChange={(e) => setNewExtraLabel(e.target.value)}
                    className="flex-1 min-w-[140px] bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="القيمة..."
                    value={newExtraValue}
                    onChange={(e) => setNewExtraValue(e.target.value)}
                    className="flex-1 min-w-[140px] bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                  />
                  <label className="flex items-center gap-1 text-[10px] text-slate-300 px-2">
                    <input
                      type="checkbox"
                      checked={newExtraPublic}
                      onChange={(e) => setNewExtraPublic(e.target.checked)}
                      className="accent-cyan-500"
                    />
                    <span>للعميل</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddExtraField}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-semibold cursor-pointer"
                  >
                    + إضافة بيان
                  </button>
                </div>
              </div>
            </div>

            {/* 5. الربط بالأنشطة الموجودة (بناءً على الفئة · خاص بالمشترك / عام بالمنصة) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-cyan-400" />
                    <span>الربط بالأنشطة المتوافقة مع الفئة (خاص بالمشترك أو عام)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedCategoryIds.length > 0
                      ? `تظهر الأنشطة تلقائياً بناءً على الفئة المختارة (${selectedCategoryMatchInfo.selectedNamesLabel}). يمكنك ربط أنشطة قائمة أو إضافة نشاط جديد مباشرة.`
                      : 'اختر فئة المعدة في القسم (3) بالأعلى لتظهر الأنشطة المتوافقة معها تلقائياً، أو أضف نشاطاً جديداً.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="text-left tabular-nums text-[11px] text-slate-300 font-semibold">
                    <span className="text-cyan-300 font-mono">{linkedActivityIds.length}</span> نشاط مرتبط
                    {linkedActivityIds.length > 0 && (
                      <span className="text-slate-400 font-normal">
                        {' '}
                        · خاص: {linkedActivitiesBreakdown.ownCount} · عام: {linkedActivitiesBreakdown.generalCount}
                      </span>
                    )}
                  </div>

                  {onAddNewActivityFromForm && (
                    <button
                      type="button"
                      onClick={() =>
                        onAddNewActivityFromForm(selectedCategoryMatchInfo.firstCategoryPath)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة نشاط جديد</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Segmented scope switcher: Owner Private vs General Platform */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActivityLinkTab('owner')}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                      activityLinkTab === 'owner'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    خاص بالمشترك ({categoryScopedOwnerActivities.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityLinkTab('general')}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                      activityLinkTab === 'general'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    الأنشطة الموجودة بشكل عام ({categoryScopedAllActivities.length})
                  </button>
                </div>

                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingEquipment.allowGeneralActivityLinking)}
                    onChange={(e) =>
                      setEditingEquipment({
                        ...editingEquipment,
                        allowGeneralActivityLinking: e.target.checked
                      })
                    }
                    className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span>إتاحة المعدة للربط أيضاً في الأنشطة العامة بالمنصة</span>
                </label>
              </div>

              {/* Search, Category Filter & Bulk Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    placeholder={
                      activityLinkTab === 'owner'
                        ? 'ابحث في أنشطة صاحب الحساب بالاسم أو المدينة أو الفئة...'
                        : 'ابحث في جميع الأنشطة الموجودة بالاسم أو المالك أو المدينة...'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setFilterActivitiesByEqCategory((prev) => !prev)}
                  className={`px-3 py-2 rounded-lg border text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    filterActivitiesByEqCategory
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {filterActivitiesByEqCategory ? 'مصفّاة حسب الفئة (إلغاء الفلتر)' : 'تفعيل الفلتر حسب الفئة'}
                </button>

                {visibleActivitiesForLink.length > 0 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllVisibleActivities}
                      className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
                    >
                      تحديد الكل ({visibleActivitiesForLink.length})
                    </button>
                    {visibleActivitiesForLink.some((a) => linkedActivityIds.includes(a.id)) && (
                      <button
                        type="button"
                        onClick={handleClearVisibleActivities}
                        className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-300 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        إلغاء تحديد الظاهر
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Activity List */}
              {filterActivitiesByEqCategory && selectedCategoryIds.length === 0 ? (
                <div className="bg-slate-950/70 border border-dashed border-cyan-800/50 rounded-xl p-5 text-center space-y-2.5 text-[11px] text-slate-400">
                  <p className="font-bold text-slate-200">
                    يرجى اختيار فئة المعدة أولاً في قسم «الفئات المتوافقة» بالأعلى لإظهار الأنشطة المرتبطة بها تلقائياً.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {onAddNewActivityFromForm && (
                      <button
                        type="button"
                        onClick={() => onAddNewActivityFromForm([])}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة نشاط جديد</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setFilterActivitiesByEqCategory(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                    >
                      عرض كل الأنشطة بدون انتظار الفئة
                    </button>
                  </div>
                </div>
              ) : visibleActivitiesForLink.length === 0 ? (
                <div className="bg-slate-950/70 border border-dashed border-slate-800 rounded-xl p-5 text-center space-y-2.5 text-[11px] text-slate-400">
                  <p className="font-semibold text-slate-300">
                    {activityLinkTab === 'owner'
                      ? 'لا توجد أنشطة خاصة بحساب المشترك الحالي مطابقة للفئة المختارة.'
                      : 'لا توجد أنشطة عامة مطابقة للفئة المختارة أو البحث الحالي.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {onAddNewActivityFromForm && (
                      <button
                        type="button"
                        onClick={() =>
                          onAddNewActivityFromForm(selectedCategoryMatchInfo.firstCategoryPath)
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ إضافة نشاط جديد لهذه الفئة</span>
                      </button>
                    )}
                    {activityLinkTab === 'owner' && categoryScopedAllActivities.length > categoryScopedOwnerActivities.length && (
                      <button
                        type="button"
                        onClick={() => setActivityLinkTab('general')}
                        className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                      >
                        عرض الأنشطة العامة المتوافقة ({categoryScopedAllActivities.length})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl max-h-72 overflow-y-auto divide-y divide-slate-800/80">
                  {visibleActivitiesForLink.map((act) => {
                    const isChecked = linkedActivityIds.includes(act.id);
                    const isMine = activityBelongsToOwner(act, currentUser);
                    const statusLabel =
                      act.status === 'published'
                        ? 'منشور'
                        : act.status === 'pending_review'
                        ? 'قيد المراجعة'
                        : act.status === 'archived'
                        ? 'مؤرشف'
                        : 'مسودة';
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => handleToggleActivityLink(act.id)}
                        className={`w-full text-right px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-cyan-950/35 text-white'
                            : 'hover:bg-slate-900/80 text-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs truncate">
                              {act.name || 'نشاط بدون اسم'}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 tabular-nums shrink-0">
                              {act.id}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                            <span className={isMine ? 'text-cyan-300 font-semibold' : 'text-amber-300'}>
                              {isMine
                                ? 'خاص بالمشترك'
                                : `عام · ${act.owner?.companyName || act.owner?.name || 'المنصة'}`}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{act.location?.city || 'مدينة غير محددة'}</span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[260px]">
                              {act.categoryPath?.length ? act.categoryPath.join(' ← ') : 'بدون فئة'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-500">{statusLabel}</span>
                          </div>
                        </div>

                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${
                            isChecked
                              ? 'bg-cyan-600 border-cyan-500 text-white'
                              : 'bg-slate-900 border-slate-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected Linked Activities Summary */}
              {linkedActivityIds.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-semibold">
                      الأنشطة المختارة للربط ({linkedActivityIds.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingEquipment({ ...editingEquipment, linkedActivityIds: [] })
                      }
                      className="text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      فك ربط الكل
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {linkedActivityIds.map((actId) => {
                      const actObj = activities.find((a) => a.id === actId);
                      return (
                        <div
                          key={actId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-200"
                        >
                          <span className="truncate max-w-[180px]">
                            {actObj?.name || actId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleActivityLink(actId)}
                            className="text-slate-400 hover:text-rose-400 cursor-pointer"
                            aria-label={`إزالة ربط ${actObj?.name || actId}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 6. البيانات الفنية والتشغيلية (الأخيرة في العمود الرئيسي) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>البيانات الفنية والتشغيلية</span>
                </h3>
                <label className="flex items-center gap-2 text-[11px] text-cyan-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingEquipment.showToClientDefault}
                    onChange={(e) =>
                      setEditingEquipment({
                        ...editingEquipment,
                        showToClientDefault: e.target.checked
                      })
                    }
                    className="accent-cyan-500"
                  />
                  <span>السماح بإظهار هذه المعدة وصورها ومواصفاتها العامة للعميل</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-amber-300 block mb-1 font-semibold">
                    الرقم التسلسلي / الترخيص (داخلي)
                  </label>
                  <input
                    type="text"
                    value={editingEquipment.operationalData.serialOrRegistrationNo || ''}
                    onChange={(e) =>
                      setEditingEquipment({
                        ...editingEquipment,
                        operationalData: {
                          ...editingEquipment.operationalData,
                          serialOrRegistrationNo: e.target.value
                        }
                      })
                    }
                    placeholder="رقم اللوحة أو الترخيص..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-300 block mb-1 font-semibold">
                    سنة الصنع / الموديل
                  </label>
                  <input
                    type="text"
                    value={editingEquipment.operationalData.modelYear || ''}
                    onChange={(e) =>
                      setEditingEquipment({
                        ...editingEquipment,
                        operationalData: {
                          ...editingEquipment.operationalData,
                          modelYear: e.target.value
                        }
                      })
                    }
                    placeholder="2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-300 block mb-1 font-semibold">
                    السعة / وحدة التشغيل المختصرة
                  </label>
                  <input
                    type="text"
                    value={editingEquipment.operationalData.capacityOrUnitLabel || ''}
                    onChange={(e) =>
                      setEditingEquipment({
                        ...editingEquipment,
                        operationalData: {
                          ...editingEquipment.operationalData,
                          capacityOrUnitLabel: e.target.value
                        }
                      })
                    }
                    placeholder="مثال: 20 راكب / 15 لتر"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-300 block mb-1 font-semibold">
                    حالة الفحص والصيانة
                  </label>
                  <select
                    value={editingEquipment.operationalData.maintenanceStatus}
                    onChange={(e) =>
                      setEditingEquipment({
                        ...editingEquipment,
                        operationalData: {
                          ...editingEquipment.operationalData,
                          maintenanceStatus: e.target.value as
                            | 'ready'
                            | 'needs_check'
                            | 'in_maintenance'
                        }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                  >
                    <option value="ready">جاهزة ومعتمدة</option>
                    <option value="needs_check">تحتاج مراجعة فنية</option>
                    <option value="in_maintenance">قيد الصيانة</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-300 block mb-1 font-semibold">
                    تاريخ آخر فحص
                  </label>
                  <input
                    type="date"
                    value={editingEquipment.operationalData.lastInspectionDate || ''}
                    onChange={(e) =>
                      setEditingEquipment({
                        ...editingEquipment,
                        operationalData: {
                          ...editingEquipment.operationalData,
                          lastInspectionDate: e.target.value
                        }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-amber-300 font-semibold flex items-center gap-1 mb-1">
                  <EyeOff className="w-3 h-3" />
                  <span>ملاحظات تشغيلية داخلية (لا تظهر للعميل نهائياً):</span>
                </label>
                <input
                  type="text"
                  value={editingEquipment.operationalData.internalNotes || ''}
                  onChange={(e) =>
                    setEditingEquipment({
                      ...editingEquipment,
                      operationalData: {
                        ...editingEquipment.operationalData,
                        internalNotes: e.target.value
                      }
                    })
                  }
                  placeholder="تفاصيل الصيانة الداخلية، أرقام التأمين السرية، تكلفة التشغيل..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-100"
                />
              </div>
            </div>
          </div>

          {/* ========================================================
              SIDEBAR COLUMN (4 cols) — حالة المعدة + Vendor / المالك المسؤول
          ======================================================== */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
            {/* Sidebar 1: حالة المعدة */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">حالة المعدة</h3>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${currentStatusMeta.className}`}
                >
                  {currentStatusMeta.label}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-300 block font-semibold">
                  الحالة والتوافر التشغيلي
                </label>
                <select
                  value={editingEquipment.status}
                  onChange={(e) =>
                    setEditingEquipment({
                      ...editingEquipment,
                      status: e.target.value as EquipmentStatus
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-white focus:border-cyan-500"
                >
                  <option value="available">متاحة وجاهزة للتشغيل</option>
                  <option value="in_use">قيد التشغيل في نشاط</option>
                  <option value="maintenance">تحت الصيانة / الفحص</option>
                  <option value="inactive">متوقفة مؤقتاً</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                {STATUS_DESCRIPTIONS[editingEquipment.status]}
              </p>
            </div>

            {/* Sidebar 2: Vendor / المالك المسؤول */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>Vendor / المالك المسؤول</span>
                </h3>
              </div>

              <div className="space-y-3">
                <EquipmentOwnershipSyncField
                  editingEquipment={editingEquipment}
                  setEditingEquipment={setEditingEquipment}
                  currentUser={currentUser}
                  partners={partners}
                  personProfiles={personProfiles}
                  onOpenPartnersRegistry={onOpenPartnersRegistry}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sticky / Footer Action Row */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
          >
            {isNewMode ? 'حفظ وإنشاء ملف المعدة المستقل' : 'حفظ التعديلات والمزامنة'}
          </button>
        </div>
      </form>
    </div>
  );
};
