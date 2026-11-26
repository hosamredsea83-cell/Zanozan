import React, { useMemo, useState } from 'react';
import {
  PlusCircle,
  Compass,
  Anchor,
  Mountain,
  Waves,
  Ship,
  Search,
  Edit3,
  Trash2,
  Eye,
  Check,
  MapPin,
  Sparkles,
  LayoutGrid,
  List,
  Layers
} from 'lucide-react';
import { Activity, ActivityStatus } from '../../../types/activity';
import { AppUser } from '../../../types/auth';
import { EquipmentItem, EquipmentTypeDefinition } from '../../../types/equipment';
import {
  ActivityCardMediaGallery,
  ActivityCardAllProperties
} from '../../activities/ActivityCardSections';
import {
  RegistryColumnFilterDropdown,
  RegistryFilterOption,
  RegistryFilterSummaryBar,
  RegistrySortIcon,
  useRegistryTableState
} from '../../shared/RegistryTableControls';
import {
  ACTIVITY_TERMINOLOGY,
  type EntityCreationOverrides,
  type EntityTerminologyConfig
} from './entityCreationTerminology';
import { activityBelongsToOwner } from '../../../db/localActivitiesDb';

type HubTableCol = 'name' | 'categoryLocation' | 'pricing' | 'status' | 'bookings';

const HUB_TABLE_COLUMNS: readonly HubTableCol[] = [
  'name',
  'categoryLocation',
  'pricing',
  'status',
  'bookings'
];

const WIDE_HUB_COLS: readonly HubTableCol[] = ['name', 'categoryLocation', 'pricing'];

const HUB_STATUS_LABELS: Record<ActivityStatus, string> = {
  '': 'غير محدد',
  published: 'منشور ومتاح للحجز',
  draft: 'مسودة قيد التجهيز',
  pending_review: 'قيد المراجعة الفنية',
  paused: 'موقوف مؤقتاً',
  archived: 'مؤرشف'
};

export interface CreationReferenceHubProps {
  terms?: EntityTerminologyConfig;
  overrides?: EntityCreationOverrides;
  activities: Activity[];
  currentUser: AppUser;
  onAddNewActivity: (presetCategory?: string) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onToggleStatus: (activityId: string, newStatus: ActivityStatus) => void;
  onViewActivity?: (activity: Activity) => void;
  onNavigateToCollections?: () => void;
  equipments?: EquipmentItem[];
  equipmentTypes?: EquipmentTypeDefinition[];
}

export const CreationReferenceHub: React.FC<CreationReferenceHubProps> = ({
  terms = ACTIVITY_TERMINOLOGY,
  overrides,
  activities,
  currentUser,
  onAddNewActivity,
  onEditActivity,
  onDeleteActivity,
  onToggleStatus,
  onViewActivity,
  onNavigateToCollections,
  equipments = [],
  equipmentTypes = []
}) => {
  const ownerActivities = activities.filter((a) => activityBelongsToOwner(a, currentUser));

  const [forceEmptyState, setForceEmptyState] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'pending_review'>(
    'all'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const tableState = useRegistryTableState<HubTableCol>(HUB_TABLE_COLUMNS);

  const dropdownTitles = useMemo<Record<HubTableCol, string>>(
    () => ({
      name: terms.hubDropdownNameTitle,
      categoryLocation: 'تحديد متعدد للتصنيف والموقع',
      pricing: 'تحديد متعدد للأسعار',
      status: terms.hubDropdownStatusTitle,
      bookings: 'تحديد متعدد لعدد الحجوزات'
    }),
    [terms.hubDropdownNameTitle, terms.hubDropdownStatusTitle]
  );

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const isTrulyEmpty = ownerActivities.length === 0;
  const showEmptyState = isTrulyEmpty || forceEmptyState;

  const featuredTemplates = [
    {
      id: 'template-yacht',
      title: 'لانشات ويخوت سريعة',
      badge: 'رحلات بحرية فاخرة',
      description:
        'رحلات بحرية خاصة، لانشات سريعة للجزر المحمية، جولات يخوت VIP، وسنوركلينج في أنقى مياه البحر الأحمر.',
      image: '/src/assets/images/zanoza_yacht_hurghada_1794046061468.jpg',
      icon: Anchor,
      categoryKey: 'yacht',
      accentColor: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-400'
    },
    {
      id: 'template-safari',
      title: 'جبل وسفاري صحراوي',
      badge: 'مغامرات الجبال والصحراء',
      description:
        'مغامرات البيتش باجي (Quad Bikes)، صعود سلاسل جبال البحر الأحمر، عشاء بدوي مع الشاي بالأعشاب والنجوم.',
      image: '/src/assets/images/zanoza_safari_desert_1794046062158.jpg',
      icon: Mountain,
      categoryKey: 'safari',
      accentColor: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400'
    },
    {
      id: 'template-diving',
      title: 'غوص وأعماق البحر',
      badge: 'شعاب مرجانية ودلافين',
      description:
        'استكشاف الشعاب المرجانية النادرة، بيوت الدلافين، حطام السفن الغارقة، وكورسات غوص معتمدة دولياً للمبتدئين.',
      image: '/src/assets/images/zanoza_scuba_diving_1794046063460.jpg',
      icon: Waves,
      categoryKey: 'diving',
      accentColor: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400'
    },
    {
      id: 'template-glass-boat',
      title: 'قوارب زجاجية وجولات',
      badge: 'عائلي وبانورامي',
      description:
        'جولات القوارب الزجاجية والصبمارين للأطفال والعائلات، مشاهدة الأسماك الملونة والشعاب دون بلل، وألعاب مائية.',
      image: '/src/assets/images/zanoza_glass_boat_1794046062451.jpg',
      icon: Ship,
      categoryKey: 'glass_boat',
      accentColor: 'from-indigo-500/20 to-cyan-500/20 border-indigo-500/40 text-indigo-400'
    }
  ];

  const filteredActivities = ownerActivities.filter((act) => {
    const matchesSearch =
      act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.location?.primarySite?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || act.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCatLocLabel = (act: Activity) =>
    `${act.categoryPath?.[1] || act.categoryPath?.[0] || terms.hubFallbackCategoryLabel} · ${
      act.location?.city || ''
    }`;

  const getPriceLabel = (act: Activity) =>
    `${act.pricing?.egyptianB2C?.adultEGP || 0} ج.م / $${
      act.pricing?.foreignerB2C?.adultEUR || 0
    }`;

  const columnOptionsMap = useMemo<Record<HubTableCol, RegistryFilterOption[]>>(() => {
    const nameCounts = new Map<string, { id: string; count: number }>();
    const catLocCounts = new Map<string, number>();
    const priceCounts = new Map<string, number>();
    const statusCounts = new Map<ActivityStatus, number>();
    const bookingCounts = new Map<number, number>();

    filteredActivities.forEach((act) => {
      const prevN = nameCounts.get(act.name);
      nameCounts.set(act.name, { id: act.id, count: (prevN?.count || 0) + 1 });

      const catLoc = getCatLocLabel(act);
      catLocCounts.set(catLoc, (catLocCounts.get(catLoc) || 0) + 1);

      const pLabel = getPriceLabel(act);
      priceCounts.set(pLabel, (priceCounts.get(pLabel) || 0) + 1);

      statusCounts.set(act.status, (statusCounts.get(act.status) || 0) + 1);

      const bCount = act.stats?.bookingsCount || 0;
      bookingCounts.set(bCount, (bookingCounts.get(bCount) || 0) + 1);
    });

    return {
      name: Array.from(nameCounts.entries()).map(([val, m]) => ({
        value: val,
        label: val,
        subLabel: m.id,
        count: m.count
      })),
      categoryLocation: Array.from(catLocCounts.entries()).map(([val, count]) => ({
        value: val,
        label: val,
        count
      })),
      pricing: Array.from(priceCounts.entries()).map(([val, count]) => ({
        value: val,
        label: val,
        count
      })),
      status: Array.from(statusCounts.entries()).map(([st, count]) => ({
        value: st,
        label: HUB_STATUS_LABELS[st] || st,
        count
      })),
      bookings: Array.from(bookingCounts.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([cnt, total]) => ({
          value: String(cnt),
          label: `${cnt} حجز`,
          count: total
        }))
    };
  }, [filteredActivities, terms.hubFallbackCategoryLabel]);

  const tableFilteredActivities = useMemo(() => {
    const { columnFilters: cf, selectedColumnFilters: scf, sortColumn, sortDirection } =
      tableState;
    const fName = cf.name.trim().toLowerCase();
    const fCat = cf.categoryLocation.trim().toLowerCase();
    const fPrice = cf.pricing.trim().toLowerCase();
    const fStatus = cf.status.trim().toLowerCase();
    const fBookings = cf.bookings.trim().toLowerCase();

    const out = filteredActivities.filter((act) => {
      if (scf.name.length > 0) {
        if (!scf.name.includes(act.name)) return false;
      } else if (fName && !`${act.name} ${act.id}`.toLowerCase().includes(fName)) {
        return false;
      }

      const catLoc = getCatLocLabel(act);
      if (scf.categoryLocation.length > 0) {
        if (!scf.categoryLocation.includes(catLoc)) return false;
      } else if (
        fCat &&
        !`${catLoc} ${act.location?.primarySite || ''}`.toLowerCase().includes(fCat)
      ) {
        return false;
      }

      const pLabel = getPriceLabel(act);
      if (scf.pricing.length > 0) {
        if (!scf.pricing.includes(pLabel)) return false;
      } else if (fPrice && !pLabel.toLowerCase().includes(fPrice)) {
        return false;
      }

      if (scf.status.length > 0) {
        if (!scf.status.includes(act.status)) return false;
      } else if (
        fStatus &&
        !(HUB_STATUS_LABELS[act.status] || act.status).toLowerCase().includes(fStatus)
      ) {
        return false;
      }

      const bCount = act.stats?.bookingsCount || 0;
      if (scf.bookings.length > 0) {
        if (!scf.bookings.includes(String(bCount))) return false;
      } else if (fBookings && !`${bCount} حجز`.toLowerCase().includes(fBookings)) {
        return false;
      }

      return true;
    });

    if (!sortColumn) return out;
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...out].sort((a, b) => {
      switch (sortColumn) {
        case 'name':
          return a.name.localeCompare(b.name, 'ar') * dir;
        case 'categoryLocation':
          return getCatLocLabel(a).localeCompare(getCatLocLabel(b), 'ar') * dir;
        case 'pricing':
          return (
            ((a.pricing?.egyptianB2C?.adultEGP || 0) - (b.pricing?.egyptianB2C?.adultEGP || 0)) *
            dir
          );
        case 'status':
          return (
            (HUB_STATUS_LABELS[a.status] || '').localeCompare(
              HUB_STATUS_LABELS[b.status] || '',
              'ar'
            ) * dir
          );
        case 'bookings':
          return ((a.stats?.bookingsCount || 0) - (b.stats?.bookingsCount || 0)) * dir;
      }
    });
  }, [
    filteredActivities,
    tableState.columnFilters,
    tableState.selectedColumnFilters,
    tableState.sortColumn,
    tableState.sortDirection,
    terms.hubFallbackCategoryLabel
  ]);

  const hubFilterColumnsConfig: Array<{
    col: HubTableCol;
    placeholder: string;
    minWidth: string;
    extraClass?: string;
    getLabel?: (v: string) => string;
  }> = [
    { col: 'name', placeholder: terms.hubSearchFilterColPlaceholder, minWidth: 'min-w-[150px]' },
    { col: 'categoryLocation', placeholder: 'التصنيف والموقع...', minWidth: 'min-w-[135px]' },
    { col: 'pricing', placeholder: 'السعر...', minWidth: 'min-w-[100px]' },
    {
      col: 'status',
      placeholder: 'الحالة...',
      minWidth: 'min-w-[115px]',
      getLabel: (v) => HUB_STATUS_LABELS[v as ActivityStatus] || v
    },
    {
      col: 'bookings',
      placeholder: 'الحجوزات...',
      minWidth: 'min-w-[85px]',
      getLabel: (v) => `${v} حجز`
    }
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-right" dir="rtl">
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {showEmptyState ? (
        <div className="space-y-6">
          {/* Hero Banner with Big Call to Action */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {!isTrulyEmpty && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-400">معاينة وضع الصفحة الفارغة:</span>
                <button
                  type="button"
                  onClick={() => setForceEmptyState(false)}
                  className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                >
                  {terms.emptyPreviewReturnLabel} ({ownerActivities.length})
                </button>
              </div>
            )}

            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
                <Compass className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-3 py-1 rounded-full font-semibold">
                  {terms.emptyBadgeLabel}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2.5 tracking-tight">
                  {terms.emptyHeroTitle}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                  {terms.emptyHeroDescription}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onAddNewActivity()}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-2.5 text-sm transition-all transform hover:scale-[1.02] cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5 text-white" />
                  <span>{terms.emptyPrimaryCta}</span>
                </button>

                {onNavigateToCollections && (
                  <button
                    type="button"
                    onClick={onNavigateToCollections}
                    className="w-full sm:w-auto px-5 py-3.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>إضافة مجموعات سياحية</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>نماذج وتصنيفات مقترحة للبدء السريع (4 تصنيفات رئيسية)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {terms.emptyTemplateCategoryChoiceHint}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <div
                  key={template.id}
                  onClick={() => onAddNewActivity(template.categoryKey)}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-2xl overflow-hidden transition-all duration-300 group cursor-pointer flex flex-col justify-between hover:shadow-2xl hover:shadow-cyan-950/50 hover:-translate-y-1"
                >
                  <div>
                    <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                      <img
                        src={template.image}
                        alt={template.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] bg-slate-950/80 backdrop-blur-md text-cyan-300 border border-cyan-800/50 px-2.5 py-1 rounded-full font-bold shadow-sm">
                          {template.badge}
                        </span>
                      </div>

                      <div className="absolute bottom-3 right-3 w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-sm flex items-center justify-center text-cyan-400 shadow">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-4 space-y-2 text-right">
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {template.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      className="w-full py-2 bg-slate-800 group-hover:bg-cyan-600 text-slate-300 group-hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>
                        {terms.emptyTemplateButtonPrefix} {template.title}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
                <Compass className="w-4 h-4" />
                <span>{terms.hubBreadcrumb}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span>{terms.hubTitle}</span>
                <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-2.5 py-1 rounded-full font-mono">
                  {ownerActivities.length} {terms.hubCountBadgeSuffix}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {terms.hubSubtitleTemplate(currentUser.name, currentUser.companyName)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => onAddNewActivity()}
                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{terms.hubAddButtonLabel}</span>
              </button>

              {overrides?.renderHubHeaderActions?.()}

              {onNavigateToCollections && (
                <button
                  type="button"
                  onClick={onNavigateToCollections}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>إضافة مجموعات</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setForceEmptyState(true)}
                title="معاينة الصفحة الفارغة بالأربع صور"
                className="px-2.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-cyan-300 text-xs rounded-xl border border-slate-700"
              >
                معاينة شاشة البداية
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] text-slate-400 font-semibold block">
                {terms.hubStatTotalLabel}
              </span>
              <span className="text-xl font-bold text-white font-mono">
                {ownerActivities.length}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] text-emerald-400 font-semibold block">
                {terms.hubStatPublishedLabel}
              </span>
              <span className="text-xl font-bold text-emerald-400 font-mono">
                {ownerActivities.filter((a) => a.status === 'published').length}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] text-amber-400 font-semibold block">
                {terms.hubStatDraftLabel}
              </span>
              <span className="text-xl font-bold text-amber-400 font-mono">
                {ownerActivities.filter((a) => a.status === 'draft').length}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] text-cyan-400 font-semibold block">
                إجمالي الحجوزات
              </span>
              <span className="text-xl font-bold text-cyan-400 font-mono">
                {ownerActivities.reduce((acc, a) => acc + (a.stats?.bookingsCount || 0), 0)}
              </span>
            </div>
          </div>

          {/* Search, Filter & View Controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث بالاسم، المدينة، أو الموقع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    statusFilter === 'all'
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل ({ownerActivities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('published')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    statusFilter === 'published'
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  منشور
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('draft')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    statusFilter === 'draft'
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  مسودة
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded ${
                    viewMode === 'table'
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="عرض كجدول وسجل"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${
                    viewMode === 'grid'
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="عرض كبطاقات"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'table' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <RegistryFilterSummaryBar
                filteredCount={tableFilteredActivities.length}
                totalCount={filteredActivities.length}
                itemNoun={terms.noun}
                sortColumn={tableState.sortColumn}
                sortDirection={tableState.sortDirection}
                hasActiveFilters={tableState.hasActiveFilters}
                onClearAll={tableState.handleClearAll}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => tableState.handleToggleSort('name')}
                          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                        >
                          <span>{terms.hubTableColNameHeader}</span>
                          <RegistrySortIcon
                            column="name"
                            sortColumn={tableState.sortColumn}
                            sortDirection={tableState.sortDirection}
                          />
                        </button>
                      </th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => tableState.handleToggleSort('categoryLocation')}
                          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                        >
                          <span>التصنيف والموقع</span>
                          <RegistrySortIcon
                            column="categoryLocation"
                            sortColumn={tableState.sortColumn}
                            sortDirection={tableState.sortDirection}
                          />
                        </button>
                      </th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => tableState.handleToggleSort('pricing')}
                          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                        >
                          <span>الأسعار (المصريين / الأجانب)</span>
                          <RegistrySortIcon
                            column="pricing"
                            sortColumn={tableState.sortColumn}
                            sortDirection={tableState.sortDirection}
                          />
                        </button>
                      </th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => tableState.handleToggleSort('status')}
                          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                        >
                          <span>{terms.hubTableColStatusHeader}</span>
                          <RegistrySortIcon
                            column="status"
                            sortColumn={tableState.sortColumn}
                            sortDirection={tableState.sortDirection}
                          />
                        </button>
                      </th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => tableState.handleToggleSort('bookings')}
                          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                        >
                          <span>الحجوزات</span>
                          <RegistrySortIcon
                            column="bookings"
                            sortColumn={tableState.sortColumn}
                            sortDirection={tableState.sortDirection}
                          />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-center">الإجراءات</th>
                    </tr>

                    {/* Searchable Multi-Select Column Filter Row */}
                    <tr className="bg-slate-900/90 border-t border-slate-800/80 font-normal">
                      {hubFilterColumnsConfig.map(
                        ({ col, placeholder, minWidth, extraClass = '', getLabel }) => {
                          const hasSelected = tableState.selectedColumnFilters[col].length > 0;
                          return (
                            <th key={col} className="p-2">
                              <input
                                ref={(el) => {
                                  tableState.filterInputRefs.current[col] = el;
                                }}
                                type="text"
                                placeholder={tableState.getSelectedSummaryPlaceholder(
                                  col,
                                  placeholder,
                                  getLabel
                                )}
                                value={tableState.columnFilters[col]}
                                onFocus={() => {
                                  tableState.updateDropdownPosition(col, WIDE_HUB_COLS);
                                  tableState.setOpenDropdownCol(col);
                                }}
                                onClick={() => {
                                  tableState.updateDropdownPosition(col, WIDE_HUB_COLS);
                                  tableState.setOpenDropdownCol(col);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') tableState.setOpenDropdownCol(null);
                                }}
                                onChange={(e) => {
                                  tableState.setColumnFilters((prev) => ({
                                    ...prev,
                                    [col]: e.target.value
                                  }));
                                  if (tableState.openDropdownCol !== col) {
                                    tableState.updateDropdownPosition(col, WIDE_HUB_COLS);
                                    tableState.setOpenDropdownCol(col);
                                  }
                                }}
                                className={`w-full ${minWidth} rounded-md px-2 py-1 text-[11px] focus:outline-none transition-colors ${extraClass} ${
                                  hasSelected
                                    ? 'bg-cyan-950/30 border border-cyan-500/70 text-cyan-100 placeholder-cyan-300 font-semibold'
                                    : 'bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-cyan-500'
                                }`}
                              />
                            </th>
                          );
                        }
                      )}
                      <th className="p-2 text-center">
                        {tableState.hasActiveFilters ? (
                          <button
                            type="button"
                            onClick={tableState.handleClearAll}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 text-[10px] font-semibold cursor-pointer"
                          >
                            مسح
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600">—</span>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-200">
                    {tableFilteredActivities.length > 0 ? (
                      tableFilteredActivities.map((act) => {
                        const coverImg =
                          act.media?.find((m) => m.isCover)?.url ||
                          act.media?.[0]?.url ||
                          '/src/assets/images/zanoza_yacht_hurghada_1794046061468.jpg';
                        return (
                          <tr key={act.id} className="hover:bg-slate-850/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-12 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800">
                                  <img
                                    src={coverImg}
                                    alt={act.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white text-xs truncate max-w-[260px]">
                                    {act.name}
                                  </p>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ID: {act.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="space-y-0.5">
                                <span className="text-[11px] text-cyan-300 font-medium block">
                                  {act.categoryPath?.[1] ||
                                    act.categoryPath?.[0] ||
                                    terms.hubFallbackCategoryLabel}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  <span>
                                    {act.location?.city} - {act.location?.primarySite?.slice(0, 24)}
                                  </span>
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4 font-mono">
                              <div className="space-y-0.5">
                                <span className="text-white font-bold block">
                                  {act.pricing?.egyptianB2C?.adultEGP || 0} ج.م
                                </span>
                                <span className="text-[10px] text-cyan-400">
                                  ${act.pricing?.foreignerB2C?.adultEUR || 0} USD
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <select
                                value={act.status}
                                onChange={(e) =>
                                  onToggleStatus(act.id, e.target.value as ActivityStatus)
                                }
                                className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border focus:outline-none cursor-pointer ${
                                  act.status === 'published'
                                    ? 'bg-emerald-950/70 border-emerald-600/50 text-emerald-300'
                                    : act.status === 'draft'
                                    ? 'bg-amber-950/70 border-amber-600/50 text-amber-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-300'
                                }`}
                              >
                                <option value="published">منشور ومتاح للحجز</option>
                                <option value="draft">مسودة قيد التجهيز</option>
                                <option value="pending_review">قيد المراجعة الفنية</option>
                              </select>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-mono text-xs">
                                <span className="text-white font-semibold">
                                  {act.stats?.bookingsCount || 0} حجز
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {act.slots?.[0]?.maxCapacity || 25} مقعد
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center">
                              {pendingDeleteId === act.id ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteActivity(act.id);
                                      setPendingDeleteId(null);
                                      showNotification(terms.hubDeleteSuccessMessage);
                                    }}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                                  >
                                    تأكيد الحذف
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteId(null)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg transition cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => onEditActivity(act)}
                                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1"
                                    title={terms.hubEditButtonTooltip}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>تعديل</span>
                                  </button>
                                  {onViewActivity && (
                                    <button
                                      type="button"
                                      onClick={() => onViewActivity(act)}
                                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                      title={terms.hubPreviewButtonTooltip}
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteId(act.id)}
                                    className="p-1.5 bg-slate-800 hover:bg-red-950/70 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                                    title={terms.hubDeleteButtonTooltip}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          لا توجد نتائج مطابقة لبحثك.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {tableState.openDropdownCol && tableState.dropdownRect && (
                <RegistryColumnFilterDropdown
                  activeCol={tableState.openDropdownCol}
                  dropdownRect={tableState.dropdownRect}
                  activeDropdownRef={tableState.activeDropdownRef}
                  title={dropdownTitles[tableState.openDropdownCol]}
                  options={columnOptionsMap[tableState.openDropdownCol] || []}
                  filterText={tableState.columnFilters[tableState.openDropdownCol]}
                  selectedValues={tableState.selectedColumnFilters[tableState.openDropdownCol]}
                  onToggleValue={tableState.handleToggleColumnFilterValue}
                  onClearCol={tableState.handleClearCol}
                  onClose={() => tableState.setOpenDropdownCol(null)}
                />
              )}
            </div>
          ) : (
            /* Cards Grid View */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition flex flex-col justify-between shadow-lg"
                >
                  <ActivityCardMediaGallery
                    activity={act}
                    aspectClass="aspect-[16/9]"
                    terms={terms}
                    topLeftOverlay={
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          act.status === 'published'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {act.status === 'published' ? 'منشور' : 'مسودة'}
                      </span>
                    }
                    topRightOverlay={
                      <div className="bg-slate-950/85 px-2.5 py-1 rounded-lg font-mono text-white text-[11px] border border-slate-800">
                        {(act.pricing?.egyptianB2C?.adultEGP || 0).toLocaleString()} ج.م / €
                        {act.pricing?.foreignerB2C?.adultEUR || 0}
                      </div>
                    }
                    bottomOverlay={
                      <div>
                        <div className="text-[11px] text-cyan-300 flex items-center gap-1 mb-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {act.location?.city} - {act.location?.primarySite}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white leading-tight">{act.name}</h3>
                      </div>
                    }
                  />

                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <ActivityCardAllProperties
                      activity={act}
                      equipments={equipments}
                      equipmentTypes={equipmentTypes}
                      terms={terms}
                    />

                    <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onEditActivity(act)}
                        className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل في المحرر</span>
                      </button>
                      {onViewActivity && (
                        <button
                          type="button"
                          onClick={() => onViewActivity(act)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                          title="معاينة كاملة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {pendingDeleteId === act.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteActivity(act.id);
                              setPendingDeleteId(null);
                              showNotification(terms.hubDeleteSuccessMessage);
                            }}
                            className="px-2.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(null)}
                            className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg transition cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(act.id)}
                          className="p-2 bg-slate-800 hover:bg-red-950/70 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                          title={terms.hubDeleteButtonTooltip}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Add Footer Card */}
          <div className="p-4 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
            <div>
              <p className="text-xs font-bold text-white">{terms.hubFooterQuestion}</p>
              <p className="text-[11px] text-slate-400">{terms.hubFooterSubtext}</p>
            </div>
            <button
              type="button"
              onClick={() => onAddNewActivity()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 hover:border-cyan-500 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>{terms.hubFooterCta}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
