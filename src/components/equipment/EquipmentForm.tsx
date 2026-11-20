import React, { useState } from 'react';
import type {
  EquipmentItem,
  EquipmentMediaItem,
  EquipmentSpecFieldType,
  EquipmentSpecFieldValue,
  EquipmentStatus,
  EquipmentTypeDefinition
} from '../../types/equipment';
import type { AppUser } from '../../types/auth';
import type { PartnerRecord } from '../../types/partner';
import type { Asset } from '../MediaUploadSection';
import { StandardMediaUploader } from '../shared/StandardMediaUploader';
import { EquipmentOwnershipSyncField } from './EquipmentOwnershipSyncField';
import { Eye, EyeOff, Sliders, X } from 'lucide-react';

interface EquipmentFormProps {
  editingEquipment: EquipmentItem;
  setEditingEquipment: React.Dispatch<React.SetStateAction<EquipmentItem | null>>;
  isNewMode: boolean;
  equipmentTypes: EquipmentTypeDefinition[];
  currentUser: AppUser;
  partners: PartnerRecord[];
  onOpenPartnersRegistry: () => void;
  onEquipmentTypeChange: (newTypeId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({
  editingEquipment,
  setEditingEquipment,
  isNewMode,
  equipmentTypes,
  currentUser,
  partners,
  onOpenPartnersRegistry,
  onEquipmentTypeChange,
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

  const getTypeName = (typeId: string) =>
    equipmentTypes.find((t) => t.id === typeId)?.name || 'نوع مخصص';

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

  return (
    <div className="w-full animate-fade-in">
      <form
        onSubmit={onSubmit}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full p-5 sm:p-6 space-y-5 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
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
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>العودة للسجل</span>
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
            >
              {isNewMode ? 'حفظ المعدة' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>

        {/* 1. Core Identity & Ownership (div:nth-of-type(2) with 6 child divs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
              اسم المعدة *
            </label>
            <input
              type="text"
              required
              placeholder="مثال: يخت النيل الذهبي، جواد أصيل، كاميرا Sony A7..."
              value={editingEquipment.name}
              onChange={(e) =>
                setEditingEquipment({ ...editingEquipment, name: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
              نوع المعدة (ديناميكي) *
            </label>
            <select
              value={editingEquipment.typeId}
              onChange={(e) => onEquipmentTypeChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500"
            >
              {equipmentTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — ({t.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
              التصنيف الفرعي / الاستخدام
            </label>
            <input
              type="text"
              placeholder="مثال: VIP عائلي، رحلات غوص، تصوير 4K..."
              value={editingEquipment.classification}
              onChange={(e) =>
                setEditingEquipment({
                  ...editingEquipment,
                  classification: e.target.value
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
              الحالة والتوافر
            </label>
            <select
              value={editingEquipment.status}
              onChange={(e) =>
                setEditingEquipment({
                  ...editingEquipment,
                  status: e.target.value as EquipmentStatus
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500"
            >
              <option value="available">متاحة وجاهزة للتشغيل</option>
              <option value="in_use">قيد الاستخدام</option>
              <option value="maintenance">تحت الصيانة</option>
              <option value="inactive">غير نشطة</option>
            </select>
          </div>

          {/* Synchronized 5th & 6th grid cells: Ownership Type + Partner/Owner Sync */}
          <EquipmentOwnershipSyncField
            editingEquipment={editingEquipment}
            setEditingEquipment={setEditingEquipment}
            currentUser={currentUser}
            partners={partners}
            onOpenPartnersRegistry={onOpenPartnersRegistry}
          />
        </div>

        <div className="text-xs">
          <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
            وصف المعدة
          </label>
          <textarea
            rows={3}
            value={editingEquipment.description}
            onChange={(e) =>
              setEditingEquipment({ ...editingEquipment, description: e.target.value })
            }
            placeholder="اشرح مميزات المعدة وتجهيزاتها وتجربة العميل بها..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-cyan-500"
          />
        </div>

        {/* 2. Operational & Technical Data (Internal vs Client) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white">البيانات الفنية والتشغيلية</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                الرقم التسلسلي / الترخيص
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
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
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
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
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
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value="ready">جاهزة ومعتمدة</option>
                <option value="needs_check">تحتاج مراجعة فنية</option>
                <option value="in_maintenance">قيد الصيانة</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
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
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
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
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-amber-100"
            />
          </div>
        </div>

        {/* 3. Dynamic Specifications Form */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>المواصفات الديناميكية لنوع ({getTypeName(editingEquipment.typeId)})</span>
            </span>
            <span className="text-[10px] text-slate-400">
              يمكنك التحكم في ظهور كل حقل للعميل أو إبقائه داخلياً
            </span>
          </div>

          {editingEquipment.dynamicSpecs.map((group) => (
            <div
              key={group.groupId}
              className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 space-y-3"
            >
              <div className="text-xs font-bold text-cyan-300">{group.title}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.fields.map((field) => (
                  <div
                    key={field.fieldId}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold text-white">
                        {field.label} {field.unit ? `(${field.unit})` : ''}{' '}
                        {field.isRequired && <span className="text-rose-400">*</span>}
                      </label>
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
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
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
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
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
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white font-mono"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Custom per-equipment spec adder */}
          <div className="bg-slate-900/70 border border-dashed border-slate-700 rounded-xl p-3 space-y-2">
            <span className="text-[11px] font-bold text-cyan-300 block">
              + إضافة مواصفة مخصصة لهذه المعدة تحديداً:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="اسم المواصفة"
                value={customSpecLabel}
                onChange={(e) => setCustomSpecLabel(e.target.value)}
                className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              />
              <select
                value={customSpecType}
                onChange={(e) =>
                  setCustomSpecType(e.target.value as EquipmentSpecFieldType)
                }
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
              >
                <option value="text">نص</option>
                <option value="number">رقم</option>
                <option value="boolean">نعم / لا</option>
              </select>
              <input
                type="text"
                placeholder="القيمة"
                value={customSpecValue}
                onChange={(e) => setCustomSpecValue(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCustomSpecPublic(!customSpecPublic)}
                  className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 cursor-pointer"
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
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-2">
            <span className="text-[11px] font-bold text-slate-200 block">
              بيانات إضافية حسب طبيعة المعدة:
            </span>
            {editingEquipment.extraData.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {editingEquipment.extraData.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-[11px]"
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
                className="flex-1 min-w-[140px] bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white"
              />
              <input
                type="text"
                placeholder="القيمة..."
                value={newExtraValue}
                onChange={(e) => setNewExtraValue(e.target.value)}
                className="flex-1 min-w-[140px] bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white"
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
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-semibold cursor-pointer"
              >
                + إضافة بيان
              </button>
            </div>
          </div>
        </div>

        {/* 4. Equipment Media & Videos */}
        <div className="space-y-3">
          <StandardMediaUploader
            title="Media / وسائط وصور المعدة"
            initialFiles={editingEquipment.media
              .filter((m) => m.type === 'image')
              .map((m, i) => ({
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

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
            <span className="font-bold text-slate-200 block">
              إضافة فيديو للمعدة (YouTube / رابط مباشر):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="عنوان الفيديو"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              />
              <input
                type="text"
                dir="ltr"
                placeholder="https://youtube.com/watch?v=..."
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              />
              <button
                type="button"
                onClick={handleAddVideoMedia}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-semibold cursor-pointer"
              >
                + إرفاق الفيديو للمعدة
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
