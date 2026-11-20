import React, { useState, useMemo } from 'react';
import { Activity } from '../../types/activity';
import { EquipmentItem, EquipmentStatus, EquipmentTypeDefinition } from '../../types/equipment';
import { Wrench, Search, Check, Eye, EyeOff, PlusCircle, Link2, CheckCircle2 } from 'lucide-react';

interface ActivityEquipmentSelectorProps {
  formData: Activity;
  setFormData: React.Dispatch<React.SetStateAction<Activity>>;
  equipments: EquipmentItem[];
  equipmentTypes: EquipmentTypeDefinition[];
  allActivities?: Activity[];
  onNavigateToEquipment?: () => void;
  notifyDbSuccess?: (msg: string) => void;
}

const STATUS_LABELS: Record<EquipmentStatus, { label: string; color: string }> = {
  available: { label: 'متاحة', color: 'text-emerald-400' },
  in_use: { label: 'قيد التشغيل', color: 'text-cyan-400' },
  maintenance: { label: 'صيانة', color: 'text-amber-400' },
  inactive: { label: 'موقوفة', color: 'text-slate-400' }
};

export const ActivityEquipmentSelector: React.FC<ActivityEquipmentSelectorProps> = ({
  formData,
  setFormData,
  equipments,
  equipmentTypes,
  allActivities = [],
  onNavigateToEquipment,
  notifyDbSuccess
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const selectedIds = formData.equipmentIds || [];
  const showToClient = formData.showEquipmentToClient ?? true;

  const ownerEquipments = useMemo(() => {
    const targetOwnerId = formData.owner?.id;
    const filteredByOwner = targetOwnerId
      ? equipments.filter((eq) => eq.ownerId === targetOwnerId)
      : equipments;
    // Also ensure any already-linked equipment stays visible even if ownership changed
    const alreadyLinkedOther = equipments.filter(
      (eq) => selectedIds.includes(eq.id) && eq.ownerId !== targetOwnerId
    );
    return [...filteredByOwner, ...alreadyLinkedOther];
  }, [equipments, formData.owner?.id, selectedIds]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ownerEquipments.filter((eq) => {
      const typeName = equipmentTypes.find((t) => t.id === eq.typeId)?.name || '';
      const matchesSearch =
        !q ||
        eq.name.toLowerCase().includes(q) ||
        eq.id.toLowerCase().includes(q) ||
        typeName.toLowerCase().includes(q) ||
        eq.classification.toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || eq.typeId === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [ownerEquipments, searchQuery, typeFilter, equipmentTypes]);

  const toggleEquipmentId = (eqId: string, eqName: string) => {
    const exists = selectedIds.includes(eqId);
    const nextIds = exists ? selectedIds.filter((id) => id !== eqId) : [...selectedIds, eqId];
    setFormData((prev) => ({
      ...prev,
      equipmentIds: nextIds
    }));
    if (notifyDbSuccess) {
      notifyDbSuccess(
        exists
          ? `تم فك ارتباط المعدة "${eqName}" بالنشاط (ملف المعدة الأصلي محفوظ)`
          : `✓ تم ربط المعدة "${eqName}" (${eqId}) بالنشاط دون نسخ بياناتها`
      );
    }
  };

  const toggleShowToClient = () => {
    const nextVal = !showToClient;
    setFormData((prev) => ({
      ...prev,
      showEquipmentToClient: nextVal
    }));
    if (notifyDbSuccess) {
      notifyDbSuccess(
        nextVal
          ? '✓ تم تفعيل عرض المعدات ومواصفاتها العامة للعميل في هذا النشاط'
          : 'تم إخفاء تفاصيل المعدات عن واجهة العميل لهذا النشاط'
      );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>المعدات المستخدمة في النشاط</span>
            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
              {selectedIds.length} مرتبطة
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            اختر معدة أو أكثر من ملفات معداتك المستقلة. يتم الربط عبر المعرّف المرجعي فقط دون نسخ بيانات المعدة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleShowToClient}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              showToClient
                ? 'bg-emerald-950/50 border-emerald-600/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            {showToClient ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showToClient ? 'ظاهر للعميل' : 'مخفي عن العميل'}</span>
          </button>

          {onNavigateToEquipment && (
            <button
              type="button"
              onClick={onNavigateToEquipment}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إدارة / تسجيل معدة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في معداتك المسجلة (مركب نيلي، يخت، حصان، كاميرا...)"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">كل أنواع المعدات ({ownerEquipments.length})</option>
          {equipmentTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selectable Equipment List */}
      {filteredList.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-2 text-xs">
          <p className="text-slate-400">
            لا توجد معدات مسجلة في ملف المالك الحالي مطابقة للبحث.
          </p>
          {onNavigateToEquipment && (
            <button
              type="button"
              onClick={onNavigateToEquipment}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold"
            >
              + الانتقال لتسجيل معدة في إدارة المعدات
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredList.map((eq) => {
            const isSelected = selectedIds.includes(eq.id);
            const typeDef = equipmentTypes.find((t) => t.id === eq.typeId);
            const coverUrl = eq.media.find((m) => m.isCover && m.type === 'image')?.url || eq.media[0]?.url;
            const otherActivitiesCount = allActivities.filter(
              (a) => a.id !== formData.id && a.equipmentIds?.includes(eq.id)
            ).length;
            const st = STATUS_LABELS[eq.status];

            return (
              <button
                key={eq.id}
                type="button"
                onClick={() => toggleEquipmentId(eq.id, eq.name)}
                className={`text-right p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                  {coverUrl ? (
                    <img src={coverUrl} alt={eq.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Wrench className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white truncate">{eq.name}</span>
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                          : 'bg-slate-900 border-slate-700 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="font-mono text-cyan-400">{eq.id}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-300 font-semibold">{typeDef?.name || 'معدة'}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className={`font-semibold ${st.color}`}>{st.label}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <Link2 className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>
                      {otherActivitiesCount > 0
                        ? `مستخدمة أيضاً في ${otherActivitiesCount} أنشطة أخرى`
                        : 'متاحة للربط المباشر بهذه الخدمة'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Equipment Summary Notice */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              المعرفات المرجعية المرتبطة: {selectedIds.join(' ، ')}
            </span>
          </div>
          <span className="text-slate-400">
            يُقرأ ملف كل معدة ومواصفاتها من سجل المعدات الأصلي تلقائياً.
          </span>
        </div>
      )}
    </div>
  );
};
