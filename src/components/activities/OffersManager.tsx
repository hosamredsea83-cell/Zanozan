import React, { useState } from 'react';
import { Activity, SeasonalDiscount } from '../../types/activity';
import { Gift, Calendar, Plus, Check, Trash2, Sparkles, Tag, Users, ArrowUpRight } from 'lucide-react';

interface OffersManagerProps {
  activities: Activity[];
  onApplyOfferToActivity: (activityId: string, offer: SeasonalDiscount) => void;
  onRemoveOffer: (activityId: string, offerId: string) => void;
}

interface OfferItem {
  id: string;
  activityId: string;
  activityName: string;
  title: string;
  seasonType: 'summer' | 'winter' | 'holiday' | 'flash_sale';
  startDate: string;
  endDate: string;
  discountType: 'percentage' | 'fixed_amount';
  valueEGP: number;
  valueEUR: number;
  appliesToEgyptian: boolean;
  appliesToForeigner: boolean;
  isActive: boolean;
}

export const OffersManager: React.FC<OffersManagerProps> = ({
  activities,
  onApplyOfferToActivity,
  onRemoveOffer
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Derive all active offers across activities
  const allOffers: OfferItem[] = activities.flatMap((act) =>
    act.seasonalDiscounts.map((d) => ({
      ...d,
      activityId: act.id,
      activityName: act.name,
      isActive: true
    }))
  );

  // New Offer form state
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id || '');
  const [offerTitle, setOfferTitle] = useState('عرض بداية الموسم السياحي');
  const [seasonType, setSeasonType] = useState<SeasonalDiscount['seasonType']>('winter');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [valueEGP, setValueEGP] = useState<number>(15);
  const [valueEUR, setValueEUR] = useState<number>(10);
  const [startDate, setStartDate] = useState('2026-11-10');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [appliesToEgyptian, setAppliesToEgyptian] = useState(true);
  const [appliesToForeigner, setAppliesToForeigner] = useState(true);

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const newOffer: SeasonalDiscount = {
      id: `offer-${Date.now()}`,
      title: offerTitle,
      seasonType,
      startDate,
      endDate,
      discountType,
      valueEGP,
      valueEUR,
      appliesToEgyptian,
      appliesToForeigner
    };

    onApplyOfferToActivity(selectedActivityId, newOffer);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview and Add button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <span>إدارة العروض الموسمية والباقات الخاصة</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            البند 14 و 20 من وثيقة ZanoZa: إنشاء وإدارة العروض الصيفية والشتوية وعروض الأعياد لفترات محددة.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة عرض موسمي جديد</span>
        </button>
      </div>

      {/* Offers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allOffers.map((offer) => (
          <div
            key={offer.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  {offer.seasonType === 'summer' && 'موسم الصيف'}
                  {offer.seasonType === 'winter' && 'موسم الشتاء'}
                  {offer.seasonType === 'holiday' && 'الأعياد والمناسبات'}
                  {offer.seasonType === 'flash_sale' && 'عرض حصري محدود'}
                </span>
                <span className="text-xs font-bold text-emerald-400">نشط ومفعّل</span>
              </div>

              <h4 className="text-sm font-bold text-white leading-snug">{offer.title}</h4>

              <div className="text-xs text-cyan-300 line-clamp-1 font-tajawal">
                النشاط: {offer.activityName}
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>قيمة الخصم للمصريين:</span>
                  <span className="text-amber-400 font-bold">
                    {offer.discountType === 'percentage' ? `${offer.valueEGP}%` : `${offer.valueEGP} ج.م`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>قيمة الخصم للأجانب:</span>
                  <span className="text-cyan-300 font-bold">
                    {offer.discountType === 'percentage' ? `${offer.valueEUR}%` : `€${offer.valueEUR}`}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>ساري من {offer.startDate} حتى {offer.endDate}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {offer.appliesToEgyptian && offer.appliesToForeigner
                  ? 'مطبق للمصري والأجنبي'
                  : offer.appliesToEgyptian
                  ? 'للمصريين فقط'
                  : 'للأجانب فقط'}
              </span>
              <button
                onClick={() => onRemoveOffer(offer.activityId, offer.id)}
                className="text-slate-500 hover:text-red-400 p-1 text-xs"
                title="إلغاء هذا العرض"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add New Offer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleCreateOffer}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white">إضافة عرض موسمي جديد</h3>
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
                <label className="text-slate-400 block mb-1">اختر النشاط المستهدف بالعرض:</label>
                <select
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                >
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.location.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">عنوان العرض الترويجي:</label>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">نوع الموسم:</label>
                  <select
                    value={seasonType}
                    onChange={(e) => setSeasonType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  >
                    <option value="winter">موسم الشتاء</option>
                    <option value="summer">موسم الصيف</option>
                    <option value="holiday">أعياد ومناسبات</option>
                    <option value="flash_sale">عرض حصري سريع</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">نوع التخفيض:</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed_amount">مبلغ ثابت (مستقل)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">خصم المصريين (ج.م أو %):</label>
                  <input
                    type="number"
                    min={1}
                    value={valueEGP}
                    onChange={(e) => setValueEGP(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 font-mono text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">خصم الأجانب (€ أو %):</label>
                  <input
                    type="number"
                    min={1}
                    value={valueEUR}
                    onChange={(e) => setValueEUR(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 font-mono text-cyan-300 text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">تاريخ بداية العرض:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">تاريخ نهاية العرض:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 font-mono text-slate-200"
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
                تطبيق العرض على النشاط
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
