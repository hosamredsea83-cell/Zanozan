import type { CustomerAudiencePricing } from './activity';

export type SupplierPlatformStatus = 'pending_signup' | 'subscribed';

export interface RegisteredSupplierRecord {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  tier: string;
  platformStatus: SupplierPlatformStatus;
  linkedPlatformUserId?: string;
  addedByUserId: string;
  addedByUserName: string;
  createdAt: string;
  subscribedAt?: string;
}

export interface SupplierPricingJournalEntry {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCompany: string;
  supplierPhone: string;
  recordedByUserId: string;
  recordedByUserName: string;
  entityType: 'activity' | 'trip';
  entityId: string;
  entityName: string;
  pricingSnapshot: CustomerAudiencePricing;
  recordedAt: string;
  status: 'recorded_for_supplier' | 'transferred_to_supplier';
  claimedUserId?: string;
  notes?: string;
}
