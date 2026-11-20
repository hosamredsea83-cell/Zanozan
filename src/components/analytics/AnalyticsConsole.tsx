import React from 'react';
import { Activity } from '../../types/activity';
import { BarChart3, TrendingUp, Users, Calendar, Eye, HelpCircle, CheckCircle, ShieldAlert } from 'lucide-react';

interface AnalyticsConsoleProps {
  activities: Activity[];
  onApprovePlatformReview: (activityId: string) => void;
}

export const AnalyticsConsole: React.FC<AnalyticsConsoleProps> = ({
  activities,
  onApprovePlatformReview
}) => {
  const totalViews = activities.reduce((acc, a) => acc + a.stats.viewsCount, 0);
  const totalInquiries = activities.reduce((acc, a) => acc + a.stats.inquiriesCount, 0);
  const totalBookings = activities.reduce((acc, a) => acc + a.stats.bookingsCount, 0);
  const totalRevEUR = activities.reduce((acc, a) => acc + a.stats.revenueEUR, 0);
  const totalRevEGP = activities.reduce((acc, a) => acc + a.stats.revenueEGP, 0);

  const pendingActivities = activities.filter((a) => a.status === 'pending_review');

  return (
    <div className="space-y-6">
      {/* Overview Performance Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            115. إجمالي المشاهدات
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">تفاعل الزوار والشركات مع بطاقات العرض</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            116. الاستفسارات والطلبات
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {totalInquiries.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">طلبات الأسعار المخصصة والاستفسار</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            117. الحجوزات المؤكدة
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {totalBookings.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">نسبة التحويل {((totalBookings / (totalInquiries || 1)) * 100).toFixed(1)}%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            119. إجمالي الإيرادات
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            €{totalRevEUR.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            ≈ {totalRevEGP.toLocaleString()} ج.م
          </div>
        </div>
      </div>

      {/* Platform Review & Compliance Checklist (Section 14 items 113, 114) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              113 & 114. وحدة اعتماد الأنشطة ومراجعة الصور والبيانات قبل النشر
            </h3>
            <p className="text-xs text-slate-400">
              مراجعة جودة الصور وعدم انتهاك المعايير، والتحقق من التسعير المستقل قبل منح إذن النشر في السوق السياحي.
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400 font-bold">
            {pendingActivities.length} بانتظار المراجعة
          </span>
        </div>

        {pendingActivities.length === 0 ? (
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
            ✓ جميع الأنشطة المقدمة تم فحصها واعتمادها بالكامل.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingActivities.map((act) => (
              <div
                key={act.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">{act.name}</div>
                  <div className="text-slate-400">
                    المالك: {act.owner.companyName} ({act.owner.name}) · المدينة: {act.location.city}
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    السعر: {act.pricing.egyptianB2C.adultEGP} ج.م (مصري) / €{act.pricing.foreignerB2C.adultEUR} (أجنبي)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApprovePlatformReview(act.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
                  >
                    ✓ تدقيق واعتماد النشر في السوق
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Performance League Table (Section 15 item 122) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
          122. لوحة مقارنة أداء الأنشطة والإيرادات
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">اسم النشاط</th>
                <th className="py-3 px-4 font-semibold text-center">المشاهدات</th>
                <th className="py-3 px-4 font-semibold text-center">الاستفسارات</th>
                <th className="py-3 px-4 font-semibold text-center">الحجوزات</th>
                <th className="py-3 px-4 font-semibold text-center">معدل الإلغاء</th>
                <th className="py-3 px-4 font-semibold text-left">الإيراد باليورو (€)</th>
                <th className="py-3 px-4 font-semibold text-left">الإيراد بالجنيه (EGP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {activities.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-tajawal font-semibold text-white">
                    {a.name}
                  </td>
                  <td className="py-3 px-4 text-center">{a.stats.viewsCount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">{a.stats.inquiriesCount}</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">{a.stats.bookingsCount}</td>
                  <td className="py-3 px-4 text-center text-amber-400">{a.stats.cancellationRatePercent}%</td>
                  <td className="py-3 px-4 text-left font-bold text-cyan-300">€{a.stats.revenueEUR.toLocaleString()}</td>
                  <td className="py-3 px-4 text-left font-bold text-white">{a.stats.revenueEGP.toLocaleString()} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
