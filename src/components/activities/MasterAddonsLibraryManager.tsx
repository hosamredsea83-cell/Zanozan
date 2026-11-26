import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  RotateCcw,
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
  Tag
} from 'lucide-react';
import type { Activity } from '../../types/activity';
import { MASTER_ADDON_CATEGORIES, MasterAddonItem } from '../../types/addon';
import {
  RegistryColumnFilterDropdown,
  RegistryFilterOption,
  RegistryFilterSummaryBar,
  RegistrySortIcon,
  useRegistryTableState
} from '../shared/RegistryTableControls';

interface MasterAddonsLibraryManagerProps {
  masterAddons: MasterAddonItem[];
  activities: Activity[];
  onCreateAddon: (
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
  ) => void;
  onUpdateAddon: (id: string, patch: Partial<MasterAddonItem>) => void;
  onDeleteAddon: (id: string) => void;
  onResetCatalog: () => void;
}

const ADDON_COLUMNS = [
  'title',
  'category',
  'unitLabel',
  'suggestedPriceEGP',
  'status',
  'audit',
  'usage'
] as const;

type AddonSortColumn = (typeof ADDON_COLUMNS)[number];

const COLUMN_DROPDOWN_TITLES: Record<AddonSortColumn, string> = {
  title: 'تحديد متعدد للخدمات الإضافية',
  category: 'تحديد متعدد للتصنيفات',
  unitLabel: 'تحديد متعدد لوحدة الاحتساب',
  suggestedPriceEGP: 'تحديد متعدد للنطاق السعري',
  status: 'تحديد متعدد للحالة',
  audit: 'تحديد متعدد لمنفّذ الإضافة',
  usage: 'تحديد متعدد لمعدل الاستخدام'
};

export const MasterAddonsLibraryManager: React.FC<MasterAddonsLibraryManagerProps> = ({
  masterAddons,
  activities,
  onCreateAddon,
  onUpdateAddon,
  onDeleteAddon,
  onResetCatalog
}) => {
  const [globalSearch, setGlobalSearch] = useState('');
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(MASTER_ADDON_CATEGORIES[0]);
  const [unitLabel, setUnitLabel] = useState('للفرد');
  const [suggestedPriceEGP, setSuggestedPriceEGP] = useState<number>(300);
  const [suggestedPriceEUR, setSuggestedPriceEUR] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const tableState = useRegistryTableState<AddonSortColumn>(ADDON_COLUMNS);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3200);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory(MASTER_ADDON_CATEGORIES[0]);
    setUnitLabel('للفرد');
    setSuggestedPriceEGP(300);
    setSuggestedPriceEUR(10);
    setDescription('');
    setIsActive(true);
    setShowInlineForm(false);
  };

  const handleStartCreate = () => {
    resetForm();
    setShowInlineForm(true);
  };

  const handleStartEdit = (item: MasterAddonItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setUnitLabel(item.unitLabel);
    setSuggestedPriceEGP(item.suggestedPriceEGP);
    setSuggestedPriceEUR(item.suggestedPriceEUR);
    setDescription(item.description);
    setIsActive(item.isActive);
    setShowInlineForm(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    if (editingId) {
      onUpdateAddon(editingId, {
        title: trimmed,
        category: category.trim() || MASTER_ADDON_CATEGORIES[0],
        unitLabel: unitLabel.trim() || 'للفرد',
        suggestedPriceEGP: Math.max(0, Number(suggestedPriceEGP) || 0),
        suggestedPriceEUR: Math.max(0, Number(suggestedPriceEUR) || 0),
        description: description.trim(),
        isActive
      });
      showToast(`✓ تم تحديث الخدمة المركزية «${trimmed}» بنجاح`);
    } else {
      onCreateAddon({
        title: trimmed,
        category: category.trim() || MASTER_ADDON_CATEGORIES[0],
        unitLabel: unitLabel.trim() || 'للفرد',
        suggestedPriceEGP: Math.max(0, Number(suggestedPriceEGP) || 0),
        suggestedPriceEUR: Math.max(0, Number(suggestedPriceEUR) || 0),
        description: description.trim(),
        isActive
      });
      showToast(`✓ تمت إضافة «${trimmed}» إلى مكتبة الإضافات المركزية`);
    }
    resetForm();
  };

  // Usage map across activities
  const usageCountById = useMemo(() => {
    const map = new Map<string, number>();
    masterAddons.forEach((addon) => {
      const count = activities.filter((act) =>
        (act.inclusions?.paidAddons || []).some(
          (pa) =>
            pa.addonId === addon.id ||
            pa.title.trim().toLowerCase() === addon.title.trim().toLowerCase()
        )
      ).length;
      map.set(addon.id, count);
    });
    return map;
  }, [masterAddons, activities]);

  // Filter options per column
  const columnFilterOptions = useMemo<Record<AddonSortColumn, RegistryFilterOption[]>>(() => {
    const buildCounts = (extractor: (item: MasterAddonItem) => { value: string; label: string; subLabel?: string }) => {
      const map = new Map<string, { label: string; subLabel?: string; count: number }>();
      masterAddons.forEach((item) => {
        const { value, label, subLabel } = extractor(item);
        const prev = map.get(value);
        if (prev) prev.count += 1;
        else map.set(value, { label, subLabel, count: 1 });
      });
      return Array.from(map.entries()).map(([value, meta]) => ({
        value,
        label: meta.label,
        subLabel: meta.subLabel,
        count: meta.count
      }));
    };

    return {
      title: buildCounts((i) => ({ value: i.title, label: i.title, subLabel: i.description })),
      category: buildCounts((i) => ({ value: i.category, label: i.category })),
      unitLabel: buildCounts((i) => ({ value: i.unitLabel, label: i.unitLabel })),
      suggestedPriceEGP: buildCounts((i) => ({
        value: `${i.suggestedPriceEGP}`,
        label: `${i.suggestedPriceEGP} ج.م / €${i.suggestedPriceEUR}`
      })),
      status: buildCounts((i) => ({
        value: i.isActive ? 'active' : 'inactive',
        label: i.isActive ? 'مفعّلة في البحث الذكي' : 'مخفية مؤقتاً'
      })),
      audit: buildCounts((i) => ({
        value: i.createdByName || 'نظام المنصة',
        label: i.createdByName || 'نظام المنصة',
        subLabel: i.createdAtTime || '—'
      })),
      usage: buildCounts((i) => {
        const cnt = usageCountById.get(i.id) || 0;
        return {
          value: String(cnt),
          label: `${cnt} نشاط مرتبط`
        };
      })
    };
  }, [masterAddons, usageCountById]);

  const filteredAddons = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    const list = masterAddons.filter((item) => {
      if (q) {
        const hay = `${item.title} ${item.category} ${item.unitLabel} ${item.description} ${item.createdByName || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      const f = tableState.columnFilters;
      const sel = tableState.selectedColumnFilters;
      const usageCnt = usageCountById.get(item.id) || 0;
      const statusKey = item.isActive ? 'active' : 'inactive';
      const statusLabel = item.isActive ? 'مفعّلة في البحث الذكي' : 'مخفية مؤقتاً';
      const auditActor = item.createdByName || 'نظام المنصة';

      if (f.title && !item.title.toLowerCase().includes(f.title.trim().toLowerCase())) return false;
      if (f.category && !item.category.toLowerCase().includes(f.category.trim().toLowerCase())) return false;
      if (f.unitLabel && !item.unitLabel.toLowerCase().includes(f.unitLabel.trim().toLowerCase())) return false;
      if (
        f.suggestedPriceEGP &&
        !`${item.suggestedPriceEGP} ${item.suggestedPriceEUR}`.includes(f.suggestedPriceEGP.trim())
      ) {
        return false;
      }
      if (f.status && !statusLabel.toLowerCase().includes(f.status.trim().toLowerCase())) return false;
      if (
        f.audit &&
        !`${auditActor} ${item.updatedByName || ''} ${item.createdAtTime || ''}`
          .toLowerCase()
          .includes(f.audit.trim().toLowerCase())
      ) {
        return false;
      }
      if (f.usage && !`${usageCnt}`.includes(f.usage.trim())) return false;

      if (sel.title.length > 0 && !sel.title.includes(item.title)) return false;
      if (sel.category.length > 0 && !sel.category.includes(item.category)) return false;
      if (sel.unitLabel.length > 0 && !sel.unitLabel.includes(item.unitLabel)) return false;
      if (sel.suggestedPriceEGP.length > 0 && !sel.suggestedPriceEGP.includes(String(item.suggestedPriceEGP))) return false;
      if (sel.status.length > 0 && !sel.status.includes(statusKey)) return false;
      if (sel.audit.length > 0 && !sel.audit.includes(auditActor)) return false;
      if (sel.usage.length > 0 && !sel.usage.includes(String(usageCnt))) return false;

      return true;
    });

    if (tableState.sortColumn) {
      const dir = tableState.sortDirection === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        switch (tableState.sortColumn) {
          case 'title':
            return a.title.localeCompare(b.title, 'ar') * dir;
          case 'category':
            return a.category.localeCompare(b.category, 'ar') * dir;
          case 'unitLabel':
            return a.unitLabel.localeCompare(b.unitLabel, 'ar') * dir;
          case 'suggestedPriceEGP':
            return (a.suggestedPriceEGP - b.suggestedPriceEGP) * dir;
          case 'status':
            return (Number(a.isActive) - Number(b.isActive)) * dir;
          case 'audit':
            return (a.createdByName || '').localeCompare(b.createdByName || '', 'ar') * dir;
          case 'usage':
            return ((usageCountById.get(a.id) || 0) - (usageCountById.get(b.id) || 0)) * dir;
          default:
            return 0;
        }
      });
    }

    return list;
  }, [
    masterAddons,
    globalSearch,
    tableState.columnFilters,
    tableState.selectedColumnFilters,
    tableState.sortColumn,
    tableState.sortDirection,
    usageCountById
  ]);

  return (
    <div className="space-y-5 text-right max-w-[1400px] mx-auto" dir="rtl">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>إدارة نشاط · المرجع الأساسي الموحّد للخدمات الإضافية المدفوعة</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
            <span>مكتبة الإضافات المركزية (Master Add-ons Library)</span>
            <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-2.5 py-0.5 rounded-full font-mono">
              {masterAddons.length} خدمة
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            المرجع الموحد للخدمات الإضافية المدفوعة (تصوير، وجبات VIP، نقل خاص، تأمين) بحيث يختار صاحب النشاط عبر البحث الذكي ويكتب السعر فقط دون تكرار كتابة الأسماء.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {feedbackMsg && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onResetCatalog();
              showToast('✓ تم تحديث القائمة المرجعية لمكتبة الإضافات');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>استعادة المرجع الافتراضي</span>
          </button>

          <button
            type="button"
            onClick={() => (showInlineForm ? resetForm() : handleStartCreate())}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            {showInlineForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showInlineForm ? 'إغلاق النموذج' : 'إضافة خدمة مركزية جديدة'}</span>
          </button>
        </div>
      </div>

      {/* Inline Collapsible Add / Edit Form (في نفس الصفحة) */}
      {showInlineForm && (
        <form
          onSubmit={handleSubmitForm}
          className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>تعديل خدمة في مكتبة الإضافات المركزية</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>إضافة خدمة جديدة إلى مكتبة الإضافات المركزية</span>
                </>
              )}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>إلغاء</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                اسم الخدمة الإضافية الموحد *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تصوير فوتوغرافي احترافي، وجبة غداء إضافية VIP..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                التصنيف المرجعي
              </label>
              <input
                type="text"
                list="master-addon-categories-list"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
              <datalist id="master-addon-categories-list">
                {MASTER_ADDON_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                وحدة الاحتساب
              </label>
              <input
                type="text"
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                placeholder="للفرد / للرحلة / للجلسة"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                السعر الاسترشادي (ج.م)
              </label>
              <input
                type="number"
                min={0}
                value={suggestedPriceEGP}
                onChange={(e) => setSuggestedPriceEGP(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 font-mono text-cyan-300 font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                السعر الاسترشادي (EUR €)
              </label>
              <input
                type="number"
                min={0}
                value={suggestedPriceEUR}
                onChange={(e) => setSuggestedPriceEUR(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 font-mono text-amber-300 font-bold focus:outline-none"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                وصف الخدمة الموضح للعميل وصاحب النشاط
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="تفاصيل مختصرة عن الخدمة..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
              <span>متاحة في البحث الذكي عند إنشاء أو تعديل الأنشطة</span>
            </label>

            <button
              type="submit"
              disabled={!title.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingId ? 'حفظ تعديلات الخدمة' : 'إضافة وحفظ في المكتبة'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Search & Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="بحث شامل في مكتبة الإضافات المركزية..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              متاح للبحث الذكي:{' '}
              <strong className="text-emerald-300 font-mono">
                {masterAddons.filter((a) => a.isActive).length}
              </strong>{' '}
              خدمة
            </span>
          </div>
        </div>

        <RegistryFilterSummaryBar
          filteredCount={filteredAddons.length}
          totalCount={masterAddons.length}
          itemNoun="خدمة إضافية"
          sortColumn={tableState.sortColumn}
          sortDirection={tableState.sortDirection}
          hasActiveFilters={tableState.hasActiveFilters || globalSearch.trim() !== ''}
          onClearAll={() => {
            setGlobalSearch('');
            tableState.handleClearAll();
          }}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-300">
                {[
                  { key: 'title' as AddonSortColumn, label: 'الخدمة الإضافية' },
                  { key: 'category' as AddonSortColumn, label: 'التصنيف' },
                  { key: 'unitLabel' as AddonSortColumn, label: 'وحدة الاحتساب' },
                  { key: 'suggestedPriceEGP' as AddonSortColumn, label: 'السعر الاسترشادي' },
                  { key: 'status' as AddonSortColumn, label: 'الحالة' },
                  { key: 'audit' as AddonSortColumn, label: 'السجل والتوقيت' },
                  { key: 'usage' as AddonSortColumn, label: 'الاستخدام' }
                ].map((col) => (
                  <th key={col.key} className="px-3 py-2.5 align-top font-bold whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => tableState.handleToggleSort(col.key)}
                      className="flex items-center gap-1 hover:text-cyan-300 transition-colors mb-1.5 cursor-pointer"
                    >
                      <span>{col.label}</span>
                      <RegistrySortIcon
                        column={col.key}
                        sortColumn={tableState.sortColumn}
                        sortDirection={tableState.sortDirection}
                      />
                    </button>
                    <input
                      ref={(el) => {
                        tableState.filterInputRefs.current[col.key] = el;
                      }}
                      type="text"
                      value={tableState.columnFilters[col.key]}
                      onFocus={() => {
                        tableState.setOpenDropdownCol(col.key);
                        tableState.updateDropdownPosition(col.key, ['title', 'category', 'audit']);
                      }}
                      onChange={(e) =>
                        tableState.setColumnFilters((prev) => ({
                          ...prev,
                          [col.key]: e.target.value
                        }))
                      }
                      placeholder={tableState.getSelectedSummaryPlaceholder(
                        col.key,
                        'فلترة / اختيار متعدد...'
                      )}
                      className="w-full min-w-[120px] bg-slate-900 border border-slate-700/80 focus:border-cyan-500 rounded-lg px-2 py-1 text-[11px] font-normal text-slate-200 placeholder-slate-500 focus:outline-none"
                    />
                  </th>
                ))}
                <th className="px-3 py-2.5 align-top font-bold whitespace-nowrap">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredAddons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لا توجد خدمات إضافية مطابقة لمعايير البحث أو الفلترة.
                  </td>
                </tr>
              ) : (
                filteredAddons.map((addon) => {
                  const usedInCount = usageCountById.get(addon.id) || 0;
                  return (
                    <tr
                      key={addon.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        !addon.isActive ? 'opacity-65' : ''
                      }`}
                    >
                      <td className="px-3 py-3 max-w-[260px]">
                        <div className="font-bold text-white text-xs">{addon.title}</div>
                        {addon.description && (
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                            {addon.description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 text-[11px]">
                          {addon.category}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-300">
                        {addon.unitLabel}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-mono">
                        <span className="text-emerald-300 font-bold">
                          {addon.suggestedPriceEGP} ج.م
                        </span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-amber-300 font-bold">€{addon.suggestedPriceEUR}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            addon.isActive
                              ? 'bg-emerald-950/60 border-emerald-700/40 text-emerald-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {addon.isActive ? 'مفعّلة' : 'مخفية'}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-[10px] text-slate-400">
                        <div>
                          أنشأها: <strong className="text-slate-200">{addon.createdByName || '—'}</strong>
                        </div>
                        <div className="font-mono text-slate-500">
                          {addon.createdAtTime || '—'}
                        </div>
                        {addon.updatedAtTime && addon.updatedAtTime !== addon.createdAtTime && (
                          <div className="text-cyan-400/90 mt-0.5">
                            آخر تعديل: {addon.updatedByName} · {addon.updatedAtTime}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-mono text-slate-300">
                        {usedInCount} نشاط
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {confirmDeleteId === addon.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteAddon(addon.id);
                                setConfirmDeleteId(null);
                                showToast(`تم حذف «${addon.title}» من المكتبة`);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              تأكيد الحذف
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateAddon(addon.id, { isActive: !addon.isActive })
                              }
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 cursor-pointer"
                              title={addon.isActive ? 'إخفاء عن البحث الذكي' : 'تفعيل في البحث الذكي'}
                            >
                              {addon.isActive ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(addon)}
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 cursor-pointer"
                              title="تعديل"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(addon.id)}
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {tableState.openDropdownCol && tableState.dropdownRect && (
        <RegistryColumnFilterDropdown
          activeCol={tableState.openDropdownCol}
          dropdownRect={tableState.dropdownRect}
          activeDropdownRef={tableState.activeDropdownRef}
          title={COLUMN_DROPDOWN_TITLES[tableState.openDropdownCol]}
          options={columnFilterOptions[tableState.openDropdownCol]}
          filterText={tableState.columnFilters[tableState.openDropdownCol]}
          selectedValues={tableState.selectedColumnFilters[tableState.openDropdownCol]}
          onToggleValue={tableState.handleToggleColumnFilterValue}
          onClearCol={tableState.handleClearCol}
          onClose={() => tableState.setOpenDropdownCol(null)}
        />
      )}
    </div>
  );
};
