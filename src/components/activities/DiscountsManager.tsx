import React, { useState } from 'react';
import { Activity } from '../../types/activity';
import { Tag, Percent, DollarSign, Search, CheckCircle2, ArrowRight } from 'lucide-react';

interface DiscountsManagerProps {
  activities: Activity[];
  onUpdateActivityPricing: (activityId: string, updatedPricing: Activity['pricing']) => void;
}

export const DiscountsManager: React.FC<DiscountsManagerProps> = ({
  activities,
  onUpdateActivityPricing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id || '');
  const [discountPercentEGP, setDiscountPercentEGP] = useState<number>(10);
  const [discountPercentEUR, setDiscountPercentEUR] = useState<number>(10);
  const [showAppliedToast, setShowAppliedToast] = useState(false);

  const activeActivity = activities.find((a) => a.id === selectedActivityId) || activities[0];

  const handleApplyInstantDiscount = () => {
    if (!activeActivity) return;

    const currentPricing = activeActivity.pricing;

    const calcDisc = (val: number, pct: number) => Math.max(0, Math.round(val * (1 - pct / 100)));

    const updatedPricing: Activity['pricing'] = {
      ...currentPricing,
      egyptianB2C: {
        ...currentPricing.egyptianB2C,
        adultEGP: calcDisc(currentPricing.egyptianB2C.adultEGP, discountPercentEGP),
        childEGP: calcDisc(currentPricing.egyptianB2C.childEGP, discountPercentEGP),
        privateTotalEGP: currentPricing.egyptianB2C.privateTotalEGP
          ? calcDisc(currentPricing.egyptianB2C.privateTotalEGP, discountPercentEGP)
          : undefined
      },
      foreignerB2C: {
        ...currentPricing.foreignerB2C,
        adultEUR: calcDisc(currentPricing.foreignerB2C.adultEUR, discountPercentEUR),
        childEUR: calcDisc(currentPricing.foreignerB2C.childEUR, discountPercentEUR),
        privateTotalEUR: currentPricing.foreignerB2C.privateTotalEUR
          ? calcDisc(currentPricing.foreignerB2C.privateTotalEUR, discountPercentEUR)
          : undefined
      }
    };

    onUpdateActivityPricing(activeActivity.id, updatedPricing);
    setShowAppliedToast(true);
    setTimeout(() => setShowAppliedToast(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-rose-400" />
            <span>إدارة التخفيضات وتعديل أسعار التذاكر</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            البند 14 من الوثيقة: إظهار السعر الأصلي والسعر بعد الخصم مع الحفاظ على استقلالية عملة الجنيه للمصري واليورو للأجنبي.
          </p>
        </div>

        {showAppliedToast && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>تم تطبيق التخفيض وتحديث الأسعار بنجاح!</span>
          </div>
        )}
      </div>

      {/* Main Grid: Selection + Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Picker List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-white border-b border-slate-800 pb-2">
            اختر النشاط لتطبيق التخفيض:
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {activities.map((act) => {
              const isSelected = act.id === selectedActivityId;
              return (
                <div
                  key={act.id}
                  onClick={() => setSelectedActivityId(act.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white line-clamp-1">{act.name}</div>
                  <div className="text-[11px] text-cyan-400 mt-0.5">{act.location.city} · {act.categoryPath.slice(-1)[0]}</div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                    <span>مصري: {act.pricing.egyptianB2C.adultEGP} ج.م</span>
                    <span className="text-cyan-300">أجنبي: €{act.pricing.foreignerB2C.adultEUR}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Activity Discount Calculator */}
        {activeActivity && (
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[11px] text-cyan-400 font-mono">النشاط المحدد:</span>
              <h3 className="text-lg font-bold text-white">{activeActivity.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{activeActivity.description}</p>
            </div>

            {/* Discount Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-white">نسبة تخفيض المصريين (EGP):</span>
                  <span className="font-mono text-amber-300 font-bold">{discountPercentEGP}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={discountPercentEGP}
                  onChange={(e) => setDiscountPercentEGP(parseInt(e.target.value) || 0)}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50% كحد أقصى</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-white">نسبة تخفيض الأجانب (EUR):</span>
                  <span className="font-mono text-cyan-300 font-bold">{discountPercentEUR}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={discountPercentEUR}
                  onChange={(e) => setDiscountPercentEUR(parseInt(e.target.value) || 0)}
                  className="w-full accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50% كحد أقصى</span>
                </div>
              </div>
            </div>

            {/* Live Pricing Comparison (Before vs After) */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-bold text-white block">
                معاينة الأسعار قبل وبعد التخفيض (للفرد):
              </span>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                {/* Egyptian Price Preview */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                  <span className="text-[11px] text-slate-400 font-tajawal block mb-1">تذكرة البالغ المصري:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 line-through">
                      {activeActivity.pricing.egyptianB2C.adultEGP} ج.م
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-base font-bold text-emerald-400">
                      {Math.round(activeActivity.pricing.egyptianB2C.adultEGP * (1 - discountPercentEGP / 100))} ج.م
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-tajawal">
                    وفر العميل: {Math.round(activeActivity.pricing.egyptianB2C.adultEGP * (discountPercentEGP / 100))} ج.م
                  </div>
                </div>

                {/* Foreigner Price Preview */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                  <span className="text-[11px] text-slate-400 font-tajawal block mb-1">تذكرة البالغ الأجنبي:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 line-through">
                      €{activeActivity.pricing.foreignerB2C.adultEUR}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-base font-bold text-cyan-300">
                      €{Math.round(activeActivity.pricing.foreignerB2C.adultEUR * (1 - discountPercentEUR / 100))}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-tajawal">
                    وفر العميل: €{Math.round(activeActivity.pricing.foreignerB2C.adultEUR * (discountPercentEUR / 100))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleApplyInstantDiscount}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                <Tag className="w-4 h-4" />
                <span>اعتماد وتطبيق التخفيض على هذا النشاط</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
