import React, { useState } from 'react';
import { 
  LayoutDashboard, Compass, PlusCircle, Edit3, Gift, Tag, 
  CreditCard, Wallet, ReceiptText, GitCompare, ShieldCheck, 
  BarChart3, ChevronDown, ChevronLeft, ChevronRight, Anchor, MapPin, Layers, Map, Clock, Store, PanelRightClose, PanelRightOpen, Wrench, SlidersHorizontal,
  CalendarCheck, Ship, ClipboardList, Heart, FolderTree, Calculator, ListChecks, Users, Truck, ShieldAlert, Sparkles, Palette, Coins, Utensils, Globe, Navigation, CalendarRange, UserCog
} from 'lucide-react';
import { AppUser, canUserAccessNavKey } from '../../types/auth';

export type NavigationItemKey = 
  | 'dashboard'
  | 'customer_storefront'
  | 'unified_reference'
  | 'activity_add'
  | 'activity_collections'
  | 'activity_manage'
  | 'activity_marketplace'
  | 'activity_offers'
  | 'activity_discounts'
  | 'activity_pricing_properties'
  | 'pricing_tool'
  | 'activity_favorites'
  | 'activity_equipment'
  | 'activity_equipment_add'
  | 'activity_equipment_manage'
  | 'activity_equipment_partners'
  | 'equipment_occupancy'
  | 'person_profiles'
  | 'logistics_manage'
  | 'logistics_add'
  | 'logistics_transfers'
  | 'driver_portal'
  | 'finance_wallets'
  | 'finance_cashier'
  | 'operational_costs'
  | 'partner_earnings'
  | 'trip_add'
  | 'compare_activities'
  | 'trips_combo'
  | 'trips_schedule'
  | 'bookings_activities'
  | 'bookings_trips'
  | 'bookings_in_trip_requests'
  | 'performance_approvals'
  | 'reports'
  | 'platform_audit_logs'
  | 'user_management'
  | 'owner_theme_studio';

interface SidebarProps {
  currentKey: NavigationItemKey;
  onSelectKey: (key: NavigationItemKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  publishedCount: number;
  pendingReviewCount: number;
  tripsCount?: number;
  equipmentCount?: number;
  partnersCount?: number;
  logisticsCount?: number;
  pendingBookingsCount?: number;
  inTripRequestsCount?: number;
  favoritesCount?: number;
  auditLogsCount?: number;
  operationalCostsCount?: number;
  personProfilesCount?: number;
  pendingClaimRequestsCount?: number;
  managedUsersCount?: number;
  currentUser?: AppUser;
  customAllowedNavKeys?: Set<string> | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentKey,
  onSelectKey,
  isOpenMobile,
  onCloseMobile,
  publishedCount,
  pendingReviewCount,
  tripsCount = 0,
  equipmentCount = 0,
  partnersCount = 0,
  logisticsCount = 0,
  pendingBookingsCount = 0,
  inTripRequestsCount = 0,
  favoritesCount = 0,
  auditLogsCount = 0,
  operationalCostsCount = 0,
  personProfilesCount = 0,
  pendingClaimRequestsCount = 0,
  managedUsersCount = 0,
  currentUser,
  customAllowedNavKeys = null,
  isCollapsed = false,
  onToggleCollapse
}) => {
  // Collapsible menu groups
  const [activitiesOpen, setActivitiesOpen] = useState(true);
  const [equipmentOpen, setEquipmentOpen] = useState(true);
  const [logisticsOpen, setLogisticsOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);
  const [tripsOpen, setTripsOpen] = useState(true);
  const [bookingsOpen, setBookingsOpen] = useState(true);

  const handleItemClick = (key: NavigationItemKey) => {
    onSelectKey(key);
    onCloseMobile();
  };

  const navVisible = (key: NavigationItemKey) =>
    canUserAccessNavKey(currentUser, key, customAllowedNavKeys);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container: بدون حدود فاصلة ظاهرة */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 bg-slate-950 border-0 flex flex-col justify-between transition-all duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Brand Header: بدون حد سفلي */}
        <div className={`p-4 border-0 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border-0 flex items-center justify-center text-cyan-400 shrink-0">
              <Anchor className="w-5 h-5 text-cyan-400" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold text-white tracking-tight truncate">
                  ZanoZa · Siyahia
                </span>
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  منظومة إدارة الأنشطة السياحية
                </span>
              </div>
            )}
          </div>

          {/* Collapse/Expand Toggle Button (أيقونة إظهار وإخفاء عناصر الشريط الجانبي مع إبقاء الأيقونات) */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border-0 transition-colors hidden lg:flex items-center justify-center ${
                isCollapsed ? 'mt-2' : ''
              }`}
              title={isCollapsed ? 'إظهار عناصر ونصوص الشريط الجانبي' : 'إخفاء عناصر الشريط الجانبي (إبقاء الأيقونات فقط)'}
              aria-label="تبديل حجم الشريط الجانبي"
            >
              {isCollapsed ? (
                <PanelRightOpen className="w-4 h-4 text-cyan-400" />
              ) : (
                <PanelRightClose className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Menu List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1.5 text-xs font-medium">
          {/* 1. لوحة التحكم */}
          {navVisible('dashboard') && (
            <button
              onClick={() => handleItemClick('dashboard')}
              title="لوحة التحكم"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all ${
                currentKey === 'dashboard'
                  ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-cyan-400 shrink-0" />
                {!isCollapsed && <span>لوحة التحكم</span>}
              </div>
              {!isCollapsed && <span className="text-[10px] text-slate-500 font-mono">رئيسي</span>}
            </button>
          )}

          {/* المفضلة (بند رئيسي مستقل) */}
          {navVisible('activity_favorites') && (
            <button
              onClick={() => handleItemClick('activity_favorites')}
              title={currentUser ? `المفضلة الخاصة بحساب ${currentUser.name}` : 'المفضلة وتنظيم قوائم الاختيار'}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all ${
                currentKey === 'activity_favorites'
                  ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                {!isCollapsed && <span>المفضلة</span>}
              </div>
              {!isCollapsed && (
                favoritesCount > 0 ? (
                  <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-700/40 px-1.5 py-0.2 rounded font-mono font-bold">
                    {favoritesCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">رئيسي</span>
                )
              )}
            </button>
          )}

          {/* بوابة العميل والمتجر المباشر */}
          {navVisible('customer_storefront') && (
            <button
              onClick={() => handleItemClick('customer_storefront')}
              title="بوابة العميل والمتجر المباشر"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all ${
                currentKey === 'customer_storefront'
                  ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                {!isCollapsed && <span className="truncate">بوابة العميل والمتجر</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.5 rounded font-mono shrink-0">
                  جمهور
                </span>
              )}
            </button>
          )}

          {/* أداة التسعير (رسوم خدمة المنصة والضرائب المركزية) */}
          {navVisible('pricing_tool') && (
            <button
              onClick={() => handleItemClick('pricing_tool')}
              title="أداة التسعير"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all ${
                currentKey === 'pricing_tool'
                  ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
                {!isCollapsed && <span>أداة التسعير</span>}
              </div>
              {!isCollapsed && <span className="text-[10px] text-slate-500 font-mono">رسوم · ضرائب</span>}
            </button>
          )}

          {/* المرجع الموحد */}
          {navVisible('unified_reference') && (
            <button
              onClick={() => handleItemClick('unified_reference')}
              title="المرجع الموحد: الفئات · المواصفات · المشمولات · المعدات · الإضافات"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all ${
                currentKey === 'unified_reference'
                  ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderTree className="w-4 h-4 text-cyan-400 shrink-0" />
                {!isCollapsed && <span className="truncate">المرجع الموحد</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-1.5 py-0.5 rounded font-mono shrink-0">
                  مركزي
                </span>
              )}
            </button>
          )}

          {/* الملفات الشخصية والموردين */}
          {navVisible('person_profiles') && (
            <button
              onClick={() => handleItemClick('person_profiles')}
              title="الملفات الشخصية والموردين"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all ${
                currentKey === 'person_profiles' || currentKey === 'activity_equipment_partners'
                  ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                {!isCollapsed && <span className="truncate">الملفات الشخصية والموردين</span>}
              </div>
              {!isCollapsed && (
                pendingClaimRequestsCount > 0 ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                    {pendingClaimRequestsCount} طلب
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-cyan-300 px-1.5 py-0.2 rounded font-mono shrink-0">
                    {personProfilesCount || partnersCount}
                  </span>
                )
              )}
            </button>
          )}

          {/* 2. إدارة نشاط (Accordion / Stacked in collapsed mode) */}
          {(['activity_add', 'activity_collections', 'activity_manage', 'activity_marketplace', 'activity_offers', 'activity_discounts', 'activity_pricing_properties'] as NavigationItemKey[]).some(navVisible) && (
          <div className="pt-2">
            {!isCollapsed ? (
              <button
                onClick={() => setActivitiesOpen(!activitiesOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider text-[11px] font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>إدارة نشاط</span>
                </div>
                {activitiesOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-full flex justify-center py-1">
                <span className="w-6 h-[1px] bg-slate-800" />
              </div>
            )}

            {(activitiesOpen || isCollapsed) && (
              <div className={`space-y-1 ${!isCollapsed ? 'pr-3 pt-1 border-0 mr-2' : 'flex flex-col items-center'}`}>
                {/* إضافة نشاط */}
                {navVisible('activity_add') && (
                <button
                  onClick={() => handleItemClick('activity_add')}
                  title="إضافة نشاط جديد"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full gap-2 px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'activity_add'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {!isCollapsed && <span>إضافة نشاط</span>}
                </button>
                )}

                {/* إضافة مجموعات تحت بند إضافة نشاط */}
                {navVisible('activity_collections') && (
                <button
                  onClick={() => handleItemClick('activity_collections')}
                  title="إضافة مجموعات وباقات سياحية"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full gap-2 px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'activity_collections'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between w-full">
                      <span>إضافة مجموعات</span>
                      <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-1.5 py-0.2 rounded font-mono">
                        باقات
                      </span>
                    </div>
                  )}
                </button>
                )}

                {/* تعديل نشاط */}
                {navVisible('activity_manage') && (
                <button
                  onClick={() => handleItemClick('activity_manage')}
                  title="تعديل وإدارة الأنشطة"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'activity_manage'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    {!isCollapsed && <span>تعديل وإدارة الأنشطة</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono text-slate-300">
                      {publishedCount}
                    </span>
                  )}
                </button>
                )}

                {/* متجر الأنشطة */}
                {navVisible('activity_marketplace') && (
                <button
                  onClick={() => handleItemClick('activity_marketplace')}
                  title="متجر الأنشطة"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'activity_marketplace'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    {!isCollapsed && <span>متجر الأنشطة</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-1.5 py-0.2 rounded font-mono">
                      السوق
                    </span>
                  )}
                </button>
                )}

                {/* العروض */}
                {navVisible('activity_offers') && (
                <button
                  onClick={() => handleItemClick('activity_offers')}
                  title="العروض الموسمية"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full gap-2 px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'activity_offers'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {!isCollapsed && <span>العروض الموسمية</span>}
                </button>
                )}

                {/* التخفيضات */}
                {navVisible('activity_discounts') && (
                <button
                  onClick={() => handleItemClick('activity_discounts')}
                  title="التخفيضات والأسعار"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full gap-2 px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'activity_discounts'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  {!isCollapsed && <span>التخفيضات والأسعار</span>}
                </button>
                )}

                {/* خصائص السعر */}
                {navVisible('activity_pricing_properties') && (
                <button
                  onClick={() => handleItemClick('activity_pricing_properties')}
                  title="خصائص السعر"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full gap-2 px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'activity_pricing_properties'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {!isCollapsed && <span>خصائص السعر</span>}
                </button>
                )}
              </div>
            )}
          </div>
          )}

          {/* 3. إدارة المعدات (قسم مستقل يضم إدارة المعدات وخصائص المعدات وتقويم الإشغال) */}
          {(['activity_equipment_add', 'activity_equipment_manage', 'activity_equipment', 'equipment_occupancy'] as NavigationItemKey[]).some(navVisible) && (
          <div className="pt-2">
            {!isCollapsed ? (
              <button
                onClick={() => setEquipmentOpen(!equipmentOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider text-[11px] font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>إدارة المعدات</span>
                </div>
                {equipmentOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-full flex justify-center py-1">
                <span className="w-6 h-[1px] bg-slate-800" />
              </div>
            )}

            {(equipmentOpen || isCollapsed) && (
              <div className={`space-y-1 ${!isCollapsed ? 'pr-3 pt-1 border-0 mr-2' : 'flex flex-col items-center'}`}>
                {/* إضافة معدة */}
                {navVisible('activity_equipment_add') && (
                <button
                  onClick={() => handleItemClick('activity_equipment_add')}
                  title="إضافة معدة"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full gap-2 px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'activity_equipment_add'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {!isCollapsed && <span>إضافة معدة</span>}
                </button>
                )}

                {/* تعديل وادارة المعدات */}
                {navVisible('activity_equipment_manage') && (
                <button
                  onClick={() => handleItemClick('activity_equipment_manage')}
                  title="تعديل وادارة المعدات"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'activity_equipment_manage'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    {!isCollapsed && <span>تعديل وادارة المعدات</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono text-cyan-300">
                      {equipmentCount}
                    </span>
                  )}
                </button>
                )}

                {/* سجل وإدارة المعدات */}
                {navVisible('activity_equipment') && (
                <button
                  onClick={() => handleItemClick('activity_equipment')}
                  title="سجل وإدارة المعدات"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'activity_equipment'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {!isCollapsed && <span>سجل وإدارة المعدات</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono text-amber-300">
                      {equipmentCount}
                    </span>
                  )}
                </button>
                )}

                {/* تقويم الإشغال والصيانة */}
                {navVisible('equipment_occupancy') && (
                  <button
                    onClick={() => handleItemClick('equipment_occupancy')}
                    title="تقويم الإشغال والصيانة ومنع التضارب"
                    className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                      currentKey === 'equipment_occupancy'
                        ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CalendarRange className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {!isCollapsed && <span className="truncate">تقويم الإشغال والصيانة</span>}
                    </div>
                  </button>
                )}

                {/* الملفات الشخصية والموردين (موحدة بدلاً من الشاشة المكررة) */}
                {navVisible('person_profiles') && (
                  <button
                    onClick={() => handleItemClick('person_profiles')}
                    title="الملفات الشخصية والموردين ومؤجري المعدات"
                    className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                      currentKey === 'person_profiles' || currentKey === 'activity_equipment_partners'
                        ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      {!isCollapsed && <span>الملفات الشخصية والموردين</span>}
                    </div>
                    {!isCollapsed && (personProfilesCount || partnersCount) > 0 && (
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono text-cyan-300">
                        {personProfilesCount || partnersCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
          )}

          {/* 3B. إدارة اللوجستيات ووسائل النقل والسائقين */}
          {(['logistics_add', 'logistics_manage', 'logistics_transfers', 'driver_portal'] as NavigationItemKey[]).some(navVisible) && (
          <div className="pt-2">
            {!isCollapsed ? (
              <button
                onClick={() => setLogisticsOpen(!logisticsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider text-[11px] font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <span>إدارة اللوجستيات</span>
                </div>
                {logisticsOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-full flex justify-center py-1">
                <span className="w-6 h-[1px] bg-slate-800" />
              </div>
            )}

            {(logisticsOpen || isCollapsed) && (
              <div className={`space-y-1 ${!isCollapsed ? 'pr-3 pt-1 border-0 mr-2' : 'flex flex-col items-center'}`}>
                {navVisible('logistics_add') && (
                  <button
                    onClick={() => handleItemClick('logistics_add')}
                    title="إضافة وسيلة نقل"
                    className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full gap-2 px-3 py-2'} rounded-lg transition-colors ${
                      currentKey === 'logistics_add'
                        ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {!isCollapsed && <span>إضافة وسيلة نقل</span>}
                  </button>
                )}

                {navVisible('logistics_manage') && (
                  <button
                    onClick={() => handleItemClick('logistics_manage')}
                    title="سجل وإدارة وسائل النقل"
                    className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                      currentKey === 'logistics_manage'
                        ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {!isCollapsed && <span>سجل وسائل النقل</span>}
                    </div>
                    {!isCollapsed && (
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono text-emerald-300">
                        {logisticsCount}
                      </span>
                    )}
                  </button>
                )}

                {navVisible('logistics_transfers') && (
                  <button
                    onClick={() => handleItemClick('logistics_transfers')}
                    title="تحركات ونقل الأنشطة"
                    className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full gap-2 px-3 py-2'} rounded-lg transition-colors ${
                      currentKey === 'logistics_transfers'
                        ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    {!isCollapsed && <span>تحركات ونقل الأنشطة</span>}
                  </button>
                )}

                {navVisible('driver_portal') && (
                  <button
                    onClick={() => handleItemClick('driver_portal')}
                    title="تطبيق السائق الميداني (المهام اليومية)"
                    className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                      currentKey === 'driver_portal'
                        ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {!isCollapsed && <span className="truncate">تطبيق السائق الميداني</span>}
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
          )}

          {/* 3. المعاملات المالية */}
          {(['finance_wallets', 'finance_cashier', 'operational_costs', 'partner_earnings'] as NavigationItemKey[]).some(navVisible) && (
          <div className="pt-2">
            {!isCollapsed ? (
              <button
                onClick={() => setFinanceOpen(!financeOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider text-[11px] font-semibold"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>المعاملات المالية</span>
                </div>
                {financeOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-full flex justify-center py-1">
                <span className="w-6 h-[1px] bg-slate-800" />
              </div>
            )}

            {(financeOpen || isCollapsed) && (
              <div className={`space-y-1 ${!isCollapsed ? 'pr-3 pt-1 border-0 mr-2' : 'flex flex-col items-center'}`}>
                {/* مستحقاتي وأرباحي المالية */}
                {navVisible('partner_earnings') && (
                <button
                  onClick={() => handleItemClick('partner_earnings')}
                  title="مستحقاتي وأرباحي المالية"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full gap-2 px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'partner_earnings'
                      ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {!isCollapsed && <span>مستحقاتي وأرباحي المالية</span>}
                </button>
                )}

                {/* المحفظة */}
                {navVisible('finance_wallets') && (
                <button
                  onClick={() => handleItemClick('finance_wallets')}
                  title="المحفظة والتوريد QR"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full gap-2 px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'finance_wallets'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {!isCollapsed && <span>المحفظة والتوريد QR</span>}
                </button>
                )}

                {/* التحصيل */}
                {navVisible('finance_cashier') && (
                <button
                  onClick={() => handleItemClick('finance_cashier')}
                  title="التحصيل اليدوي والتسويات"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'finance_cashier'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {!isCollapsed && <span>التحصيل اليدوي والتسويات</span>}
                  </div>
                </button>
                )}

                {/* التكلفة التشغيلية */}
                {navVisible('operational_costs') && (
                <button
                  onClick={() => handleItemClick('operational_costs')}
                  title="التكلفة التشغيلية واقتصاديات المنتج"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'operational_costs'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {!isCollapsed && <span>التكلفة التشغيلية</span>}
                  </div>
                  {!isCollapsed && operationalCostsCount > 0 && (
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono text-amber-300">
                      {operationalCostsCount}
                    </span>
                  )}
                </button>
                )}
              </div>
            )}
          </div>
          )}

          {/* 4. إدارة الرحلات */}
          {(['trip_add', 'compare_activities', 'trips_combo', 'trips_schedule'] as NavigationItemKey[]).some(navVisible) && (
          <div className="pt-2">
            {!isCollapsed ? (
              <button
                onClick={() => setTripsOpen(!tripsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider text-[11px] font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-cyan-400" />
                  <span>إدارة الرحلات</span>
                </div>
                {tripsOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-full flex justify-center py-1">
                <span className="w-6 h-[1px] bg-slate-800" />
              </div>
            )}

            {(tripsOpen || isCollapsed) && (
              <div className={`space-y-1 ${!isCollapsed ? 'pr-3 pt-1 border-0 mr-2' : 'flex flex-col items-center'}`}>
                {/* إنشاء رحلة */}
                {navVisible('trip_add') && (
                <button
                  onClick={() => handleItemClick('trip_add')}
                  title="إنشاء رحلة جديدة"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'trip_add'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {!isCollapsed && <span>إنشاء رحلة</span>}
                  </div>
                  {!isCollapsed && tripsCount > 0 && (
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono text-emerald-300">
                      {tripsCount}
                    </span>
                  )}
                </button>
                )}

                {/* اختيار نشاط */}
                {navVisible('compare_activities') && (
                <button
                  onClick={() => handleItemClick('compare_activities')}
                  title="اختيار نشاط (مقارنة)"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'compare_activities'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    {!isCollapsed && <span>اختيار نشاط (مقارنة)</span>}
                  </div>
                  {!isCollapsed && <span className="text-[9px] text-slate-400 font-mono">ياخت · خيل · سفاري</span>}
                </button>
                )}

                {/* الرحلات المجمعة */}
                {navVisible('trips_combo') && (
                <button
                  onClick={() => handleItemClick('trips_combo')}
                  title="الرحلات المجمعة (Combo)"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'trips_combo'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {!isCollapsed && <span>الرحلات المجمعة (Combo)</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono">
                      بند 12
                    </span>
                  )}
                </button>
                )}

                {/* مواعيد الانطلاق */}
                {navVisible('trips_schedule') && (
                <button
                  onClick={() => handleItemClick('trips_schedule')}
                  title="جدول مواعيد الانطلاق"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'trips_schedule'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    {!isCollapsed && <span>جدول مواعيد الانطلاق</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono">
                      بند 9
                    </span>
                  )}
                </button>
                )}
              </div>
            )}
          </div>
          )}

          {/* 5. إدارة الحجوزات */}
          {(['bookings_activities', 'bookings_trips', 'bookings_in_trip_requests'] as NavigationItemKey[]).some(navVisible) && (
          <div className="pt-2">
            {!isCollapsed ? (
              <button
                onClick={() => setBookingsOpen(!bookingsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider text-[11px] font-semibold"
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-emerald-400" />
                  <span>إدارة الحجوزات</span>
                </div>
                {bookingsOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-full flex justify-center py-1">
                <span className="w-6 h-[1px] bg-slate-800" />
              </div>
            )}

            {(bookingsOpen || isCollapsed) && (
              <div className={`space-y-1 ${!isCollapsed ? 'pr-3 pt-1 border-0 mr-2' : 'flex flex-col items-center'}`}>
                {/* حجوزات الأنشطة */}
                {navVisible('bookings_activities') && (
                <button
                  onClick={() => handleItemClick('bookings_activities')}
                  title="حجوزات الأنشطة"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'bookings_activities'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {!isCollapsed && <span>حجوزات الأنشطة</span>}
                  </div>
                  {!isCollapsed && pendingBookingsCount > 0 && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                      {pendingBookingsCount}
                    </span>
                  )}
                </button>
                )}

                {/* حجوزات الرحلات */}
                {navVisible('bookings_trips') && (
                <button
                  onClick={() => handleItemClick('bookings_trips')}
                  title="حجوزات الرحلات"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full gap-2 px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'bookings_trips'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <Ship className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {!isCollapsed && <span>حجوزات الرحلات</span>}
                </button>
                )}

                {/* طلبات أثناء الرحلة أو النشاط */}
                {navVisible('bookings_in_trip_requests') && (
                <button
                  onClick={() => handleItemClick('bookings_in_trip_requests')}
                  title="طلبات أثناء الرحلة / النشاط"
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'w-full justify-between px-3 py-2'} rounded-lg transition-colors ${
                    currentKey === 'bookings_in_trip_requests'
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {!isCollapsed && <span className="truncate">طلبات أثناء الرحلة / النشاط</span>}
                  </div>
                  {!isCollapsed && inTripRequestsCount > 0 && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                      {inTripRequestsCount}
                    </span>
                  )}
                </button>
                )}
              </div>
            )}
          </div>
          )}

          {/* 6. الأداء والاعتماد */}
          {navVisible('performance_approvals') && (
            <button
              onClick={() => handleItemClick('performance_approvals')}
              title="الأداء والاعتماد"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all ${
                currentKey === 'performance_approvals'
                  ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                {!isCollapsed && <span>الأداء والاعتماد</span>}
              </div>
              {!isCollapsed && pendingReviewCount > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                  {pendingReviewCount} مراجعة
                </span>
              )}
            </button>
          )}

          {/* 6. التقارير */}
          {navVisible('reports') && (
            <button
              onClick={() => handleItemClick('reports')}
              title="التقارير المالية والتشغيلية"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all ${
                currentKey === 'reports'
                  ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />
                {!isCollapsed && <span>التقارير المالية والتشغيلية</span>}
              </div>
              {!isCollapsed && <span className="text-[10px] text-slate-500 font-mono">EUR / EGP</span>}
            </button>
          )}

          {/* 7. إدارة المستخدمين والسجلات والمظهر */}
          {(navVisible('user_management') || navVisible('platform_audit_logs') || navVisible('owner_theme_studio')) && (
            <div className="pt-2 mt-2 border-t border-slate-800/70 space-y-1.5">
              {navVisible('user_management') && (
                <button
                  onClick={() => handleItemClick('user_management')}
                  title="إدارة المستخدمين والصلاحيات"
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all ${
                    currentKey === 'user_management'
                      ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCog className="w-4 h-4 text-cyan-400 shrink-0" />
                    {!isCollapsed && <span>إدارة المستخدمين</span>}
                  </div>
                  {!isCollapsed && managedUsersCount > 0 && (
                    <span className="text-[10px] bg-slate-800 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      {managedUsersCount}
                    </span>
                  )}
                </button>
              )}

              {navVisible('platform_audit_logs') && (
                <button
                  onClick={() => handleItemClick('platform_audit_logs')}
                  title="إدارة السجلات بالمنصة"
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all ${
                    currentKey === 'platform_audit_logs'
                      ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    {!isCollapsed && <span>إدارة السجلات بالمنصة</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[10px] bg-slate-800 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      {auditLogsCount}
                    </span>
                  )}
                </button>
              )}

              {/* 8. تخصيص القوالب والألوان والخطوط */}
              {navVisible('owner_theme_studio') && (
                <button
                  onClick={() => handleItemClick('owner_theme_studio')}
                  title="القوالب والألوان والخطوط"
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all ${
                    currentKey === 'owner_theme_studio'
                      ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4 text-cyan-400 shrink-0" />
                    {!isCollapsed && <span>القوالب والألوان والخطوط</span>}
                  </div>
                  {!isCollapsed && <span className="text-[10px] text-slate-500 font-mono">تصميمي</span>}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Account Profile */}
        <div className={`p-3.5 border-0 bg-slate-950/80 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-xs font-mono shrink-0"
              title={currentUser ? `${currentUser.name} - ${currentUser.companyName}` : 'إدارة منصة زانوزا'}
            >
              {currentUser?.avatarInitials || 'ZA'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-200 truncate">
                  {currentUser?.name || 'إدارة منصة زانوزا'}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono truncate">
                  {currentUser?.companyName || 'المسؤول المالي والتشغيلي'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
