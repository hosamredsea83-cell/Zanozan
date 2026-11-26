import React, { useMemo, useState } from 'react';
import { Activity, ActivityStatus } from '../../types/activity';
import { AppUser } from '../../types/auth';
import { EquipmentItem, EquipmentTypeDefinition } from '../../types/equipment';
import { 
  Search, MapPin, Clock, Users, ArrowUpRight, CheckCircle2, AlertCircle, 
  PauseCircle, Archive, Edit3, Eye, Copy, Filter, Sparkles, Trash2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { ActivityCardMediaGallery, ActivityCardAllProperties } from './ActivityCardSections';
import { activityBelongsToOwner } from '../../db/localActivitiesDb';
import {
  RegistryColumnFilterDropdown,
  RegistryFilterOption,
  RegistryFilterSummaryBar,
  RegistrySortIcon,
  useRegistryTableState
} from '../shared/RegistryTableControls';

type ActivityTableCol =
  | 'name'
  | 'location'
  | 'status'
  | 'priceEgp'
  | 'priceEur'
  | 'durationPax'
  | 'revenue';

const ACTIVITY_TABLE_COLUMNS: readonly ActivityTableCol[] = [
  'name',
  'location',
  'status',
  'priceEgp',
  'priceEur',
  'durationPax',
  'revenue'
];

const WIDE_ACTIVITY_COLS: readonly ActivityTableCol[] = ['name', 'location', 'durationPax'];

const ACTIVITY_DROPDOWN_TITLES: Record<ActivityTableCol, string> = {
  name: 'تحديد متعدد لاسم النشاط والتصنيف',
  location: 'تحديد متعدد للمدينة والموقع',
  status: 'تحديد متعدد لحالة النشاط',
  priceEgp: 'تحديد متعدد للسعر بالمصري (EGP)',
  priceEur: 'تحديد متعدد للسعر بالأجنبي (EUR)',
  durationPax: 'تحديد متعدد للمدة والسعة',
  revenue: 'تحديد متعدد للإيراد'
};

const STATUS_LABELS: Record<ActivityStatus, string> = {
  '': 'غير محدد',
  published: 'منشور ومتاح للحجز',
  pending_review: 'بانتظار مراجعة المنصة',
  paused: 'موقوف مؤقتاً',
  archived: 'مؤرشف',
  draft: 'مسودة غير مكتملة'
};

interface ActivityListProps {
  activities: Activity[];
  currentUser?: AppUser;
  onSelectActivity: (activity: Activity) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity?: (activityId: string) => void;
  onToggleStatus: (activityId: string, newStatus: ActivityStatus) => void;
  onCompareActivity: (activity: Activity) => void;
  selectedCompareIds: string[];
  equipments?: EquipmentItem[];
  equipmentTypes?: EquipmentTypeDefinition[];
}

export const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  currentUser,
  onSelectActivity,
  onEditActivity,
  onDeleteActivity,
  onToggleStatus,
  onCompareActivity,
  selectedCompareIds,
  equipments = [],
  equipmentTypes = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const tableState = useRegistryTableState<ActivityTableCol>(ACTIVITY_TABLE_COLUMNS);

  // Data Isolation: The current user sees their own activities + pending external supplier items they added until claimed
  const userActivities = currentUser
    ? activities.filter((act) => activityBelongsToOwner(act, currentUser))
    : activities;

  const filtered = userActivities.filter((act) => {
    const matchesSearch =
      act.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.location.primarySite.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.owner.companyName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || act.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || act.primaryCategory === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getDurationLabel = (act: Activity) =>
    `${act.duration.hours}س ${act.duration.minutes > 0 ? `${act.duration.minutes}د` : ''} · ${act.minPax}-${act.maxPax} فرد`;

  const columnOptionsMap = useMemo<Record<ActivityTableCol, RegistryFilterOption[]>>(() => {
    const nameCounts = new Map<string, { sub: string; count: number }>();
    const locCounts = new Map<string, { sub: string; count: number }>();
    const statusCounts = new Map<ActivityStatus, number>();
    const egpCounts = new Map<number, number>();
    const eurCounts = new Map<number, number>();
    const durCounts = new Map<string, number>();
    const revCounts = new Map<number, number>();

    filtered.forEach((act) => {
      const prevN = nameCounts.get(act.name);
      nameCounts.set(act.name, { sub: act.categoryPath.join(' › '), count: (prevN?.count || 0) + 1 });

      const locKey = `${act.location.city} · ${act.location.primarySite}`;
      locCounts.set(locKey, { sub: act.location.city, count: (locCounts.get(locKey)?.count || 0) + 1 });

      statusCounts.set(act.status, (statusCounts.get(act.status) || 0) + 1);
      egpCounts.set(act.pricing.egyptianB2C.adultEGP, (egpCounts.get(act.pricing.egyptianB2C.adultEGP) || 0) + 1);
      eurCounts.set(act.pricing.foreignerB2C.adultEUR, (eurCounts.get(act.pricing.foreignerB2C.adultEUR) || 0) + 1);

      const durKey = getDurationLabel(act);
      durCounts.set(durKey, (durCounts.get(durKey) || 0) + 1);
      revCounts.set(act.stats.revenueEUR, (revCounts.get(act.stats.revenueEUR) || 0) + 1);
    });

    return {
      name: Array.from(nameCounts.entries()).map(([val, m]) => ({ value: val, label: val, subLabel: m.sub, count: m.count })),
      location: Array.from(locCounts.entries()).map(([val, m]) => ({ value: val, label: val, count: m.count })),
      status: Array.from(statusCounts.entries()).map(([st, count]) => ({ value: st, label: STATUS_LABELS[st], count })),
      priceEgp: Array.from(egpCounts.entries()).sort((a, b) => a[0] - b[0]).map(([p, count]) => ({
        value: String(p),
        label: `${p.toLocaleString()} ج.م`,
        count
      })),
      priceEur: Array.from(eurCounts.entries()).sort((a, b) => a[0] - b[0]).map(([p, count]) => ({
        value: String(p),
        label: `€${p}`,
        dir: 'ltr',
        count
      })),
      durationPax: Array.from(durCounts.entries()).map(([val, count]) => ({ value: val, label: val, count })),
      revenue: Array.from(revCounts.entries()).sort((a, b) => a[0] - b[0]).map(([r, count]) => ({
        value: String(r),
        label: `€${r.toLocaleString()}`,
        dir: 'ltr',
        count
      }))
    };
  }, [filtered]);

  const tableFiltered = useMemo(() => {
    const { columnFilters: cf, selectedColumnFilters: scf, sortColumn, sortDirection } = tableState;
    const fName = cf.name.trim().toLowerCase();
    const fLoc = cf.location.trim().toLowerCase();
    const fStatus = cf.status.trim().toLowerCase();
    const fEgp = cf.priceEgp.trim().toLowerCase();
    const fEur = cf.priceEur.trim().toLowerCase();
    const fDur = cf.durationPax.trim().toLowerCase();
    const fRev = cf.revenue.trim().toLowerCase();

    const out = filtered.filter((act) => {
      if (scf.name.length > 0) {
        if (!scf.name.includes(act.name)) return false;
      } else if (fName && !`${act.name} ${act.categoryPath.join(' ')}`.toLowerCase().includes(fName)) {
        return false;
      }

      const locKey = `${act.location.city} · ${act.location.primarySite}`;
      if (scf.location.length > 0) {
        if (!scf.location.includes(locKey)) return false;
      } else if (fLoc && !locKey.toLowerCase().includes(fLoc)) {
        return false;
      }

      if (scf.status.length > 0) {
        if (!scf.status.includes(act.status)) return false;
      } else if (fStatus && !STATUS_LABELS[act.status].toLowerCase().includes(fStatus)) {
        return false;
      }

      const egpStr = String(act.pricing.egyptianB2C.adultEGP);
      if (scf.priceEgp.length > 0) {
        if (!scf.priceEgp.includes(egpStr)) return false;
      } else if (fEgp && !`${egpStr} ج.م`.toLowerCase().includes(fEgp)) {
        return false;
      }

      const eurStr = String(act.pricing.foreignerB2C.adultEUR);
      if (scf.priceEur.length > 0) {
        if (!scf.priceEur.includes(eurStr)) return false;
      } else if (fEur && !`€${eurStr}`.toLowerCase().includes(fEur)) {
        return false;
      }

      const durKey = getDurationLabel(act);
      if (scf.durationPax.length > 0) {
        if (!scf.durationPax.includes(durKey)) return false;
      } else if (fDur && !durKey.toLowerCase().includes(fDur)) {
        return false;
      }

      const revStr = String(act.stats.revenueEUR);
      if (scf.revenue.length > 0) {
        if (!scf.revenue.includes(revStr)) return false;
      } else if (fRev && !`€${revStr}`.toLowerCase().includes(fRev)) {
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
        case 'location':
          return a.location.city.localeCompare(b.location.city, 'ar') * dir;
        case 'status':
          return STATUS_LABELS[a.status].localeCompare(STATUS_LABELS[b.status], 'ar') * dir;
        case 'priceEgp':
          return (a.pricing.egyptianB2C.adultEGP - b.pricing.egyptianB2C.adultEGP) * dir;
        case 'priceEur':
          return (a.pricing.foreignerB2C.adultEUR - b.pricing.foreignerB2C.adultEUR) * dir;
        case 'durationPax':
          return ((a.duration.hours * 60 + a.duration.minutes) - (b.duration.hours * 60 + b.duration.minutes)) * dir;
        case 'revenue':
          return (a.stats.revenueEUR - b.stats.revenueEUR) * dir;
      }
    });
  }, [filtered, tableState.columnFilters, tableState.selectedColumnFilters, tableState.sortColumn, tableState.sortDirection]);

  const filterColumnsConfig: Array<{
    col: ActivityTableCol;
    placeholder: string;
    minWidth: string;
    dir?: 'ltr' | 'rtl';
    extraClass?: string;
    getLabel?: (v: string) => string;
  }> = [
    { col: 'name', placeholder: 'اختر أو اكتب النشاط...', minWidth: 'min-w-[140px]' },
    { col: 'location', placeholder: 'المدينة / الموقع...', minWidth: 'min-w-[125px]' },
    { col: 'status', placeholder: 'الحالة...', minWidth: 'min-w-[115px]', getLabel: (v) => STATUS_LABELS[v as ActivityStatus] || v },
    { col: 'priceEgp', placeholder: 'السعر EGP...', minWidth: 'min-w-[90px]', extraClass: 'text-left font-mono', getLabel: (v) => `${Number(v).toLocaleString()} ج.م` },
    { col: 'priceEur', placeholder: 'السعر EUR...', minWidth: 'min-w-[85px]', dir: 'ltr', extraClass: 'text-left font-mono', getLabel: (v) => `€${v}` },
    { col: 'durationPax', placeholder: 'المدة والسعة...', minWidth: 'min-w-[120px]', extraClass: 'text-center' },
    { col: 'revenue', placeholder: 'الإيراد...', minWidth: 'min-w-[85px]', dir: 'ltr', extraClass: 'text-left font-mono', getLabel: (v) => `€${Number(v).toLocaleString()}` }
  ];

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> منشور ومتاح للحجز
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> بانتظار مراجعة المنصة
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
            <PauseCircle className="w-3.5 h-3.5" /> موقوف مؤقتاً
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium">
            <Archive className="w-3.5 h-3.5" /> مؤرشف
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-slate-300 text-xs font-medium">
            مسودة غير مكتملة
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* User Context & Privacy Isolation Banner */}
      {currentUser && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${currentUser.avatarColor || 'bg-cyan-600'} text-white font-bold flex items-center justify-center text-sm shadow-inner shrink-0`}>
              {currentUser.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  أنشطة الحساب: {currentUser.name} ({currentUser.companyName})
                </h3>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded font-mono">
                  صلاحية المالك المباشر
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                وفقاً لضوابط الصلاحيات: تظهر هنا الأنشطة التي أضفتها بحسابك فقط ({userActivities.length} أنشطة). أنشطة الشركاء الآخرين تظهر فقط في <span className="text-cyan-400 font-semibold">&quot;متجر الأنشطة&quot;</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">باقة الاشتراك:</span>
            <span className="font-mono text-cyan-300 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {currentUser.tier}
            </span>
          </div>
        </div>
      )}

      {/* Overview & Highlights strip (Reflecting User's Activities Only) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">أنشطتك المسجلة</div>
          <div className="text-2xl font-bold font-mono text-white">{userActivities.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">المملوكة لحسابك الحالي</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">الأنشطة النشطة (منشورة)</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {userActivities.filter((a) => a.status === 'published').length}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">متاحة للحجز بمتجر الأنشطة</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">بانتظار تدقيق المنصة</div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {userActivities.filter((a) => a.status === 'pending_review').length}
          </div>
          <div className="text-[11px] text-amber-500/80 mt-1">أنشطة قيد المراجعة</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">مجموع إيرادات أنشطتك</div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            €{userActivities.reduce((acc, curr) => acc + curr.stats.revenueEUR, 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ≈ {userActivities.reduce((acc, curr) => acc + curr.stats.revenueEGP, 0).toLocaleString()} ج.م
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث بالاسم، المدينة (الغردقة، الجونة...)، أو مالك النشاط..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Category filter buttons */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                categoryFilter === 'all' ? 'bg-cyan-600/30 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setCategoryFilter('yacht')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                categoryFilter === 'yacht' ? 'bg-cyan-600/30 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              اليخوت
            </button>
            <button
              onClick={() => setCategoryFilter('safari')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                categoryFilter === 'safari' ? 'bg-cyan-600/30 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              السفاري
            </button>
            <button
              onClick={() => setCategoryFilter('diving')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                categoryFilter === 'diving' ? 'bg-cyan-600/30 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الغوص
            </button>
            <button
              onClick={() => setCategoryFilter('marine_trip')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                categoryFilter === 'marine_trip' ? 'bg-cyan-600/30 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              شبه غواصات
            </button>
          </div>
        </div>

        {/* Status segmented tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap ${
                statusFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الجميع ({userActivities.length})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap ${
                statusFilter === 'published' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              منشور ({userActivities.filter((a) => a.status === 'published').length})
            </button>
            <button
              onClick={() => setStatusFilter('pending_review')}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap ${
                statusFilter === 'pending_review' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              قيد المراجعة ({userActivities.filter((a) => a.status === 'pending_review').length})
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-md ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              title="عرض البطاقات"
            >
              بطاقات
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md ${viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              title="عرض الجدول الرقمي"
            >
              جدول
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filtered.map((activity) => {
            const isComparing = selectedCompareIds.includes(activity.id);

            return (
              <div
                key={activity.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col"
              >
                {/* Interactive Media Frame + All Sub-Images Gallery */}
                <ActivityCardMediaGallery
                  activity={activity}
                  aspectClass="aspect-[16/9]"
                  topLeftOverlay={
                    <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                      {getStatusBadge(activity.status)}
                    </div>
                  }
                  topRightOverlay={
                    <button
                      onClick={() => onCompareActivity(activity)}
                      className={`text-xs px-2.5 py-1 rounded-lg backdrop-blur-md transition-colors ${
                        isComparing
                          ? 'bg-cyan-500 text-slate-950 font-semibold'
                          : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      {isComparing ? '✓ بالمقارنة' : '+ قارن النشاط'}
                    </button>
                  }
                  bottomOverlay={
                    <div>
                      <div className="text-xs text-cyan-300 flex items-center gap-1.5 mb-1 font-medium">
                        <span>{activity.categoryPath.slice(-2).join(' ← ')}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {activity.location.country} / {activity.location.city}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-white leading-tight">
                        {activity.name}
                      </h3>
                    </div>
                  }
                />

                {/* Content Body: All Activity Properties */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <ActivityCardAllProperties
                    activity={activity}
                    equipments={equipments}
                    equipmentTypes={equipmentTypes}
                  />

                  {/* Rule 3 Audit Trail Stamp */}
                  {(activity.createdByName || activity.updatedByName) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 bg-slate-950/60 border border-slate-800/80 rounded-lg px-2.5 py-1.5">
                      {activity.createdByName && (
                        <span>
                          أضافه: <strong className="text-slate-200">{activity.createdByName}</strong>
                          {activity.createdAtTime ? (
                            <span className="font-mono text-slate-500 mr-1" dir="ltr">
                              ({activity.createdAtTime})
                            </span>
                          ) : null}
                        </span>
                      )}
                      {activity.updatedByName && (
                        <span>
                          آخر تعديل: <strong className="text-cyan-300">{activity.updatedByName}</strong>
                          {activity.updatedAtTime ? (
                            <span className="font-mono text-slate-500 mr-1" dir="ltr">
                              ({activity.updatedAtTime})
                            </span>
                          ) : null}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditActivity(activity)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>تعديل</span>
                      </button>

                      {onDeleteActivity && (
                        <button
                          onClick={() => setDeletingActivity(activity)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/40 rounded-lg transition-colors"
                          title="حذف هذا النشاط"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectActivity(activity)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="معاينة تفاصيل النشاط"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick status switch dropdown */}
                    <select
                      value={activity.status}
                      onChange={(e) => onToggleStatus(activity.id, e.target.value as ActivityStatus)}
                      aria-label="تغيير حالة النشاط"
                      className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500/40"
                    >
                      <option value="published">نشر (متاح للحجز)</option>
                      <option value="pending_review">طلب اعتماد المنصة</option>
                      <option value="paused">إيقاف مؤقت</option>
                      <option value="draft">مسودة داخلية</option>
                      <option value="archived">أرشفة</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High-Density Data Grid (Tabular Numerals + Multi-Select Column Filtering & Sorting) */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <RegistryFilterSummaryBar
            filteredCount={tableFiltered.length}
            totalCount={filtered.length}
            itemNoun="نشاط"
            sortColumn={tableState.sortColumn}
            sortDirection={tableState.sortDirection}
            hasActiveFilters={tableState.hasActiveFilters}
            onClearAll={tableState.handleClearAll}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">
                    <button type="button" onClick={() => tableState.handleToggleSort('name')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>اسم النشاط والتصنيف</span>
                      <RegistrySortIcon column="name" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button type="button" onClick={() => tableState.handleToggleSort('location')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>المدينة / الموقع</span>
                      <RegistrySortIcon column="location" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button type="button" onClick={() => tableState.handleToggleSort('status')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>الحالة</span>
                      <RegistrySortIcon column="status" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-left">
                    <button type="button" onClick={() => tableState.handleToggleSort('priceEgp')} className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>السعر مصري (EGP)</span>
                      <RegistrySortIcon column="priceEgp" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-left">
                    <button type="button" onClick={() => tableState.handleToggleSort('priceEur')} className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>السعر أجنبي (EUR)</span>
                      <RegistrySortIcon column="priceEur" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">
                    <button type="button" onClick={() => tableState.handleToggleSort('durationPax')} className="inline-flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>المدة والسعة</span>
                      <RegistrySortIcon column="durationPax" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-left">
                    <button type="button" onClick={() => tableState.handleToggleSort('revenue')} className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>الإيراد</span>
                      <RegistrySortIcon column="revenue" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">إجراءات</th>
                </tr>

                {/* Searchable Multi-Select Column Filter Row */}
                <tr className="bg-slate-900/90 border-t border-slate-800/80 font-normal normal-case">
                  {filterColumnsConfig.map(({ col, placeholder, minWidth, dir, extraClass = '', getLabel }) => {
                    const hasSelected = tableState.selectedColumnFilters[col].length > 0;
                    return (
                      <th key={col} className="p-2">
                        <input
                          ref={(el) => {
                            tableState.filterInputRefs.current[col] = el;
                          }}
                          type="text"
                          dir={dir}
                          placeholder={tableState.getSelectedSummaryPlaceholder(col, placeholder, getLabel)}
                          value={tableState.columnFilters[col]}
                          onFocus={() => {
                            tableState.updateDropdownPosition(col, WIDE_ACTIVITY_COLS);
                            tableState.setOpenDropdownCol(col);
                          }}
                          onClick={() => {
                            tableState.updateDropdownPosition(col, WIDE_ACTIVITY_COLS);
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
                              tableState.updateDropdownPosition(col, WIDE_ACTIVITY_COLS);
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
                  })}
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
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {tableFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 font-tajawal">
                      لا توجد أنشطة مطابقة للبحث أو فلاتر الأعمدة المحددة.
                    </td>
                  </tr>
                ) : (
                  tableFiltered.map((activity) => (
                    <tr key={activity.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-tajawal text-slate-200">
                        <div className="font-semibold text-sm line-clamp-1">{activity.name}</div>
                        <div className="text-[11px] text-slate-400">{activity.categoryPath.join(' › ')}</div>
                        {(activity.createdByName || activity.updatedByName) && (
                          <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-2">
                            {activity.createdByName && (
                              <span>
                                أضافه: <span className="text-slate-300">{activity.createdByName}</span>
                                {activity.createdAtTime ? ` (${activity.createdAtTime})` : ''}
                              </span>
                            )}
                            {activity.updatedByName && (
                              <span>
                                تعديل: <span className="text-cyan-300">{activity.updatedByName}</span>
                                {activity.updatedAtTime ? ` (${activity.updatedAtTime})` : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-tajawal text-slate-400">
                        <div>{activity.location.city}</div>
                        <div className="text-[10px] text-slate-500">{activity.location.primarySite}</div>
                      </td>
                      <td className="py-3 px-4 font-tajawal">{getStatusBadge(activity.status)}</td>
                      <td className="py-3 px-4 text-left font-bold text-white">
                        {activity.pricing.egyptianB2C.adultEGP.toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-4 text-left font-bold text-cyan-300">
                        €{activity.pricing.foreignerB2C.adultEUR}
                      </td>
                      <td className="py-3 px-4 text-center font-tajawal text-slate-400">
                        {activity.duration.hours}س {activity.duration.minutes > 0 ? `${activity.duration.minutes}د` : ''} · {activity.minPax}-{activity.maxPax} فرد
                      </td>
                      <td className="py-3 px-4 text-left text-emerald-400 font-bold">
                        €{activity.stats.revenueEUR.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-tajawal">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditActivity(activity)}
                            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-semibold transition-colors"
                          >
                            تحرير
                          </button>
                          {onDeleteActivity && (
                            <button
                              onClick={() => setDeletingActivity(activity)}
                              className="px-2 py-1 text-xs bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded font-semibold transition-colors"
                              title="حذف النشاط"
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {tableState.openDropdownCol && tableState.dropdownRect && (
            <RegistryColumnFilterDropdown
              activeCol={tableState.openDropdownCol}
              dropdownRect={tableState.dropdownRect}
              activeDropdownRef={tableState.activeDropdownRef}
              title={ACTIVITY_DROPDOWN_TITLES[tableState.openDropdownCol]}
              options={columnOptionsMap[tableState.openDropdownCol] || []}
              filterText={tableState.columnFilters[tableState.openDropdownCol]}
              selectedValues={tableState.selectedColumnFilters[tableState.openDropdownCol]}
              onToggleValue={tableState.handleToggleColumnFilterValue}
              onClearCol={tableState.handleClearCol}
              onClose={() => tableState.setOpenDropdownCol(null)}
            />
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingActivity && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-tajawal">
          <div className="bg-slate-900 border border-rose-900/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">تأكيد حذف النشاط</h4>
                <span className="text-xs text-rose-300 font-mono">هذا الإجراء نهائي ولا يمكن التراجع عنه</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف النشاط: <span className="font-bold text-white">&quot;{deletingActivity.name}&quot;</span>؟
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              طالما أنك المالك المباشر لهذا النشاط ({currentUser?.name})، فلديك كامل الصلاحية لحذفه وسينعكس ذلك بحذفه من قائمتك ومن متجر الأنشطة العام.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingActivity(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (onDeleteActivity) {
                    onDeleteActivity(deletingActivity.id);
                  }
                  setDeletingActivity(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تأكيد الحذف نهائياً</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
