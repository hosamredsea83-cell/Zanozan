import React, { useState } from 'react';
import {
  ListChecks,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  Layers,
  FolderOpen,
  RotateCcw
} from 'lucide-react';
import { Activity, CustomTechnicalSpecItem, MetaFieldType } from '../../types/activity';
import { CATEGORY_COMPATIBILITY_OPTIONS, CategoryDomainTag } from '../../utils/categorySpecsMatcher';

interface CustomTechnicalSpecsManagerProps {
  customSpecs: CustomTechnicalSpecItem[];
  onChangeCustomSpecs: (items: CustomTechnicalSpecItem[]) => void;
  activities?: Activity[];
  onResetCatalog?: () => void | Promise<void>;
}

const DEFAULT_GROUP_TITLE = 'المواصفات الفنية للنشاط';

const SPEC_TYPE_LABELS: Record<MetaFieldType, string> = {
  text: 'نص (Text)',
  number: 'رقم (Number)',
  boolean: 'نعم / لا (Boolean)',
  single_choice: 'اختيار من قائمة',
  multi_choice: 'اختيارات متعددة'
};

export const CustomTechnicalSpecsManager: React.FC<CustomTechnicalSpecsManagerProps> = ({
  customSpecs,
  onChangeCustomSpecs,
  activities = [],
  onResetCatalog
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupTitle, setGroupTitle] = useState<string>(DEFAULT_GROUP_TITLE);
  const [label, setLabel] = useState<string>('');
  const [type, setType] = useState<MetaFieldType>('text');
  const [textValue, setTextValue] = useState<string>('');
  const [boolValue, setBoolValue] = useState<boolean>(true);
  const [optionsInput, setOptionsInput] = useState<string>('');
  const [isPublicForClient, setIsPublicForClient] = useState<boolean>(true);
  const [isRequired, setIsRequired] = useState<boolean>(false);
  const [linkedCategories, setLinkedCategories] = useState<CategoryDomainTag[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const existingGroupTitles = Array.from(
    new Set([DEFAULT_GROUP_TITLE, ...customSpecs.map((s) => s.groupTitle).filter(Boolean)])
  );

  const groupedCustomSpecs = customSpecs.reduce<
    Array<{ title: string; items: CustomTechnicalSpecItem[] }>
  >((acc, item) => {
    const title = (item.groupTitle || DEFAULT_GROUP_TITLE).trim() || DEFAULT_GROUP_TITLE;
    const existingGroup = acc.find((g) => g.title.toLowerCase() === title.toLowerCase());
    if (existingGroup) {
      existingGroup.items.push(item);
    } else {
      acc.push({ title, items: [item] });
    }
    return acc;
  }, []);

  const handleSelectGroupForNewSpec = (targetGroupTitle: string) => {
    setEditingId(null);
    setGroupTitle(targetGroupTitle);
    setLabel('');
  };

  const resetForm = () => {
    setEditingId(null);
    setGroupTitle(DEFAULT_GROUP_TITLE);
    setLabel('');
    setType('text');
    setTextValue('');
    setBoolValue(true);
    setOptionsInput('');
    setIsPublicForClient(true);
    setIsRequired(false);
    setLinkedCategories([]);
  };

  const handleStartEdit = (item: CustomTechnicalSpecItem) => {
    setEditingId(item.id);
    setGroupTitle(item.groupTitle || DEFAULT_GROUP_TITLE);
    setLabel(item.label);
    setType(item.type);
    if (item.type === 'boolean') {
      setBoolValue(Boolean(item.defaultValue));
      setTextValue('');
    } else {
      setTextValue(String(item.defaultValue ?? ''));
    }
    setOptionsInput((item.options || []).join('، '));
    setIsPublicForClient(item.isPublicForClient);
    setIsRequired(item.isRequired);
    setLinkedCategories((item.linkedCategories || []) as CategoryDomainTag[]);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;

    const parsedOptions =
      type === 'single_choice'
        ? optionsInput
            .split(/[،,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const resolvedValue: CustomTechnicalSpecItem['defaultValue'] =
      type === 'boolean'
        ? boolValue
        : type === 'number'
        ? parseFloat(textValue) || 0
        : type === 'single_choice'
        ? textValue.trim() || (parsedOptions && parsedOptions[0]) || ''
        : textValue.trim() || 'متوفر';

    const payload: CustomTechnicalSpecItem = {
      id: editingId || `cspec-${Date.now().toString().slice(-5)}`,
      groupTitle: groupTitle.trim() || DEFAULT_GROUP_TITLE,
      label: trimmedLabel,
      type,
      defaultValue: resolvedValue,
      options: parsedOptions && parsedOptions.length > 0 ? parsedOptions : undefined,
      isPublicForClient,
      isRequired,
      isActive: editingId
        ? customSpecs.find((s) => s.id === editingId)?.isActive ?? true
        : true,
      order: editingId
        ? customSpecs.find((s) => s.id === editingId)?.order ?? customSpecs.length + 1
        : customSpecs.length + 1,
      linkedCategories: linkedCategories.length > 0 ? linkedCategories : undefined
    };

    if (editingId) {
      onChangeCustomSpecs(customSpecs.map((s) => (s.id === editingId ? payload : s)));
      showToast(`✓ تم تعديل المواصفة "${payload.label}"`);
    } else {
      onChangeCustomSpecs([...customSpecs, payload]);
      showToast(`✓ تمت إضافة المواصفة "${payload.label}" إلى المواصفات الفنية المخصصة`);
    }

    resetForm();
  };

  const handleToggleActive = (id: string) => {
    onChangeCustomSpecs(
      customSpecs.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleConfirmDelete = (id: string) => {
    const target = customSpecs.find((s) => s.id === id);
    onChangeCustomSpecs(customSpecs.filter((s) => s.id !== id));
    setConfirmDeleteId(null);
    if (editingId === id) resetForm();
    if (target) {
      showToast(`تم حذف المواصفة "${target.label}"`);
    }
  };

  return (
    <div className="space-y-6 text-right max-w-[1300px] mx-auto" dir="rtl">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
            <ListChecks className="w-4 h-4" />
            <span>إدارة نشاط · تعريف المواصفات الفنية المخصصة للأنشطة</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
            <span>ادارة المواصفات الفنية مخصصة</span>
            <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-2.5 py-0.5 rounded-full font-mono">
              {customSpecs.length} مواصفة
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            أنشئ وعدّل المواصفات الفنية المخصصة ومجموعاتها هنا، لتظهر كخيارات جاهزة للإدراج الفوري داخل شاشة إضافة وتعديل النشاط.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {feedbackMsg && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {onResetCatalog && (
            <button
              type="button"
              onClick={async () => {
                await onResetCatalog();
                showToast('✓ تم تصفير وإعادة تحميل المواصفات الفنية الحقيقية من قاعدة البيانات المحلية');
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="إعادة تحميل المواصفات الفنية الحقيقية من قاعدة البيانات المحلية"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>إعادة تحميل القاعدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card */}
        <form
          onSubmit={handleSubmitForm}
          className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>تعديل مواصفة فنية مخصصة</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>إضافة خاصية / مواصفة فنية مخصصة</span>
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

          <div className="space-y-3 text-xs">
            {/* Group Title */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                المجموعة المستهدفة *
              </label>
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder={DEFAULT_GROUP_TITLE}
                list="custom-spec-group-suggestions"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <datalist id="custom-spec-group-suggestions">
                {existingGroupTitles.map((title) => (
                  <option key={title} value={title} />
                ))}
              </datalist>
            </div>

            {/* Spec Label */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                اسم الخاصية / المواصفة *
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="مثال: سعة القارب، مستوى الصعوبة، لغة الإرشاد..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Value Type */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                نوع القيمة *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MetaFieldType)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="text">نص (Text)</option>
                <option value="number">رقم (Number)</option>
                <option value="boolean">نعم / لا (Boolean)</option>
                <option value="single_choice">اختيار من قائمة (Select)</option>
              </select>
            </div>

            {/* Options for single_choice */}
            {type === 'single_choice' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  خيارات القائمة (افصل بينها بفاصلة)
                </label>
                <input
                  type="text"
                  value={optionsInput}
                  onChange={(e) => setOptionsInput(e.target.value)}
                  placeholder="مثال: مبتدئ، متوسط، محترف"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            )}

            {/* Default Value */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                القيمة الافتراضية
              </label>
              {type === 'boolean' ? (
                <select
                  value={boolValue ? 'true' : 'false'}
                  onChange={(e) => setBoolValue(e.target.value === 'true')}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-cyan-300 font-semibold focus:outline-none"
                >
                  <option value="true">نعم ✓ متوفر</option>
                  <option value="false">لا ✕ غير متوفر</option>
                </select>
              ) : (
                <input
                  type={type === 'number' ? 'number' : 'text'}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder={type === 'number' ? '0' : 'أدخل القيمة الافتراضية...'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              )}
            </div>

            {/* Visibility & Required Flags */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-300 bg-slate-950 border border-slate-800 rounded-xl p-3">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublicForClient}
                  onChange={(e) => setIsPublicForClient(e.target.checked)}
                  className="w-3.5 h-3.5 accent-cyan-500 rounded"
                />
                <span>عرض للعميل في المتجر</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-500 rounded"
                />
                <span>خاصية إلزامية</span>
              </label>
            </div>

            {/* Category Compatibility Tags for Smart Linking */}
            <div className="space-y-1.5 bg-slate-950 border border-slate-800 rounded-xl p-3">
              <label className="text-[11px] font-semibold text-cyan-300 block">
                ربط ذكي مع فئات التصنيف (تظهر تلقائياً عند اختيار التصنيف):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_COMPATIBILITY_OPTIONS.map((opt) => {
                  const checked = linkedCategories.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setLinkedCategories((prev) =>
                          prev.includes(opt.id)
                            ? prev.filter((id) => id !== opt.id)
                            : [...prev, opt.id]
                        )
                      }
                      className={`px-2 py-1 rounded-lg border text-[10px] font-semibold transition-colors cursor-pointer ${
                        checked
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {checked ? '✓ ' : '+ '}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!label.trim()}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editingId ? 'حفظ التعديلات على المواصفة' : 'إضافة المواصفة إلى القائمة'}</span>
          </button>
        </form>

        {/* Defined Custom Specs Grouped by Target Group */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>المجموعات المستهدفة والمواصفات التابعة لها</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تظهر هنا كل مجموعة مستهدفة وبداخلها المواصفات الفنية التي تخصها، وتنعكس تلقائياً في شاشة إضافة وتعديل النشاط.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono bg-slate-950 text-cyan-300 border border-slate-800 px-2.5 py-1 rounded-lg">
                {groupedCustomSpecs.length} مجموعة · {customSpecs.length} مواصفة
              </span>
            </div>
          </div>

          {groupedCustomSpecs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-xl text-xs text-slate-400">
              لا توجد مجموعات أو مواصفات فنية مخصصة مسجلة بعد. استخدم النموذج المجاور لإضافة أول مجموعة ومواصفاتها.
            </div>
          ) : (
            <div className="space-y-4">
              {groupedCustomSpecs.map((group) => (
                <div
                  key={group.title}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  {/* Target Group Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-800/50 flex items-center justify-center text-cyan-400 shrink-0">
                        <FolderOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-cyan-300 truncate">
                          {group.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                        {group.items.length} مواصفة
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectGroupForNewSpec(group.title)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-[11px] font-semibold text-cyan-300 transition cursor-pointer"
                      title={`إضافة مواصفة جديدة داخل مجموعة ${group.title}`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة داخل المجموعة</span>
                    </button>
                  </div>

                  {/* Specifications Belonging to This Target Group */}
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          editingId === item.id
                            ? 'bg-cyan-950/30 border-cyan-500/60'
                            : item.isActive
                            ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-900/40 border-slate-800/60 opacity-65'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white">
                              {item.label}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-700 font-mono">
                              {SPEC_TYPE_LABELS[item.type] || item.type}
                            </span>
                            {!item.isActive && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                مخفي في الإضافة
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span>
                              القيمة الافتراضية:{' '}
                              <strong className="text-cyan-300">
                                {item.type === 'boolean'
                                  ? item.defaultValue
                                    ? 'نعم ✓ متوفر'
                                    : 'لا ✕ غير متوفر'
                                  : String(item.defaultValue)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span className={item.isPublicForClient ? 'text-cyan-400' : 'text-amber-400'}>
                              {item.isPublicForClient ? 'عام للعميل' : 'داخلي فقط'}
                            </span>
                            <span>•</span>
                            <span className={item.isRequired ? 'text-emerald-400' : 'text-slate-400'}>
                              {item.isRequired ? 'إلزامي' : 'اختياري'}
                            </span>
                            <span>•</span>
                            <span className="text-slate-300 font-mono">
                              مستخدمة في{' '}
                              {
                                activities.filter((act) =>
                                  (act.metaGroups || []).some((g) =>
                                    g.fields.some(
                                      (f) => f.key === `custom_${item.id}` || f.label === item.label
                                    )
                                  )
                                ).length
                              }{' '}
                              نشاط
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1.5 bg-red-950/50 border border-red-800/60 rounded-lg px-2 py-1 animate-fade-in">
                              <span className="text-[11px] text-red-300 font-bold">حذف؟</span>
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
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition cursor-pointer"
                                title={item.isActive ? 'إخفاء مؤقتاً' : 'تفعيل وإظهار'}
                              >
                                {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>تعديل</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(item.id)}
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-800/50 transition cursor-pointer"
                                title="حذف المواصفة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live Preview Grouped by Target Group */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block">
              معاينة المجموعات والمواصفات المفعّلة كما ستظهر للإدراج السريع في شاشة إضافة نشاط:
            </span>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5">
              {customSpecs.filter((s) => s.isActive).length === 0 ? (
                <span className="text-[11px] text-slate-500 block">
                  لا توجد مواصفات مفعّلة حالياً للمعاينة.
                </span>
              ) : (
                groupedCustomSpecs
                  .map((g) => ({
                    title: g.title,
                    activeItems: g.items.filter((i) => i.isActive)
                  }))
                  .filter((g) => g.activeItems.length > 0)
                  .map((g) => (
                    <div key={g.title} className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        {g.title}:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {g.activeItems.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-cyan-300"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{s.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
