import React, { useState } from 'react';
import { Anchor, Menu, PlusCircle, ChevronLeft, Bell, Users, ChevronDown, Check, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { NavigationItemKey } from './Sidebar';
import { AppUser } from '../../types/auth';

interface NavbarProps {
  currentNavKey: NavigationItemKey;
  onSelectNav?: (key: NavigationItemKey) => void;
  onToggleMobileSidebar: () => void;
  onNewActivity: () => void;
  onOpenSpecGuide?: () => void;
  onOpenBookingsQueue?: () => void;
  pendingBookingsCount?: number;
  publishedCount: number;
  pendingReviewCount: number;
  currentUser?: AppUser;
  allUsers?: AppUser[];
  onSwitchUser?: (user: AppUser) => void;
  userFavoritesCounts?: Record<string, number>;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentNavKey,
  onSelectNav,
  onToggleMobileSidebar,
  onNewActivity,
  onOpenBookingsQueue,
  pendingBookingsCount = 3,
  publishedCount,
  pendingReviewCount,
  currentUser,
  allUsers = [],
  onSwitchUser,
  userFavoritesCounts = {},
  isSidebarCollapsed = false,
  onToggleSidebarCollapse
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const getBreadcrumbs = (key: NavigationItemKey) => {
    switch (key) {
      case 'dashboard':
        return ['الرئيسية', 'لوحة التحكم العامة'];
      case 'activity_add':
        return ['إدارة نشاط', 'إضافة نشاط'];
      case 'activity_collections':
        return ['إدارة نشاط', 'إضافة مجموعات (Collections)'];
      case 'activity_categories':
        return ['إدارة نشاط', 'إدارة التصنيفات'];
      case 'activity_manage':
        return ['إدارة نشاط', 'تعديل وإدارة الأنشطة'];
      case 'activity_marketplace':
        return ['إدارة نشاط', 'متجر الأنشطة (سوق التجارب)'];
      case 'activity_offers':
        return ['إدارة نشاط', 'العروض الموسمية'];
      case 'activity_discounts':
        return ['إدارة نشاط', 'التخفيضات والأسعار'];
      case 'activity_pricing_properties':
        return ['إدارة نشاط', 'خصائص السعر'];
      case 'activity_custom_specs':
        return ['إدارة نشاط', 'ادارة المواصفات الفنية مخصصة'];
      case 'pricing_tool':
        return ['الرئيسية', 'أداة التسعير'];
      case 'activity_favorites':
        return ['الرئيسية', 'المفضلة'];
      case 'activity_meta_library':
        return ['إدارة المعدات', 'خصائص المعدات'];
      case 'activity_equipment':
        return ['إدارة المعدات', 'سجل وإدارة المعدات'];
      case 'activity_equipment_add':
        return ['إدارة المعدات', 'إضافة معدة'];
      case 'activity_equipment_manage':
        return ['إدارة المعدات', 'تعديل وادارة المعدات'];
      case 'activity_equipment_types':
        return ['إدارة المعدات', 'انواع المعدات والمواصفات'];
      case 'activity_equipment_partners':
        return ['إدارة المعدات', 'سجل الشركاء'];
      case 'logistics_manage':
        return ['إدارة اللوجستيات', 'سجل وإدارة وسائل النقل'];
      case 'logistics_add':
        return ['إدارة اللوجستيات', 'إضافة وسيلة نقل'];
      case 'logistics_transfers':
        return ['إدارة اللوجستيات', 'تحركات ونقل الأنشطة'];
      case 'finance_wallets':
        return ['المعاملات المالية', 'المحفظة والتوريد QR'];
      case 'finance_cashier':
        return ['المعاملات المالية', 'التحصيل اليدوي والتسويات'];
      case 'compare_activities':
        return ['إدارة الرحلات', 'اختيار نشاط (مقارنة الأنشطة)'];
      case 'trips_combo':
        return ['إدارة الرحلات', 'الرحلات المجمعة (Combo Packages)'];
      case 'trips_schedule':
        return ['إدارة الرحلات', 'جدول مواعيد الانطلاق (بند 9)'];
      case 'bookings_activities':
        return ['إدارة الحجوزات', 'حجوزات الأنشطة'];
      case 'bookings_trips':
        return ['إدارة الحجوزات', 'حجوزات الرحلات'];
      case 'performance_approvals':
        return ['الاعتماد والجودة', 'الأداء والاعتماد'];
      case 'reports':
        return ['الإحصائيات', 'التقارير المالية والتشغيلية'];
      case 'platform_audit_logs':
        return ['الرقابة والحوكمة', 'إدارة السجلات بالمنصة'];
    }
  };

  const getParentNavKey = (key: NavigationItemKey): NavigationItemKey => {
    switch (key) {
      case 'dashboard':
      case 'activity_favorites':
      case 'pricing_tool':
        return 'dashboard';
      case 'activity_add':
      case 'activity_collections':
      case 'activity_categories':
      case 'activity_manage':
      case 'activity_marketplace':
      case 'activity_offers':
      case 'activity_discounts':
      case 'activity_pricing_properties':
      case 'activity_custom_specs':
        return 'activity_manage';
      case 'activity_meta_library':
      case 'activity_equipment':
      case 'activity_equipment_add':
      case 'activity_equipment_manage':
      case 'activity_equipment_types':
      case 'activity_equipment_partners':
        return 'activity_equipment_manage';
      case 'logistics_manage':
      case 'logistics_add':
      case 'logistics_transfers':
        return 'logistics_manage';
      case 'finance_wallets':
      case 'finance_cashier':
        return 'finance_wallets';
      case 'compare_activities':
      case 'trips_combo':
      case 'trips_schedule':
        return 'compare_activities';
      case 'bookings_activities':
      case 'bookings_trips':
        return 'bookings_activities';
      case 'performance_approvals':
        return 'performance_approvals';
      case 'reports':
        return 'reports';
      case 'platform_audit_logs':
        return 'platform_audit_logs';
    }
  };

  const crumbs = getBreadcrumbs(currentNavKey);
  const parentNavKey = getParentNavKey(currentNavKey);

  const handleBreadcrumbNavigate = (targetKey: NavigationItemKey) => {
    onSelectNav?.(targetKey);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-0 text-slate-100">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Right side: Hamburger button (mobile) + Breadcrumbs trail */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileSidebar}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white lg:hidden"
              aria-label="فتح القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span
                role="button"
                tabIndex={0}
                onClick={() => handleBreadcrumbNavigate(parentNavKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBreadcrumbNavigate(parentNavKey);
                  }
                }}
                title={`الانتقال إلى صفحة ${crumbs[0]}`}
                className="font-semibold text-white hover:text-cyan-300 cursor-pointer transition-colors"
              >
                {crumbs[0]}
              </span>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
              <span
                role="button"
                tabIndex={0}
                onClick={() => handleBreadcrumbNavigate(currentNavKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBreadcrumbNavigate(currentNavKey);
                  }
                }}
                title={`الانتقال إلى صفحة ${crumbs[1]}`}
                className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer transition-colors"
              >
                {crumbs[1]}
              </span>
            </div>
          </div>

          {/* Left side actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenBookingsQueue && (
              <button
                onClick={onOpenBookingsQueue}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors"
                title="طلبات الحجز الواردة"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">طلبات الحجز</span>
                {pendingBookingsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                    {pendingBookingsCount}
                  </span>
                )}
              </button>
            )}

            {/* Interactive User Switcher (محول المستخدمين الثلاثة المتساوين في الصلاحيات) */}
            {currentUser && onSwitchUser && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-xs text-slate-200 transition-colors"
                  title="تبديل المستخدم الحالي لاختبار العزل وصلاحيات التعديل"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold">
                    {currentUser.avatarInitials}
                  </span>
                  <div className="flex flex-col text-right leading-none hidden md:flex">
                    <span className="font-bold text-slate-100 text-[11px]">{currentUser.name}</span>
                    <span className="text-[9px] text-cyan-400/80">{currentUser.companyName.split(' ')[0]}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserMenuOpen(false)} 
                    />
                    <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-right">
                      <div className="px-2.5 py-1.5 border-b border-slate-800/80 mb-1.5">
                        <div className="text-[11px] font-bold text-slate-200">تبديل حساب المستخدم (3 شركاء)</div>
                        <div className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                          لكل مستخدم مفضلة وملفات خاصة بحسابه، ولا تظهر أنشطة الآخرين في التعديل ولكن تظهر للجميع في «متجر الأنشطة».
                        </div>
                      </div>

                      <div className="space-y-1">
                        {allUsers.map((u) => {
                          const isActive = u.id === currentUser.id;
                          const userFavCount = userFavoritesCounts[u.id] ?? 0;
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                onSwitchUser(u);
                                setIsUserMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-right transition-colors ${
                                isActive 
                                  ? 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-300' 
                                  : 'hover:bg-slate-800/80 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                                }`}>
                                  {u.avatarInitials}
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-xs truncate text-slate-100">{u.name}</span>
                                  <span className="text-[10px] text-slate-400 truncate">{u.companyName}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 mr-2">
                                {userFavCount > 0 && (
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-700/40 text-rose-300">
                                    ❤️ {userFavCount}
                                  </span>
                                )}
                                {isActive && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/60 px-2 text-[10px] text-slate-400">
                        الحساب الحالي: <strong className="text-cyan-400">{currentUser.name}</strong>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={onNewActivity}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ نشاط جديد</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
