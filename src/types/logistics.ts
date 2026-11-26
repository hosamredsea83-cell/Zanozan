import type { AssetPersonCustodyMeta } from './personProfile';

export type LogisticsVehicleCategory =
  | 'tourist_bus'
  | 'hiace_van'
  | 'coaster_minibus'
  | 'limousine_sedan'
  | 'suv_4x4'
  | 'boat_shuttle';

export type LogisticsVehicleStatus = 'available' | 'on_route' | 'maintenance' | 'inactive';

export type LogisticsOwnershipType = 'owned' | 'rented' | 'partner_shared';

export interface LogisticsMediaItem {
  id: string;
  url: string;
  name: string;
  sizeBytes?: number;
  isCover?: boolean;
}

export interface LogisticsVehicle {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerCompanyName: string;
  name: string;
  category: LogisticsVehicleCategory;
  manufacturerId?: string;
  manufacturerName?: string;
  modelId?: string;
  modelName?: string;
  plateOrCode: string;
  modelYear?: string;
  country?: string;
  city: string;
  zone: string;
  passengerCapacity: number;
  driverName: string;
  driverPhone: string;
  ownershipType: LogisticsOwnershipType;
  partnerId?: string;
  partnerName?: string;
  partnerCompanyName?: string;
  personCustody?: AssetPersonCustodyMeta;
  pricePerTripEGP: number;
  pricePerTripEUR: number;
  status: LogisticsVehicleStatus;
  hasAC: boolean;
  hasGPS: boolean;
  notes: string;
  media: LogisticsMediaItem[];
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

export const LOGISTICS_CATEGORY_LABELS: Record<LogisticsVehicleCategory, string> = {
  tourist_bus: 'أتوبيس سياحي كبير',
  coaster_minibus: 'كوستر ميني باص',
  hiace_van: 'فان سياحي (هاي إس)',
  limousine_sedan: 'ليموزين خاصة VIP',
  suv_4x4: 'سيارة دفع رباعي 4x4',
  boat_shuttle: 'لنـش / قارب توصيل بحري'
};

export const LOGISTICS_STATUS_LABELS: Record<
  LogisticsVehicleStatus,
  { label: string; badgeCls: string; textCls: string }
> = {
  available: {
    label: 'متاحة وجاهزة',
    badgeCls: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50',
    textCls: 'text-emerald-400'
  },
  on_route: {
    label: 'في مهمة نقل',
    badgeCls: 'bg-cyan-950/70 text-cyan-300 border-cyan-700/50',
    textCls: 'text-cyan-400'
  },
  maintenance: {
    label: 'تحت الصيانة',
    badgeCls: 'bg-amber-950/70 text-amber-300 border-amber-700/50',
    textCls: 'text-amber-400'
  },
  inactive: {
    label: 'متوقفة مؤقتاً',
    badgeCls: 'bg-slate-900 text-slate-400 border-slate-700',
    textCls: 'text-slate-400'
  }
};

export const LOGISTICS_OWNERSHIP_LABELS: Record<LogisticsOwnershipType, string> = {
  owned: 'ملكية خاصة للشركة',
  rented: 'مستأجرة بعقد تشغيل',
  partner_shared: 'مشاركة تشغيل مع شريك'
};
