import React, { useState } from 'react';
import { Activity } from '../../types/activity';
import { GitCompare, Check, X, Filter, Compass, Anchor, Sparkles } from 'lucide-react';

interface ComparisonMatrixProps {
  activities: Activity[];
  selectedCompareIds: string[];
  onToggleCompare: (activity: Activity) => void;
  onClearCompare: () => void;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  activities,
  selectedCompareIds,
  onToggleCompare,
  onClearCompare
}) => {
  const [highlightDifferencesOnly, setHighlightDifferencesOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter activities shown in the picker based on category
  const categoryActivities = activities.filter((a) =>
    selectedCategory === 'all' ? true : a.primaryCategory === selectedCategory
  );

  const comparedActivities = activities.filter((a) => selectedCompareIds.includes(a.id));

  return (
    <div className="space-y-6">
      {/* Header and selector bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-cyan-400" />
              اختيار نشاط وبداخله مقارنة الأنشطة (ياخت · خيول · سفاري)
            </h3>
            <p className="text-xs text-slate-400">
              اختر نوع النشاط، ثم حدد الأنشطة أو اليخوت للمقارنة المباشرة في الأسعار والمواصفات الفنية المعتمدة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHighlightDifferencesOnly(!highlightDifferencesOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                highlightDifferencesOnly
                  ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {highlightDifferencesOnly ? '✓ إظهار الفروقات فقط' : 'إظهار جميع الخصائص'}
            </button>

            {comparedActivities.length > 0 && (
              <button
                onClick={onClearCompare}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs transition-colors"
              >
                مسح التحديد ({comparedActivities.length})
              </button>
            )}
          </div>
        </div>

        {/* Step 1: Filter by Activity Type (كما طلب المستخدم: ياخت أو خيول أو سفاري) */}
        <div className="space-y-2">
          <span className="text-xs text-slate-300 font-bold block">
            1. اختر نوع النشاط لتصفية الخيارات:
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              جميع الأنشطة ({activities.length})
            </button>

            <button
              onClick={() => setSelectedCategory('yacht')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                selectedCategory === 'yacht'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>⛵</span>
              <span>اليخوت والرحلات الخاصة</span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded font-mono">
                {activities.filter((a) => a.primaryCategory === 'yacht').length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('horse_riding')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                selectedCategory === 'horse_riding'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>🐎</span>
              <span>الخيول والفروسية</span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded font-mono">
                {activities.filter((a) => a.primaryCategory === 'horse_riding').length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('safari')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                selectedCategory === 'safari'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>🏜️</span>
              <span>السفاري والبيتش باجي</span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded font-mono">
                {activities.filter((a) => a.primaryCategory === 'safari').length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('diving')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                selectedCategory === 'diving'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>🤿</span>
              <span>الغوص والشعاب</span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded font-mono">
                {activities.filter((a) => a.primaryCategory === 'diving').length}
              </span>
            </button>
          </div>
        </div>

        {/* Step 2: Activity Selection Badges */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-semibold block">
            2. حدد الأنشطة المراد مقارنتها جنباً إلى جنب:
          </span>
          <div className="flex flex-wrap gap-2">
            {categoryActivities.map((act) => {
              const isSelected = selectedCompareIds.includes(act.id);
              return (
                <button
                  key={act.id}
                  onClick={() => onToggleCompare(act)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{isSelected ? '✓ بالمقارنة' : '+ إضافة للمقارنة'}</span>
                  <span>{act.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {comparedActivities.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <GitCompare className="w-12 h-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-slate-300">لم يتم اختيار أي نشاط للمقارنة</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            اختر نوع النشاط (يخوت، خيول، سفاري، غوص) ثم انقر على النشاط لإضافته لجدول المقارنة.
          </p>
        </div>
      ) : (
        /* Full Comparison Table */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4 font-bold text-white w-56">معيار المقارنة</th>
                  {comparedActivities.map((act) => (
                    <th key={act.id} className="py-4 px-4 font-bold text-white min-w-64">
                      <div className="text-sm text-cyan-300 line-clamp-1">{act.name}</div>
                      <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                        {act.categoryPath.slice(-1)[0]} · {act.location.city}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono">
                {/* Image Preview Row */}
                <tr className="hover:bg-slate-800/20">
                  <td className="py-3 px-4 font-tajawal font-bold text-slate-300">
                    صورة النشاط
                  </td>
                  {comparedActivities.map((act) => (
                    <td key={act.id} className="py-3 px-4">
                      {act.media[0] && (
                        <div className="w-36 h-20 rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                          <img
                            src={act.media[0].url}
                            alt={act.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Price Adult Egyptian (EGP) */}
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-tajawal font-bold text-slate-200">
                    سعر البالغ مصري (EGP)
                  </td>
                  {comparedActivities.map((act) => (
                    <td key={act.id} className="py-3 px-4 font-bold text-white">
                      {act.pricing.egyptianB2C.adultEGP.toLocaleString()} ج.م
                    </td>
                  ))}
                </tr>

                {/* Price Adult Foreigner (EUR) */}
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-tajawal font-bold text-cyan-400">
                    سعر البالغ أجنبي (EUR €)
                  </td>
                  {comparedActivities.map((act) => (
                    <td key={act.id} className="py-3 px-4 font-bold text-cyan-300">
                      €{act.pricing.foreignerB2C.adultEUR}
                    </td>
                  ))}
                </tr>

                {/* Private Charter Option */}
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-tajawal font-semibold text-amber-300">
                    الرحلة الخاصة VIP
                  </td>
                  {comparedActivities.map((act) => (
                    <td key={act.id} className="py-3 px-4 font-tajawal text-slate-300">
                      {act.pricing.egyptianB2C.privateTotalEGP ? (
                        <span>
                          {act.pricing.egyptianB2C.privateTotalEGP.toLocaleString()} ج.م / €{act.pricing.foreignerB2C.privateTotalEUR}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">
                          {act.pricing.egyptianB2C.privatePerPersonEGP} ج.م / فرد
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Capacity Min & Max Pax */}
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-tajawal font-semibold text-slate-200">
                    سعة الركاب (أدنى - أقصى)
                  </td>
                  {comparedActivities.map((act) => (
                    <td key={act.id} className="py-3 px-4">
                      {act.minPax} إلى {act.maxPax} فرد
                    </td>
                  ))}
                </tr>

                {/* Duration */}
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-tajawal font-semibold text-slate-200">
                    مدة النشاط
                  </td>
                  {comparedActivities.map((act) => (
                    <td key={act.id} className="py-3 px-4">
                      {act.duration.hours} ساعة {act.duration.minutes > 0 ? `${act.duration.minutes} دقيقة` : ''}
                    </td>
                  ))}
                </tr>

                {/* Category-Specific Meta Fields */}
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-tajawal font-semibold text-cyan-300">
                    المواصفات الفنية التخصصية
                  </td>
                  {comparedActivities.map((act) => {
                    const fields = act.metaGroups.flatMap((g) => g.fields);
                    return (
                      <td key={act.id} className="py-3 px-4 font-tajawal text-xs space-y-1">
                        {fields.length > 0 ? (
                          fields.map((f) => (
                            <div key={f.id} className="text-[11px] text-slate-300">
                              <span className="text-slate-400">{f.label}:</span>{' '}
                              <span className="font-bold text-white font-mono">
                                {typeof f.value === 'boolean'
                                  ? f.value ? 'نعم ✓' : 'لا ✕'
                                  : String(f.value)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-500">لا توجد مواصفات إضافية</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Cancellation Policy */}
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-tajawal font-semibold text-slate-200">
                    سياسة الإلغاء
                  </td>
                  {comparedActivities.map((act) => (
                    <td key={act.id} className="py-3 px-4 font-tajawal text-xs">
                      {act.cancellationPolicy.name}
                    </td>
                  ))}
                </tr>

                {/* Included Meals & Drinks */}
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-tajawal font-semibold text-slate-200">
                    الوجبات والمشروبات المشمولة
                  </td>
                  {comparedActivities.map((act) => (
                    <td key={act.id} className="py-3 px-4 font-tajawal text-[11px] text-slate-400">
                      {act.inclusions.meals.concat(act.inclusions.drinks).join(' · ') || 'لا توجد وجبات'}
                    </td>
                  ))}
                </tr>

                {/* Owner Company */}
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-tajawal font-semibold text-slate-200">
                    الشركة المسؤولة والمالك
                  </td>
                  {comparedActivities.map((act) => (
                    <td key={act.id} className="py-3 px-4 font-tajawal text-slate-300">
                      {act.owner.companyName}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
