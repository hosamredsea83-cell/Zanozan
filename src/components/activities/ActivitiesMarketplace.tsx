import React, { useState, useMemo } from 'react';
import { Activity, CentralCategoryType } from '../../types/activity';
import { 
  Store, Heart, GitCompare, Search, Filter, MapPin, Clock, Users, 
  DollarSign, Shield, Building2, User, Check, X, ArrowUpDown, 
  Sparkles, ExternalLink, SlidersHorizontal, CheckCircle2, ChevronDown
} from 'lucide-react';

import { AppUser } from '../../types/auth';
import { EquipmentItem, EquipmentTypeDefinition } from '../../types/equipment';
import { ActivityCardMediaGallery, ActivityCardAllProperties } from './ActivityCardSections';
import { PlatformPricingSettings, computeCustomerFinalPrice } from '../pricing/PricingToolManager';

interface ActivitiesMarketplaceProps {
  activities: Activity[];
  currentUser?: AppUser;
  favoriteIds: string[];
  onToggleFavorite: (activityId: string) => void;
  compareIds: string[];
  onToggleCompare: (activity: Activity) => void;
  onClearCompare: () => void;
  onSelectActivity: (activity: Activity) => void;
  onEditActivity?: (activity: Activity) => void;
  equipments?: EquipmentItem[];
  equipmentTypes?: EquipmentTypeDefinition[];
  platformPricingSettings?: PlatformPricingSettings;
}

export const ActivitiesMarketplace: React.FC<ActivitiesMarketplaceProps> = ({
  activities,
  currentUser,
  favoriteIds,
  onToggleFavorite,
  compareIds,
  onToggleCompare,
  onClearCompare,
  onSelectActivity,
  onEditActivity,
  equipments = [],
  equipmentTypes = [],
  platformPricingSettings
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'duration'>('recommended');
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);

  // Extract unique owners from all activities
  const uniqueOwners = useMemo(() => {
    const map = new Map<string, { id: string; name: string; companyName: string; tier: string }>();
    activities.forEach((act) => {
      if (act.owner?.name && !map.has(act.owner.name)) {
        map.set(act.owner.name, {
          id: act.owner.id || act.owner.name,
          name: act.owner.name,
          companyName: act.owner.companyName || 'منشأة سياحية معتمدة',
          tier: act.owner.tier || 'باقة الشركاء'
        });
      }
    });
    return Array.from(map.values());
  }, [activities]);

  // Extract unique cities
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    activities.forEach((act) => {
      if (act.location.city) set.add(act.location.city);
    });
    return Array.from(set);
  }, [activities]);

  // Filtered & Sorted activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = act.name.toLowerCase().includes(q);
        const matchesOwner = act.owner?.name?.toLowerCase().includes(q) || false;
        const matchesCompany = act.owner?.companyName?.toLowerCase().includes(q) || false;
        const matchesCity = act.location.city?.toLowerCase().includes(q) || false;
        const matchesSite = act.location.primarySite?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesOwner && !matchesCompany && !matchesCity && !matchesSite) {
          return false;
        }
      }

      // Owner filter
      if (selectedOwner !== 'all') {
        if (act.owner?.name !== selectedOwner) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (act.primaryCategory !== selectedCategory) return false;
      }

      // City filter
      if (selectedCity !== 'all') {
        if (act.location.city !== selectedCity) return false;
      }

      // Favorites only filter
      if (showFavoritesOnly) {
        if (!favoriteIds.includes(act.id)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') {
        return a.pricing.egyptianB2C.adultEGP - b.pricing.egyptianB2C.adultEGP;
      }
      if (sortBy === 'price_desc') {
        return b.pricing.egyptianB2C.adultEGP - a.pricing.egyptianB2C.adultEGP;
      }
      if (sortBy === 'duration') {
        const durA = (a.duration.hours * 60) + a.duration.minutes;
        const durB = (b.duration.hours * 60) + b.duration.minutes;
        return durB - durA;
      }
      return 0; // recommended default
    });
  }, [activities, searchQuery, selectedOwner, selectedCategory, selectedCity, showFavoritesOnly, favoriteIds, sortBy]);

  // Compared activities list
  const comparedActivities = useMemo(() => {
    return activities.filter((a) => compareIds.includes(a.id));
  }, [activities, compareIds]);

  const getCategoryLabel = (cat: CentralCategoryType) => {
    switch (cat) {
      case 'yacht':
        return 'يخوت بحرية فاخرة';
      case 'safari':
        return 'سفاري وصحراء';
      case 'diving':
        return 'غوص وسكوبا';
      case 'horse_riding':
        return 'خيول البحر الأحمر';
      case 'marine_trip':
        return 'رحلات بحرية';
      default:
        return 'نشاط سياحي';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-tajawal text-slate-100 pb-20">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                <Store className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                متجر الأنشطة السياحية (Activities Marketplace)
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              استكشف جميع الأنشطة والرحلات البحرية والبرية المعروضة من كافة أصحاب الأنشطة والشركاء المعتمدين بالمنصة، مع إمكانية المفضلة والمقارنة المباشرة.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Favorites Toggle Button */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                showFavoritesOnly
                  ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-950/40'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current text-white' : 'text-rose-400'}`} />
              <span>المفضلة</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900/80 text-[10px] font-mono">
                {favoriteIds.length}
              </span>
            </button>

            {/* Comparison Quick Button */}
            <button
              onClick={() => setShowComparisonModal(true)}
              disabled={compareIds.length === 0}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                compareIds.length > 0
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-950/40 hover:bg-cyan-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              <GitCompare className="w-4 h-4 text-cyan-300" />
              <span>مقارنة الأنشطة</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900/80 text-[10px] font-mono">
                {compareIds.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filters & Search Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، المالك، الشركة، أو المدينة..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Owner Filter */}
          <div>
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">جميع أصحاب الأنشطة ({uniqueOwners.length})</option>
              {uniqueOwners.map((owner) => (
                <option key={owner.id} value={owner.name}>
                  {owner.name} ({owner.companyName})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">جميع التصنيفات</option>
              <option value="yacht">يخوت بحرية</option>
              <option value="safari">سفاري وصحراء</option>
              <option value="diving">غوص وسكوبا</option>
              <option value="horse_riding">خيول شاطئية</option>
              <option value="marine_trip">رحلات بحرية</option>
            </select>
          </div>

          {/* City & Sort Filter */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="recommended">الترتيب: الموصى به</option>
              <option value="price_asc">السعر: من الأقل للأعلى</option>
              <option value="price_desc">السعر: من الأعلى للأقل</option>
              <option value="duration">المدة: الأطول أولاً</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tags Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-850 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>النتائج المعروضة:</span>
            <span className="font-bold text-white font-mono">{filteredActivities.length}</span>
            <span>نشاط سياحي</span>
            {showFavoritesOnly && (
              <span className="text-rose-400 font-semibold mr-1">
                (المفضلة فقط)
              </span>
            )}
            {selectedOwner !== 'all' && (
              <span className="text-cyan-400 font-semibold mr-1">
                · المالك: {selectedOwner}
              </span>
            )}
          </div>

          {(searchQuery || selectedOwner !== 'all' || selectedCategory !== 'all' || showFavoritesOnly) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedOwner('all');
                setSelectedCategory('all');
                setSelectedCity('all');
                setShowFavoritesOnly(false);
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* 3. Activities Grid */}
      {filteredActivities.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Store className="w-12 h-12 mx-auto text-slate-600 mb-2" />
          <h3 className="text-base font-bold text-white">لا توجد أنشطة مطابقة للبحث</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            لم نتمكن من العثور على أي نشاط يطابق الفلاتر المحددة. جرب اختيار صاحب نشاط آخر أو إلغاء تصفية المفضلة.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedOwner('all');
              setSelectedCategory('all');
              setShowFavoritesOnly(false);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
          >
            عرض جميع الأنشطة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredActivities.map((act) => {
            const isFav = favoriteIds.includes(act.id);
            const isCompared = compareIds.includes(act.id);
            const isOwnActivity = currentUser 
              ? (act.owner?.id === currentUser.id || act.owner?.name === currentUser.name)
              : false;

            return (
              <div
                key={act.id}
                className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-slate-700 group ${
                  isCompared ? 'border-cyan-500 ring-1 ring-cyan-500/50' : 'border-slate-800'
                }`}
              >
                {/* Interactive Image Cover + ALL Sub-Images Strip */}
                <ActivityCardMediaGallery
                  activity={act}
                  aspectClass="aspect-[16/9]"
                  topLeftOverlay={
                    <>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-cyan-300 border border-slate-800/80 shadow-md">
                        {getCategoryLabel(act.primaryCategory)}
                      </span>
                      {isOwnActivity ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold shadow-md">
                          نشاطك المباشر
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/80 text-slate-400 border border-slate-800 text-[10px] font-medium shadow-md">
                          مملوك لـ {act.owner.name.split(' ')[0]}
                        </span>
                      )}
                    </>
                  }
                  topRightOverlay={
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(act.id);
                      }}
                      className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                        isFav
                          ? 'bg-rose-500/90 text-white border-rose-400 shadow-lg shadow-rose-950/50 scale-105'
                          : 'bg-slate-950/70 text-slate-300 hover:text-white border-slate-800/80 hover:bg-slate-950'
                      }`}
                      title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current text-white' : ''}`} />
                    </button>
                  }
                  bottomOverlay={
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                        <span className="flex items-center gap-1 bg-slate-950/75 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-800/60">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{act.location.city} · {act.location.primarySite}</span>
                        </span>
                        <span className="flex items-center gap-1 bg-slate-950/75 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-800/60 font-mono">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{act.duration.hours} س {act.duration.minutes > 0 ? `${act.duration.minutes} د` : ''}</span>
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                        {act.name}
                      </h3>
                    </div>
                  }
                />

                {/* Card Body: Complete Properties & Actions */}
                <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  <ActivityCardAllProperties
                    activity={act}
                    equipments={equipments}
                    equipmentTypes={equipmentTypes}
                    clientViewOnly={!isOwnActivity}
                    platformPricingSettings={platformPricingSettings}
                  />

                  {/* Bottom Action Controls */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    {/* Compare Checkbox Button */}
                    <button
                      onClick={() => onToggleCompare(act)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors ${
                        isCompared
                          ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>{isCompared ? '✓ بالمقارنة' : '+ مقارنة'}</span>
                    </button>

                    {/* View Details / Edit Button */}
                    {isOwnActivity && onEditActivity ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEditActivity(act)}
                          className="py-2 px-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
                          title="تعديل هذا النشاط في لوحتك"
                        >
                          تعديل نشاطي
                        </button>
                        <button
                          onClick={() => onSelectActivity(act)}
                          className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors whitespace-nowrap"
                          title="معاينة التفاصيل"
                        >
                          معاينة
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onSelectActivity(act)}
                        className="py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
                      >
                        معاينة التفاصيل
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Floating Comparison Quick Bar (When 1+ activity is selected) */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 sm:inset-x-8 max-w-4xl mx-auto z-40 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">قائمة مقارنة الأنشطة المختارة</h4>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
                  {compareIds.length} أنشطة
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                قارن الأسعار والمواصفات الفنية والمعدات المشمولة وسياسات الإلغاء جنباً إلى جنب.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClearCompare}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              مسح التحديد
            </button>
            <button
              onClick={() => setShowComparisonModal(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
            >
              <GitCompare className="w-4 h-4" />
              <span>عرض جدول المقارنة التفصيلي</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Comprehensive Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                  <GitCompare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    جدول مقارنة الأنشطة السياحية المحددة ({comparedActivities.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    مقارنة المواصفات والأسعار ومسؤولية كل صاحب نشاط
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowComparisonModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content: Comparison Grid Table */}
            <div className="p-4 overflow-x-auto flex-1">
              {comparedActivities.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p>لم يتم اختيار أي أنشطة للمقارنة بعد. اختر نشاطين على الأقل من المتجر.</p>
                </div>
              ) : (
                <table className="w-full border-collapse text-xs text-right min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="p-3 text-slate-400 w-36 font-semibold bg-slate-950/50">المعيار / النشاط</th>
                      {comparedActivities.map((act) => (
                        <th key={act.id} className="p-3 text-white font-bold bg-slate-950/30">
                          <div className="space-y-1">
                            <span className="block text-cyan-400 text-sm">{act.name}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {act.owner.companyName}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {/* Owner & Company */}
                    <tr>
                      <td className="p-3 text-slate-400 font-medium bg-slate-950/40">صاحب النشاط والجهة</td>
                      {comparedActivities.map((act) => (
                        <td key={act.id} className="p-3">
                          <span className="font-bold text-white block">{act.owner.name}</span>
                          <span className="text-slate-400 text-[11px] block">{act.owner.companyName}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">{act.owner.tier}</span>
                        </td>
                      ))}
                    </tr>

                    {/* Category */}
                    <tr>
                      <td className="p-3 text-slate-400 font-medium bg-slate-950/40">تصنيف النشاط</td>
                      {comparedActivities.map((act) => (
                        <td key={act.id} className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-medium">
                            {getCategoryLabel(act.primaryCategory)}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Egyptian Pricing */}
                    <tr>
                      <td className="p-3 text-slate-400 font-medium bg-slate-950/40">سعر الفرد (مصريين)</td>
                      {comparedActivities.map((act) => {
                        const finalEgp =
                          act.pricing.egyptianB2C.adultEGP > 0
                            ? computeCustomerFinalPrice(act.pricing.egyptianB2C.adultEGP, platformPricingSettings, 'EGP').total
                            : 0;
                        return (
                          <td key={act.id} className="p-3 font-mono font-bold text-emerald-400">
                            {finalEgp.toLocaleString()} ج.م / بالغ
                          </td>
                        );
                      })}
                    </tr>

                    {/* Foreigner Pricing */}
                    <tr>
                      <td className="p-3 text-slate-400 font-medium bg-slate-950/40">سعر الفرد (أجانب)</td>
                      {comparedActivities.map((act) => {
                        const finalEur =
                          act.pricing.foreignerB2C.adultEUR > 0
                            ? computeCustomerFinalPrice(act.pricing.foreignerB2C.adultEUR, platformPricingSettings, 'EUR').total
                            : 0;
                        return (
                          <td key={act.id} className="p-3 font-mono font-bold text-cyan-300">
                            €{finalEur} / فرد
                          </td>
                        );
                      })}
                    </tr>

                    {/* Duration */}
                    <tr>
                      <td className="p-3 text-slate-400 font-medium bg-slate-950/40">مدة النشاط</td>
                      {comparedActivities.map((act) => (
                        <td key={act.id} className="p-3 text-slate-200 font-mono">
                          {act.duration.hours} ساعة {act.duration.minutes > 0 ? `و ${act.duration.minutes} دقيقة` : ''}
                        </td>
                      ))}
                    </tr>

                    {/* Capacity */}
                    <tr>
                      <td className="p-3 text-slate-400 font-medium bg-slate-950/40">السعة (Pax)</td>
                      {comparedActivities.map((act) => (
                        <td key={act.id} className="p-3 font-mono text-slate-300">
                          الحد الأدنى: {act.minPax} · الأقصى: {act.maxPax} فرد
                        </td>
                      ))}
                    </tr>

                    {/* Location & Departure */}
                    <tr>
                      <td className="p-3 text-slate-400 font-medium bg-slate-950/40">موقع الانطلاق</td>
                      {comparedActivities.map((act) => (
                        <td key={act.id} className="p-3 text-slate-300">
                          {act.location.city} — {act.location.primarySite}
                        </td>
                      ))}
                    </tr>

                    {/* Transport & Logistics */}
                    <tr>
                      <td className="p-3 text-slate-400 font-medium bg-slate-950/40">خدمات النقل</td>
                      {comparedActivities.map((act) => (
                        <td key={act.id} className="p-3">
                          {act.logistics.requiresTransfer ? (
                            <span className="text-emerald-400 font-medium">✓ متوفر من صاحب النشاط</span>
                          ) : (
                            <span className="text-slate-400">الوصول المباشر لنقطة البداية</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Included Inclusions */}
                    <tr>
                      <td className="p-3 text-slate-400 font-medium bg-slate-950/40">ما يشمله النشاط</td>
                      {comparedActivities.map((act) => (
                        <td key={act.id} className="p-3 text-slate-300 space-y-1">
                          {act.inclusions.meals.concat(act.inclusions.equipmentProvided).slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-[11px]">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </td>
                      ))}
                    </tr>

                    {/* Cancellation Policy */}
                    <tr>
                      <td className="p-3 text-slate-400 font-medium bg-slate-950/40">سياسة الإلغاء</td>
                      {comparedActivities.map((act) => (
                        <td key={act.id} className="p-3 text-slate-400 text-[11px]">
                          {act.cancellationPolicy.name}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <button
                onClick={onClearCompare}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                مسح جميع الأنشطة من المقارنة
              </button>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                إغلاق الجدول
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
