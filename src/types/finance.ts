export type FinancialPartyRole = 
  | 'company'            // الشركة السياحية
  | 'activity_owner'     // صاحب النشاط
  | 'employee'           // الموظف
  | 'delegate'           // المندوب
  | 'driver'             // السائق
  | 'tour_guide'         // المرافق السياحي
  | 'operator';          // المنفذ

export type ManualCashierRole =
  | 'company_employee'   // موظف الشركة
  | 'company_delegate'   // مندوب الشركة
  | 'operator'           // المنفذ
  | 'activity_owner'     // صاحب النشاط
  | 'driver';            // السائق

export type PaymentMethodType = 'manual_cash' | 'qr_code' | 'company_receipt' | 'vodafone_cash';

export type PaymentPlanType = 'full' | 'deposit' | 'installments';

export type CollectionStatus = 'pending_confirmation' | 'confirmed' | 'rejected';

export type TransferStatus = 
  | 'sending' 
  | 'waiting_recipient_approval' 
  | 'received' 
  | 'rejected' 
  | 'cancelled' 
  | 'needs_financial_admin_review';

export interface Wallet {
  id: string;
  partyId: string;
  partyName: string;
  role: FinancialPartyRole;
  organization: string;
  balanceEUR: number;              // العملة المرجعية للمحاسبة
  cashOnHandEGP: number;           // المبالغ المستلمة بالجنيه
  cashOnHandEUR: number;           // المبالغ المستلمة باليورو
  pendingTransfersEUR: number;
  creditLimitEUR: number;          // السقف الائتماني للرصيد السالب
  minRequiredBalanceEUR: number;   // الحد الأدنى الإلزامي
  warningThresholdEUR: number;     // حد التنبيه
  isBlockedDueToDeficit: boolean;  // إيقاف استقبال الطلبات عند كسر الحد الأدنى
  qrToken: string;
  avatarUrl?: string;
  phone?: string;
}

export interface SelectedPaidAddonItem {
  id: string;
  addonId?: string;
  title: string;
  unitLabel?: string;
  unitPriceEGP: number;
  unitPriceEUR: number;
  quantity: number;
  stage?: 'checkout' | 'collection' | 'during_trip';
}

export interface CollectionRecord {
  id: string;
  bookingRef: string;
  activityId: string;
  activityTitle: string;
  collectorName: string;
  collectorRole: ManualCashierRole;
  collectorOrg: string;
  receivedAmount: number;
  receivedCurrency: 'EGP' | 'EUR';
  lockedExchangeRate: number;       // e.g. 50.0 EGP per 1 EUR (fixed forever)
  accountingValueEUR: number;       // Calculated EUR
  collectedAt: string;
  receiptProofUrl?: string;
  receiptNumber?: string;
  status: CollectionStatus;
  planType: PaymentPlanType;
  totalBookingCostEUR: number;
  totalPaidEUR: number;
  remainingAmountEUR: number;
  selectedPaidAddons?: SelectedPaidAddonItem[];
  notes?: string;
}

export interface TransferTransaction {
  id: string;
  senderWalletId: string;
  senderName: string;
  senderRole: FinancialPartyRole;
  recipientWalletId: string;
  recipientName: string;
  recipientRole: FinancialPartyRole;
  amount: number;
  currency: 'EGP' | 'EUR';
  accountingValueEUR: number;
  transferMethod: 'qr_code' | 'company_receipt' | 'vodafone_cash';
  vodafoneCashNumber?: string;
  vodafoneTransactionId?: string;
  receiptImage?: string;
  qrCodeScanTime?: string;
  status: TransferStatus;
  createdAt: string;
  decidedAt?: string;
  rejectionReason?: string;
  refundedAutomatically?: boolean;
  reviewedBySiyahiaAdmin?: boolean;
}

export interface FinancialSettlement {
  id: string;
  requestedByOwnerId: string;
  ownerName: string;
  amountEUR: number;
  reason: string;
  originalTransactionId?: string;
  supportingDocumentUrl?: string;
  createdAt: string;
  status: 'pending_siyahia_review' | 'approved_by_admin' | 'rejected_by_admin';
  siyahiaAuditorDecision?: {
    auditorName: string;
    decisionDate: string;
    decisionNotes: string;
    approved: boolean;
  };
}

export interface FinancialAuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actionType: 'collection' | 'transfer' | 'rejection_refund' | 'settlement_request' | 'admin_settlement_approval' | 'credit_lock';
  details: string;
  impactEUR: number;
}

export interface InTripAddonRequestRecord {
  id: string;
  requestCode: string;
  createdAt: string;
  tripDate: string;
  customerPhone: string;
  customerName: string;
  customerType: 'egyptian' | 'foreigner';
  targetKind: 'activity' | 'trip';
  targetId: string;
  targetTitle: string;
  linkedBookingId?: string;
  linkedBookingKind?: 'activity_booking' | 'trip_booking';
  linkedBookingCode?: string;
  items: SelectedPaidAddonItem[];
  totalAddedEGP: number;
  totalAddedEUR: number;
  notes?: string;
}

export interface CustomerReviewRecord {
  id: string;
  targetKind: 'activity' | 'trip';
  targetId: string;
  targetTitle: string;
  customerName: string;
  customerPhone?: string;
  rating: number;
  comment: string;
  createdAt: string;
  verifiedBookingCode?: string;
}

export const INITIAL_CUSTOMER_REVIEWS: CustomerReviewRecord[] = [
  {
    id: 'rev-seed-1',
    targetKind: 'activity',
    targetId: 'act-yacht-01',
    targetTitle: 'رحلة يخت ملكي VIP خاص - جزيرة الجفتون',
    customerName: 'كريم الشاذلي',
    rating: 5,
    comment: 'يخت نظيف جداً وطاقم محترف للغاية، وجبة الغداء البحرية كانت ممتازة والالتزام بالمواعيد دقيق.',
    createdAt: '2026-11-01',
    verifiedBookingCode: 'ZN-77210'
  },
  {
    id: 'rev-seed-2',
    targetKind: 'activity',
    targetId: 'act-diving-03',
    targetTitle: 'تجربة الغوص الاحترافي واستكشاف حطام السفن',
    customerName: 'Marcus Becker',
    rating: 5,
    comment: 'Excellent diving instructors, well-maintained equipment, and safe briefing before every dive.',
    createdAt: '2026-11-04',
    verifiedBookingCode: 'ZN-78044'
  },
  {
    id: 'rev-seed-3',
    targetKind: 'trip',
    targetId: 'trp-bk-204',
    targetTitle: 'رحلة جماعية منظمة - سنوركلينج شعاب الفانوس والدلافين',
    customerName: 'أ. سارة عبد الرحمن',
    customerPhone: '+20 111 320 4490',
    rating: 4,
    comment: 'رحلة منظمة وممتعة جداً مع الأطفال، شاهدنا الدلافين وكانت تجربة رائعة.',
    createdAt: '2026-11-12',
    verifiedBookingCode: 'TR-5107'
  }
];

export type DriverMissionStatus =
  | 'assigned'
  | 'en_route'
  | 'picked_up'
  | 'arrived'
  | 'completed';

export interface DriverMissionRecord {
  bookingId: string;
  bookingKind: 'activity_booking' | 'trip_booking';
  status: DriverMissionStatus;
  assignedDriverName?: string;
  assignedVehicleId?: string;
  assignedVehicleName?: string;
  updatedAt: string;
  driverNotes?: string;
}

export interface ResourceMaintenanceBlock {
  id: string;
  resourceKind: 'equipment' | 'vehicle';
  resourceId: string;
  resourceName: string;
  startDate: string;
  endDate: string;
  reason: string;
  licenseExpiryDate?: string;
  createdAt: string;
}

export type BookingPayoutPartnerRole =
  | 'activity_owner'
  | 'driver'
  | 'equipment_owner'
  | 'tour_guide'
  | 'delegate'
  | 'platform';

export interface BookingPartnerPayoutItem {
  id: string;
  partnerKey: string;
  partnerRole: BookingPayoutPartnerRole;
  partyUserId?: string;
  partyProfileId?: string;
  partyName: string;
  walletId?: string;
  amountEGP: number;
  amountEUR: number;
  calculationNote: string;
  status: 'credited' | 'settled' | 'reversed';
}

export interface BookingFinancialAllocation {
  bookingId: string;
  bookingCode: string;
  bookingKind: 'activity_booking' | 'trip_booking';
  entityId: string;
  entityName: string;
  tripDate: string;
  customerName: string;
  currency: 'EGP' | 'EUR';
  eurToEgpRate: number;
  grossTotalEGP: number;
  grossTotalEUR: number;
  paidNowEGP: number;
  paidNowEUR: number;
  platformFeeEGP: number;
  platformFeeEUR: number;
  ownerUserId?: string;
  ownerName: string;
  ownerNetEGP: number;
  ownerNetEUR: number;
  payouts: BookingPartnerPayoutItem[];
  status: 'pending_payment' | 'posted' | 'partially_refunded' | 'refunded';
  refundedEGP: number;
  refundedEUR: number;
  updatedAt: string;
}


