import React, { useMemo, useState } from 'react';
import {
  Utensils,
  Plus,
  Minus,
  Trash2,
  Search,
  User,
  Phone,
  Compass,
  Ship,
  ReceiptText,
  Calendar,
  CheckCircle2,
  ListChecks,
  Layers,
  X,
  Printer
} from 'lucide-react';
import type { Activity } from '../../types/activity';
import type { TripRecord } from '../../types/trip';
import type { MasterAddonItem } from '../../types/addon';
import type { PersonProfile } from '../../types/personProfile';
import type {
  InTripAddonRequestRecord,
  SelectedPaidAddonItem
} from '../../types/finance';
import type { BookingRequest } from '../trips/BookingQueueModal';
import type { TripBooking } from './BookingsManagerView';
import {
  InvoiceVoucherData,
  InvoiceVoucherModal
} from '../shared/InvoiceVoucherModal';

interface InTripRequestsViewProps {
  activities: Activity[];
  trips: TripRecord[];
  masterAddons: MasterAddonItem[];
  activityBookings: BookingRequest[];
  tripBookings: TripBooking[];
  personProfiles?: PersonProfile[];
  inTripRequests: InTripAddonRequestRecord[];
  onAddRequest: (record: InTripAddonRequestRecord) => void;
  onUpdateRequest: (record: InTripAddonRequestRecord) => void;
  onDeleteRequest: (requestId: string) => void;
}

interface CatalogAddonOption {
  key: string;
  addonId?: string;
  title: string;
  category: string;
  unitLabel: string;
  priceEGP: number;
  priceEUR: number;
  sourceLabel: string;
}

interface DraftLineItem {
  draftId: string;
  addonId?: string;
  title: string;
  unitLabel: string;
  unitPriceEGP: number;
  unitPriceEUR: number;
  quantity: number;
}

interface EndOfDayInvoiceGroup {
  groupKey: string;
  customerPhone: string;
  customerName: string;
  customerType: 'egyptian' | 'foreigner';
  targetKind: 'activity' | 'trip';
  targetId: string;
  targetTitle: string;
  tripDate: string;
  linkedBookingId?: string;
  linkedBookingKind?: 'activity_booking' | 'trip_booking';
  linkedBookingCode?: string;
  baseInvoiceEGP: number;
  baseInvoiceEUR: number;
  checkoutAddonsEGP: number;
  checkoutAddonsEUR: number;
  requests: InTripAddonRequestRecord[];
  addedRequestsEGP: number;
  addedRequestsEUR: number;
  finalInvoiceEGP: number;
  finalInvoiceEUR: number;
  totalItemsCount: number;
}

const getTodayIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const normalizePhone = (value: string): string =>
  value.replace(/\s+/g, '').replace(/-/g, '').trim().toLowerCase();

export const InTripRequestsView: React.FC<InTripRequestsViewProps> = ({
  activities,
  trips,
  masterAddons,
  activityBookings,
  tripBookings,
  personProfiles = [],
  inTripRequests,
  onAddRequest,
  onUpdateRequest,
  onDeleteRequest
}) => {
  // Customer & target form state
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerType, setCustomerType] = useState<'egyptian' | 'foreigner'>('egyptian');
  const [tripDate, setTripDate] = useState<string>(getTodayIso);
  const [targetKind, setTargetKind] = useState<'activity' | 'trip'>('activity');
  const [targetId, setTargetId] = useState<string>(() => activities[0]?.id || '');
  const [targetTitle, setTargetTitle] = useState<string>(() => activities[0]?.name || '');
  const [linkedBookingId, setLinkedBookingId] = useState<string | undefined>(undefined);
  const [linkedBookingKind, setLinkedBookingKind] = useState<
    'activity_booking' | 'trip_booking' | undefined
  >(undefined);
  const [linkedBookingCode, setLinkedBookingCode] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');

  // Multi-value add-on lines (allows multiple DB items AND multiple rows for the same item with independent qty/price)
  const [draftLines, setDraftLines] = useState<DraftLineItem[]>([]);
  const [addonSearch, setAddonSearch] = useState<string>('');
  const [addonCategoryFilter, setAddonCategoryFilter] = useState<string>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Bottom view state
  const [activeTab, setActiveTab] = useState<'eod_invoices' | 'requests_log'>('eod_invoices');
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [activeVoucher, setActiveVoucher] = useState<InvoiceVoucherData | null>(null);

  const openEndOfDayVoucher = (inv: EndOfDayInvoiceGroup) => {
    const matchedAct = activities.find(
      (a) => a.id === inv.targetId || a.name === inv.targetTitle
    );
    const duringTripItems: SelectedPaidAddonItem[] = inv.requests.flatMap((r) => r.items);
    let checkoutAddons: SelectedPaidAddonItem[] = [];
    if (inv.linkedBookingId) {
      if (inv.linkedBookingKind === 'activity_booking') {
        const bk = activityBookings.find((b) => b.id === inv.linkedBookingId);
        checkoutAddons = (bk?.selectedPaidAddons || []).filter(
          (a) => a.stage !== 'during_trip'
        );
      } else if (inv.linkedBookingKind === 'trip_booking') {
        const tb = tripBookings.find((t) => t.id === inv.linkedBookingId);
        checkoutAddons = (tb?.selectedPaidAddons || []).filter(
          (a) => a.stage !== 'during_trip'
        );
      }
    }

    setActiveVoucher({
      documentKind: 'end_of_day_invoice',
      code: inv.linkedBookingCode || inv.requests[0]?.requestCode || `EOD-${inv.tripDate}`,
      title: inv.targetTitle,
      companyName: matchedAct?.owner?.companyName || 'ZanoZa · Siyahia',
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      customerType: inv.customerType,
      tripDate: inv.tripDate,
      statusLabel: 'فاتورة نهاية اليوم المجمعة',
      basePriceEGP: inv.baseInvoiceEGP,
      basePriceEUR: inv.baseInvoiceEUR,
      checkoutAddons,
      duringTripAddons: duringTripItems,
      totalEGP: inv.finalInvoiceEGP,
      totalEUR: inv.finalInvoiceEUR
    });
  };

  // Unified list of available trips (combining Trips store + TripBookings titles)
  const availableTripOptions = useMemo(() => {
    const map = new Map<string, { id: string; title: string; source?: TripRecord }>();
    for (const tr of trips) {
      map.set(tr.id, { id: tr.id, title: tr.name, source: tr });
    }
    for (const tb of tripBookings) {
      const key = `tb-title:${tb.tripTitle.trim()}`;
      const existingByName = Array.from(map.values()).find(
        (v) => v.title.trim() === tb.tripTitle.trim()
      );
      if (!existingByName && !map.has(key)) {
        map.set(key, { id: key, title: tb.tripTitle });
      }
    }
    return Array.from(map.values());
  }, [trips, tripBookings]);

  // Unified booking quick-select options
  const bookingQuickOptions = useMemo(() => {
    const actOpts = activityBookings.map((b) => ({
      refKey: `act_bk:${b.id}`,
      kind: 'activity_booking' as const,
      bookingId: b.id,
      bookingCode: b.bookingCode,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      customerType: b.customerType,
      targetKind: 'activity' as const,
      targetId: b.activityId,
      targetTitle: b.activityName,
      tripDate: b.tripDate || getTodayIso(),
      totalPriceEGP: b.totalPriceEGP,
      totalPriceEUR: b.totalPriceEUR
    }));

    const tripOpts = tripBookings.map((tb) => {
      const matchedTrip = availableTripOptions.find(
        (t) => t.title.trim() === tb.tripTitle.trim()
      );
      return {
        refKey: `trp_bk:${tb.id}`,
        kind: 'trip_booking' as const,
        bookingId: tb.id,
        bookingCode: tb.bookingCode,
        customerName: tb.customerName,
        customerPhone: tb.customerPhone,
        customerType: tb.customerType,
        targetKind: 'trip' as const,
        targetId: matchedTrip?.id || `tb-title:${tb.tripTitle.trim()}`,
        targetTitle: tb.tripTitle,
        tripDate: tb.departureDate || getTodayIso(),
        totalPriceEGP: tb.totalPriceEGP,
        totalPriceEUR: tb.totalPriceEUR
      };
    });

    return [...actOpts, ...tripOpts];
  }, [activityBookings, tripBookings, availableTripOptions]);

  // Selected target entity (for activity/trip-specific paid addon prices)
  const selectedEntity = useMemo(() => {
    if (targetKind === 'activity') {
      return activities.find((a) => a.id === targetId || a.name === targetTitle) || null;
    }
    return trips.find((t) => t.id === targetId || t.name === targetTitle) || null;
  }, [targetKind, targetId, targetTitle, activities, trips]);

  // Combined database paid add-ons catalog:
  // Entity-specific prices from selected Activity/Trip + all active Master Addons from DB
  const databasePaidAddons = useMemo<CatalogAddonOption[]>(() => {
    const merged: CatalogAddonOption[] = [];
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();

    const entityPaidAddons = selectedEntity?.inclusions?.paidAddons || [];
    for (const ad of entityPaidAddons) {
      const normTitle = ad.title.trim().toLowerCase();
      if (ad.addonId) seenIds.add(ad.addonId);
      seenTitles.add(normTitle);
      const catalogMatch = masterAddons.find(
        (m) => m.id === ad.addonId || m.title.trim().toLowerCase() === normTitle
      );
      merged.push({
        key: `entity-${ad.id}`,
        addonId: ad.addonId || catalogMatch?.id || ad.id,
        title: ad.title,
        category: catalogMatch?.category || 'إضافات النشاط / الرحلة',
        unitLabel: ad.unitLabel || catalogMatch?.unitLabel || 'للفرد',
        priceEGP: ad.priceEGP ?? catalogMatch?.suggestedPriceEGP ?? 0,
        priceEUR: ad.priceEUR ?? catalogMatch?.suggestedPriceEUR ?? 0,
        sourceLabel: 'مُسعّر في النشاط/الرحلة'
      });
    }

    for (const m of masterAddons) {
      if (!m.isActive) continue;
      const normTitle = m.title.trim().toLowerCase();
      if (seenIds.has(m.id) || seenTitles.has(normTitle)) continue;
      seenIds.add(m.id);
      seenTitles.add(normTitle);
      merged.push({
        key: `master-${m.id}`,
        addonId: m.id,
        title: m.title,
        category: m.category || 'خدمات عامة',
        unitLabel: m.unitLabel || 'للفرد',
        priceEGP: m.suggestedPriceEGP || 0,
        priceEUR: m.suggestedPriceEUR || 0,
        sourceLabel: 'قاعدة البيانات'
      });
    }

    return merged;
  }, [selectedEntity, masterAddons]);

  const addonCategories = useMemo(() => {
    const cats = new Set<string>();
    databasePaidAddons.forEach((a) => {
      if (a.category) cats.add(a.category);
    });
    return Array.from(cats);
  }, [databasePaidAddons]);

  const filteredDatabaseAddons = useMemo(() => {
    const q = addonSearch.trim().toLowerCase();
    return databasePaidAddons.filter((item) => {
      const matchesCat =
        addonCategoryFilter === 'all' || item.category === addonCategoryFilter;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.unitLabel.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [databasePaidAddons, addonSearch, addonCategoryFilter]);

  // Customer suggestions list for phone/name autocomplete
  const customerDirectory = useMemo(() => {
    const map = new Map<
      string,
      { phone: string; name: string; customerType: 'egyptian' | 'foreigner' }
    >();
    bookingQuickOptions.forEach((b) => {
      const k = normalizePhone(b.customerPhone) || b.customerName;
      if (k && !map.has(k)) {
        map.set(k, {
          phone: b.customerPhone,
          name: b.customerName,
          customerType: b.customerType
        });
      }
    });
    inTripRequests.forEach((r) => {
      const k = normalizePhone(r.customerPhone) || r.customerName;
      if (k && !map.has(k)) {
        map.set(k, {
          phone: r.customerPhone,
          name: r.customerName,
          customerType: r.customerType
        });
      }
    });
    personProfiles.forEach((p) => {
      if (!p.phone) return;
      const k = normalizePhone(p.phone);
      if (k && !map.has(k)) {
        map.set(k, {
          phone: p.phone,
          name: p.name,
          customerType: 'egyptian'
        });
      }
    });
    return Array.from(map.values());
  }, [bookingQuickOptions, inTripRequests, personProfiles]);

  const handleSelectBookingQuickRef = (refKey: string) => {
    setSelectedBookingRef(refKey);
    if (!refKey) {
      setLinkedBookingId(undefined);
      setLinkedBookingKind(undefined);
      setLinkedBookingCode(undefined);
      return;
    }
    const found = bookingQuickOptions.find((o) => o.refKey === refKey);
    if (!found) return;
    setCustomerPhone(found.customerPhone);
    setCustomerName(found.customerName);
    setCustomerType(found.customerType);
    setTargetKind(found.targetKind);
    setTargetId(found.targetId);
    setTargetTitle(found.targetTitle);
    setTripDate(found.tripDate || getTodayIso());
    setLinkedBookingId(found.bookingId);
    setLinkedBookingKind(found.kind);
    setLinkedBookingCode(found.bookingCode);
  };

  const handleTargetKindSwitch = (kind: 'activity' | 'trip') => {
    setTargetKind(kind);
    setSelectedBookingRef('');
    setLinkedBookingId(undefined);
    setLinkedBookingKind(undefined);
    setLinkedBookingCode(undefined);
    if (kind === 'activity') {
      const first = activities[0];
      setTargetId(first?.id || '');
      setTargetTitle(first?.name || '');
    } else {
      const firstTrip = availableTripOptions[0];
      setTargetId(firstTrip?.id || '');
      setTargetTitle(firstTrip?.title || '');
    }
  };

  const handleTargetEntitySelect = (selectedValue: string) => {
    setSelectedBookingRef('');
    setLinkedBookingId(undefined);
    setLinkedBookingKind(undefined);
    setLinkedBookingCode(undefined);
    if (targetKind === 'activity') {
      const act = activities.find((a) => a.id === selectedValue);
      setTargetId(selectedValue);
      setTargetTitle(act?.name || '');
    } else {
      const tr = availableTripOptions.find((t) => t.id === selectedValue);
      setTargetId(selectedValue);
      setTargetTitle(tr?.title || '');
    }
  };

  const handlePhoneInput = (val: string) => {
    setCustomerPhone(val);
    const norm = normalizePhone(val);
    if (!norm) return;
    const matchedCustomer = customerDirectory.find(
      (c) => normalizePhone(c.phone) === norm
    );
    if (matchedCustomer && !customerName.trim()) {
      setCustomerName(matchedCustomer.name);
      setCustomerType(matchedCustomer.customerType);
    }
    const matchedBooking = bookingQuickOptions.find(
      (b) => normalizePhone(b.customerPhone) === norm
    );
    if (matchedBooking && !selectedBookingRef) {
      setLinkedBookingId(matchedBooking.bookingId);
      setLinkedBookingKind(matchedBooking.kind);
      setLinkedBookingCode(matchedBooking.bookingCode);
    }
  };

  // Add an add-on row from the DB list (always adds a distinct row or increments; supports multi-value lines!)
  const handleAddAddonLineFromDb = (addon: CatalogAddonOption, allowDuplicateRow = false) => {
    setFeedbackMessage(null);
    setDraftLines((prev) => {
      if (!allowDuplicateRow) {
        const existingIdx = prev.findIndex(
          (l) =>
            (l.addonId && addon.addonId && l.addonId === addon.addonId) ||
            l.title.trim().toLowerCase() === addon.title.trim().toLowerCase()
        );
        if (existingIdx >= 0) {
          return prev.map((l, idx) =>
            idx === existingIdx ? { ...l, quantity: l.quantity + 1 } : l
          );
        }
      }
      return [
        ...prev,
        {
          draftId: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          addonId: addon.addonId,
          title: addon.title,
          unitLabel: addon.unitLabel,
          unitPriceEGP: addon.priceEGP,
          unitPriceEUR: addon.priceEUR,
          quantity: 1
        }
      ];
    });
  };

  const handleUpdateDraftLine = (
    draftId: string,
    patch: Partial<Pick<DraftLineItem, 'quantity' | 'unitPriceEGP' | 'unitPriceEUR'>>
  ) => {
    setDraftLines((prev) =>
      prev.map((line) => (line.draftId === draftId ? { ...line, ...patch } : line))
    );
  };

  const handleRemoveDraftLine = (draftId: string) => {
    setDraftLines((prev) => prev.filter((l) => l.draftId !== draftId));
  };

  const draftTotals = useMemo(() => {
    return draftLines.reduce(
      (acc, l) => {
        const q = Math.max(0, Math.floor(l.quantity) || 0);
        acc.qty += q;
        acc.egp += (Number(l.unitPriceEGP) || 0) * q;
        acc.eur += (Number(l.unitPriceEUR) || 0) * q;
        return acc;
      },
      { qty: 0, egp: 0, eur: 0 }
    );
  }, [draftLines]);

  const handleSubmitInTripRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim()) {
      setFeedbackMessage({ type: 'error', text: 'يرجى إدخال رقم العميل أولاً.' });
      return;
    }
    if (!customerName.trim()) {
      setFeedbackMessage({ type: 'error', text: 'يرجى إدخال اسم العميل.' });
      return;
    }
    if (!targetTitle.trim()) {
      setFeedbackMessage({ type: 'error', text: 'يرجى اختيار اسم الرحلة أو النشاط.' });
      return;
    }
    const validLines = draftLines.filter((l) => Math.floor(l.quantity) > 0);
    if (validLines.length === 0) {
      setFeedbackMessage({
        type: 'error',
        text: 'يرجى اختيار إضافة مدفوعة واحدة على الأقل وتحديد العدد.'
      });
      return;
    }

    // Try auto-linking to a matching booking if user didn't pick from dropdown
    let resolvedBookingId = linkedBookingId;
    let resolvedBookingKind = linkedBookingKind;
    let resolvedBookingCode = linkedBookingCode;
    if (!resolvedBookingId) {
      const normPhone = normalizePhone(customerPhone);
      const matched = bookingQuickOptions.find(
        (b) =>
          normalizePhone(b.customerPhone) === normPhone &&
          b.targetKind === targetKind &&
          b.targetTitle.trim() === targetTitle.trim()
      );
      if (matched) {
        resolvedBookingId = matched.bookingId;
        resolvedBookingKind = matched.kind;
        resolvedBookingCode = matched.bookingCode;
      }
    }

    const items: SelectedPaidAddonItem[] = validLines.map((l) => ({
      id: `req-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      addonId: l.addonId,
      title: l.title,
      unitLabel: l.unitLabel,
      unitPriceEGP: Math.max(0, Number(l.unitPriceEGP) || 0),
      unitPriceEUR: Math.max(0, Number(l.unitPriceEUR) || 0),
      quantity: Math.max(1, Math.floor(l.quantity) || 1),
      stage: 'during_trip'
    }));

    const totalAddedEGP = items.reduce((s, it) => s + it.unitPriceEGP * it.quantity, 0);
    const totalAddedEUR = Number(
      items.reduce((s, it) => s + it.unitPriceEUR * it.quantity, 0).toFixed(2)
    );

    const nowTime = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const record: InTripAddonRequestRecord = {
      id: `itr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      requestCode: `REQ-${String(Math.floor(1000 + Math.random() * 9000))}`,
      createdAt: `${tripDate} · ${nowTime}`,
      tripDate,
      customerPhone: customerPhone.trim(),
      customerName: customerName.trim(),
      customerType,
      targetKind,
      targetId: targetId || targetTitle.trim(),
      targetTitle: targetTitle.trim(),
      linkedBookingId: resolvedBookingId,
      linkedBookingKind: resolvedBookingKind,
      linkedBookingCode: resolvedBookingCode,
      items,
      totalAddedEGP,
      totalAddedEUR,
      notes: notes.trim() || undefined
    };

    onAddRequest(record);
    setDraftLines([]);
    setNotes('');
    setFeedbackMessage({
      type: 'success',
      text: `تمت إضافة الطلب (${record.requestCode}) للعميل «${record.customerName}» وترحيله إلى فاتورة نهاية اليوم.`
    });
  };

  // Prefill top form from an existing customer's End-of-Day invoice card so operator can add more values in 1 click
  const handlePrefillForAdditionalValue = (group: EndOfDayInvoiceGroup) => {
    setCustomerPhone(group.customerPhone);
    setCustomerName(group.customerName);
    setCustomerType(group.customerType);
    setTargetKind(group.targetKind);
    setTargetId(group.targetId);
    setTargetTitle(group.targetTitle);
    setTripDate(group.tripDate);
    setLinkedBookingId(group.linkedBookingId);
    setLinkedBookingKind(group.linkedBookingKind);
    setLinkedBookingCode(group.linkedBookingCode);
    if (group.linkedBookingId && group.linkedBookingKind) {
      const prefix = group.linkedBookingKind === 'activity_booking' ? 'act_bk:' : 'trp_bk:';
      setSelectedBookingRef(`${prefix}${group.linkedBookingId}`);
    } else {
      setSelectedBookingRef('');
    }
    setFeedbackMessage({
      type: 'success',
      text: `تم تجهيز بيانات «${group.customerName}» لإضافة طلب وقيم جديدة إلى نفس الفاتورة.`
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // End-of-Day Invoices Aggregation (supports multi-value requests per customer + activity/trip + date)
  const endOfDayInvoices = useMemo<EndOfDayInvoiceGroup[]>(() => {
    const groups = new Map<string, EndOfDayInvoiceGroup>();

    for (const req of inTripRequests) {
      const groupKey = req.linkedBookingId
        ? `bk:${req.linkedBookingId}::${req.tripDate}`
        : `cust:${normalizePhone(req.customerPhone)}::${req.targetKind}:${req.targetTitle.trim()}::${req.tripDate}`;

      let existing = groups.get(groupKey);
      if (!existing) {
        let baseEGP = 0;
        let baseEUR = 0;
        let checkoutEGP = 0;
        let checkoutEUR = 0;

        if (req.linkedBookingId) {
          if (req.linkedBookingKind === 'activity_booking') {
            const bk = activityBookings.find((b) => b.id === req.linkedBookingId);
            if (bk) {
              const allAddonsEGP = (bk.selectedPaidAddons || []).reduce(
                (s, a) => s + a.unitPriceEGP * a.quantity,
                0
              );
              const allAddonsEUR = (bk.selectedPaidAddons || []).reduce(
                (s, a) => s + a.unitPriceEUR * a.quantity,
                0
              );
              const nonDuringAddons = (bk.selectedPaidAddons || []).filter(
                (a) => a.stage !== 'during_trip'
              );
              checkoutEGP = nonDuringAddons.reduce((s, a) => s + a.unitPriceEGP * a.quantity, 0);
              checkoutEUR = nonDuringAddons.reduce((s, a) => s + a.unitPriceEUR * a.quantity, 0);
              baseEGP = Math.max(0, bk.totalPriceEGP - allAddonsEGP);
              baseEUR = Math.max(0, bk.totalPriceEUR - allAddonsEUR);
            }
          } else if (req.linkedBookingKind === 'trip_booking') {
            const tb = tripBookings.find((t) => t.id === req.linkedBookingId);
            if (tb) {
              const allAddonsEGP = (tb.selectedPaidAddons || []).reduce(
                (s, a) => s + a.unitPriceEGP * a.quantity,
                0
              );
              const allAddonsEUR = (tb.selectedPaidAddons || []).reduce(
                (s, a) => s + a.unitPriceEUR * a.quantity,
                0
              );
              const nonDuringAddons = (tb.selectedPaidAddons || []).filter(
                (a) => a.stage !== 'during_trip'
              );
              checkoutEGP = nonDuringAddons.reduce((s, a) => s + a.unitPriceEGP * a.quantity, 0);
              checkoutEUR = nonDuringAddons.reduce((s, a) => s + a.unitPriceEUR * a.quantity, 0);
              baseEGP = Math.max(0, tb.totalPriceEGP - allAddonsEGP);
              baseEUR = Math.max(0, tb.totalPriceEUR - allAddonsEUR);
            }
          }
        }

        existing = {
          groupKey,
          customerPhone: req.customerPhone,
          customerName: req.customerName,
          customerType: req.customerType,
          targetKind: req.targetKind,
          targetId: req.targetId,
          targetTitle: req.targetTitle,
          tripDate: req.tripDate,
          linkedBookingId: req.linkedBookingId,
          linkedBookingKind: req.linkedBookingKind,
          linkedBookingCode: req.linkedBookingCode,
          baseInvoiceEGP: baseEGP,
          baseInvoiceEUR: baseEUR,
          checkoutAddonsEGP: checkoutEGP,
          checkoutAddonsEUR: checkoutEUR,
          requests: [],
          addedRequestsEGP: 0,
          addedRequestsEUR: 0,
          finalInvoiceEGP: baseEGP + checkoutEGP,
          finalInvoiceEUR: baseEUR + checkoutEUR,
          totalItemsCount: 0
        };
        groups.set(groupKey, existing);
      }

      existing.requests.push(req);
      existing.addedRequestsEGP += req.totalAddedEGP;
      existing.addedRequestsEUR = Number(
        (existing.addedRequestsEUR + req.totalAddedEUR).toFixed(2)
      );
      existing.totalItemsCount += req.items.reduce((s, i) => s + i.quantity, 0);
      existing.finalInvoiceEGP =
        existing.baseInvoiceEGP + existing.checkoutAddonsEGP + existing.addedRequestsEGP;
      existing.finalInvoiceEUR = Number(
        (
          existing.baseInvoiceEUR +
          existing.checkoutAddonsEUR +
          existing.addedRequestsEUR
        ).toFixed(2)
      );
    }

    return Array.from(groups.values());
  }, [inTripRequests, activityBookings, tripBookings]);

  const filteredEndOfDayInvoices = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase();
    return endOfDayInvoices.filter((g) => {
      const matchesDate = !dateFilter || g.tripDate === dateFilter;
      const matchesQ =
        !q ||
        g.customerPhone.toLowerCase().includes(q) ||
        g.customerName.toLowerCase().includes(q) ||
        g.targetTitle.toLowerCase().includes(q) ||
        (g.linkedBookingCode || '').toLowerCase().includes(q);
      return matchesDate && matchesQ;
    });
  }, [endOfDayInvoices, invoiceSearch, dateFilter]);

  const filteredRequestsLog = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase();
    return inTripRequests.filter((r) => {
      const matchesDate = !dateFilter || r.tripDate === dateFilter;
      const matchesQ =
        !q ||
        r.customerPhone.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.targetTitle.toLowerCase().includes(q) ||
        r.requestCode.toLowerCase().includes(q);
      return matchesDate && matchesQ;
    });
  }, [inTripRequests, invoiceSearch, dateFilter]);

  const handleAdjustSavedItemQuantity = (
    request: InTripAddonRequestRecord,
    itemId: string,
    delta: number
  ) => {
    const nextItems = request.items
      .map((it) =>
        it.id === itemId ? { ...it, quantity: Math.max(0, it.quantity + delta) } : it
      )
      .filter((it) => it.quantity > 0);

    if (nextItems.length === 0) {
      onDeleteRequest(request.id);
      return;
    }

    const totalAddedEGP = nextItems.reduce(
      (s, it) => s + it.unitPriceEGP * it.quantity,
      0
    );
    const totalAddedEUR = Number(
      nextItems.reduce((s, it) => s + it.unitPriceEUR * it.quantity, 0).toFixed(2)
    );

    onUpdateRequest({
      ...request,
      items: nextItems,
      totalAddedEGP,
      totalAddedEUR
    });
  };

  // Global KPI stats
  const kpiStats = useMemo(() => {
    const totalEGP = inTripRequests.reduce((s, r) => s + r.totalAddedEGP, 0);
    const totalEUR = Number(
      inTripRequests.reduce((s, r) => s + r.totalAddedEUR, 0).toFixed(2)
    );
    const totalQty = inTripRequests.reduce(
      (s, r) => s + r.items.reduce((sub, i) => sub + i.quantity, 0),
      0
    );
    return {
      requestsCount: inTripRequests.length,
      customersCount: endOfDayInvoices.length,
      totalQty,
      totalEGP,
      totalEUR
    };
  }, [inTripRequests, endOfDayInvoices]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  طلبات أثناء الرحلة أو النشاط (فاتورة نهاية اليوم)
                </h1>
                <p className="text-xs text-slate-400">
                  تسجيل الإضافات المدفوعة للعملاء أثناء تنفيذ الرحلة أو النشاط وإتاحتها بقيم متعددة تضاف تلقائياً على فاتورة نهاية اليوم.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <span className="block text-[11px] text-slate-400">عدد الطلبات</span>
              <span className="text-lg font-bold text-white font-mono tabular-nums">
                {kpiStats.requestsCount}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <span className="block text-[11px] text-slate-400">فواتير العملاء</span>
              <span className="text-lg font-bold text-cyan-300 font-mono tabular-nums">
                {kpiStats.customersCount}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <span className="block text-[11px] text-slate-400">إضافات (ج.م)</span>
              <span className="text-lg font-bold text-emerald-300 font-mono tabular-nums">
                {kpiStats.totalEGP.toLocaleString()} ج.م
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <span className="block text-[11px] text-slate-400">إضافات (€)</span>
              <span className="text-lg font-bold text-amber-300 font-mono tabular-nums">
                € {kpiStats.totalEUR.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Creation Form: Customer + Entity + Multi-Addon DB Catalog */}
      <form
        onSubmit={handleSubmitInTripRequest}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400 shrink-0" />
            <h2 className="text-base font-bold text-white">
              إضافة طلب جديد أثناء تنفيذ الرحلة أو النشاط
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            يمكن إضافة أكثر من قيمة وطلب لنفس العميل وتُجمع كلها في فاتورة نهاية اليوم
          </span>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Booking Linker */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <label className="block text-xs font-semibold text-cyan-300">
            ربط سريع بحجز مسجل (اختياري — لملء بيانات العميل وإضافة القيمة إلى فاتورة الحجز مباشرة)
          </label>
          <select
            value={selectedBookingRef}
            onChange={(e) => handleSelectBookingQuickRef(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="">— إدخال بيانات عميل ورحلة/نشاط يدوياً أو اختيار غير مرتبط بحجز —</option>
            {bookingQuickOptions.map((opt) => (
              <option key={opt.refKey} value={opt.refKey}>
                #{opt.bookingCode} · {opt.customerName} ({opt.customerPhone}) — {opt.targetTitle}
              </option>
            ))}
          </select>
        </div>

        {/* Customer & Activity/Trip Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* رقم العميل */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              رقم العميل (الهاتف أو الكود) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                list="zanoza-customer-phones"
                value={customerPhone}
                onChange={(e) => handlePhoneInput(e.target.value)}
                placeholder="مثال: +20 100 554 8812"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pr-9 pl-3 py-2 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-cyan-500"
              />
              <datalist id="zanoza-customer-phones">
                {customerDirectory.map((c, idx) => (
                  <option key={`${c.phone}-${idx}`} value={c.phone}>
                    {c.name}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* اسم العميل */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              اسم العميل *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="اسم العميل أو المجموعة"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* نوع العميل والتاريخ */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                عملة العميل
              </label>
              <select
                value={customerType}
                onChange={(e) =>
                  setCustomerType(e.target.value as 'egyptian' | 'foreigner')
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="egyptian">مصري (ج.م)</option>
                <option value="foreigner">أجنبي (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                تاريخ الفاتورة
              </label>
              <input
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* نوع التنفيذ: نشاط أم رحلة */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              التصنيف (نشاط / رحلة)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTargetKindSwitch('activity')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                  targetKind === 'activity'
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span>نشاط</span>
              </button>
              <button
                type="button"
                onClick={() => handleTargetKindSwitch('trip')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                  targetKind === 'trip'
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Ship className="w-3.5 h-3.5 shrink-0" />
                <span>رحلة</span>
              </button>
            </div>
          </div>

          {/* اسم الرحلة أو النشاط */}
          <div className="md:col-span-1 lg:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              اسم {targetKind === 'activity' ? 'النشاط' : 'الرحلة'} *
            </label>
            <select
              value={targetId}
              onChange={(e) => handleTargetEntitySelect(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">
                — اختر {targetKind === 'activity' ? 'النشاط' : 'الرحلة'} من قاعدة البيانات —
              </option>
              {targetKind === 'activity'
                ? activities.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.name}
                    </option>
                  ))
                : availableTripOptions.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.title}
                    </option>
                  ))}
            </select>
          </div>
        </div>

        {/* Paid Add-ons from Database + Multi-value Selected Lines */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 pt-2">
          {/* Left 7 cols: Database Paid Addons Catalog */}
          <div className="xl:col-span-7 bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>قائمة الإضافات المدفوعة من قاعدة البيانات</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  اختر أي إضافة بالسعر والعدد؛ ويمكن إضافة أكثر من قيمة أو تكرارها بأسعار مستقلة لنفس العميل.
                </p>
              </div>
              <span className="text-[11px] font-mono text-cyan-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                {databasePaidAddons.length} إضافة متاحة
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={addonSearch}
                  onChange={(e) => setAddonSearch(e.target.value)}
                  placeholder="بحث باسم الإضافة أو الفئة..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <select
                value={addonCategoryFilter}
                onChange={(e) => setAddonCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">كل الفئات</option>
                {addonCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80 border border-slate-800 rounded-lg bg-slate-900/50">
              {filteredDatabaseAddons.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  لا توجد إضافات مطابقة في قاعدة البيانات. يمكنك إضافة إضافات جديدة من المرجع الموحد.
                </div>
              ) : (
                filteredDatabaseAddons.map((addon) => (
                  <div
                    key={addon.key}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-900 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{addon.title}</span>
                        <span className="text-[10px] text-slate-400">
                          ({addon.unitLabel})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        <span>{addon.category}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-cyan-300/90">{addon.sourceLabel}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-left font-mono tabular-nums text-xs">
                        <span className="text-emerald-300 font-bold">
                          {addon.priceEGP.toLocaleString()} ج.م
                        </span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-amber-300 font-bold">
                          € {addon.priceEUR.toLocaleString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddAddonLineFromDb(addon, false)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0"
                        title="إضافة أو زيادة العدد"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddAddonLineFromDb(addon, true)}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-medium whitespace-nowrap shrink-0"
                        title="إضافة سطر منفصل بقيمة وسعر مستقل لنفس الإضافة"
                      >
                        + قيمة مستقلة
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right 5 cols: Multi-Value Selected Items Cart */}
          <div className="xl:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>القيم المضافة للطلب الحالي</span>
                </h3>
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  {draftLines.length} سطر · {draftTotals.qty} وحدة
                </span>
              </div>

              {draftLines.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
                  اختر إضافة أو أكثر من القائمة المقابلة لتحديد السعر والعدد وإضافتها إلى فاتورة العميل.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {draftLines.map((line) => (
                    <div
                      key={line.draftId}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {line.title}
                          </div>
                          <div className="text-[11px] text-slate-400">{line.unitLabel}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftLine(line.draftId)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="إزالة السطر"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-end">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">
                            سعر الوحدة (ج.م)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={line.unitPriceEGP}
                            onChange={(e) =>
                              handleUpdateDraftLine(line.draftId, {
                                unitPriceEGP: Math.max(0, Number(e.target.value) || 0)
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-300 font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">
                            سعر الوحدة (€)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={line.unitPriceEUR}
                            onChange={(e) =>
                              handleUpdateDraftLine(line.draftId, {
                                unitPriceEUR: Math.max(0, Number(e.target.value) || 0)
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300 font-mono tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">
                            العدد
                          </label>
                          <div className="flex items-center border border-slate-700 rounded bg-slate-950 overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateDraftLine(line.draftId, {
                                  quantity: Math.max(1, line.quantity - 1)
                                })
                              }
                              className="px-2 py-1 text-slate-300 hover:bg-slate-800"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={line.quantity}
                              onChange={(e) =>
                                handleUpdateDraftLine(line.draftId, {
                                  quantity: Math.max(1, Math.floor(Number(e.target.value) || 1))
                                })
                              }
                              className="w-full text-center bg-transparent text-xs text-white font-mono tabular-nums focus:outline-none py-1"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateDraftLine(line.draftId, {
                                  quantity: line.quantity + 1
                                })
                              }
                              className="px-2 py-1 text-slate-300 hover:bg-slate-800"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/70 font-mono tabular-nums">
                        <span className="text-slate-400">إجمالي السطر:</span>
                        <span className="text-white font-bold">
                          {(line.unitPriceEGP * line.quantity).toLocaleString()} ج.م · €{' '}
                          {(line.unitPriceEUR * line.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  ملاحظات التنفيذ (اختياري)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: تسليم في استراحة الغداء · طاولة رقم 4"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">مجموع الإضافات للطلب الحالي:</span>
                <div className="font-mono tabular-nums font-bold text-sm">
                  <span className="text-emerald-300">
                    {draftTotals.egp.toLocaleString()} ج.م
                  </span>
                  <span className="text-slate-600 mx-1.5">|</span>
                  <span className="text-amber-300">€ {draftTotals.eur.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <ReceiptText className="w-4 h-4 shrink-0" />
                <span>إضافة الطلب إلى فاتورة العميل (نهاية اليوم)</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Bottom Section: End-of-Day Customer Invoices + Detailed Requests Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('eod_invoices')}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'eod_invoices'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <ReceiptText className="w-4 h-4 shrink-0" />
              <span>فواتير نهاية اليوم للعملاء ({endOfDayInvoices.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests_log')}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'requests_log'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <ListChecks className="w-4 h-4 shrink-0" />
              <span>سجل الطلبات التفصيلي ({inTripRequests.length})</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                placeholder="بحث برقم العميل أو الاسم أو الرحلة..."
                className="w-full sm:w-64 bg-slate-950 border border-slate-700 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-cyan-500"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg whitespace-nowrap"
                >
                  الكل
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab 1: End-of-Day Customer Invoices */}
        {activeTab === 'eod_invoices' && (
          <div className="space-y-4">
            {filteredEndOfDayInvoices.length === 0 ? (
              <div className="p-10 text-center bg-slate-950/50 border border-dashed border-slate-800 rounded-xl space-y-1">
                <p className="text-sm font-semibold text-slate-300">
                  لا توجد فواتير طلبات مسجلة بعد
                </p>
                <p className="text-xs text-slate-500">
                  سجّل طلب عميل أثناء الرحلة أو النشاط من النموذج أعلاه ليتم تجميع قيمه تلقائياً في فاتورة نهاية اليوم.
                </p>
              </div>
            ) : (
              filteredEndOfDayInvoices.map((inv) => (
                <div
                  key={inv.groupKey}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-bold text-white">{inv.customerName}</span>
                        <span className="text-xs font-mono tabular-nums text-cyan-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                          {inv.customerPhone}
                        </span>
                        {inv.linkedBookingCode && (
                          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                            حجز #{inv.linkedBookingCode}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-400">
                          {inv.tripDate}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        {inv.targetKind === 'activity' ? (
                          <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : (
                          <Ship className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                        <span>
                          {inv.targetKind === 'activity' ? 'نشاط:' : 'رحلة:'}{' '}
                          <strong className="text-slate-200">{inv.targetTitle}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => openEndOfDayVoucher(inv)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة فاتورة نهاية اليوم</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrefillForAdditionalValue(inv)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة قيمة / طلب آخر لنفس العميل</span>
                      </button>
                    </div>
                  </div>

                  {/* Itemized Multi-Value Requests for this Customer */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400">
                      القيم المضافة أثناء التنفيذ ({inv.requests.length} طلبات · {inv.totalItemsCount} وحدة):
                    </div>
                    <div className="overflow-x-auto border border-slate-800 rounded-lg">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-900 text-slate-400 text-[11px]">
                          <tr>
                            <th className="py-2 px-3 font-medium">كود الطلب</th>
                            <th className="py-2 px-3 font-medium">الإضافة المدفوعة</th>
                            <th className="py-2 px-3 font-medium">سعر الوحدة</th>
                            <th className="py-2 px-3 font-medium">العدد</th>
                            <th className="py-2 px-3 font-medium">الإجمالي</th>
                            <th className="py-2 px-3 font-medium">إجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {inv.requests.flatMap((req) =>
                            req.items.map((item) => (
                              <tr key={`${req.id}-${item.id}`} className="hover:bg-slate-900/40">
                                <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                  <div>{req.requestCode}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {req.createdAt.split('·')[1] || req.createdAt}
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-semibold text-white">{item.title}</div>
                                  {req.notes && (
                                    <div className="text-[10px] text-slate-400">{req.notes}</div>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                                  {inv.customerType === 'egyptian'
                                    ? `${item.unitPriceEGP.toLocaleString()} ج.م`
                                    : `€ ${item.unitPriceEUR.toLocaleString()}`}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAdjustSavedItemQuantity(req, item.id, -1)
                                      }
                                      className="text-slate-400 hover:text-white"
                                      title="إنقاص"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-mono tabular-nums font-bold text-white px-1">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAdjustSavedItemQuantity(req, item.id, 1)
                                      }
                                      className="text-slate-400 hover:text-white"
                                      title="زيادة"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-2 px-3 font-mono tabular-nums font-bold text-emerald-300 whitespace-nowrap">
                                  {inv.customerType === 'egyptian'
                                    ? `${(item.unitPriceEGP * item.quantity).toLocaleString()} ج.م`
                                    : `€ ${(item.unitPriceEUR * item.quantity).toFixed(2)}`}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdjustSavedItemQuantity(req, item.id, -item.quantity)
                                    }
                                    className="text-slate-500 hover:text-rose-400 p-1"
                                    title="حذف هذا البند"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Invoice End-of-Day Totals Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-slate-400">سعر الحجز الأساسي:</span>
                      <span className="text-xs font-mono tabular-nums font-bold text-slate-200">
                        {inv.customerType === 'egyptian'
                          ? `${(inv.baseInvoiceEGP + inv.checkoutAddonsEGP).toLocaleString()} ج.م`
                          : `€ ${(inv.baseInvoiceEUR + inv.checkoutAddonsEUR).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-slate-400">إضافات أثناء الرحلة:</span>
                      <span className="text-xs font-mono tabular-nums font-bold text-amber-300">
                        +{' '}
                        {inv.customerType === 'egyptian'
                          ? `${inv.addedRequestsEGP.toLocaleString()} ج.م`
                          : `€ ${inv.addedRequestsEUR.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-200">
                        إجمالي فاتورة نهاية اليوم:
                      </span>
                      <span className="text-sm font-mono tabular-nums font-bold text-emerald-300">
                        {inv.customerType === 'egyptian'
                          ? `${inv.finalInvoiceEGP.toLocaleString()} ج.م`
                          : `€ ${inv.finalInvoiceEUR.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Chronological Detailed Requests Log */}
        {activeTab === 'requests_log' && (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            {filteredRequestsLog.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                لا توجد طلبات مسجلة تطابق البحث الحالي.
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">الكود والتوقيت</th>
                    <th className="py-2.5 px-3 font-medium">رقم العميل</th>
                    <th className="py-2.5 px-3 font-medium">اسم العميل</th>
                    <th className="py-2.5 px-3 font-medium">الرحلة / النشاط</th>
                    <th className="py-2.5 px-3 font-medium">الإضافات المطلوبة</th>
                    <th className="py-2.5 px-3 font-medium">قيمة الطلب</th>
                    <th className="py-2.5 px-3 font-medium">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredRequestsLog.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-950/60">
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                        <div className="text-cyan-300 font-bold">{req.requestCode}</div>
                        <div className="text-[10px] text-slate-500">{req.createdAt}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-200 whitespace-nowrap">
                        {req.customerPhone}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        <div>{req.customerName}</div>
                        {req.linkedBookingCode && (
                          <span className="text-[10px] font-mono text-emerald-300">
                            حجز #{req.linkedBookingCode}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{req.targetTitle}</td>
                      <td className="py-2.5 px-3">
                        <div className="space-y-0.5">
                          {req.items.map((it) => (
                            <div key={it.id} className="text-[11px] text-slate-200">
                              {it.title}{' '}
                              <span className="font-mono text-amber-300">× {it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-emerald-300 whitespace-nowrap">
                        {req.customerType === 'egyptian'
                          ? `${req.totalAddedEGP.toLocaleString()} ج.م`
                          : `€ ${req.totalAddedEUR.toFixed(2)}`}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {pendingDeleteId === req.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteRequest(req.id);
                                setPendingDeleteId(null);
                              }}
                              className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold"
                            >
                              تأكيد
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(null)}
                              className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[11px]"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(req.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="حذف الطلب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <InvoiceVoucherModal
        voucher={activeVoucher}
        onClose={() => setActiveVoucher(null)}
      />
    </div>
  );
};
