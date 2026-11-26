import type {
  Activity,
  CancellationPolicy,
  PriceTier,
  SeasonalDiscount,
  TimeSlotCapacity
} from '../types/activity';
import type { ResourceMaintenanceBlock, SelectedPaidAddonItem } from '../types/finance';
import type { TripRecord } from '../types/trip';

export interface PromoCodeDefinition {
  code: string;
  titleAr: string;
  titleEn: string;
  discountType: 'percentage' | 'fixed_amount';
  valueEGP: number;
  valueEUR: number;
  minGuests?: number;
  startDate: string;
  endDate: string;
  appliesToEgyptian: boolean;
  appliesToForeigner: boolean;
}

export const PROMO_CODE_CATALOG: PromoCodeDefinition[] = [
  {
    code: 'ZANOZA10',
    titleAr: 'كود ترحيبي - خصم 10%',
    titleEn: 'Welcome Code - 10% Off',
    discountType: 'percentage',
    valueEGP: 10,
    valueEUR: 10,
    minGuests: 1,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    appliesToEgyptian: true,
    appliesToForeigner: true
  },
  {
    code: 'REDSEA15',
    titleAr: 'عرض البحر الأحمر - خصم 15% (فردين فأكثر)',
    titleEn: 'Red Sea 15% Off (2+ Guests)',
    discountType: 'percentage',
    valueEGP: 15,
    valueEUR: 15,
    minGuests: 2,
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    appliesToEgyptian: true,
    appliesToForeigner: true
  },
  {
    code: 'VIP20',
    titleAr: 'خصم الحجز الخاص والمجموعات 20%',
    titleEn: 'Private & Group 20% Off',
    discountType: 'percentage',
    valueEGP: 20,
    valueEUR: 20,
    minGuests: 3,
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    appliesToEgyptian: true,
    appliesToForeigner: true
  }
];

export const DEFAULT_DEPOSIT_PERCENT = 30;

export function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getApplicableSeasonalDiscounts(
  discounts: SeasonalDiscount[] | undefined,
  dateIso: string,
  audience: 'egyptian' | 'foreigner'
): SeasonalDiscount[] {
  if (!discounts || discounts.length === 0) return [];
  return discounts.filter((d) => {
    const audienceOk =
      audience === 'egyptian' ? Boolean(d.appliesToEgyptian) : Boolean(d.appliesToForeigner);
    if (!audienceOk) return false;
    const val = audience === 'egyptian' ? Number(d.valueEGP || 0) : Number(d.valueEUR || 0);
    if (val <= 0) return false;
    if (d.startDate && dateIso < d.startDate) return false;
    if (d.endDate && dateIso > d.endDate) return false;
    return true;
  });
}

export function findActiveSeasonalDiscount(
  discounts: SeasonalDiscount[] | undefined,
  dateIso: string,
  audience: 'egyptian' | 'foreigner'
): SeasonalDiscount | null {
  const list = getApplicableSeasonalDiscounts(discounts, dateIso, audience);
  return list[0] || null;
}

export function hasActiveOfferForCustomer(
  item: Pick<Activity | TripRecord, 'seasonalDiscounts'>,
  dateIso: string,
  audience: 'egyptian' | 'foreigner'
): boolean {
  return getApplicableSeasonalDiscounts(item.seasonalDiscounts, dateIso, audience).length > 0;
}

export function applySeasonalDiscountAmount(
  rawAmount: number,
  discount: Pick<SeasonalDiscount, 'discountType' | 'valueEGP' | 'valueEUR'> | null | undefined,
  currency: 'EGP' | 'EUR'
): number {
  if (!discount || rawAmount <= 0) return rawAmount;
  const val = currency === 'EGP' ? Number(discount.valueEGP || 0) : Number(discount.valueEUR || 0);
  if (val <= 0) return rawAmount;
  if (discount.discountType === 'percentage') {
    const pct = Math.min(90, Math.max(0, val));
    return Math.max(0, Math.round(rawAmount * (1 - pct / 100)));
  }
  return Math.max(0, Number((rawAmount - val).toFixed(2)));
}

export function validatePromoCodeForBooking(params: {
  code?: string;
  dateIso: string;
  audience: 'egyptian' | 'foreigner';
  payingGuests: number;
}): { valid: boolean; promo?: PromoCodeDefinition; errorAr?: string; errorEn?: string } {
  const clean = (params.code || '').trim().toUpperCase();
  if (!clean) return { valid: false };

  const found = PROMO_CODE_CATALOG.find((p) => p.code.toUpperCase() === clean);
  if (!found) {
    return {
      valid: false,
      errorAr: `كود الخصم «${clean}» غير صحيح أو غير مسجّل.`,
      errorEn: `Promo code "${clean}" is invalid.`
    };
  }

  const audienceOk =
    params.audience === 'egyptian' ? found.appliesToEgyptian : found.appliesToForeigner;
  if (!audienceOk) {
    return {
      valid: false,
      errorAr: `الكود «${clean}» غير متاح لشريحة حسابك الحالية.`,
      errorEn: `Promo code "${clean}" is not applicable to your nationality tier.`
    };
  }

  if (found.startDate && params.dateIso < found.startDate) {
    return {
      valid: false,
      errorAr: `الكود «${clean}» يبدأ تفعيله بتاريخ ${found.startDate}.`,
      errorEn: `Promo code "${clean}" starts on ${found.startDate}.`
    };
  }

  if (found.endDate && params.dateIso > found.endDate) {
    return {
      valid: false,
      errorAr: `انتهت صلاحية كود الخصم «${clean}» بتاريخ ${found.endDate}.`,
      errorEn: `Promo code "${clean}" expired on ${found.endDate}.`
    };
  }

  if (found.minGuests && params.payingGuests < found.minGuests) {
    return {
      valid: false,
      errorAr: `يتطلب الكود «${clean}» حجز ${found.minGuests} أفراد على الأقل.`,
      errorEn: `Promo code "${clean}" requires at least ${found.minGuests} guests.`
    };
  }

  return { valid: true, promo: found };
}

export function supportsPrivateGroupOption(
  item: Pick<Activity, 'pricing' | 'tripNature' | 'categoryPath'>,
  audience: 'egyptian' | 'foreigner'
): boolean {
  const tier: PriceTier | undefined =
    audience === 'egyptian' ? item.pricing?.egyptianB2C : item.pricing?.foreignerB2C;
  if (!tier) return false;
  const totalPriv = audience === 'egyptian' ? Number(tier.privateTotalEGP || 0) : Number(tier.privateTotalEUR || 0);
  return totalPriv > 0;
}

export function supportsPerPersonOption(
  item: Pick<Activity, 'pricing'>,
  audience: 'egyptian' | 'foreigner'
): boolean {
  const tier: PriceTier | undefined =
    audience === 'egyptian' ? item.pricing?.egyptianB2C : item.pricing?.foreignerB2C;
  if (!tier) return false;
  const adultRate = audience === 'egyptian' ? Number(tier.adultEGP || 0) : Number(tier.adultEUR || 0);
  return adultRate > 0;
}

export function resolveDefaultBookingMode(
  item: Pick<Activity, 'pricing' | 'tripNature' | 'categoryPath'>,
  audience: 'egyptian' | 'foreigner'
): 'per_person' | 'private_group' {
  const hasPerPerson = supportsPerPersonOption(item, audience);
  const hasPrivate = supportsPrivateGroupOption(item, audience);
  const isExplicitPrivateNature =
    (item.tripNature || '').includes('خاص') ||
    (item.categoryPath || []).some((c) => c.includes('خاص'));

  if (!hasPerPerson && hasPrivate) return 'private_group';
  if (isExplicitPrivateNature && hasPrivate && !hasPerPerson) return 'private_group';
  return 'per_person';
}

export interface PlatformFeeTaxConfig {
  serviceFee?: {
    isEnabled?: boolean;
    feeType?: 'fixed' | 'percentage';
    fixedAmount?: number;
    fixedAmounts?: { EGP?: number; EUR?: number; USD?: number };
    currency?: 'EGP' | 'EUR' | 'USD';
    percentage?: number;
  };
  tax?: {
    isEnabled?: boolean;
    centralRatePercent?: number;
  };
}

export function calculateCustomerFeeAndTax(
  baseAmount: number,
  settings: PlatformFeeTaxConfig | null | undefined,
  currency: 'EGP' | 'EUR'
): { fee: number; tax: number; total: number } {
  const base = Math.max(0, Number(baseAmount) || 0);
  if (!settings || base <= 0) {
    return { fee: 0, tax: 0, total: Number(base.toFixed(2)) };
  }
  let fee = 0;
  const sf = settings.serviceFee;
  if (sf?.isEnabled) {
    if (sf.feeType === 'fixed') {
      const perCurr = sf.fixedAmounts?.[currency];
      if (typeof perCurr === 'number') {
        fee = Math.max(0, Number(perCurr) || 0);
      } else if (sf.currency === currency) {
        fee = Math.max(0, Number(sf.fixedAmount) || 0);
      }
    } else {
      const pct = Math.min(100, Math.max(0, Number(sf.percentage) || 0));
      fee = (base * pct) / 100;
    }
  }
  let tax = 0;
  if (settings.tax?.isEnabled) {
    const rate = Math.min(100, Math.max(0, Number(settings.tax.centralRatePercent) || 0));
    tax = (base * rate) / 100;
  }
  return {
    fee: Number(fee.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number((base + fee + tax).toFixed(2))
  };
}

export interface AuthoritativePricingBreakdown {
  currency: 'EGP' | 'EUR';
  audience: 'egyptian' | 'foreigner';
  bookingMode: 'per_person' | 'private_group';
  rawBase: number;
  activeDiscount: SeasonalDiscount | null;
  discountedBase: number;
  discountSaved: number;
  appliedPromo: PromoCodeDefinition | null;
  promoSaved: number;
  afterPromoBase: number;
  addonsTotal: number;
  fee: number;
  tax: number;
  total: number;
  depositAmount: number;
  remainingAmount: number;
}

export function computeAuthoritativeBookingBreakdown(params: {
  item: Pick<Activity, 'pricing' | 'seasonalDiscounts' | 'tripNature' | 'categoryPath' | 'inclusions'>;
  audience: 'egyptian' | 'foreigner';
  tripDate: string;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  bookingMode?: 'per_person' | 'private_group';
  promoCode?: string;
  selectedAddons?: SelectedPaidAddonItem[];
  paymentMethod: 'online_card' | 'cash_on_pickup' | 'deposit';
  platformSettings?: PlatformFeeTaxConfig | null;
}): AuthoritativePricingBreakdown {
  const currency: 'EGP' | 'EUR' = params.audience === 'egyptian' ? 'EGP' : 'EUR';
  const tier =
    params.audience === 'egyptian' ? params.item.pricing.egyptianB2C : params.item.pricing.foreignerB2C;
  const resolvedMode =
    params.bookingMode === 'private_group' && supportsPrivateGroupOption(params.item, params.audience)
      ? 'private_group'
      : params.bookingMode === 'per_person' && supportsPerPersonOption(params.item, params.audience)
        ? 'per_person'
        : resolveDefaultBookingMode(params.item, params.audience);

  let rawBase = 0;
  if (resolvedMode === 'private_group') {
    rawBase =
      currency === 'EGP' ? Number(tier.privateTotalEGP || 0) : Number(tier.privateTotalEUR || 0);
  } else {
    const adultRate = currency === 'EGP' ? Number(tier.adultEGP || 0) : Number(tier.adultEUR || 0);
    const childRate = currency === 'EGP' ? Number(tier.childEGP || 0) : Number(tier.childEUR || 0);
    const infantRate =
      currency === 'EGP' ? Number(tier.infantEGP || 0) : Number(tier.infantEUR || 0);
    rawBase =
      Math.max(0, params.adultsCount) * adultRate +
      Math.max(0, params.childrenCount) * childRate +
      Math.max(0, params.infantsCount) * infantRate;
  }

  const activeDiscount = findActiveSeasonalDiscount(
    params.item.seasonalDiscounts,
    params.tripDate,
    params.audience
  );
  const discountedBase = applySeasonalDiscountAmount(rawBase, activeDiscount, currency);
  const discountSaved = Math.max(0, Number((rawBase - discountedBase).toFixed(2)));

  const payingGuests =
    resolvedMode === 'private_group'
      ? Math.max(1, params.adultsCount + params.childrenCount)
      : Math.max(0, params.adultsCount + params.childrenCount);

  const promoCheck = validatePromoCodeForBooking({
    code: params.promoCode,
    dateIso: params.tripDate,
    audience: params.audience,
    payingGuests
  });
  const appliedPromo = promoCheck.valid && promoCheck.promo ? promoCheck.promo : null;
  const afterPromoBase = appliedPromo
    ? applySeasonalDiscountAmount(discountedBase, appliedPromo, currency)
    : discountedBase;
  const promoSaved = Math.max(0, Number((discountedBase - afterPromoBase).toFixed(2)));

  // Re-verify addon unit prices against item inclusions when available
  const addonsMap = new Map((params.item.inclusions?.paidAddons || []).map((a) => [a.id, a]));
  const addonsTotal = (params.selectedAddons || []).reduce((sum, ad) => {
    const catalogAddon = addonsMap.get(ad.id);
    const unitPrice = catalogAddon
      ? currency === 'EGP'
        ? Number(catalogAddon.priceEGP || 0)
        : Number(catalogAddon.priceEUR || 0)
      : currency === 'EGP'
        ? Number(ad.unitPriceEGP || 0)
        : Number(ad.unitPriceEUR || 0);
    return sum + unitPrice * Math.max(0, Number(ad.quantity) || 0);
  }, 0);

  const feeTax = calculateCustomerFeeAndTax(
    afterPromoBase + addonsTotal,
    params.platformSettings,
    currency
  );

  const total = feeTax.total;
  const depositAmount =
    params.paymentMethod === 'online_card'
      ? total
      : params.paymentMethod === 'deposit'
        ? Number(((total * DEFAULT_DEPOSIT_PERCENT) / 100).toFixed(currency === 'EGP' ? 0 : 2))
        : 0;
  const remainingAmount = Math.max(0, Number((total - depositAmount).toFixed(2)));

  return {
    currency,
    audience: params.audience,
    bookingMode: resolvedMode,
    rawBase,
    activeDiscount,
    discountedBase,
    discountSaved,
    appliedPromo,
    promoSaved,
    afterPromoBase,
    addonsTotal,
    fee: feeTax.fee,
    tax: feeTax.tax,
    total,
    depositAmount,
    remainingAmount
  };
}

const JS_DAY_TO_OPERATING_DAY: ('sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat')[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat'
];

export const OPERATING_DAY_LABELS_AR: Record<string, string> = {
  sat: 'السبت',
  sun: 'الأحد',
  mon: 'الإثنين',
  tue: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس',
  fri: 'الجمعة'
};

export function getOperatingDayKey(
  dateIso: string
): 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return null;
  const d = new Date(`${dateIso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return JS_DAY_TO_OPERATING_DAY[d.getUTCDay()] || null;
}

export function isSlotOperatingOnDate(
  slot: Pick<TimeSlotCapacity, 'operatingDays'> | undefined,
  dateIso: string
): boolean {
  if (!slot || !Array.isArray(slot.operatingDays) || slot.operatingDays.length === 0) {
    return true;
  }
  const dayKey = getOperatingDayKey(dateIso);
  if (!dayKey) return true;
  return slot.operatingDays.includes(dayKey);
}

export function findNearestAvailableDate(params: {
  item: Pick<Activity, 'slots' | 'equipmentIds'>;
  slotLabel?: string;
  maintenanceBlocks?: ResourceMaintenanceBlock[];
  fromDateIso?: string;
}): string {
  const startIso = params.fromDateIso || getTodayIsoDate();
  const slot =
    params.item.slots?.find((s) => s.timeLabel === params.slotLabel) || params.item.slots?.[0];
  const eqIds = new Set(params.item.equipmentIds || []);
  const blocks = params.maintenanceBlocks || [];

  const startDate = new Date(`${startIso}T12:00:00Z`);
  if (Number.isNaN(startDate.getTime())) return startIso;

  for (let offset = 0; offset < 30; offset += 1) {
    const candidate = new Date(startDate.getTime() + offset * 86400000);
    const iso = candidate.toISOString().split('T')[0];
    const opOk = isSlotOperatingOnDate(slot, iso);
    const blocked = blocks.some(
      (b) => eqIds.has(b.resourceId) && iso >= b.startDate && iso <= b.endDate
    );
    if (opOk && !blocked) return iso;
  }
  return startIso;
}

export function evaluateCancellationRefund(params: {
  policy?: Partial<CancellationPolicy> | null;
  tripDate: string;
  slotLabel?: string;
  paidAmountEGP: number;
  paidAmountEUR: number;
}): {
  tier: 'full' | 'partial' | 'none';
  refundPercent: number;
  refundAmountEGP: number;
  refundAmountEUR: number;
  hoursRemaining: number;
  summaryAr: string;
  summaryEn: string;
} {
  const fullHours = Math.max(0, Number(params.policy?.fullRefundHoursNotice ?? 24));
  const partialHours = Math.max(0, Number(params.policy?.partialRefundHoursNotice ?? 12));
  const partialPct = Math.min(100, Math.max(0, Number(params.policy?.partialRefundPercentage ?? 50)));

  // Parse slot time if available (e.g. "09:00 ص" or "02:30 م")
  let hour24 = 9;
  let minute = 0;
  const match = (params.slotLabel || '').match(/(\d{1,2}):(\d{2})/);
  if (match) {
    hour24 = Number(match[1]) || 9;
    minute = Number(match[2]) || 0;
    const isPm = (params.slotLabel || '').includes('م') || (params.slotLabel || '').toLowerCase().includes('pm');
    const isAm = (params.slotLabel || '').includes('ص') || (params.slotLabel || '').toLowerCase().includes('am');
    if (isPm && hour24 < 12) hour24 += 12;
    if (isAm && hour24 === 12) hour24 = 0;
  }

  const targetMs = new Date(
    `${params.tripDate}T${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
  ).getTime();
  const hoursRemaining = Number.isNaN(targetMs)
    ? 48
    : Math.max(0, Math.round((targetMs - Date.now()) / 3600000));

  let tier: 'full' | 'partial' | 'none' = 'none';
  let refundPercent = 0;

  if (hoursRemaining >= fullHours) {
    tier = 'full';
    refundPercent = 100;
  } else if (partialPct > 0 && hoursRemaining >= partialHours) {
    tier = 'partial';
    refundPercent = partialPct;
  } else {
    tier = 'none';
    refundPercent = 0;
  }

  const refundAmountEGP = Math.round((Math.max(0, params.paidAmountEGP) * refundPercent) / 100);
  const refundAmountEUR = Number(
    ((Math.max(0, params.paidAmountEUR) * refundPercent) / 100).toFixed(2)
  );

  const summaryAr =
    tier === 'full'
      ? `إلغاء مجاني مع استرداد كامل (100%) وفق السياسة (قبل الموعد بأكثر من ${fullHours} ساعة)`
      : tier === 'partial'
        ? `استرداد جزئي بنسبة ${refundPercent}% وفق السياسة (قبل الموعد بـ ${hoursRemaining} ساعة)`
        : `تجاوز مهلة الإلغاء المجاني (${partialHours} ساعة) — بدون استرداد مالي`;

  const summaryEn =
    tier === 'full'
      ? `Free cancellation with 100% refund (${fullHours}h+ notice)`
      : tier === 'partial'
        ? `Partial ${refundPercent}% refund (${hoursRemaining}h remaining)`
        : `Past free/partial notice window (${partialHours}h) — non-refundable`;

  return {
    tier,
    refundPercent,
    refundAmountEGP,
    refundAmountEUR,
    hoursRemaining,
    summaryAr,
    summaryEn
  };
}
