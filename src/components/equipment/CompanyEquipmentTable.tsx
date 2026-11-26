import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  EquipmentItem,
  EquipmentOwnershipType,
  EquipmentStatus,
  EquipmentTypeDefinition
} from '../../types/equipment';
import { Activity } from '../../types/activity';
import { AppUser } from '../../types/auth';
import { equipmentBelongsToEditableUser } from '../../utils/assetCustodyHelpers';
import {
  Wrench,
  Plus,
  Edit3,
  Trash2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Check
} from 'lucide-react';

interface CompanyEquipmentTableProps {
  equipments: EquipmentItem[];
  equipmentTypes: EquipmentTypeDefinition[];
  activities: Activity[];
  currentUser: AppUser;
  onAddEquipment: () => void;
  onEditEquipment: (eq: EquipmentItem) => void;
  onDeleteEquipment: (equipmentId: string, equipmentName: string) => void;
  onInspectEquipment: (eq: EquipmentItem) => void;
}

type EquipmentSortColumn =
  | 'name'
  | 'id'
  | 'typeId'
  | 'ownershipType'
  | 'status'
  | 'showToClientDefault'
  | 'usage';

type FilterDropdownOption = {
  value: string;
  label: string;
  subLabel?: string;
  count: number;
  dir?: 'ltr' | 'rtl';
};

const STATUS_LABELS: Record<EquipmentStatus, { label: string; textClass: string }> = {
  available: { label: 'متاحة وجاهزة للتشغيل', textClass: 'text-emerald-400' },
  in_use: { label: 'قيد التشغيل في نشاط', textClass: 'text-cyan-400' },
  maintenance: { label: 'تحت الصيانة / الفحص', textClass: 'text-amber-400' },
  inactive: { label: 'متوقفة مؤقتاً', textClass: 'text-slate-400' }
};

const OWNERSHIP_LABELS: Record<EquipmentOwnershipType, string> = {
  owned: 'ملكية خاصة',
  rented: 'مستأجرة بعقد',
  partner_shared: 'مشاركة تشغيل'
};

const MAINTENANCE_LABELS: Record<'ready' | 'needs_check' | 'in_maintenance', string> = {
  ready: 'جاهزة ومعتمدة',
  needs_check: 'تحتاج مراجعة فنية',
  in_maintenance: 'قيد الصيانة الدورية'
};

const COLUMN_DROPDOWN_TITLES: Record<EquipmentSortColumn, string> = {
  name: 'تحديد متعدد لاسم المعدة',
  id: 'تحديد متعدد للمعرف البرمجي',
  typeId: 'تحديد متعدد لنوع المعدة',
  ownershipType: 'تحديد متعدد للملكية',
  status: 'تحديد متعدد للحالة التشغيلية',
  showToClientDefault: 'تحديد متعدد للظهور للعميل',
  usage: 'تحديد متعدد للارتباط والمواصفات'
};

export const CompanyEquipmentTable: React.FC<CompanyEquipmentTableProps> = ({
  equipments,
  equipmentTypes,
  activities,
  currentUser,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
  onInspectEquipment
}) => {
  // Strict control isolation: equipments controlled by currentUser (including external_pending added by them, excluding isolated ones)
  const companyEquipments = useMemo(
    () => equipments.filter((eq) => equipmentBelongsToEditableUser(eq, currentUser)),
    [equipments, currentUser]
  );

  const [selectedTypeTab, setSelectedTypeTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [sortColumn, setSortColumn] = useState<EquipmentSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [columnFilters, setColumnFilters] = useState<Record<EquipmentSortColumn, string>>({
    name: '',
    id: '',
    typeId: '',
    ownershipType: '',
    status: '',
    showToClientDefault: '',
    usage: ''
  });

  const [selectedColumnFilters, setSelectedColumnFilters] = useState<
    Record<EquipmentSortColumn, string[]>
  >({
    name: [],
    id: [],
    typeId: [],
    ownershipType: [],
    status: [],
    showToClientDefault: [],
    usage: []
  });

  const [openDropdownCol, setOpenDropdownCol] = useState<EquipmentSortColumn | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const filterInputRefs = useRef<Partial<Record<EquipmentSortColumn, HTMLInputElement | null>>>({});
  const activeDropdownRef = useRef<HTMLDivElement | null>(null);

  // Reset confirmation and filters cleanly if active company changes
  useEffect(() => {
    setConfirmDeleteId(null);
    setSelectedTypeTab('all');
    setOpenDropdownCol(null);
  }, [currentUser.id]);

  const updateDropdownPosition = (col: EquipmentSortColumn) => {
    const el = filterInputRefs.current[col];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const preferredMin = col === 'name' || col === 'typeId' || col === 'usage' ? 235 : 200;
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
      const isInsideAnyInput = (
        Object.values(filterInputRefs.current) as (HTMLInputElement | null)[]
      ).some((inputEl) => inputEl?.contains(target));
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

  const getTypeName = (typeId: string) =>
    equipmentTypes.find((t) => t.id === typeId)?.name || 'نوع مخصص';

  const usageByEquipmentId = useMemo(() => {
    const map = new Map<
      string,
      { activitiesCount: number; specsCount: number; mediaCount: number }
    >();
    companyEquipments.forEach((eq) => {
      const activitiesCount = activities.filter((act) =>
        (act.equipmentIds || []).includes(eq.id)
      ).length;
      const specsCount = eq.dynamicSpecs.reduce((sum, grp) => sum + grp.fields.length, 0);
      const mediaCount = eq.media.length;
      map.set(eq.id, { activitiesCount, specsCount, mediaCount });
    });
    return map;
  }, [companyEquipments, activities]);

  const mergedTypesForTabs = useMemo(() => {
    const known = new Map<string, { id: string; name: string }>();
    equipmentTypes.forEach((t) => known.set(t.id, { id: t.id, name: t.name }));
    companyEquipments.forEach((eq) => {
      if (eq.typeId && !known.has(eq.typeId)) {
        known.set(eq.typeId, { id: eq.typeId, name: getTypeName(eq.typeId) });
      }
    });
    return Array.from(known.values());
  }, [equipmentTypes, companyEquipments]);

  const columnOptionsMap = useMemo<Record<EquipmentSortColumn, FilterDropdownOption[]>>(() => {
    const nameMap = new Map<string, { year?: string; count: number }>();
    const idMap = new Map<string, { serial?: string; count: number }>();
    const typeCountMap = new Map<string, number>();
    const ownershipCountMap = new Map<EquipmentOwnershipType, number>();
    const statusCountMap = new Map<EquipmentStatus, number>();
    const usageMap = new Map<string, { label: string; score: number; count: number }>();
    let publicCount = 0;
    let internalCount = 0;

    companyEquipments.forEach((eq) => {
      const existingName = nameMap.get(eq.name);
      nameMap.set(eq.name, {
        year: existingName?.year || eq.operationalData.modelYear,
        count: (existingName?.count || 0) + 1
      });

      const existingId = idMap.get(eq.id);
      idMap.set(eq.id, {
        serial: existingId?.serial || eq.operationalData.serialOrRegistrationNo,
        count: (existingId?.count || 0) + 1
      });

      typeCountMap.set(eq.typeId, (typeCountMap.get(eq.typeId) || 0) + 1);
      ownershipCountMap.set(
        eq.ownershipType,
        (ownershipCountMap.get(eq.ownershipType) || 0) + 1
      );
      statusCountMap.set(eq.status, (statusCountMap.get(eq.status) || 0) + 1);

      if (eq.showToClientDefault) publicCount += 1;
      else internalCount += 1;

      const u = usageByEquipmentId.get(eq.id) || {
        activitiesCount: 0,
        specsCount: 0,
        mediaCount: 0
      };
      const sig = `${u.activitiesCount}|${u.specsCount}|${u.mediaCount}`;
      const existingUsage = usageMap.get(sig);
      usageMap.set(sig, {
        label: `${u.activitiesCount} نشاط · ${u.specsCount} مواصفة · ${u.mediaCount} وسائط`,
        score: u.activitiesCount * 10000 + u.specsCount * 100 + u.mediaCount,
        count: (existingUsage?.count || 0) + 1
      });
    });

    const nameOptions: FilterDropdownOption[] = Array.from(nameMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'ar'))
      .map(([n, info]) => ({
        value: n,
        label: n,
        subLabel: info.year ? `موديل ${info.year}` : undefined,
        count: info.count
      }));

    const idOptions: FilterDropdownOption[] = Array.from(idMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'en'))
      .map(([idVal, info]) => ({
        value: idVal,
        label: idVal,
        subLabel: info.serial || undefined,
        count: info.count,
        dir: 'ltr'
      }));

    const typeOptions: FilterDropdownOption[] = mergedTypesForTabs.map((t) => ({
      value: t.id,
      label: t.name,
      count: typeCountMap.get(t.id) || 0
    }));

    const ownershipOptions: FilterDropdownOption[] = (
      Object.keys(OWNERSHIP_LABELS) as EquipmentOwnershipType[]
    ).map((key) => ({
      value: key,
      label: OWNERSHIP_LABELS[key],
      count: ownershipCountMap.get(key) || 0
    }));

    const statusOptions: FilterDropdownOption[] = (
      Object.keys(STATUS_LABELS) as EquipmentStatus[]
    ).map((key) => ({
      value: key,
      label: STATUS_LABELS[key].label,
      count: statusCountMap.get(key) || 0
    }));

    const publicOptions: FilterDropdownOption[] = [
      { value: 'public', label: 'عام للعميل', count: publicCount },
      { value: 'internal', label: 'داخلي فقط', count: internalCount }
    ];

    const usageOptions: FilterDropdownOption[] = Array.from(usageMap.entries())
      .sort(([, a], [, b]) => a.score - b.score)
      .map(([sig, info]) => ({
        value: sig,
        label: info.label,
        count: info.count
      }));

    return {
      name: nameOptions,
      id: idOptions,
      typeId: typeOptions,
      ownershipType: ownershipOptions,
      status: statusOptions,
      showToClientDefault: publicOptions,
      usage: usageOptions
    };
  }, [companyEquipments, mergedTypesForTabs, usageByEquipmentId]);

  const getSelectedSummaryPlaceholder = (col: EquipmentSortColumn, defaultPlaceholder: string) => {
    const selected = selectedColumnFilters[col];
    if (selected.length === 0) return defaultPlaceholder;
    const opts = columnOptionsMap[col];
    return selected.map((val) => opts.find((o) => o.value === val)?.label || val).join('، ');
  };

  const handleToggleColumnFilterValue = (col: EquipmentSortColumn, value: string) => {
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

  const handleToggleSort = (col: EquipmentSortColumn) => {
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
      name: '',
      id: '',
      typeId: '',
      ownershipType: '',
      status: '',
      showToClientDefault: '',
      usage: ''
    });
    setSelectedColumnFilters({
      name: [],
      id: [],
      typeId: [],
      ownershipType: [],
      status: [],
      showToClientDefault: [],
      usage: []
    });
    setOpenDropdownCol(null);
    setSortColumn(null);
    setSortDirection('asc');
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const fName = columnFilters.name.trim().toLowerCase();
    const fId = columnFilters.id.trim().toLowerCase();
    const fType = columnFilters.typeId.trim().toLowerCase();
    const fOwnership = columnFilters.ownershipType.trim().toLowerCase();
    const fStatus = columnFilters.status.trim().toLowerCase();
    const fPublic = columnFilters.showToClientDefault.trim().toLowerCase();
    const fUsage = columnFilters.usage.trim().toLowerCase();

    const filtered = companyEquipments.filter((eq) => {
      const matchesTypeTab = selectedTypeTab === 'all' || eq.typeId === selectedTypeTab;
      const matchesSearch =
        !q ||
        eq.name.toLowerCase().includes(q) ||
        eq.id.toLowerCase().includes(q) ||
        eq.classification.toLowerCase().includes(q) ||
        eq.description.toLowerCase().includes(q) ||
        getTypeName(eq.typeId).toLowerCase().includes(q);

      if (!matchesTypeTab || !matchesSearch) return false;

      if (selectedColumnFilters.name.length > 0) {
        if (!selectedColumnFilters.name.includes(eq.name)) return false;
      } else if (fName) {
        const blob = `${eq.name} ${eq.description || ''} ${eq.operationalData.modelYear || ''}`.toLowerCase();
        if (!blob.includes(fName)) return false;
      }

      if (selectedColumnFilters.id.length > 0) {
        if (!selectedColumnFilters.id.includes(eq.id)) return false;
      } else if (fId) {
        const idBlob = `${eq.id} ${eq.operationalData.serialOrRegistrationNo || ''}`.toLowerCase();
        if (!idBlob.includes(fId)) return false;
      }

      if (selectedColumnFilters.typeId.length > 0) {
        if (!selectedColumnFilters.typeId.includes(eq.typeId)) return false;
      } else if (fType) {
        const typeBlob = `${getTypeName(eq.typeId)} ${eq.classification || ''}`.toLowerCase();
        if (!typeBlob.includes(fType)) return false;
      }

      if (selectedColumnFilters.ownershipType.length > 0) {
        if (!selectedColumnFilters.ownershipType.includes(eq.ownershipType)) return false;
      } else if (fOwnership) {
        const ownBlob = `${OWNERSHIP_LABELS[eq.ownershipType]} ${MAINTENANCE_LABELS[eq.operationalData.maintenanceStatus]}`.toLowerCase();
        if (!ownBlob.includes(fOwnership)) return false;
      }

      if (selectedColumnFilters.status.length > 0) {
        if (!selectedColumnFilters.status.includes(eq.status)) return false;
      } else if (fStatus) {
        if (!STATUS_LABELS[eq.status].label.toLowerCase().includes(fStatus)) return false;
      }

      if (selectedColumnFilters.showToClientDefault.length > 0) {
        const val = eq.showToClientDefault ? 'public' : 'internal';
        if (!selectedColumnFilters.showToClientDefault.includes(val)) return false;
      } else if (fPublic) {
        const pubLabel = eq.showToClientDefault ? 'عام للعميل' : 'داخلي فقط';
        if (!pubLabel.toLowerCase().includes(fPublic)) return false;
      }

      const u = usageByEquipmentId.get(eq.id) || {
        activitiesCount: 0,
        specsCount: 0,
        mediaCount: 0
      };
      if (selectedColumnFilters.usage.length > 0) {
        const sig = `${u.activitiesCount}|${u.specsCount}|${u.mediaCount}`;
        if (!selectedColumnFilters.usage.includes(sig)) return false;
      } else if (fUsage) {
        const usageBlob = `${u.activitiesCount} نشاط ${u.specsCount} مواصفة ${u.mediaCount} وسائط`.toLowerCase();
        if (!usageBlob.includes(fUsage)) return false;
      }

      return true;
    });

    if (!sortColumn) return filtered;

    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortColumn) {
        case 'name':
          return a.name.localeCompare(b.name, 'ar') * dir;
        case 'id':
          return a.id.localeCompare(b.id, 'en') * dir;
        case 'typeId':
          return getTypeName(a.typeId).localeCompare(getTypeName(b.typeId), 'ar') * dir;
        case 'ownershipType':
          return (
            OWNERSHIP_LABELS[a.ownershipType].localeCompare(
              OWNERSHIP_LABELS[b.ownershipType],
              'ar'
            ) * dir
          );
        case 'status':
          return (
            STATUS_LABELS[a.status].label.localeCompare(STATUS_LABELS[b.status].label, 'ar') * dir
          );
        case 'showToClientDefault':
          return (Number(b.showToClientDefault) - Number(a.showToClientDefault)) * dir;
        case 'usage': {
          const uA = usageByEquipmentId.get(a.id) || {
            activitiesCount: 0,
            specsCount: 0,
            mediaCount: 0
          };
          const uB = usageByEquipmentId.get(b.id) || {
            activitiesCount: 0,
            specsCount: 0,
            mediaCount: 0
          };
          const scoreA = uA.activitiesCount * 10000 + uA.specsCount * 100 + uA.mediaCount;
          const scoreB = uB.activitiesCount * 10000 + uB.specsCount * 100 + uB.mediaCount;
          return (scoreA - scoreB) * dir;
        }
      }
    });
  }, [
    companyEquipments,
    selectedTypeTab,
    searchQuery,
    columnFilters,
    selectedColumnFilters,
    sortColumn,
    sortDirection,
    equipmentTypes,
    usageByEquipmentId
  ]);

  const renderSortIcon = (col: EquipmentSortColumn) => {
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
      {/* Overview & Add Button (Matching Equipment Properties design) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex flex-wrap items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span>تعديل وإدارة معدات الشركة ({currentUser.companyName})</span>
            <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-2.5 py-0.5 rounded-full font-mono">
              {companyEquipments.length} معدة
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            سجل خاص بالمعدات التي أضافتها شركة ({currentUser.companyName}) فقط للتعديل والحذف والإدارة، ومعزول بالكامل عن معدات الشركات الأخرى.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddEquipment}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة معدة جديدة</span>
        </button>
      </div>

      {/* Filter Pills and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedTypeTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              selectedTypeTab === 'all'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الجميع ({companyEquipments.length})
          </button>
          {mergedTypesForTabs.map((t) => {
            const count = companyEquipments.filter((eq) => eq.typeId === t.id).length;
            if (count === 0) return null;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTypeTab(t.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedTypeTab === t.id
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="بحث في معدات الشركة والمعرفات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Company Equipments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px]">
          <span className="text-slate-400">
            عرض <strong className="text-cyan-300 font-mono">{filteredItems.length}</strong> من أصل{' '}
            <strong className="text-white font-mono">{companyEquipments.length}</strong> معدة خاصة بالشركة
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
                    onClick={() => handleToggleSort('name')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب اسم المعدة"
                  >
                    <span>اسم المعدة</span>
                    {renderSortIcon('name')}
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('id')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب المعرف البرمجي"
                  >
                    <span>المعرف / السيريال</span>
                    {renderSortIcon('id')}
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('typeId')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب نوع المعدة"
                  >
                    <span>نوع المعدة / التصنيف</span>
                    {renderSortIcon('typeId')}
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('ownershipType')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب الملكية والصيانة"
                  >
                    <span>الملكية / الصيانة</span>
                    {renderSortIcon('ownershipType')}
                  </button>
                </th>
                <th className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('status')}
                    className="inline-flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب الحالة التشغيلية"
                  >
                    <span>الحالة التشغيلية</span>
                    {renderSortIcon('status')}
                  </button>
                </th>
                <th className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('showToClientDefault')}
                    className="inline-flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب الظهور للعميل"
                  >
                    <span>الظهور للعميل</span>
                    {renderSortIcon('showToClientDefault')}
                  </button>
                </th>
                <th className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('usage')}
                    className="inline-flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    title="فرز وترتيب حسب الارتباط بالأنشطة والمواصفات"
                  >
                    <span>الارتباط والمواصفات</span>
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
                      col: 'name' as EquipmentSortColumn,
                      placeholder: 'اختر أو اكتب الاسم...',
                      minWidth: 'min-w-[135px]',
                      extraClass: ''
                    },
                    {
                      col: 'id' as EquipmentSortColumn,
                      placeholder: 'EQ- / serial...',
                      minWidth: 'min-w-[110px]',
                      dir: 'ltr' as const,
                      extraClass: 'font-mono text-cyan-300'
                    },
                    {
                      col: 'typeId' as EquipmentSortColumn,
                      placeholder: 'اختر أو اكتب النوع...',
                      minWidth: 'min-w-[125px]',
                      extraClass: ''
                    },
                    {
                      col: 'ownershipType' as EquipmentSortColumn,
                      placeholder: 'اختر أو اكتب الملكية...',
                      minWidth: 'min-w-[115px]',
                      extraClass: ''
                    },
                    {
                      col: 'status' as EquipmentSortColumn,
                      placeholder: 'اختر الحالة...',
                      minWidth: 'min-w-[105px]',
                      extraClass: 'text-center'
                    },
                    {
                      col: 'showToClientDefault' as EquipmentSortColumn,
                      placeholder: 'عام / داخلي...',
                      minWidth: 'min-w-[95px]',
                      extraClass: 'text-center'
                    },
                    {
                      col: 'usage' as EquipmentSortColumn,
                      placeholder: 'نشاط / مواصفة...',
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
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    {companyEquipments.length === 0 ? (
                      <div className="space-y-2">
                        <p>لا توجد معدات مسجلة حالياً باسم شركة ({currentUser.companyName}).</p>
                        <button
                          type="button"
                          onClick={onAddEquipment}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة أول معدة للشركة</span>
                        </button>
                      </div>
                    ) : (
                      'لا توجد معدات مطابقة لفلترة الأعمدة أو البحث في سجل الشركة.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredItems.map((eq) => {
                  const u = usageByEquipmentId.get(eq.id) || {
                    activitiesCount: 0,
                    specsCount: 0,
                    mediaCount: 0
                  };
                  const statusInfo = STATUS_LABELS[eq.status];
                  return (
                    <tr key={eq.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{eq.name}</span>
                          {eq.operationalData.modelYear && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                              {eq.operationalData.modelYear}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {eq.description || eq.classification || 'معدة مسجلة للشركة'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>
                            أضافها: <strong className="text-slate-300">{eq.createdByName || eq.ownerName}</strong> ({eq.createdAtTime || eq.createdAt})
                          </span>
                          {(eq.updatedByName || eq.updatedAtTime) && (
                            <span className="text-cyan-400/90">
                              · آخر تعديل: {eq.updatedByName || eq.ownerName} ({eq.updatedAtTime || eq.updatedAt})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-400 text-xs">
                        <div>{eq.id}</div>
                        {eq.operationalData.serialOrRegistrationNo && (
                          <div className="text-[10px] text-slate-400">
                            {eq.operationalData.serialOrRegistrationNo}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="font-semibold">{getTypeName(eq.typeId)}</div>
                        {eq.classification && (
                          <div className="text-[10px] text-slate-400">{eq.classification}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="font-semibold text-xs">
                          {OWNERSHIP_LABELS[eq.ownershipType]}
                          {eq.partnerName ? ` (${eq.partnerName})` : ''}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">
                          {eq.ownershipDetails || MAINTENANCE_LABELS[eq.operationalData.maintenanceStatus]}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`${statusInfo.textClass} text-[11px] font-semibold`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {eq.showToClientDefault ? (
                          <span className="text-emerald-400 text-[11px] font-semibold">
                            عام للعميل
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">داخلي فقط</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <div className="text-emerald-300 font-bold">{u.activitiesCount} نشاط</div>
                        <div className="text-cyan-300 text-[10px]">
                          {u.specsCount} مواصفة · {u.mediaCount} وسائط
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {confirmDeleteId === eq.id ? (
                            <div className="flex items-center gap-1 bg-red-950/50 border border-red-800/60 rounded-lg px-2 py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteEquipment(eq.id, eq.name);
                                  setConfirmDeleteId(null);
                                }}
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
                                onClick={() => onInspectEquipment(eq)}
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                                title="معاينة المعدة"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditEquipment(eq)}
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 cursor-pointer"
                                title="تعديل المعدة"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(eq.id)}
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-800 cursor-pointer"
                                title="حذف المعدة"
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

        {openDropdownCol &&
          dropdownRect &&
          (() => {
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
                              className={`truncate ${
                                opt.dir === 'ltr' ? 'font-mono text-left' : ''
                              }`}
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
    </div>
  );
};
