export type AuditActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'approve'
  | 'reject';

export type AuditDomainType =
  | 'equipment'
  | 'equipment_type'
  | 'equipment_property'
  | 'partner'
  | 'activity'
  | 'trip'
  | 'collection'
  | 'category'
  | 'logistics'
  | 'trip_combo'
  | 'booking'
  | 'finance'
  | 'operational_cost'
  | 'pricing'
  | 'favorites'
  | 'addon'
  | 'theme';

export interface EntityAuditTrail {
  createdById?: string;
  createdByName?: string;
  createdByCompany?: string;
  createdAtTime?: string;
  updatedById?: string;
  updatedByName?: string;
  updatedByCompany?: string;
  updatedAtTime?: string;
}

export interface AuditLogEntry {
  id: string;
  timestampIso: string;
  formattedDate: string;
  formattedTime: string;
  formattedDateTime: string;
  actorId: string;
  actorName: string;
  actorCompanyName: string;
  actorInitials: string;
  action: AuditActionType;
  domain: AuditDomainType;
  entityId: string;
  entityName: string;
  summary: string;
  details?: string;
}

export const AUDIT_ACTION_META: Record<
  AuditActionType,
  { label: string; badgeCls: string; textCls: string }
> = {
  create: {
    label: 'إضافة / إنشاء',
    badgeCls: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50',
    textCls: 'text-emerald-400'
  },
  update: {
    label: 'تعديل بيانات',
    badgeCls: 'bg-cyan-950/70 text-cyan-300 border-cyan-700/50',
    textCls: 'text-cyan-400'
  },
  delete: {
    label: 'حذف نهائي',
    badgeCls: 'bg-rose-950/75 text-rose-300 border-rose-700/50',
    textCls: 'text-rose-400'
  },
  status_change: {
    label: 'تغيير الحالة',
    badgeCls: 'bg-amber-950/70 text-amber-300 border-amber-700/50',
    textCls: 'text-amber-400'
  },
  approve: {
    label: 'اعتماد / موافقة',
    badgeCls: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50',
    textCls: 'text-emerald-400'
  },
  reject: {
    label: 'رفض / إرجاع',
    badgeCls: 'bg-rose-950/75 text-rose-300 border-rose-700/50',
    textCls: 'text-rose-400'
  }
};

export const AUDIT_DOMAIN_META: Record<
  AuditDomainType,
  { label: string; group: 'equipment' | 'activity' | 'logistics' | 'trips_bookings' | 'finance_pricing' | 'favorites' }
> = {
  equipment: { label: 'المعدات', group: 'equipment' },
  equipment_type: { label: 'أنواع المعدات', group: 'equipment' },
  equipment_property: { label: 'خصائص المعدات', group: 'equipment' },
  partner: { label: 'الشركاء', group: 'equipment' },
  activity: { label: 'الأنشطة', group: 'activity' },
  trip: { label: 'الرحلات', group: 'trips_bookings' },
  collection: { label: 'المجموعات والباقات', group: 'activity' },
  category: { label: 'التصنيفات', group: 'activity' },
  logistics: { label: 'وسائل النقل (اللوجستيات)', group: 'logistics' },
  trip_combo: { label: 'الرحلات المجمعة', group: 'trips_bookings' },
  booking: { label: 'الحجوزات', group: 'trips_bookings' },
  finance: { label: 'المعاملات المالية والمحافظ', group: 'finance_pricing' },
  operational_cost: { label: 'التكلفة التشغيلية', group: 'finance_pricing' },
  pricing: { label: 'أداة التسعير والخصائص', group: 'finance_pricing' },
  favorites: { label: 'المفضلة والملفات', group: 'favorites' },
  addon: { label: 'مكتبة الإضافات الاختيارية', group: 'activity' },
  theme: { label: 'تصميم القوالب والألوان والخطوط', group: 'activity' }
};

export function formatAuditTimestamp(date: Date = new Date()): {
  timestampIso: string;
  formattedDate: string;
  formattedTime: string;
  formattedDateTime: string;
} {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const formattedDate = `${year}-${month}-${day}`;
  const formattedTime = `${hours}:${minutes}:${seconds}`;
  return {
    timestampIso: date.toISOString(),
    formattedDate,
    formattedTime,
    formattedDateTime: `${formattedDate} · ${formattedTime}`
  };
}
