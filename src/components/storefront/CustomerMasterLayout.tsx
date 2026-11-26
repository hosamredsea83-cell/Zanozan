import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  Compass,
  Gift,
  Heart,
  Layers,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  ShieldCheck,
  Star,
  Ticket,
  User,
  X
} from 'lucide-react';
import type { AppUser } from '../../types/auth';
import {
  getNationalityDisplayLabel,
  isEgyptianNationality
} from '../../utils/customerEligibility';

export type CustomerPortalSection =
  | 'catalog'
  | 'collections'
  | 'offers'
  | 'my_bookings'
  | 'favorites'
  | 'reviews'
  | 'account';

interface CustomerMasterLayoutProps {
  activeSection: CustomerPortalSection;
  onSelectSection: (section: CustomerPortalSection) => void;
  currency?: 'EGP' | 'EUR';
  onChangeCurrency?: (currency: 'EGP' | 'EUR') => void;
  lang: 'ar' | 'en';
  onChangeLang: (lang: 'ar' | 'en') => void;
  catalogCount: number;
  collectionsCount: number;
  offersCount: number;
  myBookingsCount: number;
  favoritesCount: number;
  reviewsCount: number;
  currentUser: AppUser;
  allUsers?: AppUser[];
  onSwitchUser?: (user: AppUser) => void;
  onOpenAuthModal?: () => void;
  isAuthenticatedSession?: boolean;
  children: React.ReactNode;
}

export const CustomerMasterLayout: React.FC<CustomerMasterLayoutProps> = ({
  activeSection,
  onSelectSection,
  lang,
  onChangeLang,
  catalogCount,
  collectionsCount,
  offersCount,
  myBookingsCount,
  favoritesCount,
  reviewsCount,
  currentUser,
  allUsers = [],
  onSwitchUser,
  onOpenAuthModal,
  isAuthenticatedSession = false,
  children
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const isEn = lang === 'en';

  const navItems: {
    id: CustomerPortalSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }[] = [
    {
      id: 'catalog',
      label: isEn ? 'Explore Activities' : 'استكشاف الأنشطة',
      icon: Compass,
      count: catalogCount
    },
    {
      id: 'collections',
      label: isEn ? 'Packages & Bundles' : 'المجموعات والباقات',
      icon: Layers,
      count: collectionsCount
    },
    {
      id: 'offers',
      label: isEn ? 'Seasonal Offers' : 'العروض والخصومات',
      icon: Gift,
      count: offersCount
    },
    {
      id: 'my_bookings',
      label: isEn ? 'My Bookings' : 'حجوزاتي وتذاكري',
      icon: Ticket,
      count: myBookingsCount
    },
    {
      id: 'favorites',
      label: isEn ? 'Saved Favorites' : 'المفضلة المحفوظة',
      icon: Heart,
      count: favoritesCount
    },
    {
      id: 'reviews',
      label: isEn ? 'Guest Reviews' : 'تقييمات السياح',
      icon: Star,
      count: reviewsCount
    },
    {
      id: 'account',
      label: isEn ? 'My Account & Help' : 'حسابي والدعم',
      icon: User
    }
  ];

  const headerLinks: { id: CustomerPortalSection; label: string }[] = [
    { id: 'catalog', label: isEn ? 'Experiences' : 'الأنشطة' },
    { id: 'collections', label: isEn ? 'Packages' : 'الباقات' },
    { id: 'offers', label: isEn ? 'Offers' : 'العروض' },
    { id: 'my_bookings', label: isEn ? 'My Tickets' : 'تذاكري' },
    { id: 'reviews', label: isEn ? 'Reviews' : 'التقييمات' }
  ];

  const handleSelect = (section: CustomerPortalSection) => {
    onSelectSection(section);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Customer-Only Sidebar (Dedicated Customer Navigation & Preferences) */}
      <aside
        className={`fixed top-0 bottom-0 ${isEn ? 'left-0' : 'right-0'} z-50 bg-slate-950 border-${
          isEn ? 'r' : 'l'
        } border-slate-800/80 flex flex-col justify-between transition-all duration-300 ${
          isMobileSidebarOpen
            ? 'translate-x-0'
            : isEn
              ? '-translate-x-full lg:translate-x-0'
              : 'translate-x-full lg:translate-x-0'
        } ${isSidebarCollapsed ? 'w-20' : 'w-68'}`}
      >
        {/* Sidebar Top Brand & Collapse */}
        <div>
          <div
            className={`h-16 px-4 flex items-center border-b border-slate-800/80 ${
              isCollapsedClass(isSidebarCollapsed)
            }`}
          >
            {!isSidebarCollapsed && (
              <span className="text-base font-bold text-white tracking-tight whitespace-nowrap">
                ZanoZa Travel
              </span>
            )}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                title={
                  isSidebarCollapsed
                    ? isEn
                      ? 'Expand menu'
                      : 'توسيع القائمة'
                    : isEn
                      ? 'Collapse menu'
                      : 'طي القائمة'
                }
              >
                {isSidebarCollapsed ? (
                  <PanelRightOpen className="w-4 h-4 text-cyan-400" />
                ) : (
                  <PanelRightClose className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Customer Navigation Items */}
          <nav className="p-3 space-y-1 text-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  title={item.label}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                  } py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-cyan-600/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        item.id === 'favorites'
                          ? 'text-rose-400'
                          : isActive
                            ? 'text-cyan-400'
                            : 'text-slate-400'
                      }`}
                    />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && typeof item.count === 'number' && (
                    <span className="text-[11px] font-mono tabular-nums text-slate-400">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Nationality-Locked Pricing & Scope Summary + Language inside Customer Sidebar */}
          {!isSidebarCollapsed && (
            <div className="mx-3 mt-2 pt-3 border-t border-slate-800/80 space-y-3 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                <div className="text-[11px] text-slate-400">
                  {isEn ? 'Auto Pricing by Nationality' : 'التسعير التلقائي حسب الجنسية'}
                </div>
                <div className="font-bold text-white">
                  {currentUser.nationality
                    ? getNationalityDisplayLabel(currentUser.nationality, lang)
                    : isEn
                      ? 'Pending nationality setup'
                      : 'بانتظار تحديد الجنسية'}
                </div>
                <div className="text-[11px] text-emerald-300 font-medium">
                  {currentUser.nationality
                    ? isEgyptianNationality(currentUser.nationality)
                      ? isEn
                        ? 'Egyptian Rate (EGP)'
                        : 'السعر المصري فقط (ج.م)'
                      : isEn
                        ? 'Foreigner Rate (EUR €)'
                        : 'السعر الأجنبي فقط (€)'
                    : isEn
                      ? 'Set nationality to unlock prices'
                      : 'حدد الجنسية لعرض الأسعار'}
                </div>
                <div className="pt-1 border-t border-slate-800 text-[11px] text-cyan-300">
                  {currentUser.customerScope === 'company'
                    ? `${isEn ? 'Company Client:' : 'عميل شركة:'} ${
                        currentUser.registeredCompanyName || currentUser.companyName
                      }`
                    : isEn
                      ? 'Platform Client · All Companies'
                      : 'عميل منصة · جميع الشركات'}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 mb-1.5">
                  {isEn ? 'Language' : 'اللغة'}
                </div>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => onChangeLang('ar')}
                    className={`py-1.5 rounded-md font-semibold transition-colors ${
                      lang === 'ar'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    العربية
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeLang('en')}
                    className={`py-1.5 rounded-md font-semibold transition-colors ${
                      lang === 'en'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Sidebar Footer Info */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => handleSelect('account')}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-900 transition-colors ${
              isSidebarCollapsed ? 'justify-center' : 'text-right'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser.avatarInitials}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {currentUser.phone}
                </div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div
        className={`${
          isEn
            ? isSidebarCollapsed
              ? 'lg:ml-20'
              : 'lg:ml-68'
            : isSidebarCollapsed
              ? 'lg:mr-20'
              : 'lg:mr-68'
        } min-h-screen flex flex-col transition-all duration-300`}
      >
        {/* Customer-Only Top Header (Strict 3-Zone Top Bar Contract) */}
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
            {/* Zone 1: Brand Wordmark + Mobile Menu Trigger */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white lg:hidden"
                aria-label={isEn ? 'Open customer menu' : 'فتح قائمة العميل'}
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleSelect('catalog')}
                className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
              >
                ZanoZa
              </button>
            </div>

            {/* Zone 2: 5 Clean Single-Line Nav Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              {headerLinks.map((lnk) => (
                <button
                  key={lnk.id}
                  type="button"
                  onClick={() => handleSelect(lnk.id)}
                  className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
                    activeSection === lnk.id
                      ? 'text-cyan-300 border-cyan-400'
                      : 'border-transparent hover:text-white'
                  }`}
                >
                  {lnk.label}
                </button>
              ))}
            </nav>

            {/* Zone 3: Primary Account / Booking Action */}
            <div className="flex items-center gap-2 shrink-0 relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
              >
                <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="max-w-[120px] truncate">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {isAccountMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsAccountMenuOpen(false)}
                  />
                  <div
                    className={`absolute ${
                      isEn ? 'right-0' : 'left-0'
                    } top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs`}
                  >
                    <div className="px-2.5 py-2 border-b border-slate-800 mb-1.5">
                      <div className="font-bold text-white">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {isEn ? 'Customer Account' : 'حساب عميل · بوابة الحجز المباشر'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        handleSelect('my_bookings');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <span>{isEn ? 'My Bookings & Tickets' : 'حجوزاتي وتذاكري'}</span>
                      <span className="font-mono tabular-nums text-cyan-300">
                        {myBookingsCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        handleSelect('favorites');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <span>{isEn ? 'Saved Favorites' : 'المفضلة المحفوظة'}</span>
                      <span className="font-mono tabular-nums text-rose-300">
                        {favoritesCount}
                      </span>
                    </button>

                    {onOpenAuthModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onOpenAuthModal();
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-emerald-300 hover:bg-slate-800 transition-colors mt-1 border-t border-slate-800 pt-2"
                      >
                        <span>
                          {isAuthenticatedSession
                            ? isEn
                              ? 'Manage Verified Session'
                              : 'إدارة الجلسة الموثقة'
                            : isEn
                              ? 'Sign In / Create Account'
                              : 'تسجيل الدخول / إنشاء حساب'}
                        </span>
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onSwitchUser && allUsers.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                        <div className="px-2 text-[11px] text-slate-400">
                          {isEn ? 'Switch Account' : 'التبديل السريع للحسابات'}
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-0.5">
                          {allUsers.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                onSwitchUser(u);
                                setIsAccountMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                                u.id === currentUser.id
                                  ? 'bg-cyan-600/20 text-cyan-300'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <span className="truncate">{u.name}</span>
                              {u.id === currentUser.id && (
                                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Customer Content */}
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Customer-Only Dedicated Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-400">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-bold text-white">
                {isEn
                  ? 'ZanoZa · Direct Tourist Booking Portal'
                  : 'ZanoZa · بوابة السائح والحجز المباشر'}
              </div>
              <p className="leading-relaxed text-slate-400">
                {isEn
                  ? 'Transparent sea cruises, desert safaris, and diving bookings with verified e-tickets and 7-day support.'
                  : 'منصة حجز الرحلات البحرية والسفاري والغوص بأسعار شفافة وتذاكر إلكترونية معتمدة مع دعم مباشر طوال أيام الأسبوع.'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-200">
                {isEn ? 'Quick Customer Links' : 'روابط العميل السريعة'}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                <button
                  type="button"
                  onClick={() => handleSelect('catalog')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  {isEn ? 'Explore Activities' : 'تصفح الأنشطة'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect('collections')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  {isEn ? 'Packages & Bundles' : 'المجموعات والباقات'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect('offers')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  {isEn ? 'Seasonal Offers' : 'العروض والخصومات'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect('my_bookings')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  {isEn ? 'Track My Booking' : 'تتبع حجزي'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect('reviews')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  {isEn ? 'Guest Reviews' : 'تقييمات السياح'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect('account')}
                  className="hover:text-cyan-300 transition-colors"
                >
                  {isEn ? 'Cancellation Policy & Help' : 'سياسة الإلغاء والمساعدة'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-200">
                {isEn ? 'Booking Protection & Privacy' : 'ضمان الحجز والخصوصية'}
              </div>
              <p className="text-slate-400 leading-relaxed">
                {isEn
                  ? 'Your tickets and bookings are protected and accessible only via your verified phone + booking code or personal account.'
                  : 'بيانات حجوزاتك وتذاكرك محمية ولا تُعرض إلا برقم الهاتف وكود الحجز أو من خلال حسابك الشخصي.'}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

function isCollapsedClass(isCollapsed: boolean): string {
  return isCollapsed ? 'justify-center' : 'justify-between';
}
