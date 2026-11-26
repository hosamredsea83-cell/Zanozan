import React, { useMemo, useState } from 'react';
import type { Activity } from '../../types/activity';
import type { BookingRequest } from '../trips/BookingQueueModal';
import {
  CollectionRecord,
  FinancialSettlement,
  ManualCashierRole,
  PaymentPlanType,
  SelectedPaidAddonItem
} from '../../types/finance';
import { 
  ReceiptText, DollarSign, ShieldCheck, Plus, CheckCircle2, AlertCircle, 
  Clock, FileText, Check, X, Building, User, Lock, ExternalLink, Search
} from 'lucide-react';
import {
  RegistryColumnFilterDropdown,
  RegistryFilterOption,
  RegistryFilterSummaryBar,
  RegistrySortIcon,
  useRegistryTableState
} from '../shared/RegistryTableControls';

type CashierColKey =
  | 'receiptNumber'
  | 'activityTitle'
  | 'collectorName'
  | 'receivedAmount'
  | 'lockedExchangeRate'
  | 'accountingValueEUR'
  | 'planType'
  | 'status';

const CASHIER_COLUMNS: readonly CashierColKey[] = [
  'receiptNumber',
  'activityTitle',
  'collectorName',
  'receivedAmount',
  'lockedExchangeRate',
  'accountingValueEUR',
  'planType',
  'status'
];

const WIDE_CASHIER_COLS: readonly CashierColKey[] = ['receiptNumber', 'activityTitle', 'collectorName'];

const CASHIER_DROPDOWN_TITLES: Record<CashierColKey, string> = {
  receiptNumber: 'تحديد متعدد لرقم الإيصال / الحجز',
  activityTitle: 'تحديد متعدد للنشاط المستهدف',
  collectorName: 'تحديد متعدد للمحصل وصفته',
  receivedAmount: 'تحديد متعدد للمبلغ المستلم',
  lockedExchangeRate: 'تحديد متعدد لسعر الصرف المثبت',
  accountingValueEUR: 'تحديد متعدد للقيمة باليورو (€)',
  planType: 'تحديد متعدد لنوع الدفعة',
  status: 'تحديد متعدد للحالة'
};

const PLAN_LABELS: Record<PaymentPlanType, string> = {
  deposit: 'مقدم رحلة',
  full: 'سداد كامل',
  installments: 'أقساط'
};

const COLLECTION_STATUS_LABELS: Record<CollectionRecord['status'], string> = {
  confirmed: 'مؤكد',
  pending_confirmation: 'بانتظار التأكيد',
  rejected: 'مرفوض'
};

interface ManualCashierProps {
  collections: CollectionRecord[];
  settlements: FinancialSettlement[];
  activities?: Activity[];
  activityBookings?: BookingRequest[];
  onAddNewCollection: (record: Omit<CollectionRecord, 'id' | 'collectedAt' | 'status'>) => void;
  onRequestSettlement: (settlement: Omit<FinancialSettlement, 'id' | 'createdAt' | 'status'>) => void;
  onAuditSettlement: (settlementId: string, approved: boolean, notes: string) => void;
}

export const ManualCashier: React.FC<ManualCashierProps> = ({
  collections,
  settlements,
  activities = [],
  activityBookings = [],
  onAddNewCollection,
  onRequestSettlement,
  onAuditSettlement
}) => {
  const [showAddReceiptModal, setShowAddReceiptModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [auditingSettlement, setAuditingSettlement] = useState<FinancialSettlement | null>(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const tableState = useRegistryTableState<CashierColKey>(CASHIER_COLUMNS);

  // New Collection Record state
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('custom');
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id || 'act-yacht-01');
  const [bookingRef, setBookingRef] = useState('BK-88204');
  const [activityTitle, setActivityTitle] = useState('رحلة يخت ملكي خاص VIP - جزيرة الجفتون');
  const [collectorName, setCollectorName] = useState('أحمد نبيل العطار');
  const [collectorRole, setCollectorRole] = useState<ManualCashierRole>('company_delegate');
  const [collectorOrg, setCollectorOrg] = useState('ZanoZa Operations');
  const [baseReceivedAmount, setBaseReceivedAmount] = useState<number>(5000);
  const [receivedCurrency, setReceivedCurrency] = useState<'EGP' | 'EUR'>('EGP');
  const [lockedExchangeRate, setLockedExchangeRate] = useState<number>(50.0);
  const [planType, setPlanType] = useState<PaymentPlanType>('deposit');
  const [totalBookingCostEUR, setTotalBookingCostEUR] = useState<number>(350);
  const [receiptNumber, setReceiptNumber] = useState('RCPT-EGP-9935');
  const [notes, setNotes] = useState('استلام دفعة مقدمة نقداً');
  const [cashierAddonItems, setCashierAddonItems] = useState<SelectedPaidAddonItem[]>([]);

  // New Settlement state (requested by owner)
  const [settlementOwnerName, setSettlementOwnerName] = useState('كابتن طارق السويفي (بلو أوشن)');
  const [settlementAmountEUR, setSettlementAmountEUR] = useState<number>(65);
  const [settlementReason, setSettlementReason] = useState('تسوية فارق مصاريف وقود إضافي ومشتريات طعام طازج لوفد VIP');

  const getCollectorRoleArabic = (role: ManualCashierRole) => {
    switch (role) {
      case 'company_employee': return '1. موظف الشركة';
      case 'company_delegate': return '2. مندوب الشركة';
      case 'operator': return '3. المنفذ';
      case 'activity_owner': return '4. صاحب النشاط';
      case 'driver': return '5. السائق';
    }
  };

  const buildAddonsForActivity = (
    act: Activity | undefined,
    existingAddons?: SelectedPaidAddonItem[]
  ): SelectedPaidAddonItem[] => {
    const existing = existingAddons || [];
    const list: SelectedPaidAddonItem[] = (act?.inclusions?.paidAddons || []).map((ad) => {
      const matched = existing.find(
        (ex) =>
          ex.id === ad.id ||
          (ex.addonId && ad.addonId && ex.addonId === ad.addonId) ||
          ex.title.trim().toLowerCase() === ad.title.trim().toLowerCase()
      );
      return {
        id: ad.id,
        addonId: ad.addonId,
        title: ad.title,
        unitLabel: ad.unitLabel,
        unitPriceEGP: ad.priceEGP || 0,
        unitPriceEUR: ad.priceEUR || 0,
        quantity: matched?.quantity || 0,
        stage: 'collection'
      };
    });
    for (const ex of existing) {
      if (!list.some((item) => item.id === ex.id || item.title.trim().toLowerCase() === ex.title.trim().toLowerCase())) {
        list.push({ ...ex, stage: 'collection' });
      }
    }
    return list;
  };

  const handleOpenAddReceiptModal = () => {
    const firstAct = activities[0];
    if (firstAct && selectedSourceKey === 'custom' && cashierAddonItems.length === 0) {
      setCashierAddonItems(buildAddonsForActivity(firstAct));
      setSelectedActivityId(firstAct.id);
    }
    setShowAddReceiptModal(true);
  };

  const handleSelectCashierSource = (key: string) => {
    setSelectedSourceKey(key);
    if (key.startsWith('booking:')) {
      const bookingId = key.slice('booking:'.length);
      const bk = activityBookings.find((b) => b.id === bookingId);
      if (bk) {
        const act = activities.find((a) => a.id === bk.activityId);
        const cur: 'EGP' | 'EUR' = bk.customerType === 'egyptian' ? 'EGP' : 'EUR';
        const existingAddons = bk.selectedPaidAddons || [];
        const existingAddonsSum = existingAddons.reduce(
          (s, a) => s + (cur === 'EGP' ? a.unitPriceEGP : a.unitPriceEUR) * a.quantity,
          0
        );
        const rawBookingTotal = cur === 'EGP' ? bk.totalPriceEGP : bk.totalPriceEUR;
        const base = Math.max(0, rawBookingTotal - existingAddonsSum);
        setBookingRef(bk.bookingCode);
        setSelectedActivityId(bk.activityId);
        setActivityTitle(bk.activityName);
        setReceivedCurrency(cur);
        setBaseReceivedAmount(base);
        setTotalBookingCostEUR(
          cur === 'EUR'
            ? rawBookingTotal
            : Number((rawBookingTotal / (lockedExchangeRate || 50)).toFixed(2))
        );
        setCashierAddonItems(buildAddonsForActivity(act, existingAddons));
      }
      return;
    }

    if (key.startsWith('activity:')) {
      const actId = key.slice('activity:'.length);
      const act = activities.find((a) => a.id === actId);
      if (act) {
        setSelectedActivityId(act.id);
        setActivityTitle(act.name);
        setCashierAddonItems(buildAddonsForActivity(act));
      }
      return;
    }

    setCashierAddonItems([]);
  };

  const handleCashierAddonQtyChange = (addonId: string, nextQty: number) => {
    const safeQty = Math.max(0, Math.floor(nextQty) || 0);
    setCashierAddonItems((prev) =>
      prev.map((item) => (item.id === addonId ? { ...item, quantity: safeQty } : item))
    );
  };

  const cashierAddonsTotalInCurrency = useMemo(
    () =>
      cashierAddonItems.reduce(
        (sum, item) =>
          sum + (receivedCurrency === 'EGP' ? item.unitPriceEGP : item.unitPriceEUR) * item.quantity,
        0
      ),
    [cashierAddonItems, receivedCurrency]
  );

  const cashierAddonsTotalEUR = useMemo(
    () =>
      cashierAddonItems.reduce(
        (sum, item) =>
          sum +
          (item.unitPriceEUR > 0
            ? item.unitPriceEUR
            : item.unitPriceEGP / (lockedExchangeRate || 50)) *
            item.quantity,
        0
      ),
    [cashierAddonItems, lockedExchangeRate]
  );

  const totalReceivedAmount = baseReceivedAmount + cashierAddonsTotalInCurrency;

  const calculatedAccountingEUR =
    receivedCurrency === 'EUR'
      ? totalReceivedAmount
      : Number((totalReceivedAmount / (lockedExchangeRate || 1)).toFixed(2));

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenAddons = cashierAddonItems.filter((a) => a.quantity > 0);
    const effectiveTotalCostEUR = Math.max(
      totalBookingCostEUR,
      calculatedAccountingEUR
    );
    onAddNewCollection({
      bookingRef,
      activityId: selectedActivityId || 'act-yacht-01',
      activityTitle,
      collectorName,
      collectorRole,
      collectorOrg,
      receivedAmount: totalReceivedAmount,
      receivedCurrency,
      lockedExchangeRate,
      accountingValueEUR: calculatedAccountingEUR,
      receiptNumber,
      planType,
      totalBookingCostEUR: effectiveTotalCostEUR,
      totalPaidEUR: calculatedAccountingEUR,
      remainingAmountEUR: Math.max(0, effectiveTotalCostEUR - calculatedAccountingEUR),
      selectedPaidAddons: chosenAddons.length > 0 ? chosenAddons : undefined,
      notes
    });
    setShowAddReceiptModal(false);
  };

  const handleCreateSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestSettlement({
      requestedByOwnerId: 'own-001',
      ownerName: settlementOwnerName,
      amountEUR: settlementAmountEUR,
      reason: settlementReason
    });
    setShowSettlementModal(false);
  };

  const handleApproveAuditing = () => {
    if (!auditingSettlement) return;
    onAuditSettlement(auditingSettlement.id, true, auditNotes || 'تم التحقق من المستندات واعتماد التسوية المالية وتحديث الرصيد.');
    setAuditingSettlement(null);
    setAuditNotes('');
  };

  const handleRejectAuditing = () => {
    if (!auditingSettlement) return;
    onAuditSettlement(auditingSettlement.id, false, auditNotes || 'تم رفض التسوية لعدم كفاية المستندات المؤيدة.');
    setAuditingSettlement(null);
    setAuditNotes('');
  };

  const cashierColumnOptions = useMemo<Record<CashierColKey, RegistryFilterOption[]>>(() => {
    const rcptMap = new Map<string, { sub: string; count: number }>();
    const actMap = new Map<string, number>();
    const colMap = new Map<string, { sub: string; count: number }>();
    const amtMap = new Map<string, number>();
    const rateMap = new Map<string, number>();
    const eurMap = new Map<string, number>();
    const planMap = new Map<PaymentPlanType, number>();
    const statusMap = new Map<CollectionRecord['status'], number>();

    collections.forEach((col) => {
      const rcptVal = col.receiptNumber || '—';
      const prevR = rcptMap.get(rcptVal);
      rcptMap.set(rcptVal, { sub: col.bookingRef, count: (prevR?.count || 0) + 1 });
      actMap.set(col.activityTitle, (actMap.get(col.activityTitle) || 0) + 1);
      const prevC = colMap.get(col.collectorName);
      colMap.set(col.collectorName, { sub: getCollectorRoleArabic(col.collectorRole), count: (prevC?.count || 0) + 1 });
      const amtKey = `${col.receivedAmount.toLocaleString()} ${col.receivedCurrency}`;
      amtMap.set(amtKey, (amtMap.get(amtKey) || 0) + 1);
      const rateKey = `1€ = ${col.lockedExchangeRate} ج.م`;
      rateMap.set(rateKey, (rateMap.get(rateKey) || 0) + 1);
      const eurKey = col.accountingValueEUR.toFixed(2);
      eurMap.set(eurKey, (eurMap.get(eurKey) || 0) + 1);
      planMap.set(col.planType, (planMap.get(col.planType) || 0) + 1);
      statusMap.set(col.status, (statusMap.get(col.status) || 0) + 1);
    });

    return {
      receiptNumber: Array.from(rcptMap.entries()).map(([v, m]) => ({ value: v, label: v, subLabel: m.sub, dir: 'ltr', count: m.count })),
      activityTitle: Array.from(actMap.entries()).map(([v, count]) => ({ value: v, label: v, count })),
      collectorName: Array.from(colMap.entries()).map(([v, m]) => ({ value: v, label: v, subLabel: m.sub, count: m.count })),
      receivedAmount: Array.from(amtMap.entries()).map(([v, count]) => ({ value: v, label: v, dir: 'ltr', count })),
      lockedExchangeRate: Array.from(rateMap.entries()).map(([v, count]) => ({ value: v, label: v, count })),
      accountingValueEUR: Array.from(eurMap.entries()).map(([v, count]) => ({ value: v, label: `€${v}`, dir: 'ltr', count })),
      planType: Array.from(planMap.entries()).map(([p, count]) => ({ value: p, label: PLAN_LABELS[p], count })),
      status: Array.from(statusMap.entries()).map(([s, count]) => ({ value: s, label: COLLECTION_STATUS_LABELS[s] || s, count }))
    };
  }, [collections]);

  const filteredCollections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const { columnFilters: cf, selectedColumnFilters: scf, sortColumn, sortDirection } = tableState;
    const fRcpt = cf.receiptNumber.trim().toLowerCase();
    const fAct = cf.activityTitle.trim().toLowerCase();
    const fCol = cf.collectorName.trim().toLowerCase();
    const fAmt = cf.receivedAmount.trim().toLowerCase();
    const fRate = cf.lockedExchangeRate.trim().toLowerCase();
    const fEur = cf.accountingValueEUR.trim().toLowerCase();
    const fPlan = cf.planType.trim().toLowerCase();
    const fStatus = cf.status.trim().toLowerCase();

    const out = collections.filter((col) => {
      const rcptVal = col.receiptNumber || '—';
      const amtKey = `${col.receivedAmount.toLocaleString()} ${col.receivedCurrency}`;
      const rateKey = `1€ = ${col.lockedExchangeRate} ج.م`;
      const eurKey = col.accountingValueEUR.toFixed(2);
      const statusLabel = COLLECTION_STATUS_LABELS[col.status] || col.status;

      if (q) {
        const blob = `${rcptVal} ${col.bookingRef} ${col.activityTitle} ${col.collectorName} ${getCollectorRoleArabic(col.collectorRole)} ${amtKey} ${rateKey} €${eurKey} ${PLAN_LABELS[col.planType]} ${statusLabel}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }

      if (scf.receiptNumber.length > 0 ? !scf.receiptNumber.includes(rcptVal) : fRcpt && !`${rcptVal} ${col.bookingRef}`.toLowerCase().includes(fRcpt)) return false;
      if (scf.activityTitle.length > 0 ? !scf.activityTitle.includes(col.activityTitle) : fAct && !col.activityTitle.toLowerCase().includes(fAct)) return false;
      if (scf.collectorName.length > 0 ? !scf.collectorName.includes(col.collectorName) : fCol && !`${col.collectorName} ${getCollectorRoleArabic(col.collectorRole)}`.toLowerCase().includes(fCol)) return false;
      if (scf.receivedAmount.length > 0 ? !scf.receivedAmount.includes(amtKey) : fAmt && !amtKey.toLowerCase().includes(fAmt)) return false;
      if (scf.lockedExchangeRate.length > 0 ? !scf.lockedExchangeRate.includes(rateKey) : fRate && !rateKey.toLowerCase().includes(fRate)) return false;
      if (scf.accountingValueEUR.length > 0 ? !scf.accountingValueEUR.includes(eurKey) : fEur && !`€${eurKey}`.toLowerCase().includes(fEur)) return false;
      if (scf.planType.length > 0 ? !scf.planType.includes(col.planType) : fPlan && !PLAN_LABELS[col.planType].toLowerCase().includes(fPlan)) return false;
      if (scf.status.length > 0 ? !scf.status.includes(col.status) : fStatus && !statusLabel.toLowerCase().includes(fStatus)) return false;

      return true;
    });

    if (!sortColumn) return out;
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...out].sort((a, b) => {
      switch (sortColumn) {
        case 'receiptNumber': return (a.receiptNumber || '').localeCompare(b.receiptNumber || '', 'en') * dir;
        case 'activityTitle': return a.activityTitle.localeCompare(b.activityTitle, 'ar') * dir;
        case 'collectorName': return a.collectorName.localeCompare(b.collectorName, 'ar') * dir;
        case 'receivedAmount': return (a.receivedAmount - b.receivedAmount) * dir;
        case 'lockedExchangeRate': return (a.lockedExchangeRate - b.lockedExchangeRate) * dir;
        case 'accountingValueEUR': return (a.accountingValueEUR - b.accountingValueEUR) * dir;
        case 'planType': return PLAN_LABELS[a.planType].localeCompare(PLAN_LABELS[b.planType], 'ar') * dir;
        case 'status': return (COLLECTION_STATUS_LABELS[a.status] || '').localeCompare(COLLECTION_STATUS_LABELS[b.status] || '', 'ar') * dir;
      }
    });
  }, [collections, searchQuery, tableState.columnFilters, tableState.selectedColumnFilters, tableState.sortColumn, tableState.sortDirection]);

  const cashierFilterColsConfig: Array<{
    col: CashierColKey;
    placeholder: string;
    minWidth: string;
    dir?: 'ltr' | 'rtl';
    extraClass?: string;
    getLabel?: (v: string) => string;
  }> = [
    { col: 'receiptNumber', placeholder: 'الإيصال / الحجز...', minWidth: 'min-w-[105px]', dir: 'ltr', extraClass: 'font-mono' },
    { col: 'activityTitle', placeholder: 'النشاط...', minWidth: 'min-w-[125px]' },
    { col: 'collectorName', placeholder: 'المحصل...', minWidth: 'min-w-[115px]' },
    { col: 'receivedAmount', placeholder: 'المبلغ...', minWidth: 'min-w-[90px]', dir: 'ltr', extraClass: 'text-left font-mono' },
    { col: 'lockedExchangeRate', placeholder: 'سعر الصرف...', minWidth: 'min-w-[95px]', extraClass: 'text-center' },
    { col: 'accountingValueEUR', placeholder: 'اليورو...', minWidth: 'min-w-[85px]', dir: 'ltr', extraClass: 'text-left font-mono', getLabel: (v) => `€${v}` },
    { col: 'planType', placeholder: 'الدفعة...', minWidth: 'min-w-[85px]', getLabel: (v) => PLAN_LABELS[v as PaymentPlanType] || v },
    { col: 'status', placeholder: 'الحالة...', minWidth: 'min-w-[95px]', getLabel: (v) => COLLECTION_STATUS_LABELS[v as CollectionRecord['status']] || v }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Statistics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1">إجمالي المقبوضات اليدوية</div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            €{collections.reduce((acc, c) => acc + c.accountingValueEUR, 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">القيمة المحاسبية باليورو المرجعي</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1">المحصل بالجنيه المصري EGP</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {collections.filter(c => c.receivedCurrency === 'EGP').reduce((acc, c) => acc + c.receivedAmount, 0).toLocaleString()} ج.م
          </div>
          <div className="text-[11px] text-slate-400 mt-1">بسعر صرف مثبت وقت التحصيل</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1">المحصل المباشر باليورو EUR</div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            €{collections.filter(c => c.receivedCurrency === 'EUR').reduce((acc, c) => acc + c.receivedAmount, 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">استلام مباشر من الأفواج الأجنبية</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs text-slate-400 mb-1">تسويات بانتظار المدير المالي</div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {settlements.filter(s => s.status === 'pending_siyahia_review').length}
          </div>
          <div className="text-[11px] text-amber-500/80 mt-1">تتطلب اعتماد مسؤول منصة Siyahia</div>
        </div>
      </div>

      {/* Manual Collection Records Table (Section 5 items 23, 24, 25, 26, 27) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-cyan-400" />
              23-27. سجل عمليات التحصيل اليدوي وسعر الصرف المثبت
            </h3>
            <p className="text-xs text-slate-400">
              الدفع يتم يدوياً عبر: موظف، مندوب، منفذ، صاحب نشاط، سائق. سعر الصرف يحدده المحصل ويُثبت نهائياً.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالإيصال، المحصل، النشاط..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={handleOpenAddReceiptModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ تسجيل إيصال تحصيل جديد</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <RegistryFilterSummaryBar
            filteredCount={filteredCollections.length}
            totalCount={collections.length}
            itemNoun="إيصال تحصيل"
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
                    <button type="button" onClick={() => tableState.handleToggleSort('receiptNumber')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>رقم الإيصال / الحجز</span>
                      <RegistrySortIcon column="receiptNumber" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button type="button" onClick={() => tableState.handleToggleSort('activityTitle')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>النشاط المستهدف</span>
                      <RegistrySortIcon column="activityTitle" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button type="button" onClick={() => tableState.handleToggleSort('collectorName')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>الشخص المحصل وصفته</span>
                      <RegistrySortIcon column="collectorName" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-left">
                    <button type="button" onClick={() => tableState.handleToggleSort('receivedAmount')} className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>المبلغ المستلم</span>
                      <RegistrySortIcon column="receivedAmount" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">
                    <button type="button" onClick={() => tableState.handleToggleSort('lockedExchangeRate')} className="inline-flex items-center justify-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>سعر الصرف المثبت</span>
                      <RegistrySortIcon column="lockedExchangeRate" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-left">
                    <button type="button" onClick={() => tableState.handleToggleSort('accountingValueEUR')} className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>القيمة المحاسبية باليورو (€)</span>
                      <RegistrySortIcon column="accountingValueEUR" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button type="button" onClick={() => tableState.handleToggleSort('planType')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>نوع الدفعة</span>
                      <RegistrySortIcon column="planType" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button type="button" onClick={() => tableState.handleToggleSort('status')} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                      <span>الحالة</span>
                      <RegistrySortIcon column="status" sortColumn={tableState.sortColumn} sortDirection={tableState.sortDirection} />
                    </button>
                  </th>
                </tr>

                <tr className="bg-slate-900/90 border-t border-slate-800/80 font-normal normal-case">
                  {cashierFilterColsConfig.map(({ col, placeholder, minWidth, dir, extraClass = '', getLabel }) => {
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
                            tableState.updateDropdownPosition(col, WIDE_CASHIER_COLS);
                            tableState.setOpenDropdownCol(col);
                          }}
                          onClick={() => {
                            tableState.updateDropdownPosition(col, WIDE_CASHIER_COLS);
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
                              tableState.updateDropdownPosition(col, WIDE_CASHIER_COLS);
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {filteredCollections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-tajawal">
                      لا توجد إيصالات تحصيل مطابقة للبحث أو فلاتر الأعمدة المحددة.
                    </td>
                  </tr>
                ) : (
                  filteredCollections.map((col) => (
                <tr key={col.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{col.receiptNumber}</div>
                    <div className="text-[10px] text-slate-500">{col.bookingRef} · {col.collectedAt}</div>
                  </td>
                  <td className="py-3 px-4 font-tajawal text-slate-200">
                    <div className="line-clamp-1">{col.activityTitle}</div>
                    {col.selectedPaidAddons && col.selectedPaidAddons.length > 0 && (
                      <div className="text-[10px] text-cyan-300 mt-0.5 tabular-nums">
                        إضافات: {col.selectedPaidAddons.map((ad) => `${ad.title} × ${ad.quantity}`).join(' · ')}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-tajawal">
                    <div className="font-semibold text-slate-200">{col.collectorName}</div>
                    <div className="text-[10px] text-cyan-400">{getCollectorRoleArabic(col.collectorRole)}</div>
                  </td>
                  <td className="py-3 px-4 text-left font-bold text-white">
                    {col.receivedAmount.toLocaleString()} {col.receivedCurrency}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px] text-slate-300">
                      1€ = {col.lockedExchangeRate} ج.م
                    </span>
                  </td>
                  <td className="py-3 px-4 text-left font-bold text-cyan-300">
                    €{col.accountingValueEUR.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-tajawal text-[11px]">
                    {col.planType === 'deposit' && <span className="text-amber-400">مقدم رحلة</span>}
                    {col.planType === 'full' && <span className="text-emerald-400">سداد كامل</span>}
                    {col.planType === 'installments' && <span className="text-cyan-400">أقساط</span>}
                  </td>
                  <td className="py-3 px-4 font-tajawal">
                    {col.status === 'confirmed' ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> مؤكد
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5" /> بانتظار التأكيد
                      </span>
                    )}
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
              title={CASHIER_DROPDOWN_TITLES[tableState.openDropdownCol]}
              options={cashierColumnOptions[tableState.openDropdownCol] || []}
              filterText={tableState.columnFilters[tableState.openDropdownCol]}
              selectedValues={tableState.selectedColumnFilters[tableState.openDropdownCol]}
              onToggleValue={tableState.handleToggleColumnFilterValue}
              onClearCol={tableState.handleClearCol}
              onClose={() => tableState.setOpenDropdownCol(null)}
            />
          )}
        </div>
      </div>

      {/* Settlements & Platform Financial Auditor Console (Section 5 items 28 & 29) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              28 & 29. التسويات المالية ومسؤول إدارة Siyahia المالي
            </h3>
            <p className="text-xs text-slate-400">
              المندوب لا يستطيع التعديل؛ صاحب النشاط يطلب التسوية؛ لا تصبح نهائية إلا باعتماد مسؤول المنصة المالي بسجل تدقيق كامل.
            </p>
          </div>

          <button
            onClick={() => setShowSettlementModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>طلب تسوية مالية (صاحب النشاط)</span>
          </button>
        </div>

        <div className="space-y-3">
          {settlements.map((st) => (
            <div
              key={st.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-bold">{st.id}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="font-semibold text-white">{st.ownerName}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-400">{st.createdAt}</span>
                </div>

                <div className="text-slate-300 font-tajawal text-xs leading-relaxed">
                  {st.reason}
                </div>

                {st.siyahiaAuditorDecision && (
                  <div className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-400">
                    <span className="text-emerald-400 font-semibold block mb-0.5">
                      قرار مسؤول المنصة ({st.siyahiaAuditorDecision.auditorName}):
                    </span>
                    {st.siyahiaAuditorDecision.decisionNotes} ({st.siyahiaAuditorDecision.decisionDate})
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-left font-mono">
                  <div className="text-[10px] text-slate-400">مبلغ التسوية:</div>
                  <div className="text-base font-bold text-amber-300">€{st.amountEUR.toFixed(2)}</div>
                </div>

                <div>
                  {st.status === 'approved_by_admin' && (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-md font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> معتمدة نهائياً
                    </span>
                  )}
                  {st.status === 'rejected_by_admin' && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-md font-semibold flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> مرفوضة
                    </span>
                  )}
                  {st.status === 'pending_siyahia_review' && (
                    <button
                      onClick={() => {
                        setAuditingSettlement(st);
                        setAuditNotes('');
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>مراجعة المسؤول المالي</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add Collection Receipt */}
      {showAddReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleCreateCollection}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white">تسجيل إيصال تحصيل يدوي جديد</h3>
              <button
                type="button"
                onClick={() => setShowAddReceiptModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {(activityBookings.length > 0 || activities.length > 0) && (
                <div>
                  <label className="text-slate-400 block mb-1">
                    ربط بحجز أو نشاط (لجلب الإضافات المدفوعة وحسابها أوتوماتيك بالكمية):
                  </label>
                  <select
                    value={selectedSourceKey}
                    onChange={(e) => handleSelectCashierSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                  >
                    <option value="custom">-- إدخال يدوي حر --</option>
                    {activityBookings.length > 0 && (
                      <optgroup label="حجوزات الأنشطة القائمة">
                        {activityBookings.map((bk) => (
                          <option key={bk.id} value={`booking:${bk.id}`}>
                            #{bk.bookingCode} · {bk.customerName} — {bk.activityName}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {activities.length > 0 && (
                      <optgroup label="الأنشطة المسجلة">
                        {activities.map((act) => (
                          <option key={act.id} value={`activity:${act.id}`}>
                            {act.name} ({act.inclusions?.paidAddons?.length || 0} إضافات مدفوعة)
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">رقم الحجز المرجعي:</label>
                  <input
                    type="text"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">رقم الإيصال الورقي/الرقمي:</label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">23. صفة الشخص المستلم (أحد الـ 5 المعتمدين):</label>
                <select
                  value={collectorRole}
                  onChange={(e) => setCollectorRole(e.target.value as ManualCashierRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                >
                  <option value="company_employee">1. موظف الشركة</option>
                  <option value="company_delegate">2. مندوب الشركة</option>
                  <option value="operator">3. المنفذ</option>
                  <option value="activity_owner">4. صاحب النشاط</option>
                  <option value="driver">5. السائق</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">اسم الشخص المحصل:</label>
                  <input
                    type="text"
                    value={collectorName}
                    onChange={(e) => setCollectorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">الجهة التابع لها:</label>
                  <input
                    type="text"
                    value={collectorOrg}
                    onChange={(e) => setCollectorOrg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
              </div>

              {/* Automatic Quantity-Based Paid Add-ons at Collection */}
              {cashierAddonItems.length > 0 && (
                <div className="p-3 bg-slate-950 border border-cyan-500/35 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-cyan-300 font-bold text-[11px]">
                      الإضافات الاختيارية المدفوعة وقت التحصيل (حساب أوتوماتيك بالكمية):
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300 tabular-nums">
                      +{cashierAddonsTotalInCurrency.toLocaleString()} {receivedCurrency}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {cashierAddonItems.map((item) => {
                      const unitPrice =
                        receivedCurrency === 'EGP' ? item.unitPriceEGP : item.unitPriceEUR;
                      const subtotal = unitPrice * item.quantity;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 border ${
                            item.quantity > 0
                              ? 'bg-emerald-950/35 border-emerald-500/45'
                              : 'bg-slate-900/70 border-slate-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white truncate">{item.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                              {unitPrice.toLocaleString()} {receivedCurrency}
                              {item.unitLabel ? ` / ${item.unitLabel}` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCashierAddonQtyChange(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={item.quantity}
                              onChange={(e) =>
                                handleCashierAddonQtyChange(
                                  item.id,
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="w-11 bg-slate-900 border border-slate-700 rounded py-0.5 text-center font-mono text-white font-bold tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() => handleCashierAddonQtyChange(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                            >
                              +
                            </button>
                            <span className="font-mono text-[11px] text-emerald-300 font-bold min-w-[64px] text-left tabular-nums">
                              {subtotal > 0 ? `+${subtotal.toLocaleString()}` : '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Amount, Currency & Fixed Exchange Rate (Section 5 item 27) */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">المبلغ الأساسي المقبوض:</label>
                    <input
                      type="number"
                      min={0}
                      value={baseReceivedAmount}
                      onChange={(e) => setBaseReceivedAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-white text-center font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">العملة المستلمة:</label>
                    <select
                      value={receivedCurrency}
                      onChange={(e) => setReceivedCurrency(e.target.value as 'EGP' | 'EUR')}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-slate-200"
                    >
                      <option value="EGP">جنيه (EGP)</option>
                      <option value="EUR">يورو (€ EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">سعر الصرف المثبت:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={lockedExchangeRate}
                      onChange={(e) => setLockedExchangeRate(parseFloat(e.target.value) || 50)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-cyan-300 text-center font-bold tabular-nums"
                    />
                  </div>
                </div>

                {cashierAddonsTotalInCurrency > 0 && (
                  <div className="flex justify-between items-center text-[11px] pt-1 text-emerald-300 tabular-nums border-t border-slate-800/80">
                    <span>الإجمالي النهائي للتحصيل (الأساسي + الإضافات بالكمية):</span>
                    <span className="font-mono font-bold">
                      {totalReceivedAmount.toLocaleString()} {receivedCurrency}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[11px] pt-1 text-slate-400">
                  <span>القيمة المحاسبية باليورو المرجعي:</span>
                  <span className="font-mono text-cyan-400 font-bold text-sm tabular-nums">
                    €{calculatedAccountingEUR.toFixed(2)}
                    {cashierAddonsTotalEUR > 0 ? ` (يشمل €${cashierAddonsTotalEUR.toFixed(2)} إضافات)` : ''}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">25. نظام الدفعة:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlanType('deposit')}
                    className={`p-1.5 rounded border text-center ${
                      planType === 'deposit' ? 'border-cyan-500 bg-cyan-600/20 text-cyan-300 font-bold' : 'border-slate-800'
                    }`}
                  >
                    دفع مقدم
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanType('full')}
                    className={`p-1.5 rounded border text-center ${
                      planType === 'full' ? 'border-cyan-500 bg-cyan-600/20 text-cyan-300 font-bold' : 'border-slate-800'
                    }`}
                  >
                    دفع كامل
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanType('installments')}
                    className={`p-1.5 rounded border text-center ${
                      planType === 'installments' ? 'border-cyan-500 bg-cyan-600/20 text-cyan-300 font-bold' : 'border-slate-800'
                    }`}
                  >
                    على مراحل
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ملاحظات التحصيل:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddReceiptModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg"
              >
                تأكيد وحفظ الإيصال
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Request Settlement by Owner */}
      {showSettlementModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleCreateSettlement}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white">طلب تسوية مالية جديدة (صاحب النشاط)</h3>
              <button
                type="button"
                onClick={() => setShowSettlementModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">صاحب النشاط طالب التسوية:</label>
                <input
                  type="text"
                  value={settlementOwnerName}
                  onChange={(e) => setSettlementOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">قيمة التسوية المطلوبة باليورو (€):</label>
                <input
                  type="number"
                  min={1}
                  value={settlementAmountEUR}
                  onChange={(e) => setSettlementAmountEUR(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 font-mono text-cyan-300 text-center font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">سبب التسوية الإلزامي (القسم 5 بند 28):</label>
                <textarea
                  rows={3}
                  value={settlementReason}
                  onChange={(e) => setSettlementReason(e.target.value)}
                  placeholder="يجب ذكر السبب والمستندات الداعمة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSettlementModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg"
              >
                إرسال للاعتماد المالي
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Siyahia Financial Auditor Decision Console */}
      {auditingSettlement && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">
                  29. مراجعة واعتماد المسؤول المالي لمنصة Siyahia
                </h3>
              </div>
              <button
                onClick={() => setAuditingSettlement(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">مقدم الطلب:</span>
                <span className="text-white font-bold">{auditingSettlement.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">القيمة:</span>
                <span className="font-mono text-cyan-300 font-bold">€{auditingSettlement.amountEUR.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-800 pt-1 text-slate-300">
                <span className="text-slate-400 block mb-0.5">السبب المالي المذكور:</span>
                {auditingSettlement.reason}
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-semibold block">
                ملاحظات التدقيق وسجل الاعتماد المالي:
              </label>
              <textarea
                rows={2}
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="أدخل ملاحظات المراجعة والمطابقة الفواتير..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAuditingSettlement(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                إغلاق
              </button>
              <button
                onClick={handleRejectAuditing}
                className="px-3.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-bold text-xs rounded-lg"
              >
                رفض التسوية
              </button>
              <button
                onClick={handleApproveAuditing}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                اعتماد التسوية وتعديل الرصيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
