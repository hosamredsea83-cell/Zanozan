import type { EntityAuditTrail } from './audit';

export interface MasterAddonItem extends EntityAuditTrail {
  id: string;
  title: string;
  category: string;
  unitLabel: string;
  suggestedPriceEGP: number;
  suggestedPriceEUR: number;
  description: string;
  isActive: boolean;
  linkedCategoryIds?: string[];
  excludedCategoryIds?: string[];
}

export const MASTER_ADDON_CATEGORIES = [
  'تصوير وتوثيق',
  'أطعمة ومشروبات',
  'معدات وتجهيزات',
  'نقل وضيافة VIP',
  'خدمات إرشاد ومرافقة',
  'تأمين وحماية'
] as const;
