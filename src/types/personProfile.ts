export type PersonProfileRole =
  | 'platform_member'
  | 'activity_owner'
  | 'equipment_owner'
  | 'quad_owner'
  | 'driver_vehicle_owner'
  | 'crew_rep';

export type PersonSubscriptionStatus =
  | 'native_member'
  | 'external_pending'
  | 'claim_requested'
  | 'subscribed_isolated';

export interface AssetPersonCustodyMeta {
  personProfileId: string;
  personName: string;
  personStatus: 'external_pending' | 'claim_requested' | 'subscribed_isolated';
  addedByUserId: string;
  addedByUserName: string;
  claimedUserId?: string;
  claimedAt?: string;
}

export interface PendingPhoneClaimRequest {
  requestedUserId: string;
  requestedUserName: string;
  requestedCompany: string;
  requestedPhone: string;
  requestedAt: string;
  message: string;
}

export interface PersonProfile {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  tier: string;
  roles: PersonProfileRole[];
  subscriptionStatus: PersonSubscriptionStatus;
  linkedUserId?: string;
  addedByUserId: string;
  addedByUserName: string;
  addedByCompanyName?: string;
  pendingClaim?: PendingPhoneClaimRequest;
  approvedByOriginalAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BilateralLedgerEntryType =
  | 'credit_payable_to_person'
  | 'debit_paid_to_person'
  | 'activity_pricing_quote';

export type BilateralLedgerSourceType =
  | 'operational_cost'
  | 'booking_payout'
  | 'booking_refund_reversal'
  | 'manual_payment'
  | 'activity_pricing'
  | 'equipment_rental'
  | 'vehicle_trip';

export interface BilateralLedgerEntry {
  id: string;
  profileId: string;
  profileName: string;
  profilePhone: string;
  counterpartyUserId: string;
  counterpartyUserName: string;
  claimedUserId?: string;
  entryType: BilateralLedgerEntryType;
  sourceType: BilateralLedgerSourceType;
  sourceId?: string;
  entityId?: string;
  entityName?: string;
  amountEGP: number;
  currency: 'EGP' | 'EUR';
  originalAmount: number;
  date: string;
  notes?: string;
  recordedByUserId: string;
  recordedByUserName: string;
  createdAt: string;
}

export const PERSON_ROLE_LABELS: Record<PersonProfileRole, string> = {
  platform_member: 'مشترك بالمنصة',
  activity_owner: 'مالك نشاط / رحلة',
  equipment_owner: 'مالك معدة',
  quad_owner: 'مالك باتش باجي',
  driver_vehicle_owner: 'سائق / مالك سيارة',
  crew_rep: 'طاقم تشغيل / مندوب'
};

export const PERSON_STATUS_LABELS: Record<PersonSubscriptionStatus, string> = {
  native_member: 'عضو مشترك أساسي',
  external_pending: 'مضاف مؤقتاً لحين الاشتراك',
  claim_requested: 'طلب تحقق وموافقة معلق',
  subscribed_isolated: 'مشترك ومعزول الصلاحيات'
};

export function normalizePhoneNumber(phone?: string): string {
  const digits = (phone || '').replace(/[^\d+]/g, '').trim();
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith('01') && digits.length === 11) return `+2${digits}`;
  if (digits.startsWith('201') && digits.length === 12) return `+${digits}`;
  return digits;
}
