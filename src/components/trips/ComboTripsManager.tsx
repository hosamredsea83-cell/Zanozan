import React, { useState } from 'react';
import { Activity } from '../../types/activity';
import { Layers, Plus, Clock, Users, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Trash2, Bus } from 'lucide-react';
import type { AppUser } from '../../types/auth';
import type { LogAuditEventInput } from '../../hooks/useAuditLogStore';

interface ComboPackage {
  id: string;
  title: string;
  description: string;
  activityIds: string[];
  totalDurationHours: number;
  priceEGP: number;
  priceEUR: number;
  sharedTransport: boolean;
  sharedTransportVehicle: string;
  status: 'active' | 'draft';
}

interface ComboTripsManagerProps {
  activities: Activity[];
  currentUser?: AppUser;
  onAuditLog?: (input: LogAuditEventInput) => void;
}

export const ComboTripsManager: React.FC<ComboTripsManagerProps> = ({
  activities,
  currentUser,
  onAuditLog
}) => {
  const [combos, setCombos] = useState<ComboPackage[]>([
    {
      id: 'cmb-01',
      title: 'باقة المغامرة الذهبية المتكاملة (يخت ملكي + سفاري بدوي)',
      description: 'رحلة يوم كامل تبدأ بإبحار يخت خاص صباحاً في جزيرة الجفتون، تليها فترة راحة ثم انطلاق سفاري بيتش باجي مع العشاء البدوي وحفلة التنورة.',
      activityIds: ['act-yacht-01', 'act-safari-02'],
      totalDurationHours: 12.5,
      priceEGP: 1250,
      priceEUR: 32,
      sharedTransport: true,
      sharedTransportVehicle: 'ميني باص سياحي مكيّف مشترك رقم 7842',
      status: 'active'
    },
    {
      id: 'cmb-02',
      title: 'باقة الفرسان وشبه الغواصة العائلية',
      description: 'جولة شبه غواصة بانورامية صباحية لمشاهدة الشعاب المرجانية، يليها ركوب خيل عربي أصيل على شاطئ البحر الأحمر وقت الغروب.',
      activityIds: ['act-submarine-04', 'act-horses-05'],
      totalDurationHours: 5,
      priceEGP: 720,
      priceEUR: 18,
      sharedTransport: true,
      sharedTransportVehicle: 'ليموزين مرسيدس خاص VIP',
      status: 'active'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [comboTitle, setComboTitle] = useState('رحلة مجمعة جديدة');
  const [comboDesc, setComboDesc] = useState('برنامج سياحي متكامل يجمع بين نشاطين متعاقبين بنقل مشترك.');
  const [selectedAct1, setSelectedAct1] = useState(activities[0]?.id || '');
  const [selectedAct2, setSelectedAct2] = useState(activities[1]?.id || '');
  const [sharedVehicle, setSharedVehicle] = useState('حافلة سياحية VIP مشتركة');
  const [comboPriceEGP, setComboPriceEGP] = useState(900);
  const [comboPriceEUR, setComboPriceEUR] = useState(22);

  const handleCreateCombo = (e: React.FormEvent) => {
    e.preventDefault();
    const act1 = activities.find((a) => a.id === selectedAct1);
    const act2 = activities.find((a) => a.id === selectedAct2);
    const totalHours = (act1?.duration.hours || 3) + (act2?.duration.hours || 3) + 1.5;

    const newCombo: ComboPackage = {
      id: `cmb-${Date.now().toString().slice(-4)}`,
      title: comboTitle,
      description: comboDesc,
      activityIds: [selectedAct1, selectedAct2],
      totalDurationHours: totalHours,
      priceEGP: comboPriceEGP,
      priceEUR: comboPriceEUR,
      sharedTransport: true,
      sharedTransportVehicle: sharedVehicle,
      status: 'active'
    };

    setCombos([newCombo, ...combos]);
    setShowAddModal(false);
    if (currentUser) {
      onAuditLog?.({
        actor: currentUser,
        action: 'create',
        domain: 'trip_combo',
        entityId: newCombo.id,
        entityName: newCombo.title,
        summary: `أنشأ ${currentUser.name} رحلة مجمعة جديدة «${newCombo.title}»`
      });
    }
  };

  const handleDeleteCombo = (id: string) => {
    const target = combos.find((c) => c.id === id);
    setCombos(combos.filter((c) => c.id !== id));
    if (currentUser) {
      onAuditLog?.({
        actor: currentUser,
        action: 'delete',
        domain: 'trip_combo',
        entityId: id,
        entityName: target?.title || id,
        summary: `حذف ${currentUser.name} الرحلة المجمعة «${target?.title || id}»`
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>إدارة الرحلات المجمعة (Combo Packages)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            البند 12 من وثيقة ZanoZa: ربط الأنشطة برحلات مجمعة، ترتيب الأنشطة، النقل المشترك، وتوزيع الحصص والمسؤوليات.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ إنشاء رحلة مجمعة جديدة</span>
        </button>
      </div>

      {/* Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {combos.map((combo) => {
          const comboActs = combo.activityIds
            .map((id) => activities.find((a) => a.id === id))
            .filter(Boolean) as Activity[];

          return (
            <div
              key={combo.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-600/20 text-cyan-300 font-bold">
                    معرف الرحلة: {combo.id}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> باقة نشطة للحجز
                  </span>
                </div>

                <h4 className="text-base font-bold text-white">{combo.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{combo.description}</p>

                {/* Sub-activities Sequence */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-300 block">
                    تسلسل وترتيب الأنشطة داخل الرحلة (بند 91 & 92):
                  </span>

                  <div className="space-y-1.5">
                    {comboActs.map((act, index) => (
                      <div
                        key={act.id}
                        className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-[10px]">
                            {index + 1}
                          </span>
                          <div>
                            <span className="font-bold text-white block line-clamp-1">{act.name}</span>
                            <span className="text-[10px] text-slate-400">
                              المالك: {act.owner.companyName}
                            </span>
                          </div>
                        </div>

                        <div className="text-left font-mono text-[11px] text-slate-400">
                          {act.duration.hours} ساعات
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shared Transport Info (Bnd 93) */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center gap-2 text-slate-300">
                  <Bus className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-[11px]">
                    <strong>النقل المشترك (بند 93):</strong> {combo.sharedTransportVehicle}
                  </span>
                </div>

                {/* Pricing Box */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-tajawal">سعر الباقة للمصريين:</span>
                    <span className="text-sm font-bold text-white">{combo.priceEGP.toLocaleString()} ج.م</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-tajawal">سعر الباقة للأجانب:</span>
                    <span className="text-sm font-bold text-cyan-300">€{combo.priceEUR}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">إجمالي المدة: {combo.totalDurationHours} ساعة</span>
                <button
                  onClick={() => handleDeleteCombo(combo.id)}
                  className="text-slate-500 hover:text-red-400 p-1"
                  title="حذف الباقة المجمعة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Combo */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleCreateCombo}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white">إنشاء رحلة مجمعة جديدة (Combo Package)</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">عنوان الرحلة المجمعة:</label>
                <input
                  type="text"
                  value={comboTitle}
                  onChange={(e) => setComboTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">وصف البرنامج السياحي:</label>
                <textarea
                  rows={2}
                  value={comboDesc}
                  onChange={(e) => setComboDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">النشاط الأول (الصباحي):</label>
                  <select
                    value={selectedAct1}
                    onChange={(e) => setSelectedAct1(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  >
                    {activities.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">النشاط الثاني (المسائي):</label>
                  <select
                    value={selectedAct2}
                    onChange={(e) => setSelectedAct2(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  >
                    {activities.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">النقل المشترك بين الأنشطة (بند 93):</label>
                <input
                  type="text"
                  value={sharedVehicle}
                  onChange={(e) => setSharedVehicle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">سعر الباقة مصري (ج.م):</label>
                  <input
                    type="number"
                    min={1}
                    value={comboPriceEGP}
                    onChange={(e) => setComboPriceEGP(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 font-mono text-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">سعر الباقة أجنبي (€):</label>
                  <input
                    type="number"
                    min={1}
                    value={comboPriceEUR}
                    onChange={(e) => setComboPriceEUR(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 font-mono text-cyan-300 text-center font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg"
              >
                حفظ الباقة المجمعة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
