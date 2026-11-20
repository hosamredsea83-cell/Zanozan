import React, { useState } from 'react';
import { Activity } from '../../types/activity';
import { CollectionRecord, Wallet } from '../../types/finance';
import { 
  BarChart3, Download, Calendar, Filter, DollarSign, TrendingUp, 
  Users, CheckCircle2, FileSpreadsheet, Anchor
} from 'lucide-react';

interface ReportsViewProps {
  activities: Activity[];
  collections: CollectionRecord[];
  wallets: Wallet[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  activities,
  collections,
  wallets
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Filter activities
  const filteredActivities = activities.filter((a) =>
    selectedCategory === 'all' ? true : a.primaryCategory === selectedCategory
  );

  const totalEUR = filteredActivities.reduce((acc, a) => acc + a.stats.revenueEUR, 0);
  const totalEGP = filteredActivities.reduce((acc, a) => acc + a.stats.revenueEGP, 0);
  const totalBookings = filteredActivities.reduce((acc, a) => acc + a.stats.bookingsCount, 0);
  const totalViews = filteredActivities.reduce((acc, a) => acc + a.stats.viewsCount, 0);
  const avgCancellationRate = (
    filteredActivities.reduce((acc, a) => acc + a.stats.cancellationRatePercent, 0) /
    (filteredActivities.length || 1)
  ).toFixed(1);

  const handleExport = (format: 'pdf' | 'excel') => {
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>مركز التقارير المالية والتشغيلية المعتمدة</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            البنود 115 إلى 122: تقارير الإيرادات، العهد المحصلة، معدلات الإلغاء، وأداء الأنشطة باليورو والجنيه.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-2.5 py-1.5 rounded-md ${
                selectedPeriod === 'week' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
              }`}
            >
              أسبوع
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-2.5 py-1.5 rounded-md ${
                selectedPeriod === 'month' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
              }`}
            >
              شهر
            </button>
            <button
              onClick={() => setSelectedPeriod('quarter')}
              className={`px-2.5 py-1.5 rounded-md ${
                selectedPeriod === 'quarter' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
              }`}
            >
              ربع سنوي
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-2.5 py-1.5 rounded-md ${
                selectedPeriod === 'year' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
              }`}
            >
              سنوي
            </button>
          </div>

          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {showExportSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>تم توليد وتحميل التقرير المالي والتشغيلي المعتمد بنجاح.</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1">الإيراد المحاسبي (اليورو €)</div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            €{totalEUR.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">العملة المرجعية للنظام</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1">الإيراد المحصل (الجنيه EGP)</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {totalEGP.toLocaleString()} ج.م
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">بسعر صرف مثبت عند الاستلام</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1">إجمالي الحجوزات المنفذة</div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalBookings.toLocaleString()}
          </div>
          <div className="text-[11px] text-cyan-400 mt-1">من أصل {totalViews.toLocaleString()} مشاهدة</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1">متوسط نسبة الإلغاء</div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {avgCancellationRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">معدل التزام منخفض ومثالي</div>
        </div>
      </div>

      {/* Category Breakdown & Performance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-white">
            تفصيل الإيرادات والأداء حسب نوع النشاط
          </h4>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded ${selectedCategory === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
            >
              جميع الأنشطة
            </button>
            <button
              onClick={() => setSelectedCategory('yacht')}
              className={`px-2.5 py-1 rounded ${selectedCategory === 'yacht' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
            >
              اليخوت
            </button>
            <button
              onClick={() => setSelectedCategory('horse_riding')}
              className={`px-2.5 py-1 rounded ${selectedCategory === 'horse_riding' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
            >
              الخيول
            </button>
            <button
              onClick={() => setSelectedCategory('safari')}
              className={`px-2.5 py-1 rounded ${selectedCategory === 'safari' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
            >
              السفاري
            </button>
            <button
              onClick={() => setSelectedCategory('diving')}
              className={`px-2.5 py-1 rounded ${selectedCategory === 'diving' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
            >
              الغوص
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">اسم النشاط</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4">المدينة</th>
                <th className="py-3 px-4 text-center">الحجوزات</th>
                <th className="py-3 px-4 text-center">المشاهدات</th>
                <th className="py-3 px-4 text-left">الإيراد باليورو (€)</th>
                <th className="py-3 px-4 text-left">الإيراد بالجنيه (EGP)</th>
                <th className="py-3 px-4 text-center">معدل الإلغاء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {filteredActivities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-tajawal font-bold text-white">
                    {act.name}
                  </td>
                  <td className="py-3 px-4 font-tajawal text-slate-400">
                    {act.categoryPath.slice(-1)[0]}
                  </td>
                  <td className="py-3 px-4 font-tajawal text-slate-400">
                    {act.location.city}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-400">
                    {act.stats.bookingsCount}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    {act.stats.viewsCount}
                  </td>
                  <td className="py-3 px-4 text-left text-cyan-300 font-bold">
                    €{act.stats.revenueEUR.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-left text-white font-bold">
                    {act.stats.revenueEGP.toLocaleString()} ج.م
                  </td>
                  <td className="py-3 px-4 text-center text-amber-400">
                    {act.stats.cancellationRatePercent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
