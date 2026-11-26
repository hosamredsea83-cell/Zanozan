import type { EntityAuditTrail } from './audit';

export type MasterGroupScope = 'activity_spec' | 'equipment_library';

export interface SpecGroupRecord extends Partial<EntityAuditTrail> {
  id: string;
  name: string;
  scope: MasterGroupScope;
  description?: string;
  order: number;
  isActive: boolean;
  linkedCategoryIds: string[];
  excludedCategoryIds: string[];
  linkedUnitKindIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type InclusionKind = 'included' | 'excluded';

export interface InclusionCatalogItem extends Partial<EntityAuditTrail> {
  id: string;
  kind: InclusionKind;
  label: string;
  isActive: boolean;
  linkedCategoryIds: string[];
  excludedCategoryIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type InheritanceMatchStatus = 'direct' | 'inherited' | 'excluded' | 'none';

export interface InheritanceResolution {
  status: InheritanceMatchStatus;
  sourceCategoryId?: string;
  sourceCategoryName?: string;
}

export type AssetCatalogScope = 'equipment' | 'logistics' | 'both';

export interface EquipmentUnitKindItem extends Partial<EntityAuditTrail> {
  id: string;
  name: string;
  domainScope: AssetCatalogScope;
  defaultCategoryId?: string;
  defaultTypeId?: string;
  linkedCategoryIds?: string[];
  excludedCategoryIds?: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManufacturerRecord extends Partial<EntityAuditTrail> {
  id: string;
  name: string;
  applicableTo: AssetCatalogScope;
  linkedUnitKindIds?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManufacturerModelRecord extends Partial<EntityAuditTrail> {
  id: string;
  manufacturerId: string;
  name: string;
  applicableTo: AssetCatalogScope;
  unitKindId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CountryRecord extends Partial<EntityAuditTrail> {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CityRecord extends Partial<EntityAuditTrail> {
  id: string;
  countryId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingPointRecord extends Partial<EntityAuditTrail> {
  id: string;
  countryId: string;
  cityId: string;
  name: string;
  pointType?: 'meeting_point' | 'site' | 'both';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

