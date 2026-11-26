import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Plus, Search, Trash2, Sparkles, Check, ExternalLink, X } from 'lucide-react';
import type { Activity } from '../../types/activity';
import type { MasterAddonItem } from '../../types/addon';
import {
  ACTIVITY_TERMINOLOGY,
  type EntityTerminologyConfig
} from '../reference/creation/entityCreationTerminology';

interface ActivityPaidAddonsEditorProps {
  paidAddons: Activity['inclusions']['paidAddons'];
  masterAddons: MasterAddonItem[];
  onChangePaidAddons: (next: Activity['inclusions']['paidAddons']) => void;
  onNavigateToAddonsLibrary?: () => void;
  notifyDbSuccess?: (msg: string) => void;
  hasCategorySelected?: boolean;
  selectedCategoryName?: string;
  terms?: EntityTerminologyConfig;
}

export const ActivityPaidAddonsEditor: React.FC<ActivityPaidAddonsEditorProps> = ({
  paidAddons,
  masterAddons,
  onChangePaidAddons,
  onNavigateToAddonsLibrary,
  notifyDbSuccess,
  hasCategorySelected = true,
  selectedCategoryName,
  terms = ACTIVITY_TERMINOLOGY
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMasterAddon, setSelectedMasterAddon] = useState<MasterAddonItem | null>(null);
  const [priceEGP, setPriceEGP] = useState<string>('');
  const [priceEUR, setPriceEUR] = useState<string>('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPickerOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
        setSelectedMasterAddon(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPickerOpen]);

  const activeLibrary = useMemo(
    () => masterAddons.filter((m) => m.isActive),
    [masterAddons]
  );

  const categories = useMemo(
    () => Array.from(new Set(activeLibrary.map((m) => m.category).filter(Boolean))),
    [activeLibrary]
  );

  const addedAddonIds = useMemo(
    () => new Set(paidAddons.map((p) => p.addonId || p.title.trim().toLowerCase())),
    [paidAddons]
  );

  const smartMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeLibrary.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.unitLabel.toLowerCase().includes(q)
      );
    });
  }, [activeLibrary, searchQuery, selectedCategory]);

  const handleSelectLibraryItem = (item: MasterAddonItem) => {
    setSelectedMasterAddon(item);
    setPriceEGP(item.suggestedPriceEGP > 0 ? String(item.suggestedPriceEGP) : '');
    setPriceEUR(item.suggestedPriceEUR > 0 ? String(item.suggestedPriceEUR) : '');
  };

  const handleConfirmAddPaidAddon = () => {
    if (!selectedMasterAddon) return;
    const egp = Math.max(0, parseFloat(priceEGP) || 0);
    const eur = Math.max(0, parseFloat(priceEUR) || 0);

    if (egp <= 0 && eur <= 0) {
      notifyDbSuccess?.('⚠️ يرجى إدخال سعر الإضافة الاختيارية (بالجنيه أو اليورو)');
      return;
    }

    const alreadyAdded = paidAddons.some(
      (p) =>
        p.addonId === selectedMasterAddon.id ||
        p.title.trim().toLowerCase() === selectedMasterAddon.title.trim().toLowerCase()
    );

    if (alreadyAdded) {
      const updated = paidAddons.map((p) =>
        p.addonId === selectedMasterAddon.id ||
        p.title.trim().toLowerCase() === selectedMasterAddon.title.trim().toLowerCase()
          ? {
              ...p,
              addonId: selectedMasterAddon.id,
              unitLabel: selectedMasterAddon.unitLabel,
              priceEGP: egp,
              priceEUR: eur
            }
          : p
      );
      onChangePaidAddons(updated);
      notifyDbSuccess?.(`✓ تم تحديث سعر الخيار الإضافي «${selectedMasterAddon.title}»`);
    } else {
      const created = {
        id: `pa-${Date.now().toString().slice(-6)}`,
        addonId: selectedMasterAddon.id,
        title: selectedMasterAddon.title,
        unitLabel: selectedMasterAddon.unitLabel,
        priceEGP: egp,
        priceEUR: eur
      };
      onChangePaidAddons([...paidAddons, created]);
      notifyDbSuccess?.(`✓ تمت إضافة الخيار الإضافي المدفوع «${selectedMasterAddon.title}»`);
    }

    setSelectedMasterAddon(null);
    setPriceEGP('');
    setPriceEUR('');
    setSearchQuery('');
    setIsPickerOpen(false);
  };

  const handleUpdateItemPrice = (
    id: string,
    field: 'priceEGP' | 'priceEUR',
    value: number
  ) => {
    onChangePaidAddons(
      paidAddons.map((p) => (p.id === id ? { ...p, [field]: Math.max(0, value || 0) } : p))
    );
  };

  const handleRemoveItem = (id: string) => {
    onChangePaidAddons(paidAddons.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-3 pt-3 border-t border-slate-800/80" ref={pickerRef}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-cyan-300 font-bold text-xs flex flex-wrap items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>الإضافات الاختيارية المدفوعة (يختارها العميل عند الدفع):</span>
            {hasCategorySelected && selectedCategoryName && (
              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-500/40 px-2 py-0.5 rounded">
                متوافقة مع: {selectedCategoryName}
              </span>
            )}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            اختر الخدمة المتوافقة من المرجع الموحد وأدخل سعر الوحدة فقط (تحديد العدد يظهر للعميل عند الدفع ووقت التحصيل وأثناء تنفيذ الرحلة).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToAddonsLibrary && (
            <button
              type="button"
              onClick={onNavigateToAddonsLibrary}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[11px] text-cyan-300 font-semibold cursor-pointer"
              title="إدارة الإضافات في المرجع الموحد"
            >
              <ExternalLink className="w-3 h-3" />
              <span>المرجع الموحد</span>
            </button>
          )}
          {hasCategorySelected && (
            <button
              type="button"
              onClick={() => {
                setIsPickerOpen((prev) => !prev);
                setSelectedMasterAddon(null);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة خيار إضافي مدفوع</span>
            </button>
          )}
        </div>
      </div>

      {!hasCategorySelected ? (
        <div className="text-[11px] text-slate-400 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-4 text-center space-y-1">
          <p className="font-bold text-slate-200">
            الإضافات الاختيارية المتوافقة لا تظهر إلا بعد اختيار الفئة
          </p>
          <p className="text-[10px] text-slate-500">
            اختر التصنيف أولاً من قسم «Category / التصنيف متعدد المستويات» لإظهار الإضافات المتوافقة معه.
          </p>
        </div>
      ) : (
        <>
      {/* Smart Search Picker Linked to Master Add-ons Library */}
      {isPickerOpen && (
        <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-3.5 space-y-3 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-cyan-300">
              بحث ذكي في مكتبة الإضافات المركزية ({activeLibrary.length} خدمة معتمدة):
            </span>
            <button
              type="button"
              onClick={() => {
                setIsPickerOpen(false);
                setSelectedMasterAddon(null);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق القائمة"
              aria-label="إغلاق القائمة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative sm:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث ذكياً عن خدمة (مثال: تصوير، درون، وجبة، نقل، سنوركلينج)..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">جميع تصنيفات المكتبة</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search Results List */}
          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5">
            {smartMatches.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-slate-400 bg-slate-900/60 rounded-lg border border-slate-800">
                لا توجد خدمة مطابقة في مكتبة الإضافات المركزية. يمكنك إضافتها أولاً إلى المكتبة المركزية ثم اختيارها هنا.
              </div>
            ) : (
              smartMatches.map((item) => {
                const isSelected = selectedMasterAddon?.id === item.id;
                const isAlreadyAdded =
                  addedAddonIds.has(item.id) ||
                  addedAddonIds.has(item.title.trim().toLowerCase());
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectLibraryItem(item)}
                    className={`w-full text-right p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 text-white'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs">{item.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-700 text-cyan-300">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-400">({item.unitLabel})</span>
                        {isAlreadyAdded && (
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            · مضافة مسبقاً
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="text-left font-mono text-[10px] text-slate-400 shrink-0">
                      مقترح: {item.suggestedPriceEGP} ج.م / €{item.suggestedPriceEUR}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Price Only Step after choosing service from Master Add-ons Library */}
          {selectedMasterAddon && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3 space-y-2.5 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400">الخدمة المختارة من المكتبة: </span>
                  <strong className="text-emerald-300">{selectedMasterAddon.title}</strong>
                  <span className="text-[10px] text-slate-400 mr-1.5">
                    ({selectedMasterAddon.unitLabel})
                  </span>
                </div>
                <span className="text-[10px] text-cyan-300">{terms.paidAddonsEnterPriceHint}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    السعر للمصريين (ج.م EGP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={priceEGP}
                    onChange={(e) => setPriceEGP(e.target.value)}
                    placeholder="مثال: 450"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    السعر للأجانب (يورو € EUR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={priceEUR}
                    onChange={(e) => setPriceEUR(e.target.value)}
                    placeholder="مثال: 15"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleConfirmAddPaidAddon}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>اعتماد السعر وإضافة الخيار</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Paid Add-ons List */}
      {paidAddons.length > 0 ? (
        <div className="space-y-2">
          {paidAddons.map((addon) => (
            <div
              key={addon.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
            >
              <div className="min-w-0">
                <div className="font-bold text-white truncate">{addon.title}</div>
                <div className="text-[10px] text-slate-400">
                  {addon.unitLabel || 'خيار إضافي مدفوع عند الدفع'}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                  <span className="text-[10px] text-slate-400">ج.م</span>
                  <input
                    type="number"
                    min={0}
                    value={addon.priceEGP}
                    onChange={(e) =>
                      handleUpdateItemPrice(addon.id, 'priceEGP', parseFloat(e.target.value) || 0)
                    }
                    className="w-20 bg-transparent text-emerald-300 font-mono font-bold text-xs focus:outline-none text-center"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                  <span className="text-[10px] text-slate-400">€</span>
                  <input
                    type="number"
                    min={0}
                    value={addon.priceEUR}
                    onChange={(e) =>
                      handleUpdateItemPrice(addon.id, 'priceEUR', parseFloat(e.target.value) || 0)
                    }
                    className="w-16 bg-transparent text-amber-300 font-mono font-bold text-xs focus:outline-none text-center"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(addon.id)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-700/50 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="حذف الخيار الإضافي"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-slate-500 bg-slate-950/50 border border-dashed border-slate-800 rounded-xl p-3 text-center">
          {terms.paidAddonsEmptyText}
        </div>
      )}
        </>
      )}
    </div>
  );
};
