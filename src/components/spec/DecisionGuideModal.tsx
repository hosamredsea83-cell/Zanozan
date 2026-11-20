import React, { useState } from 'react';
import { BookOpen, CheckCircle, Search, Layers, DollarSign, Calendar, Wallet, Receipt, ShieldCheck } from 'lucide-react';
export type ActiveTab = 'activities' | 'editor' | 'wallets' | 'cashier' | 'compare' | 'analytics' | 'spec_guide';

interface DecisionGuideModalProps {
  onNavigateToTab: (tab: ActiveTab) => void;
}

export const DecisionGuideModal: React.FC<DecisionGuideModalProps> = ({ onNavigateToTab }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const decisionTable = [
    { topic: 'التصنيفات', decision: 'متعددة المستويات ليس لها حد ثابت (L1 › L2 › L3...)', section: 'القسم الأول', tab: 'editor' as ActiveTab },
    { topic: 'أسماء الأنشطة', decision: 'الاسم بالعربية + ترجمة تلقائية فورية من منصة Siyahia لعدة لغات دون إرهاق المالك', section: 'القسم الأول', tab: 'editor' as ActiveTab },
    { topic: 'وصف النشاط', decision: 'يدخل باللغة الأساسية وتترجمه المنصة تلقائياً وتُحفظ مستقلاً', section: 'القسم الأول', tab: 'editor' as ActiveTab },
    { topic: 'مدة النشاط', decision: 'تحديد بالساعات والدقائق ودعم الأنشطة لعدة أيام', section: 'القسم الأول', tab: 'editor' as ActiveTab },
    { topic: 'الموقع وخط السير', decision: 'موقع جغرافي + خط سير بنقاط انطلاق وتوقف وعودة + فلترة بدولة ومدينة الانطلاق (الغردقة..)', section: 'القسم الأول', tab: 'editor' as ActiveTab },
    { topic: 'حالات النشاط', decision: '5 حالات معتمدة: مسودة، بانتظار المراجعة، منشور، موقوف مؤقتاً، مؤرشف', section: 'القسم الأول', tab: 'activities' as ActiveTab },
    { topic: 'مالك النشاط', decision: 'مالك واحد فقط مسؤول عن النشاط داخل المنصة', section: 'القسم الأول', tab: 'editor' as ActiveTab },
    { topic: 'الصور والوسائط', decision: 'صورة رئيسية، معرض صور، سحب وإفلات، وتعيين أي صورة كغلاف بنقرة واحدة', section: 'القسم الثاني', tab: 'editor' as ActiveTab },
    { topic: 'الفيديو ومساحة التخزين', decision: 'رفع مباشر أو رابط YouTube (روابط يوتيوب لا تستهلك مساحة التخزين من باقة المالك)', section: 'القسم الثاني', tab: 'editor' as ActiveTab },
    { topic: 'أنواع الأسعار', decision: 'بالغ، طفل، رضيع (مجاني)، رحلة خاصة VIP', section: 'القسم الثالث', tab: 'editor' as ActiveTab },
    { topic: 'تسعير الرحلات الخاصة', decision: '3 طرق: إجمالي للمجموعة، أو للفرد بحد أدنى، أو سعر حسب الطلب', section: 'القسم الثالث', tab: 'editor' as ActiveTab },
    { topic: 'العملات (المصري والأجنبي)', decision: 'خانة مستقلة للمصري (EGP) وخانة للأجنبي (EUR). لا يتم التحويل التلقائي؛ يحددهما المالك مستقلاً', section: 'القسم الثالث', tab: 'editor' as ActiveTab },
    { topic: 'المواسم والعروض', decision: 'أسعار الصيف والشتاء وتخفيضات محددة بالتواريخ بنسبة أو مبلغ', section: 'القسم الثالث', tab: 'editor' as ActiveTab },
    { topic: 'أسعار الشركات B2B', decision: 'أسعار خاصة وتفضيلية للشركات السياحية المصرية والأجنبية', section: 'القسم الثالث', tab: 'editor' as ActiveTab },
    { topic: 'الطاقة الاستيعابية', decision: 'سعة مستقلة لكل موعد تشغيل (مثال: 9 ص: 20 شخص، 2 ظ: 15 شخص). الحجز متاح طالما توجد أماكن', section: 'القسم الرابع', tab: 'editor' as ActiveTab },
    { topic: 'إلغاء الحجز والاسترداد', decision: 'سياسات جاهزة تحددها المنصة ويختار منها النشاط، وتُحفظ دون تغيير بأثر رجعي', section: 'القسم الرابع', tab: 'editor' as ActiveTab },
    { topic: 'طريقة الحجز والموافقة', decision: 'طلب حجز بموافقة المالك مع مهلة رد وتذكير وإلغاء تلقائي، ومهلة دفع تستعيد الأماكن إذا لم يُسدد', section: 'القسم الرابع', tab: 'editor' as ActiveTab },
    { topic: 'الدفع والتحصيل اليدوي', decision: 'دفع يدوي مباشر عبر 5 أطراف: موظف، مندوب، منفذ، صاحب نشاط، سائق', section: 'القسم الخامس', tab: 'cashier' as ActiveTab },
    { topic: 'المحاسبة وسعر الصرف', decision: 'اليورو (€) عملة مرجعية للمحاسبة. سعر الصرف يحدده المحصل وقت الاستلام ويُثبت نهائياً', section: 'القسم الخامس', tab: 'cashier' as ActiveTab },
    { topic: 'التسويات المالية', decision: 'لا يملك المندوب التعديل؛ صاحب النشاط يطلبها؛ لا تصبح نهائية إلا باعتماد مسؤول Siyahia المالي', section: 'القسم الخامس', tab: 'cashier' as ActiveTab },
    { topic: 'المحافظ المالية (7 أطراف)', decision: 'محفظة مستقلة للموظف، المندوب، السائق، المرافق، المنفذ، صاحب النشاط، والشركة', section: 'القسم السادس', tab: 'wallets' as ActiveTab },
    { topic: 'طرق التوريد والتحويل', decision: '3 طرق: باركود QR Code، إيصال شركة، أو فودافون كاش مع مطابقة العملية', section: 'القسم السادس', tab: 'wallets' as ActiveTab },
    { topic: 'الموافقة المتبادلة', decision: 'التحويل يحتاج موافقة الطرف المستلم في الاتجاهين (الشركة للسائق أو السائق للشركة)', section: 'القسم السادس', tab: 'wallets' as ActiveTab },
    { topic: 'رفض التحويل والإرجاع', decision: 'عند رفض المستلم يعود المبلغ تلقائياً لمحفظة المرسل مع تسجيل السبب وإخطار إدارة المنصة', section: 'القسم السادس', tab: 'wallets' as ActiveTab },
    { topic: 'الرصيد السالب والسقف', decision: 'مسموح ضمن سقف ائتماني محدد؛ تتوقف الالتزامات والطلبات الجديدة فور بلوغ الحد حتى السداد', section: 'القسم السادس', tab: 'wallets' as ActiveTab },
    { topic: 'الحد الأدنى للمحافظ', decision: 'شرط إلزامي للجميع مع تنبيه عند الاقتراب، وإيقاف فوري للطلبات دون أي مهلة سماح عند النزول عنه', section: 'القسم السادس', tab: 'wallets' as ActiveTab }
  ];

  const filteredDecisions = decisionTable.filter(
    (d) =>
      d.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.decision.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              وثيقة إدارة الأنشطة وقرارات منصة ZanoZa التجارية
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              المرجع الشامل للـ 15 محوراً والـ 122 نقطة تشغيلية والأقسام الـ 6 المعتمدة بالكامل.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="ابحث في القرارات والضوابط..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Matrix of Approved Commercial Rules */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold w-40">الموضوع / البند</th>
                <th className="py-3 px-4 font-semibold">القرار التجاري والتشغيلي المعتمد</th>
                <th className="py-3 px-4 font-semibold w-28">القسم</th>
                <th className="py-3 px-4 font-semibold text-center w-28">اختبار بالمنصة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-tajawal text-slate-300">
              {filteredDecisions.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{item.topic}</td>
                  <td className="py-3 px-4 text-slate-200 leading-relaxed">{item.decision}</td>
                  <td className="py-3 px-4 text-cyan-400 font-mono text-[11px]">{item.section}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onNavigateToTab(item.tab)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold rounded transition-colors"
                    >
                      تجربة الآن
                    </button>
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
