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
