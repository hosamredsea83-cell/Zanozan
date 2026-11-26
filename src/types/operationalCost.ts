import type { Activity } from './activity';
import type { EntityAuditTrail } from './audit';
import {
  computePlatformServiceFee,
  computePlatformTax,
  type PlatformPricingSettings
} from '../components/pricing/PricingToolManager';

export type CostScope = 'internal' | 'external';

export type InternalCostCategory = 'crew' | 'fuel' | 'other';
export type ExternalCostCategory = 'transport' | 'reps' | 'external_crew';
export type CostCategory = InternalCostCategory | ExternalCostCategory;

export type CostCalculationMethod = 'fixed_per_run' | 'per_person' | 'percent_of_price';
export type CostCurrency = 'EGP' | 'EUR';
export type CostEntityType = 'activity' | 'trip';

export type EconomicsSegmentKey =
  | 'egyptianB2C'
  | 'foreignerB2C'
  | 'egyptianB2B'
  | 'foreignerB2B'
  | 'privateGroup';

export interface OperationalCostLineItem {
  id: string;
  scope: CostScope;
  category: CostCategory;
  title: string;
  calculationMethod: CostCalculationMethod;
  currency: CostCurrency;
  unitAmount: number;
  quantity: number;
  unitLabel?: string;
  notes?: string;
  assignedProfileId?: string;
  assignedProfileName?: string;
}

export interface ActualRunCostRecord {
  id: string;
  runDate: string;
  segment: EconomicsSegmentKey;
  paxCount: number;
  revenueEGP: number;
  internalCostEGP: number;
  externalCostEGP: number;
  totalCostEGP: number;
  netProfitEGP: number;
  notes?: string;
}

export interface ActivityCostProfile {
  id: string;
  ownerId: string;
  entityId: string;
  entityType: CostEntityType;
  entityName: string;
  eurToEgpRate: number;
  defaultExpectedPax: number;
  items: OperationalCostLineItem[];
  actualRuns: ActualRunCostRecord[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  auditTrail?: EntityAuditTrail;
}

export const COST_SCOPE_LABELS: Record<CostScope, string> = {
  internal: 'التكلفة التشغيلية الداخلية',
  external: 'التكلفة الخارجية'
};

export const COST_CATEGORY_META: Record<
  CostCategory,
  { label: string; scope: CostScope; defaultUnitLabel: string; placeholder: string }
> = {
  crew: {
    label: 'طاقم العمل الداخلي',
    scope: 'internal',
    defaultUnitLabel: 'فرد / يوم',
    placeholder: 'مثال: ربان اليخت، بحار، مرشد داخلي...'
  },
  fuel: {
    label: 'المواد البترولية والوقود',
    scope: 'internal',
    defaultUnitLabel: 'لتر',
    placeholder: 'مثال: سولار محركات، بنزين، زيوت تشغيل...'
  },
  other: {
    label: 'مصروفات تشغيلية أخرى',
    scope: 'internal',
    defaultUnitLabel: 'تشغيلة',
    placeholder: 'مثال: رسوم مارينا، ثلج ومياه، تصاريح بيئية...'
  },
  transport: {
    label: 'رسوم النقل الخارجي',
    scope: 'external',
    defaultUnitLabel: 'مركبة / نقلة',
    placeholder: 'مثال: ليموزين خارجي، أتوبيس نقل سياحي...'
  },
  reps: {
    label: 'عمولات المندوبين والوسطاء',
    scope: 'external',
    defaultUnitLabel: 'مندوب / %',
    placeholder: 'مثال: عمولة مندوب مبيعات، سمسار فندق...'
  },
  external_crew: {
    label: 'طاقم عمل خارجي / متعاقد',
    scope: 'external',
    defaultUnitLabel: 'فرد / تشغيلة',
    placeholder: 'مثال: مصور فوتوغرافي حر، مدرب غوص متعاقد...'
  }
};

export const COST_METHOD_LABELS: Record<CostCalculationMethod, string> = {
  fixed_per_run: 'ثابت للتشغيلة / الرحلة',
  per_person: 'لكل فرد / عميل',
  percent_of_price: 'نسبة % من السعر'
};

export const ECONOMICS_SEGMENT_LABELS: Record<EconomicsSegmentKey, string> = {
  egyptianB2C: 'عميل مصري (B2C)',
  foreignerB2C: 'عميل أجنبي (B2C)',
  egyptianB2B: 'شركات مصري (B2B)',
  foreignerB2B: 'شركات أجنبي (B2B)',
  privateGroup: 'حجز خاص كامل (VIP)'
};

export interface ProductEconomicsSummary {
  segment: EconomicsSegmentKey;
  paxCount: number;
  eurToEgpRate: number;
  baseUnitRevenueEGP: number;
  grossRevenueEGP: number;
  platformDeductionEGP: number;
  netOwnerRevenueEGP: number;
  internalFixedEGP: number;
  internalVariableEGP: number;
  internalPercentEGP: number;
  internalTotalEGP: number;
  externalFixedEGP: number;
  externalVariableEGP: number;
  externalPercentEGP: number;
  externalTotalEGP: number;
  totalFixedEGP: number;
  totalVariablePerPaxEGP: number;
  totalCommissionPercent: number;
  totalCostEGP: number;
  costPerPersonEGP: number;
  netProfitEGP: number;
  profitMarginPercent: number;
  breakEvenPax: number | null;
  hasNegativeMarginPerPax: boolean;
}

export function getEntitySegmentBaseRevenueEGP(
  entity: Activity,
  segment: EconomicsSegmentKey,
  paxCount: number,
  eurToEgpRate: number
): { grossRevenueEGP: number; baseUnitRevenueEGP: number; isEUR: boolean } {
  const safePax = Math.max(1, paxCount);
  const rate = eurToEgpRate > 0 ? eurToEgpRate : 52;
  const pricing = entity.pricing;

  if (segment === 'egyptianB2C') {
    const unit = pricing?.egyptianB2C?.adultEGP || 0;
    return { baseUnitRevenueEGP: unit, grossRevenueEGP: unit * safePax, isEUR: false };
  }
  if (segment === 'foreignerB2C') {
    const unitEur = pricing?.foreignerB2C?.adultEUR || 0;
    const unitEgp = unitEur * rate;
    return { baseUnitRevenueEGP: unitEgp, grossRevenueEGP: unitEgp * safePax, isEUR: true };
  }
  if (segment === 'egyptianB2B') {
    const unit = pricing?.egyptianB2B?.adultEGP || 0;
    return { baseUnitRevenueEGP: unit, grossRevenueEGP: unit * safePax, isEUR: false };
  }
  if (segment === 'foreignerB2B') {
    const unitEur = pricing?.foreignerB2B?.adultEUR || 0;
    const unitEgp = unitEur * rate;
    return { baseUnitRevenueEGP: unitEgp, grossRevenueEGP: unitEgp * safePax, isEUR: true };
  }

  // privateGroup
  const egpPriv = pricing?.egyptianB2C;
  const eurPriv = pricing?.foreignerB2C;
  if (egpPriv?.privateTotalEGP && egpPriv.privateTotalEGP > 0) {
    return {
      baseUnitRevenueEGP: egpPriv.privateTotalEGP / safePax,
      grossRevenueEGP: egpPriv.privateTotalEGP,
      isEUR: false
    };
  }
  if (egpPriv?.privatePerPersonEGP && egpPriv.privatePerPersonEGP > 0) {
    return {
      baseUnitRevenueEGP: egpPriv.privatePerPersonEGP,
      grossRevenueEGP: egpPriv.privatePerPersonEGP * safePax,
      isEUR: false
    };
  }
  if (eurPriv?.privateTotalEUR && eurPriv.privateTotalEUR > 0) {
    const total = eurPriv.privateTotalEUR * rate;
    return { baseUnitRevenueEGP: total / safePax, grossRevenueEGP: total, isEUR: true };
  }
  if (eurPriv?.privatePerPersonEUR && eurPriv.privatePerPersonEUR > 0) {
    const unit = eurPriv.privatePerPersonEUR * rate;
    return { baseUnitRevenueEGP: unit, grossRevenueEGP: unit * safePax, isEUR: true };
  }
  return { baseUnitRevenueEGP: 0, grossRevenueEGP: 0, isEUR: false };
}

export function computeLineItemCostEGP(
  item: OperationalCostLineItem,
  paxCount: number,
  grossRevenueEGP: number,
  eurToEgpRate: number
): number {
  const safePax = Math.max(1, paxCount);
  const rate = eurToEgpRate > 0 ? eurToEgpRate : 52;
  const qty = item.quantity > 0 ? item.quantity : 1;
  const unit = Math.max(0, item.unitAmount || 0);
  const currencyFactor = item.currency === 'EUR' ? rate : 1;

  if (item.calculationMethod === 'fixed_per_run') {
    return unit * qty * currencyFactor;
  }
  if (item.calculationMethod === 'per_person') {
    return unit * qty * safePax * currencyFactor;
  }
  // percent_of_price
  return (grossRevenueEGP * (unit * qty)) / 100;
}

export function computeProductEconomics(params: {
  entity: Activity | null;
  items: OperationalCostLineItem[];
  segment: EconomicsSegmentKey;
  paxCount: number;
  eurToEgpRate: number;
  platformPricingSettings?: PlatformPricingSettings;
  deductPlatformFees?: boolean;
}): ProductEconomicsSummary {
  const {
    entity,
    items,
    segment,
    paxCount,
    eurToEgpRate,
    platformPricingSettings,
    deductPlatformFees = false
  } = params;
  const safePax = Math.max(1, paxCount);
  const rate = eurToEgpRate > 0 ? eurToEgpRate : 52;

  const rev = entity
    ? getEntitySegmentBaseRevenueEGP(entity, segment, safePax, rate)
    : { grossRevenueEGP: 0, baseUnitRevenueEGP: 0, isEUR: false };

  let platformDeductionEGP = 0;
  if (deductPlatformFees && platformPricingSettings && rev.grossRevenueEGP > 0) {
    const baseUnitNative = rev.isEUR ? rev.baseUnitRevenueEGP / rate : rev.baseUnitRevenueEGP;
    const currencyCode = rev.isEUR ? 'EUR' : 'EGP';
    const unitFeeNative = computePlatformServiceFee(
      baseUnitNative,
      platformPricingSettings.serviceFee,
      currencyCode
    );
    const unitTaxNative = computePlatformTax(baseUnitNative, platformPricingSettings.tax);
    const unitDeductionEGP = (unitFeeNative + unitTaxNative) * (rev.isEUR ? rate : 1);
    platformDeductionEGP = unitDeductionEGP * safePax;
  }

  const grossRevenueEGP = rev.grossRevenueEGP;
  const netOwnerRevenueEGP = Math.max(0, grossRevenueEGP - platformDeductionEGP);

  let internalFixedEGP = 0;
  let internalVariableEGP = 0;
  let internalPercentEGP = 0;
  let externalFixedEGP = 0;
  let externalVariableEGP = 0;
  let externalPercentEGP = 0;
  let totalVariablePerPaxEGP = 0;
  let totalCommissionPercent = 0;

  items.forEach((item) => {
    const cost = computeLineItemCostEGP(item, safePax, grossRevenueEGP, rate);
    const qty = item.quantity > 0 ? item.quantity : 1;
    const unit = Math.max(0, item.unitAmount || 0);
    const currencyFactor = item.currency === 'EUR' ? rate : 1;

    if (item.scope === 'internal') {
      if (item.calculationMethod === 'fixed_per_run') internalFixedEGP += cost;
      else if (item.calculationMethod === 'per_person') {
        internalVariableEGP += cost;
        totalVariablePerPaxEGP += unit * qty * currencyFactor;
      } else {
        internalPercentEGP += cost;
        totalCommissionPercent += unit * qty;
      }
    } else {
      if (item.calculationMethod === 'fixed_per_run') externalFixedEGP += cost;
      else if (item.calculationMethod === 'per_person') {
        externalVariableEGP += cost;
        totalVariablePerPaxEGP += unit * qty * currencyFactor;
      } else {
        externalPercentEGP += cost;
        totalCommissionPercent += unit * qty;
      }
    }
  });

  const internalTotalEGP = internalFixedEGP + internalVariableEGP + internalPercentEGP;
  const externalTotalEGP = externalFixedEGP + externalVariableEGP + externalPercentEGP;
  const totalFixedEGP = internalFixedEGP + externalFixedEGP;
  const totalCostEGP = internalTotalEGP + externalTotalEGP;
  const costPerPersonEGP = totalCostEGP / safePax;
  const netProfitEGP = netOwnerRevenueEGP - totalCostEGP;
  const profitMarginPercent =
    netOwnerRevenueEGP > 0 ? (netProfitEGP / netOwnerRevenueEGP) * 100 : 0;

  // Break-even pax calculation
  let breakEvenPax: number | null = null;
  let hasNegativeMarginPerPax = false;

  if (
    segment === 'privateGroup' &&
    entity?.pricing?.egyptianB2C?.privatePricingType !== 'per_person_min'
  ) {
    breakEvenPax = netOwnerRevenueEGP >= totalCostEGP ? 1 : null;
  } else {
    const effectiveRevenuePerPax = netOwnerRevenueEGP / safePax;
    const commissionPerPax = (rev.baseUnitRevenueEGP * totalCommissionPercent) / 100;
    const contributionPerPax =
      effectiveRevenuePerPax - totalVariablePerPaxEGP - commissionPerPax;

    if (effectiveRevenuePerPax > 0 && contributionPerPax <= 0) {
      hasNegativeMarginPerPax = true;
      breakEvenPax = null;
    } else if (totalFixedEGP === 0 && contributionPerPax > 0) {
      breakEvenPax = 1;
    } else if (contributionPerPax > 0) {
      breakEvenPax = Math.ceil(totalFixedEGP / contributionPerPax);
    }
  }

  return {
    segment,
    paxCount: safePax,
    eurToEgpRate: rate,
    baseUnitRevenueEGP: rev.baseUnitRevenueEGP,
    grossRevenueEGP,
    platformDeductionEGP,
    netOwnerRevenueEGP,
    internalFixedEGP,
    internalVariableEGP,
    internalPercentEGP,
    internalTotalEGP,
    externalFixedEGP,
    externalVariableEGP,
    externalPercentEGP,
    externalTotalEGP,
    totalFixedEGP,
    totalVariablePerPaxEGP,
    totalCommissionPercent,
    totalCostEGP,
    costPerPersonEGP,
    netProfitEGP,
    profitMarginPercent,
    breakEvenPax,
    hasNegativeMarginPerPax
  };
}
