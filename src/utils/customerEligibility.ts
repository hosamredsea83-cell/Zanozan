import type { Activity } from '../types/activity';
import type { AppUser } from '../types/auth';
import type { TripRecord } from '../types/trip';

export type CustomerScopeType = 'platform' | 'company';
export type CustomerRegistrationSource =
  | 'platform_signup'
  | 'company_page'
  | 'booking_clerk';

export interface NationalityOption {
  value: string;
  labelAr: string;
  labelEn: string;
  isEgyptian: boolean;
}

export const CUSTOMER_NATIONALITY_OPTIONS: NationalityOption[] = [
  { value: 'مصر', labelAr: 'مصر (مصري / مقيم)', labelEn: 'Egypt (Egyptian / Resident)', isEgyptian: true },
  { value: 'السعودية', labelAr: 'المملكة العربية السعودية', labelEn: 'Saudi Arabia', isEgyptian: false },
  { value: 'الإمارات', labelAr: 'الإمارات العربية المتحدة', labelEn: 'United Arab Emirates', isEgyptian: false },
  { value: 'الكويت', labelAr: 'الكويت', labelEn: 'Kuwait', isEgyptian: false },
  { value: 'ألمانيا', labelAr: 'ألمانيا', labelEn: 'Germany', isEgyptian: false },
  { value: 'بريطانيا', labelAr: 'المملكة المتحدة (بريطانيا)', labelEn: 'United Kingdom', isEgyptian: false },
  { value: 'روسيا', labelAr: 'روسيا', labelEn: 'Russia', isEgyptian: false },
  { value: 'فرنسا', labelAr: 'فرنسا', labelEn: 'France', isEgyptian: false },
  { value: 'إيطاليا', labelAr: 'إيطاليا', labelEn: 'Italy', isEgyptian: false },
  { value: 'بولندا', labelAr: 'بولندا', labelEn: 'Poland', isEgyptian: false },
  { value: 'هولندا', labelAr: 'هولندا', labelEn: 'Netherlands', isEgyptian: false },
  { value: 'الولايات المتحدة', labelAr: 'الولايات المتحدة الأمريكية', labelEn: 'United States', isEgyptian: false },
  { value: 'أخرى', labelAr: 'جنسية أخرى', labelEn: 'Other Nationality', isEgyptian: false }
];

const EGYPT_MATCHERS = new Set([
  'مصر',
  'مصري',
  'مصرية',
  'جمهورية مصر العربية',
  'egypt',
  'egyptian',
  'eg',
  'egy'
]);

export function isEgyptianNationality(nationality?: string | null): boolean {
  const normalized = (nationality || '').trim().toLowerCase();
  if (!normalized) return false;
  return EGYPT_MATCHERS.has(normalized);
}

export function resolveAudienceByNationality(
  nationality?: string | null
): 'egyptian' | 'foreigner' {
  return isEgyptianNationality(nationality) ? 'egyptian' : 'foreigner';
}

export function resolveAutoCurrencyByNationality(
  nationality?: string | null
): 'EGP' | 'EUR' {
  return isEgyptianNationality(nationality) ? 'EGP' : 'EUR';
}

export function getNationalityDisplayLabel(
  nationality?: string | null,
  lang: 'ar' | 'en' = 'ar'
): string {
  const val = (nationality || '').trim();
  if (!val) return lang === 'en' ? 'Not specified' : 'غير محددة';
  const found = CUSTOMER_NATIONALITY_OPTIONS.find(
    (o) => o.value.toLowerCase() === val.toLowerCase()
  );
  if (found) return lang === 'en' ? found.labelEn : found.labelAr;
  return val;
}

export interface CustomerVisibilityContext {
  customerScope?: CustomerScopeType;
  registeredCompanyId?: string;
  registeredCompanyName?: string;
  registrationSource?: CustomerRegistrationSource;
}

export function isExperienceVisibleForCustomer(
  item: Pick<Activity | TripRecord, 'status' | 'owner' | 'channels'>,
  customer?: AppUser | CustomerVisibilityContext | null
): boolean {
  // 1. Must be published
  if (item.status && item.status !== 'published') {
    return false;
  }

  const ch = item.channels;
  const scope: CustomerScopeType = customer?.customerScope || 'platform';

  if (scope === 'company') {
    // Company customer sees ONLY that company's activities & trips
    const matchesCompanyId =
      Boolean(customer?.registeredCompanyId) &&
      item.owner?.id === customer?.registeredCompanyId;
    const matchesCompanyName =
      Boolean(customer?.registeredCompanyName) &&
      (item.owner?.companyName || '').trim() ===
        (customer?.registeredCompanyName || '').trim();

    if (!matchesCompanyId && !matchesCompanyName) {
      return false;
    }

    // Subject to distribution channels:
    // - Registered via company storefront page -> must be published on ownerStorefront or b2cCustomers
    // - Registered via booking clerk -> can access company's ownerStorefront, b2cCustomers, or tourismMarketplace
    if (ch) {
      if (customer?.registrationSource === 'booking_clerk') {
        return Boolean(ch.ownerStorefront || ch.b2cCustomers || ch.tourismMarketplace || ch.mobileApp);
      }
      return Boolean(ch.ownerStorefront || ch.b2cCustomers);
    }
    return true;
  }

  // Platform customer sees activities & trips across ALL companies,
  // strictly governed by platform/public distribution channels
  if (ch) {
    return Boolean(ch.tourismMarketplace || ch.mobileApp || ch.b2cCustomers);
  }
  return true;
}
