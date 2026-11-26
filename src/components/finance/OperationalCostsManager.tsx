import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  Coins,
  DollarSign,
  Edit3,
  Fuel,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  X
} from 'lucide-react';
import type { Activity } from '../../types/activity';
import type { AppUser } from '../../types/auth';
import type { BookingFinancialAllocation } from '../../types/finance';
import type { PersonProfile } from '../../types/personProfile';
import type { TripRecord } from '../../types/trip';
import type { PlatformPricingSettings } from '../pricing/PricingToolManager';
import type { BookingRequest } from '../trips/BookingQueueModal';
import type { TripBooking } from '../bookings/BookingsManagerView';
import { activityBelongsToOwner } from '../../db/localActivitiesDb';
import { tripBelongsToOwner } from '../../db/localTripsDb';
import {
  type ActivityCostProfile,
  type ActualRunCostRecord,
  type CostCalculationMethod,
  type CostCategory,
  type CostCurrency,
  type CostEntityType,
  type CostScope,
  type EconomicsSegmentKey,
  type OperationalCostLineItem,
  COST_CATEGORY_META,
  COST_METHOD_LABELS,
  ECONOMICS_SEGMENT_LABELS,
  computeLineItemCostEGP,
  computeProductEconomics
} from '../../types/operationalCost';

interface ProductCandidate {
  id: string;
  entityType: CostEntityType;
  name: string;
  city: string;
  minPax: number;
  maxPax: number;
  raw: Activity;
}

interface OperationalCostsManagerProps {
  currentUser: AppUser;
  activities: Activity[];
  trips: TripRecord[];
  costProfiles: ActivityCostProfile[];
  platformPricingSettings: PlatformPricingSettings;
  onSaveCostProfile: (
    draft: Omit<ActivityCostProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'auditTrail'> & {
      id?: string;
    }
  ) => ActivityCostProfile;
  onDeleteCostProfile: (profileId: string) => void;
  onDeleteMultipleCostProfiles: (profileIds: string[]) => void;
  personProfiles?: PersonProfile[];
  activityBookings?: BookingRequest[];
  tripBookings?: TripBooking[];
  allocations?: BookingFinancialAllocation[];
  onSyncCostItemsToLedger?: (input: {
    entityId: string;
    entityName: string;
    computedItems: Array<{ item: OperationalCostLineItem; impactEGP: number }>;
  }) => Promise<number>;
}

const INTERNAL_CATEGORIES: CostCategory[] = ['crew', 'fuel', 'other'];
const EXTERNAL_CATEGORIES: CostCategory[] = ['transport', 'reps', 'external_crew'];
const ALL_SEGMENTS: EconomicsSegmentKey[] = [
  'egyptianB2C',
  'foreignerB2C',
  'egyptianB2B',
  'foreignerB2B',
  'privateGroup'
];

function formatEgp(val: number): string {
  return `${Math.round(val).toLocaleString('en-US')} ج.م`;
}

function buildQuickItem(scope: CostScope, category: CostCategory): OperationalCostLineItem {
  const meta = COST_CATEGORY_META[category];
  const defaultMethod: CostCalculationMethod =
    category === 'reps' ? 'percent_of_price' : 'fixed_per_run';
  return {
    id: `oci-${Date.now().toString().slice(-5)}-${Math.random().toString(36).slice(2, 5)}`,
    scope,
    category,
    title: '',
    calculationMethod: defaultMethod,
    currency: 'EGP',
    unitAmount: 0,
    quantity: 1,
    unitLabel: meta.defaultUnitLabel,
    notes: ''
  };
}

export const OperationalCostsManager: React.FC<OperationalCostsManagerProps> = ({
  currentUser,
  activities,
  trips,
  costProfiles,
  platformPricingSettings,
  onSaveCostProfile,
  onDeleteCostProfile,
  onDeleteMultipleCostProfiles,
  personProfiles = [],
  activityBookings = [],
  tripBookings = [],
  allocations = [],
  onSyncCostItemsToLedger
}) => {
  // Merge Activities & Trips belonging to currentUser (fallback to all if none scoped yet)
  const productCandidates = useMemo<ProductCandidate[]>(() => {
    const ownedActivities = activities.filter(
      (a) => !a.owner?.id || activityBelongsToOwner(a, currentUser)
    );
    const ownedTrips = trips.filter(
      (t) => !t.owner?.id || tripBelongsToOwner(t, currentUser)
    );

    const list: ProductCandidate[] = [
      ...ownedActivities.map((a) => ({
        id: a.id,
        entityType: 'activity' as CostEntityType,
        name: a.name || 'نشاط بدون اسم',
        city: a.location?.city || '—',
        minPax: Math.max(1, a.minPax || 1),
        maxPax: Math.max(1, a.maxPax || 10),
        raw: a
      })),
      ...ownedTrips.map((t) => ({
        id: t.id,
        entityType: 'trip' as CostEntityType,
        name: t.name || 'رحلة بدون اسم',
        city: t.location?.city || '—',
        minPax: Math.max(1, t.minPax || 1),
        maxPax: Math.max(1, t.maxPax || 10),
        raw: t
      }))
    ];
    return list;
  }, [activities, trips, currentUser.id]);

  // Selection & Editor State
  const [editingProfileId, setEditingProfileId] = useState<string | undefined>(undefined);
  const [selectedProductKey, setSelectedProductKey] = useState<string>(() => {
    if (costProfiles.length > 0) {
      return `${costProfiles[0].entityType}:${costProfiles[0].entityId}`;
    }
    if (productCandidates.length > 0) {
      return `${productCandidates[0].entityType}:${productCandidates[0].id}`;
    }
    return '';
  });

  const selectedProduct = useMemo(() => {
    if (!selectedProductKey) return productCandidates[0] || null;
    const [type, id] = selectedProductKey.split(':');
    return (
      productCandidates.find((p) => p.entityType === type && p.id === id) ||
      productCandidates[0] ||
      null
    );
  }, [productCandidates, selectedProductKey]);

  const [eurToEgpRate, setEurToEgpRate] = useState<number>(52);
  const [defaultExpectedPax, setDefaultExpectedPax] = useState<number>(6);
  const [items, setItems] = useState<OperationalCostLineItem[]>([]);
  const [actualRuns, setActualRuns] = useState<ActualRunCostRecord[]>([]);
  const [profileNotes, setProfileNotes] = useState<string>('');

  // Simulator controls
  const [simSegment, setSimSegment] = useState<EconomicsSegmentKey>('egyptianB2C');
  const [simPax, setSimPax] = useState<number>(6);
  const [deductPlatformFees, setDeductPlatformFees] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Product Searchable Dropdown (with X close button + outside click dismiss)
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | CostEntityType>('all');
  const productDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Load saved profile whenever selectedProduct changes (unless manually loading a specific profile)
  useEffect(() => {
    if (!selectedProduct) return;
    const matched = costProfiles.find(
      (p) => p.entityId === selectedProduct.id && p.entityType === selectedProduct.entityType
    );
    if (matched) {
      setEditingProfileId(matched.id);
      setEurToEgpRate(matched.eurToEgpRate || 52);
      const pax = Math.max(1, matched.defaultExpectedPax || selectedProduct.maxPax || 6);
      setDefaultExpectedPax(pax);
      setSimPax(pax);
      setItems(matched.items || []);
      setActualRuns(matched.actualRuns || []);
      setProfileNotes(matched.notes || '');
    } else {
      setEditingProfileId(undefined);
      const pax = Math.max(1, Math.min(selectedProduct.maxPax || 6, 8));
      setDefaultExpectedPax(pax);
      setSimPax(pax);
      setItems([]);
      setActualRuns([]);
      setProfileNotes('');
    }
  }, [selectedProduct?.id, selectedProduct?.entityType]);

  // Actual Run inline logger state
  const [showActualRunsPanel, setShowActualRunsPanel] = useState(false);
  const [newRunDate, setNewRunDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newRunSegment, setNewRunSegment] = useState<EconomicsSegmentKey>('egyptianB2C');
  const [newRunPax, setNewRunPax] = useState<number>(6);
  const [newRunNotes, setNewRunNotes] = useState<string>('');
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);

  // Saved profiles table filter & multi-select
  const [registrySearch, setRegistrySearch] = useState('');
  const [registryTypeFilter, setRegistryTypeFilter] = useState<'all' | CostEntityType>('all');
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

  const filteredCandidates = useMemo(() => {
    const q = productSearchQuery.trim().toLowerCase();
    return productCandidates.filter((c) => {
      if (productTypeFilter !== 'all' && c.entityType !== productTypeFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });
  }, [productCandidates, productSearchQuery, productTypeFilter]);

  const economics = useMemo(
    () =>
      computeProductEconomics({
        entity: selectedProduct?.raw || null,
        items,
        segment: simSegment,
        paxCount: simPax,
        eurToEgpRate,
        platformPricingSettings,
        deductPlatformFees
      }),
    [
      selectedProduct,
      items,
      simSegment,
      simPax,
      eurToEgpRate,
      platformPricingSettings,
      deductPlatformFees
    ]
  );

  // Check negative margin across all priced tiers at current simPax
  const allTiersComparison = useMemo(() => {
    if (!selectedProduct) return [];
    return ALL_SEGMENTS.map((seg) => {
      const summary = computeProductEconomics({
        entity: selectedProduct.raw,
        items,
        segment: seg,
        paxCount: simPax,
        eurToEgpRate,
        platformPricingSettings,
        deductPlatformFees
      });
      return summary;
    }).filter((s) => s.grossRevenueEGP > 0);
  }, [selectedProduct, items, simPax, eurToEgpRate, platformPricingSettings, deductPlatformFees]);

  const losingTiers = allTiersComparison.filter((t) => t.netProfitEGP < 0 || t.hasNegativeMarginPerPax);

  const internalItems = items.filter((i) => i.scope === 'internal');
  const externalItems = items.filter((i) => i.scope === 'external');

  const notify = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => {
      setFeedbackMsg((prev) => (prev === msg ? '' : prev));
    }, 3500);
  };

  const handleAddLineItem = (scope: CostScope, category: CostCategory) => {
    setItems((prev) => [...prev, buildQuickItem(scope, category)]);
  };

  const handleUpdateLineItem = (id: string, patch: Partial<OperationalCostLineItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        if (patch.category && COST_CATEGORY_META[patch.category]) {
          next.scope = COST_CATEGORY_META[patch.category].scope;
        }
        return next;
      })
    );
  };

  const handleRemoveLineItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePullLogisticsCost = () => {
    if (!selectedProduct) return;
    const log = selectedProduct.raw.logistics;
    const feeEgp = log?.separateTransferFeeEGP || 0;
    const feeEur = log?.separateTransferFeeEUR || 0;
    if (feeEgp <= 0 && feeEur <= 0 && !log?.requiresTransfer) {
      notify('لا توجد رسوم نقل منفصلة مسجلة في بيانات هذا المنتج.');
      return;
    }

    const useEur = feeEgp <= 0 && feeEur > 0;
    const amount = useEur ? feeEur : feeEgp;
    const newItem: OperationalCostLineItem = {
      id: `oci-log-${Date.now().toString().slice(-5)}`,
      scope: 'external',
      category: 'transport',
      title: log.pickupPoint
        ? `نقل خارجي (${log.pickupPoint})`
        : 'رسوم نقل من إعدادات اللوجستيات',
      calculationMethod: 'fixed_per_run',
      currency: useEur ? 'EUR' : 'EGP',
      unitAmount: amount,
      quantity: 1,
      unitLabel: 'رحلة نقل',
      notes: log.assignedDriverOrVehicle || ''
    };
    setItems((prev) => [...prev, newItem]);
    notify('تم استيراد بند النقل إلى التكلفة الخارجية.');
  };

  const handleSaveCurrentProfile = () => {
    if (!selectedProduct) {
      notify('يرجى اختيار نشاط أو رحلة أولاً.');
      return;
    }
    const cleanItems = items.map((it) => ({
      ...it,
      title: it.title.trim() || COST_CATEGORY_META[it.category].label
    }));
    setItems(cleanItems);

    const saved = onSaveCostProfile({
      id: editingProfileId,
      entityId: selectedProduct.id,
      entityType: selectedProduct.entityType,
      entityName: selectedProduct.name,
      eurToEgpRate: eurToEgpRate > 0 ? eurToEgpRate : 52,
      defaultExpectedPax: Math.max(1, defaultExpectedPax || 1),
      items: cleanItems,
      actualRuns,
      notes: profileNotes.trim()
    });
    setEditingProfileId(saved.id);
    if (onSyncCostItemsToLedger && cleanItems.some((it) => Boolean(it.assignedProfileId))) {
      const computedItems = cleanItems.map((it) => ({
        item: it,
        impactEGP: computeLineItemCostEGP(
          it,
          Math.max(1, defaultExpectedPax || 1),
          economics.grossRevenueEGP,
          eurToEgpRate > 0 ? eurToEgpRate : 52
        )
      }));
      void onSyncCostItemsToLedger({
        entityId: selectedProduct.id,
        entityName: selectedProduct.name,
        computedItems
      });
    }
    notify(`تم حفظ ملف التكلفة التشغيلية لـ «${selectedProduct.name}» ومزامنة مستحقات الموردين.`);
  };

  const handleLogActualRun = () => {
    if (!selectedProduct) return;
    const runEcon = computeProductEconomics({
      entity: selectedProduct.raw,
      items,
      segment: newRunSegment,
      paxCount: Math.max(1, newRunPax),
      eurToEgpRate,
      platformPricingSettings,
      deductPlatformFees
    });

    const record: ActualRunCostRecord = {
      id: `run-${Date.now().toString().slice(-6)}`,
      runDate: newRunDate || new Date().toISOString().split('T')[0],
      segment: newRunSegment,
      paxCount: Math.max(1, newRunPax),
      revenueEGP: Math.round(runEcon.netOwnerRevenueEGP),
      internalCostEGP: Math.round(runEcon.internalTotalEGP),
      externalCostEGP: Math.round(runEcon.externalTotalEGP),
      totalCostEGP: Math.round(runEcon.totalCostEGP),
      netProfitEGP: Math.round(runEcon.netProfitEGP),
      notes: newRunNotes.trim()
    };
    const nextRuns = [record, ...actualRuns];
    setActualRuns(nextRuns);
    setNewRunNotes('');

    const saved = onSaveCostProfile({
      id: editingProfileId,
      entityId: selectedProduct.id,
      entityType: selectedProduct.entityType,
      entityName: selectedProduct.name,
      eurToEgpRate: eurToEgpRate > 0 ? eurToEgpRate : 52,
      defaultExpectedPax: Math.max(1, defaultExpectedPax || 1),
      items,
      actualRuns: nextRuns,
      notes: profileNotes.trim()
    });
    setEditingProfileId(saved.id);
    notify('تم تسجيل التشغيلة الفعلية وحفظها في السجل.');
  };

  const handleDeleteSingleRun = (runId: string) => {
    const nextRuns = actualRuns.filter((r) => r.id !== runId);
    setActualRuns(nextRuns);
    setSelectedRunIds((prev) => prev.filter((id) => id !== runId));
    if (selectedProduct && editingProfileId) {
      onSaveCostProfile({
        id: editingProfileId,
        entityId: selectedProduct.id,
        entityType: selectedProduct.entityType,
        entityName: selectedProduct.name,
        eurToEgpRate,
        defaultExpectedPax,
        items,
        actualRuns: nextRuns,
        notes: profileNotes.trim()
      });
    }
  };

  const handleBulkDeleteRuns = () => {
    if (selectedRunIds.length === 0) return;
    const idSet = new Set(selectedRunIds);
    const nextRuns = actualRuns.filter((r) => !idSet.has(r.id));
    setActualRuns(nextRuns);
    setSelectedRunIds([]);
    if (selectedProduct && editingProfileId) {
      onSaveCostProfile({
        id: editingProfileId,
        entityId: selectedProduct.id,
        entityType: selectedProduct.entityType,
        entityName: selectedProduct.name,
        eurToEgpRate,
        defaultExpectedPax,
        items,
        actualRuns: nextRuns,
        notes: profileNotes.trim()
      });
    }
  };

  const filteredProfiles = useMemo(() => {
    const q = registrySearch.trim().toLowerCase();
    return costProfiles.filter((p) => {
      if (registryTypeFilter !== 'all' && p.entityType !== registryTypeFilter) return false;
      if (!q) return true;
      return (
        p.entityName.toLowerCase().includes(q) ||
        p.entityId.toLowerCase().includes(q)
      );
    });
  }, [costProfiles, registrySearch, registryTypeFilter]);

  const allRegistrySelected =
    filteredProfiles.length > 0 &&
    filteredProfiles.every((p) => selectedProfileIds.includes(p.id));

  // Automated Realized Booking P&L derived from live bookings & allocations
  const realizedBookingPnL = useMemo(() => {
    const ownedEntityIds = new Set(productCandidates.map((p) => p.id));
    const relevantAllocs = allocations.filter(
      (a) =>
        a.ownerUserId === currentUser.id ||
        ownedEntityIds.has(a.entityId) ||
        currentUser.roleKey === 'platform_admin'
    );

    const promoDeductionsEGP = [...activityBookings, ...tripBookings].reduce((sum, bk) => {
      const rate = eurToEgpRate > 0 ? eurToEgpRate : 52;
      return (
        sum +
        (bk.promoDiscountEGP || 0) +
        (bk.promoDiscountEUR ? bk.promoDiscountEUR * rate : 0)
      );
    }, 0);

    const byEntity = new Map<
      string,
      {
        entityId: string;
        entityName: string;
        bookingsCount: number;
        collectedEGP: number;
        platformFeesEGP: number;
        partnerPayoutsEGP: number;
        refundedEGP: number;
        ownerNetEGP: number;
      }
    >();

    for (const a of relevantAllocs) {
      const prev = byEntity.get(a.entityId) || {
        entityId: a.entityId,
        entityName: a.entityName,
        bookingsCount: 0,
        collectedEGP: 0,
        platformFeesEGP: 0,
        partnerPayoutsEGP: 0,
        refundedEGP: 0,
        ownerNetEGP: 0
      };
      const partnerSum = a.payouts
        .filter((p) => p.partnerRole !== 'platform' && p.partnerRole !== 'activity_owner')
        .reduce((s, p) => s + p.amountEGP, 0);

      prev.bookingsCount += 1;
      prev.collectedEGP += a.paidNowEGP;
      prev.platformFeesEGP += a.platformFeeEGP;
      prev.partnerPayoutsEGP += partnerSum;
      prev.refundedEGP += a.refundedEGP;
      prev.ownerNetEGP += a.ownerNetEGP;
      byEntity.set(a.entityId, prev);
    }

    const rows = Array.from(byEntity.values());
    const totals = rows.reduce(
      (acc, r) => ({
        bookingsCount: acc.bookingsCount + r.bookingsCount,
        collectedEGP: acc.collectedEGP + r.collectedEGP,
        platformFeesEGP: acc.platformFeesEGP + r.platformFeesEGP,
        partnerPayoutsEGP: acc.partnerPayoutsEGP + r.partnerPayoutsEGP,
        refundedEGP: acc.refundedEGP + r.refundedEGP,
        ownerNetEGP: acc.ownerNetEGP + r.ownerNetEGP
      }),
      {
        bookingsCount: 0,
        collectedEGP: 0,
        platformFeesEGP: 0,
        partnerPayoutsEGP: 0,
        refundedEGP: 0,
        ownerNetEGP: 0
      }
    );

    return { rows, totals, promoDeductionsEGP: Math.round(promoDeductionsEGP) };
  }, [allocations, activityBookings, tripBookings, currentUser.id, currentUser.roleKey, eurToEgpRate, productCandidates]);

  const renderLineItemsSection = (
    scope: CostScope,
    sectionTitle: string,
    sectionSubtitle: string,
    categories: CostCategory[],
    sectionItems: OperationalCostLineItem[],
    subtotalEGP: number
  ) => (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {scope === 'internal' ? (
              <Fuel className="w-4 h-4 text-cyan-400" />
            ) : (
              <Truck className="w-4 h-4 text-amber-400" />
            )}
            <span>{sectionTitle}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{sectionSubtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left">
            <span className="text-[11px] text-slate-400 block">
              الإجمالي عند {simPax} أفراد
            </span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">
              {formatEgp(subtotalEGP)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Category Add Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleAddLineItem(scope, cat)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>{COST_CATEGORY_META[cat].label}</span>
            </button>
          ))}
        </div>

        {scope === 'external' && selectedProduct && (
          <button
            type="button"
            onClick={handlePullLogisticsCost}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-amber-700/50 text-amber-300 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>سحب رسوم النقل من اللوجستيات</span>
          </button>
        )}
      </div>

      {/* Line Items Table / Rows */}
      {sectionItems.length === 0 ? (
        <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-5 text-center space-y-2">
          <p className="text-xs text-slate-400">
            لا توجد بنود مسجلة في {sectionTitle} لهذا المنتج بعد.
          </p>
          <button
            type="button"
            onClick={() => handleAddLineItem(scope, categories[0])}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة أول بند</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
          {sectionItems.map((item) => {
            const impactEGP = computeLineItemCostEGP(
              item,
              simPax,
              economics.grossRevenueEGP,
              eurToEgpRate
            );
            const meta = COST_CATEGORY_META[item.category];
            return (
              <div key={item.id} className="p-3.5 space-y-2.5 hover:bg-slate-900/40 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                  {/* Category */}
                  <div className="md:col-span-3">
                    <label className="text-[10px] text-slate-400 block mb-1">الفئة</label>
                    <select
                      value={item.category}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, {
                          category: e.target.value as CostCategory
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {COST_CATEGORY_META[c].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div className="md:col-span-4">
                    <label className="text-[10px] text-slate-400 block mb-1">بيان البند</label>
                    <input
                      type="text"
                      value={item.title}
                      placeholder={meta.placeholder}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, { title: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Calculation Method */}
                  <div className="md:col-span-3">
                    <label className="text-[10px] text-slate-400 block mb-1">طريقة الاحتساب</label>
                    <select
                      value={item.calculationMethod}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, {
                          calculationMethod: e.target.value as CostCalculationMethod
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="fixed_per_run">{COST_METHOD_LABELS.fixed_per_run}</option>
                      <option value="per_person">{COST_METHOD_LABELS.per_person}</option>
                      <option value="percent_of_price">{COST_METHOD_LABELS.percent_of_price}</option>
                    </select>
                  </div>

                  {/* Impact & Delete */}
                  <div className="md:col-span-2 flex items-end justify-between gap-2 pt-3 md:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">الأثر المحسوب</span>
                      <span className="text-xs font-bold font-mono tabular-nums text-cyan-300">
                        {formatEgp(impactEGP)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(item.id)}
                      title="حذف هذا البند"
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Numeric Row: Quantity, Unit Price, Currency, Notes */}
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-center">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] text-slate-500 block mb-0.5">الكمية / العدد</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.quantity || ''}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, {
                          quantity: Math.max(0, parseFloat(e.target.value) || 0)
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-3">
                    <label className="text-[10px] text-slate-500 block mb-0.5">
                      {item.calculationMethod === 'percent_of_price'
                        ? 'النسبة (%)'
                        : 'قيمة الوحدة'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.unitAmount || ''}
                      placeholder="0"
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, {
                          unitAmount: Math.max(0, parseFloat(e.target.value) || 0)
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] text-slate-500 block mb-0.5">العملة</label>
                    <select
                      disabled={item.calculationMethod === 'percent_of_price'}
                      value={item.currency}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, {
                          currency: e.target.value as CostCurrency
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-200 disabled:opacity-50 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="EGP">ج.م (EGP)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>

                  <div className="col-span-1 sm:col-span-3">
                    <label className="text-[10px] text-slate-500 block mb-0.5">المستفيد (سائق / مورد / باجي)</label>
                    <select
                      value={item.assignedProfileId || ''}
                      onChange={(e) => {
                        const chosen = personProfiles.find((p) => p.id === e.target.value);
                        handleUpdateLineItem(item.id, {
                          assignedProfileId: chosen?.id || undefined,
                          assignedProfileName: chosen?.name || undefined
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- تكلفة عامة / بدون تحديد شخص --</option>
                      {personProfiles.map((prof) => (
                        <option key={prof.id} value={prof.id}>
                          {prof.name} ({prof.companyName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] text-slate-500 block mb-0.5">ملاحظات تشغيلية</label>
                    <input
                      type="text"
                      value={item.notes || ''}
                      placeholder="تفاصيل..."
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, { notes: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-amber-400" />
            <span>التكلفة التشغيلية واقتصاديات المنتج</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            تحليل التكاليف الداخلية والخارجية لكل نشاط أو رحلة، ومطابقتها مع الأسعار لحساب صافي الربح ونقطة التعادل.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {feedbackMsg && (
            <span className="text-xs text-emerald-300 font-medium">{feedbackMsg}</span>
          )}
          <button
            type="button"
            onClick={handleSaveCurrentProfile}
            disabled={!selectedProduct}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{editingProfileId ? 'تحديث ملف التكلفة' : 'حفظ ملف التكلفة'}</span>
          </button>
        </div>
      </div>

      {/* Empty Products Guard */}
      {productCandidates.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-bold text-white">لا توجد أنشطة أو رحلات مسجلة لحسابك الحالي</p>
          <p className="text-xs text-slate-400">
            أضف نشاطاً من قسم «إدارة نشاط» أو رحلة من «إدارة الرحلات» أولاً لتتمكن من تسعير وتكليف تشغيلها هنا.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* =====================================================
              MAIN COLUMN (8 columns): Selector + Cost Layers + Logs
          ===================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Product Selector & Currency / Capacity Settings */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>1. اختيار المنتج (نشاط أو رحلة) ومعايير التشغيل</span>
                </h2>
                {selectedProduct && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{selectedProduct.entityType === 'trip' ? 'رحلة' : 'نشاط'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedProduct.city}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      السعة {selectedProduct.minPax}–{selectedProduct.maxPax} فرد
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Searchable Product Dropdown */}
                <div className="md:col-span-7 relative" ref={productDropdownRef}>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    النشاط أو الرحلة المستهدفة
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsProductDropdownOpen((prev) => !prev)}
                    className="w-full bg-slate-950 border border-slate-700 hover:border-cyan-500/70 rounded-xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <span className="truncate font-semibold">
                      {selectedProduct
                        ? `${selectedProduct.entityType === 'trip' ? 'رحلة:' : 'نشاط:'} ${selectedProduct.name}`
                        : 'اختر النشاط أو الرحلة...'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isProductDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isProductDropdownOpen && (
                    <div className="absolute right-0 left-0 mt-2 z-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                          {(
                            [
                              { id: 'all', label: 'الكل' },
                              { id: 'activity', label: 'الأنشطة' },
                              { id: 'trip', label: 'الرحلات' }
                            ] as const
                          ).map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setProductTypeFilter(tab.id)}
                              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                                productTypeFilter === tab.id
                                  ? 'bg-cyan-600 text-white'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsProductDropdownOpen(false)}
                          aria-label="إغلاق القائمة"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          placeholder="ابحث باسم النشاط أو الرحلة أو المدينة..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/70">
                        {filteredCandidates.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-500">
                            لا توجد نتائج مطابقة للبحث.
                          </div>
                        ) : (
                          filteredCandidates.map((cand) => {
                            const key = `${cand.entityType}:${cand.id}`;
                            const isSelected =
                              selectedProduct?.id === cand.id &&
                              selectedProduct?.entityType === cand.entityType;
                            const hasSavedCost = costProfiles.some(
                              (p) => p.entityId === cand.id && p.entityType === cand.entityType
                            );
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  setSelectedProductKey(key);
                                  setIsProductDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 text-right flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-cyan-950/60 text-cyan-200 font-bold'
                                    : 'text-slate-200 hover:bg-slate-800/70'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="truncate">{cand.name}</div>
                                  <div className="text-[11px] text-slate-400">
                                    {cand.entityType === 'trip' ? 'رحلة' : 'نشاط'} · {cand.city}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 text-[11px]">
                                  {hasSavedCost && (
                                    <span className="text-emerald-400 font-medium">له ملف تكلفة</span>
                                  )}
                                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* EUR Exchange Rate */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    سعر صرف اليورو (ج.م)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.5"
                    value={eurToEgpRate || ''}
                    onChange={(e) =>
                      setEurToEgpRate(Math.max(1, parseFloat(e.target.value) || 52))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono tabular-nums text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Default Expected Pax */}
                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    متوسط الأفراد للتشغيلة
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={defaultExpectedPax || ''}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setDefaultExpectedPax(val);
                      setSimPax(val);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono tabular-nums text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Linked Pricing Snapshot (clean horizontal strip) */}
              {selectedProduct && (
                <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">مصري B2C</span>
                    <span className="font-mono tabular-nums font-bold text-white">
                      {selectedProduct.raw.pricing.egyptianB2C.adultEGP.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">أجنبي B2C</span>
                    <span className="font-mono tabular-nums font-bold text-cyan-300">
                      €{selectedProduct.raw.pricing.foreignerB2C.adultEUR.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">شركات مصري B2B</span>
                    <span className="font-mono tabular-nums font-bold text-emerald-300">
                      {(selectedProduct.raw.pricing.egyptianB2B?.adultEGP || 0).toLocaleString()} ج.م
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">شركات أجنبي B2B</span>
                    <span className="font-mono tabular-nums font-bold text-amber-300">
                      €{(selectedProduct.raw.pricing.foreignerB2B?.adultEUR || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">رسوم نقل اللوجستيات</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-200">
                      {selectedProduct.raw.logistics.separateTransferFeeEGP || 0} ج.م
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* 2. Internal Operational Costs */}
            {renderLineItemsSection(
              'internal',
              '2. التكلفة التشغيلية الداخلية',
              'طاقم العمل الداخلي، المواد البترولية والوقود، وأي مصروفات تشغيلية مباشرة للنشاط أو الرحلة.',
              INTERNAL_CATEGORIES,
              internalItems,
              economics.internalTotalEGP
            )}

            {/* 3. External Costs */}
            {renderLineItemsSection(
              'external',
              '3. التكلفة الخارجية (النقل والمندوبون والطاقم المتعاقد)',
              'رسوم النقل الخارجي، عمولات المندوبين والوكلاء (نسبة أو ثابتة)، وطاقم العمل المتعاقد من الخارج.',
              EXTERNAL_CATEGORIES,
              externalItems,
              economics.externalTotalEGP
            )}

            {/* 4. Notes & Actual Runs Inline Log */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>4. ملاحظات التكلفة وسجل التشغيلات الفعلية بالتاريخ</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    اعتماد لقطة تكلفة وربحية فعلية لتاريخ تنفيذ محدد ({actualRuns.length} تشغيلة مسجلة)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowActualRunsPanel((prev) => !prev)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {showActualRunsPanel ? 'إخفاء سجل التشغيلات' : 'فتح سجل التشغيلات بالتاريخ'}
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  ملاحظات هيكل التكلفة للمنتج
                </label>
                <textarea
                  rows={2}
                  value={profileNotes}
                  onChange={(e) => setProfileNotes(e.target.value)}
                  placeholder="أضف ملاحظات عن اتفاقيات الموردين أو شروط احتساب العمولات والوقود..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {showActualRunsPanel && (
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-400 block mb-1">تاريخ التشغيلة</label>
                      <input
                        type="date"
                        value={newRunDate}
                        onChange={(e) => setNewRunDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-400 block mb-1">شريحة الحجز</label>
                      <select
                        value={newRunSegment}
                        onChange={(e) => setNewRunSegment(e.target.value as EconomicsSegmentKey)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        {ALL_SEGMENTS.map((seg) => (
                          <option key={seg} value={seg}>
                            {ECONOMICS_SEGMENT_LABELS[seg]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">عدد العملاء</label>
                      <input
                        type="number"
                        min={1}
                        value={newRunPax || ''}
                        onChange={(e) => setNewRunPax(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono tabular-nums text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">ملاحظة</label>
                      <input
                        type="text"
                        value={newRunNotes}
                        onChange={(e) => setNewRunNotes(e.target.value)}
                        placeholder="رقم الرحلة..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleLogActualRun}
                        className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                      >
                        + تسجيل تشغيلة
                      </button>
                    </div>
                  </div>

                  {actualRuns.length > 0 && (
                    <div className="space-y-2">
                      {selectedRunIds.length > 0 && (
                        <div className="flex items-center justify-between bg-rose-950/30 border border-rose-800/40 rounded-lg px-3 py-2 text-xs">
                          <span className="text-rose-200">
                            تم تحديد {selectedRunIds.length} تشغيلات
                          </span>
                          <button
                            type="button"
                            onClick={handleBulkDeleteRuns}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف المحدد</span>
                          </button>
                        </div>
                      )}

                      <div className="overflow-x-auto border border-slate-800 rounded-xl">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="p-2.5 w-9">
                                <input
                                  type="checkbox"
                                  checked={
                                    actualRuns.length > 0 &&
                                    actualRuns.every((r) => selectedRunIds.includes(r.id))
                                  }
                                  onChange={(e) =>
                                    setSelectedRunIds(
                                      e.target.checked ? actualRuns.map((r) => r.id) : []
                                    )
                                  }
                                  className="rounded border-slate-600 bg-slate-900 accent-cyan-500 cursor-pointer"
                                />
                              </th>
                              <th className="p-2.5">التاريخ</th>
                              <th className="p-2.5">الشريحة</th>
                              <th className="p-2.5">الأفراد</th>
                              <th className="p-2.5">الإيراد</th>
                              <th className="p-2.5">إجمالي التكلفة</th>
                              <th className="p-2.5">صافي الربح</th>
                              <th className="p-2.5 text-center">حذف</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/70 bg-slate-950/40">
                            {actualRuns.map((run) => (
                              <tr key={run.id} className="hover:bg-slate-900/50">
                                <td className="p-2.5">
                                  <input
                                    type="checkbox"
                                    checked={selectedRunIds.includes(run.id)}
                                    onChange={(e) =>
                                      setSelectedRunIds((prev) =>
                                        e.target.checked
                                          ? [...prev, run.id]
                                          : prev.filter((id) => id !== run.id)
                                      )
                                    }
                                    className="rounded border-slate-600 bg-slate-900 accent-cyan-500 cursor-pointer"
                                  />
                                </td>
                                <td className="p-2.5 font-mono tabular-nums text-slate-200">
                                  {run.runDate}
                                </td>
                                <td className="p-2.5 text-slate-300">
                                  {ECONOMICS_SEGMENT_LABELS[run.segment]}
                                </td>
                                <td className="p-2.5 font-mono tabular-nums text-white">
                                  {run.paxCount}
                                </td>
                                <td className="p-2.5 font-mono tabular-nums text-cyan-300">
                                  {formatEgp(run.revenueEGP)}
                                </td>
                                <td className="p-2.5 font-mono tabular-nums text-amber-300">
                                  {formatEgp(run.totalCostEGP)}
                                </td>
                                <td
                                  className={`p-2.5 font-mono tabular-nums font-bold ${
                                    run.netProfitEGP >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {formatEgp(run.netProfitEGP)}
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSingleRun(run.id)}
                                    title="حذف السجل"
                                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* =====================================================
              SIDEBAR COLUMN (4 columns, sticky): Profit Simulator
          ===================================================== */}
          <aside className="lg:col-span-4 lg:sticky lg:top-4 space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>محاكاة السعر والأرباح</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    التكلفة ↔ السعر ↔ صافي الربح ونقطة التعادل
                  </p>
                </div>
              </div>

              {/* Segment Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  شريحة البيع للمحاكاة
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ALL_SEGMENTS.map((seg) => (
                    <button
                      key={seg}
                      type="button"
                      onClick={() => setSimSegment(seg)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border text-center transition-colors cursor-pointer ${
                        simSegment === seg
                          ? 'bg-cyan-600/25 border-cyan-500 text-cyan-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      } ${seg === 'privateGroup' ? 'col-span-2' : ''}`}
                    >
                      {ECONOMICS_SEGMENT_LABELS[seg]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pax Simulator */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>عدد العملاء بالمحاكاة:</span>
                  </span>
                  <span className="font-mono tabular-nums font-bold text-cyan-300">
                    {simPax} فرد
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={Math.max(20, selectedProduct?.maxPax || 20)}
                  value={simPax}
                  onChange={(e) => setSimPax(parseInt(e.target.value, 10) || 1)}
                  className="w-full accent-cyan-500 cursor-pointer"
                />

                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSimPax(1)}
                    className="flex-1 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono cursor-pointer"
                  >
                    1 فرد
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSimPax(Math.max(1, Math.ceil((selectedProduct?.maxPax || 10) / 2)))
                    }
                    className="flex-1 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono cursor-pointer"
                  >
                    نصف ({Math.max(1, Math.ceil((selectedProduct?.maxPax || 10) / 2))})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimPax(Math.max(1, selectedProduct?.maxPax || 10))}
                    className="flex-1 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono cursor-pointer"
                  >
                    السعة ({Math.max(1, selectedProduct?.maxPax || 10)})
                  </button>
                </div>
              </div>

              {/* Platform Fees Toggle */}
              <label className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300 cursor-pointer">
                <span>خصم رسوم المنصة والضرائب</span>
                <input
                  type="checkbox"
                  checked={deductPlatformFees}
                  onChange={(e) => setDeductPlatformFees(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>

              {/* Financial Breakdown */}
              <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">سعر بيع الفرد الأساسي</span>
                  <span className="font-mono tabular-nums text-white font-semibold">
                    {formatEgp(economics.baseUnitRevenueEGP)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">إجمالي الإيراد ({simPax} أفراد)</span>
                  <span className="font-mono tabular-nums text-white font-bold">
                    {formatEgp(economics.grossRevenueEGP)}
                  </span>
                </div>
                {deductPlatformFees && economics.platformDeductionEGP > 0 && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>رسوم وضرائب المنصة</span>
                    <span className="font-mono tabular-nums text-rose-300">
                      -{formatEgp(economics.platformDeductionEGP)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">التكلفة الداخلية</span>
                    <span className="font-mono tabular-nums text-cyan-300 font-semibold">
                      {formatEgp(economics.internalTotalEGP)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">التكلفة الخارجية والعمولات</span>
                    <span className="font-mono tabular-nums text-amber-300 font-semibold">
                      {formatEgp(economics.externalTotalEGP)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>ثابت للتشغيلة / متغير للأفراد</span>
                    <span className="font-mono tabular-nums">
                      {formatEgp(economics.totalFixedEGP)} /{' '}
                      {formatEgp(economics.totalCostEGP - economics.totalFixedEGP)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-white pt-1">
                    <span>إجمالي التكلفة التشغيلية</span>
                    <span className="font-mono tabular-nums text-rose-300">
                      {formatEgp(economics.totalCostEGP)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>متوسط تكلفة الفرد الفعلي</span>
                    <span className="font-mono tabular-nums">
                      {formatEgp(economics.costPerPersonEGP)} / فرد
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Profit Hero Metric */}
              <div
                className={`rounded-xl p-4 border space-y-1.5 ${
                  economics.netProfitEGP >= 0
                    ? 'bg-emerald-950/30 border-emerald-700/50'
                    : 'bg-rose-950/30 border-rose-700/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-semibold">صافي الربح المتوقع</span>
                  <span
                    className={`font-mono tabular-nums font-bold ${
                      economics.netProfitEGP >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {economics.profitMarginPercent.toFixed(1)}% هامش
                  </span>
                </div>
                <div
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    economics.netProfitEGP >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatEgp(economics.netProfitEGP)}
                </div>
                <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                  <span>نقطة التعادل (Break-even):</span>
                  <span className="font-mono tabular-nums font-bold text-white">
                    {economics.hasNegativeMarginPerPax
                      ? 'خسارة على كل فرد!'
                      : economics.breakEvenPax !== null
                      ? `${economics.breakEvenPax} فرد فأكثر`
                      : 'السعر غير محدد'}
                  </span>
                </div>
              </div>

              {/* Negative Margin Pricing Alert */}
              {losingTiers.length > 0 && (
                <div className="bg-rose-950/40 border border-rose-700/50 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>تنبيه ربحية سالبة في بعض الفئات</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">
                    الشرائح التالية تحقق خسارة عند {simPax} أفراد:{' '}
                    {losingTiers.map((t) => ECONOMICS_SEGMENT_LABELS[t.segment]).join('، ')}.
                  </p>
                </div>
              )}

              {/* Quick All-Tiers Profitability Table */}
              {allTiersComparison.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    مقارنة صافي الربح لكل شرائح السعر ({simPax} أفراد):
                  </span>
                  <div className="divide-y divide-slate-800/70 border border-slate-800 rounded-xl bg-slate-950/60 text-[11px]">
                    {allTiersComparison.map((row) => (
                      <div
                        key={row.segment}
                        className="px-3 py-2 flex items-center justify-between gap-2"
                      >
                        <span className="text-slate-300">{ECONOMICS_SEGMENT_LABELS[row.segment]}</span>
                        <div className="flex items-center gap-2 font-mono tabular-nums">
                          <span
                            className={`font-bold ${
                              row.netProfitEGP >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {formatEgp(row.netProfitEGP)}
                          </span>
                          <span className="text-slate-500">
                            ({row.profitMarginPercent.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* =====================================================
          AUTOMATED REALIZED BOOKING P&L (Live from Bookings & Wallets)
      ===================================================== */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>الربحية الفعلية الآلية من الحجوزات والمدفوعات ({realizedBookingPnL.totals.bookingsCount} حجز)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              احتساب لحظي للإيراد المحصل، خصومات العروض، عمولة المنصة، وحصص الشركاء المنفذين بعد خصم المستردات.
            </p>
          </div>
          {realizedBookingPnL.promoDeductionsEGP > 0 && (
            <span className="text-xs font-mono text-amber-300">
              إجمالي خصومات الكوبونات: {formatEgp(realizedBookingPnL.promoDeductionsEGP)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">الإيراد المحصّل</span>
            <span className="text-base font-bold font-mono tabular-nums text-white">
              {formatEgp(realizedBookingPnL.totals.collectedEGP)}
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">عمولة المنصة</span>
            <span className="text-base font-bold font-mono tabular-nums text-cyan-300">
              {formatEgp(realizedBookingPnL.totals.platformFeesEGP)}
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">مستحقات الشركاء</span>
            <span className="text-base font-bold font-mono tabular-nums text-amber-300">
              {formatEgp(realizedBookingPnL.totals.partnerPayoutsEGP)}
            </span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-400 block text-[11px]">مبالغ مستردة</span>
            <span className="text-base font-bold font-mono tabular-nums text-rose-400">
              {formatEgp(realizedBookingPnL.totals.refundedEGP)}
            </span>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-xl p-3">
            <span className="text-emerald-300 block text-[11px]">صافي ربح المالك</span>
            <span className="text-base font-bold font-mono tabular-nums text-emerald-400">
              {formatEgp(realizedBookingPnL.totals.ownerNetEGP)}
            </span>
          </div>
        </div>

        {realizedBookingPnL.rows.length > 0 && (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">النشاط / الرحلة</th>
                  <th className="p-3">الحجوزات</th>
                  <th className="p-3">المحصّل الفعلي</th>
                  <th className="p-3">عمولة المنصة</th>
                  <th className="p-3">حصص الشركاء</th>
                  <th className="p-3">المسترد</th>
                  <th className="p-3">صافي الربح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/30">
                {realizedBookingPnL.rows.map((r) => (
                  <tr key={r.entityId} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-white">{r.entityName}</td>
                    <td className="p-3 font-mono tabular-nums text-slate-300">{r.bookingsCount}</td>
                    <td className="p-3 font-mono tabular-nums text-white">{formatEgp(r.collectedEGP)}</td>
                    <td className="p-3 font-mono tabular-nums text-cyan-300">{formatEgp(r.platformFeesEGP)}</td>
                    <td className="p-3 font-mono tabular-nums text-amber-300">{formatEgp(r.partnerPayoutsEGP)}</td>
                    <td className="p-3 font-mono tabular-nums text-rose-400">{formatEgp(r.refundedEGP)}</td>
                    <td className="p-3 font-mono tabular-nums font-bold text-emerald-400">{formatEgp(r.ownerNetEGP)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          SAVED PROFILES REGISTRY TABLE (Bottom full-width)
      ===================================================== */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">
              سجل ملفات التكلفة التشغيلية المحفوظة ({costProfiles.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              استعرض ملفات التكلفة المحفوظة لأنشطتك ورحلاتك، عدّل بنودها، أو احذف السجلات غير المطلوبة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={registrySearch}
                onChange={(e) => setRegistrySearch(e.target.value)}
                placeholder="بحث باسم النشاط أو الرحلة..."
                className="bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px]">
              {(
                [
                  { id: 'all', label: 'الكل' },
                  { id: 'activity', label: 'أنشطة' },
                  { id: 'trip', label: 'رحلات' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRegistryTypeFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    registryTypeFilter === tab.id
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bulk Delete Bar */}
        {selectedProfileIds.length > 0 && (
          <div className="flex items-center justify-between bg-rose-950/30 border border-rose-800/40 rounded-xl px-4 py-2.5 text-xs">
            <span className="text-rose-200 font-semibold">
              تم تحديد {selectedProfileIds.length} ملف تكلفة
            </span>
            <button
              type="button"
              onClick={() => {
                onDeleteMultipleCostProfiles(selectedProfileIds);
                setSelectedProfileIds([]);
                if (editingProfileId && selectedProfileIds.includes(editingProfileId)) {
                  setEditingProfileId(undefined);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف المحدد</span>
            </button>
          </div>
        )}

        {filteredProfiles.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            لا توجد ملفات تكلفة تشغيلية محفوظة حتى الآن. أضف بنود التكلفة بالأعلى ثم اضغط «حفظ ملف التكلفة».
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={allRegistrySelected}
                      onChange={(e) =>
                        setSelectedProfileIds(
                          e.target.checked ? filteredProfiles.map((p) => p.id) : []
                        )
                      }
                      aria-label="تحديد الكل"
                      className="rounded border-slate-600 bg-slate-900 accent-cyan-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">النشاط / الرحلة</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">البنود</th>
                  <th className="p-3">التكلفة الداخلية</th>
                  <th className="p-3">التكلفة الخارجية</th>
                  <th className="p-3">الإجمالي عند السعة المتوقعة</th>
                  <th className="p-3">آخر تحديث</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/30">
                {filteredProfiles.map((prof) => {
                  const matchedCand =
                    productCandidates.find(
                      (c) => c.id === prof.entityId && c.entityType === prof.entityType
                    ) || null;
                  const summary = computeProductEconomics({
                    entity: matchedCand?.raw || null,
                    items: prof.items,
                    segment: 'egyptianB2C',
                    paxCount: Math.max(1, prof.defaultExpectedPax || 1),
                    eurToEgpRate: prof.eurToEgpRate || 52,
                    platformPricingSettings,
                    deductPlatformFees
                  });
                  const isChecked = selectedProfileIds.includes(prof.id);

                  return (
                    <tr
                      key={prof.id}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        editingProfileId === prof.id ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setSelectedProfileIds((prev) =>
                              e.target.checked
                                ? [...prev, prof.id]
                                : prev.filter((id) => id !== prof.id)
                            )
                          }
                          aria-label={`تحديد ${prof.entityName}`}
                          className="rounded border-slate-600 bg-slate-900 accent-cyan-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-bold text-white">{prof.entityName}</td>
                      <td className="p-3 text-slate-300">
                        {prof.entityType === 'trip' ? 'رحلة' : 'نشاط'}
                      </td>
                      <td className="p-3 font-mono tabular-nums text-slate-300">
                        {prof.items.length} بنود
                      </td>
                      <td className="p-3 font-mono tabular-nums text-cyan-300">
                        {formatEgp(summary.internalTotalEGP)}
                      </td>
                      <td className="p-3 font-mono tabular-nums text-amber-300">
                        {formatEgp(summary.externalTotalEGP)}
                      </td>
                      <td className="p-3 font-mono tabular-nums font-bold text-white">
                        {formatEgp(summary.totalCostEGP)}{' '}
                        <span className="text-[10px] font-normal text-slate-400">
                          ({prof.defaultExpectedPax} أفراد)
                        </span>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-slate-400">
                        {prof.updatedAt ? prof.updatedAt.split('T')[0] : '—'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductKey(`${prof.entityType}:${prof.entityId}`);
                              setEditingProfileId(prof.id);
                              setEurToEgpRate(prof.eurToEgpRate || 52);
                              setDefaultExpectedPax(prof.defaultExpectedPax || 6);
                              setSimPax(prof.defaultExpectedPax || 6);
                              setItems(prof.items || []);
                              setActualRuns(prof.actualRuns || []);
                              setProfileNotes(prof.notes || '');
                            }}
                            title="تعديل ملف التكلفة"
                            className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteCostProfile(prof.id);
                              setSelectedProfileIds((prev) => prev.filter((id) => id !== prof.id));
                              if (editingProfileId === prof.id) {
                                setEditingProfileId(undefined);
                              }
                            }}
                            title="حذف ملف التكلفة"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
