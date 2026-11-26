import React from 'react';
import type { EquipmentItem } from '../../types/equipment';
import { Eye, EyeOff, X } from 'lucide-react';

interface EquipmentInspectModalProps {
  equipment: EquipmentItem | null;
  onClose: () => void;
}

export const EquipmentInspectModal: React.FC<EquipmentInspectModalProps> = ({
  equipment,
  onClose
}) => {
  if (!equipment) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] text-cyan-400 font-mono">
              {equipment.id} · معاينة ملف المعدة
            </span>
            <h3 className="text-base font-bold text-white">
              {equipment.name}
              {equipment.translations?.en?.name && (
                <span dir="ltr" className="text-xs font-normal text-slate-400 mr-2">
                  ({equipment.translations.en.name})
                </span>
              )}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-xl p-4 space-y-2 text-xs">
          <div className="font-bold text-emerald-300 flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>البيانات والمواصفات التي تظهر للعميل فقط:</span>
          </div>
          {!equipment.showToClientDefault ? (
            <p className="text-amber-300 text-[11px]">
              تنبيه: العرض العام للعملاء متوقف حالياً على هذه المعدة (showToClientDefault = OFF).
            </p>
          ) : (
            <div className="space-y-2">
              {equipment.description && <p className="text-slate-300">{equipment.description}</p>}
              {equipment.translations?.en?.description && (
                <p dir="ltr" className="text-slate-400 text-[11px]">
                  {equipment.translations.en.description}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {equipment.dynamicSpecs.flatMap((g) =>
                  g.fields
                    .filter((f) => f.isPublicForClient)
                    .map((f) => (
                      <div
                        key={f.fieldId}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 flex justify-between"
                      >
                        <span className="text-slate-400">{f.label}:</span>
                        <span className="text-white font-bold font-mono">
                          {typeof f.value === 'boolean'
                            ? f.value
                              ? 'نعم'
                              : 'لا'
                            : Array.isArray(f.value)
                            ? f.value.join('، ')
                            : `${f.value}${f.unit ? ` ${f.unit}` : ''}`}
                        </span>
                      </div>
                    ))
                )}
                {(equipment.extraData || [])
                  .filter((ex) => ex.isPublicForClient)
                  .map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 flex justify-between"
                    >
                      <span className="text-slate-400">{ex.label}:</span>
                      <span className="text-white font-bold font-mono">{ex.value}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 space-y-2 text-xs">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <EyeOff className="w-4 h-4" />
            <span>البيانات الداخلية (محجوبة تماماً عن العميل):</span>
          </div>
          <div className="text-slate-300 text-[11px] space-y-1">
            <div>
              تفاصيل الملكية / الشريك: {equipment.ownershipDetails || '—'}
            </div>
            <div>
              رقم التسجيل/السيريال: {equipment.operationalData.serialOrRegistrationNo || '—'}
            </div>
            <div>ملاحظات الصيانة الداخلية: {equipment.operationalData.internalNotes || '—'}</div>
            {equipment.dynamicSpecs.flatMap((g) =>
              g.fields
                .filter((f) => !f.isPublicForClient)
                .map((f) => (
                  <div key={f.fieldId}>
                    • {f.label}: <span className="font-mono text-amber-200">{String(f.value)}</span>
                  </div>
                ))
            )}
            {(equipment.extraData || [])
              .filter((ex) => !ex.isPublicForClient)
              .map((ex) => (
                <div key={ex.id}>
                  • {ex.label}: <span className="font-mono text-amber-200">{ex.value}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
          <div className="font-bold text-cyan-300">سجل التوثيق والتتبع الزمني (القاعدة الثالثة):</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
              <div className="text-slate-400">أنشئت بواسطة:</div>
              <div className="font-bold text-white mt-0.5">
                {equipment.createdByName || equipment.ownerName}
              </div>
              <div dir="ltr" className="text-[10px] font-mono text-emerald-400 text-right mt-0.5">
                {equipment.createdAtTime || equipment.createdAt}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
              <div className="text-slate-400">آخر تعديل بواسطة:</div>
              <div className="font-bold text-white mt-0.5">
                {equipment.updatedByName || equipment.ownerName}
              </div>
              <div dir="ltr" className="text-[10px] font-mono text-cyan-400 text-right mt-0.5">
                {equipment.updatedAtTime || equipment.updatedAt}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
