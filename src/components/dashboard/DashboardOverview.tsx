import React from 'react';
import { Activity } from '../../types/activity';
import { EquipmentItem } from '../../types/equipment';
import { LogisticsVehicle } from '../../types/logistics';
import {
  Wallet,
  CollectionRecord,
  TransferTransaction,
  FinancialSettlement
} from '../../types/finance';
import { NavigationItemKey } from '../layout/Sidebar';
import {
  Compass,
  Wallet as WalletIcon,
  ReceiptText,
  GitCompare,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRightLeft,
  CreditCard,
  Layers,
  Store,
  Wrench,
  Truck,
  PlusCircle,
  Edit3,
  Users,
  SlidersHorizontal,
  MapPin
} from 'lucide-react';

interface DashboardOverviewProps {
  activities: Activity[];
  equipments: EquipmentItem[];
  partnersCount?: number;
  logisticsVehicles: LogisticsVehicle[];
  currentUserId?: string;
  wallets: Wallet[];
  collections: CollectionRecord[];
  transfers: TransferTransaction[];
  settlements: FinancialSettlement[];
  onNavigate: (key: NavigationItemKey) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  activities,
  equipments,
  partnersCount = 0,
  logisticsVehicles,
  currentUserId,
  wallets,
  collections,
  transfers,
  settlements,
  onNavigate
}) => {
  const publishedCount = activities.filter((a) => a.status === 'published').length;
  const pendingReviewCount = activities.filter((a) => a.status === 'pending_review').length;
  const pendingTransfersCount = transfers.filter(
    (t) => t.status === 'waiting_recipient_approval'
  ).length;
  const pendingSettlementsCount = settlements.filter(
    (s) => s.status === 'pending_siyahia_review'
  ).length;

  // Equipment live metrics
  const ownedEquipmentsCount = currentUserId
    ? equipments.filter((eq) => eq.ownerId === currentUserId).length
    : equipments.length;
  const availableEquipmentsCount = equipments.filter((eq) => eq.status === 'available').length;
  const maintenanceEquipmentsCount = equipments.filter(
    (eq) => eq.status === 'maintenance'
  ).length;

  // Logistics live metrics
  const availableVehiclesCount = logisticsVehicles.filter(
    (v) => v.status === 'available'
  ).length;
  const onRouteVehiclesCount = logisticsVehicles.filter((v) => v.status === 'on_route').length;
  const activitiesWithTransferCount = activities.filter(
    (a) => a.logistics?.requiresTransfer
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <span>منصة ZanoZa · Siyahia</span>
            <span>·</span>
            <span>لوحة التحكم الرئيسية المعتمدة</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            نظام إدارة الأنشطة السياحية والبحرية والمحافظ المالية
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            تحكم كامل في إضافة وتعديل الأنشطة، إدارة المعدات والشركاء، إدارة اللوجستيات ووسائل النقل، العروض والتخفيضات، المعاملات المالية والمحافظ، وتقارير الأداء.
          </p>
        </div>

        <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden md:block">
          <Compass className="w-48 h-48 text-cyan-400" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('activity_manage')}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer rounded-2xl p-4 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>الأنشطة المنشورة</span>
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{publishedCount}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>جاهزة ومتاحة للحجز</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('finance_wallets')}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer rounded-2xl p-4 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>رصيد المحافظ المرجعي</span>
            <WalletIcon className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            €
            {wallets
              .reduce((acc, w) => acc + w.balanceEUR, 0)
              .toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            اليورو (€) كعملة مرجعية موحدة
          </div>
        </div>

        <div
          onClick={() => onNavigate('reports')}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer rounded-2xl p-4 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>المتحصلات النقدية</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {wallets.reduce((acc, w) => acc + w.cashOnHandEGP, 0).toLocaleString()} ج.م
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            بالإضافة إلى €{wallets.reduce((acc, w) => acc + w.cashOnHandEUR, 0).toLocaleString()} كاش
          </div>
        </div>

        <div
          onClick={() => onNavigate('performance_approvals')}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer rounded-2xl p-4 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>بانتظار الاعتماد والتدقيق</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {pendingReviewCount + pendingTransfersCount + pendingSettlementsCount}
          </div>
          <div className="text-[11px] text-amber-500/80 mt-1">
            أنشطة · تحويلات · تسويات
          </div>
        </div>
      </div>

      {/* Main Modules Quick Access Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200">
          الأقسام والوحدات الرئيسية بالمنصة:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Card 1: إدارة نشاط */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400">
                  <Compass className="w-5 h-5" />
                </span>
                <span className="text-[10px] text-slate-500 font-mono">5 وحدات فرعية</span>
              </div>
              <h4 className="text-base font-bold text-white">إدارة نشاط</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                إنشاء وتعديل الأنشطة السياحية، ضبط خطوط السير والمدد، إدارة العروض الموسمية، وجداول التخفيضات.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-semibold">
              <button
                onClick={() => onNavigate('activity_marketplace')}
                className="col-span-2 p-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-center transition-colors flex items-center justify-center gap-1.5 font-bold shadow-sm cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-cyan-400" />
                <span>متجر الأنشطة (سوق التجارب والمفضلة)</span>
              </button>
              <button
                onClick={() => onNavigate('activity_add')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-center transition-colors cursor-pointer"
              >
                + إضافة نشاط
              </button>
              <button
                onClick={() => onNavigate('activity_manage')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-center transition-colors cursor-pointer"
              >
                تعديل الأنشطة
              </button>
              <button
                onClick={() => onNavigate('activity_offers')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 text-center transition-colors cursor-pointer"
              >
                العروض الموسمية
              </button>
              <button
                onClick={() => onNavigate('activity_discounts')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-rose-400 border border-slate-800 text-center transition-colors cursor-pointer"
              >
                التخفيضات
              </button>
            </div>
          </div>

          {/* Card 2: المعاملات المالية */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </span>
                <span className="text-[10px] text-slate-500 font-mono">7 محافظ أطراف</span>
              </div>
              <h4 className="text-base font-bold text-white">المعاملات المالية</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                محافظ الأطراف الـ 7، التوريد بالباركود QR، سجل التحصيل اليدوي بسعر الصرف المثبت، وتسويات المدير المالي.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-semibold">
              <button
                onClick={() => onNavigate('finance_wallets')}
                className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <WalletIcon className="w-3.5 h-3.5" />
                <span>المحفظة والتوريد</span>
              </button>
              <button
                onClick={() => onNavigate('finance_cashier')}
                className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ReceiptText className="w-3.5 h-3.5" />
                <span>التحصيل اليدوي</span>
              </button>
            </div>
          </div>

          {/* Card 3: إدارة الرحلات */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400">
                  <GitCompare className="w-5 h-5" />
                </span>
                <span className="text-[10px] text-slate-500 font-mono">تصفية تخصصية</span>
              </div>
              <h4 className="text-base font-bold text-white">إدارة الرحلات</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                اختيار الأنشطة والمقارنة التخصصية (يخوت، خيول، سفاري، غوص)، وبناء الرحلات المجمعة المشتركة (Combo).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-semibold">
              <button
                onClick={() => onNavigate('compare_activities')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>اختيار نشاط</span>
              </button>
              <button
                onClick={() => onNavigate('trips_combo')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>الرحلات المجمعة</span>
              </button>
              <button
                onClick={() => onNavigate('trips_schedule')}
                className="col-span-2 p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>جدول مواعيد الانطلاق (بند 9)</span>
              </button>
            </div>
          </div>

          {/* Card 4: إدارة المعدات */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    <Wrench className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-white">إدارة المعدات</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      6 وحدات تشغيلية للمعدات والشركاء
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-700/40 text-amber-300 font-mono text-[11px] font-bold">
                  {equipments.length} معدة
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                إدارة أصول ومعدات التشغيل (يخوت، دراجات سفاري، معدات غوص، خيول)، خصائص المعدات الفنية، والشركاء المؤجرين.
              </p>

              {/* Live Equipment Stats Bar */}
              <div className="grid grid-cols-4 gap-2 bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-center">
                <div>
                  <div className="text-[10px] text-slate-400">معدات شركتك</div>
                  <div className="text-sm font-bold font-mono text-cyan-300">
                    {ownedEquipmentsCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">متاحة الآن</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    {availableEquipmentsCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">تحت الصيانة</div>
                  <div className="text-sm font-bold font-mono text-amber-400">
                    {maintenanceEquipmentsCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">الشركاء</div>
                  <div className="text-sm font-bold font-mono text-white">{partnersCount}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs font-semibold">
              <button
                onClick={() => onNavigate('activity_equipment_add')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ إضافة معدة</span>
              </button>
              <button
                onClick={() => onNavigate('activity_equipment_manage')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل المعدات</span>
              </button>
              <button
                onClick={() => onNavigate('activity_equipment')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>سجل المعدات</span>
              </button>
              <button
                onClick={() => onNavigate('activity_meta_library')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>خصائص المعدات</span>
              </button>
              <button
                onClick={() => onNavigate('activity_equipment_types')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>أنواع المعدات</span>
              </button>
              <button
                onClick={() => onNavigate('activity_equipment_partners')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>سجل الشركاء</span>
              </button>
            </div>
          </div>

          {/* Card 5: إدارة اللوجستيات */}
          <div className="md:col-span-2 lg:col-span-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    <Truck className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-white">إدارة اللوجستيات</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      أسطول النقل السياحي وتحركات الأنشطة
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700/40 text-emerald-300 font-mono text-[11px] font-bold">
                  {logisticsVehicles.length} وسيلة نقل
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                التحكم الكامل في وسائل النقل (أتوبيسات، فان سياحي، ليموزين، دفع رباعي، قوارب توصيل) ومتابعة طلبات النقل ونقاط الالتقاط بالأنشطة.
              </p>

              {/* Live Logistics Stats Bar */}
              <div className="grid grid-cols-4 gap-2 bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-center">
                <div>
                  <div className="text-[10px] text-slate-400">إجمالي الأسطول</div>
                  <div className="text-sm font-bold font-mono text-white">
                    {logisticsVehicles.length}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">متاحة الآن</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    {availableVehiclesCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">في مهمة نقل</div>
                  <div className="text-sm font-bold font-mono text-cyan-300">
                    {onRouteVehiclesCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">أنشطة تتطلب نقل</div>
                  <div className="text-sm font-bold font-mono text-amber-400">
                    {activitiesWithTransferCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-semibold">
              <button
                onClick={() => onNavigate('logistics_add')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ إضافة وسيلة نقل</span>
              </button>
              <button
                onClick={() => onNavigate('logistics_manage')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>سجل وإدارة وسائل النقل</span>
              </button>
              <button
                onClick={() => onNavigate('logistics_transfers')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>تحركات ونقل الأنشطة</span>
              </button>
              <button
                onClick={() => onNavigate('trips_schedule')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>جدول مواعيد الانطلاق</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Recent Transactions & Collections Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">
              آخر التحصيلات والتحويلات المالية المسجلة
            </h4>
          </div>
          <button
            onClick={() => onNavigate('finance_cashier')}
            className="text-xs text-cyan-400 hover:underline cursor-pointer"
          >
            عرض سجل التحصيل الكامل ←
          </button>
        </div>

        <div className="space-y-2">
          {collections.slice(0, 3).map((col) => (
            <div
              key={col.id}
              className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <span className="font-bold text-white block">{col.activityTitle}</span>
                <span className="text-[11px] text-slate-400">
                  المحصل: {col.collectorName} ({col.collectorOrg}) · {col.collectedAt}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-slate-300 font-bold">
                  {col.receivedAmount.toLocaleString()} {col.receivedCurrency}
                </span>
                <span className="text-cyan-400 font-bold">
                  (€{col.accountingValueEUR.toFixed(2)})
                </span>
                <span className="text-emerald-400 text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/50">
                  {col.status === 'confirmed' ? 'مؤكد' : 'قيد المراجعة'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
