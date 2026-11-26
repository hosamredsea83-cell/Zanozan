import React, { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  Search,
  MapPin,
  Clock,
  Star,
  Calendar,
  Users,
  CheckCircle2,
  Ticket,
  Phone,
  ShieldCheck,
  Plus,
  Minus,
  X,
  MessageSquarePlus,
  Ship,
  Car,
  Heart,
  Layers,
  Gift,
  CreditCard,
  AlertTriangle,
  Wrench,
  Lock,
  Globe,
  Building2,
  Copy,
  Check,
  Tag,
  HelpCircle,
  Send
} from 'lucide-react';
import type { Activity, SeasonalDiscount, TimeSlotCapacity } from '../../types/activity';
import { resolveUserRoleKey, type AppUser } from '../../types/auth';
import type { EquipmentItem } from '../../types/equipment';
import type { TripRecord } from '../../types/trip';
import {
  LOGISTICS_CATEGORY_LABELS,
  type LogisticsVehicle
} from '../../types/logistics';
import type { ActivityCollection } from '../activities/CollectionsManager';
import type {
  CustomerReviewRecord,
  DriverMissionRecord,
  DriverMissionStatus,
  InTripAddonRequestRecord,
  ResourceMaintenanceBlock,
  SelectedPaidAddonItem
} from '../../types/finance';
import type { BookingRequest } from '../trips/BookingQueueModal';
import type { TripBooking } from '../bookings/BookingsManagerView';
import { PlatformPricingSettings } from '../pricing/PricingToolManager';
import {
  InvoiceVoucherData,
  InvoiceVoucherModal
} from '../shared/InvoiceVoucherModal';
import type { CustomerPortalSection } from './CustomerMasterLayout';
import {
  CUSTOMER_NATIONALITY_OPTIONS,
  getNationalityDisplayLabel,
  isEgyptianNationality,
  isExperienceVisibleForCustomer,
  resolveAudienceByNationality,
  resolveAutoCurrencyByNationality
} from '../../utils/customerEligibility';
import {
  applySeasonalDiscountAmount,
  calculateCustomerFeeAndTax,
  computeAuthoritativeBookingBreakdown,
  DEFAULT_DEPOSIT_PERCENT,
  evaluateCancellationRefund,
  findActiveSeasonalDiscount,
  findNearestAvailableDate,
  hasActiveOfferForCustomer,
  isSlotOperatingOnDate,
  OPERATING_DAY_LABELS_AR,
  PROMO_CODE_CATALOG,
  resolveDefaultBookingMode,
  supportsPerPersonOption,
  supportsPrivateGroupOption,
  validatePromoCodeForBooking,
  type PromoCodeDefinition
} from '../../utils/bookingPricing';

export interface StorefrontCompanyOption {
  id: string;
  companyName: string;
  ownerName: string;
}

export interface BookingActionResult {
  ok: boolean;
  error?: string;
}

interface CustomerStorefrontViewProps {
  activities: Activity[];
  trips: TripRecord[];
  activityCollections?: ActivityCollection[];
  equipments?: EquipmentItem[];
  logisticsVehicles?: LogisticsVehicle[];
  maintenanceBlocks?: ResourceMaintenanceBlock[];
  reviews: CustomerReviewRecord[];
  platformPricingSettings: PlatformPricingSettings;
  activityBookings: BookingRequest[];
  tripBookings: TripBooking[];
  driverMissions?: DriverMissionRecord[];
  inTripRequests: InTripAddonRequestRecord[];
  currentUser?: AppUser;
  companies?: StorefrontCompanyOption[];
  onCompleteCustomerProfile?: (data: {
    name: string;
    phone: string;
    nationality: string;
    customerScope: 'platform' | 'company';
    registeredCompanyId?: string;
    registeredCompanyName?: string;
    registrationSource?: 'platform_signup' | 'company_page';
  }) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (activityId: string) => void;
  onCreateCustomerBooking: (booking: BookingRequest) => void;
  onCreateTripBooking?: (tripBooking: TripBooking) => void;
  onCancelCustomerBooking?: (
    bookingId: string,
    reason: string
  ) => Promise<BookingActionResult> | void;
  onCancelTripBooking?: (
    tripBookingId: string,
    reason: string
  ) => Promise<BookingActionResult> | void;
  onRescheduleCustomerBooking?: (
    bookingId: string,
    tripDate: string,
    slotLabel: string
  ) => Promise<BookingActionResult> | void;
  onRescheduleTripBooking?: (
    tripBookingId: string,
    departureDate: string,
    departureTime: string
  ) => Promise<BookingActionResult> | void;
  onAddReview: (review: CustomerReviewRecord) => void;
  // Optional controlled props from CustomerMasterLayout
  activeSection?: CustomerPortalSection;
  onChangeSection?: (section: CustomerPortalSection) => void;
  currency?: 'EGP' | 'EUR';
  onChangeCurrency?: (currency: 'EGP' | 'EUR') => void;
  lang?: 'ar' | 'en';
  onChangeLang?: (lang: 'ar' | 'en') => void;
  isStandaloneCustomerShell?: boolean;
}

const getTodayIso = (): string => new Date().toISOString().split('T')[0];

function normalizePhone(val?: string): string {
  return (val || '').replace(/[^\d]/g, '').trim();
}

function formatCardInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiryInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

const DRIVER_MISSION_LABELS_AR: Record<DriverMissionStatus, string> = {
  assigned: 'تم تعيين السائق',
  en_route: 'السائق في الطريق إليك',
  picked_up: 'تم استلام الراكب',
  arrived: 'وصل السائق لنقطة النشاط',
  completed: 'اكتملت رحلة التوصيل'
};

const DRIVER_MISSION_LABELS_EN: Record<DriverMissionStatus, string> = {
  assigned: 'Driver assigned',
  en_route: 'Driver en route',
  picked_up: 'Picked up',
  arrived: 'Arrived at activity site',
  completed: 'Transfer completed'
};

export const CustomerStorefrontView: React.FC<CustomerStorefrontViewProps> = ({
  activities,
  trips,
  activityCollections = [],
  equipments = [],
  logisticsVehicles = [],
  maintenanceBlocks = [],
  reviews,
  platformPricingSettings,
  activityBookings,
  tripBookings,
  driverMissions = [],
  inTripRequests,
  currentUser,
  companies = [],
  onCompleteCustomerProfile,
  favoriteIds = [],
  onToggleFavorite,
  onCreateCustomerBooking,
  onCreateTripBooking,
  onCancelCustomerBooking,
  onCancelTripBooking,
  onRescheduleCustomerBooking,
  onRescheduleTripBooking,
  onAddReview,
  activeSection: controlledSection,
  onChangeSection,
  currency: controlledCurrency,
  onChangeCurrency,
  lang: controlledLang,
  onChangeLang,
  isStandaloneCustomerShell = false
}) => {
  const [internalSection, setInternalSection] = useState<CustomerPortalSection>('catalog');
  const [internalCurrency, setInternalCurrency] = useState<'EGP' | 'EUR'>('EGP');
  const [internalLang, setInternalLang] = useState<'ar' | 'en'>('ar');

  const activeTab = controlledSection ?? internalSection;
  const setActiveTab = (sec: CustomerPortalSection) => {
    setInternalSection(sec);
    onChangeSection?.(sec);
  };

  const currency = controlledCurrency ?? internalCurrency;
  const setCurrency = (cur: 'EGP' | 'EUR') => {
    setInternalCurrency(cur);
    onChangeCurrency?.(cur);
  };

  const lang = controlledLang ?? internalLang;
  const setLang = (l: 'ar' | 'en') => {
    setInternalLang(l);
    onChangeLang?.(l);
  };
  const isEn = lang === 'en';

  // Automatic nationality-locked pricing & scope rules
  const isCustomerAccount =
    resolveUserRoleKey(currentUser) === 'customer' || isStandaloneCustomerShell;
  const registeredNationality = (currentUser?.nationality || '').trim();
  const isNationalityConfigured = Boolean(registeredNationality);
  const pricingAudience: 'egyptian' | 'foreigner' = isCustomerAccount
    ? resolveAudienceByNationality(registeredNationality || 'مصر')
    : currency === 'EGP'
      ? 'egyptian'
      : 'foreigner';
  const effectiveCurrency: 'EGP' | 'EUR' = isCustomerAccount
    ? resolveAutoCurrencyByNationality(registeredNationality || 'مصر')
    : currency;
  const customerScope: 'platform' | 'company' = currentUser?.customerScope || 'platform';

  // Inline first-time customer onboarding state (collects nationality & scope)
  const [onboardName, setOnboardName] = useState(currentUser?.name || '');
  const [onboardPhone, setOnboardPhone] = useState(currentUser?.phone || '');
  const [onboardNationality, setOnboardNationality] = useState<string>('مصر');
  const [onboardCustomNationality, setOnboardCustomNationality] = useState<string>('');
  const [onboardScope, setOnboardScope] = useState<'platform' | 'company'>(
    currentUser?.customerScope || 'platform'
  );
  const [onboardCompanyId, setOnboardCompanyId] = useState<string>(
    currentUser?.registeredCompanyId || companies[0]?.id || ''
  );
  const [onboardError, setOnboardError] = useState<string | null>(null);

  useEffect(() => {
    if (companies.length > 0 && !onboardCompanyId) {
      setOnboardCompanyId(companies[0].id);
    }
  }, [companies, onboardCompanyId]);

  useEffect(() => {
    if (currentUser) {
      setOnboardName(currentUser.name || '');
      setOnboardPhone(currentUser.phone || '');
      if (currentUser.customerScope) setOnboardScope(currentUser.customerScope);
      if (currentUser.registeredCompanyId) setOnboardCompanyId(currentUser.registeredCompanyId);
    }
  }, [currentUser]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [offerTypeFilter, setOfferTypeFilter] = useState<'all' | 'percentage' | 'fixed_amount'>(
    'all'
  );
  const [copiedPromoCode, setCopiedPromoCode] = useState<string | null>(null);
  const [preferredPromoCode, setPreferredPromoCode] = useState<string>('');

  // Image fallback tracker
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, boolean>>({});

  // Booking Modal / PDP State
  const [selectedItem, setSelectedItem] = useState<
    (Activity & { _kind: 'activity' | 'trip' }) | null
  >(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [tripDate, setTripDate] = useState<string>(getTodayIso);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [bookingMode, setBookingMode] = useState<'per_person' | 'private_group'>('per_person');
  const [paymentMethod, setPaymentMethod] = useState<
    'online_card' | 'cash_on_pickup' | 'deposit'
  >('online_card');
  const [adults, setAdults] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [infantsCount, setInfantsCount] = useState<number>(0);
  const [requiresPickup, setRequiresPickup] = useState<boolean>(true);
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeDefinition | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState<boolean>(false);

  // Interactive card fields (transient, never persisted; only cardHolder & last4 sent)
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');

  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // My Bookings Verified Lookup State (Zero PII Leakage!)
  const [lookupPhone, setLookupPhone] = useState<string>('');
  const [lookupCode, setLookupCode] = useState<string>('');
  const [verifiedGuestKeys, setVerifiedGuestKeys] = useState<{
    phone: string;
    code: string;
  } | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null);
  const [serverLookupActivityBookings, setServerLookupActivityBookings] = useState<
    BookingRequest[]
  >([]);
  const [serverLookupTripBookings, setServerLookupTripBookings] = useState<TripBooking[]>([]);
  const [serverLookupInTripRequests, setServerLookupInTripRequests] = useState<
    InTripAddonRequestRecord[]
  >([]);
  const [mySessionBookingCodes, setMySessionBookingCodes] = useState<string[]>([]);
  const [activeVoucher, setActiveVoucher] = useState<InvoiceVoucherData | null>(null);

  // Cancel / Reschedule inline controls
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [rescheduleTargetId, setRescheduleTargetId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(getTodayIso);
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [bookingActionNotice, setBookingActionNotice] = useState<string | null>(null);

  // Review Form State (strictly locked to completed activities/trips)
  const [revBookingCode, setRevBookingCode] = useState<string>('');
  const [revName, setRevName] = useState<string>('');
  const [revPhone, setRevPhone] = useState<string>('');
  const [revRating, setRevRating] = useState<number>(5);
  const [revComment, setRevComment] = useState<string>('');
  const [revError, setRevError] = useState<string | null>(null);
  const [revSuccess, setRevSuccess] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [revVerifyCode, setRevVerifyCode] = useState<string>('');
  const [revVerifyPhone, setRevVerifyPhone] = useState<string>('');
  const [revVerifyNotice, setRevVerifyNotice] = useState<string | null>(null);

  // Account tab Customer Support Form
  const [supportSubject, setSupportSubject] = useState<string>('');
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [supportSentNotice, setSupportSentNotice] = useState<string | null>(null);

  // Pre-fill signed-in customer details cleanly
  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name);
      setCustomerPhone(currentUser.phone);
      setRevName(currentUser.name);
      setRevPhone(currentUser.phone);
      setRevVerifyPhone((prev) => prev || currentUser.phone || '');
    }
  }, [currentUser]);

  const handleSaveInlineOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedNat =
      onboardNationality === 'أخرى' ? onboardCustomNationality.trim() : onboardNationality;
    if (!resolvedNat) {
      setOnboardError(
        isEn
          ? 'Please select your nationality to apply automatic pricing.'
          : 'يرجى تحديد الجنسية لتطبيق التسعير المخصص تلقائياً.'
      );
      return;
    }
    if (!onboardName.trim() || !onboardPhone.trim()) {
      setOnboardError(
        isEn
          ? 'Please enter your full name and phone number.'
          : 'يرجى إدخال الاسم ورقم الهاتف.'
      );
      return;
    }
    const chosenCompany =
      onboardScope === 'company'
        ? companies.find((c) => c.id === onboardCompanyId) || companies[0]
        : undefined;
    if (onboardScope === 'company' && !chosenCompany) {
      setOnboardError(
        isEn
          ? 'Please choose your registered company.'
          : 'يرجى اختيار الشركة المسجّل بها لإظهار أنشطتها ورحلاتها فقط.'
      );
      return;
    }
    setOnboardError(null);
    onCompleteCustomerProfile?.({
      name: onboardName.trim(),
      phone: onboardPhone.trim(),
      nationality: resolvedNat,
      customerScope: onboardScope,
      registeredCompanyId: chosenCompany?.id,
      registeredCompanyName: chosenCompany?.companyName,
      registrationSource: onboardScope === 'company' ? 'company_page' : 'platform_signup'
    });
  };

  // Enforce Company vs Platform Scope + Distribution Channels
  const catalogItems = useMemo(() => {
    const pubActs = activities
      .filter((a) => isExperienceVisibleForCustomer(a, currentUser))
      .map((a) => ({ ...a, _kind: 'activity' as const }));
    const pubTrips = trips
      .filter((t) => isExperienceVisibleForCustomer(t, currentUser))
      .map((t) => ({ ...t, _kind: 'trip' as const }));
    return [...pubActs, ...pubTrips];
  }, [activities, trips, currentUser]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalogItems.forEach((item) => {
      const cat = item.categoryPath?.[item.categoryPath.length - 1] || item.categoryPath?.[0];
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [catalogItems]);

  const ratingStatsByTarget = useMemo(() => {
    const map = new Map<string, { avg: number; count: number }>();
    const grouped = new Map<string, number[]>();
    reviews.forEach((r) => {
      const arr = grouped.get(r.targetId) || [];
      arr.push(r.rating);
      grouped.set(r.targetId, arr);
    });
    grouped.forEach((arr, id) => {
      const sum = arr.reduce((s, v) => s + v, 0);
      map.set(id, { avg: Number((sum / arr.length).toFixed(1)), count: arr.length });
    });
    return map;
  }, [reviews]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const today = getTodayIso();
    return catalogItems.filter((item) => {
      if (activeTab === 'offers') {
        if (!hasActiveOfferForCustomer(item, today, pricingAudience)) return false;
        if (offerTypeFilter !== 'all') {
          const activeDisc = findActiveSeasonalDiscount(
            item.seasonalDiscounts,
            today,
            pricingAudience
          );
          if (!activeDisc || activeDisc.discountType !== offerTypeFilter) return false;
        }
      }
      if (activeTab === 'favorites') {
        if (!favoriteIds.includes(item.id)) return false;
      }
      const itemCat =
        item.categoryPath?.[item.categoryPath.length - 1] || item.categoryPath?.[0] || '';
      const matchesCat = categoryFilter === 'all' || itemCat === categoryFilter;
      const title =
        lang === 'en' && item.translations?.en?.name ? item.translations.en.name : item.name;
      const matchesQ =
        !q ||
        title.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.location?.city || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [
    catalogItems,
    categoryFilter,
    searchQuery,
    lang,
    activeTab,
    favoriteIds,
    pricingAudience,
    offerTypeFilter
  ]);

  const activePromoCodesForAudience = useMemo(() => {
    const today = getTodayIso();
    return PROMO_CODE_CATALOG.filter((p) => {
      const audOk = pricingAudience === 'egyptian' ? p.appliesToEgyptian : p.appliesToForeigner;
      if (!audOk) return false;
      if (p.startDate && today < p.startDate) return false;
      if (p.endDate && today > p.endDate) return false;
      return true;
    });
  }, [pricingAudience]);

  // Combined bookings across activityBookings + tripBookings for accurate seat & equipment checks
  const computeRemainingSeatsForItem = (
    item: Activity,
    dateIso: string,
    slotObj: TimeSlotCapacity | undefined,
    fallbackLabel: string
  ) => {
    const label = slotObj?.timeLabel || fallbackLabel;
    const maxCap = Math.max(1, slotObj?.maxCapacity || slotObj?.availableCount || 12);
    const bookedAct = activityBookings
      .filter(
        (b) =>
          b.activityId === item.id &&
          b.tripDate === dateIso &&
          b.slotLabel === label &&
          b.status !== 'rejected' &&
          b.status !== 'auto_cancelled'
      )
      .reduce((sum, b) => sum + b.adultsCount + b.childrenCount, 0);
    const bookedTrip = tripBookings
      .filter(
        (tb) =>
          (tb.activityId === item.id || tb.tripTitle === item.name) &&
          tb.departureDate === dateIso &&
          tb.departureTime === label &&
          tb.status !== 'cancelled'
      )
      .reduce((sum, tb) => sum + tb.adultsCount + tb.childrenCount, 0);
    const bookedForDate = bookedAct + bookedTrip;

    const eqIds = new Set(item.equipmentIds || []);
    const blocked = maintenanceBlocks.find(
      (blk) => eqIds.has(blk.resourceId) && dateIso >= blk.startDate && dateIso <= blk.endDate
    );
    const opOk = isSlotOperatingOnDate(slotObj, dateIso);
    const remaining =
      blocked || !opOk
        ? 0
        : slotObj && bookedForDate === 0
          ? Math.min(maxCap, slotObj.availableCount)
          : Math.max(0, maxCap - bookedForDate);

    return { maxCap, bookedForDate, remaining, blocked, opOk };
  };

  const openExperienceModal = (item: Activity & { _kind: 'activity' | 'trip' }) => {
    const firstSlot = item.slots?.[0]?.timeLabel || '09:00 ص';
    const nearestDate = findNearestAvailableDate({
      item,
      slotLabel: firstSlot,
      maintenanceBlocks,
      fromDateIso: getTodayIso()
    });
    const defaultMode = resolveDefaultBookingMode(item, pricingAudience);
    setSelectedItem(item);
    setActiveMediaIndex(0);
    setTripDate(nearestDate);
    setSelectedSlot(firstSlot);
    setBookingMode(defaultMode);
    setAdults(Math.max(1, item.minPax || 1));
    setChildrenCount(0);
    setInfantsCount(0);
    setRequiresPickup(Boolean(item.logistics?.requiresTransfer));
    setPickupLocation(item.logistics?.pickupPoint || '');
    setAddonQuantities({});
    setCardHolder('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setBookingError(null);
    if (preferredPromoCode) {
      setPromoCodeInput(preferredPromoCode);
      const check = validatePromoCodeForBooking({
        code: preferredPromoCode,
        dateIso: nearestDate,
        audience: pricingAudience,
        payingGuests: Math.max(1, item.minPax || 1)
      });
      if (check.valid && check.promo) {
        setAppliedPromo(check.promo);
        setPromoFeedback({
          type: 'success',
          text: isEn ? check.promo.titleEn : check.promo.titleAr
        });
      } else {
        setAppliedPromo(null);
        setPromoFeedback(null);
      }
    } else {
      setPromoCodeInput('');
      setAppliedPromo(null);
      setPromoFeedback(null);
    }
  };

  // Real-time remaining seat, operating days, maintenance & shared equipment validation
  const slotAvailability = useMemo(() => {
    if (!selectedItem) {
      return {
        maxCapacity: 10,
        bookedForDate: 0,
        remainingSeats: 10,
        maintenanceWarning: null as string | null,
        operatingDayWarning: null as string | null,
        equipmentConflictWarning: null as string | null
      };
    }
    const slotObj =
      selectedItem.slots?.find((s) => s.timeLabel === selectedSlot) || selectedItem.slots?.[0];
    const activeSlotLabel = slotObj?.timeLabel || selectedSlot || '09:00 ص';
    const seatStats = computeRemainingSeatsForItem(
      selectedItem,
      tripDate,
      slotObj,
      activeSlotLabel
    );

    const allowedDaysLabel =
      slotObj?.operatingDays && slotObj.operatingDays.length > 0
        ? slotObj.operatingDays.map((d) => OPERATING_DAY_LABELS_AR[d] || d).join(' · ')
        : '';

    const operatingDayWarning = !seatStats.opOk
      ? isEn
        ? `This slot does not operate on ${tripDate}. Available days: ${allowedDaysLabel}.`
        : `هذا الموعد لا يعمل في يوم ${tripDate}. أيام التشغيل المتاحة: ${allowedDaysLabel}.`
      : null;

    const maintenanceWarning = seatStats.blocked
      ? isEn
        ? `Equipment "${seatStats.blocked.resourceName}" is under scheduled maintenance on ${tripDate}. Please pick another date.`
        : `المعدة «${seatStats.blocked.resourceName}» في صيانة مجدولة بتاريخ ${tripDate} (${seatStats.blocked.reason || 'صيانة'}). يرجى اختيار يوم آخر.`
      : null;

    // Shared equipment conflict detection across OTHER activities/trips at same date & slot
    let equipmentConflictWarning: string | null = null;
    const eqIds = selectedItem.equipmentIds || [];
    if (eqIds.length > 0 && !maintenanceWarning) {
      const otherExperiences = catalogItems.filter((it) => it.id !== selectedItem.id);
      for (const eqId of eqIds) {
        const eqObj = equipments.find((e) => e.id === eqId);
        const totalUnits = 1;
        const conflictingIds = new Set(
          otherExperiences
            .filter((it) => (it.equipmentIds || []).includes(eqId))
            .map((it) => it.id)
        );
        if (conflictingIds.size === 0) continue;

        const usedElsewhereCount =
          activityBookings.filter(
            (b) =>
              conflictingIds.has(b.activityId) &&
              b.tripDate === tripDate &&
              b.slotLabel === activeSlotLabel &&
              b.status !== 'rejected' &&
              b.status !== 'auto_cancelled'
          ).length +
          tripBookings.filter(
            (tb) =>
              tb.activityId &&
              conflictingIds.has(tb.activityId) &&
              tb.departureDate === tripDate &&
              tb.departureTime === activeSlotLabel &&
              tb.status !== 'cancelled'
          ).length;

        if (usedElsewhereCount >= totalUnits) {
          equipmentConflictWarning = isEn
            ? `Shared equipment "${eqObj?.name || eqId}" is already reserved on ${tripDate} (${activeSlotLabel}).`
            : `المعدة المشتركة «${eqObj?.name || eqId}» محجوزة بالكامل في موعد ${tripDate} (${activeSlotLabel}) لنشاط آخر. يرجى اختيار موعد أو يوم آخر.`;
          break;
        }
      }
    }

    return {
      maxCapacity: seatStats.maxCap,
      bookedForDate: seatStats.bookedForDate,
      remainingSeats: equipmentConflictWarning ? 0 : seatStats.remaining,
      maintenanceWarning,
      operatingDayWarning,
      equipmentConflictWarning
    };
  }, [
    selectedItem,
    selectedSlot,
    tripDate,
    activityBookings,
    tripBookings,
    maintenanceBlocks,
    catalogItems,
    equipments,
    isEn
  ]);

  const selectedAddonsList = useMemo<SelectedPaidAddonItem[]>(() => {
    if (!selectedItem) return [];
    return (selectedItem.inclusions?.paidAddons || [])
      .map((ad) => ({
        id: ad.id,
        addonId: ad.addonId,
        title: ad.title,
        unitLabel: ad.unitLabel,
        unitPriceEGP: ad.priceEGP || 0,
        unitPriceEUR: ad.priceEUR || 0,
        quantity: addonQuantities[ad.id] || 0,
        stage: 'checkout' as const
      }))
      .filter((it) => it.quantity > 0);
  }, [selectedItem, addonQuantities]);

  const hasPerPersonMode = useMemo(
    () => (selectedItem ? supportsPerPersonOption(selectedItem, pricingAudience) : true),
    [selectedItem, pricingAudience]
  );
  const hasPrivateMode = useMemo(
    () => (selectedItem ? supportsPrivateGroupOption(selectedItem, pricingAudience) : false),
    [selectedItem, pricingAudience]
  );

  const checkoutPricing = useMemo(() => {
    if (!selectedItem) {
      return {
        currency: effectiveCurrency,
        audience: pricingAudience,
        bookingMode: 'per_person' as const,
        rawBase: 0,
        activeDiscount: null as SeasonalDiscount | null,
        discountedBase: 0,
        discountSaved: 0,
        appliedPromo: null as PromoCodeDefinition | null,
        promoSaved: 0,
        afterPromoBase: 0,
        addonsTotal: 0,
        fee: 0,
        tax: 0,
        total: 0,
        depositAmount: 0,
        remainingAmount: 0
      };
    }
    return computeAuthoritativeBookingBreakdown({
      item: selectedItem,
      audience: pricingAudience,
      tripDate,
      adultsCount: adults,
      childrenCount,
      infantsCount,
      bookingMode,
      promoCode: appliedPromo?.code,
      selectedAddons: selectedAddonsList,
      paymentMethod,
      platformSettings: platformPricingSettings
    });
  }, [
    selectedItem,
    pricingAudience,
    effectiveCurrency,
    tripDate,
    adults,
    childrenCount,
    infantsCount,
    bookingMode,
    appliedPromo,
    selectedAddonsList,
    paymentMethod,
    platformPricingSettings
  ]);

  const totalPayingGuests = adults + childrenCount;

  // Keep promo validity synchronized if guests or date changes
  useEffect(() => {
    if (!appliedPromo) return;
    const check = validatePromoCodeForBooking({
      code: appliedPromo.code,
      dateIso: tripDate,
      audience: pricingAudience,
      payingGuests: bookingMode === 'private_group' ? Math.max(1, totalPayingGuests) : totalPayingGuests
    });
    if (!check.valid) {
      setAppliedPromo(null);
      setPromoFeedback({
        type: 'error',
        text: (isEn ? check.errorEn : check.errorAr) || ''
      });
    }
  }, [appliedPromo, tripDate, pricingAudience, totalPayingGuests, bookingMode, isEn]);

  const handleApplyPromoCode = async () => {
    const clean = promoCodeInput.trim().toUpperCase();
    if (!clean) {
      setAppliedPromo(null);
      setPromoFeedback(null);
      return;
    }
    setValidatingPromo(true);
    try {
      const payload = {
        code: clean,
        dateIso: tripDate,
        audience: pricingAudience,
        payingGuests: bookingMode === 'private_group' ? Math.max(1, totalPayingGuests) : totalPayingGuests
      };
      const res = await fetch('/api/public/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = (await res.json()) as {
          valid?: boolean;
          promo?: PromoCodeDefinition;
          errorAr?: string;
          errorEn?: string;
        };
        if (json.valid && json.promo) {
          setAppliedPromo(json.promo);
          setPromoFeedback({
            type: 'success',
            text: isEn ? `Applied: ${json.promo.titleEn}` : `تم التفعيل: ${json.promo.titleAr}`
          });
          return;
        }
        setAppliedPromo(null);
        setPromoFeedback({
          type: 'error',
          text:
            (isEn ? json.errorEn : json.errorAr) ||
            (isEn ? 'Invalid promo code.' : 'كود الخصم غير صالح.')
        });
        return;
      }
    } catch {
      // fallback to deterministic shared validation
    } finally {
      setValidatingPromo(false);
    }

    const localCheck = validatePromoCodeForBooking({
      code: clean,
      dateIso: tripDate,
      audience: pricingAudience,
      payingGuests: bookingMode === 'private_group' ? Math.max(1, totalPayingGuests) : totalPayingGuests
    });
    if (localCheck.valid && localCheck.promo) {
      setAppliedPromo(localCheck.promo);
      setPromoFeedback({
        type: 'success',
        text: isEn ? `Applied: ${localCheck.promo.titleEn}` : `تم التفعيل: ${localCheck.promo.titleAr}`
      });
    } else {
      setAppliedPromo(null);
      setPromoFeedback({
        type: 'error',
        text:
          (isEn ? localCheck.errorEn : localCheck.errorAr) ||
          (isEn ? 'Invalid promo code.' : 'كود الخصم غير صالح.')
      });
    }
  };

  const handleConfirmCustomerBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (isCustomerAccount && !isNationalityConfigured) {
      setBookingError(
        isEn
          ? 'Please complete your nationality below to unlock your exact pricing tier.'
          : 'يرجى تحديد الجنسية أدناه لتفعيل التسعير المخصص تلقائياً قبل إتمام الحجز.'
      );
      return;
    }

    const todayIso = getTodayIso();
    if (!tripDate || tripDate < todayIso) {
      setBookingError(
        isEn
          ? 'Past dates cannot be selected. Please pick a valid upcoming date.'
          : 'لا يمكن اختيار تاريخ سابق لليوم. يرجى اختيار تاريخ سارٍ.'
      );
      return;
    }
    if (slotAvailability.operatingDayWarning) {
      setBookingError(slotAvailability.operatingDayWarning);
      return;
    }
    if (slotAvailability.maintenanceWarning) {
      setBookingError(slotAvailability.maintenanceWarning);
      return;
    }
    if (slotAvailability.equipmentConflictWarning) {
      setBookingError(slotAvailability.equipmentConflictWarning);
      return;
    }
    if (bookingMode === 'private_group') {
      const privMax =
        (pricingAudience === 'egyptian'
          ? selectedItem.pricing.egyptianB2C.privateMaxPax
          : selectedItem.pricing.foreignerB2C.privateMaxPax) || slotAvailability.maxCapacity;
      if (totalPayingGuests > privMax) {
        setBookingError(
          isEn
            ? `Private charter accommodates up to ${privMax} guests.`
            : `الحد الأقصى للحجز الخاص للمجموعة هو ${privMax} أفراد.`
        );
        return;
      }
      if (slotAvailability.remainingSeats <= 0) {
        setBookingError(
          isEn
            ? 'This slot is fully booked.'
            : 'هذا الموعد مكتمل السعة ولا يقبل حجوزات إضافية.'
        );
        return;
      }
    } else {
      if (totalPayingGuests > slotAvailability.remainingSeats) {
        setBookingError(
          isEn
            ? `Requested guests (${totalPayingGuests}) exceed remaining seats (${slotAvailability.remainingSeats}).`
            : `العدد المطلوب (${totalPayingGuests}) يتجاوز المقاعد المتبقية (${slotAvailability.remainingSeats}) في هذا الموعد.`
        );
        return;
      }
      if (selectedItem.minPax && totalPayingGuests < selectedItem.minPax) {
        setBookingError(
          isEn
            ? `Minimum guests for this experience is ${selectedItem.minPax}.`
            : `الحد الأدنى لهذه التجربة هو ${selectedItem.minPax} أفراد.`
        );
        return;
      }
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setBookingError(
        isEn
          ? 'Please enter full name and WhatsApp/phone number.'
          : 'يرجى إدخال الاسم الكامل ورقم الهاتف / الواتساب لتأكيد الحجز.'
      );
      return;
    }

    let safeCardLast4: string | undefined;
    if (paymentMethod === 'online_card') {
      const digitsOnly = cardNumber.replace(/\D/g, '');
      if (cardHolder.trim().length < 2) {
        setBookingError(
          isEn ? 'Please enter cardholder name.' : 'يرجى إدخال اسم حامل البطاقة.'
        );
        return;
      }
      if (digitsOnly.length < 13 || digitsOnly.length > 19) {
        setBookingError(
          isEn
            ? 'Please enter a valid 16-digit card number.'
            : 'يرجى إدخال رقم بطاقة صحيح (13 إلى 19 رقم).'
        );
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) {
        setBookingError(
          isEn
            ? 'Please enter card expiry date (MM/YY).'
            : 'يرجى إدخال تاريخ انتهاء البطاقة بصيغة MM/YY.'
        );
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvv.trim())) {
        setBookingError(
          isEn ? 'Please enter valid 3-4 digit CVV.' : 'يرجى إدخال رمز الأمان CVV الصحيح.'
        );
        return;
      }
      safeCardLast4 = digitsOnly.slice(-4);
    }

    setSubmittingBooking(true);
    setBookingError(null);

    const payloadNationality =
      registeredNationality || (pricingAudience === 'egyptian' ? 'مصر' : 'أجنبي');

    const totalEGP = effectiveCurrency === 'EGP' ? checkoutPricing.total : 0;
    const totalEUR = effectiveCurrency === 'EUR' ? checkoutPricing.total : 0;
    const depositEGP = effectiveCurrency === 'EGP' ? checkoutPricing.depositAmount : 0;
    const depositEUR = effectiveCurrency === 'EUR' ? checkoutPricing.depositAmount : 0;
    const remainingEGP = effectiveCurrency === 'EGP' ? checkoutPricing.remainingAmount : 0;
    const remainingEUR = effectiveCurrency === 'EUR' ? checkoutPricing.remainingAmount : 0;
    const promoDiscountEGP = effectiveCurrency === 'EGP' ? checkoutPricing.promoSaved : 0;
    const promoDiscountEUR = effectiveCurrency === 'EUR' ? checkoutPricing.promoSaved : 0;

    const requestBody = {
      activityId: selectedItem.id,
      activityName: selectedItem.name,
      slotLabel: selectedSlot || '09:00 ص',
      tripDate,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerNationality: payloadNationality,
      customerType: pricingAudience,
      customerScope: currentUser?.customerScope || 'platform',
      registeredCompanyId: currentUser?.registeredCompanyId,
      registeredCompanyName: currentUser?.registeredCompanyName,
      adultsCount: adults,
      childrenCount,
      infantsCount,
      totalPriceEGP: totalEGP,
      totalPriceEUR: totalEUR,
      selectedPaidAddons: selectedAddonsList.length > 0 ? selectedAddonsList : undefined,
      requiresPickup,
      pickupLocation: requiresPickup
        ? pickupLocation.trim() || 'سيتم التنسيق عبر الهاتف'
        : 'حضور ذاتي لموقع النشاط',
      deadlineMinutesRemaining: (selectedItem.approvalDeadlineHours || 4) * 60,
      paymentMethod,
      paymentStatus:
        paymentMethod === 'online_card'
          ? ('paid' as const)
          : paymentMethod === 'deposit'
            ? ('deposit' as const)
            : ('pending' as const),
      bookingMode,
      promoCode: checkoutPricing.appliedPromo?.code,
      promoDiscountEGP,
      promoDiscountEUR,
      depositAmountEGP: depositEGP,
      depositAmountEUR: depositEUR,
      remainingAmountEGP: remainingEGP,
      remainingAmountEUR: remainingEUR,
      cardHolder: paymentMethod === 'online_card' ? cardHolder.trim() : undefined,
      cardLast4: safeCardLast4,
      entityKind: selectedItem._kind
    };

    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
        if (res.status === 400 && errJson?.error) {
          setBookingError(errJson.error);
          setSubmittingBooking(false);
          return;
        }
      }

      if (selectedItem._kind === 'trip') {
        let createdTrip: TripBooking;
        if (res.ok) {
          const json = (await res.json()) as { tripBooking?: TripBooking; booking?: TripBooking };
          createdTrip =
            json.tripBooking ||
            json.booking || {
              id: `tb-${Date.now()}`,
              bookingCode: `TR-${Math.floor(10000 + Math.random() * 89999)}`,
              activityId: selectedItem.id,
              tripTitle: selectedItem.name,
              tripType: bookingMode === 'private_group' ? 'private_charter' : 'group_trip',
              linkedActivities: [selectedItem.name],
              departureDate: tripDate,
              departureTime: selectedSlot || '09:00 ص',
              customerName: requestBody.customerName,
              customerPhone: requestBody.customerPhone,
              customerNationality: payloadNationality,
              customerType: pricingAudience,
              adultsCount: adults,
              childrenCount,
              infantsCount,
              totalPriceEGP: totalEGP,
              totalPriceEUR: totalEUR,
              paymentStatus: requestBody.paymentStatus,
              paymentMethod,
              bookingMode,
              promoCode: requestBody.promoCode,
              promoDiscountEGP,
              promoDiscountEUR,
              depositAmountEGP: depositEGP,
              depositAmountEUR: depositEUR,
              remainingAmountEGP: remainingEGP,
              remainingAmountEUR: remainingEUR,
              cardLast4: safeCardLast4,
              selectedPaidAddons: requestBody.selectedPaidAddons,
              transportInfo: requestBody.pickupLocation,
              status: 'pending_approval',
              createdAt: 'الآن (حجز مباشر)'
            };
        } else {
          createdTrip = {
            id: `tb-${Date.now()}`,
            bookingCode: `TR-${Math.floor(10000 + Math.random() * 89999)}`,
            activityId: selectedItem.id,
            tripTitle: selectedItem.name,
            tripType: bookingMode === 'private_group' ? 'private_charter' : 'group_trip',
            linkedActivities: [selectedItem.name],
            departureDate: tripDate,
            departureTime: selectedSlot || '09:00 ص',
            customerName: requestBody.customerName,
            customerPhone: requestBody.customerPhone,
            customerNationality: payloadNationality,
            customerType: pricingAudience,
            adultsCount: adults,
            childrenCount,
            infantsCount,
            totalPriceEGP: totalEGP,
            totalPriceEUR: totalEUR,
            paymentStatus: requestBody.paymentStatus,
            paymentMethod,
            bookingMode,
            promoCode: requestBody.promoCode,
            promoDiscountEGP,
            promoDiscountEUR,
            depositAmountEGP: depositEGP,
            depositAmountEUR: depositEUR,
            remainingAmountEGP: remainingEGP,
            remainingAmountEUR: remainingEUR,
            cardLast4: safeCardLast4,
            selectedPaidAddons: requestBody.selectedPaidAddons,
            transportInfo: requestBody.pickupLocation,
            status: 'pending_approval',
            createdAt: 'الآن (حجز مباشر)'
          };
        }

        if (onCreateTripBooking) {
          onCreateTripBooking(createdTrip);
        } else {
          onCreateCustomerBooking({
            ...requestBody,
            id: createdTrip.id,
            bookingCode: createdTrip.bookingCode,
            status: 'pending_approval',
            createdAt: createdTrip.createdAt
          });
        }

        setMySessionBookingCodes((prev) => [createdTrip.bookingCode, ...prev]);
        setLookupPhone(createdTrip.customerPhone);
        setLookupCode(createdTrip.bookingCode);
        setVerifiedGuestKeys({
          phone: normalizePhone(createdTrip.customerPhone),
          code: createdTrip.bookingCode.trim().toLowerCase()
        });
        setCardHolder('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setSelectedItem(null);
        setActiveTab('my_bookings');
        setActiveVoucher({
          documentKind: 'booking_ticket',
          code: createdTrip.bookingCode,
          title: createdTrip.tripTitle,
          companyName: selectedItem.owner?.companyName || 'زانوزا للأنشطة السياحية',
          customerName: createdTrip.customerName,
          customerPhone: createdTrip.customerPhone,
          customerType: createdTrip.customerType,
          tripDate: createdTrip.departureDate,
          tripTime: createdTrip.departureTime,
          pickupLocation: createdTrip.transportInfo,
          guestsSummary: `${createdTrip.adultsCount} بالغ · ${createdTrip.childrenCount} طفل · ${createdTrip.infantsCount} رضيع`,
          statusLabel:
            paymentMethod === 'online_card'
              ? `مدفوع بالبطاقة (${safeCardLast4 ? `•••• ${safeCardLast4}` : 'إلكتروني'}) — قيد اعتماد المزود`
              : paymentMethod === 'deposit'
                ? `عربون ${DEFAULT_DEPOSIT_PERCENT}% — قيد المراجعة والتأكيد`
                : 'دفع عند التحرك — قيد المراجعة والتأكيد',
          basePriceEGP: effectiveCurrency === 'EGP' ? checkoutPricing.discountedBase : 0,
          basePriceEUR: effectiveCurrency === 'EUR' ? checkoutPricing.discountedBase : 0,
          promoCode: createdTrip.promoCode,
          promoDiscountEGP: createdTrip.promoDiscountEGP,
          promoDiscountEUR: createdTrip.promoDiscountEUR,
          checkoutAddons: selectedAddonsList,
          serviceFeeEGP: effectiveCurrency === 'EGP' ? checkoutPricing.fee : 0,
          serviceFeeEUR: effectiveCurrency === 'EUR' ? checkoutPricing.fee : 0,
          taxEGP: effectiveCurrency === 'EGP' ? checkoutPricing.tax : 0,
          taxEUR: effectiveCurrency === 'EUR' ? checkoutPricing.tax : 0,
          totalEGP: createdTrip.totalPriceEGP,
          totalEUR: createdTrip.totalPriceEUR,
          depositAmountEGP: createdTrip.depositAmountEGP,
          depositAmountEUR: createdTrip.depositAmountEUR,
          remainingAmountEGP: createdTrip.remainingAmountEGP,
          remainingAmountEUR: createdTrip.remainingAmountEUR,
          paymentMethodLabel:
            paymentMethod === 'online_card'
              ? `بطاقة بنكية (${safeCardLast4 ? `•••• ${safeCardLast4}` : 'إلكتروني'})`
              : paymentMethod === 'deposit'
                ? `عربون ${DEFAULT_DEPOSIT_PERCENT}%`
                : 'نقداً عند التحرك'
        });
      } else {
        let createdBooking: BookingRequest;
        if (res.ok) {
          const json = (await res.json()) as { booking: BookingRequest };
          createdBooking = json.booking;
        } else {
          createdBooking = {
            ...requestBody,
            id: `pub-req-${Date.now()}`,
            bookingCode: `ZN-${Math.floor(10000 + Math.random() * 89999)}`,
            status: 'pending_approval',
            createdAt: 'الآن (حجز مباشر)'
          };
        }

        onCreateCustomerBooking(createdBooking);
        setMySessionBookingCodes((prev) => [createdBooking.bookingCode, ...prev]);
        setLookupPhone(createdBooking.customerPhone);
        setLookupCode(createdBooking.bookingCode);
        setVerifiedGuestKeys({
          phone: normalizePhone(createdBooking.customerPhone),
          code: createdBooking.bookingCode.trim().toLowerCase()
        });
        setCardHolder('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setSelectedItem(null);
        setActiveTab('my_bookings');
        setActiveVoucher({
          documentKind: 'booking_ticket',
          code: createdBooking.bookingCode,
          title: createdBooking.activityName,
          companyName: selectedItem.owner?.companyName || 'زانوزا للأنشطة السياحية',
          customerName: createdBooking.customerName,
          customerPhone: createdBooking.customerPhone,
          customerType: createdBooking.customerType,
          tripDate: createdBooking.tripDate,
          tripTime: createdBooking.slotLabel,
          pickupLocation: createdBooking.pickupLocation,
          guestsSummary: `${createdBooking.adultsCount} بالغ · ${createdBooking.childrenCount} طفل · ${createdBooking.infantsCount} رضيع`,
          statusLabel:
            paymentMethod === 'online_card'
              ? `مدفوع بالبطاقة (${safeCardLast4 ? `•••• ${safeCardLast4}` : 'إلكتروني'}) — قيد اعتماد المزود`
              : paymentMethod === 'deposit'
                ? `عربون ${DEFAULT_DEPOSIT_PERCENT}% — قيد المراجعة والتأكيد`
                : 'دفع عند التحرك — قيد المراجعة والتأكيد',
          basePriceEGP: effectiveCurrency === 'EGP' ? checkoutPricing.discountedBase : 0,
          basePriceEUR: effectiveCurrency === 'EUR' ? checkoutPricing.discountedBase : 0,
          promoCode: createdBooking.promoCode,
          promoDiscountEGP: createdBooking.promoDiscountEGP,
          promoDiscountEUR: createdBooking.promoDiscountEUR,
          checkoutAddons: selectedAddonsList,
          serviceFeeEGP: effectiveCurrency === 'EGP' ? checkoutPricing.fee : 0,
          serviceFeeEUR: effectiveCurrency === 'EUR' ? checkoutPricing.fee : 0,
          taxEGP: effectiveCurrency === 'EGP' ? checkoutPricing.tax : 0,
          taxEUR: effectiveCurrency === 'EUR' ? checkoutPricing.tax : 0,
          totalEGP: createdBooking.totalPriceEGP,
          totalEUR: createdBooking.totalPriceEUR,
          depositAmountEGP: createdBooking.depositAmountEGP,
          depositAmountEUR: createdBooking.depositAmountEUR,
          remainingAmountEGP: createdBooking.remainingAmountEGP,
          remainingAmountEUR: createdBooking.remainingAmountEUR,
          paymentMethodLabel:
            paymentMethod === 'online_card'
              ? `بطاقة بنكية (${safeCardLast4 ? `•••• ${safeCardLast4}` : 'إلكتروني'})`
              : paymentMethod === 'deposit'
                ? `عربون ${DEFAULT_DEPOSIT_PERCENT}%`
                : 'نقداً عند التحرك'
        });
      }
    } catch {
      setBookingError(
        isEn
          ? 'Could not submit booking. Please try again.'
          : 'تعذر إرسال الحجز، يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Verified Personal Bookings ONLY (Zero PII Leakage!)
  const signedInCustomerPhoneNorm = useMemo(() => {
    if (!currentUser) return '';
    return normalizePhone(currentUser.phone);
  }, [currentUser]);

  const handleVerifyGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(lookupPhone);
    const c = lookupCode.trim().toLowerCase();
    if (p.length < 7 || c.length < 3) {
      setLookupFeedback(
        isEn
          ? 'For your privacy, please enter both phone number and booking code.'
          : 'لحماية الخصوصية، يرجى إدخال رقم الهاتف وكود الحجز معاً.'
      );
      return;
    }
    setLookupFeedback(null);
    setLookupLoading(true);
    setVerifiedGuestKeys({ phone: p, code: c });

    try {
      const res = await fetch(
        `/api/public/my-bookings?phone=${encodeURIComponent(lookupPhone.trim())}&code=${encodeURIComponent(lookupCode.trim())}`
      );
      if (res.ok) {
        const data = (await res.json()) as {
          activityBookings?: BookingRequest[];
          tripBookings?: TripBooking[];
          inTripRequests?: InTripAddonRequestRecord[];
        };
        const srvActs = Array.isArray(data.activityBookings) ? data.activityBookings : [];
        const srvTrips = Array.isArray(data.tripBookings) ? data.tripBookings : [];
        const srvReqs = Array.isArray(data.inTripRequests) ? data.inTripRequests : [];
        setServerLookupActivityBookings(srvActs);
        setServerLookupTripBookings(srvTrips);
        setServerLookupInTripRequests(srvReqs);
      }
    } catch {
      // Fallback to local state when server offline
    } finally {
      setLookupLoading(false);
    }
  };

  const mergedActivityBookings = useMemo(() => {
    const map = new Map<string, BookingRequest>();
    serverLookupActivityBookings.forEach((b) => map.set(b.id, b));
    activityBookings.forEach((b) => map.set(b.id, b));
    return Array.from(map.values());
  }, [activityBookings, serverLookupActivityBookings]);

  const mergedTripBookings = useMemo(() => {
    const map = new Map<string, TripBooking>();
    serverLookupTripBookings.forEach((tb) => map.set(tb.id, tb));
    tripBookings.forEach((tb) => map.set(tb.id, tb));
    return Array.from(map.values());
  }, [tripBookings, serverLookupTripBookings]);

  const mergedInTripRequests = useMemo(() => {
    const map = new Map<string, InTripAddonRequestRecord>();
    serverLookupInTripRequests.forEach((r) => map.set(r.id, r));
    inTripRequests.forEach((r) => map.set(r.id, r));
    return Array.from(map.values());
  }, [inTripRequests, serverLookupInTripRequests]);

  const matchedCustomerBookings = useMemo(() => {
    const isMatch = (customerPhoneVal: string, bookingCodeVal: string) => {
      const rPhone = normalizePhone(customerPhoneVal);
      const rCode = bookingCodeVal.trim().toLowerCase();

      if (mySessionBookingCodes.some((sc) => sc.toLowerCase() === rCode)) {
        return true;
      }
      if (
        isStandaloneCustomerShell &&
        signedInCustomerPhoneNorm.length >= 7 &&
        rPhone === signedInCustomerPhoneNorm
      ) {
        return true;
      }
      if (verifiedGuestKeys) {
        return rPhone === verifiedGuestKeys.phone && rCode === verifiedGuestKeys.code;
      }
      return false;
    };

    const act = mergedActivityBookings.filter((b) => isMatch(b.customerPhone, b.bookingCode));
    const trip = mergedTripBookings.filter((b) => isMatch(b.customerPhone, b.bookingCode));
    return { act, trip };
  }, [
    mergedActivityBookings,
    mergedTripBookings,
    mySessionBookingCodes,
    isStandaloneCustomerShell,
    signedInCustomerPhoneNorm,
    verifiedGuestKeys
  ]);

  const completedMissionBookingIdSet = useMemo(
    () =>
      new Set(
        driverMissions
          .filter((m) => m.status === 'completed')
          .map((m) => m.bookingId)
      ),
    [driverMissions]
  );

  const isActivityBookingCompleted = (bk: BookingRequest) =>
    bk.status === 'completed' || completedMissionBookingIdSet.has(bk.id);

  const isTripBookingCompleted = (tb: TripBooking) =>
    tb.status === 'completed' || completedMissionBookingIdSet.has(tb.id);

  const reviewedBookingCodeSet = useMemo(
    () =>
      new Set(
        reviews
          .map((r) => (r.verifiedBookingCode || '').trim().toLowerCase())
          .filter(Boolean)
      ),
    [reviews]
  );

  const viewerCompletedBookings = useMemo(() => {
    const actCompleted = matchedCustomerBookings.act
      .filter((bk) => isActivityBookingCompleted(bk))
      .map((bk) => ({
        bookingId: bk.id,
        bookingCode: bk.bookingCode,
        targetKind: (bk.entityKind === 'trip' ? 'trip' : 'activity') as 'activity' | 'trip',
        targetId: bk.activityId,
        targetTitle: bk.activityName,
        tripDate: bk.tripDate,
        customerName: bk.customerName,
        customerPhone: bk.customerPhone,
        alreadyReviewed: reviewedBookingCodeSet.has(bk.bookingCode.trim().toLowerCase())
      }));

    const tripCompleted = matchedCustomerBookings.trip
      .filter((tb) => isTripBookingCompleted(tb))
      .map((tb) => {
        const matchedTrip = trips.find(
          (t) => t.id === tb.activityId || t.name === tb.tripTitle
        );
        return {
          bookingId: tb.id,
          bookingCode: tb.bookingCode,
          targetKind: 'trip' as const,
          targetId: matchedTrip?.id || tb.activityId || tb.id,
          targetTitle: tb.tripTitle,
          tripDate: tb.departureDate,
          customerName: tb.customerName,
          customerPhone: tb.customerPhone,
          alreadyReviewed: reviewedBookingCodeSet.has(tb.bookingCode.trim().toLowerCase())
        };
      });

    return [...actCompleted, ...tripCompleted];
  }, [matchedCustomerBookings, completedMissionBookingIdSet, reviewedBookingCodeSet, trips]);

  const eligibleReviewBookings = useMemo(
    () => viewerCompletedBookings.filter((b) => !b.alreadyReviewed),
    [viewerCompletedBookings]
  );

  useEffect(() => {
    if (
      eligibleReviewBookings.length > 0 &&
      !eligibleReviewBookings.some((b) => b.bookingCode === revBookingCode)
    ) {
      setRevBookingCode(eligibleReviewBookings[0].bookingCode);
    }
  }, [eligibleReviewBookings, revBookingCode]);

  const handleVerifyReviewBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(revVerifyPhone);
    const c = revVerifyCode.trim().toLowerCase();
    if (p.length < 7 || c.length < 3) {
      setRevVerifyNotice(
        isEn
          ? 'Please enter both registered phone and ticket code.'
          : 'يرجى إدخال رقم الهاتف المسجّل في الحجز وكود التذكرة معاً.'
      );
      return;
    }

    const foundAct = mergedActivityBookings.find(
      (b) => normalizePhone(b.customerPhone) === p && b.bookingCode.trim().toLowerCase() === c
    );
    const foundTrip = mergedTripBookings.find(
      (tb) => normalizePhone(tb.customerPhone) === p && tb.bookingCode.trim().toLowerCase() === c
    );

    if (!foundAct && !foundTrip) {
      setRevVerifyNotice(
        isEn
          ? 'No booking matched that phone number and ticket code.'
          : 'لم يتم العثور على حجز يطابق رقم الهاتف وكود التذكرة المدخلين.'
      );
      return;
    }

    setVerifiedGuestKeys({ phone: p, code: c });
    setLookupPhone(revVerifyPhone.trim());
    setLookupCode(revVerifyCode.trim());

    const completed = foundAct
      ? isActivityBookingCompleted(foundAct)
      : foundTrip
        ? isTripBookingCompleted(foundTrip)
        : false;
    const code = (foundAct?.bookingCode || foundTrip?.bookingCode || '').trim().toLowerCase();

    if (!completed) {
      setRevVerifyNotice(
        isEn
          ? 'Booking found, but reviews open only after the activity/trip is completed.'
          : 'تم التحقق من التذكرة، لكن الحجز لم يُستكمل تنفيذه بعد. يُفتح التقييم تلقائياً بعد تأكيد تأدية النشاط أو الرحلة.'
      );
      return;
    }
    if (reviewedBookingCodeSet.has(code)) {
      setRevVerifyNotice(
        isEn
          ? 'A verified review has already been submitted for this booking.'
          : 'تم إرسال تقييم موثق لهذا الحجز مسبقاً.'
      );
      return;
    }

    setRevBookingCode(foundAct?.bookingCode || foundTrip?.bookingCode || '');
    setRevName(foundAct?.customerName || foundTrip?.customerName || revName);
    setRevPhone(foundAct?.customerPhone || foundTrip?.customerPhone || revVerifyPhone);
    setRevVerifyNotice(null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevError(null);

    const chosenBooking =
      eligibleReviewBookings.find((b) => b.bookingCode === revBookingCode) ||
      eligibleReviewBookings[0];

    if (!chosenBooking) {
      setRevError(
        isEn
          ? 'Reviews are only allowed after completing the experience.'
          : 'لا يمكن إرسال تقييم قبل استكمال النشاط أو الرحلة وتأكيد تأديتها من قِبل الشركة.'
      );
      return;
    }

    const finalName = (revName || chosenBooking.customerName || '').trim();
    const finalPhone = (revPhone || chosenBooking.customerPhone || '').trim();
    if (!finalName || !revComment.trim()) {
      setRevError(
        isEn ? 'Please enter your name and comment.' : 'يرجى كتابة الاسم وتعليق التقييم.'
      );
      return;
    }

    const payload = {
      targetKind: chosenBooking.targetKind,
      targetId: chosenBooking.targetId,
      targetTitle: chosenBooking.targetTitle,
      customerName: finalName,
      customerPhone: finalPhone || undefined,
      verifiedBookingCode: chosenBooking.bookingCode,
      rating: revRating,
      comment: revComment.trim()
    };

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/public/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = (await res.json()) as { review: CustomerReviewRecord };
        onAddReview(json.review);
      } else {
        const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
        setRevError(
          errJson?.error ||
            (isEn
              ? 'Cannot submit review before completion.'
              : 'لا يمكن تقييم النشاط أو الرحلة قبل استكمالها وتأكيد تأديتها.')
        );
        setSubmittingReview(false);
        return;
      }
    } catch {
      onAddReview({
        ...payload,
        id: `rev-${Date.now()}`,
        createdAt: getTodayIso()
      });
    } finally {
      setSubmittingReview(false);
    }

    setRevComment('');
    setRevSuccess(
      isEn
        ? 'Thank you! Your verified review has been published.'
        : 'شكراً لك! تم توثيق تقييمك ونشره على صفحة التجربة.'
    );
    setTimeout(() => setRevSuccess(null), 4000);
  };

  const selectedItemReviews = useMemo(() => {
    if (!selectedItem) return [];
    return reviews.filter((r) => r.targetId === selectedItem.id);
  }, [reviews, selectedItem]);

  const selectedItemEquipments = useMemo(() => {
    if (!selectedItem || selectedItem.showEquipmentToClient === false) return [];
    const eqSet = new Set(selectedItem.equipmentIds || []);
    return equipments.filter((eq) => eqSet.has(eq.id));
  }, [equipments, selectedItem]);

  const visibleCatalogIdSet = useMemo(
    () => new Set(catalogItems.map((it) => it.id)),
    [catalogItems]
  );

  const activeCollections = useMemo(
    () =>
      activityCollections.filter(
        (c) => c.status === 'active' && c.activityIds.some((id) => visibleCatalogIdSet.has(id))
      ),
    [activityCollections, visibleCatalogIdSet]
  );

  const selectedMediaList = useMemo(() => {
    if (!selectedItem) return [];
    return selectedItem.media || [];
  }, [selectedItem]);

  const activeMedia = selectedMediaList[activeMediaIndex] || selectedMediaList[0];

  const handleCopyAndUsePromo = (code: string) => {
    setPreferredPromoCode(code);
    setCopiedPromoCode(code);
    try {
      void navigator.clipboard?.writeText(code);
    } catch {
      // ignore clipboard restrictions
    }
    setTimeout(() => setCopiedPromoCode(null), 2500);
  };

  const resolveDriverVehicleForBooking = (bookingId: string, customerNameVal?: string) => {
    const mission = driverMissions.find((m) => m.bookingId === bookingId);
    if (!mission && !customerNameVal) return null;
    const assignedName = mission?.assignedDriverName;
    const vehicle = assignedName
      ? logisticsVehicles.find((v) => v.driverName === assignedName)
      : undefined;
    if (!mission && !vehicle) return null;
    return {
      mission,
      vehicle
    };
  };

  const renderPaidRefundLabel = (
    refundStatus?: string,
    refundEGP?: number,
    refundEUR?: number,
    customerType?: 'egyptian' | 'foreigner'
  ) => {
    if (!refundStatus || refundStatus === 'none') return null;
    const amt =
      customerType === 'foreigner'
        ? `€ ${(refundEUR || 0).toFixed(2)}`
        : `${(refundEGP || 0).toLocaleString()} ج.م`;
    return (
      <span className="text-[11px] text-emerald-300 font-semibold">
        {refundStatus === 'full_refund_pending'
          ? isEn
            ? `Full refund pending (${amt})`
            : `استرداد كامل قيد المعالجة (${amt})`
          : refundStatus === 'partial_refund_pending'
            ? isEn
              ? `Partial refund pending (${amt})`
              : `استرداد جزئي قيد المعالجة (${amt})`
            : isEn
              ? `Refunded (${amt})`
              : `تم الاسترداد (${amt})`}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Storefront Hero & Sub-toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {customerScope === 'company' && currentUser?.registeredCompanyName
                ? isEn
                  ? `${currentUser.registeredCompanyName} · Direct Experience Portal`
                  : `بوابة عميل شركة ${currentUser.registeredCompanyName}`
                : isEn
                  ? 'Explore Curated Marine, Safari & Adventure Experiences'
                  : 'بوابة العميل · اكتشف واحجز أجمل الأنشطة والرحلات السياحية'}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {customerScope === 'company' && currentUser?.registeredCompanyName
                ? isEn
                  ? `Company client registered with "${currentUser.registeredCompanyName}" — showing this company's published activities & trips with automatic nationality pricing.`
                  : `حساب عميل شركة مسجّل لدى «${currentUser.registeredCompanyName}» — تُعرض أنشطة ورحلات هذه الشركة المنشورة لقنوات العملاء فقط، وبالسعر المخصص تلقائياً حسب جنسيتك.`
                : isEn
                  ? 'Platform customer catalog across verified providers, automatically priced by your registered nationality.'
                  : 'حساب عميل منصة — تُعرض جميع الأنشطة والرحلات المنشورة على قنوات المنصة من مختلف الشركات، وبالسعر التلقائي المخصص لجنسيتك بدون تبديل يدوي.'}
            </p>
            {isCustomerAccount && isNationalityConfigured && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <Globe className="w-3.5 h-3.5" />
                  <span>
                    {isEn ? 'Nationality:' : 'الجنسية المسجلة:'}{' '}
                    {getNationalityDisplayLabel(registeredNationality, lang)}
                  </span>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-emerald-300 font-semibold">
                  {pricingAudience === 'egyptian'
                    ? isEn
                      ? 'Auto Rate: Egyptian Tier (EGP)'
                      : 'السعر المعروض: المصري تلقائياً (EGP)'
                    : isEn
                      ? 'Auto Rate: International Tier (€ EUR)'
                      : 'السعر المعروض: الأجنبي تلقائياً (€ EUR)'}
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {customerScope === 'company'
                      ? `${isEn ? 'Company Client:' : 'عميل شركة:'} ${currentUser?.registeredCompanyName || ''}`
                      : isEn
                        ? 'Platform Client (All Companies)'
                        : 'عميل منصة (جميع الشركات حسب قنوات النشر)'}
                  </span>
                </span>
              </div>
            )}
          </div>

          {!isStandaloneCustomerShell && (
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              {!isCustomerAccount && (
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setCurrency('EGP')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                      currency === 'EGP'
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isEn ? 'Egyptian Preview (EGP)' : 'معاينة المصري (EGP)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('EUR')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                      currency === 'EUR'
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isEn ? 'Foreigner Preview (€ EUR)' : 'معاينة الأجنبي (€ EUR)'}
                  </button>
                </div>
              )}

              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setLang('ar')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold ${
                    lang === 'ar' ? 'bg-slate-800 text-white' : 'text-slate-400'
                  }`}
                >
                  عربي
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold ${
                    lang === 'en' ? 'bg-slate-800 text-white' : 'text-slate-400'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Inline Tab Switcher (only shown if NOT inside CustomerMasterLayout) */}
        {!isStandaloneCustomerShell && (
          <div className="flex items-center gap-2 border-t border-slate-800 pt-4 flex-wrap">
            {[
              {
                id: 'catalog' as const,
                label: isEn
                  ? `Explore (${catalogItems.length})`
                  : `استكشف الأنشطة (${catalogItems.length})`,
                icon: Compass
              },
              {
                id: 'collections' as const,
                label: isEn
                  ? `Packages (${activeCollections.length})`
                  : `الباقات (${activeCollections.length})`,
                icon: Layers
              },
              {
                id: 'offers' as const,
                label: isEn ? 'Seasonal Offers' : 'العروض والخصومات',
                icon: Gift
              },
              {
                id: 'favorites' as const,
                label: isEn
                  ? `Favorites (${favoriteIds.length})`
                  : `المفضلة (${favoriteIds.length})`,
                icon: Heart
              },
              {
                id: 'my_bookings' as const,
                label: isEn ? 'My Bookings' : 'حجوزاتي وتذاكري',
                icon: Ticket
              },
              {
                id: 'reviews' as const,
                label: isEn
                  ? `Reviews (${reviews.length})`
                  : `تقييمات السياح (${reviews.length})`,
                icon: Star
              }
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === t.id
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Inline First-Time Customer Registration Card (Nationality + Platform/Company Scope) */}
      {isCustomerAccount && !isNationalityConfigured && onCompleteCustomerProfile && (
        <form
          onSubmit={handleSaveInlineOnboarding}
          className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>
                  {isEn
                    ? 'Complete First-Time Customer Profile (Nationality & Account Scope)'
                    : 'استكمال بيانات العميل لأول مرة (تحديد الجنسية ونطاق التسجيل)'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isEn
                  ? 'Select your nationality once to unlock automatic pricing (EGP for Egyptians, EUR for international guests).'
                  : 'بمجرد اختيار الجنسية يُطبّق التسعير تلقائياً (المصري بالجنيه المصري أو الأجنبي باليورو) طوال تصفحك وحجوزاتك دون اختيار يدوي.'}
              </p>
            </div>
          </div>

          {onboardError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
              {onboardError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1">
                {isEn ? 'Full Name *' : 'الاسم الكامل *'}
              </label>
              <input
                type="text"
                required
                value={onboardName}
                onChange={(e) => setOnboardName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                {isEn ? 'Phone / WhatsApp *' : 'رقم الهاتف / الواتساب *'}
              </label>
              <input
                type="text"
                required
                value={onboardPhone}
                onChange={(e) => setOnboardPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                {isEn ? 'Nationality * (Auto-prices catalog)' : 'الجنسية * (تحدد السعر تلقائياً)'}
              </label>
              <select
                value={onboardNationality}
                onChange={(e) => setOnboardNationality(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                {CUSTOMER_NATIONALITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isEn ? opt.labelEn : opt.labelAr}
                  </option>
                ))}
              </select>
              {onboardNationality === 'أخرى' && (
                <input
                  type="text"
                  required
                  value={onboardCustomNationality}
                  onChange={(e) => setOnboardCustomNationality(e.target.value)}
                  placeholder={isEn ? 'Enter country / nationality' : 'اكتب اسم الدولة / الجنسية'}
                  className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              )}
              <div className="mt-1 text-[11px] font-semibold text-emerald-300">
                {isEgyptianNationality(
                  onboardNationality === 'أخرى' ? onboardCustomNationality : onboardNationality
                )
                  ? isEn
                    ? 'Active Rate: Egyptian Tier (EGP)'
                    : 'سيتم تفعيل: السعر المصري فقط (EGP)'
                  : isEn
                    ? 'Active Rate: Foreigner Tier (€ EUR)'
                    : 'سيتم تفعيل: السعر الأجنبي فقط (€ EUR)'}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                {isEn ? 'Account Scope' : 'نوع التسجيل (منصة أم شركة)'}
              </label>
              <select
                value={onboardScope}
                onChange={(e) =>
                  setOnboardScope(e.target.value === 'company' ? 'company' : 'platform')
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="platform">
                  {isEn ? 'Platform Client (All companies)' : 'عميل منصة (يرى جميع الشركات حسب قنوات النشر)'}
                </option>
                <option value="company">
                  {isEn ? 'Company Client (Specific provider)' : 'عميل شركة محددة (يرى أنشطة ورحلات تلك الشركة فقط)'}
                </option>
              </select>
              {onboardScope === 'company' && (
                <select
                  value={onboardCompanyId}
                  onChange={(e) => setOnboardCompanyId(e.target.value)}
                  className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
            >
              {isEn
                ? 'Save & Apply Automatic Pricing'
                : 'حفظ وتطبيق التسعير المخصص تلقائياً'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 1 / OFFERS / FAVORITES: Experience Catalog Grid */}
      {(activeTab === 'catalog' || activeTab === 'offers' || activeTab === 'favorites') && (
        <div className="space-y-5">
          {/* Promo Codes Banner inside Offers Tab */}
          {activeTab === 'offers' && activePromoCodesForAudience.length > 0 && (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isEn
                      ? 'Active Promo Codes (Stackable at Checkout)'
                      : 'أكواد الخصم الحصرية (متاحة للتطبيق عند إتمام الحجز)'}
                  </span>
                </div>
                {preferredPromoCode && (
                  <span className="text-[11px] text-emerald-300 font-semibold">
                    {isEn
                      ? `Selected for next booking: ${preferredPromoCode}`
                      : `مفعّل لحجزك القادم: ${preferredPromoCode}`}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activePromoCodesForAudience.map((promo) => {
                  const isSelected = preferredPromoCode === promo.code;
                  const isCopied = copiedPromoCode === promo.code;
                  return (
                    <div
                      key={promo.code}
                      className={`bg-slate-950 border rounded-xl p-3 flex items-center justify-between gap-3 ${
                        isSelected ? 'border-emerald-500/60' : 'border-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-emerald-300 text-xs">
                          {promo.code}
                        </div>
                        <div className="text-[11px] text-slate-300 truncate mt-0.5">
                          {isEn ? promo.titleEn : promo.titleAr}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {isEn ? `Valid until ${promo.endDate}` : `ساري حتى ${promo.endDate}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyAndUsePromo(promo.code)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1 shrink-0 whitespace-nowrap"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Ready' : 'تم النسخ'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Apply' : 'استخدام'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search + Category Filters + Offer Type Filter */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search
                className={`w-4 h-4 text-slate-500 absolute ${
                  isEn ? 'left-3' : 'right-3'
                } top-2.5 pointer-events-none`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isEn
                    ? 'Search yacht, safari, diving or city...'
                    : 'ابحث عن رحلة يخت، سفاري، غوص أو مدينة...'
                }
                className={`w-full bg-slate-900 border border-slate-800 rounded-xl ${
                  isEn ? 'pl-9 pr-3' : 'pr-9 pl-3'
                } py-2 text-xs text-white focus:outline-none focus:border-cyan-500`}
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {activeTab === 'offers' && (
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] ml-2">
                  {[
                    { id: 'all' as const, label: isEn ? 'All Offers' : 'كل العروض' },
                    { id: 'percentage' as const, label: isEn ? '% Off' : 'نسبة مئوية %' },
                    { id: 'fixed_amount' as const, label: isEn ? 'Cash Off' : 'خصم مبلغ ثابت' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setOfferTypeFilter(f.id)}
                      className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap ${
                        offerTypeFilter === f.id
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  categoryFilter === 'all'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isEn ? 'All' : 'الكل'}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredCatalog.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-400 space-y-3">
              <div>
                {activeTab === 'favorites'
                  ? isEn
                    ? 'You have no saved favorites yet.'
                    : 'لم تضف أي أنشطة إلى مفضلتك بعد. اضغط على أيقونة القلب لحفظ التجارب التي تعجبك.'
                  : activeTab === 'offers'
                    ? isEn
                      ? 'No active seasonal offers match your filter right now.'
                      : 'لا توجد عروض موسمية نشطة مطابقة للبحث حالياً.'
                    : isEn
                      ? 'No published experiences match your search.'
                      : 'لا توجد أنشطة أو رحلات منشورة مطابقة للبحث حالياً.'}
              </div>
              {activeTab !== 'catalog' && (
                <button
                  type="button"
                  onClick={() => {
                    setOfferTypeFilter('all');
                    setCategoryFilter('all');
                    setActiveTab('catalog');
                  }}
                  className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-bold"
                >
                  {isEn ? 'Explore All Experiences' : 'استكشاف جميع الأنشطة'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCatalog.map((item) => {
                const cover =
                  item.media?.find((m) => m.isCover && m.type === 'image') ||
                  item.media?.find((m) => m.type === 'image');
                const tier =
                  pricingAudience === 'egyptian'
                    ? item.pricing.egyptianB2C
                    : item.pricing.foreignerB2C;
                const adultPrice = effectiveCurrency === 'EGP' ? tier.adultEGP : tier.adultEUR;
                const privatePrice =
                  effectiveCurrency === 'EGP' ? tier.privateTotalEGP : tier.privateTotalEUR;
                const isPrivateOnlyCard = adultPrice <= 0 && (privatePrice || 0) > 0;
                const rawPrice = isPrivateOnlyCard ? Number(privatePrice || 0) : adultPrice;

                const todayDiscount = findActiveSeasonalDiscount(
                  item.seasonalDiscounts,
                  getTodayIso(),
                  pricingAudience
                );
                const discountedPrice = applySeasonalDiscountAmount(
                  rawPrice,
                  todayDiscount,
                  effectiveCurrency
                );
                const finalCalc = calculateCustomerFeeAndTax(
                  discountedPrice,
                  platformPricingSettings,
                  effectiveCurrency
                );
                const rawFinalCalc = calculateCustomerFeeAndTax(
                  rawPrice,
                  platformPricingSettings,
                  effectiveCurrency
                );
                const stats = ratingStatsByTarget.get(item.id);
                const displayName =
                  lang === 'en' && item.translations?.en?.name
                    ? item.translations.en.name
                    : item.name;
                const catLabel =
                  item.categoryPath?.[item.categoryPath.length - 1] ||
                  item.categoryPath?.[0] ||
                  (isEn ? 'Experience' : 'تجربة سياحية');
                const isFav = favoriteIds.includes(item.id);
                const imageBroken = Boolean(brokenImageIds[item.id]);

                const discountBadgeLabel = todayDiscount
                  ? todayDiscount.discountType === 'percentage'
                    ? `${isEn ? 'SAVE' : 'خصم'} ${
                        effectiveCurrency === 'EGP'
                          ? todayDiscount.valueEGP
                          : todayDiscount.valueEUR
                      }%`
                    : `${isEn ? 'SAVE' : 'وفر'} ${
                        effectiveCurrency === 'EGP'
                          ? `${todayDiscount.valueEGP} ج.م`
                          : `€${todayDiscount.valueEUR}`
                      }`
                  : null;

                return (
                  <div
                    key={`${item._kind}-${item.id}`}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between transition-transform hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="aspect-[16/10] bg-slate-950 relative overflow-hidden">
                        {cover?.url && !imageBroken ? (
                          <img
                            src={cover.url}
                            alt={displayName}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setBrokenImageIds((prev) => ({ ...prev, [item.id]: true }))
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950/50 flex flex-col items-center justify-center gap-2 text-slate-500">
                            {item._kind === 'trip' ? (
                              <Ship className="w-8 h-8 text-cyan-500/60" />
                            ) : (
                              <Compass className="w-8 h-8 text-cyan-500/60" />
                            )}
                            <span className="text-[11px]">{catLabel}</span>
                          </div>
                        )}
                        {discountBadgeLabel && (
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-600/95 text-white text-[11px] font-bold font-mono tabular-nums shadow">
                            {discountBadgeLabel}
                          </span>
                        )}
                        {onToggleFavorite && (
                          <button
                            type="button"
                            onClick={() => onToggleFavorite(item.id)}
                            aria-label={isEn ? 'Save to favorites' : 'حفظ في المفضلة'}
                            className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-sm border transition-colors ${
                              isFav
                                ? 'bg-rose-600/90 border-rose-400 text-white'
                                : 'bg-slate-950/70 border-slate-700 text-slate-200 hover:text-rose-400'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        )}
                      </div>

                      <div className="p-4 space-y-2.5">
                        {/* Unboxed metadata per zero-pill discipline */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                          <span className="text-cyan-400 font-medium">{catLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.location?.city || 'البحر الأحمر'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {item.duration?.hours || 3} {isEn ? 'hrs' : 'ساعات'}
                          </span>
                          {stats && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-300 font-mono tabular-nums">
                                ★ {stats.avg} ({stats.count})
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
                          {displayName}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {lang === 'en' && item.translations?.en?.description
                            ? item.translations.en.description
                            : item.summary || item.description}
                        </p>

                        {todayDiscount && (
                          <div className="text-[11px] text-emerald-300 font-medium flex items-center justify-between gap-2 pt-1">
                            <span className="truncate">{todayDiscount.title}</span>
                            {todayDiscount.endDate && (
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                {isEn ? `Ends ${todayDiscount.endDate}` : `حتى ${todayDiscount.endDate}`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-[10px] text-slate-400">
                          {isPrivateOnlyCard
                            ? isEn
                              ? 'Private Group Rate'
                              : 'سعر المجموعة الخاصة'
                            : isEn
                              ? 'All-in per adult'
                              : 'السعر الشامل للفرد'}
                        </span>
                        <div className="flex items-baseline gap-2 font-mono tabular-nums">
                          <span className="text-base font-bold text-emerald-300">
                            {effectiveCurrency === 'EGP'
                              ? `${finalCalc.total.toLocaleString()} ج.م`
                              : `€ ${finalCalc.total.toLocaleString()}`}
                          </span>
                          {todayDiscount && rawFinalCalc.total > finalCalc.total && (
                            <span className="text-xs text-slate-500 line-through">
                              {effectiveCurrency === 'EGP'
                                ? `${rawFinalCalc.total.toLocaleString()}`
                                : `€${rawFinalCalc.total.toLocaleString()}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openExperienceModal(item)}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                      >
                        {isEn ? 'Details & Book' : 'عرض التفاصيل والحجز'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: Collections & Packages */}
      {activeTab === 'collections' && (
        <div className="space-y-5">
          {activeCollections.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-400">
              {isEn ? 'No packages available right now.' : 'لا توجد باقات سياحية منشورة حالياً.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeCollections.map((col) => {
                const included = catalogItems.filter((it) => col.activityIds.includes(it.id));
                return (
                  <div
                    key={col.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[16/9] bg-slate-950 relative overflow-hidden">
                        {col.coverUrl ? (
                          <img
                            src={col.coverUrl}
                            alt={col.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-cyan-950/60 flex items-center justify-center">
                            <Layers className="w-10 h-10 text-cyan-400/60" />
                          </div>
                        )}
                      </div>
                      <div className="p-5 space-y-2.5">
                        <div className="text-[11px] text-cyan-400 font-medium">
                          {col.category} ·{' '}
                          <span className="tabular-nums">
                            {included.length} {isEn ? 'experiences' : 'أنشطة'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{col.name}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {col.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-slate-800 space-y-2">
                      <div className="text-[11px] text-slate-400 font-semibold">
                        {isEn ? 'Included in this bundle:' : 'التجارب المشمولة في الباقة:'}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {included.map((inc) => (
                          <button
                            key={inc.id}
                            type="button"
                            onClick={() => openExperienceModal(inc)}
                            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-cyan-600/20 border border-slate-800 hover:border-cyan-500/40 text-xs text-cyan-300 font-semibold transition-colors"
                          >
                            {isEn && inc.translations?.en?.name ? inc.translations.en.name : inc.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: My Bookings & Voucher Tracking (Verified Personal Access Only!) */}
      {activeTab === 'my_bookings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>
                  {isEn
                    ? 'My Bookings & Ticket Tracking (Privacy Protected)'
                    : 'حجوزاتي وتتبع التذاكر (خصوصية محمية)'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Only your verified bookings appear here. Guest lookup requires both your registered phone and booking code.'
                  : 'تظهر هنا حجوزاتك الشخصية فقط. للبحث عن حجز مسجّل كضيف، يرجى إدخال رقم الهاتف وكود الحجز معاً للتحقق.'}
              </p>
            </div>

            <form
              onSubmit={handleVerifyGuestLookup}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <input
                type="text"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                placeholder={isEn ? 'Registered phone' : 'رقم الهاتف المسجل'}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value)}
                placeholder={isEn ? 'Booking code (ZN-...)' : 'كود الحجز (مثل ZN-...)'}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold whitespace-nowrap disabled:opacity-50"
              >
                {lookupLoading
                  ? isEn
                    ? 'Checking...'
                    : 'جاري البحث...'
                  : isEn
                    ? 'Verify & View'
                    : 'تحقق وعرض الحجز'}
              </button>
            </form>
          </div>

          {lookupFeedback && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/40 text-xs text-amber-300">
              {lookupFeedback}
            </div>
          )}

          {bookingActionNotice && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-xs text-emerald-300 flex items-center justify-between gap-2">
              <span>{bookingActionNotice}</span>
              <button
                type="button"
                onClick={() => setBookingActionNotice(null)}
                className="text-emerald-300 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            {matchedCustomerBookings.act.length === 0 &&
            matchedCustomerBookings.trip.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-400 space-y-2">
                <div>
                  {isEn
                    ? 'No matching bookings yet. Enter your phone + booking code above or explore activities.'
                    : 'لا توجد حجوزات مطابقة لحسابك الحالي بعد، أو أدخل رقم الهاتف + كود الحجز أعلاه للتحقق من تذكرتك.'}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-bold"
                >
                  {isEn ? 'Browse Activities & Book' : 'تصفح الأنشطة واحجز الآن'}
                </button>
              </div>
            ) : (
              <>
                {matchedCustomerBookings.act.map((bk) => {
                  const linkedRequests = mergedInTripRequests.filter(
                    (r) =>
                      r.linkedBookingId === bk.id ||
                      (r.linkedBookingCode &&
                        r.linkedBookingCode.toLowerCase() === bk.bookingCode.toLowerCase())
                  );
                  const duringAddons = linkedRequests.flatMap((r) => r.items);
                  const allCheckout = (bk.selectedPaidAddons || []).filter(
                    (a) => a.stage !== 'during_trip'
                  );
                  const allDuring =
                    duringAddons.length > 0
                      ? duringAddons
                      : (bk.selectedPaidAddons || []).filter((a) => a.stage === 'during_trip');
                  const addonsSumEGP = [...allCheckout, ...allDuring].reduce(
                    (s, a) => s + a.unitPriceEGP * a.quantity,
                    0
                  );
                  const addonsSumEUR = [...allCheckout, ...allDuring].reduce(
                    (s, a) => s + a.unitPriceEUR * a.quantity,
                    0
                  );
                  const bkCompleted = isActivityBookingCompleted(bk);
                  const bkReviewed = reviewedBookingCodeSet.has(
                    bk.bookingCode.trim().toLowerCase()
                  );
                  const canModify =
                    !bkCompleted &&
                    (bk.status === 'pending_approval' || bk.status === 'approved') &&
                    bk.tripDate >= getTodayIso();

                  const targetActivity = activities.find((a) => a.id === bk.activityId);
                  const refundPreview = evaluateCancellationRefund({
                    policy: targetActivity?.cancellationPolicy,
                    tripDate: bk.tripDate,
                    slotLabel: bk.slotLabel,
                    paidAmountEGP:
                      bk.paymentStatus === 'paid'
                        ? bk.totalPriceEGP
                        : bk.paymentStatus === 'deposit'
                          ? bk.depositAmountEGP ?? Math.round((bk.totalPriceEGP || 0) * 0.3)
                          : 0,
                    paidAmountEUR:
                      bk.paymentStatus === 'paid'
                        ? bk.totalPriceEUR
                        : bk.paymentStatus === 'deposit'
                          ? bk.depositAmountEUR ?? Number(((bk.totalPriceEUR || 0) * 0.3).toFixed(2))
                          : 0
                  });

                  const driverMeta = resolveDriverVehicleForBooking(bk.id, bk.customerName);
                  const deadlineHours = Math.max(
                    1,
                    Math.round((bk.deadlineMinutesRemaining || 240) / 60)
                  );

                  return (
                    <div
                      key={bk.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5 flex-wrap text-xs">
                            <span className="font-mono font-bold text-cyan-300">
                              #{bk.bookingCode}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-bold text-white">{bk.activityName}</span>
                            {bk.bookingMode === 'private_group' && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-300 font-semibold">
                                  {isEn ? 'Private Charter' : 'حجز خاص'}
                                </span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-semibold ${
                                bkCompleted
                                  ? 'text-cyan-300'
                                  : bk.status === 'approved'
                                    ? 'text-emerald-400'
                                    : bk.status === 'rejected' || bk.status === 'auto_cancelled'
                                      ? 'text-rose-400'
                                      : 'text-amber-300'
                              }`}
                            >
                              {bkCompleted
                                ? isEn
                                  ? 'Completed'
                                  : 'مكتمل (تم التنفيذ)'
                                : bk.status === 'approved'
                                  ? isEn
                                    ? 'Confirmed'
                                    : 'حجز مؤكد'
                                  : bk.status === 'rejected'
                                    ? isEn
                                      ? 'Rejected'
                                      : 'مرفوض'
                                    : bk.status === 'auto_cancelled'
                                      ? isEn
                                        ? 'Cancelled'
                                        : 'ملغى'
                                      : isEn
                                        ? 'Pending Approval'
                                        : 'قيد التأكيد'}
                            </span>
                            {bk.paymentMethod && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-slate-400">
                                  {bk.paymentMethod === 'online_card'
                                    ? bk.cardLast4
                                      ? `${isEn ? 'Card' : 'بطاقة'} •••• ${bk.cardLast4}`
                                      : isEn
                                        ? 'Online Card'
                                        : 'دفع إلكتروني'
                                    : bk.paymentMethod === 'deposit'
                                      ? isEn
                                        ? `Deposit (${DEFAULT_DEPOSIT_PERCENT}%)`
                                        : `دفع عربون (${DEFAULT_DEPOSIT_PERCENT}%)`
                                      : isEn
                                        ? 'Cash on Pickup'
                                        : 'دفع عند التحرك'}
                                </span>
                              </>
                            )}
                            {bk.promoCode && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-300 font-mono text-[11px]">
                                  {bk.promoCode}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                            <span className="font-mono tabular-nums">{bk.tripDate}</span>
                            <span>{bk.slotLabel}</span>
                            <span>{bk.pickupLocation}</span>
                            {bk.status === 'pending_approval' && !bkCompleted && (
                              <span className="text-amber-300/90 text-[11px]">
                                {isEn
                                  ? `Provider response SLA: ~${deadlineHours}h`
                                  : `مهلة اعتماد المزود: حتى ${deadlineHours} ساعات`}
                              </span>
                            )}
                          </div>

                          {bk.paymentMethod === 'deposit' &&
                            ((bk.depositAmountEGP || 0) > 0 || (bk.depositAmountEUR || 0) > 0) && (
                              <div className="text-[11px] text-amber-200/90 font-mono tabular-nums">
                                {isEn ? 'Deposit paid:' : 'العربون:'}{' '}
                                {bk.customerType === 'egyptian'
                                  ? `${(bk.depositAmountEGP || 0).toLocaleString()} ج.م`
                                  : `€ ${(bk.depositAmountEUR || 0).toFixed(2)}`}{' '}
                                · {isEn ? 'Remaining at pickup:' : 'المتبقي عند التنفيذ:'}{' '}
                                {bk.customerType === 'egyptian'
                                  ? `${(bk.remainingAmountEGP || 0).toLocaleString()} ج.م`
                                  : `€ ${(bk.remainingAmountEUR || 0).toFixed(2)}`}
                              </div>
                            )}

                          {driverMeta && (
                            <div className="text-[11px] text-cyan-300 flex items-center gap-2 flex-wrap">
                              <Car className="w-3.5 h-3.5 shrink-0" />
                              {driverMeta.mission && (
                                <span className="font-semibold">
                                  {isEn
                                    ? DRIVER_MISSION_LABELS_EN[driverMeta.mission.status]
                                    : DRIVER_MISSION_LABELS_AR[driverMeta.mission.status]}
                                </span>
                              )}
                              {driverMeta.mission?.assignedDriverName && (
                                <span>
                                  · {isEn ? 'Driver:' : 'السائق:'}{' '}
                                  {driverMeta.mission.assignedDriverName}
                                </span>
                              )}
                              {driverMeta.vehicle && (
                                <span>
                                  · {LOGISTICS_CATEGORY_LABELS[driverMeta.vehicle.category]} (
                                  {driverMeta.vehicle.plateOrCode})
                                </span>
                              )}
                            </div>
                          )}

                          {allDuring.length > 0 && (
                            <div className="text-[11px] text-amber-300">
                              {isEn ? 'During-trip add-ons:' : 'إضافات أثناء التجربة:'}{' '}
                              {allDuring.map((a) => `${a.title} (×${a.quantity})`).join(' · ')}
                            </div>
                          )}

                          {(bk.status === 'rejected' || bk.status === 'auto_cancelled') && (
                            <div className="text-[11px] text-rose-300 pt-1 space-y-0.5">
                              {bk.rejectionReason && (
                                <div>
                                  {isEn ? 'Reason:' : 'السبب:'} {bk.rejectionReason}
                                </div>
                              )}
                              {renderPaidRefundLabel(
                                bk.refundStatus,
                                bk.refundAmountEGP,
                                bk.refundAmountEUR,
                                bk.customerType
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <div className="text-left font-mono tabular-nums ml-2">
                            <span className="block text-[10px] text-slate-400">
                              {isEn ? 'Total' : 'الإجمالي النهائي'}
                            </span>
                            <span className="text-sm font-bold text-emerald-300">
                              {bk.customerType === 'egyptian'
                                ? `${bk.totalPriceEGP.toLocaleString()} ج.م`
                                : `€ ${bk.totalPriceEUR.toFixed(2)}`}
                            </span>
                          </div>

                          {canModify && onRescheduleCustomerBooking && (
                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleTargetId(bk.id);
                                setRescheduleDate(bk.tripDate);
                                setRescheduleSlot(bk.slotLabel);
                                setRescheduleError(null);
                              }}
                              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold whitespace-nowrap"
                            >
                              {isEn ? 'Reschedule' : 'تعديل الموعد'}
                            </button>
                          )}

                          {canModify && onCancelCustomerBooking && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmCancelId(confirmCancelId === bk.id ? null : bk.id)
                              }
                              className="px-3 py-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold whitespace-nowrap"
                            >
                              {isEn ? 'Cancel' : 'إلغاء الحجز'}
                            </button>
                          )}

                          {bkCompleted ? (
                            bkReviewed ? (
                              <span className="px-3 py-2 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-xs font-semibold whitespace-nowrap">
                                {isEn ? '✓ Reviewed' : '✓ تم التقييم'}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setRevBookingCode(bk.bookingCode);
                                  setRevName(bk.customerName || currentUser?.name || '');
                                  setRevPhone(bk.customerPhone || currentUser?.phone || '');
                                  setActiveTab('reviews');
                                }}
                                className="px-3 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <Star className="w-3.5 h-3.5" />
                                <span>{isEn ? 'Rate Experience' : 'تقييم التجربة'}</span>
                              </button>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-500 px-2 whitespace-nowrap">
                              {isEn ? 'Rate after completion' : 'التقييم بعد تأدية النشاط'}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setActiveVoucher({
                                documentKind: 'booking_ticket',
                                code: bk.bookingCode,
                                title: bk.activityName,
                                companyName: 'منصة زانوزا للأنشطة السياحية',
                                customerName: bk.customerName,
                                customerPhone: bk.customerPhone,
                                customerType: bk.customerType,
                                tripDate: bk.tripDate,
                                tripTime: bk.slotLabel,
                                pickupLocation: bk.pickupLocation,
                                guestsSummary: `${bk.adultsCount} بالغ · ${bk.childrenCount} طفل · ${bk.infantsCount} رضيع`,
                                statusLabel: bkCompleted
                                  ? 'مكتمل (تم التنفيذ)'
                                  : bk.status === 'approved'
                                    ? 'حجز مؤكد'
                                    : bk.status === 'auto_cancelled'
                                      ? 'حجز ملغى'
                                      : 'قيد التأكيد',
                                basePriceEGP: Math.max(0, bk.totalPriceEGP - addonsSumEGP),
                                basePriceEUR: Math.max(0, bk.totalPriceEUR - addonsSumEUR),
                                promoCode: bk.promoCode,
                                promoDiscountEGP: bk.promoDiscountEGP,
                                promoDiscountEUR: bk.promoDiscountEUR,
                                checkoutAddons: allCheckout,
                                duringTripAddons: allDuring,
                                totalEGP: bk.totalPriceEGP,
                                totalEUR: bk.totalPriceEUR,
                                depositAmountEGP: bk.depositAmountEGP,
                                depositAmountEUR: bk.depositAmountEUR,
                                remainingAmountEGP: bk.remainingAmountEGP,
                                remainingAmountEUR: bk.remainingAmountEUR,
                                refundSummary: bk.cancellationPolicySummary,
                                paymentMethodLabel:
                                  bk.paymentMethod === 'online_card'
                                    ? `بطاقة بنكية (${bk.cardLast4 ? `•••• ${bk.cardLast4}` : 'إلكتروني'})`
                                    : bk.paymentMethod === 'deposit'
                                      ? `عربون ${DEFAULT_DEPOSIT_PERCENT}%`
                                      : 'نقداً عند التحرك'
                              })
                            }
                            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Ticket & Invoice' : 'التذكرة والفاتورة'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Inline Policy-Aware Cancel Confirmation Drawer */}
                      {confirmCancelId === bk.id && onCancelCustomerBooking && (
                        <div className="pt-3 border-t border-rose-900/40 bg-rose-950/20 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="font-bold text-rose-200">
                              {isEn
                                ? 'Cancellation Policy Summary:'
                                : 'تفاصيل سياسة الإلغاء والاسترداد قبل التأكيد:'}
                            </div>
                            <div className="text-slate-300">
                              {bk.paymentStatus === 'pending'
                                ? isEn
                                  ? 'No online payment collected — free cancellation.'
                                  : 'لم يتم تحصيل مبلغ مسبقاً — إلغاء مجاني فوري.'
                                : isEn
                                  ? refundPreview.summaryEn
                                  : refundPreview.summaryAr}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={async () => {
                                await onCancelCustomerBooking(bk.id, 'إلغاء بواسطة العميل');
                                setConfirmCancelId(null);
                                setBookingActionNotice(
                                  isEn
                                    ? `Booking #${bk.bookingCode} has been cancelled.`
                                    : `تم إلغاء الحجز #${bk.bookingCode} وفق السياسة المعلنة.`
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold whitespace-nowrap"
                            >
                              {isEn ? 'Confirm Cancel' : 'تأكيد الإلغاء'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCancelId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 whitespace-nowrap"
                            >
                              {isEn ? 'Keep Booking' : 'تراجع'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline Reschedule Drawer with Real Slots */}
                      {rescheduleTargetId === bk.id && onRescheduleCustomerBooking && (
                        <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                          {rescheduleError && (
                            <div className="text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-1.5">
                              {rescheduleError}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-300 font-semibold">
                              {isEn ? 'New Date & Slot:' : 'اختر الموعد الجديد:'}
                            </span>
                            <input
                              type="date"
                              min={getTodayIso()}
                              value={rescheduleDate}
                              onChange={(e) => {
                                setRescheduleDate(e.target.value);
                                setRescheduleError(null);
                              }}
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                            />
                            {targetActivity?.slots && targetActivity.slots.length > 0 ? (
                              <select
                                value={rescheduleSlot}
                                onChange={(e) => {
                                  setRescheduleSlot(e.target.value);
                                  setRescheduleError(null);
                                }}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                              >
                                {targetActivity.slots.map((s) => {
                                  const stats = computeRemainingSeatsForItem(
                                    targetActivity,
                                    rescheduleDate,
                                    s,
                                    s.timeLabel
                                  );
                                  return (
                                    <option key={s.id} value={s.timeLabel}>
                                      {s.timeLabel} (
                                      {stats.blocked
                                        ? isEn
                                          ? 'Maintenance'
                                          : 'صيانة'
                                        : !stats.opOk
                                          ? isEn
                                            ? 'Closed'
                                            : 'مغلق'
                                          : `${stats.remaining} ${isEn ? 'seats' : 'مقعد'}`}
                                      )
                                    </option>
                                  );
                                })}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={rescheduleSlot}
                                onChange={(e) => setRescheduleSlot(e.target.value)}
                                placeholder="09:00 ص"
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                              />
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                if (rescheduleDate < getTodayIso()) return;
                                const res = await onRescheduleCustomerBooking(
                                  bk.id,
                                  rescheduleDate,
                                  rescheduleSlot || bk.slotLabel
                                );
                                if (res && !res.ok) {
                                  setRescheduleError(res.error || 'تعذر تعديل الموعد.');
                                  return;
                                }
                                setRescheduleTargetId(null);
                                setBookingActionNotice(
                                  isEn
                                    ? `Rescheduled #${bk.bookingCode} to ${rescheduleDate}.`
                                    : `تم تعديل موعد الحجز #${bk.bookingCode} إلى ${rescheduleDate} بنجاح.`
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            >
                              {isEn ? 'Save New Slot' : 'حفظ الموعد الجديد'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleTargetId(null);
                                setRescheduleError(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                            >
                              {isEn ? 'Cancel' : 'إلغاء'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Trip Bookings Rendering (Full Cancel, Reschedule, Driver & Refund Parity) */}
                {matchedCustomerBookings.trip.map((tb) => {
                  const tbCompleted = isTripBookingCompleted(tb);
                  const tbReviewed = reviewedBookingCodeSet.has(
                    tb.bookingCode.trim().toLowerCase()
                  );
                  const canModifyTrip =
                    !tbCompleted &&
                    (tb.status === 'pending_approval' || tb.status === 'confirmed') &&
                    tb.departureDate >= getTodayIso();
                  const targetTrip = trips.find(
                    (t) => t.id === tb.activityId || t.name === tb.tripTitle
                  );
                  const refundPreview = evaluateCancellationRefund({
                    policy: targetTrip?.cancellationPolicy,
                    tripDate: tb.departureDate,
                    slotLabel: tb.departureTime,
                    paidAmountEGP:
                      tb.paymentStatus === 'paid'
                        ? tb.totalPriceEGP
                        : tb.paymentStatus === 'deposit'
                          ? tb.depositAmountEGP ?? Math.round((tb.totalPriceEGP || 0) * 0.3)
                          : 0,
                    paidAmountEUR:
                      tb.paymentStatus === 'paid'
                        ? tb.totalPriceEUR
                        : tb.paymentStatus === 'deposit'
                          ? tb.depositAmountEUR ?? Number(((tb.totalPriceEUR || 0) * 0.3).toFixed(2))
                          : 0
                  });
                  const driverMeta = resolveDriverVehicleForBooking(tb.id, tb.customerName);
                  const linkedRequests = mergedInTripRequests.filter(
                    (r) =>
                      r.linkedBookingId === tb.id ||
                      (r.linkedBookingCode &&
                        r.linkedBookingCode.toLowerCase() === tb.bookingCode.toLowerCase())
                  );
                  const duringAddons = linkedRequests.flatMap((r) => r.items);

                  return (
                    <div
                      key={tb.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5 flex-wrap text-xs">
                            <span className="font-mono font-bold text-cyan-300">
                              #{tb.bookingCode}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-bold text-white">{tb.tripTitle}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-semibold ${
                                tbCompleted
                                  ? 'text-cyan-300'
                                  : tb.status === 'confirmed'
                                    ? 'text-emerald-400'
                                    : tb.status === 'cancelled'
                                      ? 'text-rose-400'
                                      : 'text-amber-300'
                              }`}
                            >
                              {tbCompleted
                                ? isEn
                                  ? 'Completed'
                                  : 'مكتملة (تم التنفيذ)'
                                : tb.status === 'confirmed'
                                  ? isEn
                                    ? 'Confirmed Trip'
                                    : 'رحلة مؤكدة'
                                  : tb.status === 'cancelled'
                                    ? isEn
                                      ? 'Cancelled'
                                      : 'ملغاة'
                                    : isEn
                                      ? 'Pending Confirmation'
                                      : 'قيد التأكيد'}
                            </span>
                            {tb.paymentMethod && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-slate-400">
                                  {tb.paymentMethod === 'online_card'
                                    ? tb.cardLast4
                                      ? `${isEn ? 'Card' : 'بطاقة'} •••• ${tb.cardLast4}`
                                      : isEn
                                        ? 'Online Card'
                                        : 'دفع إلكتروني'
                                    : tb.paymentMethod === 'deposit'
                                      ? isEn
                                        ? `Deposit (${DEFAULT_DEPOSIT_PERCENT}%)`
                                        : `دفع عربون (${DEFAULT_DEPOSIT_PERCENT}%)`
                                      : isEn
                                        ? 'Cash on Pickup'
                                        : 'دفع عند التحرك'}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                            <span className="font-mono tabular-nums">{tb.departureDate}</span>
                            <span>{tb.departureTime}</span>
                            <span>{tb.transportInfo}</span>
                          </div>
                          {tb.paymentMethod === 'deposit' &&
                            ((tb.depositAmountEGP || 0) > 0 || (tb.depositAmountEUR || 0) > 0) && (
                              <div className="text-[11px] text-amber-200/90 font-mono tabular-nums">
                                {isEn ? 'Deposit:' : 'العربون:'}{' '}
                                {tb.customerType === 'egyptian'
                                  ? `${(tb.depositAmountEGP || 0).toLocaleString()} ج.م`
                                  : `€ ${(tb.depositAmountEUR || 0).toFixed(2)}`}{' '}
                                · {isEn ? 'Remaining:' : 'المتبقي:'}{' '}
                                {tb.customerType === 'egyptian'
                                  ? `${(tb.remainingAmountEGP || 0).toLocaleString()} ج.م`
                                  : `€ ${(tb.remainingAmountEUR || 0).toFixed(2)}`}
                              </div>
                            )}
                          {driverMeta && (
                            <div className="text-[11px] text-cyan-300 flex items-center gap-2 flex-wrap">
                              <Car className="w-3.5 h-3.5 shrink-0" />
                              {driverMeta.mission && (
                                <span className="font-semibold">
                                  {isEn
                                    ? DRIVER_MISSION_LABELS_EN[driverMeta.mission.status]
                                    : DRIVER_MISSION_LABELS_AR[driverMeta.mission.status]}
                                </span>
                              )}
                              {driverMeta.mission?.assignedDriverName && (
                                <span>
                                  · {isEn ? 'Driver:' : 'السائق:'}{' '}
                                  {driverMeta.mission.assignedDriverName}
                                </span>
                              )}
                              {driverMeta.vehicle && (
                                <span>
                                  · {LOGISTICS_CATEGORY_LABELS[driverMeta.vehicle.category]} (
                                  {driverMeta.vehicle.plateOrCode})
                                </span>
                              )}
                            </div>
                          )}
                          {duringAddons.length > 0 && (
                            <div className="text-[11px] text-amber-300">
                              {isEn ? 'During-trip add-ons:' : 'إضافات أثناء الرحلة:'}{' '}
                              {duringAddons.map((a) => `${a.title} (×${a.quantity})`).join(' · ')}
                            </div>
                          )}
                          {tb.status === 'cancelled' && (
                            <div className="text-[11px] text-rose-300 space-y-0.5">
                              {tb.rejectionReason && (
                                <div>
                                  {isEn ? 'Reason:' : 'السبب:'} {tb.rejectionReason}
                                </div>
                              )}
                              {renderPaidRefundLabel(
                                tb.refundStatus,
                                tb.refundAmountEGP,
                                tb.refundAmountEUR,
                                tb.customerType
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <div className="text-left font-mono tabular-nums ml-2">
                            <span className="block text-[10px] text-slate-400">
                              {isEn ? 'Total' : 'الإجمالي'}
                            </span>
                            <span className="text-sm font-bold text-emerald-300">
                              {tb.customerType === 'egyptian'
                                ? `${tb.totalPriceEGP.toLocaleString()} ج.م`
                                : `€ ${tb.totalPriceEUR.toFixed(2)}`}
                            </span>
                          </div>

                          {canModifyTrip && onRescheduleTripBooking && (
                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleTargetId(tb.id);
                                setRescheduleDate(tb.departureDate);
                                setRescheduleSlot(tb.departureTime);
                                setRescheduleError(null);
                              }}
                              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold whitespace-nowrap"
                            >
                              {isEn ? 'Reschedule' : 'تعديل الموعد'}
                            </button>
                          )}

                          {canModifyTrip && onCancelTripBooking && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmCancelId(confirmCancelId === tb.id ? null : tb.id)
                              }
                              className="px-3 py-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold whitespace-nowrap"
                            >
                              {isEn ? 'Cancel' : 'إلغاء الرحلة'}
                            </button>
                          )}

                          {tbCompleted ? (
                            tbReviewed ? (
                              <span className="px-3 py-2 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-xs font-semibold whitespace-nowrap">
                                {isEn ? '✓ Reviewed' : '✓ تم التقييم'}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setRevBookingCode(tb.bookingCode);
                                  setRevName(tb.customerName || currentUser?.name || '');
                                  setRevPhone(tb.customerPhone || currentUser?.phone || '');
                                  setActiveTab('reviews');
                                }}
                                className="px-3 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <Star className="w-3.5 h-3.5" />
                                <span>{isEn ? 'Rate Trip' : 'تقييم الرحلة'}</span>
                              </button>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-500 px-2 whitespace-nowrap">
                              {isEn ? 'Rate after completion' : 'التقييم بعد إتمام الرحلة'}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setActiveVoucher({
                                documentKind: 'booking_ticket',
                                code: tb.bookingCode,
                                title: tb.tripTitle,
                                companyName: 'منصة زانوزا للرحلات السياحية',
                                customerName: tb.customerName,
                                customerPhone: tb.customerPhone,
                                customerType: tb.customerType,
                                tripDate: tb.departureDate,
                                tripTime: tb.departureTime,
                                pickupLocation: tb.transportInfo,
                                guestsSummary: `${tb.adultsCount} بالغ · ${tb.childrenCount} طفل · ${tb.infantsCount} رضيع`,
                                statusLabel: tbCompleted
                                  ? 'رحلة مكتملة'
                                  : tb.status === 'confirmed'
                                    ? 'رحلة مؤكدة'
                                    : tb.status === 'cancelled'
                                      ? 'رحلة ملغاة'
                                      : 'قيد المتابعة',
                                basePriceEGP: tb.totalPriceEGP,
                                basePriceEUR: tb.totalPriceEUR,
                                promoCode: tb.promoCode,
                                promoDiscountEGP: tb.promoDiscountEGP,
                                promoDiscountEUR: tb.promoDiscountEUR,
                                checkoutAddons: tb.selectedPaidAddons || [],
                                duringTripAddons: duringAddons,
                                totalEGP: tb.totalPriceEGP,
                                totalEUR: tb.totalPriceEUR,
                                depositAmountEGP: tb.depositAmountEGP,
                                depositAmountEUR: tb.depositAmountEUR,
                                remainingAmountEGP: tb.remainingAmountEGP,
                                remainingAmountEUR: tb.remainingAmountEUR,
                                refundSummary: tb.cancellationPolicySummary,
                                notes: tb.notes
                              })
                            }
                            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Ticket & Invoice' : 'التذكرة والفاتورة'}</span>
                          </button>
                        </div>
                      </div>

                      {confirmCancelId === tb.id && onCancelTripBooking && (
                        <div className="pt-3 border-t border-rose-900/40 bg-rose-950/20 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="font-bold text-rose-200">
                              {isEn
                                ? 'Cancellation Policy Summary:'
                                : 'تفاصيل سياسة الإلغاء والاسترداد:'}
                            </div>
                            <div className="text-slate-300">
                              {tb.paymentStatus === 'pending'
                                ? isEn
                                  ? 'No online payment collected — free cancellation.'
                                  : 'لم يتم تحصيل مبلغ مسبقاً — إلغاء مجاني فوري.'
                                : isEn
                                  ? refundPreview.summaryEn
                                  : refundPreview.summaryAr}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={async () => {
                                await onCancelTripBooking(tb.id, 'إلغاء بواسطة العميل');
                                setConfirmCancelId(null);
                                setBookingActionNotice(
                                  isEn
                                    ? `Trip booking #${tb.bookingCode} cancelled.`
                                    : `تم إلغاء حجز الرحلة #${tb.bookingCode}.`
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold whitespace-nowrap"
                            >
                              {isEn ? 'Confirm Cancel' : 'تأكيد الإلغاء'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCancelId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 whitespace-nowrap"
                            >
                              {isEn ? 'Keep Booking' : 'تراجع'}
                            </button>
                          </div>
                        </div>
                      )}

                      {rescheduleTargetId === tb.id && onRescheduleTripBooking && (
                        <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                          {rescheduleError && (
                            <div className="text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-1.5">
                              {rescheduleError}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-300 font-semibold">
                              {isEn ? 'New Date & Slot:' : 'اختر الموعد الجديد:'}
                            </span>
                            <input
                              type="date"
                              min={getTodayIso()}
                              value={rescheduleDate}
                              onChange={(e) => {
                                setRescheduleDate(e.target.value);
                                setRescheduleError(null);
                              }}
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                            />
                            {targetTrip?.slots && targetTrip.slots.length > 0 ? (
                              <select
                                value={rescheduleSlot}
                                onChange={(e) => {
                                  setRescheduleSlot(e.target.value);
                                  setRescheduleError(null);
                                }}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                              >
                                {targetTrip.slots.map((s) => (
                                  <option key={s.id} value={s.timeLabel}>
                                    {s.timeLabel}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={rescheduleSlot}
                                onChange={(e) => setRescheduleSlot(e.target.value)}
                                placeholder="09:00 ص"
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                              />
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                if (rescheduleDate < getTodayIso()) return;
                                const res = await onRescheduleTripBooking(
                                  tb.id,
                                  rescheduleDate,
                                  rescheduleSlot || tb.departureTime
                                );
                                if (res && !res.ok) {
                                  setRescheduleError(res.error || 'تعذر تعديل الموعد.');
                                  return;
                                }
                                setRescheduleTargetId(null);
                                setBookingActionNotice(
                                  isEn
                                    ? `Trip #${tb.bookingCode} rescheduled.`
                                    : `تم تعديل موعد الرحلة #${tb.bookingCode} بنجاح.`
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            >
                              {isEn ? 'Save New Slot' : 'حفظ الموعد الجديد'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleTargetId(null);
                                setRescheduleError(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                            >
                              {isEn ? 'Cancel' : 'إلغاء'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB: Customer Reviews (Read All Before Booking · Write ONLY After Completion) */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4 self-start">
            {eligibleReviewBookings.length > 0 ? (
              <form
                onSubmit={handleReviewSubmit}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <MessageSquarePlus className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    {isEn ? 'Add Review for Completed Experience' : 'أضف تقييمك لتجربة مكتملة'}
                  </h3>
                </div>

                {revSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{revSuccess}</span>
                  </div>
                )}

                {revError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
                    {revError}
                  </div>
                )}

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    {isEn ? 'Completed Booking *' : 'اختر الحجز المكتمل (التجارب المؤداة فقط) *'}
                  </label>
                  <select
                    value={revBookingCode || eligibleReviewBookings[0]?.bookingCode || ''}
                    onChange={(e) => setRevBookingCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    {eligibleReviewBookings.map((eb) => (
                      <option key={eb.bookingId} value={eb.bookingCode}>
                        #{eb.bookingCode} · {eb.targetTitle} ({eb.tripDate})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      {isEn ? 'Name *' : 'الاسم *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={revName}
                      onChange={(e) => setRevName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      {isEn ? 'Phone' : 'رقم الهاتف المسجل'}
                    </label>
                    <input
                      type="text"
                      value={revPhone}
                      onChange={(e) => setRevPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    {isEn ? 'Star Rating' : 'التقييم بالنجوم'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRevRating(star)}
                        className={`p-2 rounded-lg border transition-colors ${
                          star <= revRating
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    {isEn ? 'Your Comment *' : 'تعليقك عن التجربة *'}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={revComment}
                    onChange={(e) => setRevComment(e.target.value)}
                    placeholder={
                      isEn
                        ? 'Share feedback on organization, crew, and gear...'
                        : 'شاركنا رأيك في التنظيم، الطاقم، والمعدات...'
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {submittingReview
                    ? isEn
                      ? 'Publishing...'
                      : 'جاري التحقق والنشر...'
                    : isEn
                      ? 'Publish Verified Review'
                      : 'نشر التقييم الموثق'}
                </button>
              </form>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    {isEn
                      ? 'Reviews Open After Completion'
                      : 'التقييم متاح بعد تأدية النشاط فقط'}
                  </h3>
                </div>

                {revSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{revSuccess}</span>
                  </div>
                )}

                <p className="text-xs text-slate-400 leading-relaxed">
                  {isEn
                    ? 'To protect authenticity, reviews can only be submitted after your activity or trip has been completed and confirmed.'
                    : 'لضمان مصداقية الآراء، لا يُسمح بإرسال تقييم قبل استكمال النشاط أو الرحلة وتأكيد تأديتها من قِبل الشركة أو الطاقم. يمكنك تصفح تقييمات العملاء السابقين في القائمة المقابلة أو داخل صفحة كل نشاط قبل الحجز.'}
                </p>

                {viewerCompletedBookings.length > 0 && (
                  <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 text-xs text-emerald-300">
                    {isEn
                      ? 'You have reviewed all of your completed bookings.'
                      : 'تم إرسال تقييمك لجميع حجوزاتك المكتملة حالياً.'}
                  </div>
                )}

                <form
                  onSubmit={handleVerifyReviewBooking}
                  className="pt-3 border-t border-slate-800 space-y-2.5"
                >
                  <div className="text-[11px] font-semibold text-slate-300">
                    {isEn
                      ? 'Completed a trip already? Verify phone + code to unlock:'
                      : 'هل أتممت نشاطاً أو رحلة مسبقاً؟ تحقق برقم الهاتف وكود الحجز لفتح التقييم:'}
                  </div>
                  <input
                    type="text"
                    value={revVerifyPhone}
                    onChange={(e) => setRevVerifyPhone(e.target.value)}
                    placeholder={isEn ? 'Registered phone' : 'رقم الهاتف المسجّل بالحجز'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                  <input
                    type="text"
                    value={revVerifyCode}
                    onChange={(e) => setRevVerifyCode(e.target.value)}
                    placeholder={isEn ? 'Ticket code (TR-5107 or ZN-...)' : 'كود التذكرة (مثل TR-5107 أو ZN-...)'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                  {revVerifyNotice && (
                    <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-700/40 text-[11px] text-amber-300">
                      {revVerifyNotice}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold"
                  >
                    {isEn ? 'Verify Completion' : 'التحقق من استكمال الحجز'}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                {isEn
                  ? 'Verified Guest Reviews (Visible before booking)'
                  : 'آراء وتقييمات العملاء السابقين (متاحة للمعاينة قبل الحجز)'}
              </span>
              <span className="font-mono tabular-nums">
                {reviews.length} {isEn ? 'reviews' : 'تقييم'}
              </span>
            </div>
            {reviews.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-400">
                {isEn ? 'No reviews yet.' : 'لا توجد تقييمات مضافة بعد.'}
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{rev.customerName}</span>
                        {rev.verifiedBookingCode && (
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            · {isEn ? 'Verified guest' : 'تجربة منفّذة وموثقة'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-cyan-400">{rev.targetTitle}</div>
                    </div>
                    <div className="text-xs font-mono text-amber-300 tabular-nums">
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(5 - rev.rating)} ·{' '}
                      <span className="text-slate-500">{rev.createdAt}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: Customer Account, Cancellation Policies & Help */}
      {activeTab === 'account' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-11 h-11 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-sm">
                {currentUser?.avatarInitials || 'ع'}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {currentUser?.name || (isEn ? 'Guest' : 'ضيف المتجر')}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentUser?.tier || (isEn ? 'Customer Account' : 'حساب عميل / سائح')}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800/70">
                <span className="text-slate-400">
                  {isEn ? 'Registered Nationality:' : 'الجنسية المسجّلة:'}
                </span>
                <span className="text-white font-semibold">
                  {getNationalityDisplayLabel(currentUser?.nationality, lang)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/70">
                <span className="text-slate-400">
                  {isEn ? 'Automatic Pricing Tier:' : 'شريحة التسعير التلقائية:'}
                </span>
                <span className="text-emerald-300 font-semibold">
                  {pricingAudience === 'egyptian'
                    ? isEn
                      ? 'Egyptian Rate Only (EGP)'
                      : 'السعر المصري فقط (جنيه مصري)'
                    : isEn
                      ? 'Foreigner Rate Only (€ EUR)'
                      : 'السعر الأجنبي فقط (يورو €)'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/70">
                <span className="text-slate-400">
                  {isEn ? 'Account Scope:' : 'نطاق الحساب:'}
                </span>
                <span className="text-cyan-300 font-semibold">
                  {customerScope === 'company'
                    ? `${isEn ? 'Company Client' : 'عميل شركة'} (${currentUser?.registeredCompanyName || ''})`
                    : isEn
                      ? 'Platform Client (All companies)'
                      : 'عميل منصة (جميع الشركات حسب قنوات النشر)'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/70">
                <span className="text-slate-400">{isEn ? 'Phone:' : 'رقم الهاتف:'}</span>
                <span className="text-white font-mono tabular-nums">
                  {currentUser?.phone || (isEn ? 'Not set' : 'غير مسجل')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/70">
                <span className="text-slate-400">{isEn ? 'Favorites:' : 'المفضلات المحفوظة:'}</span>
                <span className="text-rose-300 font-mono font-bold tabular-nums">
                  {favoriteIds.length}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">
                  {isEn ? 'My Bookings:' : 'حجوزاتي المسجلة:'}
                </span>
                <span className="text-cyan-300 font-mono font-bold tabular-nums">
                  {matchedCustomerBookings.act.length + matchedCustomerBookings.trip.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 text-xs">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {isEn
                    ? 'Cancellation Policies & Refund Tiers'
                    : 'سياسات الإلغاء، الاسترداد المالي، والخصوصية'}
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-slate-950 border border-emerald-800/40 rounded-xl p-3">
                  <div className="font-bold text-emerald-300">
                    {isEn ? '24h+ Before Trip' : 'قبل 24 ساعة فأكثر'}
                  </div>
                  <div className="text-slate-300 mt-1">
                    {isEn ? '100% Full Refund' : 'استرداد كامل بنسبة 100%'}
                  </div>
                </div>
                <div className="bg-slate-950 border border-amber-800/40 rounded-xl p-3">
                  <div className="font-bold text-amber-300">
                    {isEn ? '12h – 24h Before' : 'قبل 12 إلى 24 ساعة'}
                  </div>
                  <div className="text-slate-300 mt-1">
                    {isEn ? '50% Partial Refund' : 'استرداد جزئي بنسبة 50%'}
                  </div>
                </div>
                <div className="bg-slate-950 border border-rose-800/40 rounded-xl p-3">
                  <div className="font-bold text-rose-300">
                    {isEn ? 'Under 12h' : 'أقل من 12 ساعة'}
                  </div>
                  <div className="text-slate-300 mt-1">
                    {isEn ? 'Non-refundable' : 'غير قابل للاسترداد'}
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-slate-300 leading-relaxed list-disc pr-4">
                <li>
                  <strong>{isEn ? 'Instant Reschedule:' : 'تعديل مرن:'}</strong>{' '}
                  {isEn
                    ? 'Reschedule confirmed or pending bookings from "My Bookings" subject to operating days and seat availability.'
                    : 'يمكنك تعديل موعد حجزك أو إلغاؤه مباشرة من تبويب «حجوزاتي وتذاكري» مع معاينة الاسترداد قبل التأكيد.'}
                </li>
                <li>
                  <strong>{isEn ? 'Strict Privacy:' : 'خصوصية التذاكر:'}</strong>{' '}
                  {isEn
                    ? 'Card details are never stored; only verified phone + code holders can view guest tickets.'
                    : 'لا تُخزّن بيانات البطاقة الكاملة أبداً، وتُحمى التذاكر بمطابقة الهاتف وكود الحجز معاً.'}
                </li>
              </ul>
            </div>

            {/* Direct Customer Support Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!supportSubject.trim() || !supportMessage.trim()) return;
                setSupportSubject('');
                setSupportMessage('');
                setSupportSentNotice(
                  isEn
                    ? 'Your inquiry has been logged! Our 7-day support team will reply via WhatsApp shortly.'
                    : 'تم تسجيل رسالتك بنجاح! سيتواصل معك فريق دعم العملاء عبر الواتساب خلال دقائق.'
                );
                setTimeout(() => setSupportSentNotice(null), 5000);
              }}
              className="pt-4 border-t border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>{isEn ? 'Need Help? Contact Support' : 'تواصل مع خدمة العملاء (7 أيام)'}</span>
                </span>
                <span className="font-mono text-[11px] text-cyan-300">+20 100 000 0000</span>
              </div>

              {supportSentNotice && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
                  {supportSentNotice}
                </div>
              )}

              <input
                type="text"
                required
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                placeholder={
                  isEn ? 'Subject or booking code (optional)' : 'الموضوع أو رقم الحجز (مثال: ZN-...)'
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              <textarea
                rows={2}
                required
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder={isEn ? 'How can we help?' : 'كيف يمكننا مساعدتك في حجزك أو رحلتك؟'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isEn ? 'Send Support Request' : 'إرسال طلب الدعم'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rich Experience PDP & Direct Booking Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs text-cyan-400">
                  {selectedItem.location?.city} · {selectedItem.duration?.hours || 3}{' '}
                  {isEn ? 'hours' : 'ساعات'} ·{' '}
                  {selectedItem.cancellationPolicy?.name ||
                    (isEn ? 'Free cancellation up to 24h' : 'إلغاء مجاني حتى 24 ساعة')}
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  {isEn && selectedItem.translations?.en?.name
                    ? selectedItem.translations.en.name
                    : selectedItem.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(selectedItem.id)}
                    className={`p-2 rounded-lg border transition-colors ${
                      favoriteIds.includes(selectedItem.id)
                        ? 'bg-rose-600/20 border-rose-500/40 text-rose-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-400'
                    }`}
                    title={isEn ? 'Save to Favorites' : 'حفظ في المفضلة'}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favoriteIds.includes(selectedItem.id) ? 'fill-current' : ''
                      }`}
                    />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCardHolder('');
                    setCardNumber('');
                    setCardExpiry('');
                    setCardCvv('');
                    setSelectedItem(null);
                  }}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 6 cols: Gallery, Itinerary, Safety, Equipment, Reviews */}
              <div className="lg:col-span-6 space-y-4">
                {selectedMediaList.length > 0 && (
                  <div className="space-y-2">
                    <div className="aspect-[16/9] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                      {activeMedia?.type === 'image' &&
                      activeMedia.url &&
                      !brokenImageIds[`modal-${activeMedia.id}`] ? (
                        <img
                          src={activeMedia.url}
                          alt={selectedItem.name}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenImageIds((prev) => ({
                              ...prev,
                              [`modal-${activeMedia.id}`]: true
                            }))
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                          {activeMedia?.title || selectedItem.name}
                        </div>
                      )}
                    </div>
                    {selectedMediaList.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {selectedMediaList.map((m, idx) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setActiveMediaIndex(idx)}
                            className={`w-16 h-11 rounded-lg overflow-hidden border shrink-0 transition-all ${
                              idx === activeMediaIndex
                                ? 'border-cyan-400 ring-1 ring-cyan-400'
                                : 'border-slate-800 opacity-70 hover:opacity-100'
                            }`}
                          >
                            {m.url ? (
                              <img
                                src={m.url}
                                alt={m.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-950" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-300 leading-relaxed">
                  {isEn && selectedItem.translations?.en?.description
                    ? selectedItem.translations.en.description
                    : selectedItem.description}
                </p>

                {selectedItem.location?.itinerary &&
                  selectedItem.location.itinerary.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isEn ? 'Itinerary & Stops' : 'مسار الرحلة والمحطات'}</span>
                      </h4>
                      <div className="space-y-1.5">
                        {selectedItem.location.itinerary.map((wp) => (
                          <div
                            key={wp.id}
                            className="text-xs text-slate-300 flex items-center justify-between"
                          >
                            <span>• {wp.name}</span>
                            {wp.durationMinutes && (
                              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                                {wp.durationMinutes} {isEn ? 'min' : 'د'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Inclusions, Safety & Equipment */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="font-bold text-emerald-300">
                    {isEn ? 'Inclusions & Safety:' : 'يشمل السعر وشروط السلامة:'}
                  </div>
                  <div className="text-slate-300">
                    {[
                      ...(selectedItem.inclusions?.meals || []),
                      ...(selectedItem.inclusions?.drinks || []),
                      ...(selectedItem.inclusions?.equipmentProvided || [])
                    ].join(' · ') || (isEn ? 'Full program & core gear' : 'البرنامج الكامل والمعدات الأساسية')}
                  </div>

                  {selectedItem.safetyRules && (
                    <div className="text-[11px] text-slate-400 space-y-1 border-t border-slate-800 pt-2">
                      <div>
                        {isEn ? 'Min Age:' : 'الحد الأدنى للعمر:'}{' '}
                        <strong className="text-slate-200 tabular-nums">
                          {selectedItem.safetyRules.minAge || 4}+ {isEn ? 'yrs' : 'سنوات'}
                        </strong>
                        {selectedItem.safetyRules.hasGuideSupervisor &&
                          (isEn ? ' · Certified guide included' : ' · مرافقة مرشد ومشرف سلامة')}
                      </div>
                      {selectedItem.safetyRules.attireGearNotes && (
                        <div>
                          {isEn ? 'Notes:' : 'ملاحظات التجهيز:'}{' '}
                          {selectedItem.safetyRules.attireGearNotes}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedItemEquipments.length > 0 && (
                    <div className="text-[11px] text-cyan-300 border-t border-slate-800 pt-2 flex items-center gap-1.5 flex-wrap">
                      <Wrench className="w-3.5 h-3.5 shrink-0" />
                      <span>{isEn ? 'Assigned Gear:' : 'المعدات المخصصة:'}</span>
                      <span className="text-slate-200">
                        {selectedItemEquipments.map((eq) => eq.name).join(' · ')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-cyan-300 pt-1">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      {selectedItem.cancellationPolicy?.name ||
                        (isEn ? 'Flexible cancellation policy' : 'سياسة إلغاء مرنة')}
                    </span>
                  </div>
                </div>

                {/* Embedded Activity Reviews */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span>
                        {isEn ? 'Customer Reviews' : 'آراء العملاء عن هذه التجربة'} (
                        {selectedItemReviews.length})
                      </span>
                    </h4>
                    {(() => {
                      const eligibleForThis = eligibleReviewBookings.find(
                        (b) => b.targetId === selectedItem.id
                      );
                      const reviewedForThis = viewerCompletedBookings.some(
                        (b) => b.targetId === selectedItem.id && b.alreadyReviewed
                      );
                      if (eligibleForThis) {
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setRevBookingCode(eligibleForThis.bookingCode);
                              setSelectedItem(null);
                              setActiveTab('reviews');
                            }}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
                          >
                            {isEn ? 'Write review (completed)' : 'أضف تقييمك (حجزك مكتمل)'}
                          </button>
                        );
                      }
                      if (reviewedForThis) {
                        return (
                          <span className="text-[11px] text-emerald-400 font-semibold">
                            {isEn ? '✓ Reviewed' : '✓ قيّمت هذه التجربة'}
                          </span>
                        );
                      }
                      return (
                        <span className="text-[11px] text-slate-500">
                          {isEn ? 'Review after completion' : 'التقييم متاح بعد إتمام التجربة'}
                        </span>
                      );
                    })()}
                  </div>
                  {selectedItemReviews.length === 0 ? (
                    <div className="text-slate-500 text-[11px]">
                      {isEn
                        ? 'No reviews yet for this experience.'
                        : 'لا توجد تقييمات مسجلة لهذه التجربة بعد.'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {selectedItemReviews.slice(0, 4).map((rv) => (
                        <div key={rv.id} className="border-t border-slate-800/80 pt-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-200">{rv.customerName}</span>
                            <span className="text-amber-300 font-mono">
                              {'★'.repeat(rv.rating)}
                            </span>
                          </div>
                          <p className="text-slate-400 mt-0.5">{rv.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right 6 cols: Direct Booking Form with Real Validations */}
              <form
                onSubmit={handleConfirmCustomerBooking}
                className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4 self-start"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white">
                    {isEn ? 'Reserve Your Spot' : 'احجز مقعدك الآن'}
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-mono tabular-nums">
                    {isEn ? `Available on ${tripDate}:` : `متاح بتاريخ ${tripDate}:`}{' '}
                    {slotAvailability.remainingSeats} {isEn ? 'seats' : 'مقعد'}
                  </span>
                </div>

                {/* Inline quick nationality setter inside modal if customer hasn't configured nationality yet */}
                {isCustomerAccount && !isNationalityConfigured && onCompleteCustomerProfile && (
                  <div className="bg-cyan-950/30 border border-cyan-500/40 rounded-lg p-3 space-y-2 text-xs">
                    <div className="font-bold text-cyan-200 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>
                        {isEn
                          ? 'Set nationality once to apply pricing:'
                          : 'حدد جنسيتك لتطبيق السعر المناسب فوراً:'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={onboardNationality}
                        onChange={(e) => setOnboardNationality(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        {CUSTOMER_NATIONALITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {isEn ? opt.labelEn : opt.labelAr}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          onCompleteCustomerProfile({
                            name: customerName || currentUser?.name || 'عميل زانوزا',
                            phone: customerPhone || currentUser?.phone || '+201000000000',
                            nationality:
                              onboardNationality === 'أخرى'
                                ? onboardCustomNationality.trim() || 'أجنبي'
                                : onboardNationality,
                            customerScope: onboardScope,
                            registrationSource:
                              onboardScope === 'company' ? 'company_page' : 'platform_signup'
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold whitespace-nowrap"
                      >
                        {isEn ? 'Apply' : 'اعتماد'}
                      </button>
                    </div>
                  </div>
                )}

                {slotAvailability.operatingDayWarning && (
                  <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-2.5 text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{slotAvailability.operatingDayWarning}</span>
                  </div>
                )}

                {slotAvailability.maintenanceWarning && (
                  <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-2.5 text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{slotAvailability.maintenanceWarning}</span>
                  </div>
                )}

                {slotAvailability.equipmentConflictWarning && (
                  <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-2.5 text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{slotAvailability.equipmentConflictWarning}</span>
                  </div>
                )}

                {bookingError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 text-xs text-rose-300">
                    {bookingError}
                  </div>
                )}

                {/* Booking Mode Switcher when BOTH Per-Person & Private Group exist */}
                {hasPerPersonMode && hasPrivateMode && (
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setBookingMode('per_person')}
                      className={`py-1.5 rounded-md font-bold transition-colors ${
                        bookingMode === 'per_person'
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {isEn ? 'Per Person' : 'حجز بالفرد'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingMode('private_group')}
                      className={`py-1.5 rounded-md font-bold transition-colors ${
                        bookingMode === 'private_group'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {isEn ? 'Private Charter / Group' : 'حجز خاص للمجموعة بالكامل'}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {isEn ? 'Date' : 'تاريخ الرحلة'}
                    </label>
                    <div className="relative">
                      <Calendar
                        className={`w-3.5 h-3.5 text-slate-500 absolute ${
                          isEn ? 'left-2.5' : 'right-2.5'
                        } top-2.5 pointer-events-none`}
                      />
                      <input
                        type="date"
                        min={getTodayIso()}
                        value={tripDate}
                        onChange={(e) => setTripDate(e.target.value)}
                        className={`w-full bg-slate-900 border border-slate-700 rounded-lg ${
                          isEn ? 'pl-8 pr-2' : 'pr-8 pl-2'
                        } py-1.5 text-xs text-white font-mono`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {isEn ? 'Available Slot' : 'الموعد المتاح'}
                    </label>
                    <div className="relative">
                      <Clock
                        className={`w-3.5 h-3.5 text-slate-500 absolute ${
                          isEn ? 'left-2.5' : 'right-2.5'
                        } top-2.5 pointer-events-none`}
                      />
                      <select
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        className={`w-full bg-slate-900 border border-slate-700 rounded-lg ${
                          isEn ? 'pl-8 pr-2' : 'pr-8 pl-2'
                        } py-1.5 text-xs text-white`}
                      >
                        {(selectedItem.slots?.length
                          ? selectedItem.slots
                          : [{ id: 's1', timeLabel: '09:00 ص', availableCount: 10, maxCapacity: 10, bookedCount: 0, operatingDays: [] }]
                        ).map((s) => {
                          const sStats = computeRemainingSeatsForItem(
                            selectedItem,
                            tripDate,
                            s,
                            s.timeLabel
                          );
                          return (
                            <option key={s.id} value={s.timeLabel}>
                              {s.timeLabel} ·{' '}
                              {sStats.blocked
                                ? isEn
                                  ? 'Maintenance'
                                  : 'صيانة'
                                : !sStats.opOk
                                  ? isEn
                                    ? 'Closed day'
                                    : 'غير متاح بهذا اليوم'
                                  : `${sStats.remaining} ${isEn ? 'left' : 'متاح'}`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Automatic Locked Pricing Tier by Registered Nationality */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      {isEn ? 'Auto Pricing' : 'التسعير التلقائي'} (
                      {isCustomerAccount
                        ? getNationalityDisplayLabel(registeredNationality || 'مصر', lang)
                        : isEn
                          ? 'Preview'
                          : 'وضع المعاينة'}
                      ):
                    </span>
                  </div>
                  <span className="font-bold text-emerald-300">
                    {pricingAudience === 'egyptian'
                      ? isEn
                        ? 'Egyptian Rate (EGP)'
                        : 'السعر المصري فقط (EGP)'
                      : isEn
                        ? 'Foreigner Rate (€ EUR)'
                        : 'السعر الأجنبي فقط (€ EUR)'}
                  </span>
                </div>

                {/* Guests Counters with Hard Capacity Ceiling */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: isEn ? 'Adults' : 'بالغين',
                      val: adults,
                      set: setAdults,
                      min: Math.max(1, bookingMode === 'private_group' ? 1 : selectedItem.minPax || 1),
                      canInc:
                        bookingMode === 'private_group'
                          ? totalPayingGuests < 20
                          : totalPayingGuests < slotAvailability.remainingSeats
                    },
                    {
                      label: isEn ? 'Children' : 'أطفال',
                      val: childrenCount,
                      set: setChildrenCount,
                      min: 0,
                      canInc:
                        bookingMode === 'private_group'
                          ? totalPayingGuests < 20
                          : totalPayingGuests < slotAvailability.remainingSeats
                    },
                    {
                      label: isEn ? 'Infants' : 'رضّع',
                      val: infantsCount,
                      set: setInfantsCount,
                      min: 0,
                      canInc: infantsCount < 4
                    }
                  ].map((g) => (
                    <div
                      key={g.label}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center"
                    >
                      <span className="block text-[10px] text-slate-400 mb-1">{g.label}</span>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => g.set(Math.max(g.min, g.val - 1))}
                          className="p-1 bg-slate-800 rounded text-slate-300 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold text-white tabular-nums">
                          {g.val}
                        </span>
                        <button
                          type="button"
                          disabled={!g.canInc}
                          onClick={() => g.set(g.val + 1)}
                          className="p-1 bg-slate-800 rounded text-slate-300 hover:text-white disabled:opacity-35"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paid Optional Add-ons */}
                {selectedItem.inclusions?.paidAddons &&
                  selectedItem.inclusions.paidAddons.length > 0 && (
                    <div className="space-y-2 border-t border-slate-800 pt-3">
                      <span className="block text-xs font-bold text-amber-300">
                        {isEn ? 'Optional Paid Add-ons' : 'إضافات اختيارية مدفوعة (بالعدد)'}
                      </span>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {selectedItem.inclusions.paidAddons.map((ad) => {
                          const q = addonQuantities[ad.id] || 0;
                          const unitPrice = effectiveCurrency === 'EGP' ? ad.priceEGP : ad.priceEUR;
                          return (
                            <div
                              key={ad.id}
                              className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="text-white font-medium truncate">{ad.title}</div>
                                <div className="text-[10px] font-mono text-emerald-300 tabular-nums">
                                  {effectiveCurrency === 'EGP'
                                    ? `${unitPrice.toLocaleString()} ج.م`
                                    : `€ ${unitPrice}`}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAddonQuantities((prev) => ({
                                      ...prev,
                                      [ad.id]: Math.max(0, q - 1)
                                    }))
                                  }
                                  className="p-1 bg-slate-800 rounded text-slate-300"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-5 text-center font-mono text-white font-bold tabular-nums">
                                  {q}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAddonQuantities((prev) => ({
                                      ...prev,
                                      [ad.id]: q + 1
                                    }))
                                  }
                                  className="p-1 bg-slate-800 rounded text-slate-300"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Promo Code Input */}
                <div className="space-y-1.5 border-t border-slate-800 pt-3">
                  <label className="block text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {isEn ? 'Have a Promo Code?' : 'هل لديك كود خصم؟ (مثل ZANOZA10 أو REDSEA15)'}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      placeholder="ZANOZA10"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono uppercase"
                    />
                    <button
                      type="button"
                      disabled={validatingPromo}
                      onClick={handleApplyPromoCode}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold whitespace-nowrap"
                    >
                      {validatingPromo
                        ? isEn
                          ? '...'
                          : '...'
                        : isEn
                          ? 'Apply'
                          : 'تطبيق'}
                    </button>
                  </div>
                  {promoFeedback && (
                    <div
                      className={`text-[11px] ${
                        promoFeedback.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {promoFeedback.text}
                    </div>
                  )}
                </div>

                {/* Pickup */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresPickup}
                      onChange={(e) => setRequiresPickup(e.target.checked)}
                      className="rounded border-slate-700"
                    />
                    <Car className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {isEn
                        ? 'Include Hotel Pickup / Meeting Transfer'
                        : 'أحتاج توصيل من الفندق / نقطة الالتقاء'}
                    </span>
                  </label>
                  {requiresPickup && (
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder={
                        isEn ? 'Hotel name or exact address' : 'اسم الفندق أو العنوان بالتفصيل'
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  )}
                </div>

                {/* Payment Method Selector + Card Form + Deposit Breakdown */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <label className="block text-[11px] text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isEn ? 'Payment Method' : 'اختر طريقة الدفع'}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    {[
                      { id: 'online_card' as const, label: isEn ? 'Online Card' : 'دفع بالبطاقة' },
                      {
                        id: 'cash_on_pickup' as const,
                        label: isEn ? 'Cash at Pickup' : 'نقداً عند التحرك'
                      },
                      {
                        id: 'deposit' as const,
                        label: isEn
                          ? `Deposit (${DEFAULT_DEPOSIT_PERCENT}%)`
                          : `عربون (${DEFAULT_DEPOSIT_PERCENT}%)`
                      }
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`py-2 px-2 rounded-lg border font-semibold transition-colors ${
                          paymentMethod === pm.id
                            ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'online_card' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-emerald-300">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>
                            {isEn
                              ? 'Encrypted checkout · card number never stored'
                              : 'دفع آمن — لا يتم حفظ رقم البطاقة أو رمز الأمان'}
                          </span>
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder={isEn ? 'Cardholder Name' : 'اسم حامل البطاقة كما بالبطاقة'}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                        placeholder="4532 •••• •••• ••••"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                          placeholder="MM/YY"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                        />
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          required
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="CVV"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'deposit' && (
                    <div className="bg-amber-950/30 border border-amber-700/40 rounded-lg px-3 py-2 text-[11px] text-amber-200 flex items-center justify-between gap-2">
                      <span>
                        {isEn
                          ? `${DEFAULT_DEPOSIT_PERCENT}% Deposit now:`
                          : `عربون تأكيد الحجز الآن (${DEFAULT_DEPOSIT_PERCENT}%):`}
                      </span>
                      <span className="font-mono font-bold tabular-nums">
                        {effectiveCurrency === 'EGP'
                          ? `${checkoutPricing.depositAmount.toLocaleString()} ج.م`
                          : `€ ${checkoutPricing.depositAmount.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-slate-800 pt-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {isEn ? 'Full Name *' : 'الاسم الكامل *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {isEn ? 'Phone / WhatsApp *' : 'رقم الهاتف / الواتساب *'}
                    </label>
                    <div className="relative">
                      <Phone
                        className={`w-3.5 h-3.5 text-slate-500 absolute ${
                          isEn ? 'left-2.5' : 'right-2.5'
                        } top-2 pointer-events-none`}
                      />
                      <input
                        type="text"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+20 10..."
                        className={`w-full bg-slate-900 border border-slate-700 rounded-lg ${
                          isEn ? 'pl-8 pr-2' : 'pr-8 pl-2'
                        } py-1.5 text-xs text-white font-mono`}
                      />
                    </div>
                  </div>
                </div>

                {/* Final Breakdown & Submit */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>
                      {bookingMode === 'private_group'
                        ? isEn
                          ? `Private Charter (${totalPayingGuests} guests):`
                          : `سعر المجموعة الخاصة (${totalPayingGuests} أفراد):`
                        : isEn
                          ? `Tickets (${adults + childrenCount + infantsCount} guests):`
                          : `التذاكر (${adults + childrenCount + infantsCount} أفراد):`}
                    </span>
                    <span className="font-mono tabular-nums text-white">
                      {effectiveCurrency === 'EGP'
                        ? `${checkoutPricing.rawBase.toLocaleString()} ج.م`
                        : `€ ${checkoutPricing.rawBase.toFixed(2)}`}
                    </span>
                  </div>
                  {checkoutPricing.discountSaved > 0 && checkoutPricing.activeDiscount && (
                    <div className="flex justify-between text-emerald-400">
                      <span>
                        {isEn ? 'Offer' : 'خصم'} ({checkoutPricing.activeDiscount.title}):
                      </span>
                      <span className="font-mono tabular-nums">
                        -{' '}
                        {effectiveCurrency === 'EGP'
                          ? `${checkoutPricing.discountSaved.toLocaleString()} ج.م`
                          : `€ ${checkoutPricing.discountSaved.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  {checkoutPricing.promoSaved > 0 && checkoutPricing.appliedPromo && (
                    <div className="flex justify-between text-emerald-300">
                      <span>
                        {isEn ? 'Promo Code' : 'كود الخصم'} ({checkoutPricing.appliedPromo.code}):
                      </span>
                      <span className="font-mono tabular-nums">
                        -{' '}
                        {effectiveCurrency === 'EGP'
                          ? `${checkoutPricing.promoSaved.toLocaleString()} ج.م`
                          : `€ ${checkoutPricing.promoSaved.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  {checkoutPricing.addonsTotal > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>{isEn ? 'Selected Add-ons:' : 'الإضافات المختارة:'}</span>
                      <span className="font-mono tabular-nums text-amber-300">
                        {effectiveCurrency === 'EGP'
                          ? `${checkoutPricing.addonsTotal.toLocaleString()} ج.م`
                          : `€ ${checkoutPricing.addonsTotal.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  {(checkoutPricing.fee > 0 || checkoutPricing.tax > 0) && (
                    <div className="flex justify-between text-slate-400">
                      <span>{isEn ? 'Service Fees & Taxes:' : 'رسوم الخدمة والضرائب:'}</span>
                      <span className="font-mono tabular-nums text-slate-200">
                        {effectiveCurrency === 'EGP'
                          ? `${(checkoutPricing.fee + checkoutPricing.tax).toLocaleString()} ج.م`
                          : `€ ${(checkoutPricing.fee + checkoutPricing.tax).toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-slate-800">
                    <span className="text-white">
                      {isEn ? 'Total All-Inclusive:' : 'الإجمالي الشامل:'}
                    </span>
                    <span className="font-mono tabular-nums text-emerald-300">
                      {effectiveCurrency === 'EGP'
                        ? `${checkoutPricing.total.toLocaleString()} ج.م`
                        : `€ ${checkoutPricing.total.toFixed(2)}`}
                    </span>
                  </div>
                  {paymentMethod === 'deposit' && (
                    <div className="flex justify-between text-[11px] text-amber-300 pt-1">
                      <span>{isEn ? 'Remaining due on trip day:' : 'المتبقي عند تنفيذ الرحلة:'}</span>
                      <span className="font-mono tabular-nums">
                        {effectiveCurrency === 'EGP'
                          ? `${checkoutPricing.remainingAmount.toLocaleString()} ج.م`
                          : `€ ${checkoutPricing.remainingAmount.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    submittingBooking ||
                    slotAvailability.remainingSeats <= 0 ||
                    Boolean(slotAvailability.maintenanceWarning) ||
                    Boolean(slotAvailability.operatingDayWarning) ||
                    Boolean(slotAvailability.equipmentConflictWarning)
                  }
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Users className="w-4 h-4" />
                  <span>
                    {submittingBooking
                      ? isEn
                        ? 'Submitting...'
                        : 'جاري تسجيل الحجز...'
                      : slotAvailability.remainingSeats <= 0
                        ? isEn
                          ? 'Slot Unavailable'
                          : 'الموعد غير متاح أو مكتمل'
                        : isEn
                          ? 'Confirm Booking & Issue Ticket'
                          : 'تأكيد الحجز وإصدار التذكرة'}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Printable / Shareable Ticket Voucher Modal */}
      <InvoiceVoucherModal voucher={activeVoucher} onClose={() => setActiveVoucher(null)} />
    </div>
  );
};
