export type PartnerType = 'operating_partner' | 'rental_supplier' | 'fleet_owner';

export interface PartnerRecord {
  id: string;
  ownerId: string; // 'global' or company owner user.id
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  partnerType: PartnerType;
  tier: string;
  shareOrContractNote?: string;
  notes?: string;
  isActive: boolean;
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
