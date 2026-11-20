export type EquipmentSpecFieldType = 'text' | 'number' | 'boolean' | 'single_choice' | 'multi_choice';

export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'inactive';

export type EquipmentOwnershipType = 'owned' | 'rented' | 'partner_shared';

export interface EquipmentSpecFieldDef {
  id: string;
  key: string;
  label: string;
  type: EquipmentSpecFieldType;
  unit?: string;
  options?: string[];
  isRequired: boolean;
  isPublicForClient: boolean;
  defaultValue?: string | number | boolean | string[];
}

export interface EquipmentSpecGroupTemplate {
  id: string;
  title: string;
  fields: EquipmentSpecFieldDef[];
}

export interface EquipmentTypeDefinition {
  id: string;
  key: string;
  name: string;
  category: string;
  description?: string;
  specGroups: EquipmentSpecGroupTemplate[];
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentMediaItem {
  id: string;
  url: string;
  title: string;
  type: 'image' | 'video';
  isCover: boolean;
  isPublicForClient: boolean;
  youtubeUrl?: string;
  fileSizeBytes?: number;
}

export interface EquipmentSpecFieldValue {
  fieldId: string;
  key: string;
  label: string;
  type: EquipmentSpecFieldType;
  unit?: string;
  options?: string[];
  value: string | number | boolean | string[];
  isRequired: boolean;
  isPublicForClient: boolean;
  isCustom?: boolean;
}

export interface EquipmentSpecGroupValue {
  groupId: string;
  title: string;
  fields: EquipmentSpecFieldValue[];
}

export interface EquipmentExtraField {
  id: string;
  label: string;
  value: string;
  isPublicForClient: boolean;
}

export interface EquipmentItem {
  id: string; // Independent Equipment ID (e.g., EQ-1001)
  ownerId: string;
  ownerName: string;
  ownerCompanyName: string;
  name: string;
  typeId: string; // Links dynamically to EquipmentTypeDefinition.id
  classification: string;
  description: string;
  media: EquipmentMediaItem[];
  operationalData: {
    serialOrRegistrationNo?: string;
    modelYear?: string;
    capacityOrUnitLabel?: string;
    maintenanceStatus: 'ready' | 'needs_check' | 'in_maintenance';
    lastInspectionDate?: string;
    internalNotes?: string; // Strictly internal - never displayed to clients
  };
  status: EquipmentStatus;
  ownershipType: EquipmentOwnershipType;
  ownershipDetails?: string;
  partnerId?: string;
  partnerName?: string;
  partnerCompanyName?: string;
  rentalContractRef?: string;
  dynamicSpecs: EquipmentSpecGroupValue[];
  extraData: EquipmentExtraField[];
  showToClientDefault: boolean;
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

export interface EquipmentCategoryOption {
  id: string;
  label: string;
  icon: string;
  linkedCategoryId?: string;
}

export interface EquipmentPropertyItem {
  id: string;
  category: string;
  key: string;
  label: string;
  type: EquipmentSpecFieldType;
  unit?: string;
  options?: string[];
  isMandatoryDefault: boolean;
  isPublicDefault: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

