import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, CategoryRecord } from '../../types/activity';
import {
  EquipmentCategoryOption,
  EquipmentItem,
  EquipmentPropertyItem,
  EquipmentSpecFieldType,
  EquipmentTypeDefinition
} from '../../types/equipment';
import { REAL_EQUIPMENT_CATEGORIES } from '../../db/localSpecsAndEquipmentDb';
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Check
} from 'lucide-react';

interface CentralLibraryManagerProps {
  equipmentProperties: EquipmentPropertyItem[];
  onChangeEquipmentProperties: (items: EquipmentPropertyItem[]) => void;
  equipments: EquipmentItem[];
  equipmentTypes?: EquipmentTypeDefinition[];
  activities: Activity[];
  categoryRecords?: CategoryRecord[];
  onResetCatalog?: () => void | Promise<void>;
}

const TYPE_LABELS: Record<EquipmentSpecFieldType, string> = {
  text: 'نص',
  number: 'رقم',
  boolean: 'نعم / لا',
  single_choice: 'اختيار واحد',
  multi_choice: 'اختيار متعدد'
};

export const CentralLibraryManager: React.FC<CentralLibraryManagerProps> = ({
  equipmentProperties,
  onChangeEquipmentProperties,
  equipments,
  equipmentTypes = [],
  activities,
  categoryRecords = [],
  onResetCatalog
}) => {
  const [categoriesList, setCategoriesList] = useState<EquipmentCategoryOption[]>(
    REAL_EQUIPMENT_CATEGORIES
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  type SortColumn =
    | 'label'
    | 'key'
    | 'category'
    | 'type'
    | 'isPublicDefault'
    | 'isMandatoryDefault'
    | 'usage';

  type FilterDropdownOption = {
    value: string;
    label: string;
    subLabel?: string;
    count: number;
    dir?: 'ltr' | 'rtl';
  };

  const COLUMN_DROPDOWN_TITLES: Record<SortColumn, string> = {
    label: 'تحديد متعدد لاسم الخاصية',
    key: 'تحديد متعدد للمفتاح البرمجي',
    category: 'تحديد متعدد لفئة المعدات',
    type: 'تحديد متعدد لأنواع البيانات',
    isPublicDefault: 'تحديد متعدد للظهور للعميل',
    isMandatoryDefault: 'تحديد متعدد للإلزامية',
    usage: 'تحديد متعدد للاستخدام الفعلي'
  };

  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<SortColumn, string>>({
    label: '',
    key: '',
    category: '',
    type: '',
    isPublicDefault: '',
    isMandatoryDefault: '',
    usage: ''
  });
  const [selectedColumnFilters, setSelectedColumnFilters] = useState<Record<SortColumn, string[]>>({
    label: [],
    key: [],
    category: [],
    type: [],
    isPublicDefault: [],
    isMandatoryDefault: [],
    usage: []
  });
  const [openDropdownCol, setOpenDropdownCol] = useState<SortColumn | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const filterInputRefs = useRef<Partial<Record<SortColumn, HTMLInputElement | null>>>({});
  const activeDropdownRef = useRef<HTMLDivElement | null>(null);

  const updateDropdownPosition = (col: SortColumn) => {
    const el = filterInputRefs.current[col];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const preferredMin = col === 'label' || col === 'category' || col === 'usage' ? 235 : 200;
    const minWidth = Math.max(rect.width, preferredMin);
    const maxLeft = Math.max(8, window.innerWidth - minWidth - 8);
    setDropdownRect({
      top: rect.bottom + 4,
      left: Math.min(Math.max(8, rect.left), maxLeft),
      width: minWidth
    });
  };

  useEffect(() => {
    if (!openDropdownCol) return;
    updateDropdownPosition(openDropdownCol);

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideAnyInput = (Object.values(filterInputRefs.current) as (HTMLInputElement | null)[])
        .some((inputEl) => inputEl?.contains(target));
      if (isInsideAnyInput || activeDropdownRef.current?.contains(target)) {
        return;
      }
      setOpenDropdownCol(null);
    };

    const handleReposition = () => {
      updateDropdownPosition(openDropdownCol);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [openDropdownCol]);

  const handleToggleColumnFilterValue = (col: SortColumn, value: string) => {
    setSelectedColumnFilters((prev) => {
      const current = prev[col];
      return {
        ...prev,
        [col]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value]
      };
    });
  };

  const handleToggleSort = (col: SortColumn) => {
    if (sortColumn !== col) {
      setSortColumn(col);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortColumn(null);
      setSortDirection('asc');
    }
  };

  const hasActiveTableFilters =
    Object.values(columnFilters).some((v) => v.trim() !== '') ||
    Object.values(selectedColumnFilters).some((arr) => arr.length > 0) ||
    sortColumn !== null;

  const handleClearTableFiltersAndSort = () => {
    setColumnFilters({
      label: '',
      key: '',
      category: '',
      type: '',
      isPublicDefault: '',
      isMandatoryDefault: '',
      usage: ''
    });
    setSelectedColumnFilters({
      label: [],
      key: [],
      category: [],
      type: [],
      isPublicDefault: [],
      isMandatoryDefault: [],
      usage: []
    });
    setOpenDropdownCol(null);
    setSortColumn(null);
    setSortDirection('asc');
  };

  // Form State
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newCategory, setNewCategory] = useState<string>(REAL_EQUIPMENT_CATEGORIES[0].id);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [newType, setNewType] = useState<EquipmentSpecFieldType>('text');
  const [newUnit, setNewUnit] = useState('');
  const [newOptionsInput, setNewOptionsInput] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIsMandatory, setNewIsMandatory] = useState(false);
  const [newIsPublic, setNewIsPublic] = useState(true);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // Compute real usage counts from saved equipment types, equipments, and activities in local DB
  const usageByKey = useMemo(() => {
    const map = new Map<
      string,
      { typesCount: number; equipmentsCount: number; activitiesCount: number }
    >();
    equipmentProperties.forEach((prop) => {
      const matchedTypesCount = equipmentTypes.filter((eqType) =>
        eqType.specGroups.some((grp) =>
          grp.fields.some((f) => f.key === prop.key || f.id === prop.id)
        )
      ).length;
      const matchedEquipmentIds = new Set<string>();
      equipments.forEach((eq) => {
        const hasProp = eq.dynamicSpecs.some((grp) =>
          grp.fields.some((f) => f.key === prop.key || f.fieldId === prop.id)
        );
        if (hasProp) matchedEquipmentIds.add(eq.id);
      });
      const matchedActivitiesCount = activities.filter((act) =>
        (act.equipmentIds || []).some((eqId) => matchedEquipmentIds.has(eqId))
      ).length;
      map.set(prop.key, {
        typesCount: matchedTypesCount,
        equipmentsCount: matchedEquipmentIds.size,
        activitiesCount: matchedActivitiesCount
      });
    });
    return map;
  }, [equipmentProperties, equipmentTypes, equipments, activities]);

  // Include any categories present on stored items even if custom
  const mergedCategories = useMemo(() => {
    const known = new Map<string, EquipmentCategoryOption>();
    categoriesList.forEach((c) => known.set(c.id, c));
    equipmentProperties.forEach((p) => {
      if (!known.has(p.category)) {
        known.set(p.category, { id: p.category, label: p.category, icon: '🏷️' });
      }
    });
    return Array.from(known.values());
  }, [categoriesList, equipmentProperties]);

  const getCategoryDisplay = (catId: string) => {
    const cat = mergedCategories.find((c) => c.id === catId);
    const linkedCategoryName = cat?.linkedCategoryId
      ? categoryRecords.find((r) => r.id === cat.linkedCategoryId)?.name
      : undefined;
    return {
      label: cat?.label || catId,
      linkedName: linkedCategoryName
    };
  };

  const columnOptionsMap = useMemo<Record<SortColumn, FilterDropdownOption[]>>(() => {
    const labelMap = new Map<string, { unit?: string; count: number }>();
    const keyMap = new Map<string, number>();
    const usageMap = new Map<
      string,
      { label: string; score: number; count: number }
    >();
    let publicCount = 0;
    let internalCount = 0;
    let mandatoryCount = 0;
    let optionalCount = 0;

    equipmentProperties.forEach((item) => {
      const existingLabel = labelMap.get(item.label);
      labelMap.set(item.label, {
        unit: existingLabel?.unit || item.unit,
        count: (existingLabel?.count || 0) + 1
      });
      keyMap.set(item.key, (keyMap.get(item.key) || 0) + 1);

      if (item.isPublicDefault) publicCount += 1;
      else internalCount += 1;

      if (item.isMandatoryDefault) mandatoryCount += 1;
      else optionalCount += 1;

      const u = usageByKey.get(item.key) || {
        typesCount: 0,
        equipmentsCount: 0,
        activitiesCount: 0
      };
      const sig = `${u.typesCount}|${u.equipmentsCount}|${u.activitiesCount}`;
      const existingUsage = usageMap.get(sig);
      usageMap.set(sig, {
        label: `${u.typesCount} نوع · ${u.equipmentsCount} معدة · ${u.activitiesCount} نشاط`,
        score: u.typesCount * 10000 + u.equipmentsCount * 100 + u.activitiesCount,
        count: (existingUsage?.count || 0) + 1
      });
    });

    const labelOptions: FilterDropdownOption[] = Array.from(labelMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'ar'))
      .map(([lbl, info]) => ({
        value: lbl,
        label: lbl,
        subLabel: info.unit,
        count: info.count
      }));

    const keyOptions: FilterDropdownOption[] = Array.from(keyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'en'))
      .map(([k, count]) => ({
        value: k,
        label: k,
        count,
        dir: 'ltr'
      }));

    const categoryOptions: FilterDropdownOption[] = mergedCategories.map((c) => {
      const info = getCategoryDisplay(c.id);
      return {
        value: c.id,
        label: info.label,
        subLabel: info.linkedName ? `تصنيف: ${info.linkedName}` : undefined,
        count: equipmentProperties.filter((p) => p.category === c.id).length
      };
    });

    const typeOptions: FilterDropdownOption[] = (Object.keys(TYPE_LABELS) as EquipmentSpecFieldType[]).map(
      (typeKey) => ({
        value: typeKey,
        label: TYPE_LABELS[typeKey],
        count: equipmentProperties.filter((p) => p.type === typeKey).length
      })
    );

    const publicOptions: FilterDropdownOption[] = [
      { value: 'public', label: 'عام للعميل', count: publicCount },
      { value: 'internal', label: 'داخلي فقط', count: internalCount }
    ];

    const mandatoryOptions: FilterDropdownOption[] = [
      { value: 'mandatory', label: 'إلزامي', count: mandatoryCount },
      { value: 'optional', label: 'اختياري', count: optionalCount }
    ];

    const usageOptions: FilterDropdownOption[] = Array.from(usageMap.entries())
      .sort(([, a], [, b]) => a.score - b.score)
      .map(([sig, info]) => ({
        value: sig,
        label: info.label,
        count: info.count
      }));

    return {
      label: labelOptions,
      key: keyOptions,
      category: categoryOptions,
      type: typeOptions,
      isPublicDefault: publicOptions,
      isMandatoryDefault: mandatoryOptions,
      usage: usageOptions
    };
  }, [equipmentProperties, mergedCategories, categoryRecords, usageByKey]);

  const getSelectedSummaryPlaceholder = (col: SortColumn, defaultPlaceholder: string) => {
    const selected = selectedColumnFilters[col];
    if (selected.length === 0) return defaultPlaceholder;
    const opts = columnOptionsMap[col];
    return selected
      .map((val) => opts.find((o) => o.value === val)?.label || val)
      .join('، ');
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const fLabel = columnFilters.label.trim().toLowerCase();
    const fKey = columnFilters.key.trim().toLowerCase();
    const fCategory = columnFilters.category.trim().toLowerCase();
    const fType = columnFilters.type.trim().toLowerCase();
    const fPublic = columnFilters.isPublicDefault.trim().toLowerCase();
    const fMandatory = columnFilters.isMandatoryDefault.trim().toLowerCase();
    const fUsage = columnFilters.usage.trim().toLowerCase();

    const filtered = equipmentProperties.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      if (!matchesCat || !matchesSearch) return false;

      if (selectedColumnFilters.label.length > 0) {
        if (!selectedColumnFilters.label.includes(item.label)) return false;
      } else if (fLabel) {
        const labelBlob = `${item.label} ${item.unit || ''} ${item.description || ''}`.toLowerCase();
        if (!labelBlob.includes(fLabel)) return false;
      }

      if (selectedColumnFilters.key.length > 0) {
        if (!selectedColumnFilters.key.includes(item.key)) return false;
      } else if (fKey && !item.key.toLowerCase().includes(fKey)) {
        return false;
      }

      if (selectedColumnFilters.category.length > 0) {
        if (!selectedColumnFilters.category.includes(item.category)) return false;
      } else if (fCategory) {
        const catInfo = getCategoryDisplay(item.category);
        const catBlob = `${catInfo.label} ${catInfo.linkedName || ''} ${item.category}`.toLowerCase();
        if (!catBlob.includes(fCategory)) return false;
      }

      if (selectedColumnFilters.type.length > 0) {
        if (!selectedColumnFilters.type.includes(item.type)) return false;
      } else if (fType) {
        const typeLabel = (TYPE_LABELS[item.type] || item.type).toLowerCase();
        if (!typeLabel.includes(fType) && !item.type.toLowerCase().includes(fType)) {
          return false;
        }
      }

      if (selectedColumnFilters.isPublicDefault.length > 0) {
        const val = item.isPublicDefault ? 'public' : 'internal';
        if (!selectedColumnFilters.isPublicDefault.includes(val)) return false;
      } else if (fPublic) {
        const publicLabel = item.isPublicDefault ? 'عام للعميل' : 'داخلي فقط';
        if (!publicLabel.toLowerCase().includes(fPublic)) return false;
      }

      if (selectedColumnFilters.isMandatoryDefault.length > 0) {
        const val = item.isMandatoryDefault ? 'mandatory' : 'optional';
        if (!selectedColumnFilters.isMandatoryDefault.includes(val)) return false;
      } else if (fMandatory) {
        const mandatoryLabel = item.isMandatoryDefault ? 'إلزامي' : 'اختياري';
        if (!mandatoryLabel.toLowerCase().includes(fMandatory)) return false;
      }

      const u = usageByKey.get(item.key) || {
        typesCount: 0,
        equipmentsCount: 0,
        activitiesCount: 0
      };
      if (selectedColumnFilters.usage.length > 0) {
        const sig = `${u.typesCount}|${u.equipmentsCount}|${u.activitiesCount}`;
        if (!selectedColumnFilters.usage.includes(sig)) return false;
      } else if (fUsage) {
        const usageBlob = `${u.typesCount} نوع ${u.equipmentsCount} معدة ${u.activitiesCount} نشاط`.toLowerCase();
        if (!usageBlob.includes(fUsage)) return false;
      }

      return true;
    });

    if (!sortColumn) return filtered;

    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortColumn) {
        case 'label':
          return a.label.localeCompare(b.label, 'ar') * dir;
        case 'key':
          return a.key.localeCompare(b.key, 'en') * dir;
        case 'category': {
          const catA = getCategoryDisplay(a.category).label;
          const catB = getCategoryDisplay(b.category).label;
          return catA.localeCompare(catB, 'ar') * dir;
        }
        case 'type': {
          const tA = TYPE_LABELS[a.type] || a.type;
          const tB = TYPE_LABELS[b.type] || b.type;
          return tA.localeCompare(tB, 'ar') * dir;
        }
        case 'isPublicDefault':
          return (Number(b.isPublicDefault) - Number(a.isPublicDefault)) * dir;
        case 'isMandatoryDefault':
          return (Number(b.isMandatoryDefault) - Number(a.isMandatoryDefault)) * dir;
        case 'usage': {
          const uA = usageByKey.get(a.key) || { typesCount: 0, equipmentsCount: 0, activitiesCount: 0 };
          const uB = usageByKey.get(b.key) || { typesCount: 0, equipmentsCount: 0, activitiesCount: 0 };
          const scoreA = uA.typesCount * 10000 + uA.equipmentsCount * 100 + uA.activitiesCount;
          const scoreB = uB.typesCount * 10000 + uB.equipmentsCount * 100 + uB.activitiesCount;
          return (scoreA - scoreB) * dir;
        }
      }
    });
  }, [
    equipmentProperties,
    selectedCategory,
    searchQuery,
    columnFilters,
    selectedColumnFilters,
    sortColumn,
    sortDirection,
    mergedCategories,
    categoryRecords,
    usageByKey
  ]);

  const resetForm = () => {
    setEditingId(null);
    setNewLabel('');
    setNewKey('');
    setNewCategory(REAL_EQUIPMENT_CATEGORIES[0].id);
    setIsAddingCategory(false);
    setCustomCategoryName('');
    setNewType('text');
    setNewUnit('');
    setNewOptionsInput('');
    setNewDesc('');
    setNewIsMandatory(false);
    setNewIsPublic(true);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: EquipmentPropertyItem) => {
    setEditingId(item.id);
    setNewLabel(item.label);
    setNewKey(item.key);
    setNewCategory(item.category);
    setNewType(item.type);
    setNewUnit(item.unit || '');
    setNewOptionsInput((item.options || []).join('، '));
    setNewDesc(item.description || '');
    setNewIsMandatory(item.isMandatoryDefault);
    setNewIsPublic(item.isPublicDefault);
    setIsAddingCategory(false);
    setCustomCategoryName('');
    setShowAddModal(true);
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryName.trim();
    if (!trimmed) return;
    const existing = mergedCategories.find(
      (c) => c.label.toLowerCase() === trimmed.toLowerCase() || c.id.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      setNewCategory(existing.id);
      setCustomCategoryName('');
      setIsAddingCategory(false);
      return;
    }
    const newId = `cat_${Date.now().toString().slice(-4)}`;
    const created: EquipmentCategoryOption = {
      id: newId,
      label: trimmed,
      icon: '🏷️'
    };
    setCategoriesList((prev) => [...prev, created]);
    setNewCategory(newId);
    setCustomCategoryName('');
    setIsAddingCategory(false);
  };

  const handleSubmitAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLabel = newLabel.trim();
    if (!trimmedLabel) return;

    const todayIso = new Date().toISOString().split('T')[0];
    const keyName =
      newKey.trim() ||
      trimmedLabel
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, '_')
        .replace(/^_+|_+$/g, '') ||
      `eqp_${Date.now().toString().slice(-4)}`;

    const parsedOptions =
      newType === 'single_choice' || newType === 'multi_choice'
        ? newOptionsInput
            .split(/[،,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    if (editingId) {
      onChangeEquipmentProperties(
        equipmentProperties.map((item) =>
          item.id === editingId
            ? {
                ...item,
                category: newCategory,
                key: keyName,
                label: trimmedLabel,
                type: newType,
                unit: newUnit.trim() || undefined,
                options: parsedOptions && parsedOptions.length > 0 ? parsedOptions : undefined,
                isMandatoryDefault: newIsMandatory,
                isPublicDefault: newIsPublic,
                description: newDesc.trim() || item.description,
                updatedAt: todayIso
              }
            : item
        )
      );
      showToast(`✓ تم تحديث خاصية المعدة "${trimmedLabel}" في قاعدة البيانات المحلية`);
    } else {
      const newItem: EquipmentPropertyItem = {
        id: `eqp-${Date.now().toString().slice(-5)}`,
        category: newCategory,
        key: keyName,
        label: trimmedLabel,
        type: newType,
        unit: newUnit.trim() || undefined,
        options: parsedOptions && parsedOptions.length > 0 ? parsedOptions : undefined,
        isMandatoryDefault: newIsMandatory,
        isPublicDefault: newIsPublic,
        description: newDesc.trim() || 'خاصية معدة مسجلة في قاعدة البيانات المحلية',
        createdAt: todayIso,
        updatedAt: todayIso
      };
      onChangeEquipmentProperties([newItem, ...equipmentProperties]);
      showToast(`✓ تمت إضافة خاصية المعدة "${trimmedLabel}" إلى قاعدة البيانات المحلية`);
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleConfirmDelete = (id: string) => {
    const target = equipmentProperties.find((p) => p.id === id);
    onChangeEquipmentProperties(equipmentProperties.filter((p) => p.id !== id));
    setConfirmDeleteId(null);
    if (target) {
      showToast(`تم حذف خاصية المعدة "${target.label}" من قاعدة البيانات المحلية`);
    }
  };

  const renderSortIcon = (col: SortColumn) => {
    if (sortColumn !== col) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview & Add Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>خصائص المعدات (مربوطة بقاعدة البيانات المحلية)</span>
            <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-2.5 py-0.5 rounded-full font-mono">
              {equipmentProperties.length} خاصية
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            خصائص الأصول والمعدات الفعلية المشتقة من تصنيفات المنصة في قاعدة البيانات المحلية، وتُحسب أعداد استخدامها تلقائياً من المعدات والأنشطة المسجلة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {feedbackMsg && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {onResetCatalog && (
            <button
              type="button"
              onClick={async () => {
                await onResetCatalog();
                showToast('✓ تم تصفير وإعادة تحميل خصائص المعدات الحقيقية من قاعدة البيانات المحلية');
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="إعادة تحميل البيانات الحقيقية من قاعدة البيانات المحلية"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>إعادة تحميل القاعدة</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء خاصية معدة جديدة</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              selectedCategory === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            الجميع ({equipmentProperties.length})
          </button>
          {mergedCategories.map((cat) => {
            const count = equipmentProperties.filter((p) => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat.id ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.icon} {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="بحث في خصائص المعدات والمفاتيح..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Attributes Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px]">
          <span className="text-slate-400">
            عرض <strong className="text-cyan-300 font-mono">{filteredItems.length}</strong> من أصل{' '}
            <strong className="text-white font-mono">{equipmentProperties.length}</strong> خاصية
            {sortColumn && (
              <span className="mr-2 text-cyan-400">
                (مرتب {sortDirection === 'asc' ? 'تصاعدياً' : 'تنازلياً'})
              </span>
            )}
          </span>
          {hasActiveTableFilters && (
            <button
              type="button"
              onClick={handleClearTableFiltersAndSort}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>مسح فلاتر الأعمدة والفرز</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('label')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب اسم الخاصية"
                  >
                    <span>اسم خاصية المعدة</span>
                    {renderSortIcon('label')}
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('key')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب المفتاح البرمجي"
                  >
                    <span>المفتاح البرمجي</span>
                    {renderSortIcon('key')}
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('category')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب الفئة"
                  >
                    <span>فئة المعدات / التصنيف المرتبط</span>
                    {renderSortIcon('category')}
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('type')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب نوع البيانات"
                  >
                    <span>نوع البيانات</span>
                    {renderSortIcon('type')}
                  </button>
                </th>
                <th className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('isPublicDefault')}
                    className="inline-flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب الظهور للعميل"
                  >
                    <span>الظهور للعميل</span>
                    {renderSortIcon('isPublicDefault')}
                  </button>
                </th>
                <th className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('isMandatoryDefault')}
                    className="inline-flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب الإلزامية"
                  >
                    <span>الإلزامية</span>
                    {renderSortIcon('isMandatoryDefault')}
                  </button>
                </th>
                <th className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('usage')}
                    className="inline-flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب الاستخدام الفعلي"
                  >
                    <span>الاستخدام الفعلي</span>
                    {renderSortIcon('usage')}
                  </button>
                </th>
                <th className="py-3 px-3 text-center">إجراءات</th>
              </tr>

              {/* Row of searchable multi-select column filters */}
              <tr className="bg-slate-900/90 border-t border-slate-800/80 font-normal normal-case">
                {(
                  [
                    {
                      col: 'label' as SortColumn,
                      placeholder: 'اختر أو اكتب الاسم...',
                      minWidth: 'min-w-[130px]',
                      extraClass: ''
                    },
                    {
                      col: 'key' as SortColumn,
                      placeholder: 'filter key...',
                      minWidth: 'min-w-[115px]',
                      dir: 'ltr' as const,
                      extraClass: 'font-mono text-cyan-300'
                    },
                    {
                      col: 'category' as SortColumn,
                      placeholder: 'اختر أو اكتب الفئة...',
                      minWidth: 'min-w-[125px]',
                      extraClass: ''
                    },
                    {
                      col: 'type' as SortColumn,
                      placeholder: 'اختر أو اكتب النوع...',
                      minWidth: 'min-w-[115px]',
                      extraClass: ''
                    },
                    {
                      col: 'isPublicDefault' as SortColumn,
                      placeholder: 'عام / داخلي...',
                      minWidth: 'min-w-[95px]',
                      extraClass: 'text-center'
                    },
                    {
                      col: 'isMandatoryDefault' as SortColumn,
                      placeholder: 'إلزامي / اختياري...',
                      minWidth: 'min-w-[95px]',
                      extraClass: 'text-center'
                    },
                    {
                      col: 'usage' as SortColumn,
                      placeholder: 'رقم / نوع / معدة...',
                      minWidth: 'min-w-[105px]',
                      extraClass: 'text-center'
                    }
                  ]
                ).map(({ col, placeholder, minWidth, dir, extraClass }) => {
                  const hasSelected = selectedColumnFilters[col].length > 0;
                  return (
                    <th key={col} className="p-2">
                      <input
                        ref={(el) => {
                          filterInputRefs.current[col] = el;
                        }}
                        type="text"
                        dir={dir}
                        placeholder={getSelectedSummaryPlaceholder(col, placeholder)}
                        value={columnFilters[col]}
                        onFocus={() => {
                          updateDropdownPosition(col);
                          setOpenDropdownCol(col);
                        }}
                        onClick={() => {
                          updateDropdownPosition(col);
                          setOpenDropdownCol(col);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setOpenDropdownCol(null);
                          }
                        }}
                        onChange={(e) => {
                          setColumnFilters((prev) => ({ ...prev, [col]: e.target.value }));
                          if (openDropdownCol !== col) {
                            updateDropdownPosition(col);
                            setOpenDropdownCol(col);
                          }
                        }}
                        className={`w-full ${minWidth} rounded-md px-2 py-1 text-[11px] focus:outline-none transition-colors ${extraClass} ${
                          hasSelected
                            ? 'bg-cyan-950/30 border border-cyan-500/70 text-cyan-100 placeholder-cyan-300 font-semibold'
                            : 'bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-cyan-500'
                        }`}
                      />
                    </th>
                  );
                })}
                <th className="p-2 text-center">
                  {hasActiveTableFilters ? (
                    <button
                      type="button"
                      onClick={handleClearTableFiltersAndSort}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 text-[10px] font-semibold cursor-pointer"
                      title="إعادة ضبط فلاتر الأعمدة والفرز"
                    >
                      مسح
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-600">—</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-tajawal text-slate-300">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    لا توجد خصائص معدات مطابقة لفلترة الأعمدة أو البحث في قاعدة البيانات المحلية.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const catInfo = getCategoryDisplay(item.category);
                  const usage = usageByKey.get(item.key) || {
                    typesCount: 0,
                    equipmentsCount: 0,
                    activitiesCount: 0
                  };
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.unit && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                              {item.unit}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-400 text-xs">{item.key}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="font-semibold">{catInfo.label}</div>
                        {catInfo.linkedName && (
                          <div className="text-[10px] text-slate-400">تصنيف: {catInfo.linkedName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="font-mono text-xs">{TYPE_LABELS[item.type] || item.type}</span>
                        {item.options && item.options.length > 0 && (
                          <span className="block text-[10px] text-slate-500">
                            {item.options.length} خيارات
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.isPublicDefault ? (
                          <span className="text-emerald-400 text-[11px] font-semibold">عام للعميل</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">داخلي فقط</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.isMandatoryDefault ? (
                          <span className="text-amber-400 text-[11px] font-semibold">إلزامي</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">اختياري</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <div className="text-emerald-300 font-bold">{usage.typesCount} نوع</div>
                        <div className="text-cyan-300 text-[10px]">{usage.equipmentsCount} معدة · {usage.activitiesCount} نشاط</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1 bg-red-950/50 border border-red-800/60 rounded-lg px-2 py-1">
                              <button
                                type="button"
                                onClick={() => handleConfirmDelete(item.id)}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded cursor-pointer"
                              >
                                حذف
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 cursor-pointer"
                                title="تعديل الخاصية"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(item.id)}
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-800 cursor-pointer"
                                title="حذف الخاصية"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {openDropdownCol && dropdownRect && (() => {
          const activeCol = openDropdownCol;
          const rawOptions = columnOptionsMap[activeCol] || [];
          const q = columnFilters[activeCol].trim().toLowerCase();
          const visibleOptions = rawOptions.filter((opt) => {
            if (!q) return true;
            return (
              opt.label.toLowerCase().includes(q) ||
              (opt.subLabel || '').toLowerCase().includes(q) ||
              opt.value.toLowerCase().includes(q)
            );
          });
          const selectedValues = selectedColumnFilters[activeCol];

          return (
            <div
              ref={activeDropdownRef}
              style={{
                top: dropdownRect.top,
                left: dropdownRect.left,
                width: dropdownRect.width
              }}
              className="fixed z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/80 overflow-hidden text-right"
            >
              <div className="bg-slate-950/90 border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-200 truncate">
                  {COLUMN_DROPDOWN_TITLES[activeCol]}
                </span>
                {(selectedValues.length > 0 || columnFilters[activeCol].trim() !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedColumnFilters((prev) => ({ ...prev, [activeCol]: [] }));
                      setColumnFilters((prev) => ({ ...prev, [activeCol]: '' }));
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer shrink-0"
                  >
                    مسح
                  </button>
                )}
              </div>

              <div className="p-1.5 space-y-1 max-h-60 overflow-y-auto">
                {visibleOptions.map((opt) => {
                  const isChecked = selectedValues.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleToggleColumnFilterValue(activeCol, opt.value)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 font-semibold'
                          : 'bg-transparent border border-transparent hover:bg-slate-800/80 text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                              : 'bg-slate-950 border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="flex flex-col text-right min-w-0">
                          <span
                            dir={opt.dir}
                            className={`truncate ${opt.dir === 'ltr' ? 'font-mono text-left' : ''}`}
                          >
                            {opt.label}
                          </span>
                          {opt.subLabel && (
                            <span className="text-[10px] text-slate-400 truncate">
                              {opt.subLabel}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {opt.count}
                      </span>
                    </button>
                  );
                })}
                {visibleOptions.length === 0 && (
                  <div className="py-3 text-center text-[11px] text-slate-500">
                    لا توجد خيارات مطابقة للبحث
                  </div>
                )}
              </div>

              <div className="bg-slate-950/90 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">
                  {selectedValues.length > 0
                    ? `محدد: ${selectedValues.length}`
                    : 'اختر خياراً أو أكثر'}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenDropdownCol(null)}
                  className="px-2.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modal: Add / Edit Equipment Property */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleSubmitAttribute}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white">
                {editingId ? 'تعديل خاصية معدة في قاعدة البيانات' : 'إضافة خاصية معدة جديدة لقاعدة البيانات'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">اسم الخاصية بالعربية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سعة خزان الوقود، وزن المرساة..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">المفتاح البرمجي (Key)</label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="e.g. fuel_tank_l"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 font-mono text-cyan-300"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">وحدة القياس (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: متر، لتر، كجم..."
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">فئة المعدات</label>
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsAddingCategory(true);
                      } else {
                        setNewCategory(e.target.value);
                        setIsAddingCategory(false);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  >
                    {mergedCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                    <option value="__add_new__" className="text-cyan-400 font-bold bg-slate-900">
                      + إضافة فئة جديدة...
                    </option>
                  </select>
                  {isAddingCategory && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="اسم الفئة الجديدة..."
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomCategory();
                          }
                        }}
                        className="flex-1 min-w-0 bg-slate-950 border border-cyan-500/60 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        disabled={!customCategoryName.trim()}
                        className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-[11px] font-bold rounded shrink-0 cursor-pointer"
                      >
                        إضافة
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">نوع البيانات</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as EquipmentSpecFieldType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  >
                    <option value="text">نص (Text)</option>
                    <option value="number">رقم (Number)</option>
                    <option value="boolean">نعم / لا (Boolean)</option>
                    <option value="single_choice">اختيار واحد</option>
                    <option value="multi_choice">اختيار متعدد</option>
                  </select>
                </div>
              </div>

              {(newType === 'single_choice' || newType === 'multi_choice') && (
                <div>
                  <label className="text-slate-400 block mb-1">الخيارات المتاحة (افصل بفاصلة)</label>
                  <input
                    type="text"
                    value={newOptionsInput}
                    onChange={(e) => setNewOptionsInput(e.target.value)}
                    placeholder="مثال: صغير، متوسط، كبير"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1">الوصف والغرض</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="وصف استخدام هذه الخاصية في المعدة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsPublic}
                    onChange={(e) => setNewIsPublic(e.target.checked)}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  <span>ظهور الخاصية للعميل</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsMandatory}
                    onChange={(e) => setNewIsMandatory(e.target.checked)}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  <span>خاصية إلزامية</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                {editingId ? 'حفظ التعديلات' : 'حفظ في قاعدة البيانات المحلية'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
