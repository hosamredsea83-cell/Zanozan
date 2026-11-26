export type UserRoleKey =
  | 'platform_admin'
  | 'subscriber_owner'
  | 'employee'
  | 'driver'
  | 'tour_guide'
  | 'delegate'
  | 'equipment_owner'
  | 'customer';

export const USER_ROLE_LABELS: Record<UserRoleKey, string> = {
  platform_admin: 'سوبر أدمن / إدارة المنصة',
  subscriber_owner: 'مشترك / صاحب نشاط',
  employee: 'موظف تشغيل',
  driver: 'سائق / نقل سياحي',
  tour_guide: 'مرشد / مرافق سياحي',
  delegate: 'مندوب مبيعات وحجز',
  equipment_owner: 'صاحب معدة',
  customer: 'عميل / سائح'
};

export interface AppUser {
  id: string;
  name: string;
  email: string;
  companyName: string;
  phone: string;
  role: string;
  roleKey?: UserRoleKey;
  tier: string;
  avatarColor: string;
  initials: string;
  avatarInitials: string;
  nationality?: string;
  customerScope?: 'platform' | 'company';
  registeredCompanyId?: string;
  registeredCompanyName?: string;
  registrationSource?: 'platform_signup' | 'company_page' | 'booking_clerk';
}

export const SYSTEM_USERS: AppUser[] = [
  {
    id: 'user-ahmed',
    name: 'أحمد الشناوي',
    email: 'ahmed.shennawy@zanoza.com',
    companyName: 'الشناوي مارين لليخوت والرحلات البحرية',
    phone: '+201099234812',
    role: 'سوبر أدمن ومزوّد خدمة رئيسي',
    roleKey: 'platform_admin',
    tier: 'إدارة المنصة · الباقة الذهبية VIP',
    avatarColor: 'bg-cyan-600',
    initials: 'أش',
    avatarInitials: 'أش'
  },
  {
    id: 'user-mohamed',
    name: 'محمد عبد الرحمن',
    email: 'mohamed.abdelrahman@zanoza.com',
    companyName: 'رد سي إكستريم لسفاري الصحراء والبيتش باجي',
    phone: '+201011883390',
    role: 'مشترك وصاحب نشاط',
    roleKey: 'subscriber_owner',
    tier: 'باقة المحترفين الفضية',
    avatarColor: 'bg-amber-600',
    initials: 'مع',
    avatarInitials: 'مع'
  },
  {
    id: 'user-tarek',
    name: 'طارق السويفي',
    email: 'tarek.seweify@zanoza.com',
    companyName: 'بلو أوشن للغوص والأنشطة البحرية',
    phone: '+201055667788',
    role: 'صاحب معدة ومزوّد رحلات',
    roleKey: 'equipment_owner',
    tier: 'باقة الشركات والأساطيل',
    avatarColor: 'bg-emerald-600',
    initials: 'طس',
    avatarInitials: 'طس'
  }
];

export function resolveUserRoleKey(user?: AppUser | null): UserRoleKey {
  if (!user) return 'platform_admin';
  if (user.roleKey) return user.roleKey;
  if (user.id === 'user-ahmed') return 'platform_admin';
  const roleText = (user.role || '').toLowerCase();
  if (roleText.includes('سوبر') || roleText.includes('أدمن') || roleText.includes('صاحب الموقع')) {
    return 'platform_admin';
  }
  if (roleText.includes('موظف')) return 'employee';
  if (roleText.includes('مرشد') || roleText.includes('مرافق')) return 'tour_guide';
  if (roleText.includes('مندوب') && !roleText.includes('سائق')) return 'delegate';
  if (roleText.includes('سائق')) return 'driver';
  if (roleText.includes('معدة') && !roleText.includes('نشاط')) return 'equipment_owner';
  if (roleText.includes('عميل') || roleText.includes('سائح')) return 'customer';
  return 'subscriber_owner';
}

const DRIVER_ALLOWED_KEYS = new Set<string>([
  'driver_portal',
  'partner_earnings',
  'logistics_transfers',
  'logistics_manage',
  'bookings_in_trip_requests',
  'finance_wallets',
  'finance_cashier',
  'person_profiles',
  'customer_storefront'
]);

const TOUR_GUIDE_ALLOWED_KEYS = new Set<string>([
  'partner_earnings',
  'bookings_activities',
  'bookings_trips',
  'bookings_in_trip_requests',
  'trips_schedule',
  'finance_wallets',
  'finance_cashier',
  'person_profiles',
  'customer_storefront'
]);

const DELEGATE_ALLOWED_KEYS = new Set<string>([
  'partner_earnings',
  'activity_marketplace',
  'bookings_activities',
  'bookings_trips',
  'bookings_in_trip_requests',
  'finance_wallets',
  'finance_cashier',
  'person_profiles',
  'customer_storefront'
]);

const EMPLOYEE_ALLOWED_KEYS = new Set<string>([
  'dashboard',
  'customer_storefront',
  'activity_manage',
  'activity_marketplace',
  'activity_equipment',
  'equipment_occupancy',
  'trips_schedule',
  'compare_activities',
  'bookings_activities',
  'bookings_trips',
  'bookings_in_trip_requests',
  'partner_earnings',
  'finance_wallets',
  'finance_cashier'
]);

const EQUIPMENT_OWNER_ALLOWED_KEYS = new Set<string>([
  'dashboard',
  'activity_equipment',
  'activity_equipment_add',
  'activity_equipment_manage',
  'equipment_occupancy',
  'person_profiles',
  'partner_earnings',
  'finance_wallets',
  'finance_cashier',
  'customer_storefront'
]);

const SUBSCRIBER_RESTRICTED_KEYS = new Set<string>([
  'platform_audit_logs',
  'pricing_tool',
  'performance_approvals',
  'user_management'
]);

export function canUserAccessNavKey(
  user: AppUser | undefined,
  navKey: string,
  customAllowedNavKeys?: Set<string> | null
): boolean {
  if (customAllowedNavKeys && customAllowedNavKeys.size > 0) {
    return customAllowedNavKeys.has(navKey);
  }
  const roleKey = resolveUserRoleKey(user);
  if (roleKey === 'platform_admin') return true;
  if (roleKey === 'customer') return navKey === 'customer_storefront';
  if (roleKey === 'driver') return DRIVER_ALLOWED_KEYS.has(navKey);
  if (roleKey === 'tour_guide') return TOUR_GUIDE_ALLOWED_KEYS.has(navKey);
  if (roleKey === 'delegate') return DELEGATE_ALLOWED_KEYS.has(navKey);
  if (roleKey === 'employee') return EMPLOYEE_ALLOWED_KEYS.has(navKey);
  if (roleKey === 'equipment_owner') return EQUIPMENT_OWNER_ALLOWED_KEYS.has(navKey);
  // subscriber_owner
  return !SUBSCRIBER_RESTRICTED_KEYS.has(navKey);
}
