import React, { useState, useEffect } from 'react';
import {
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Globe,
  Building2,
  Crown,
  Tag,
  Code2,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import {
  Activity,
  ActivitySelectedPricingProperty,
  DynamicPricingRuleType,
  DynamicPricingRuleEntry,
  PricingPropertyItem,
  SeasonalDiscount
} from '../../types/activity';
import {
  ACTIVITY_TERMINOLOGY,
  type EntityTerminologyConfig
} from '../reference/creation/entityCreationTerminology';

export type BaseCurrency = 'EGP' | 'USD' | 'EUR';

export interface BaseRateState {
  adultPrice: number;
  currency: BaseCurrency;
  compareAtPrice: number;
}

export interface EgyptianPricingConfig {
  currency: 'EGP' | 'USD';
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
}

export interface ForeignerPricingConfig {
  currency: 'EUR' | 'USD';
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
}

export interface B2BRateConfig {
  strategy: 'discount_percent' | 'fixed_price';
  discountPercent: number;
  adultPriceLocal: number;
  childPriceLocal?: number;
  infantPriceLocal?: number;
  adultPriceForeign: number;
  childPriceForeign?: number;
  infantPriceForeign?: number;
}

export interface PrivateCharterConfig {
  pricingType: 'total_group' | 'per_person_min';
  totalPriceLocal: number;
  totalPriceForeign: number;
  maxPax: number;
  perPersonMinPax: number;
  perPersonPriceLocal: number;
}

export interface PromoDiscountConfig {
  title: string;
  discountType: 'percentage' | 'fixed_amount';
  value: number;
  requiresCode: boolean;
  promoCode: string;
  startDate: string;
  endDate: string;
}

export type ActiveRuleState =
  | {
      id: string;
      rule_type: 'egyptian_pricing';
      isExpanded: boolean;
      priority: number;
      config: EgyptianPricingConfig;
    }
  | {
      id: string;
      rule_type: 'foreigner_pricing';
      isExpanded: boolean;
      priority: number;
      config: ForeignerPricingConfig;
    }
  | {
      id: string;
      rule_type: 'b2b_rate';
      isExpanded: boolean;
      priority: number;
      config: B2BRateConfig;
    }
  | {
      id: string;
      rule_type: 'private_charter';
      isExpanded: boolean;
      priority: number;
      config: PrivateCharterConfig;
    }
  | {
      id: string;
      rule_type: 'promo_discount';
      isExpanded: boolean;
      priority: number;
      config: PromoDiscountConfig;
    };

interface ChipDefinition {
  type: DynamicPricingRuleType;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  accentClass: string;
}

const PRICING_CHIPS: ChipDefinition[] = [
  {
    type: 'egyptian_pricing',
    label: 'إضافة تسعير السائح المصري',
    subtitle: 'تسعير مستقل للسائح المصري بالجنيه أو الدولار',
    icon: <Globe className="w-3.5 h-3.5" />,
    accentClass: 'text-cyan-300 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/40'
  },
  {
    type: 'foreigner_pricing',
    label: 'إضافة سعر للأجانب',
    subtitle: 'تسعير مستقل باليورو أو الدولار',
    icon: <Globe className="w-3.5 h-3.5" />,
    accentClass: 'text-amber-300 border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/40'
  },
  {
    type: 'b2b_rate',
    label: 'إضافة سعر للشركات B2B',
    subtitle: 'أسعار صافية أو خصم لوكلاء السياحة',
    icon: <Building2 className="w-3.5 h-3.5" />,
    accentClass: 'text-violet-300 border-violet-500/30 hover:border-violet-400 hover:bg-violet-950/40'
  },
  {
    type: 'private_charter',
    label: 'إضافة رحلة خاصة VIP',
    subtitle: 'سعر إجمالي للمجموعة وحد أقصى للأفراد',
    icon: <Crown className="w-3.5 h-3.5" />,
    accentClass: 'text-cyan-300 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/40'
  },
  {
    type: 'promo_discount',
    label: 'إضافة خصم / عرض ترويجي',
    subtitle: 'عرض موسمي أو كود خصم لفترة محددة',
    icon: <Tag className="w-3.5 h-3.5" />,
    accentClass: 'text-rose-300 border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/40'
  }
];

interface DynamicPricingRulesEditorProps {
  formData: Activity;
  setFormData: React.Dispatch<React.SetStateAction<Activity>>;
  pricingProperties?: PricingPropertyItem[];
  terms?: EntityTerminologyConfig;
}

function hydrateInitialRules(activity: Activity): ActiveRuleState[] {
  if (activity.dynamicPricing?.activeRules && activity.dynamicPricing.activeRules.length > 0) {
    return activity.dynamicPricing.activeRules
      .filter((r) => r.rule_type !== 'age_tiers')
      .map((r) => {
        if (r.rule_type === 'b2b_rate') {
          const cfg = (r.config || {}) as Partial<B2BRateConfig>;
          return {
            id: r.id,
            rule_type: 'b2b_rate',
            isExpanded: true,
            priority: r.priority,
            config: {
              strategy: cfg.strategy || 'fixed_price',
              discountPercent: cfg.discountPercent ?? 0,
              adultPriceLocal: cfg.adultPriceLocal ?? activity.pricing?.egyptianB2B?.adultEGP ?? 0,
              childPriceLocal: cfg.childPriceLocal ?? activity.pricing?.egyptianB2B?.childEGP ?? 0,
              infantPriceLocal: cfg.infantPriceLocal ?? activity.pricing?.egyptianB2B?.infantEGP ?? 0,
              adultPriceForeign: cfg.adultPriceForeign ?? activity.pricing?.foreignerB2B?.adultEUR ?? 0,
              childPriceForeign: cfg.childPriceForeign ?? activity.pricing?.foreignerB2B?.childEUR ?? 0,
              infantPriceForeign: cfg.infantPriceForeign ?? activity.pricing?.foreignerB2B?.infantEUR ?? 0
            }
          } as ActiveRuleState;
        }
        return {
          id: r.id,
          rule_type: r.rule_type,
          isExpanded: true,
          priority: r.priority,
          config: r.config as any
        };
      }) as ActiveRuleState[];
  }

  // Hydrate cleanly only for non-default active pricing properties already present on existing activities
  const rules: ActiveRuleState[] = [];
  const p = activity.pricing;
  const adultEGP = p?.egyptianB2C?.adultEGP || 0;

  if ((p?.egyptianB2C?.adultEGP ?? 0) > 0) {
    rules.push({
      id: 'rule-egyptian-init',
      rule_type: 'egyptian_pricing',
      isExpanded: false,
      priority: 5,
      config: {
        currency: 'EGP',
        adultPrice: p.egyptianB2C.adultEGP,
        childPrice: p.egyptianB2C.childEGP || 0,
        infantPrice: p.egyptianB2C.infantEGP || 0
      }
    });
  }

  if ((p?.foreignerB2C?.adultEUR ?? 0) > 0) {
    rules.push({
      id: 'rule-foreign-init',
      rule_type: 'foreigner_pricing',
      isExpanded: false,
      priority: 10,
      config: {
        currency: 'EUR',
        adultPrice: p.foreignerB2C.adultEUR,
        childPrice: p.foreignerB2C.childEUR || 0,
        infantPrice: p.foreignerB2C.infantEUR || 0
      }
    });
  }

  if (
    ((p?.egyptianB2B?.adultEGP ?? 0) > 0 && p.egyptianB2B.adultEGP !== adultEGP) ||
    ((p?.foreignerB2B?.adultEUR ?? 0) > 0 && p.foreignerB2B.adultEUR !== (p?.foreignerB2C?.adultEUR ?? 0))
  ) {
    rules.push({
      id: 'rule-b2b-init',
      rule_type: 'b2b_rate',
      isExpanded: false,
      priority: 30,
      config: {
        strategy: 'fixed_price',
        discountPercent: adultEGP > 0 ? Math.max(0, Math.round(((adultEGP - p.egyptianB2B.adultEGP) / adultEGP) * 100)) : 15,
        adultPriceLocal: p.egyptianB2B.adultEGP,
        childPriceLocal: p.egyptianB2B.childEGP || 0,
        infantPriceLocal: p.egyptianB2B.infantEGP || 0,
        adultPriceForeign: p.foreignerB2B?.adultEUR || Math.round((p.foreignerB2C?.adultEUR || 30) * 0.8),
        childPriceForeign: p.foreignerB2B?.childEUR || 0,
        infantPriceForeign: p.foreignerB2B?.infantEUR || 0
      }
    });
  }

  if ((p?.egyptianB2C?.privateTotalEGP ?? 0) > 0 || (p?.foreignerB2C?.privateTotalEUR ?? 0) > 0) {
    rules.push({
      id: 'rule-private-init',
      rule_type: 'private_charter',
      isExpanded: false,
      priority: 40,
      config: {
        pricingType: p.egyptianB2C.privatePricingType === 'per_person_min' ? 'per_person_min' : 'total_group',
        totalPriceLocal: p.egyptianB2C.privateTotalEGP || 0,
        totalPriceForeign: p.foreignerB2C?.privateTotalEUR || 0,
        maxPax: p.egyptianB2C.privateMaxPax ?? activity.maxPax ?? 10,
        perPersonMinPax: p.egyptianB2C.privatePerPersonMinPax || 4,
        perPersonPriceLocal: p.egyptianB2C.privatePerPersonEGP || adultEGP
      }
    });
  }

  if (activity.seasonalDiscounts && activity.seasonalDiscounts.length > 0) {
    const firstPromo = activity.seasonalDiscounts[0];
    rules.push({
      id: 'rule-promo-init',
      rule_type: 'promo_discount',
      isExpanded: false,
      priority: 50,
      config: {
        title: firstPromo.title,
        discountType: firstPromo.discountType,
        value: firstPromo.valueEGP,
        requiresCode: false,
        promoCode: 'ZANOZA15',
        startDate: firstPromo.startDate,
        endDate: firstPromo.endDate
      }
    });
  }

  return rules;
}

export const DynamicPricingRulesEditor: React.FC<DynamicPricingRulesEditorProps> = ({
  formData,
  setFormData,
  pricingProperties = [],
  terms = ACTIVITY_TERMINOLOGY
}) => {
  const activePricingProps = pricingProperties.filter((p) => p.isActive);
  const selectedProps = formData.selectedPricingProperties ?? [];
  const selectedAdultProp = selectedProps.find((p) => p.category === 'adult');
  const selectedChildProp = selectedProps.find((p) => p.category === 'child');
  const selectedInfantProp = selectedProps.find((p) => p.category === 'infant');

  const fallbackAdultProp = activePricingProps.find((p) => p.category === 'adult');
  const fallbackChildProp = activePricingProps.find((p) => p.category === 'child');
  const fallbackInfantProp = activePricingProps.find((p) => p.category === 'infant');

  const adultProp = selectedAdultProp ?? fallbackAdultProp;
  const childProp = selectedChildProp ?? fallbackChildProp;
  const infantProp = selectedInfantProp ?? fallbackInfantProp;

  const adultLabel = adultProp?.displayLabel || 'البالغ';
  const childLabel = childProp?.displayLabel || 'الطفل';
  const infantLabel = infantProp?.displayLabel || 'الرضيع';
  const [activeRules, setActiveRules] = useState<ActiveRuleState[]>(() => hydrateInitialRules(formData));
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  const handleTogglePricingProperty = (prop: PricingPropertyItem) => {
    const isAlreadySelected = selectedProps.some((s) => s.propertyId === prop.id);
    const snapshot: ActivitySelectedPricingProperty = {
      propertyId: prop.id,
      category: prop.category,
      categoryLabel: prop.categoryLabel,
      displayLabel: prop.displayLabel,
      ageMin: prop.ageMin,
      ageMax: prop.ageMax
    };

    let nextSelected: ActivitySelectedPricingProperty[];
    if (isAlreadySelected) {
      nextSelected = selectedProps.filter((s) => s.propertyId !== prop.id);
    } else if (prop.category === 'adult' || prop.category === 'child' || prop.category === 'infant') {
      nextSelected = [...selectedProps.filter((s) => s.category !== prop.category), snapshot];
    } else {
      nextSelected = [...selectedProps, snapshot];
    }

    setFormData((prev) => ({
      ...prev,
      selectedPricingProperties: nextSelected
    }));
  };

  useEffect(() => {
    setActiveRules(hydrateInitialRules(formData));
  }, [formData.id]);

  // Keep rules in sync if an external quick-pick pricing package updates B2C adult/child prices
  useEffect(() => {
    const extEgAdult = formData.pricing?.egyptianB2C?.adultEGP ?? 0;
    const extEgChild = formData.pricing?.egyptianB2C?.childEGP ?? 0;
    const extFrAdult = formData.pricing?.foreignerB2C?.adultEUR ?? 0;
    const extFrChild = formData.pricing?.foreignerB2C?.childEUR ?? 0;

    setActiveRules((prev) => {
      const egRule = prev.find((r) => r.rule_type === 'egyptian_pricing');
      const frRule = prev.find((r) => r.rule_type === 'foreigner_pricing');
      let changed = false;

      let next = prev.map((r) => {
        if (r.rule_type === 'egyptian_pricing' && (r.config.adultPrice !== extEgAdult || r.config.childPrice !== extEgChild)) {
          changed = true;
          return { ...r, config: { ...r.config, adultPrice: extEgAdult, childPrice: extEgChild } };
        }
        if (r.rule_type === 'foreigner_pricing' && (r.config.adultPrice !== extFrAdult || r.config.childPrice !== extFrChild)) {
          changed = true;
          return { ...r, config: { ...r.config, adultPrice: extFrAdult, childPrice: extFrChild } };
        }
        return r;
      });

      if (!egRule && extEgAdult > 0) {
        changed = true;
        next = [
          {
            id: `rule-egyptian-ext-${Date.now().toString().slice(-4)}`,
            rule_type: 'egyptian_pricing',
            isExpanded: true,
            priority: 5,
            config: {
              currency: 'EGP',
              adultPrice: extEgAdult,
              childPrice: extEgChild,
              infantPrice: formData.pricing?.egyptianB2C?.infantEGP ?? 0
            }
          },
          ...next
        ];
      }

      if (!frRule && extFrAdult > 0) {
        changed = true;
        next = [
          ...next,
          {
            id: `rule-foreign-ext-${Date.now().toString().slice(-4)}`,
            rule_type: 'foreigner_pricing',
            isExpanded: true,
            priority: 10,
            config: {
              currency: 'EUR',
              adultPrice: extFrAdult,
              childPrice: extFrChild,
              infantPrice: formData.pricing?.foreignerB2C?.infantEUR ?? 0
            }
          }
        ];
      }

      return changed ? next : prev;
    });
  }, [
    formData.pricing?.egyptianB2C?.adultEGP,
    formData.pricing?.egyptianB2C?.childEGP,
    formData.pricing?.foreignerB2C?.adultEUR,
    formData.pricing?.foreignerB2C?.childEUR
  ]);

  // Synchronize clean backend payload + backward-compatible pricing fields on every edit
  const syncToActivity = (nextRules: ActiveRuleState[]) => {
    const cleanPayload: DynamicPricingRuleEntry[] = nextRules.map((r) => ({
      id: r.id,
      rule_type: r.rule_type,
      is_active: true,
      priority: r.priority,
      config: r.config
    }));

    const egyptianRule = nextRules.find((r): r is Extract<ActiveRuleState, { rule_type: 'egyptian_pricing' }> => r.rule_type === 'egyptian_pricing');
    const foreignRule = nextRules.find((r): r is Extract<ActiveRuleState, { rule_type: 'foreigner_pricing' }> => r.rule_type === 'foreigner_pricing');
    const b2bRule = nextRules.find((r): r is Extract<ActiveRuleState, { rule_type: 'b2b_rate' }> => r.rule_type === 'b2b_rate');
    const privateRule = nextRules.find((r): r is Extract<ActiveRuleState, { rule_type: 'private_charter' }> => r.rule_type === 'private_charter');
    const promoRule = nextRules.find((r): r is Extract<ActiveRuleState, { rule_type: 'promo_discount' }> => r.rule_type === 'promo_discount');

    const effectiveAdultLocal = egyptianRule ? egyptianRule.config.adultPrice : 0;
    const childLocal = egyptianRule ? egyptianRule.config.childPrice : 0;
    const infantLocal = egyptianRule ? egyptianRule.config.infantPrice : 0;

    const foreignAdult = foreignRule ? foreignRule.config.adultPrice : 0;
    const childForeign = foreignRule ? foreignRule.config.childPrice : 0;
    const infantForeign = foreignRule ? foreignRule.config.infantPrice : 0;

    const b2bAdultLocal = b2bRule
      ? b2bRule.config.strategy === 'discount_percent'
        ? Math.round(effectiveAdultLocal * (1 - b2bRule.config.discountPercent / 100))
        : b2bRule.config.adultPriceLocal
      : effectiveAdultLocal;
    const b2bChildLocal = b2bRule
      ? b2bRule.config.strategy === 'discount_percent'
        ? Math.round(childLocal * (1 - b2bRule.config.discountPercent / 100))
        : (b2bRule.config.childPriceLocal ?? 0)
      : childLocal;
    const b2bInfantLocal = b2bRule
      ? b2bRule.config.strategy === 'discount_percent'
        ? Math.round(infantLocal * (1 - b2bRule.config.discountPercent / 100))
        : (b2bRule.config.infantPriceLocal ?? 0)
      : infantLocal;

    const b2bAdultForeign = b2bRule
      ? b2bRule.config.strategy === 'discount_percent'
        ? Math.round(foreignAdult * (1 - b2bRule.config.discountPercent / 100))
        : b2bRule.config.adultPriceForeign
      : foreignAdult;
    const b2bChildForeign = b2bRule
      ? b2bRule.config.strategy === 'discount_percent'
        ? Math.round(childForeign * (1 - b2bRule.config.discountPercent / 100))
        : (b2bRule.config.childPriceForeign ?? 0)
      : childForeign;
    const b2bInfantForeign = b2bRule
      ? b2bRule.config.strategy === 'discount_percent'
        ? Math.round(infantForeign * (1 - b2bRule.config.discountPercent / 100))
        : (b2bRule.config.infantPriceForeign ?? 0)
      : infantForeign;

    const nextDiscounts: SeasonalDiscount[] = promoRule
      ? [
          {
            id: promoRule.id,
            title: promoRule.config.title || 'عرض ترويجي',
            seasonType: 'flash_sale',
            startDate: promoRule.config.startDate,
            endDate: promoRule.config.endDate,
            discountType: promoRule.config.discountType,
            valueEGP: promoRule.config.value,
            valueEUR: promoRule.config.value,
            appliesToEgyptian: true,
            appliesToForeigner: Boolean(foreignRule)
          }
        ]
      : [];

    setFormData((prev) => ({
      ...prev,
      dynamicPricing: {
        baseRate: {
          currency: egyptianRule?.config.currency || foreignRule?.config.currency || 'EGP',
          adultPrice: effectiveAdultLocal || foreignAdult || b2bAdultLocal || b2bAdultForeign || 0,
          compareAtPrice: 0
        },
        activeRules: cleanPayload
      },
      pricing: {
        ...prev.pricing,
        egyptianB2C: {
          ...prev.pricing.egyptianB2C,
          adultEGP: effectiveAdultLocal,
          childEGP: childLocal,
          infantEGP: infantLocal,
          privatePricingType: privateRule?.config.pricingType ?? 'total_group',
          privateTotalEGP: privateRule ? privateRule.config.totalPriceLocal : 0,
          privateMaxPax: privateRule ? privateRule.config.maxPax : prev.maxPax,
          privatePerPersonMinPax: privateRule?.config.perPersonMinPax,
          privatePerPersonEGP: privateRule?.config.perPersonPriceLocal
        },
        foreignerB2C: {
          ...prev.pricing.foreignerB2C,
          adultEUR: foreignAdult,
          childEUR: childForeign,
          infantEUR: infantForeign,
          privatePricingType: privateRule?.config.pricingType ?? 'total_group',
          privateTotalEUR: privateRule ? privateRule.config.totalPriceForeign : 0,
          privateMaxPax: privateRule ? privateRule.config.maxPax : prev.maxPax
        },
        egyptianB2B: {
          ...prev.pricing.egyptianB2B,
          adultEGP: b2bAdultLocal,
          childEGP: b2bChildLocal,
          infantEGP: b2bInfantLocal
        },
        foreignerB2B: {
          ...prev.pricing.foreignerB2B,
          adultEUR: b2bAdultForeign,
          childEUR: b2bChildForeign,
          infantEUR: b2bInfantForeign
        }
      },
      seasonalDiscounts: nextDiscounts
    }));
  };

  const handleActivateChip = (type: DynamicPricingRuleType) => {
    if (activeRules.some((r) => r.rule_type === type)) return;

    const egyptianRule = activeRules.find(
      (r): r is Extract<ActiveRuleState, { rule_type: 'egyptian_pricing' }> => r.rule_type === 'egyptian_pricing'
    );
    const foreignerRule = activeRules.find(
      (r): r is Extract<ActiveRuleState, { rule_type: 'foreigner_pricing' }> => r.rule_type === 'foreigner_pricing'
    );

    const uid = `rule-${type}-${Date.now().toString().slice(-4)}`;
    let newRule: ActiveRuleState;

    switch (type) {
      case 'egyptian_pricing':
        newRule = {
          id: uid,
          rule_type: 'egyptian_pricing',
          isExpanded: true,
          priority: 5,
          config: {
            currency: 'EGP',
            adultPrice: formData.pricing?.egyptianB2C?.adultEGP ?? 0,
            childPrice: formData.pricing?.egyptianB2C?.childEGP ?? 0,
            infantPrice: formData.pricing?.egyptianB2C?.infantEGP ?? 0
          }
        };
        break;
      case 'foreigner_pricing':
        newRule = {
          id: uid,
          rule_type: 'foreigner_pricing',
          isExpanded: true,
          priority: 10,
          config: {
            currency: 'EUR',
            adultPrice: formData.pricing?.foreignerB2C?.adultEUR ?? 0,
            childPrice: formData.pricing?.foreignerB2C?.childEUR ?? 0,
            infantPrice: formData.pricing?.foreignerB2C?.infantEUR ?? 0
          }
        };
        break;
      case 'b2b_rate':
        newRule = {
          id: uid,
          rule_type: 'b2b_rate',
          isExpanded: true,
          priority: 30,
          config: {
            strategy: 'fixed_price',
            discountPercent: 0,
            adultPriceLocal: formData.pricing?.egyptianB2B?.adultEGP || egyptianRule?.config.adultPrice || 0,
            childPriceLocal: formData.pricing?.egyptianB2B?.childEGP || 0,
            infantPriceLocal: formData.pricing?.egyptianB2B?.infantEGP || 0,
            adultPriceForeign: formData.pricing?.foreignerB2B?.adultEUR ?? foreignerRule?.config.adultPrice ?? 0,
            childPriceForeign: formData.pricing?.foreignerB2B?.childEUR || 0,
            infantPriceForeign: formData.pricing?.foreignerB2B?.infantEUR || 0
          }
        };
        break;
      case 'private_charter':
        newRule = {
          id: uid,
          rule_type: 'private_charter',
          isExpanded: true,
          priority: 40,
          config: {
            pricingType: 'total_group',
            totalPriceLocal: formData.pricing?.egyptianB2C?.privateTotalEGP || 0,
            totalPriceForeign: formData.pricing?.foreignerB2C?.privateTotalEUR || 0,
            maxPax: formData.maxPax || 0,
            perPersonMinPax: 0,
            perPersonPriceLocal: egyptianRule?.config.adultPrice || formData.pricing?.egyptianB2C?.adultEGP || 0
          }
        };
        break;
      case 'promo_discount':
        newRule = {
          id: uid,
          rule_type: 'promo_discount',
          isExpanded: true,
          priority: 50,
          config: {
            title: '',
            discountType: 'percentage',
            value: 0,
            requiresCode: false,
            promoCode: '',
            startDate: '',
            endDate: ''
          }
        };
        break;
      default:
        return;
    }

    const nextRules = [...activeRules, newRule];
    setActiveRules(nextRules);
    syncToActivity(nextRules);
  };

  const handleRemoveRule = (ruleId: string) => {
    const nextRules = activeRules.filter((r) => r.id !== ruleId);
    setActiveRules(nextRules);
    syncToActivity(nextRules);
  };

  const handleToggleExpand = (ruleId: string) => {
    setActiveRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isExpanded: !r.isExpanded } : r))
    );
  };

  const updateRuleConfig = <T extends DynamicPricingRuleType>(
    ruleId: string,
    patch: Partial<Extract<ActiveRuleState, { rule_type: T }>['config']>
  ) => {
    const nextRules = activeRules.map((r) =>
      r.id === ruleId ? ({ ...r, config: { ...r.config, ...patch } } as ActiveRuleState) : r
    );
    setActiveRules(nextRules);
    syncToActivity(nextRules);
  };

  const activeEgyptianRule = activeRules.find(
    (r): r is Extract<ActiveRuleState, { rule_type: 'egyptian_pricing' }> => r.rule_type === 'egyptian_pricing'
  );
  const activeForeignerRule = activeRules.find(
    (r): r is Extract<ActiveRuleState, { rule_type: 'foreigner_pricing' }> => r.rule_type === 'foreigner_pricing'
  );
  const activeB2BRule = activeRules.find(
    (r): r is Extract<ActiveRuleState, { rule_type: 'b2b_rate' }> => r.rule_type === 'b2b_rate'
  );

  const localCurrency: 'EGP' | 'USD' = activeEgyptianRule?.config.currency || 'EGP';
  const currencyLabel = localCurrency === 'EGP' ? 'ج.م' : '$';

  const cleanPayloadPreview = {
    base_prices: {
      egyptian_adult: activeEgyptianRule?.config.adultPrice ?? 0,
      foreigner_adult: activeForeignerRule?.config.adultPrice ?? 0,
      b2b_egyptian_adult: activeB2BRule
        ? activeB2BRule.config.strategy === 'discount_percent'
          ? Math.round((activeEgyptianRule?.config.adultPrice ?? 0) * (1 - (activeB2BRule.config.discountPercent || 0) / 100))
          : activeB2BRule.config.adultPriceLocal
        : null,
      b2b_foreigner_adult: activeB2BRule
        ? activeB2BRule.config.strategy === 'discount_percent'
          ? Math.round((activeForeignerRule?.config.adultPrice ?? 0) * (1 - (activeB2BRule.config.discountPercent || 0) / 100))
          : activeB2BRule.config.adultPriceForeign
        : null
    },
    active_rules: activeRules.map((r) => ({
      rule_type: r.rule_type,
      is_active: true,
      priority: r.priority,
      config: r.config
    }))
  };

  return (
    <div className="space-y-4">

      {/* اختيار الفئات العمرية المعتمدة من خصائص السعر */}
      <div className="bg-slate-950/90 border border-cyan-500/25 rounded-xl p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{terms.pricingAgeTiersTitle}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {terms.pricingAgeTiersCountLabel(selectedProps.length)}
          </span>
        </div>

        {activePricingProps.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activePricingProps.map((prop) => {
              const isSelected = selectedProps.some((s) => s.propertyId === prop.id);
              return (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => handleTogglePricingProperty(prop)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-600/25 border-cyan-400 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span>{prop.displayLabel}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">
            لا توجد بنود مفعّلة في خصائص السعر حالياً.
          </p>
        )}

        {selectedProps.length > 0 ? (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-emerald-300 font-semibold">سيظهر للعميل عند الحفظ:</span>
            {selectedProps.map((sp) => (
              <span
                key={sp.propertyId}
                className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-700/50 text-emerald-200 font-bold"
              >
                {sp.displayLabel}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-slate-400">
            {terms.pricingAgeTiersHint}
          </p>
        )}
      </div>

      {/* شريط الأزرار التفاعلية (Dynamic Chips Bar) */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{terms.pricingDynamicChipsTitle}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {activeRules.length} / {PRICING_CHIPS.length} مفعّلة
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRICING_CHIPS.map((chip) => {
            const isActivated = activeRules.some((r) => r.rule_type === chip.type);
            return (
              <button
                key={chip.type}
                type="button"
                disabled={isActivated}
                onClick={() => handleActivateChip(chip.type)}
                title={chip.subtitle}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isActivated
                    ? 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-65 cursor-not-allowed'
                    : `bg-slate-900 cursor-pointer shadow-sm ${chip.accentClass}`
                }`}
              >
                {isActivated ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="shrink-0">{chip.icon}</span>
                <span>{isActivated ? chip.label.replace('إضافة ', '') : `+ ${chip.label}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. صناديق الإعدادات الديناميكية (Dynamic Accordion / Cards) */}
      {activeRules.length > 0 && (
        <div className="space-y-2.5">
          {activeRules.map((rule) => {
            if (rule.rule_type === 'egyptian_pricing') {
              return (
                <div
                  key={rule.id}
                  className="bg-slate-950 border border-cyan-500/30 rounded-xl overflow-hidden transition-all animate-fade-in"
                >
                  <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(rule.id)}
                      className="flex items-center gap-2 text-right flex-1 min-w-0 cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-white">تسعير السائح المصري (Egyptian Rate)</span>
                      <span className="text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded truncate">
                        {adultLabel}: {rule.config.adultPrice} {rule.config.currency} · {childLabel}:{' '}
                        {rule.config.childPrice === 0 ? 'مجاني' : `${rule.config.childPrice} ${rule.config.currency}`} · {infantLabel}:{' '}
                        {rule.config.infantPrice === 0 ? 'مجاني' : `${rule.config.infantPrice} ${rule.config.currency}`}
                      </span>
                      {rule.isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400 mr-auto" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-auto" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="px-2 py-1 rounded-md bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      <X className="w-3 h-3" />
                      <span>إزالة</span>
                    </button>
                  </div>

                  {rule.isExpanded && (
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">العملة المحلية</label>
                        <select
                          value={rule.config.currency}
                          onChange={(e) =>
                            updateRuleConfig<'egyptian_pricing'>(rule.id, {
                              currency: e.target.value as 'EGP' | 'USD'
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 font-mono text-cyan-300"
                        >
                          <option value="EGP">EGP (ج.م)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-cyan-300 font-semibold block mb-1">
                          {adultLabel} ({rule.config.currency}) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={rule.config.adultPrice}
                          onChange={(e) =>
                            updateRuleConfig<'egyptian_pricing'>(rule.id, {
                              adultPrice: Math.max(0, parseInt(e.target.value) || 0)
                            })
                          }
                          className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-2.5 py-2 font-mono text-white font-bold focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">{childLabel} ({rule.config.currency})</label>
                        <input
                          type="number"
                          min={0}
                          value={rule.config.childPrice}
                          onChange={(e) =>
                            updateRuleConfig<'egyptian_pricing'>(rule.id, {
                              childPrice: Math.max(0, parseInt(e.target.value) || 0)
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 font-mono text-white"
                        />
                        <span
                          className={`text-[10px] block text-center mt-1 font-semibold ${
                            rule.config.childPrice === 0 ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {rule.config.childPrice === 0 ? 'مجاني (0)' : 'رسوم مخصصة'}
                        </span>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">{infantLabel} ({rule.config.currency})</label>
                        <input
                          type="number"
                          min={0}
                          value={rule.config.infantPrice}
                          onChange={(e) =>
                            updateRuleConfig<'egyptian_pricing'>(rule.id, {
                              infantPrice: Math.max(0, parseInt(e.target.value) || 0)
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 font-mono text-white"
                        />
                        <span
                          className={`text-[10px] block text-center mt-1 font-semibold ${
                            rule.config.infantPrice === 0 ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {rule.config.infantPrice === 0 ? 'مجاني (0)' : 'رسوم مخصصة'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (rule.rule_type === 'foreigner_pricing') {
              return (
                <div
                  key={rule.id}
                  className="bg-slate-950 border border-amber-500/30 rounded-xl overflow-hidden transition-all animate-fade-in"
                >
                  <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(rule.id)}
                      className="flex items-center gap-2 text-right flex-1 min-w-0 cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-white">تسعير السائح الأجنبي (Foreigner Rate)</span>
                      <span className="text-[10px] font-mono bg-amber-950/70 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded truncate">
                        {adultLabel}: {rule.config.adultPrice} {rule.config.currency} · {childLabel}:{' '}
                        {rule.config.childPrice === 0 ? 'مجاني' : `${rule.config.childPrice} ${rule.config.currency}`} · {infantLabel}:{' '}
                        {rule.config.infantPrice === 0 ? 'مجاني' : `${rule.config.infantPrice} ${rule.config.currency}`}
                      </span>
                      {rule.isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400 mr-auto" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-auto" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="px-2 py-1 rounded-md bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      <X className="w-3 h-3" />
                      <span>إزالة</span>
                    </button>
                  </div>

                  {rule.isExpanded && (
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">العملة الأجنبية</label>
                        <select
                          value={rule.config.currency}
                          onChange={(e) =>
                            updateRuleConfig<'foreigner_pricing'>(rule.id, {
                              currency: e.target.value as 'EUR' | 'USD'
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 font-mono text-amber-300"
                        >
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-amber-300 font-semibold block mb-1">
                          {adultLabel} ({rule.config.currency}) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={rule.config.adultPrice}
                          onChange={(e) =>
                            updateRuleConfig<'foreigner_pricing'>(rule.id, {
                              adultPrice: Math.max(0, parseInt(e.target.value) || 0)
                            })
                          }
                          className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-2.5 py-2 font-mono text-white font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">{childLabel} ({rule.config.currency})</label>
                        <input
                          type="number"
                          min={0}
                          value={rule.config.childPrice}
                          onChange={(e) =>
                            updateRuleConfig<'foreigner_pricing'>(rule.id, {
                              childPrice: Math.max(0, parseInt(e.target.value) || 0)
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 font-mono text-white"
                        />
                        <span
                          className={`text-[10px] block text-center mt-1 font-semibold ${
                            rule.config.childPrice === 0 ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {rule.config.childPrice === 0 ? 'مجاني (0)' : 'رسوم مخصصة'}
                        </span>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">{infantLabel} ({rule.config.currency})</label>
                        <input
                          type="number"
                          min={0}
                          value={rule.config.infantPrice}
                          onChange={(e) =>
                            updateRuleConfig<'foreigner_pricing'>(rule.id, {
                              infantPrice: Math.max(0, parseInt(e.target.value) || 0)
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 font-mono text-white"
                        />
                        <span
                          className={`text-[10px] block text-center mt-1 font-semibold ${
                            rule.config.infantPrice === 0 ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {rule.config.infantPrice === 0 ? 'مجاني (0)' : 'رسوم مخصصة'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (rule.rule_type === 'b2b_rate') {
              const egyptianRule = activeRules.find(
                (r): r is Extract<ActiveRuleState, { rule_type: 'egyptian_pricing' }> => r.rule_type === 'egyptian_pricing'
              );
              const foreignerRule = activeRules.find(
                (r): r is Extract<ActiveRuleState, { rule_type: 'foreigner_pricing' }> => r.rule_type === 'foreigner_pricing'
              );

              const baseLocalAdult = egyptianRule ? egyptianRule.config.adultPrice : (formData.pricing?.egyptianB2C?.adultEGP ?? 0);
              const baseLocalChild = egyptianRule ? egyptianRule.config.childPrice : (formData.pricing?.egyptianB2C?.childEGP ?? 0);
              const baseLocalInfant = egyptianRule ? egyptianRule.config.infantPrice : (formData.pricing?.egyptianB2C?.infantEGP ?? 0);

              const baseForeignAdult = foreignerRule ? foreignerRule.config.adultPrice : (formData.pricing?.foreignerB2C?.adultEUR ?? 0);
              const baseForeignChild = foreignerRule ? foreignerRule.config.childPrice : (formData.pricing?.foreignerB2C?.childEUR ?? 0);
              const baseForeignInfant = foreignerRule ? foreignerRule.config.infantPrice : (formData.pricing?.foreignerB2C?.infantEUR ?? 0);

              const isDiscountMode = rule.config.strategy === 'discount_percent';
              const discFactor = 1 - (rule.config.discountPercent || 0) / 100;

              const effLocalAdult = isDiscountMode ? Math.round(baseLocalAdult * discFactor) : rule.config.adultPriceLocal;
              const effLocalChild = isDiscountMode ? Math.round(baseLocalChild * discFactor) : (rule.config.childPriceLocal ?? 0);
              const effLocalInfant = isDiscountMode ? Math.round(baseLocalInfant * discFactor) : (rule.config.infantPriceLocal ?? 0);

              const effForeignAdult = isDiscountMode ? Math.round(baseForeignAdult * discFactor) : rule.config.adultPriceForeign;
              const effForeignChild = isDiscountMode ? Math.round(baseForeignChild * discFactor) : (rule.config.childPriceForeign ?? 0);
              const effForeignInfant = isDiscountMode ? Math.round(baseForeignInfant * discFactor) : (rule.config.infantPriceForeign ?? 0);

              return (
                <div
                  key={rule.id}
                  className="bg-slate-950 border border-violet-500/30 rounded-xl overflow-hidden transition-all animate-fade-in"
                >
                  <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(rule.id)}
                      className="flex items-center gap-2 text-right flex-1 min-w-0 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-violet-400 shrink-0" />
                      <span className="text-xs font-bold text-white">أسعار الشركات والوكلاء (B2B)</span>
                      <span className="text-[10px] font-mono bg-violet-950/70 text-violet-300 border border-violet-800/50 px-2 py-0.5 rounded truncate">
                        مصري ({adultLabel}): {effLocalAdult} {currencyLabel} · أجنبي ({adultLabel}): €{effForeignAdult}
                      </span>
                      {rule.isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400 mr-auto" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-auto" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="px-2 py-1 rounded-md bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      <X className="w-3 h-3" />
                      <span>إزالة</span>
                    </button>
                  </div>

                  {rule.isExpanded && (
                    <div className="p-4 space-y-4 text-xs">
                      {/* آلية تسعير الشركات */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">آلية تسعير الوكلاء والشركات</label>
                          <select
                            value={rule.config.strategy}
                            onChange={(e) =>
                              updateRuleConfig<'b2b_rate'>(rule.id, {
                                strategy: e.target.value as 'discount_percent' | 'fixed_price'
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                          >
                            <option value="fixed_price">سعر صافي مخصص للشركات (مصريين / أجانب)</option>
                            <option value="discount_percent">نسبة خصم من سعر B2C (%)</option>
                          </select>
                        </div>

                        {isDiscountMode && (
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">نسبة خصم الشركات (%)</label>
                            <input
                              type="number"
                              min={0}
                              max={90}
                              value={rule.config.discountPercent}
                              onChange={(e) =>
                                updateRuleConfig<'b2b_rate'>(rule.id, {
                                  discountPercent: Math.max(0, Math.min(90, parseInt(e.target.value) || 0))
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 font-mono text-violet-300 font-bold"
                            />
                          </div>
                        )}
                      </div>

                      {/* تقسيم أسعار الشركات إلى قسمين: بند المصريين + بند الأجانب (بالغ · طفل · رضيع لكل قسم) */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {/* القسم الأول: بند المصريين للشركات */}
                        <div className="bg-slate-900/70 border border-cyan-500/30 rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5" />
                              <span>بند المصريين — أسعار الشركات (EGP)</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">بالغ · طفل · رضيع</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2.5">
                            <div>
                              <label className="text-[10px] text-cyan-300 font-semibold block mb-1">
                                {adultLabel} (ج.م) *
                              </label>
                              <input
                                type="number"
                                min={0}
                                disabled={isDiscountMode}
                                value={effLocalAdult}
                                onChange={(e) =>
                                  updateRuleConfig<'b2b_rate'>(rule.id, {
                                    adultPriceLocal: Math.max(0, parseInt(e.target.value) || 0)
                                  })
                                }
                                className="w-full bg-slate-950 border border-cyan-500/40 disabled:opacity-70 rounded-lg px-2.5 py-2 font-mono text-white font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">{childLabel} (ج.م)</label>
                              <input
                                type="number"
                                min={0}
                                disabled={isDiscountMode}
                                value={effLocalChild}
                                onChange={(e) =>
                                  updateRuleConfig<'b2b_rate'>(rule.id, {
                                    childPriceLocal: Math.max(0, parseInt(e.target.value) || 0)
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-70 rounded-lg px-2.5 py-2 font-mono text-white"
                              />
                              <span
                                className={`text-[10px] block text-center mt-1 font-semibold ${
                                  effLocalChild === 0 ? 'text-emerald-400' : 'text-slate-400'
                                }`}
                              >
                                {effLocalChild === 0 ? 'مجاني (0)' : 'رسوم مخصصة'}
                              </span>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">{infantLabel} (ج.م)</label>
                              <input
                                type="number"
                                min={0}
                                disabled={isDiscountMode}
                                value={effLocalInfant}
                                onChange={(e) =>
                                  updateRuleConfig<'b2b_rate'>(rule.id, {
                                    infantPriceLocal: Math.max(0, parseInt(e.target.value) || 0)
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-70 rounded-lg px-2.5 py-2 font-mono text-white"
                              />
                              <span
                                className={`text-[10px] block text-center mt-1 font-semibold ${
                                  effLocalInfant === 0 ? 'text-emerald-400' : 'text-slate-400'
                                }`}
                              >
                                {effLocalInfant === 0 ? 'مجاني (0)' : 'رسوم مخصصة'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* القسم الثاني: بند الأجانب للشركات */}
                        <div className="bg-slate-900/70 border border-amber-500/30 rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5" />
                              <span>بند الأجانب — أسعار الشركات (€)</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">بالغ · طفل · رضيع</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2.5">
                            <div>
                              <label className="text-[10px] text-amber-300 font-semibold block mb-1">
                                {adultLabel} (€) *
                              </label>
                              <input
                                type="number"
                                min={0}
                                disabled={isDiscountMode}
                                value={effForeignAdult}
                                onChange={(e) =>
                                  updateRuleConfig<'b2b_rate'>(rule.id, {
                                    adultPriceForeign: Math.max(0, parseInt(e.target.value) || 0)
                                  })
                                }
                                className="w-full bg-slate-950 border border-amber-500/40 disabled:opacity-70 rounded-lg px-2.5 py-2 font-mono text-amber-300 font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">{childLabel} (€)</label>
                              <input
                                type="number"
                                min={0}
                                disabled={isDiscountMode}
                                value={effForeignChild}
                                onChange={(e) =>
                                  updateRuleConfig<'b2b_rate'>(rule.id, {
                                    childPriceForeign: Math.max(0, parseInt(e.target.value) || 0)
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-70 rounded-lg px-2.5 py-2 font-mono text-white"
                              />
                              <span
                                className={`text-[10px] block text-center mt-1 font-semibold ${
                                  effForeignChild === 0 ? 'text-emerald-400' : 'text-slate-400'
                                }`}
                              >
                                {effForeignChild === 0 ? 'مجاني (0)' : 'رسوم مخصصة'}
                              </span>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">{infantLabel} (€)</label>
                              <input
                                type="number"
                                min={0}
                                disabled={isDiscountMode}
                                value={effForeignInfant}
                                onChange={(e) =>
                                  updateRuleConfig<'b2b_rate'>(rule.id, {
                                    infantPriceForeign: Math.max(0, parseInt(e.target.value) || 0)
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-70 rounded-lg px-2.5 py-2 font-mono text-white"
                              />
                              <span
                                className={`text-[10px] block text-center mt-1 font-semibold ${
                                  effForeignInfant === 0 ? 'text-emerald-400' : 'text-slate-400'
                                }`}
                              >
                                {effForeignInfant === 0 ? 'مجاني (0)' : 'رسوم مخصصة'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (rule.rule_type === 'private_charter') {
              return (
                <div
                  key={rule.id}
                  className="bg-slate-950 border border-cyan-500/30 rounded-xl overflow-hidden transition-all animate-fade-in"
                >
                  <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(rule.id)}
                      className="flex items-center gap-2 text-right flex-1 min-w-0 cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-white">تسعير الرحلة الخاصة VIP</span>
                      <span className="text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded truncate">
                        {rule.config.totalPriceLocal.toLocaleString()} {currencyLabel} · حتى {rule.config.maxPax} أفراد
                      </span>
                      {rule.isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400 mr-auto" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-auto" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="px-2 py-1 rounded-md bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      <X className="w-3 h-3" />
                      <span>إزالة</span>
                    </button>
                  </div>

                  {rule.isExpanded && (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">نمط الرحلة الخاصة</label>
                        <select
                          value={rule.config.pricingType}
                          onChange={(e) =>
                            updateRuleConfig<'private_charter'>(rule.id, {
                              pricingType: e.target.value as 'total_group' | 'per_person_min'
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                        >
                          <option value="total_group">سعر مقطوع للمركب/المجموعة</option>
                          <option value="per_person_min">سعر للفرد بحد أدنى</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          إجمالي الخاصة ({localCurrency})
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={rule.config.totalPriceLocal}
                          onChange={(e) =>
                            updateRuleConfig<'private_charter'>(rule.id, {
                              totalPriceLocal: Math.max(0, parseInt(e.target.value) || 0)
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 font-mono text-cyan-300 font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">إجمالي الخاصة أجنبي (€/$)</label>
                        <input
                          type="number"
                          min={0}
                          value={rule.config.totalPriceForeign}
                          onChange={(e) =>
                            updateRuleConfig<'private_charter'>(rule.id, {
                              totalPriceForeign: Math.max(0, parseInt(e.target.value) || 0)
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 font-mono text-amber-300 font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">الحد الأقصى للرحلة الخاصة (أفراد)</label>
                        <input
                          type="number"
                          min={1}
                          value={rule.config.maxPax}
                          onChange={(e) =>
                            updateRuleConfig<'private_charter'>(rule.id, {
                              maxPax: Math.max(1, parseInt(e.target.value) || 1)
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 font-mono text-white font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // promo_discount
            return (
              <div
                key={rule.id}
                className="bg-slate-950 border border-rose-500/30 rounded-xl overflow-hidden transition-all animate-fade-in"
              >
                <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleExpand(rule.id)}
                    className="flex items-center gap-2 text-right flex-1 min-w-0 cursor-pointer"
                  >
                    <Tag className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-xs font-bold text-white">خصم / عرض ترويجي</span>
                    <span className="text-[10px] font-mono bg-rose-950/70 text-rose-300 border border-rose-800/50 px-2 py-0.5 rounded truncate">
                      {rule.config.title}: {rule.config.value}
                      {rule.config.discountType === 'percentage' ? '%' : ` ${currencyLabel}`}
                    </span>
                    {rule.isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400 mr-auto" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-auto" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveRule(rule.id)}
                    className="px-2 py-1 rounded-md bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/60 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                  >
                    <X className="w-3 h-3" />
                    <span>إزالة</span>
                  </button>
                </div>

                {rule.isExpanded && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">اسم العرض / الخصم</label>
                      <input
                        type="text"
                        value={rule.config.title}
                        onChange={(e) =>
                          updateRuleConfig<'promo_discount'>(rule.id, { title: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">نوع الخصم</label>
                      <select
                        value={rule.config.discountType}
                        onChange={(e) =>
                          updateRuleConfig<'promo_discount'>(rule.id, {
                            discountType: e.target.value as 'percentage' | 'fixed_amount'
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                      >
                        <option value="percentage">نسبة مئوية (%)</option>
                        <option value="fixed_amount">مبلغ ثابت ({localCurrency})</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">القيمة</label>
                      <input
                        type="number"
                        min={0}
                        value={rule.config.value}
                        onChange={(e) =>
                          updateRuleConfig<'promo_discount'>(rule.id, {
                            value: Math.max(0, parseInt(e.target.value) || 0)
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 font-mono text-rose-300 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">تاريخ البداية</label>
                      <input
                        type="date"
                        value={rule.config.startDate}
                        onChange={(e) =>
                          updateRuleConfig<'promo_discount'>(rule.id, { startDate: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">تاريخ الانتهاء</label>
                      <input
                        type="date"
                        value={rule.config.endDate}
                        onChange={(e) =>
                          updateRuleConfig<'promo_discount'>(rule.id, { endDate: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-end gap-2">
                      <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pb-2">
                        <input
                          type="checkbox"
                          checked={rule.config.requiresCode}
                          onChange={(e) =>
                            updateRuleConfig<'promo_discount'>(rule.id, { requiresCode: e.target.checked })
                          }
                          className="accent-rose-500"
                        />
                        <span>يتطلب كود خصم:</span>
                      </label>
                      {rule.config.requiresCode && (
                        <input
                          type="text"
                          dir="ltr"
                          value={rule.config.promoCode}
                          onChange={(e) =>
                            updateRuleConfig<'promo_discount'>(rule.id, {
                              promoCode: e.target.value.toUpperCase()
                            })
                          }
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-white uppercase"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Clean Backend Payload Preview Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowJsonPreview((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-cyan-300 transition cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>
            {showJsonPreview ? 'إخفاء معاينة هيكل القواعد (Payload)' : 'عرض هيكل البيانات النظيف الجاهز للإرسال (activeRules JSON)'}
          </span>
        </button>

        {showJsonPreview && (
          <pre
            dir="ltr"
            className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-56 text-left"
          >
            {JSON.stringify(cleanPayloadPreview, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
