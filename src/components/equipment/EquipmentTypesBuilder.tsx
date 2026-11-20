import React, { useMemo, useState } from 'react';
import type {
  EquipmentItem,
  EquipmentPropertyItem,
  EquipmentSpecFieldDef,
  EquipmentSpecGroupTemplate,
  EquipmentTypeDefinition
} from '../../types/equipment';
import { REAL_EQUIPMENT_CATEGORIES } from '../../db/localSpecsAndEquipmentDb';
import { FIELD_TYPE_LABELS } from './equipmentHelpers';
import { Check, Layers, Plus, Trash2 } from 'lucide-react';

interface EquipmentTypesBuilderProps {
  equipments: EquipmentItem[];
  equipmentTypes: EquipmentTypeDefinition[];
  equipmentProperties: EquipmentPropertyItem[];
  onSaveEquipmentTypes: (types: EquipmentTypeDefinition[]) => void;
  onNavigateToEquipmentProperties?: () => void;
  showNewTypeForm: boolean;
  setShowNewTypeForm: React.Dispatch<React.SetStateAction<boolean>>;
  notify: (msg: string) => void;
}

export const EquipmentTypesBuilder: React.FC<EquipmentTypesBuilderProps> = ({
  equipments,
  equipmentTypes,
  equipmentProperties,
  onSaveEquipmentTypes,
  onNavigateToEquipmentProperties,
  showNewTypeForm,
  setShowNewTypeForm,
  notify
}) => {
  const [selectedTypeId, setSelectedTypeId] = useState<string>(equipmentTypes[0]?.id || '');
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCategory, setNewTypeCategory] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [targetGroupIdForField, setTargetGroupIdForField] = useState<string>('');
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<string>('all');
  const [confirmDeleteTypeId, setConfirmDeleteTypeId] = useState<string | null>(null);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);

  const activeTypeDef =
    equipmentTypes.find((t) => t.id === selectedTypeId) || equipmentTypes[0];

  const propertyLibraryCategories = useMemo(() => {
    const map = new Map<string, string>();
    REAL_EQUIPMENT_CATEGORIES.forEach((c) => map.set(c.id, c.label));
    equipmentProperties.forEach((p) => {
      if (!map.has(p.category)) map.set(p.category, p.category);
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [equipmentProperties]);

  const filteredLibraryProperties = useMemo(() => {
    const q = librarySearchQuery.trim().toLowerCase();
    return equipmentProperties.filter((prop) => {
      const matchesCat =
        libraryCategoryFilter === 'all' || prop.category === libraryCategoryFilter;
      const matchesQuery =
        !q ||
        prop.label.toLowerCase().includes(q) ||
        prop.key.toLowerCase().includes(q) ||
        (prop.description || '').toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [equipmentProperties, libraryCategoryFilter, librarySearchQuery]);

  const handleCreateEquipmentType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    const newType: EquipmentTypeDefinition = {
      id: `eq-type-${Date.now()}`,
      key: `type_${Date.now()}`,
      name: newTypeName.trim(),
      category: newTypeCategory.trim() || 'تجهيزات سياحية',
      description: newTypeDesc.trim(),
      specGroups: [
        {
          id: `sg-${Date.now()}`,
          title: `المواصفات الأساسية لـ ${newTypeName.trim()}`,
          fields: []
        }
      ],
      createdAt: today,
      updatedAt: today
    };
    onSaveEquipmentTypes([...equipmentTypes, newType]);
    setSelectedTypeId(newType.id);
    setNewTypeName('');
    setNewTypeCategory('');
    setNewTypeDesc('');
    setShowNewTypeForm(false);
    notify(`✓ تم إضافة نوع المعدات الجديد "${newType.name}" في المنظومة الديناميكية`);
  };

  const handleAddSpecGroupToType = () => {
    if (!activeTypeDef || !newGroupTitle.trim()) return;
    const newGroup: EquipmentSpecGroupTemplate = {
      id: `sg-${Date.now()}`,
      title: newGroupTitle.trim(),
      fields: []
    };
    const updatedTypes = equipmentTypes.map((t) =>
      t.id === activeTypeDef.id
        ? {
            ...t,
            specGroups: [...t.specGroups, newGroup],
            updatedAt: new Date().toISOString().split('T')[0]
          }
        : t
    );
    onSaveEquipmentTypes(updatedTypes);
    setNewGroupTitle('');
    notify(`✓ تمت إضافة مجموعة المواصفات "${newGroup.title}"`);
  };

  const handleTogglePropertyInGroup = (groupId: string, prop: EquipmentPropertyItem) => {
    if (!activeTypeDef) return;
    const targetGroup = activeTypeDef.specGroups.find((g) => g.id === groupId);
    if (!targetGroup) return;

    const alreadyInGroup = targetGroup.fields.some(
      (f) => f.id === prop.id || f.key === prop.key
    );

    if (alreadyInGroup) {
      const updatedTypes = equipmentTypes.map((t) =>
        t.id === activeTypeDef.id
          ? {
              ...t,
              specGroups: t.specGroups.map((g) =>
                g.id === groupId
                  ? {
                      ...g,
                      fields: g.fields.filter((f) => f.id !== prop.id && f.key !== prop.key)
                    }
                  : g
              ),
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : t
      );
      onSaveEquipmentTypes(updatedTypes);
      notify(`تمت إزالة الخاصية "${prop.label}" من مجموعة "${targetGroup.title}"`);
      return;
    }

    const mappedField: EquipmentSpecFieldDef = {
      id: prop.id,
      key: prop.key,
      label: prop.label,
      type: prop.type,
      unit: prop.unit,
      options: prop.options,
      isRequired: prop.isMandatoryDefault,
      isPublicForClient: prop.isPublicDefault,
      defaultValue:
        prop.type === 'boolean'
          ? false
          : prop.type === 'number'
          ? 0
          : prop.type === 'multi_choice'
          ? []
          : prop.options?.[0] ?? ''
    };

    const updatedTypes = equipmentTypes.map((t) =>
      t.id === activeTypeDef.id
        ? {
            ...t,
            specGroups: t.specGroups.map((g) =>
              g.id === groupId ? { ...g, fields: [...g.fields, mappedField] } : g
            ),
            updatedAt: new Date().toISOString().split('T')[0]
          }
        : t
    );
    onSaveEquipmentTypes(updatedTypes);
    notify(`✓ تم إدراج خاصية "${prop.label}" من مكتبة خصائص المعدات`);
  };

  const handleRemoveFieldFromGroup = (groupId: string, fieldId: string) => {
    if (!activeTypeDef) return;
    const updatedTypes = equipmentTypes.map((t) =>
      t.id === activeTypeDef.id
        ? {
            ...t,
            specGroups: t.specGroups.map((g) =>
              g.id === groupId
                ? { ...g, fields: g.fields.filter((f) => f.id !== fieldId) }
                : g
            ),
            updatedAt: new Date().toISOString().split('T')[0]
          }
        : t
    );
    onSaveEquipmentTypes(updatedTypes);
  };

  const handleDeleteEquipmentType = (typeItem: EquipmentTypeDefinition) => {
    const linkedEquipmentsCount = equipments.filter((eq) => eq.typeId === typeItem.id).length;
    if (linkedEquipmentsCount > 0) {
      setConfirmDeleteTypeId(null);
      notify(`تعذر الحذف: هذا النوع مرتبط حالياً بـ ${linkedEquipmentsCount} معدة مسجلة`);
      return;
    }
    const remaining = equipmentTypes.filter((t) => t.id !== typeItem.id);
    onSaveEquipmentTypes(remaining);
    if (activeTypeDef?.id === typeItem.id) {
      setSelectedTypeId(remaining[0]?.id || '');
    }
    setConfirmDeleteTypeId(null);
    notify(`تم حذف نوع المعدات "${typeItem.name}"`);
  };

  const handleDeleteSpecGroupFromType = (groupId: string, groupTitle: string) => {
    if (!activeTypeDef) return;
    const updatedTypes = equipmentTypes.map((t) =>
      t.id === activeTypeDef.id
        ? {
            ...t,
            specGroups: t.specGroups.filter((g) => g.id !== groupId),
            updatedAt: new Date().toISOString().split('T')[0]
          }
        : t
    );
    onSaveEquipmentTypes(updatedTypes);
    if (targetGroupIdForField === groupId) {
      setTargetGroupIdForField('');
    }
    setConfirmDeleteGroupId(null);
    notify(`تم حذف مجموعة "${groupTitle}"`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Types List Column */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>أنواع المعدات المسجلة</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              أضف أي نوع معدة جديد دون تعديل الكود
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewTypeForm(!showNewTypeForm)}
            className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            + نوع جديد
          </button>
        </div>

        {showNewTypeForm && (
          <form
            onSubmit={handleCreateEquipmentType}
            className="bg-slate-950 border border-cyan-500/40 rounded-xl p-3 space-y-2.5 text-xs"
          >
            <span className="font-bold text-cyan-300 block">
              إضافة نوع معدة جديد للمنصة:
            </span>
            <input
              type="text"
              required
              placeholder="اسم النوع (مثال: دراجة جبلية، باراسيلينج، طائرة درون...)"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs"
            />
            <input
              type="text"
              placeholder="التصنيف العام (مثال: مغامرات، تصوير، بحري...)"
              value={newTypeCategory}
              onChange={(e) => setNewTypeCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs"
            />
            <textarea
              rows={2}
              placeholder="وصف مختصر لطبيعة هذا النوع..."
              value={newTypeDesc}
              onChange={(e) => setNewTypeDesc(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewTypeForm(false)}
                className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg cursor-pointer"
              >
                حفظ النوع
              </button>
            </div>
          </form>
        )}

        <div className="space-y-1.5">
          {equipmentTypes.length === 0 ? (
            <p className="text-[11px] text-slate-500 text-center py-6">
              لا توجد أنواع معدات مسجلة حالياً.
            </p>
          ) : (
            equipmentTypes.map((t) => {
              const isSelected = activeTypeDef?.id === t.id;
              const fieldsCount = t.specGroups.reduce((acc, g) => acc + g.fields.length, 0);
              const isConfirmingDelete = confirmDeleteTypeId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (!isConfirmingDelete) setSelectedTypeId(t.id);
                  }}
                  className={`w-full text-right p-3 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs truncate">{t.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{t.category}</div>
                  </div>

                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-700/60 rounded-lg px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteEquipmentType(t)}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded cursor-pointer"
                        >
                          حذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteTypeId(null)}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {fieldsCount} حقل
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteTypeId(t.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/50 transition-colors cursor-pointer"
                          title={`حذف نوع "${t.name}"`}
                          aria-label={`حذف ${t.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Spec Groups & Fields Editor Column */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
        {activeTypeDef ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="text-[11px] text-cyan-400 font-semibold">
                  تكوين المواصفات الديناميكية لنوع:
                </div>
                <h3 className="text-base font-bold text-white">
                  {activeTypeDef.name}{' '}
                  <span className="text-xs text-slate-400 font-normal">
                    ({activeTypeDef.category})
                  </span>
                </h3>
                {activeTypeDef.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{activeTypeDef.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <input
                type="text"
                placeholder="أضف مجموعة مواصفات جديدة (مثال: أنظمة الأمان، التجهيزات الصوتية...)"
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
              />
              <button
                type="button"
                onClick={handleAddSpecGroupToType}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg font-semibold whitespace-nowrap cursor-pointer"
              >
                + إضافة مجموعة مواصفات
              </button>
            </div>

            <div className="space-y-4">
              {activeTypeDef.specGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <span className="font-bold text-sm text-cyan-300">{group.title}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setTargetGroupIdForField(
                            targetGroupIdForField === group.id ? '' : group.id
                          )
                        }
                        className="text-xs px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 font-semibold cursor-pointer"
                      >
                        {targetGroupIdForField === group.id
                          ? 'إغلاق مكتبة الخصائص'
                          : '+ اختيار من خصائص المعدات'}
                      </button>

                      {confirmDeleteGroupId === group.id ? (
                        <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-700/60 rounded-lg px-2 py-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSpecGroupFromType(group.id, group.title)
                            }
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded cursor-pointer"
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteGroupId(null)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteGroupId(group.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                          title={`حذف مجموعة "${group.title}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف المجموعة</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {targetGroupIdForField === group.id && (
                    <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-3.5 space-y-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-cyan-300">
                          اختر الحقول مباشرة من مكتبة «خصائص المعدات»:
                        </span>
                        {onNavigateToEquipmentProperties && (
                          <button
                            type="button"
                            onClick={onNavigateToEquipmentProperties}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                          >
                            إدارة خصائص المعدات ←
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="ابحث في خصائص المعدات بالاسم أو المفتاح..."
                          value={librarySearchQuery}
                          onChange={(e) => setLibrarySearchQuery(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                        <select
                          value={libraryCategoryFilter}
                          onChange={(e) => setLibraryCategoryFilter(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="all">
                            كل فئات خصائص المعدات ({equipmentProperties.length})
                          </option>
                          {propertyLibraryCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {filteredLibraryProperties.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-0.5">
                          {filteredLibraryProperties.map((prop) => {
                            const isAdded = group.fields.some(
                              (f) => f.id === prop.id || f.key === prop.key
                            );
                            return (
                              <button
                                key={prop.id}
                                type="button"
                                onClick={() =>
                                  handleTogglePropertyInGroup(group.id, prop)
                                }
                                className={`text-right p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                  isAdded
                                    ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 hover:border-cyan-500/50 text-slate-200'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="font-bold text-xs flex items-center gap-1.5 truncate">
                                    <span className="truncate">{prop.label}</span>
                                    {prop.unit && (
                                      <span className="text-[10px] text-cyan-400 font-mono shrink-0">
                                        ({prop.unit})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-cyan-300/80">
                                      {prop.key}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span>{FIELD_TYPE_LABELS[prop.type]}</span>
                                    <span aria-hidden="true">·</span>
                                    <span>
                                      {prop.isPublicDefault ? 'للعميل' : 'داخلي'}
                                    </span>
                                  </div>
                                </div>
                                <span
                                  className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                    isAdded
                                      ? 'bg-emerald-600/30 text-emerald-300'
                                      : 'bg-cyan-600/20 text-cyan-300'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>مضاف</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      <span>إدراج</span>
                                    </>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 py-3 text-center">
                          لا توجد خصائص مطابقة في مكتبة «خصائص المعدات». يمكنك إضافتها أولاً من صفحة خصائص المعدات.
                        </p>
                      )}
                    </div>
                  )}

                  {group.fields.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.fields.map((field) => (
                        <div
                          key={field.id}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{field.label}</span>
                              {field.unit && (
                                <span className="text-[10px] text-cyan-400 font-mono">
                                  ({field.unit})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{FIELD_TYPE_LABELS[field.type]}</span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  field.isPublicForClient
                                    ? 'text-emerald-400'
                                    : 'text-amber-300'
                                }
                              >
                                {field.isPublicForClient ? 'ظاهر للعميل' : 'داخلي فقط'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{field.isRequired ? 'إلزامي' : 'اختياري'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFieldFromGroup(group.id, field.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="حذف الحقل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      لا توجد حقول في هذه المجموعة بعد.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs">
            اختر نوع معدة من القائمة أو أضف نوعاً جديداً.
          </div>
        )}
      </div>
    </div>
  );
};
