import React, { useState } from 'react';
import { Activity, ActivityMediaItem, CentralCategoryType, MetaField } from '../../types/activity';
import { EquipmentItem, EquipmentTypeDefinition } from '../../types/equipment';
import { PlatformPricingSettings, computeCustomerFinalPrice } from '../pricing/PricingToolManager';
import {
  ACTIVITY_TERMINOLOGY,
  type EntityTerminologyConfig
} from '../reference/creation/entityCreationTerminology';
import {
  MapPin,
  Clock,
  Users,
  Check,
  X,
  ShieldCheck,
  Truck,
  Sparkles,
  Image as ImageIcon,
  Video,
  Play,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Calendar,
  Tag,
  Layers,
  Anchor,
  AlertCircle,
  Utensils,
  Coffee,
  Wrench,
  Languages,
  PlusCircle,
  UserCheck,
  BarChart3,
  Radio,
  FileCheck2,
  Eye,
  EyeOff
} from 'lucide-react';

const DAY_LABELS: Record<string, string> = {
  sat: 'السبت',
  sun: 'الأحد',
  mon: 'الإثنين',
  tue: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس',
  fri: 'الجمعة'
};

const WAYPOINT_LABELS: Record<string, { label: string; color: string }> = {
  departure: { label: 'انطلاق', color: 'text-emerald-300 bg-emerald-950/60 border-emerald-800/50' },
  stopover: { label: 'توقف / نشاط', color: 'text-cyan-300 bg-cyan-950/60 border-cyan-800/50' },
  sightseeing: { label: 'مشاهدة', color: 'text-amber-300 bg-amber-950/60 border-amber-800/50' },
  return: { label: 'عودة', color: 'text-slate-300 bg-slate-800 border-slate-700' }
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  yacht: 'يخت',
  boat: 'قارب / لانش',
  atv_quad: 'بيتش باجي',
  diving_gear: 'معدات غوص',
  guide: 'مرشد / طاقم',
  vehicle: 'مركبة / خيل'
};

export const getCentralCategoryLabel = (cat: CentralCategoryType): string => {
  switch (cat) {
    case 'yacht':
      return 'رحلات اليخوت';
    case 'marine_trip':
      return 'شبه غواصات وقوارب زجاجية';
    case 'safari':
      return 'سفاري وصحراء';
    case 'diving':
      return 'غوص ورياضات مائية';
    case 'horse_riding':
      return 'فروسية وركوب خيل';
    default:
      return 'نشاط عام';
  }
};

const formatMetaValue = (field: MetaField): React.ReactNode => {
  if (field.type === 'boolean') {
    return field.value ? (
      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
        <Check className="w-3 h-3" /> نعم / متاح
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
        <X className="w-3 h-3 text-rose-400" /> لا / غير متاح
      </span>
    );
  }
  if (Array.isArray(field.value)) {
    return field.value.length > 0 ? field.value.join('، ') : '—';
  }
  if (field.value === '' || field.value === null || field.value === undefined) {
    return '—';
  }
  return String(field.value);
};

interface ActivityCardMediaGalleryProps {
  activity: Activity;
  aspectClass?: string;
  topLeftOverlay?: React.ReactNode;
  topRightOverlay?: React.ReactNode;
  bottomOverlay?: React.ReactNode;
  terms?: EntityTerminologyConfig;
}

export const ActivityCardMediaGallery: React.FC<ActivityCardMediaGalleryProps> = ({
  activity,
  aspectClass = 'aspect-[16/9]',
  topLeftOverlay,
  topRightOverlay,
  bottomOverlay,
  terms = ACTIVITY_TERMINOLOGY
}) => {
  const mediaList: ActivityMediaItem[] = activity.media || [];
  const defaultMedia =
    mediaList.find((m) => m.isCover && m.type === 'image') ||
    mediaList.find((m) => m.type === 'image') ||
    mediaList[0];

  const [activeMediaId, setActiveMediaId] = useState<string>(defaultMedia?.id || '');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeMedia =
    mediaList.find((m) => m.id === activeMediaId) || defaultMedia;

  const imageCount = mediaList.filter((m) => m.type === 'image').length;
  const videoCount = mediaList.filter((m) => m.type === 'video').length;

  const activeIndex = mediaList.findIndex((m) => m.id === activeMedia?.id);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mediaList.length <= 1) return;
    const prevIdx = (activeIndex - 1 + mediaList.length) % mediaList.length;
    setActiveMediaId(mediaList[prevIdx].id);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mediaList.length <= 1) return;
    const nextIdx = (activeIndex + 1) % mediaList.length;
    setActiveMediaId(mediaList[nextIdx].id);
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800">
      {/* Main Media Frame */}
      <div className={`relative ${aspectClass} w-full bg-slate-950 overflow-hidden group`}>
        {activeMedia ? (
          activeMedia.type === 'image' ? (
            <img
              src={activeMedia.url}
              alt={activeMedia.title || activity.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-200 p-6 text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Play className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white">{activeMedia.title || terms.cardMediaDefaultVideoTitle}</span>
              {activeMedia.youtubeUrl && (
                <a
                  href={activeMedia.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] px-3 py-1 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition-colors"
                >
                  تشغيل الفيديو الخارجي (YouTube)
                </a>
              )}
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-950 text-xs">
            لا توجد صور مرفوعة
          </div>
        )}

        {/* Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Top Overlays */}
        {(topLeftOverlay || topRightOverlay) && (
          <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-1.5 flex-wrap">{topLeftOverlay}</div>
            <div className="flex items-center gap-1.5">{topRightOverlay}</div>
          </div>
        )}

        {/* Prev / Next Navigation Buttons when multiple media exist */}
        {mediaList.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-950/80 hover:bg-cyan-600 text-white border border-slate-700 flex items-center justify-center transition-colors shadow-lg"
              title="الصورة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-950/80 hover:bg-cyan-600 text-white border border-slate-700 flex items-center justify-center transition-colors shadow-lg"
              title="الصورة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Expand Lightbox Button */}
        {activeMedia && activeMedia.type === 'image' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            className="absolute bottom-3 left-3 z-10 p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-colors"
            title="تكبير الصورة الحالية"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Bottom Overlay */}
        {bottomOverlay && (
          <div className="absolute bottom-3 right-3 left-12 z-10">{bottomOverlay}</div>
        )}
      </div>

      {/* ALL Sub-Images Strip & Gallery */}
      <div className="p-3 bg-slate-950/95 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>جميع الصور والوسائط الفرعية ({mediaList.length})</span>
          </span>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>{imageCount} صور</span>
            {videoCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-rose-300">{videoCount} فيديو</span>
              </>
            )}
          </div>
        </div>

        {mediaList.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {mediaList.map((item, index) => {
              const isSelected = activeMedia?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveMediaId(item.id)}
                  className={`relative rounded-lg overflow-hidden border text-right transition-all group/thumb bg-slate-900 ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                  title={item.title || `وسيط ${index + 1}`}
                >
                  <div className="aspect-[16/10] w-full bg-slate-950 overflow-hidden relative">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.title || `صورة ${index + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-rose-400 gap-0.5">
                        <Video className="w-4 h-4" />
                        <span className="text-[9px] font-bold">فيديو</span>
                      </div>
                    )}

                    {/* Cover vs Sub-image tag */}
                    <span
                      className={`absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        item.isCover
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-950/85 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {item.isCover ? 'الغلاف' : `فرعية ${index + 1}`}
                    </span>
                  </div>

                  <div className="px-1.5 py-1 bg-slate-900/95 border-t border-slate-800/80">
                    <span className="block text-[10px] text-slate-300 truncate">
                      {item.title || (item.isCover ? 'الصورة الرئيسية' : `صورة فرعية #${index + 1}`)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 py-2 text-center bg-slate-900/50 rounded-lg border border-slate-800">
            {terms.cardMediaEmptySubImages}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox for Inspecting Sub-Images */}
      {lightboxOpen && activeMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="text-xs">
                <span className="font-bold text-white block">{activity.name}</span>
                <span className="text-cyan-400">{activeMedia.title || 'معاينة الصورة'}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-black flex items-center justify-center max-h-[70vh] overflow-hidden relative">
              {activeMedia.type === 'image' ? (
                <img
                  src={activeMedia.url}
                  alt={activeMedia.title || activity.name}
                  className="max-h-[70vh] w-auto object-contain"
                />
              ) : (
                <div className="py-16 text-center space-y-2">
                  <Video className="w-10 h-10 text-rose-400 mx-auto" />
                  <p className="text-sm text-white font-bold">{activeMedia.title}</p>
                </div>
              )}
            </div>
            {mediaList.length > 1 && (
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
                {mediaList.map((m, idx) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMediaId(m.id)}
                    className={`w-20 shrink-0 rounded-lg overflow-hidden border transition-all ${
                      m.id === activeMedia.id ? 'border-cyan-400 ring-2 ring-cyan-400/50' : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {m.type === 'image' ? (
                      <img src={m.url} alt={m.title || `صورة ${idx + 1}`} className="w-full h-12 object-cover" />
                    ) : (
                      <div className="w-full h-12 bg-slate-900 flex items-center justify-center text-rose-400">
                        <Video className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ActivityCardAllPropertiesProps {
  activity: Activity;
  showStatsAndChannels?: boolean;
  equipments?: EquipmentItem[];
  equipmentTypes?: EquipmentTypeDefinition[];
  clientViewOnly?: boolean;
  platformPricingSettings?: PlatformPricingSettings;
  terms?: EntityTerminologyConfig;
}

export const ActivityCardAllProperties: React.FC<ActivityCardAllPropertiesProps> = ({
  activity,
  showStatsAndChannels = true,
  equipments = [],
  equipmentTypes = [],
  clientViewOnly = false,
  platformPricingSettings,
  terms = ACTIVITY_TERMINOLOGY
}) => {
  const [customerCategory, setCustomerCategory] = useState<'all' | 'egyptian' | 'foreigner' | 'b2b'>('all');
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const {
    categoryPath = [],
    primaryCategory,
    duration,
    location,
    minPax,
    maxPax,
    slots = [],
    pricing,
    seasonalDiscounts = [],
    metaGroups = [],
    inclusions,
    logistics,
    resources = [],
    safetyRules,
    cancellationPolicy,
    approvalDeadlineHours,
    paymentDeadlineHours,
    channels,
    owner,
    stats,
    translations
  } = activity;

  const activeLanguages: string[] = ['العربية'];
  if (translations?.en?.name) activeLanguages.push('الإنجليزية');
  if (translations?.ru?.name) activeLanguages.push('الروسية');
  if (translations?.de?.name) activeLanguages.push('الألمانية');

  const enabledChannels = [
    channels?.ownerStorefront && 'واجهة المالك',
    channels?.tourismMarketplace && 'سوق المنصة العام',
    channels?.b2bAgencies && 'بوابة الوكلاء B2B',
    channels?.b2cCustomers && 'الأفراد B2C'
  ].filter(Boolean) as string[];

  const selectedProps = activity.selectedPricingProperties ?? [];
  const ageTiersRule = activity.dynamicPricing?.activeRules?.find((r) => r.rule_type === 'age_tiers');
  const selectedAdult = selectedProps.find((p) => p.category === 'adult');
  const selectedChild = selectedProps.find((p) => p.category === 'child');
  const selectedInfant = selectedProps.find((p) => p.category === 'infant');

  const formatAgeYears = (n: number) => (n >= 3 && n <= 10 ? 'سنوات' : 'سنة');
  const adultLabel = selectedAdult?.displayLabel || 'بالغ';
  const childLabel =
    selectedChild?.displayLabel ||
    (ageTiersRule?.config?.childMaxAge
      ? `طفل (${ageTiersRule.config.childMinAge ?? 4}–${ageTiersRule.config.childMaxAge} ${formatAgeYears(ageTiersRule.config.childMaxAge)})`
      : 'طفل');
  const infantLabel =
    selectedInfant?.displayLabel ||
    (ageTiersRule?.config?.infantMaxAge
      ? `رضيع أقل من ${ageTiersRule.config.infantMaxAge} ${formatAgeYears(ageTiersRule.config.infantMaxAge)}`
      : 'رضيع');
  const formatPriceOrFree = (amount: number, suffix = '', prefix = '') =>
    amount === 0 ? 'مجاني' : `${prefix}${amount.toLocaleString()}${suffix}`;

  return (
    <div className="space-y-3 text-xs">
      {/* 1. التصنيف، الوصف الكامل، اللغات، والمدة/السعة */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-2">
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-semibold">
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{categoryPath.length > 0 ? categoryPath.join(' ← ') : getCentralCategoryLabel(primaryCategory)}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            التصنيف: {getCentralCategoryLabel(primaryCategory)}
          </span>
        </div>

        {activity.summary && (
          <p className="text-xs font-semibold text-cyan-200/90 leading-relaxed">
            {activity.summary}
          </p>
        )}

        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
          {activity.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
          <div className="bg-slate-900/70 rounded-lg p-2 border border-slate-800/60">
            <span className="text-slate-400 block text-[10px]">المدة الإجمالية</span>
            <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-amber-400" />
              {duration.days > 0 ? `${duration.days} يوم · ` : ''}
              {duration.hours} ساعة {duration.minutes > 0 ? `${duration.minutes} دقيقة` : ''}
            </span>
          </div>

          <div className="bg-slate-900/70 rounded-lg p-2 border border-slate-800/60">
            <span className="text-slate-400 block text-[10px]">السعة التشغيلية (Pax)</span>
            <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3 text-cyan-400" />
              من {minPax} إلى {maxPax} فرد
            </span>
          </div>

          <div className="bg-slate-900/70 rounded-lg p-2 border border-slate-800/60">
            <span className="text-slate-400 block text-[10px]">لغات المحتوى المتاحة</span>
            <span className="text-slate-200 font-semibold flex items-center gap-1 mt-0.5">
              <Globe className="w-3 h-3 text-emerald-400" />
              {activeLanguages.join('، ')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. جميع الخصائص والمواصفات الفنية (metaGroups) */}
      {(() => {
        const visibleMetaGroups = (clientViewOnly
          ? metaGroups
              .map((group) => ({
                ...group,
                fields: group.fields.filter((field) => field.isPublicForClient)
              }))
              .filter((group) => group.fields.length > 0)
          : metaGroups);
        const visibleFieldsCount = visibleMetaGroups.reduce((acc, g) => acc + g.fields.length, 0);

        return (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{terms.cardSpecsHeaderTitle}</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded">
                {visibleFieldsCount} خاصية
              </span>
            </div>

            {visibleMetaGroups.length > 0 ? (
              <div className="space-y-2.5">
                {visibleMetaGroups.map((group) => (
                  <div key={group.id} className="bg-slate-900/70 border border-slate-800/70 rounded-lg p-2.5 space-y-2">
                    <div className="text-[11px] font-bold text-cyan-300 border-b border-slate-800/70 pb-1">
                      {group.title}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.fields.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/70 text-[11px]"
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-slate-400 truncate" title={field.label}>
                              {field.label}:
                            </span>
                            {!clientViewOnly && !field.isPublicForClient && (
                              <span className="text-[9px] px-1 rounded bg-slate-800 text-amber-300 shrink-0">
                                داخلي
                              </span>
                            )}
                          </div>
                          <span className="text-white font-semibold font-mono text-left shrink-0">
                            {formatMetaValue(field)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 bg-slate-900/40 rounded-lg p-2 border border-slate-800/50">
                {clientViewOnly
                  ? 'لا توجد مواصفات عامة معلنة حالياً.'
                  : 'لا توجد خصائص فنية إضافية مسجلة في مكتبة المواصفات.'}
              </div>
            )}
          </div>
        );
      })()}

      {/* 3. التسعير المعتمد الكامل (B2C + B2B + VIP + الخصومات الموسمية) */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-white text-xs flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            <span>مصفوفة التسعير والفئات العمرية ({clientViewOnly ? 'أسعار العميل' : 'أفراد B2C / شركات B2B'})</span>
          </span>
          <div className="flex flex-wrap items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
            {(
              [
                { id: 'all', label: 'الكل' },
                { id: 'egyptian', label: 'عميل مصري' },
                { id: 'foreigner', label: 'عميل أجنبي' },
                ...(!clientViewOnly ? [{ id: 'b2b' as const, label: 'شركات B2B' }] : [])
              ] as const
            ).map((tab) => {
              const effectiveTab = clientViewOnly && customerCategory === 'b2b' ? 'all' : customerCategory;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCustomerCategory(tab.id)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    effectiveTab === tab.id
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* الفئات العمرية المختارة والمحفوظة لهذا النشاط */}
        {(() => {
          const effectiveCustomerCategory =
            clientViewOnly && customerCategory === 'b2b' ? 'all' : customerCategory;
          const toDisplayEgp = (base: number) =>
            clientViewOnly && base > 0
              ? computeCustomerFinalPrice(base, platformPricingSettings, 'EGP').total
              : base;
          const toDisplayEur = (base: number) =>
            clientViewOnly && base > 0
              ? computeCustomerFinalPrice(base, platformPricingSettings, 'EUR').total
              : base;

          const adultEgpVal = toDisplayEgp(pricing.egyptianB2C.adultEGP);
          const childEgpVal = toDisplayEgp(pricing.egyptianB2C.childEGP);
          const infantEgpVal = toDisplayEgp(pricing.egyptianB2C.infantEGP);
          const privTotalEgpVal = pricing.egyptianB2C.privateTotalEGP
            ? toDisplayEgp(pricing.egyptianB2C.privateTotalEGP)
            : 0;
          const privPerPersonEgpVal = pricing.egyptianB2C.privatePerPersonEGP
            ? toDisplayEgp(pricing.egyptianB2C.privatePerPersonEGP)
            : 0;

          const adultEurVal = toDisplayEur(pricing.foreignerB2C.adultEUR);
          const childEurVal = toDisplayEur(pricing.foreignerB2C.childEUR);
          const infantEurVal = toDisplayEur(pricing.foreignerB2C.infantEUR);
          const privTotalEurVal = pricing.foreignerB2C.privateTotalEUR
            ? toDisplayEur(pricing.foreignerB2C.privateTotalEUR)
            : 0;
          const privPerPersonEurVal = pricing.foreignerB2C.privatePerPersonEUR
            ? toDisplayEur(pricing.foreignerB2C.privatePerPersonEUR)
            : 0;

          const adultB2bEgpVal = toDisplayEgp(pricing.egyptianB2B?.adultEGP ?? 0);
          const childB2bEgpVal = toDisplayEgp(pricing.egyptianB2B?.childEGP ?? 0);
          const infantB2bEgpVal = toDisplayEgp(pricing.egyptianB2B?.infantEGP ?? 0);

          const adultB2bEurVal = toDisplayEur(pricing.foreignerB2B?.adultEUR ?? 0);
          const childB2bEurVal = toDisplayEur(pricing.foreignerB2B?.childEUR ?? 0);
          const infantB2bEurVal = toDisplayEur(pricing.foreignerB2B?.infantEUR ?? 0);

          const showEgyptianB2C = effectiveCustomerCategory === 'all' || effectiveCustomerCategory === 'egyptian';
          const showForeignerB2C = effectiveCustomerCategory === 'all' || effectiveCustomerCategory === 'foreigner';
          const showB2B = !clientViewOnly && (effectiveCustomerCategory === 'b2b' || effectiveCustomerCategory === 'all');

          return (
            <>
              {/* B2C Row */}
              {(showEgyptianB2C || showForeignerB2C) && (
                <div className={`grid grid-cols-1 ${showEgyptianB2C && showForeignerB2C ? 'sm:grid-cols-2' : ''} gap-2`}>
                  {showEgyptianB2C && (
                    <div className="bg-slate-900/80 border border-cyan-500/25 rounded-lg p-2.5 space-y-1">
                      <div className="text-[10px] text-cyan-300 font-semibold">عميل مصري — {adultLabel} (EGP)</div>
                      <div className="text-sm font-bold font-mono text-white">
                        {adultEgpVal.toLocaleString()} ج.م <span className="text-[10px] text-slate-400 font-normal">/ {adultLabel}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">
                        {childLabel}: {formatPriceOrFree(childEgpVal, ' ج.م')} · {infantLabel}:{' '}
                        {formatPriceOrFree(infantEgpVal, ' ج.م')}
                      </div>
                      {(pricing.egyptianB2C.privateTotalEGP || pricing.egyptianB2C.privatePerPersonEGP) && (
                        <div className="text-[10px] text-amber-300 font-mono pt-1 border-t border-slate-800">
                          خاص VIP:{' '}
                          {privTotalEgpVal
                            ? `${privTotalEgpVal.toLocaleString()} ج.م (مجموعة)`
                            : `${privPerPersonEgpVal.toLocaleString()} ج.م / فرد (أدنى ${pricing.egyptianB2C.privatePerPersonMinPax || 1})`}
                        </div>
                      )}
                    </div>
                  )}

                  {showForeignerB2C && (
                    <div className="bg-slate-900/80 border border-amber-500/25 rounded-lg p-2.5 space-y-1">
                      <div className="text-[10px] text-amber-300 font-semibold">عميل أجنبي — {adultLabel} (EUR)</div>
                      <div className="text-sm font-bold font-mono text-cyan-300">
                        €{adultEurVal.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ {adultLabel}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">
                        {childLabel}: {formatPriceOrFree(childEurVal, '', '€')} · {infantLabel}:{' '}
                        {formatPriceOrFree(infantEurVal, '', '€')}
                      </div>
                      {(pricing.foreignerB2C.privateTotalEUR || pricing.foreignerB2C.privatePerPersonEUR) && (
                        <div className="text-[10px] text-amber-300 font-mono pt-1 border-t border-slate-800">
                          خاص VIP:{' '}
                          {privTotalEurVal
                            ? `€${privTotalEurVal} (مجموعة)`
                            : `€${privPerPersonEurVal} / فرد (أدنى ${pricing.foreignerB2C.privatePerPersonMinPax || 1})`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* B2B Row: للشركات يظهر البالغ المصري والأجنبي معاً */}
              {showB2B && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900/70 border border-cyan-500/25 rounded-lg p-2.5 space-y-1">
                    <span className="text-[10px] text-cyan-300 font-semibold block">شركات B2B — بند المصريين (ج.م)</span>
                    <div className="text-xs font-mono font-bold text-emerald-300">
                      {adultLabel}: {adultB2bEgpVal.toLocaleString()} ج.م
                    </div>
                    <div className="font-mono text-slate-300 text-[10px]">
                      {childLabel}: {formatPriceOrFree(childB2bEgpVal, ' ج.م')} · {infantLabel}:{' '}
                      {formatPriceOrFree(infantB2bEgpVal, ' ج.م')}
                    </div>
                  </div>
                  <div className="bg-slate-900/70 border border-amber-500/25 rounded-lg p-2.5 space-y-1">
                    <span className="text-[10px] text-amber-300 font-semibold block">شركات B2B — بند الأجانب (€)</span>
                    <div className="text-xs font-mono font-bold text-cyan-300">
                      {adultLabel}: €{adultB2bEurVal.toLocaleString()}
                    </div>
                    <div className="font-mono text-slate-300 text-[10px]">
                      {childLabel}: {formatPriceOrFree(childB2bEurVal, '', '€')} · {infantLabel}:{' '}
                      {formatPriceOrFree(infantB2bEurVal, '', '€')}
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* Seasonal Discounts */}
        {seasonalDiscounts.length > 0 && (
          <div className="pt-1.5 border-t border-slate-800/70 space-y-1">
            <span className="text-[10px] text-amber-300 font-bold block">العروض والخصومات الموسمية النشطة:</span>
            <div className="flex flex-wrap gap-1.5">
              {seasonalDiscounts.map((disc) => (
                <div
                  key={disc.id}
                  className="text-[10px] bg-amber-950/40 border border-amber-800/40 text-amber-200 px-2 py-1 rounded-lg flex items-center gap-1.5"
                >
                  <span className="font-bold">{disc.title}</span>
                  <span className="font-mono text-amber-300">
                    ({disc.discountType === 'percentage' ? `${disc.valueEGP}% / ${disc.valueEUR}%` : `${disc.valueEGP} ج.م / €${disc.valueEUR}`})
                  </span>
                  <span className="text-slate-400 font-mono">[{disc.startDate} ← {disc.endDate}]</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. الموقع الجغرافي وخط السير + مواعيد الانطلاق */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Location & Itinerary */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>الموقع وخط السير ({location.itinerary.length} محطات)</span>
            </span>
            {!clientViewOnly && location.coordinates && (
              <span className="text-[10px] font-mono text-slate-400">
                {location.coordinates.lat.toFixed(3)}, {location.coordinates.lng.toFixed(3)}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-300 bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
            <span className="font-bold text-cyan-300">{location.country} / {location.city}</span> — {location.primarySite}
          </div>
          {location.itinerary.length > 0 && (
            <div className="space-y-1.5">
              {location.itinerary.map((wp, idx) => {
                const wpMeta = WAYPOINT_LABELS[wp.type] || WAYPOINT_LABELS.stopover;
                return (
                  <div key={wp.id || idx} className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-cyan-300 font-mono text-[10px] flex items-center justify-center shrink-0">
                          {wp.order || idx + 1}
                        </span>
                        <span>{wp.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${wpMeta.color}`}>
                          {wpMeta.label}
                        </span>
                        {wp.type === 'departure' ? (
                          wp.departureTime ? (
                            <span className="text-[10px] font-mono text-emerald-300">ذهاب {wp.departureTime}</span>
                          ) : null
                        ) : wp.type === 'return' ? (
                          wp.returnTime ? (
                            <span className="text-[10px] font-mono text-rose-300">عودة {wp.returnTime}</span>
                          ) : null
                        ) : wp.durationMinutes ? (
                          <span className="text-[10px] font-mono text-slate-400">{wp.durationMinutes}د</span>
                        ) : null}
                      </div>
                    </div>
                    {wp.description && (
                      <p className="text-[10px] text-slate-400 mt-1 pr-5">{wp.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Time Slots */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>مواعيد الانطلاق والسعة المتاحة ({slots.length})</span>
            </span>
          </div>
          {slots.length > 0 ? (
            <div className="space-y-1.5">
              {slots.map((slot) => (
                <div key={slot.id} className="bg-slate-900/70 border border-slate-800/70 rounded-lg p-2 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white">{slot.timeLabel}</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                      slot.availableCount > 0
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                        : 'bg-rose-950/70 text-rose-300 border border-rose-800/50'
                    }`}>
                      متاح {slot.availableCount} / {slot.maxCapacity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    أيام التشغيل: {slot.operatingDays.map((d) => DAY_LABELS[d] || d).join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 py-2">حسب الطلب والحجز المسبق</div>
          )}

          {/* Resources (Internal operational only — never shown to clients) */}
          {!clientViewOnly && (
            <div className="pt-2 border-t border-slate-800/70 space-y-1.5">
              <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5 text-cyan-400" />
                <span>الموارد والمعدات التشغيلية المخصصة ({resources.length})</span>
              </span>
              {resources.length > 0 ? (
                <div className="space-y-1">
                  {resources.map((res) => (
                    <div key={res.id} className="flex items-center justify-between bg-slate-900/50 border border-slate-800/60 rounded-lg px-2 py-1 text-[10px]">
                      <span className="text-slate-200 font-medium">
                        {res.name} <span className="text-slate-500">({RESOURCE_TYPE_LABELS[res.type] || res.type})</span>
                      </span>
                      <span className="font-mono text-cyan-300 shrink-0">
                        مطلوب {res.quantityRequired} / متاح {res.quantityAvailableTotal}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 block">لا توجد موارد مقيدة</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. المشمولات وغير المشمولات والإضافات المدفوعة */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
        <span className="font-bold text-white text-xs flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>تفاصيل المشمولات والخدمات والإضافات</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2 space-y-1">
            <span className="text-emerald-300 font-semibold flex items-center gap-1 text-[10px]">
              <Utensils className="w-3 h-3" /> الوجبات المشمولة:
            </span>
            <p className="text-slate-300">
              {inclusions.meals.length > 0 ? inclusions.meals.join(' · ') : 'غير متضمن وجبات'}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2 space-y-1">
            <span className="text-cyan-300 font-semibold flex items-center gap-1 text-[10px]">
              <Coffee className="w-3 h-3" /> المشروبات:
            </span>
            <p className="text-slate-300">
              {inclusions.drinks.length > 0 ? inclusions.drinks.join(' · ') : 'غير محدد'}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2 space-y-1">
            <span className="text-amber-300 font-semibold flex items-center gap-1 text-[10px]">
              <Wrench className="w-3 h-3" /> المعدات والأدوات المقدمة:
            </span>
            <p className="text-slate-300">
              {inclusions.equipmentProvided.length > 0 ? inclusions.equipmentProvided.join(' · ') : 'لا توجد معدات إضافية'}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2 space-y-1">
            <span className="text-purple-300 font-semibold flex items-center gap-1 text-[10px]">
              <Languages className="w-3 h-3" /> لغات الإرشاد والمرافقة:
            </span>
            <p className="text-slate-300">
              {inclusions.guideLanguage.length > 0 ? inclusions.guideLanguage.join('، ') : 'العربية'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-2 space-y-1">
            <span className="text-rose-300 font-semibold flex items-center gap-1 text-[10px]">
              <AlertCircle className="w-3 h-3" /> غير مشمول في السعر:
            </span>
            <p className="text-slate-300">
              {inclusions.notIncluded.length > 0 ? inclusions.notIncluded.join(' · ') : terms.notIncludedFallbackText}
            </p>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-cyan-300 font-semibold flex items-center gap-1 text-[10px]">
                <PlusCircle className="w-3 h-3" /> إضافات اختيارية مدفوعة ({inclusions.paidAddons.length}):
              </span>
              <span className="text-[9px] text-slate-400">
                {clientViewOnly ? 'حدد الإضافات المطلوبة عند الدفع' : 'متاحة للعميل عند الدفع'}
              </span>
            </div>
            {inclusions.paidAddons.length > 0 ? (
              <div className="space-y-1.5">
                {inclusions.paidAddons.map((addon) => {
                  const qty = addonQuantities[addon.id] || 0;
                  const isChecked = qty > 0;
                  const setQty = (nextQty: number) => {
                    const safeQty = Math.max(0, Math.floor(nextQty) || 0);
                    setAddonQuantities((prev) => {
                      const next = { ...prev };
                      if (safeQty <= 0) delete next[addon.id];
                      else next[addon.id] = safeQty;
                      return next;
                    });
                  };
                  return (
                    <div
                      key={addon.id}
                      onClick={() => setQty(isChecked ? 0 : 1)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setQty(isChecked ? 0 : 1);
                        }
                      }}
                      className={`w-full flex flex-wrap items-center justify-between gap-2 text-[10px] px-2.5 py-2 rounded-lg border text-right transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'bg-slate-950 border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <span className="truncate font-semibold">{addon.title}</span>
                        {addon.unitLabel && (
                          <span className="text-[9px] text-slate-400 shrink-0">
                            ({addon.unitLabel})
                          </span>
                        )}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {isChecked && (
                          <div
                            className="inline-flex items-center gap-1 bg-slate-950/90 border border-emerald-500/40 rounded-md px-1 py-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setQty(qty - 1)}
                              className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
                              aria-label="إنقاص الكمية"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={qty}
                              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                              className="w-9 bg-transparent text-center font-mono text-[10px] font-bold text-white focus:outline-none tabular-nums"
                              aria-label={`كمية ${addon.title}`}
                            />
                            <button
                              type="button"
                              onClick={() => setQty(qty + 1)}
                              className="w-4 h-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center cursor-pointer"
                              aria-label="زيادة الكمية"
                            >
                              +
                            </button>
                          </div>
                        )}
                        <span className="font-mono text-cyan-300 tabular-nums">
                          {isChecked
                            ? `+${(addon.priceEGP * qty).toLocaleString()} ج.م / €${(addon.priceEUR * qty).toLocaleString()}`
                            : `+${addon.priceEGP} ج.م / €${addon.priceEUR}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(addonQuantities).length > 0 && (() => {
                  const chosen = inclusions.paidAddons
                    .filter((a) => (addonQuantities[a.id] || 0) > 0)
                    .map((a) => ({ addon: a, qty: addonQuantities[a.id] || 0 }));
                  const totalUnits = chosen.reduce((sum, item) => sum + item.qty, 0);
                  const extraEgp = chosen.reduce((sum, item) => sum + (item.addon.priceEGP || 0) * item.qty, 0);
                  const extraEur = chosen.reduce((sum, item) => sum + (item.addon.priceEUR || 0) * item.qty, 0);
                  const baseAdultEgp = pricing.egyptianB2C?.adultEGP || 0;
                  const baseAdultEur = pricing.foreignerB2C?.adultEUR || 0;
                  const effectiveAdultEgp =
                    clientViewOnly && baseAdultEgp > 0
                      ? computeCustomerFinalPrice(baseAdultEgp, platformPricingSettings, 'EGP').total
                      : baseAdultEgp;
                  const effectiveAdultEur =
                    clientViewOnly && baseAdultEur > 0
                      ? computeCustomerFinalPrice(baseAdultEur, platformPricingSettings, 'EUR').total
                      : baseAdultEur;
                  const totalEgp = effectiveAdultEgp + extraEgp;
                  const totalEur = effectiveAdultEur + extraEur;
                  return (
                    <div className="pt-1.5 mt-1 border-t border-cyan-800/40 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                      <span className="text-emerald-300 font-bold tabular-nums">
                        مجموع الإضافات ({chosen.length} بند · {totalUnits} وحدة): +{extraEgp.toLocaleString()} ج.م / +€{extraEur.toLocaleString()}
                      </span>
                      <span className="font-mono text-white font-bold tabular-nums">
                        الإجمالي التقديري عند الدفع: {totalEgp.toLocaleString()} ج.م · €{totalEur.toLocaleString()}
                      </span>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p className="text-slate-400">لا توجد إضافات مدفوعة</p>
            )}
          </div>
        </div>
      </div>

      {/* 6. اللوجستيات والنقل + قواعد السلامة والسياسات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 text-[11px]">
        {/* Logistics */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
          <span className="font-bold text-white text-xs flex items-center gap-1.5 mb-1">
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span>النقل واللوجستيات</span>
          </span>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">حالة النقل:</span>
            <span className={logistics.requiresTransfer ? 'text-emerald-300 font-semibold' : 'text-slate-300'}>
              {logistics.requiresTransfer
                ? logistics.transferProvidedByOwner
                  ? 'مشمول / موفّر من المالك'
                  : clientViewOnly
                  ? 'يتوفر نقل منسّق حسب الطلب'
                  : 'يتطلب طلب نقل من السوق'
                : 'تجمع مباشر في الموقع'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 shrink-0">نقطة الالتقاء:</span>
            <span className="text-slate-200 text-left">{logistics.pickupPoint}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 shrink-0">نقطة العودة:</span>
            <span className="text-slate-200 text-left">{logistics.dropoffPoint}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{clientViewOnly ? 'سعة النقل:' : 'السعة / المركبة:'}</span>
            <span className="text-slate-200 font-mono">
              {logistics.passengerCapacity} راكب{' '}
              {!clientViewOnly && logistics.assignedDriverOrVehicle
                ? `(${logistics.assignedDriverOrVehicle})`
                : ''}
            </span>
          </div>
          {(logistics.separateTransferFeeEGP > 0 || logistics.separateTransferFeeEUR > 0) && (
            <div className="flex items-center justify-between text-amber-300">
              <span>رسوم نقل منفصلة:</span>
              <span className="font-mono font-bold">
                {logistics.separateTransferFeeEGP} ج.م / €{logistics.separateTransferFeeEUR}
              </span>
            </div>
          )}
        </div>

        {/* Safety & Cancellation Policy */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
          <span className="font-bold text-white text-xs flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>السلامة والأمان وسياسة الإلغاء</span>
          </span>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">العمر الأدنى / الإشراف:</span>
            <span className="text-slate-200 font-semibold">
              {safetyRules.minAge > 0 ? `${safetyRules.minAge}+ سنة` : 'جميع الأعمار'} ·{' '}
              {safetyRules.hasGuideSupervisor ? 'مرشد/مشرف مرافق' : 'بدون مشرف'}
            </span>
          </div>
          {safetyRules.insuranceCoverage && (
            <div className="text-emerald-300/90 text-[10px]">
              التأمين: {safetyRules.insuranceCoverage}
            </div>
          )}
          {safetyRules.attireGearNotes && (
            <div className="text-slate-300 text-[10px]">
              <span className="text-slate-400">الملابس المطلوبة:</span> {safetyRules.attireGearNotes}
            </div>
          )}
          {safetyRules.safetyInstructions && (
            <div className="text-slate-300 text-[10px]">
              <span className="text-slate-400">تعليمات السلامة:</span> {safetyRules.safetyInstructions}
            </div>
          )}
          {safetyRules.clientPrerequisites.length > 0 && (
            <div className="text-amber-200/90 text-[10px]">
              <span className="text-slate-400">اشتراطات مسبقة:</span> {safetyRules.clientPrerequisites.join(' · ')}
            </div>
          )}
          <div className="pt-1.5 mt-1 border-t border-slate-800/70 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 flex items-center gap-1 shrink-0">
                <FileCheck2 className="w-3 h-3 text-cyan-400" /> سياسة الإلغاء:
              </span>
              <span className="text-cyan-300 font-semibold text-left">{cancellationPolicy.name}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {clientViewOnly ? (
                <>
                  استرداد كامل قبل {cancellationPolicy.fullRefundHoursNotice} س
                  {cancellationPolicy.partialRefundPercentage > 0
                    ? ` · استرداد جزئي ${cancellationPolicy.partialRefundPercentage}% قبل ${cancellationPolicy.partialRefundHoursNotice} س`
                    : ''}
                </>
              ) : (
                <>
                  مهلة الاعتماد: {approvalDeadlineHours} س · مهلة الدفع: {paymentDeadlineHours} س · استرداد كامل قبل {cancellationPolicy.fullRefundHoursNotice} س
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6.5 المعدات المستخدمة ومواصفات كل معدة (ملفات مستقلة بدون نسخ، مع احترام صلاحية الظهور للعميل) */}
      {(() => {
        const linkedIds = activity.equipmentIds || [];
        if (linkedIds.length === 0 || equipments.length === 0) return null;

        const linkedEquipments = linkedIds
          .map((eqId) => equipments.find((e) => e.id === eqId))
          .filter((e): e is EquipmentItem => Boolean(e));

        const visibleEquipments = clientViewOnly
          ? activity.showEquipmentToClient === false
            ? []
            : linkedEquipments.filter((eq) => eq.showToClientDefault && eq.status !== 'inactive')
          : linkedEquipments;

        if (visibleEquipments.length === 0) return null;

        return (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-2">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>{terms.cardLinkedEquipmentTitle(visibleEquipments.length)}</span>
              </span>
              {clientViewOnly ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>عرض العميل (الصفات العامة فقط)</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {activity.showEquipmentToClient === false ? 'مخفية عن العميل' : 'تظهر مواصفاتها للعميل'}
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {visibleEquipments.map((eq) => {
                const typeDef = equipmentTypes.find((t) => t.id === eq.typeId);
                const publicMedia = clientViewOnly
                  ? eq.media.filter((m) => m.isPublicForClient !== false)
                  : eq.media;
                const publicImages = publicMedia.filter((m) => m.type === 'image');

                const specGroupsToRender: Array<{
                  id: string;
                  title: string;
                  rows: Array<{
                    id: string;
                    label: string;
                    value: string;
                    isPublic: boolean;
                  }>;
                }> = [];

                eq.dynamicSpecs.forEach((grp) => {
                  const rows = grp.fields
                    .filter((f) => (!clientViewOnly ? true : f.isPublicForClient))
                    .map((f) => {
                      const formattedVal =
                        typeof f.value === 'boolean'
                          ? f.value
                            ? 'نعم'
                            : 'لا'
                          : Array.isArray(f.value)
                          ? f.value.join('، ') || '—'
                          : f.value === '' || f.value === undefined
                          ? '—'
                          : `${f.value}${f.unit ? ` ${f.unit}` : ''}`;

                      return {
                        id: f.fieldId,
                        label: f.label,
                        value: formattedVal,
                        isPublic: f.isPublicForClient
                      };
                    });

                  if (rows.length > 0) {
                    specGroupsToRender.push({
                      id: grp.groupId,
                      title: grp.title,
                      rows
                    });
                  }
                });

                const extraRows = (eq.extraData || [])
                  .filter((ex) => (!clientViewOnly ? true : ex.isPublicForClient))
                  .map((ex) => ({
                    id: ex.id,
                    label: ex.label,
                    value: ex.value,
                    isPublic: ex.isPublicForClient
                  }));

                if (extraRows.length > 0) {
                  specGroupsToRender.push({
                    id: `${eq.id}-extra`,
                    title: 'بيانات ومميزات إضافية للمعدة',
                    rows: extraRows
                  });
                }

                return (
                  <div
                    key={eq.id}
                    className="bg-slate-900/75 border border-slate-800/80 rounded-xl p-3 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{eq.name}</span>
                          {eq.translations?.en?.name && (
                            <span dir="ltr" className="text-[10px] text-slate-400">
                              ({eq.translations.en.name})
                            </span>
                          )}
                          {!clientViewOnly && (
                            <span className="text-[10px] font-mono bg-slate-950 text-cyan-300 border border-slate-800 px-1.5 py-0.5 rounded">
                              {eq.id}
                            </span>
                          )}
                          {(typeDef?.name || eq.classification) && (
                            <span className="text-[10px] bg-amber-950/40 text-amber-300 border border-amber-800/40 px-1.5 py-0.5 rounded">
                              {typeDef?.name || eq.classification}
                            </span>
                          )}
                          {eq.operationalData.modelYear && (
                            <span className="text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded">
                              موديل {eq.operationalData.modelYear}
                            </span>
                          )}
                          {eq.operationalData.capacityOrUnitLabel && (
                            <span className="text-[10px] bg-cyan-950/40 text-cyan-200 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                              {eq.operationalData.capacityOrUnitLabel}
                            </span>
                          )}
                        </div>
                        {eq.description && (
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            {eq.description}
                          </p>
                        )}
                      </div>

                      {!clientViewOnly && (
                        <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                            {eq.status === 'available'
                              ? 'متاحة'
                              : eq.status === 'in_use'
                              ? 'قيد التشغيل'
                              : eq.status === 'maintenance'
                              ? 'صيانة'
                              : 'موقوفة'}
                          </span>
                          {!eq.showToClientDefault && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 flex items-center gap-0.5">
                              <EyeOff className="w-2.5 h-2.5" />
                              <span>داخلية</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Equipment Photos */}
                    {publicImages.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {publicImages.map((img) => (
                          <div
                            key={img.id}
                            className="w-20 h-14 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shrink-0 relative"
                            title={img.title || eq.name}
                          >
                            <img
                              src={img.url}
                              alt={img.title || eq.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Per-Equipment Specs Grouped */}
                    {specGroupsToRender.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {specGroupsToRender.map((grp) => (
                          <div key={grp.id} className="space-y-1">
                            <div className="text-[10px] font-bold text-cyan-300">
                              • {grp.title}:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {grp.rows.map((row) => (
                                <div
                                  key={row.id}
                                  className="flex items-center justify-between gap-2 bg-slate-950/80 border border-slate-800/70 rounded-lg px-2 py-1 text-[10px]"
                                >
                                  <span className="text-slate-400 flex items-center gap-1 truncate">
                                    {!clientViewOnly && !row.isPublic && (
                                      <span
                                        title="حقل داخلي لا يظهر للعميل"
                                        className="inline-flex shrink-0"
                                      >
                                        <EyeOff className="w-2.5 h-2.5 text-amber-400" />
                                      </span>
                                    )}
                                    <span className="truncate">{row.label}:</span>
                                  </span>
                                  <span className="text-slate-100 font-semibold font-mono shrink-0">
                                    {row.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Internal Operational Data: strictly NEVER rendered in clientViewOnly */}
                    {!clientViewOnly &&
                      (eq.operationalData.internalNotes ||
                        eq.operationalData.serialOrRegistrationNo) && (
                        <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg px-2.5 py-1.5 text-[10px] text-amber-200/90 space-y-0.5">
                          {eq.operationalData.serialOrRegistrationNo && (
                            <div>
                              <span className="text-amber-400 font-semibold">
                                رقم التسجيل الداخلي:{' '}
                              </span>
                              <span className="font-mono">
                                {eq.operationalData.serialOrRegistrationNo}
                              </span>
                            </div>
                          )}
                          {eq.operationalData.internalNotes && (
                            <div>
                              <span className="text-amber-400 font-semibold">
                                ملاحظات داخلية (لا تظهر للعميل):{' '}
                              </span>
                              <span>{eq.operationalData.internalNotes}</span>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 7. بيانات المالك وقنوات النشر والإحصائيات (محجوبة في عرض العميل) */}
      {showStatsAndChannels && !clientViewOnly && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2 text-[11px]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-2">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">المالك:</span>
              <span className="font-bold text-white">{owner.name}</span>
              <span className="text-slate-400">({owner.companyName})</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {owner.tier} · {owner.phone}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" /> قنوات النشر:
              </span>
              {enabledChannels.length > 0 ? (
                enabledChannels.map((ch) => (
                  <span key={ch} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
                    {ch}
                  </span>
                ))
              ) : (
                <span className="text-slate-500">غير منشور بقنوات عامة</span>
              )}
            </div>

            <div className="flex items-center gap-3 font-mono text-[10px] text-slate-300">
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-cyan-400" />
                {stats.viewsCount.toLocaleString()} مشاهدة
              </span>
              <span>{stats.bookingsCount} حجز</span>
              <span className="text-emerald-400 font-bold">€{stats.revenueEUR.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* 7B. نسبة عامة مختصرة للشركة المنفذة في عرض العميل (بدون أرقام هواتف أو قنوات أو إيرادات) */}
      {clientViewOnly && owner.companyName && (
        <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400">مقدم التجربة:</span>
            <span className="font-semibold text-white">{owner.companyName}</span>
          </div>
          <span className="text-[10px] text-slate-400">{location.city}</span>
        </div>
      )}
    </div>
  );
};
