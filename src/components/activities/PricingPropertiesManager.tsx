import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  Tag
} from 'lucide-react';
import {
  PricingAgeConditionType,
  PricingPropertyCategory,
  PricingPropertyItem
} from '../../types/activity';

export const INITIAL_PRICING_PROPERTIES: PricingPropertyItem[] = [
  {
    id: 'pp-adult',
    category: 'adult',
    categoryLabel: 'بالغ',
    conditionType: 'greater_or_equal',
    ageMin: 10,
    displayLabel: 'بالغ (10 سنوات فأكثر)',
    isActive: true,
    order: 1
  },
  {
    id: 'pp-child',
    category: 'child',
    categoryLabel: 'طفل',
    conditionType: 'less_than',
    ageMax: 10,
    displayLabel: 'طفل أقل من 10 سنوات',
    isActive: true,
    order: 2
  },
  {
    id: 'pp-infant-2',
    category: 'infant',
    categoryLabel: 'رضيع',
    conditionType: 'less_than',
    ageMax: 2,
    displayLabel: 'رضيع أقل من 2 سنة',
    isActive: true,
    order: 3
  },
  {
    id: 'pp-infant',
    category: 'infant',
    categoryLabel: 'رضيع',
    conditionType: 'less_than',
    ageMax: 3,
    displayLabel: 'رضيع أقل من 3 سنوات',
    isActive: true,
    order: 4
  }
];

const CATEGORY_PRESETS: { value: PricingPropertyCategory; label: string; defaultCondition: PricingAgeConditionType; defaultMax?: number; defaultMin?: number }[] = [
  { value: 'infant', label: 'رضيع', defaultCondition: 'less_than', defaultMax: 3 },
  { value: 'child', label: 'طفل', defaultCondition: 'less_than', defaultMax: 10 },
  { value: 'adult', label: 'بالغ', defaultCondition: 'greater_or_equal', defaultMin: 10 },
  { value: 'senior', label: 'كبار السن', defaultCondition: 'greater_or_equal', defaultMin: 60 },
  { value: 'private_group', label: 'رحلة خاصة', defaultCondition: 'custom_text' },
  { value: 'custom', label: 'بند مخصص', defaultCondition: 'custom_text' }
];

function formatYearsWord(num: number): string {
  if (num >= 3 && num <= 10) return 'سنوات';
  return 'سنة';
}

export function buildPricingPropertyDisplayLabel(params: {
  categoryLabel: string;
  conditionType: PricingAgeConditionType;
  ageMin?: number;
  ageMax?: number;
  customConditionText?: string;
}): string {
  const base = params.categoryLabel.trim() || 'بند سعر';
  switch (params.conditionType) {
    case 'less_than': {
      const max = Math.max(1, params.ageMax ?? 3);
      return `${base} أقل من ${max} ${formatYearsWord(max)}`;
    }
    case 'between': {
      const min = Math.max(0, params.ageMin ?? 4);
      const max = Math.max(min + 1, params.ageMax ?? 10);
      return `${base} (من ${min} إلى ${max} ${formatYearsWord(max)})`;
    }
    case 'greater_or_equal': {
      const min = Math.max(1, params.ageMin ?? 12);
      return `${base} (${min} ${formatYearsWord(min)} فأكثر)`;
    }
    case 'custom_text': {
      const text = params.customConditionText?.trim();
      return text ? `${base} (${text})` : base;
    }
  }
}

interface PricingPropertiesManagerProps {
  pricingProperties: PricingPropertyItem[];
  onChangePricingProperties: (items: PricingPropertyItem[]) => void;
}

export const PricingPropertiesManager: React.FC<PricingPropertiesManagerProps> = ({
  pricingProperties,
  onChangePricingProperties
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<PricingPropertyCategory>('infant');
  const [customCategoryLabel, setCustomCategoryLabel] = useState<string>('');
  const [conditionType, setConditionType] = useState<PricingAgeConditionType>('less_than');
  const [ageMin, setAgeMin] = useState<number>(4);
  const [ageMax, setAgeMax] = useState<number>(3);
  const [customConditionText, setCustomConditionText] = useState<string>('');
  const [manualLabelOverride, setManualLabelOverride] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const resolvedCategoryLabel =
    category === 'custom'
      ? customCategoryLabel.trim() || 'فئة مخصصة'
      : CATEGORY_PRESETS.find((c) => c.value === category)?.label || 'بند سعر';

  const autoPreviewLabel = buildPricingPropertyDisplayLabel({
    categoryLabel: resolvedCategoryLabel,
    conditionType,
    ageMin,
    ageMax,
    customConditionText
  });

  const finalLabelPreview = manualLabelOverride.trim() || autoPreviewLabel;

  const resetForm = () => {
    setEditingId(null);
    setCategory('infant');
    setCustomCategoryLabel('');
    setConditionType('less_than');
    setAgeMin(4);
    setAgeMax(3);
    setCustomConditionText('');
    setManualLabelOverride('');
  };

  const handleCategorySelect = (nextCat: PricingPropertyCategory) => {
    setCategory(nextCat);
    setManualLabelOverride('');
    const preset = CATEGORY_PRESETS.find((p) => p.value === nextCat);
    if (preset) {
      setConditionType(preset.defaultCondition);
      if (preset.defaultMax !== undefined) setAgeMax(preset.defaultMax);
      if (preset.defaultMin !== undefined) setAgeMin(preset.defaultMin);
    }
  };

  const handleStartEdit = (item: PricingPropertyItem) => {
    setEditingId(item.id);
    setCategory(item.category);
    setCustomCategoryLabel(item.category === 'custom' ? item.categoryLabel : '');
    setConditionType(item.conditionType);
    setAgeMin(item.ageMin ?? 4);
    setAgeMax(item.ageMax ?? 10);
    setCustomConditionText(item.customConditionText ?? '');
    const auto = buildPricingPropertyDisplayLabel({
      categoryLabel: item.categoryLabel,
      conditionType: item.conditionType,
      ageMin: item.ageMin,
      ageMax: item.ageMax,
      customConditionText: item.customConditionText
    });
    setManualLabelOverride(item.displayLabel !== auto ? item.displayLabel : '');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const itemPayload: PricingPropertyItem = {
      id: editingId || `pp-${Date.now().toString().slice(-5)}`,
      category,
      categoryLabel: resolvedCategoryLabel,
      conditionType,
      ageMin: conditionType === 'between' || conditionType === 'greater_or_equal' ? ageMin : undefined,
      ageMax: conditionType === 'less_than' || conditionType === 'between' ? ageMax : undefined,
      customConditionText: conditionType === 'custom_text' ? customConditionText.trim() : undefined,
      displayLabel: finalLabelPreview,
      isActive: true,
      order: editingId
        ? pricingProperties.find((p) => p.id === editingId)?.order ?? pricingProperties.length + 1
        : pricingProperties.length + 1
    };

    if (editingId) {
      onChangePricingProperties(
        pricingProperties.map((p) => (p.id === editingId ? itemPayload : p))
      );
      showToast(`✓ تم تعديل بند السعر إلى "${itemPayload.displayLabel}"`);
    } else {
      onChangePricingProperties([...pricingProperties, itemPayload]);
      showToast(`✓ تمت إضافة البند "${itemPayload.displayLabel}" إلى خصائص السعر`);
    }

    resetForm();
  };

  const handleToggleActive = (id: string) => {
    onChangePricingProperties(
      pricingProperties.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const handleConfirmDelete = (id: string) => {
    const target = pricingProperties.find((p) => p.id === id);
    onChangePricingProperties(pricingProperties.filter((p) => p.id !== id));
    setConfirmDeleteId(null);
    if (editingId === id) resetForm();
    if (target) {
      showToast(`تم حذف البند "${target.displayLabel}"`);
    }
  };

  return (
    <div className="space-y-6 text-right max-w-[1300px] mx-auto" dir="rtl">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            <span>إدارة نشاط · تعريف مسميات وفئات التسعير</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
            <span>خصائص السعر (بنود وتوصيفات الفئات السعرية)</span>
            <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-2.5 py-0.5 rounded-full font-mono">
              {pricingProperties.length} بنود
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            أضف أو عدّل أو احذف النصوص التوضيحية التي تظهر بجانب خانات الأسعار عند إضافة النشاط (مثل: «رضيع أقل من 3 سنوات» و«طفل أقل من 10 سنوات»)، دون كتابة أسعار هنا.
          </p>
        </div>

        {feedbackMsg && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      {/* Main Layout: Add/Edit Definition Form + Defined Properties List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card (Inline in page) */}
        <form
          onSubmit={handleSubmitForm}
          className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>تعديل بند خاصية سعر</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>إضافة بند جديد لخصائص السعر</span>
                </>
              )}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>إلغاء التعديل</span>
              </button>
            )}
          </div>

          {/* Step 1: Select Category (رضيع / طفل / بالغ / مخصص...) */}
          <div className="space-y-1.5 text-xs">
            <label className="text-[11px] font-semibold text-slate-300 block">
              1. اختر الفئة / نوع البند *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_PRESETS.map((preset) => {
                const isSelected = category === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleCategorySelect(preset.value)}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {category === 'custom' && (
              <input
                type="text"
                required
                placeholder="اكتب اسم البند (مثال: شباب، مرافق، طالب...)"
                value={customCategoryLabel}
                onChange={(e) => setCustomCategoryLabel(e.target.value)}
                className="w-full mt-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            )}
          </div>

          {/* Step 2: Select Age Rule / Condition */}
          <div className="space-y-2 text-xs">
            <label className="text-[11px] font-semibold text-slate-300 block">
              2. اختر الفئة العمرية أو الشرط التوضيحي *
            </label>
            <select
              value={conditionType}
              onChange={(e) => {
                setConditionType(e.target.value as PricingAgeConditionType);
                setManualLabelOverride('');
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="less_than">أقل من عمر محدد (مثال: أقل من 3 سنوات / أقل من 10)</option>
              <option value="between">نطاق عمري (من ... إلى ... سنة)</option>
              <option value="greater_or_equal">من عمر محدد فأكثر (مثال: 10 سنوات فأكثر)</option>
              <option value="custom_text">نص وصفي مخصص</option>
            </select>

            {conditionType === 'less_than' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                <span className="text-slate-300 text-xs">أقل من:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={ageMax}
                    onChange={(e) => {
                      setAgeMax(Math.max(1, parseInt(e.target.value) || 1));
                      setManualLabelOverride('');
                    }}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-center font-bold"
                  />
                  <span className="text-slate-400 text-xs">{formatYearsWord(ageMax)}</span>
                </div>
              </div>
            )}

            {conditionType === 'between' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">من عمر (سنة)</label>
                  <input
                    type="number"
                    min={0}
                    max={98}
                    value={ageMin}
                    onChange={(e) => {
                      setAgeMin(Math.max(0, parseInt(e.target.value) || 0));
                      setManualLabelOverride('');
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">إلى عمر (سنة)</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={ageMax}
                    onChange={(e) => {
                      setAgeMax(Math.max(1, parseInt(e.target.value) || 1));
                      setManualLabelOverride('');
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-center font-bold"
                  />
                </div>
              </div>
            )}

            {conditionType === 'greater_or_equal' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                <span className="text-slate-300 text-xs">بدءاً من عمر:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={ageMin}
                    onChange={(e) => {
                      setAgeMin(Math.max(1, parseInt(e.target.value) || 1));
                      setManualLabelOverride('');
                    }}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white text-center font-bold"
                  />
                  <span className="text-slate-400 text-xs">فأكثر</span>
                </div>
              </div>
            )}

            {conditionType === 'custom_text' && (
              <input
                type="text"
                placeholder="مثال: حتى 10 أفراد، بكارنيه الجامعة..."
                value={customConditionText}
                onChange={(e) => {
                  setCustomConditionText(e.target.value);
                  setManualLabelOverride('');
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            )}
          </div>

          {/* Step 3: Live Text Preview + Optional Manual Tweak */}
          <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-cyan-300 font-semibold">
                النص الذي سيظهر بجانب خانة السعر عند إضافة النشاط:
              </span>
            </div>
            <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold text-sm">
              {finalLabelPreview}
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                تعديل الصياغة يدوياً (اختياري):
              </label>
              <input
                type="text"
                placeholder={autoPreviewLabel}
                value={manualLabelOverride}
                onChange={(e) => setManualLabelOverride(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editingId ? 'حفظ التعديلات على البند' : 'إضافة البند إلى خصائص السعر'}</span>
          </button>
        </form>

        {/* Defined Pricing Properties List */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span>بنود خصائص السعر المسجلة</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                أي تعديل أو إضافة هنا ينعكس تلقائياً في نصوص حقول الأسعار بشاشة إضافة وتعديل النشاط.
              </p>
            </div>
          </div>

          {pricingProperties.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400">
              لا توجد بنود مسجلة بعد. أضف بنداً من النموذج المجاور ليظهر بجانب خانات الأسعار في الأنشطة.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pricingProperties.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    editingId === item.id
                      ? 'bg-cyan-950/30 border-cyan-500/60'
                      : item.isActive
                      ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-65'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-semibold">
                        {item.categoryLabel}
                      </span>
                      <span className="text-sm font-bold text-white">{item.displayLabel}</span>
                      {!item.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          مخفي في الإضافة
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      يظهر في نموذج إضافة النشاط كعنوان لخانة السعر: «{item.displayLabel}»
                    </div>
                  </div>

                  {/* Action Buttons (Toggle visibility, Edit, Inline Delete) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-1.5 bg-red-950/50 border border-red-800/60 rounded-lg px-2 py-1 animate-fade-in">
                        <span className="text-[11px] text-red-300 font-bold">حذف البند؟</span>
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(item.id)}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded cursor-pointer"
                        >
                          حذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition cursor-pointer"
                          title={item.isActive ? 'إخفاء مؤقتاً' : 'تفعيل وإظهار'}
                        >
                          {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-800/50 transition cursor-pointer"
                          title="حذف البند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live Preview of how it looks inside Add Activity */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block">
              معاينة طريقة ظهور النصوص بجانب خانات الأسعار عند إضافة نشاط:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-950 border border-slate-800 rounded-xl p-3">
              {pricingProperties
                .filter((p) => p.isActive)
                .map((p) => (
                  <div key={p.id} className="space-y-1">
                    <span className="text-[11px] font-bold text-cyan-300 block truncate">
                      {p.displayLabel}
                    </span>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-500 font-mono">
                      خانة إدخال السعر...
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
