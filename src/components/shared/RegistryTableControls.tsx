import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, X } from 'lucide-react';

export type RegistryFilterOption = {
  value: string;
  label: string;
  subLabel?: string;
  count: number;
  dir?: 'ltr' | 'rtl';
};

export function RegistrySortIcon<ColKey extends string>({
  column,
  sortColumn,
  sortDirection
}: {
  column: ColKey;
  sortColumn: ColKey | null;
  sortDirection: 'asc' | 'desc';
}) {
  if (sortColumn !== column) {
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
  }
  return sortDirection === 'asc' ? (
    <ArrowUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
  ) : (
    <ArrowDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
  );
}

export function RegistryFilterSummaryBar({
  filteredCount,
  totalCount,
  itemNoun,
  sortColumn,
  sortDirection,
  hasActiveFilters,
  onClearAll
}: {
  filteredCount: number;
  totalCount: number;
  itemNoun: string;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  hasActiveFilters: boolean;
  onClearAll: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px]">
      <span className="text-slate-400">
        عرض <strong className="text-cyan-300 font-mono">{filteredCount}</strong> من أصل{' '}
        <strong className="text-white font-mono">{totalCount}</strong> {itemNoun}
        {sortColumn && (
          <span className="mr-2 text-cyan-400">
            (مرتب {sortDirection === 'asc' ? 'تصاعدياً' : 'تنازلياً'})
          </span>
        )}
      </span>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
          <span>مسح فلاتر الأعمدة والفرز</span>
        </button>
      )}
    </div>
  );
}

export function RegistryColumnFilterDropdown<ColKey extends string>({
  activeCol,
  dropdownRect,
  activeDropdownRef,
  title,
  options,
  filterText,
  selectedValues,
  onToggleValue,
  onClearCol,
  onClose
}: {
  activeCol: ColKey;
  dropdownRect: { top: number; left: number; width: number };
  activeDropdownRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  options: RegistryFilterOption[];
  filterText: string;
  selectedValues: string[];
  onToggleValue: (col: ColKey, value: string) => void;
  onClearCol: (col: ColKey) => void;
  onClose: () => void;
}) {
  const q = filterText.trim().toLowerCase();
  const visibleOptions = options.filter((opt) => {
    if (!q) return true;
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.subLabel || '').toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q)
    );
  });

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
        <span className="text-[11px] font-bold text-slate-200 truncate">{title}</span>
        {(selectedValues.length > 0 || filterText.trim() !== '') && (
          <button
            type="button"
            onClick={() => onClearCol(activeCol)}
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
              onClick={() => onToggleValue(activeCol, opt.value)}
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
          {selectedValues.length > 0 ? `محدد: ${selectedValues.length}` : 'اختر خياراً أو أكثر'}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold cursor-pointer"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}

export function useRegistryTableState<ColKey extends string>(columns: readonly ColKey[]) {
  const buildEmptyStrings = (): Record<ColKey, string> => {
    const out = {} as Record<ColKey, string>;
    columns.forEach((c) => {
      out[c] = '';
    });
    return out;
  };

  const buildEmptySelections = (): Record<ColKey, string[]> => {
    const out = {} as Record<ColKey, string[]>;
    columns.forEach((c) => {
      out[c] = [];
    });
    return out;
  };

  const [sortColumn, setSortColumn] = useState<ColKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<ColKey, string>>(buildEmptyStrings);
  const [selectedColumnFilters, setSelectedColumnFilters] =
    useState<Record<ColKey, string[]>>(buildEmptySelections);
  const [openDropdownCol, setOpenDropdownCol] = useState<ColKey | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const filterInputRefs = useRef<Partial<Record<ColKey, HTMLInputElement | null>>>({});
  const activeDropdownRef = useRef<HTMLDivElement | null>(null);

  const updateDropdownPosition = (col: ColKey, wideColumns: readonly ColKey[] = []) => {
    const el = filterInputRefs.current[col];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const preferredMin = wideColumns.includes(col) ? 235 : 200;
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

  const handleToggleColumnFilterValue = (col: ColKey, value: string) => {
    setSelectedColumnFilters((prev) => {
      const current = prev[col] || [];
      return {
        ...prev,
        [col]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value]
      };
    });
  };

  const handleToggleSort = (col: ColKey) => {
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

  const hasActiveFilters =
    (Object.values(columnFilters) as string[]).some((v) => v.trim() !== '') ||
    (Object.values(selectedColumnFilters) as string[][]).some((arr) => arr.length > 0) ||
    sortColumn !== null;

  const handleClearAll = () => {
    setColumnFilters(buildEmptyStrings());
    setSelectedColumnFilters(buildEmptySelections());
    setOpenDropdownCol(null);
    setSortColumn(null);
    setSortDirection('asc');
  };

  const handleClearCol = (col: ColKey) => {
    setSelectedColumnFilters((prev) => ({ ...prev, [col]: [] }));
    setColumnFilters((prev) => ({ ...prev, [col]: '' }));
  };

  const getSelectedSummaryPlaceholder = (
    col: ColKey,
    fallback: string,
    getLabel?: (val: string) => string
  ) => {
    const selected = selectedColumnFilters[col] || [];
    if (selected.length === 0) return fallback;
    if (selected.length === 1) {
      return getLabel ? getLabel(selected[0]) : selected[0];
    }
    return `محدد (${selected.length})`;
  };

  return {
    sortColumn,
    sortDirection,
    columnFilters,
    setColumnFilters,
    selectedColumnFilters,
    openDropdownCol,
    setOpenDropdownCol,
    dropdownRect,
    filterInputRefs,
    activeDropdownRef,
    updateDropdownPosition,
    handleToggleColumnFilterValue,
    handleToggleSort,
    hasActiveFilters,
    handleClearAll,
    handleClearCol,
    getSelectedSummaryPlaceholder
  };
}
