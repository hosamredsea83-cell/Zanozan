import React, { useMemo, useState } from 'react';
import {
  FolderTree,
  Plus,
  CheckCircle2,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Database,
  Download,
  Lock
} from 'lucide-react';
import { CategoryNode } from './ActivityEditor';
import { CategoryRecord } from '../../types/activity';
import {
  RegistryColumnFilterDropdown,
  RegistryFilterOption,
  RegistryFilterSummaryBar,
  RegistrySortIcon,
  useRegistryTableState
} from '../shared/RegistryTableControls';

type CategorySortColumn =
  | 'id'
  | 'name'
  | 'handle'
  | 'description'
  | 'activitiesCount'
  | 'level';

const CATEGORY_COLUMNS: readonly CategorySortColumn[] = [
  'id',
  'name',
  'handle',
  'description',
  'activitiesCount',
  'level'
];

const WIDE_CATEGORY_COLS: readonly CategorySortColumn[] = ['name', 'handle', 'description', 'level'];

const CATEGORY_DROPDOWN_TITLES: Record<CategorySortColumn, string> = {
  id: 'تحديد متعدد للمعرّف (Id)',
  name: 'تحديد متعدد لاسم التصنيف',
  handle: 'تحديد متعدد للرابط النصي (Handle)',
  description: 'تحديد متعدد للوصف',
  activitiesCount: 'تحديد متعدد لعدد الأنشطة المرتبطة',
  level: 'تحديد متعدد للمستوى / الأب'
};

interface CategoriesManagerProps {
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
}

const ARABIC_TRANSLIT_MAP: Record<string, string> = {
  أ: 'a',
  إ: 'e',
  آ: 'a',
  ا: 'a',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  ة: 'a',
  و: 'w',
  ؤ: 'w',
  ي: 'y',
  ى: 'a',
  ئ: 'y',
  ء: ''
};

function slugifyPreview(input: string): string {
  const raw = input.trim().toLowerCase();
  if (!raw) return '';
  let out = '';
  for (const ch of raw) {
    if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) {
      out += ch;
    } else if (ch === ' ' || ch === '-' || ch === '_' || ch === '/') {
      out += '-';
    } else if (ARABIC_TRANSLIT_MAP[ch] !== undefined) {
      out += ARABIC_TRANSLIT_MAP[ch];
    }
  }
  return out.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categoryTree,
  categoryRecords,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  // Default state shows only Level 1; each deeper level reveals automatically upon parent selection
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  // Create / Edit modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLinkedCount, setEditingLinkedCount] = useState<number>(0);
  const [targetParentCategoryPath, setTargetParentCategoryPath] = useState<string[]>([]);
  const [targetParentId, setTargetParentId] = useState<string | null>(null);

  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formHandle, setFormHandle] = useState('');
  const [isHandleManuallyEdited, setIsHandleManuallyEdited] = useState(false);
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table search / filter / inline delete confirmation state
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const tableState = useRegistryTableState<CategorySortColumn>(CATEGORY_COLUMNS);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const notifySuccess = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((prev) => (prev === msg ? null : prev)), 3500);
  };

  const visibleLevels = selectedPath.length + 1;

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

  const getChildrenAtLevel = (levelIdx: number): { children: CategoryNode[]; isAvailable: boolean } => {
    if (levelIdx === 0) {
      return { children: categoryTree, isAvailable: true };
    }
    let currentNodes: CategoryNode[] = categoryTree;
    for (let i = 0; i < levelIdx; i++) {
      const selectedName = selectedPath[i];
      if (!selectedName) {
        return { children: [], isAvailable: false };
      }
      const match = currentNodes.find((n) => n.name === selectedName);
      if (!match) {
        return { children: [], isAvailable: false };
      }
      currentNodes = match.children || [];
    }
    return { children: currentNodes, isAvailable: selectedPath.length >= levelIdx };
  };

  const openCreateModal = (parentPath: string[], parentId: string | null = null) => {
    setModalMode('create');
    setEditingId(null);
    setEditingLinkedCount(0);
    setTargetParentCategoryPath(parentPath);
    setTargetParentId(parentId);
    setFormId('');
    setFormName('');
    setFormHandle('');
    setIsHandleManuallyEdited(false);
    setFormDescription('');
    setFormError(null);
  };

  const openEditModal = (record: CategoryRecord) => {
    setModalMode('edit');
    setEditingId(record.id);
    setEditingLinkedCount(record.activitiesCount ?? 0);
    setTargetParentCategoryPath([]);
    setTargetParentId(record.parentId);
    setFormId(record.id);
    setFormName(record.name);
    setFormHandle(record.handle);
    setIsHandleManuallyEdited(true);
    setFormDescription(record.description);
    setFormError(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
    setEditingLinkedCount(0);
    setFormError(null);
  };

  const isNameOnlyEdit = modalMode === 'edit' && editingLinkedCount > 0;

  const handleSubmitModal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('يرجى إدخال اسم التصنيف (Name)');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (modalMode === 'create') {
        const created = await onCreateCategory({
          id: formId.trim() || undefined,
          name: trimmedName,
          handle: formHandle.trim() || undefined,
          description: formDescription.trim(),
          parentId: targetParentId,
          parentPath: targetParentId ? undefined : targetParentCategoryPath
        });
        const nextPath = [...targetParentCategoryPath, created.name];
        if (!targetParentId) {
          setSelectedPath(nextPath);
        }
        notifySuccess(`✓ تم حفظ السجل "${created.name}" (${created.id}) في جدول التصنيفات`);
        closeModal();
      } else if (modalMode === 'edit' && editingId) {
        const updated = await onUpdateCategory(
          editingId,
          isNameOnlyEdit
            ? { name: trimmedName }
            : {
                name: trimmedName,
                handle: formHandle.trim() || undefined,
                description: formDescription.trim()
              }
        );
        notifySuccess(`✓ تم تحديث السجل "${updated.name}" (${updated.id}) بنجاح`);
        closeModal();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'تعذر حفظ السجل في قاعدة البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (record: CategoryRecord) => {
    if ((record.activitiesCount ?? 0) > 0) {
      setPendingDeleteId(null);
      notifySuccess('لا يمكن حذف هذا التصنيف لوجود أنشطة مرتبطة به؛ يمكنك تعديل الاسم فقط.');
      return;
    }
    try {
      await onDeleteCategory(record.id);
      setPendingDeleteId(null);
      setSelectedPath((prev) => {
        const idx = prev.indexOf(record.name);
        return idx >= 0 ? prev.slice(0, idx) : prev;
      });
      notifySuccess(`✓ تم حذف التصنيف "${record.name}" (${record.id}) من قاعدة البيانات`);
    } catch (err) {
      setPendingDeleteId(null);
      notifySuccess(err instanceof Error ? err.message : 'تعذر حذف السجل');
    }
  };

  const handleExportLocalJson = () => {
    const payload = categoryRecords.map(({ id, name, handle, description, parentId, level, activitiesCount }) => ({
      Id: id,
      Name: name,
      Handle: handle,
      Description: description,
      ParentId: parentId,
      Level: level,
      ActivitiesCount: activitiesCount ?? 0
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories-local-db-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notifySuccess('✓ تم تنزيل نسخة من جدول التصنيفات على جهازك');
  };

  const recordMap = useMemo(() => {
    const map = new Map<string, CategoryRecord>();
    for (const rec of categoryRecords) {
      map.set(rec.id, rec);
    }
    return map;
  }, [categoryRecords]);

  const availableLevels = useMemo(() => {
    const levels = Array.from(new Set(categoryRecords.map((r) => r.level))).sort((a, b) => a - b);
    return levels;
  }, [categoryRecords]);

  const getLevelLabel = (rec: CategoryRecord) => {
    const parentName = rec.parentId ? recordMap.get(rec.parentId)?.name : null;
    return `L${rec.level}${parentName ? ` · ${parentName}` : ' · رئيسي'}`;
  };

  const columnOptionsMap = useMemo<Record<CategorySortColumn, RegistryFilterOption[]>>(() => {
    const idCounts = new Map<string, { name: string; count: number }>();
    const nameCounts = new Map<string, { id: string; count: number }>();
    const handleCounts = new Map<string, number>();
    const descCounts = new Map<string, number>();
    const linkedCounts = new Map<number, number>();
    const levelCounts = new Map<string, number>();

    categoryRecords.forEach((rec) => {
      const prevId = idCounts.get(rec.id);
      idCounts.set(rec.id, { name: rec.name, count: (prevId?.count || 0) + 1 });

      const prevName = nameCounts.get(rec.name);
      nameCounts.set(rec.name, { id: rec.id, count: (prevName?.count || 0) + 1 });

      handleCounts.set(rec.handle, (handleCounts.get(rec.handle) || 0) + 1);

      const descVal = rec.description || '—';
      descCounts.set(descVal, (descCounts.get(descVal) || 0) + 1);

      const cnt = rec.activitiesCount ?? 0;
      linkedCounts.set(cnt, (linkedCounts.get(cnt) || 0) + 1);

      const lvlLabel = getLevelLabel(rec);
      levelCounts.set(lvlLabel, (levelCounts.get(lvlLabel) || 0) + 1);
    });

    return {
      id: Array.from(idCounts.entries()).map(([val, meta]) => ({
        value: val,
        label: val,
        subLabel: meta.name,
        dir: 'ltr',
        count: meta.count
      })),
      name: Array.from(nameCounts.entries()).map(([val, meta]) => ({
        value: val,
        label: val,
        subLabel: meta.id,
        count: meta.count
      })),
      handle: Array.from(handleCounts.entries()).map(([val, count]) => ({
        value: val,
        label: val,
        dir: 'ltr',
        count
      })),
      description: Array.from(descCounts.entries()).map(([val, count]) => ({
        value: val,
        label: val,
        count
      })),
      activitiesCount: Array.from(linkedCounts.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([cnt, total]) => ({
          value: String(cnt),
          label: `${cnt} نشاط`,
          count: total
        })),
      level: Array.from(levelCounts.entries()).map(([val, count]) => ({
        value: val,
        label: val,
        count
      }))
    };
  }, [categoryRecords, recordMap]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const {
      columnFilters: cf,
      selectedColumnFilters: scf,
      sortColumn,
      sortDirection
    } = tableState;

    const fId = cf.id.trim().toLowerCase();
    const fName = cf.name.trim().toLowerCase();
    const fHandle = cf.handle.trim().toLowerCase();
    const fDesc = cf.description.trim().toLowerCase();
    const fCount = cf.activitiesCount.trim().toLowerCase();
    const fLevel = cf.level.trim().toLowerCase();

    const filtered = categoryRecords.filter((rec) => {
      if (levelFilter !== 'all' && rec.level !== Number(levelFilter)) {
        return false;
      }
      if (q) {
        const blob = `${rec.id} ${rec.name} ${rec.handle} ${rec.description} ${getLevelLabel(rec)}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }

      if (scf.id.length > 0) {
        if (!scf.id.includes(rec.id)) return false;
      } else if (fId) {
        if (!rec.id.toLowerCase().includes(fId)) return false;
      }

      if (scf.name.length > 0) {
        if (!scf.name.includes(rec.name)) return false;
      } else if (fName) {
        if (!rec.name.toLowerCase().includes(fName)) return false;
      }

      if (scf.handle.length > 0) {
        if (!scf.handle.includes(rec.handle)) return false;
      } else if (fHandle) {
        if (!rec.handle.toLowerCase().includes(fHandle)) return false;
      }

      const descVal = rec.description || '—';
      if (scf.description.length > 0) {
        if (!scf.description.includes(descVal)) return false;
      } else if (fDesc) {
        if (!descVal.toLowerCase().includes(fDesc)) return false;
      }

      const cnt = rec.activitiesCount ?? 0;
      if (scf.activitiesCount.length > 0) {
        if (!scf.activitiesCount.includes(String(cnt))) return false;
      } else if (fCount) {
        if (!`${cnt} نشاط`.toLowerCase().includes(fCount)) return false;
      }

      const lvlLabel = getLevelLabel(rec);
      if (scf.level.length > 0) {
        if (!scf.level.includes(lvlLabel)) return false;
      } else if (fLevel) {
        if (!lvlLabel.toLowerCase().includes(fLevel)) return false;
      }

      return true;
    });

    if (!sortColumn) return filtered;

    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortColumn) {
        case 'id':
          return a.id.localeCompare(b.id, 'en') * dir;
        case 'name':
          return a.name.localeCompare(b.name, 'ar') * dir;
        case 'handle':
          return a.handle.localeCompare(b.handle, 'en') * dir;
        case 'description':
          return (a.description || '').localeCompare(b.description || '', 'ar') * dir;
        case 'activitiesCount':
          return ((a.activitiesCount ?? 0) - (b.activitiesCount ?? 0)) * dir;
        case 'level':
          if (a.level !== b.level) return (a.level - b.level) * dir;
          return getLevelLabel(a).localeCompare(getLevelLabel(b), 'ar') * dir;
      }
    });
  }, [
    categoryRecords,
    recordMap,
    searchQuery,
    levelFilter,
    tableState.columnFilters,
    tableState.selectedColumnFilters,
    tableState.sortColumn,
    tableState.sortDirection
  ]);

  const filterColumnsConfig: Array<{
    col: CategorySortColumn;
    placeholder: string;
    minWidth: string;
    dir?: 'ltr' | 'rtl';
    extraClass?: string;
    getLabel?: (v: string) => string;
  }> = [
    { col: 'id', placeholder: 'Id...', minWidth: 'min-w-[85px]', dir: 'ltr', extraClass: 'font-mono' },
    { col: 'name', placeholder: 'اختر أو اكتب الاسم...', minWidth: 'min-w-[120px]' },
    { col: 'handle', placeholder: 'Handle...', minWidth: 'min-w-[110px]', dir: 'ltr', extraClass: 'font-mono' },
    { col: 'description', placeholder: 'اختر أو اكتب الوصف...', minWidth: 'min-w-[130px]' },
    {
      col: 'activitiesCount',
      placeholder: 'عدد الأنشطة...',
      minWidth: 'min-w-[90px]',
      extraClass: 'text-center',
      getLabel: (v) => `${v} نشاط`
    },
    { col: 'level', placeholder: 'المستوى / الأب...', minWidth: 'min-w-[115px]', extraClass: 'text-center' }
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {toastMsg && (
        <div className="px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-2 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Multi-Level Categories Builder & Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-cyan-400" />
              1. التصنيف متعدد المستويات (Multi-Level Category Hierarchy)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              يبدأ الاختيار بالمستوى الأول، وعند تحديد أي تصنيف يظهر المستوى التالي تلقائياً للإضافة أو الاختيار دون حد أقصى.
            </p>
          </div>
        </div>

        {/* Cascading Multi-Level Selection Columns */}
        <div className="space-y-3 pt-1">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>تصفح وتحديد المستويات خطوة بخطوة:</span>
            <span className="text-[11px] text-cyan-400">يظهر المستوى التالي تلقائياً عند تحديد المستوى السابق</span>
          </div>

          {/* Dynamic Cascading Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: visibleLevels }, (_, levelIdx) => {
              const { children, isAvailable } = getChildrenAtLevel(levelIdx);
              const meta = getLevelMeta(levelIdx);
              const parentPath = selectedPath.slice(0, levelIdx);
              const parentLabel = parentPath[levelIdx - 1];

              return (
                <div
                  key={levelIdx}
                  className={`bg-slate-950 border rounded-xl p-3 flex flex-col justify-between space-y-2 ${
                    isAvailable ? 'border-slate-800' : 'border-slate-850 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-1">
                      <span className="font-bold text-slate-200">{meta.title}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono text-slate-500">{children.length} خيارات</span>
                      </div>
                    </div>
                    <select
                      disabled={!isAvailable || children.length === 0}
                      value={selectedPath[levelIdx] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedPath((prev) =>
                          val ? [...prev.slice(0, levelIdx), val] : prev.slice(0, levelIdx)
                        );
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                    >
                      <option value="">
                        {children.length === 0 ? '-- لا توجد تصنيفات فرعية بعد --' : meta.placeholder}
                      </option>
                      {children.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {isAvailable && (
                    <button
                      type="button"
                      onClick={() => openCreateModal(parentPath, null)}
                      className="w-full text-right text-[11px] text-cyan-400 hover:text-cyan-300 py-1 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>
                        {levelIdx === 0
                          ? '+ تصنيف رئيسي جديد بالمستوى 1'
                          : `+ إضافة تصنيف تحت (${parentLabel})`}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Database Table View: Categories (Id, Name, Handle, Description) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>جدول التصنيفات في قاعدة البيانات (Categories)</span>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                {categoryRecords.length} سجل
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              يُحفظ كل سجل بالحقول الأساسية (Id، Name، Handle، Description، ActivitiesCount) بشكل دائم في جدول التصنيفات.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بـ Id أو Name أو Handle..."
                className="bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-56"
              />
            </div>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">كل المستويات</option>
              {availableLevels.map((lvl) => (
                <option key={lvl} value={String(lvl)}>
                  المستوى L{lvl}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleExportLocalJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
              title="تنزيل نسخة ملف JSON على جهازك"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>تصدير للجهاز</span>
            </button>

            <button
              type="button"
              onClick={() => openCreateModal([], null)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة سجل تصنيف</span>
            </button>
          </div>
        </div>

        <div className="w-full rounded-lg sm:rounded-xl border border-slate-800 overflow-hidden">
          <RegistryFilterSummaryBar
            filteredCount={filteredRecords.length}
            totalCount={categoryRecords.length}
            itemNoun="سجل تصنيف"
            sortColumn={tableState.sortColumn}
            sortDirection={tableState.sortDirection}
            hasActiveFilters={tableState.hasActiveFilters}
            onClearAll={tableState.handleClearAll}
          />
          <div className="w-full overflow-x-auto">
            <table className="w-full table-auto text-right border-collapse text-[clamp(0.65rem,0.55rem+0.45vw,0.95rem)] leading-snug">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                  <th className="py-[clamp(0.4rem,0.25rem+0.45vw,0.9rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] font-bold sm:whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => tableState.handleToggleSort('id')}
                      className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>Id</span>
                      <RegistrySortIcon
                        column="id"
                        sortColumn={tableState.sortColumn}
                        sortDirection={tableState.sortDirection}
                      />
                    </button>
                  </th>
                  <th className="py-[clamp(0.4rem,0.25rem+0.45vw,0.9rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] font-bold sm:whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => tableState.handleToggleSort('name')}
                      className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>Name</span>
                      <RegistrySortIcon
                        column="name"
                        sortColumn={tableState.sortColumn}
                        sortDirection={tableState.sortDirection}
                      />
                    </button>
                  </th>
                  <th className="py-[clamp(0.4rem,0.25rem+0.45vw,0.9rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] font-bold sm:whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => tableState.handleToggleSort('handle')}
                      className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>Handle</span>
                      <RegistrySortIcon
                        column="handle"
                        sortColumn={tableState.sortColumn}
                        sortDirection={tableState.sortDirection}
                      />
                    </button>
                  </th>
                  <th className="py-[clamp(0.4rem,0.25rem+0.45vw,0.9rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] font-bold">
                    <button
                      type="button"
                      onClick={() => tableState.handleToggleSort('description')}
                      className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>Description</span>
                      <RegistrySortIcon
                        column="description"
                        sortColumn={tableState.sortColumn}
                        sortDirection={tableState.sortDirection}
                      />
                    </button>
                  </th>
                  <th className="py-[clamp(0.4rem,0.25rem+0.45vw,0.9rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] font-bold text-center sm:whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => tableState.handleToggleSort('activitiesCount')}
                      className="inline-flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>الأنشطة المرتبطة</span>
                      <RegistrySortIcon
                        column="activitiesCount"
                        sortColumn={tableState.sortColumn}
                        sortDirection={tableState.sortDirection}
                      />
                    </button>
                  </th>
                  <th className="py-[clamp(0.4rem,0.25rem+0.45vw,0.9rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] font-bold text-center sm:whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => tableState.handleToggleSort('level')}
                      className="inline-flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>المستوى / الأب</span>
                      <RegistrySortIcon
                        column="level"
                        sortColumn={tableState.sortColumn}
                        sortDirection={tableState.sortDirection}
                      />
                    </button>
                  </th>
                  <th className="py-[clamp(0.4rem,0.25rem+0.45vw,0.9rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] font-bold text-center whitespace-nowrap">إجراءات</th>
                </tr>

                {/* Searchable Multi-Select Column Filter Row */}
                <tr className="bg-slate-900/90 border-t border-slate-800/80 font-normal">
                  {filterColumnsConfig.map(({ col, placeholder, minWidth, dir, extraClass = '', getLabel }) => {
                    const hasSelected = tableState.selectedColumnFilters[col].length > 0;
                    return (
                      <th key={col} className="p-2">
                        <input
                          ref={(el) => {
                            tableState.filterInputRefs.current[col] = el;
                          }}
                          type="text"
                          dir={dir}
                          placeholder={tableState.getSelectedSummaryPlaceholder(col, placeholder, getLabel)}
                          value={tableState.columnFilters[col]}
                          onFocus={() => {
                            tableState.updateDropdownPosition(col, WIDE_CATEGORY_COLS);
                            tableState.setOpenDropdownCol(col);
                          }}
                          onClick={() => {
                            tableState.updateDropdownPosition(col, WIDE_CATEGORY_COLS);
                            tableState.setOpenDropdownCol(col);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') tableState.setOpenDropdownCol(null);
                          }}
                          onChange={(e) => {
                            tableState.setColumnFilters((prev) => ({
                              ...prev,
                              [col]: e.target.value
                            }));
                            if (tableState.openDropdownCol !== col) {
                              tableState.updateDropdownPosition(col, WIDE_CATEGORY_COLS);
                              tableState.setOpenDropdownCol(col);
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
                    {tableState.hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={tableState.handleClearAll}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 text-[10px] font-semibold cursor-pointer"
                      >
                        مسح
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-600">—</span>
                    )}
                  </th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-[clamp(1.25rem,0.9rem+1.2vw,2.5rem)] px-3 text-center text-slate-400">
                    لا توجد سجلات مطابقة في جدول التصنيفات.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const parentName = rec.parentId ? recordMap.get(rec.parentId)?.name : null;
                  const linkedCount = rec.activitiesCount ?? 0;
                  const hasLinkedActivities = linkedCount > 0;
                  const isDeleting = !hasLinkedActivities && pendingDeleteId === rec.id;
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td
                        className="py-[clamp(0.35rem,0.22rem+0.4vw,0.8rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] font-mono text-[clamp(0.58rem,0.48rem+0.38vw,0.88rem)] text-cyan-300 break-all sm:break-normal sm:whitespace-nowrap max-w-[75px] sm:max-w-none"
                        dir="ltr"
                      >
                        {rec.id}
                      </td>
                      <td className="py-[clamp(0.35rem,0.22rem+0.4vw,0.8rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] font-semibold text-white break-words sm:whitespace-nowrap">
                        {rec.name}
                      </td>
                      <td
                        className="py-[clamp(0.35rem,0.22rem+0.4vw,0.8rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] font-mono text-[clamp(0.58rem,0.48rem+0.38vw,0.88rem)] text-emerald-300 break-all sm:break-normal sm:whitespace-nowrap max-w-[85px] sm:max-w-none"
                        dir="ltr"
                      >
                        {rec.handle}
                      </td>
                      <td className="py-[clamp(0.35rem,0.22rem+0.4vw,0.8rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] text-slate-300 max-w-[110px] sm:max-w-xs lg:max-w-md xl:max-w-xl break-words">
                        {rec.description || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-[clamp(0.35rem,0.22rem+0.4vw,0.8rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] text-center sm:whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-[clamp(0.35rem,0.22rem+0.35vw,0.7rem)] py-[clamp(0.1rem,0.06rem+0.15vw,0.28rem)] rounded border text-[clamp(0.58rem,0.48rem+0.35vw,0.85rem)] font-mono ${
                            hasLinkedActivities
                              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                          title={
                            hasLinkedActivities
                              ? `مرتبط بـ ${linkedCount} نشاط (محمي من الحذف — تعديل الاسم فقط)`
                              : 'لا توجد أنشطة مرتبطة بهذا التصنيف'
                          }
                        >
                          {hasLinkedActivities && <Lock className="w-3 h-3 shrink-0" />}
                          <span>{linkedCount}</span>
                          <span>نشاط</span>
                        </span>
                      </td>
                      <td className="py-[clamp(0.35rem,0.22rem+0.4vw,0.8rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] text-center sm:whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-[clamp(0.3rem,0.2rem+0.35vw,0.65rem)] py-[clamp(0.1rem,0.06rem+0.15vw,0.28rem)] rounded bg-slate-950 border border-slate-700 text-[clamp(0.55rem,0.45rem+0.35vw,0.82rem)] font-mono text-slate-300">
                          L{rec.level}
                          {parentName ? ` · ${parentName}` : ' · رئيسي'}
                        </span>
                      </td>
                      <td className="py-[clamp(0.35rem,0.22rem+0.4vw,0.8rem)] px-[clamp(0.35rem,0.2rem+0.55vw,1rem)] text-center whitespace-nowrap">
                        {isDeleting ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(rec)}
                              className="px-[clamp(0.35rem,0.25rem+0.3vw,0.65rem)] py-[clamp(0.15rem,0.1rem+0.2vw,0.35rem)] bg-rose-600 hover:bg-rose-500 text-white rounded text-[clamp(0.58rem,0.48rem+0.35vw,0.82rem)] font-bold"
                            >
                              تأكيد الحذف
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(null)}
                              className="px-[clamp(0.35rem,0.25rem+0.3vw,0.65rem)] py-[clamp(0.15rem,0.1rem+0.2vw,0.35rem)] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[clamp(0.58rem,0.48rem+0.35vw,0.82rem)]"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-[clamp(0.15rem,0.1rem+0.2vw,0.4rem)]">
                            <button
                              type="button"
                              onClick={() => openEditModal(rec)}
                              title={
                                hasLinkedActivities
                                  ? 'تعديل الاسم فقط (التصنيف مرتبط بأنشطة)'
                                  : 'تعديل السجل'
                              }
                              className="p-[clamp(0.2rem,0.14rem+0.22vw,0.45rem)] rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-[clamp(0.75rem,0.65rem+0.32vw,1.05rem)] h-[clamp(0.75rem,0.65rem+0.32vw,1.05rem)]" />
                            </button>
                            <button
                              type="button"
                              disabled={hasLinkedActivities}
                              onClick={() => {
                                if (!hasLinkedActivities) {
                                  setPendingDeleteId(rec.id);
                                }
                              }}
                              title={
                                hasLinkedActivities
                                  ? 'لا يمكن حذف هذا التصنيف لوجود أنشطة مرتبطة به (يمكن تعديل الاسم فقط)'
                                  : 'حذف السجل'
                              }
                              className={`p-[clamp(0.2rem,0.14rem+0.22vw,0.45rem)] rounded-lg transition-colors ${
                                hasLinkedActivities
                                  ? 'text-slate-600 opacity-35 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                              }`}
                            >
                              <Trash2 className="w-[clamp(0.75rem,0.65rem+0.32vw,1.05rem)] h-[clamp(0.75rem,0.65rem+0.32vw,1.05rem)]" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>

          {tableState.openDropdownCol && tableState.dropdownRect && (
            <RegistryColumnFilterDropdown
              activeCol={tableState.openDropdownCol}
              dropdownRect={tableState.dropdownRect}
              activeDropdownRef={tableState.activeDropdownRef}
              title={CATEGORY_DROPDOWN_TITLES[tableState.openDropdownCol]}
              options={columnOptionsMap[tableState.openDropdownCol] || []}
              filterText={tableState.columnFilters[tableState.openDropdownCol]}
              selectedValues={tableState.selectedColumnFilters[tableState.openDropdownCol]}
              onToggleValue={tableState.handleToggleColumnFilterValue}
              onClearCol={tableState.handleClearCol}
              onClose={() => tableState.setOpenDropdownCol(null)}
            />
          )}
        </div>
      </div>

      {/* Modal: Create or Edit Category Record (Id, Name, Handle, Description) */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleSubmitModal}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">
                  {modalMode === 'edit'
                    ? `تعديل سجل التصنيف (${editingId})`
                    : `إضافة سجل تصنيف جديد (المستوى L${targetParentCategoryPath.length + 1})`}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            {isNameOnlyEdit && (
              <div className="px-3 py-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  هذا التصنيف مرتبط بـ <strong>{editingLinkedCount}</strong> نشاط؛ لا يمكن حذفه ويمكن تعديل الاسم (Name) فقط.
                </span>
              </div>
            )}

            {formError && (
              <div className="px-3 py-2 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {modalMode === 'create' && (
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    موقع الإضافة في الشجرة:
                  </label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-cyan-300 font-mono">
                    {targetParentCategoryPath.length === 0 ? (
                      <span>التصنيف الأساسي الرئيسي (المستوى 1)</span>
                    ) : (
                      <span>
                        مستوى فرعي (L{targetParentCategoryPath.length + 1}) داخل:{' '}
                        {targetParentCategoryPath.join(' ← ')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  1. المعرّف (Id) {modalMode === 'create' && <span className="text-slate-500 font-normal">(اختياري — يُنشأ تلقائياً إذا تُرك فارغاً)</span>}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  disabled={modalMode === 'edit'}
                  placeholder="مثال: cat-diving-vip"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  2. الاسم (Name) *
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="أدخل اسم التصنيف (مثال: رحلات غوص خاصة)..."
                  value={formName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormName(val);
                    if (!isHandleManuallyEdited && modalMode === 'create') {
                      setFormHandle(slugifyPreview(val));
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  3. المعرّف النصي للرابط (Handle){' '}
                  {isNameOnlyEdit && <span className="text-amber-400 font-normal">(مغلق لوجود أنشطة مرتبطة)</span>}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  disabled={isNameOnlyEdit}
                  placeholder="example: private-diving-trips"
                  value={formHandle}
                  onChange={(e) => {
                    setIsHandleManuallyEdited(true);
                    setFormHandle(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-300 font-mono text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  4. الوصف (Description){' '}
                  {isNameOnlyEdit && <span className="text-amber-400 font-normal">(مغلق لوجود أنشطة مرتبطة)</span>}
                </label>
                <textarea
                  rows={3}
                  disabled={isNameOnlyEdit}
                  placeholder="اكتب وصفاً واضحاً للتصنيف..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                {isSubmitting
                  ? 'جاري الحفظ...'
                  : modalMode === 'edit'
                  ? 'حفظ التعديلات في قاعدة البيانات'
                  : 'حفظ في جدول التصنيفات'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
