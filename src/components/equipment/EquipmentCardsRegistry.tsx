import React from 'react';
import type {
  EquipmentItem,
  EquipmentStatus,
  EquipmentTypeDefinition
} from '../../types/equipment';
import type { Activity } from '../../types/activity';
import type { AppUser } from '../../types/auth';
import {
  MAINTENANCE_LABELS,
  OWNERSHIP_LABELS,
  STATUS_META
} from './equipmentHelpers';
import {
  Edit3,
  Eye,
  EyeOff,
  Link2,
  Search,
  Sliders,
  Trash2,
  UserCheck,
  Video,
  Wrench
} from 'lucide-react';

interface EquipmentCardsRegistryProps {
  equipments: EquipmentItem[];
  myEquipments: EquipmentItem[];
  visibleEquipments: EquipmentItem[];
  equipmentTypes: EquipmentTypeDefinition[];
  activities: Activity[];
  currentUser: AppUser;
  scopeFilter: 'mine' | 'all';
  setScopeFilter: (val: 'mine' | 'all') => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onCreateEquipment: () => void;
  onEditEquipment: (eq: EquipmentItem) => void;
  onDeleteEquipment: (eqId: string, eqName: string) => void;
  onChangeEquipmentStatus: (eqId: string, status: EquipmentStatus, eqName: string) => void;
  onInspectEquipment: (eq: EquipmentItem) => void;
  onOpenActivityInEditor?: (act: Activity) => void;
}

export const EquipmentCardsRegistry: React.FC<EquipmentCardsRegistryProps> = ({
  equipments,
  myEquipments,
  visibleEquipments,
  equipmentTypes,
  activities,
  currentUser,
  scopeFilter,
  setScopeFilter,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  onCreateEquipment,
  onEditEquipment,
  onDeleteEquipment,
  onChangeEquipmentStatus,
  onInspectEquipment,
  onOpenActivityInEditor
}) => {
  const getTypeName = (typeId: string) =>
    equipmentTypes.find((t) => t.id === typeId)?.name || 'نوع مخصص';

  const getLinkedActivities = (equipmentId: string) =>
    activities.filter((act) => act.equipmentIds?.includes(equipmentId));

  return (
    <div className="space-y-5">
      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">معداتك المسجلة</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {myEquipments.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            بملفات مستقلة (Equipment ID)
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">جاهزة للتشغيل</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {myEquipments.filter((e) => e.status === 'available').length}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">
            متاحة للربط بالأنشطة
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">مرتبطة بأنشطة حالية</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {myEquipments.filter((e) => getLinkedActivities(e.id).length > 0).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            علاقة مرنة متعددة الأنشطة
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">أنواع المعدات بالمنظومة</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {equipmentTypes.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            قابلة للتوسع ديناميكياً
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المعدة، رقم التعريف EQ-، أو النوع..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">جميع أنواع المعدات</option>
            {equipmentTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">جميع الحالات</option>
            <option value="available">متاحة وجاهزة للتشغيل</option>
            <option value="in_use">قيد التشغيل في نشاط</option>
            <option value="maintenance">تحت الصيانة</option>
            <option value="inactive">متوقفة مؤقتاً</option>
          </select>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setScopeFilter('mine')}
            className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
              scopeFilter === 'mine'
                ? 'bg-cyan-600/30 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            معدات حسابي ({myEquipments.length})
          </button>
          <button
            type="button"
            onClick={() => setScopeFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
              scopeFilter === 'all'
                ? 'bg-cyan-600/30 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            كل معدات الشركاء ({equipments.length})
          </button>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      {visibleEquipments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Wrench className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">
            لا توجد معدات مسجلة مطابقة للبحث
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            سجّل أول معدة (مركب نيلي، لانش، يخت، حصان، كاميرا تصوير، معدات غوص...) ليتم إنشاء ملف مستقل لها وربطها بأنشطتك.
          </p>
          <button
            type="button"
            onClick={onCreateEquipment}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            + إضافة معدة جديدة الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibleEquipments.map((eq) => {
            const isMine = eq.ownerId === currentUser.id;
            const linkedActs = getLinkedActivities(eq.id);
            const coverImg =
              eq.media.find((m) => m.isCover && m.type === 'image') ||
              eq.media.find((m) => m.type === 'image');
            const statusInfo = STATUS_META[eq.status];

            return (
              <div
                key={eq.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between transition-all"
              >
                {/* Media Header */}
                <div className="bg-slate-950 border-b border-slate-800">
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    {coverImg ? (
                      <img
                        src={coverImg.url}
                        alt={eq.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                        لا توجد صورة للمعدة
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-700 text-cyan-300 font-mono text-[11px] font-bold">
                          {eq.id}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-800 text-white text-[11px] font-semibold">
                          {getTypeName(eq.typeId)}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 left-3">
                      <div className="text-[11px] text-slate-300 flex items-center gap-2 mb-0.5">
                        <span>{eq.classification || 'تصنيف تشغيلي عام'}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {OWNERSHIP_LABELS[eq.ownershipType]}
                          {eq.partnerName ? ` (${eq.partnerName})` : ''}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{eq.name}</h3>
                    </div>
                  </div>

                  {eq.media.length > 0 && (
                    <div className="p-2.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
                      {eq.media.map((m) => (
                        <div
                          key={m.id}
                          className="w-20 shrink-0 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 text-right"
                          title={`${m.title} (${m.isPublicForClient ? 'يظهر للعميل' : 'داخلي فقط'})`}
                        >
                          <div className="h-12 w-full bg-slate-950 relative">
                            {m.type === 'image' ? (
                              <img
                                src={m.url}
                                alt={m.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-rose-400">
                                <Video className="w-4 h-4" />
                              </div>
                            )}
                            {!m.isPublicForClient && (
                              <span className="absolute top-0.5 left-0.5 bg-slate-950/90 text-amber-300 text-[8px] px-1 rounded">
                                داخلي
                              </span>
                            )}
                          </div>
                          <div className="px-1 py-0.5 text-[9px] text-slate-300 truncate">
                            {m.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between text-xs">
                  <div className="space-y-3">
                    <p className="text-slate-300 leading-relaxed">{eq.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          صاحب المعدة / الحساب المرتبط:
                        </span>
                        <span className="text-white font-bold flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                          {eq.ownerName}
                        </span>
                        <span className="text-slate-400 text-[10px] block">
                          {eq.ownerCompanyName}
                        </span>
                        {eq.ownershipDetails && (
                          <span className="text-cyan-300 text-[10px] block mt-0.5">
                            {eq.ownershipDetails}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          البيانات الفنية والتشغيلية:
                        </span>
                        <span className="text-slate-200 font-mono block mt-0.5">
                          {eq.operationalData.serialOrRegistrationNo || 'بدون رقم تسجيل'} ·{' '}
                          {eq.operationalData.modelYear || '—'}
                        </span>
                        <span className="text-emerald-400 text-[10px] block">
                          الصيانة: {MAINTENANCE_LABELS[eq.operationalData.maintenanceStatus]}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Specifications */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                          <span>المواصفات الديناميكية ({getTypeName(eq.typeId)})</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {eq.showToClientDefault
                            ? 'مفعّلة للعرض العام'
                            : 'مخفية افتراضياً عن العميل'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {eq.dynamicSpecs.map((group) => (
                          <div key={group.groupId} className="space-y-1.5">
                            <div className="text-[11px] text-cyan-300 font-semibold">
                              {group.title}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {group.fields.map((field) => (
                                <div
                                  key={field.fieldId}
                                  className="flex items-center justify-between gap-2 bg-slate-900/70 border border-slate-800/70 rounded-lg px-2.5 py-1.5 text-[11px]"
                                >
                                  <span className="text-slate-400 flex items-center gap-1 min-w-0 truncate">
                                    {!field.isPublicForClient && (
                                      <span
                                        title="داخلي لا يظهر للعميل"
                                        className="inline-flex shrink-0"
                                      >
                                        <EyeOff className="w-3 h-3 text-amber-400" />
                                      </span>
                                    )}
                                    <span className="truncate">{field.label}:</span>
                                  </span>
                                  <span className="text-white font-semibold font-mono text-left shrink-0">
                                    {typeof field.value === 'boolean'
                                      ? field.value
                                        ? 'نعم'
                                        : 'لا'
                                      : Array.isArray(field.value)
                                      ? field.value.join('، ') || '—'
                                      : `${field.value}${field.unit ? ` ${field.unit}` : ''}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Linked Activities */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>الأنشطة المرتبطة بهذه المعدة ({linkedActs.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          مرجع مستقل دون تكرار
                        </span>
                      </div>

                      {linkedActs.length > 0 ? (
                        <div className="space-y-1.5">
                          {linkedActs.map((act) => (
                            <div
                              key={act.id}
                              className="flex items-center justify-between gap-2 bg-slate-900/70 border border-slate-800/70 rounded-lg px-2.5 py-1.5 text-[11px]"
                            >
                              <div className="min-w-0">
                                <span className="text-slate-200 font-semibold block truncate">
                                  {act.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {act.location.city} · {act.id}
                                </span>
                              </div>
                              {onOpenActivityInEditor && (
                                <button
                                  type="button"
                                  onClick={() => onOpenActivityInEditor(act)}
                                  className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold shrink-0 cursor-pointer"
                                >
                                  فتح النشاط
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          لم تُربط هذه المعدة بأي نشاط بعد. يمكنك اختيارها من داخل محرر الأنشطة.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {isMine ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditEquipment(eq)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>تعديل الملف والمواصفات</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEquipment(eq.id, eq.name)}
                            className="p-1.5 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-white border border-rose-900/40 rounded-lg transition-colors cursor-pointer"
                            title="حذف المعدة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          ملف مملوك لشريك آخر (للاطلاع فقط)
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onInspectEquipment(eq)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="معاينة ما يظهر للعميل مقابل الداخلي"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة</span>
                      </button>
                    </div>

                    {isMine && (
                      <select
                        value={eq.status}
                        onChange={(e) =>
                          onChangeEquipmentStatus(
                            eq.id,
                            e.target.value as EquipmentStatus,
                            eq.name
                          )
                        }
                        aria-label="تغيير حالة المعدة"
                        className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="available">متاحة وجاهزة للتشغيل</option>
                        <option value="in_use">قيد التشغيل</option>
                        <option value="maintenance">تحت الصيانة</option>
                        <option value="inactive">متوقفة مؤقتاً</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
