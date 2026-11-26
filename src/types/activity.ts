export type ActivityStatus = '' | 'draft' | 'pending_review' | 'published' | 'paused' | 'archived';

export interface MultiLevelCategory {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  subCategories?: MultiLevelCategory[];
}

export interface Waypoint {
  id: string;
  name: string;
  type: 'departure' | 'stopover' | 'sightseeing' | 'return';
  order: number;
  durationMinutes?: number;
  departureTime?: string;
  returnTime?: string;
  lat?: number;
  lng?: number;
  description?: string;
}

export interface ActivityLocation {
  primarySite: string; // e.g. جزيرة الجفتون
  country: string; // e.g. مصر
  city: string; // e.g. الغردقة
  coordinates?: {
    lat: number;
    lng: number;
  };
  itinerary: Waypoint[];
}

export interface ActivityMediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  isCover: boolean;
  order: number;
  fileSizeBytes: number; // For storage quota tracking
  type: 'image' | 'video';
  videoSource?: 'direct_upload' | 'youtube';
  youtubeUrl?: string;
}

export interface OwnerQuota {
  tierName: string; // e.g. باقة المحترفين الذهبية
  storageUsedBytes: number;
  storageMaxBytes: number;
  filesUsedCount: number;
  filesMaxCount: number;
}

export type PrivateTripPricingType = 'total_group' | 'per_person_min' | 'custom_quote';

export interface PriceTier {
  adultEGP: number;
  adultEUR: number;
  childEGP: number;
  childEUR: number;
  infantEGP: number; // often 0
  infantEUR: number;
  
  // Private trip options
  privatePricingType: PrivateTripPricingType;
  privateTotalEGP?: number;
  privateTotalEUR?: number;
  privateMaxPax?: number;
  privatePerPersonMinPax?: number;
  privatePerPersonEGP?: number;
  privatePerPersonEUR?: number;
  customQuoteAvailable?: boolean;
}

export interface SeasonalDiscount {
  id: string;
  title: string;
  seasonType: 'summer' | 'winter' | 'holiday' | 'flash_sale';
  startDate: string;
  endDate: string;
  discountType: 'percentage' | 'fixed_amount';
  valueEGP: number;
  valueEUR: number;
  appliesToEgyptian: boolean;
  appliesToForeigner: boolean;
}

export interface CustomerAudiencePricing {
  egyptianB2C: PriceTier;
  foreignerB2C: PriceTier;
  egyptianB2B: PriceTier;
  foreignerB2B: PriceTier;
}

export interface TimeSlotCapacity {
  id: string;
  timeLabel: string; // e.g. "09:00 ص"
  maxCapacity: number;
  bookedCount: number;
  availableCount: number;
  operatingDays: ('sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri')[];
}

export interface CancellationPolicy {
  id: string;
  name: string; // e.g. "مرنة: إلغاء مجاني حتى 24 ساعة"
  isPlatformDefault: boolean;
  fullRefundHoursNotice: number;
  partialRefundPercentage: number;
  partialRefundHoursNotice: number;
  customTerms?: string;
}

export type MetaFieldType = 'text' | 'number' | 'boolean' | 'single_choice' | 'multi_choice';
export type CentralCategoryType = 'yacht' | 'marine_trip' | 'safari' | 'diving' | 'horse_riding' | 'general';

export interface MetaField {
  id: string;
  key: string;
  label: string;
  type: MetaFieldType;
  value: string | number | boolean | string[];
  options?: string[]; // for choices
  isRequired: boolean;
  isPublicForClient: boolean;
  isLinkedToCentralLibrary: boolean;
  centralCategory?: CentralCategoryType;
}

export interface MetaGroup {
  id: string;
  title: string;
  fields: MetaField[];
}

export interface ResourceItem {
  id: string;
  name: string;
  type: 'yacht' | 'boat' | 'atv_quad' | 'diving_gear' | 'guide' | 'vehicle';
  quantityRequired: number;
  quantityAvailableTotal: number;
  isMandatory: boolean;
  hasConflictDetected?: boolean;
}

export interface LogisticsSettings {
  requiresTransfer: boolean;
  transferProvidedByOwner: boolean;
  needsMarketTransportOrder: boolean;
  pickupPoint: string;
  dropoffPoint: string;
  passengerCapacity: number;
  assignedDriverOrVehicle?: string;
  separateTransferFeeEGP: number;
  separateTransferFeeEUR: number;
}

export interface ActivityInclusions {
  meals: string[];
  drinks: string[];
  equipmentProvided: string[];
  guideLanguage: string[];
  notIncluded: string[];
  paidAddons: {
    id: string;
    addonId?: string;
    title: string;
    unitLabel?: string;
    priceEGP: number;
    priceEUR: number;
  }[];
}

export interface ComboActivityRef {
  id: string;
  activityId: string;
  activityName: string;
  order: number;
  durationMinutes: number;
  allocatedPriceEGP: number;
  allocatedPriceEUR: number;
  ownerName: string;
}

export type PricingPropertyCategory =
  | 'infant'
  | 'child'
  | 'adult'
  | 'senior'
  | 'private_group'
  | 'custom';

export type PricingAgeConditionType =
  | 'less_than'
  | 'between'
  | 'greater_or_equal'
  | 'custom_text';

export interface PricingPropertyItem {
  id: string;
  category: PricingPropertyCategory;
  categoryLabel: string;
  conditionType: PricingAgeConditionType;
  ageMin?: number;
  ageMax?: number;
  customConditionText?: string;
  displayLabel: string;
  isActive: boolean;
  order: number;
}

export interface CustomTechnicalSpecItem {
  id: string;
  groupId?: string;
  groupTitle: string;
  label: string;
  type: MetaFieldType;
  unit?: string;
  defaultValue: string | number | boolean;
  options?: string[];
  isPublicForClient: boolean;
  isRequired: boolean;
  isActive: boolean;
  order: number;
  linkedCategories?: string[];
  linkedCategoryIds?: string[];
  excludedCategoryIds?: string[];
}

export interface ActivitySelectedPricingProperty {
  propertyId: string;
  category: PricingPropertyCategory;
  categoryLabel: string;
  displayLabel: string;
  ageMin?: number;
  ageMax?: number;
}

export type DynamicPricingRuleType =
  | 'age_tiers'
  | 'egyptian_pricing'
  | 'foreigner_pricing'
  | 'b2b_rate'
  | 'private_charter'
  | 'promo_discount';

export interface DynamicPricingRuleEntry {
  id: string;
  rule_type: DynamicPricingRuleType;
  is_active: boolean;
  priority: number;
  config: Record<string, any>;
}

export interface SupplierCustodyMeta {
  isExternalSupplier: boolean;
  supplierId: string;
  supplierStatus: 'pending_signup' | 'claim_requested' | 'subscribed';
  addedByUserId: string;
  addedByUserName: string;
  addedByCompanyName?: string;
  claimedUserId?: string;
  claimedAt?: string;
}

export interface Activity {
  id: string;
  name: string;
  summary?: string;
  translations: {
    en: { name: string; description: string };
    ru?: { name: string; description: string };
    de?: { name: string; description: string };
  };
  description: string;
  categoryPath: string[]; // e.g. ["الأنشطة السياحية", "الأنشطة البحرية", "رحلات اليخوت", "يخوت خاصة"]
  primaryCategory: CentralCategoryType;
  tripNature?: string;
  duration: {
    days: number;
    hours: number;
    minutes: number;
  };
  location: ActivityLocation;
  status: ActivityStatus;
  owner: {
    id: string;
    name: string;
    companyName: string;
    phone: string;
    tier: string;
  };
  supplierCustody?: SupplierCustodyMeta;
  media: ActivityMediaItem[];
  pricing: CustomerAudiencePricing;
  dynamicPricing?: {
    baseRate: {
      currency: 'EGP' | 'USD' | 'EUR';
      adultPrice: number;
      compareAtPrice?: number;
    };
    activeRules: DynamicPricingRuleEntry[];
    customPropertyPrices?: Record<string, number>;
  };
  selectedPricingProperties?: ActivitySelectedPricingProperty[];
  seasonalDiscounts: SeasonalDiscount[];
  minPax: number;
  maxPax: number;
  slots: TimeSlotCapacity[];
  cancellationPolicy: CancellationPolicy;
  approvalDeadlineHours: number; // e.g. 4 hours
  paymentDeadlineHours: number; // e.g. 12 hours
  metaGroups: MetaGroup[];
  resources: ResourceItem[];
  equipmentIds?: string[]; // References independent EquipmentItem.id records (single source of truth, never copied)
  showEquipmentToClient?: boolean; // Controls whether linked equipment and public specs appear in client view
  logistics: LogisticsSettings;
  inclusions: ActivityInclusions;
  safetyRules: {
    minAge: number;
    clientPrerequisites: string[];
    attireGearNotes: string;
    safetyInstructions: string;
    hasGuideSupervisor: boolean;
    insuranceCoverage: string;
    additionalNotes?: string;
  };
  comboDetails?: {
    isCombo: boolean;
    activities: ComboActivityRef[];
  };
  stats: {
    viewsCount: number;
    inquiriesCount: number;
    bookingsCount: number;
    cancellationRatePercent: number;
    revenueEUR: number;
    revenueEGP: number;
  };
  channels: {
    ownerStorefront: boolean;
    tourismMarketplace: boolean;
    mobileApp?: boolean;
    b2bAgencies: boolean;
    b2cCustomers: boolean;
  };
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  createdByName?: string;
  createdByCompany?: string;
  createdAtTime?: string;
  updatedById?: string;
  updatedByName?: string;
  updatedByCompany?: string;
  updatedAtTime?: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  handle: string;
  description: string;
  parentId: string | null;
  level: number;
  activitiesCount: number;
  createdAt: string;
  updatedAt: string;
}
