import type {
  EquipmentOwnershipType,
  EquipmentSpecFieldType,
  EquipmentSpecFieldValue,
  EquipmentSpecGroupValue,
  EquipmentStatus,
  EquipmentTypeDefinition
} from '../../types/equipment';
import type { PartnerType } from '../../types/partner';

export const STATUS_META: Record<EquipmentStatus, { label: string; className: string }> = {
  available: {
    label: 'متاحة وجاهزة للتشغيل',
    className: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50'
  },
  in_use: {
    label: 'قيد التشغيل في نشاط',
    className: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/50'
  },
  maintenance: {
    label: 'تحت الصيانة / الفحص',
    className: 'bg-amber-950/70 text-amber-300 border-amber-800/50'
  },
  inactive: {
    label: 'متوقفة مؤقتاً',
    className: 'bg-slate-800 text-slate-300 border-slate-700'
  }
};

export const OWNERSHIP_LABELS: Record<EquipmentOwnershipType, string> = {
  owned: 'ملكية خاصة لصاحب النشاط',
  rented: 'مستأجرة بعقد تشغيل',
  partner_shared: 'مشاركة تشغيل مع شريك'
};

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  operating_partner: 'شريك تشغيل',
  rental_supplier: 'مورد تأجير معدات',
  fleet_owner: 'مالك وحدات / أسطول'
};

export const MAINTENANCE_LABELS: Record<'ready' | 'needs_check' | 'in_maintenance', string> = {
  ready: 'جاهزة ومعتمدة',
  needs_check: 'تحتاج مراجعة فنية',
  in_maintenance: 'قيد الصيانة الدورية'
};

export const FIELD_TYPE_LABELS: Record<EquipmentSpecFieldType, string> = {
  text: 'نص',
  number: 'رقم',
  boolean: 'نعم / لا',
  single_choice: 'اختيار فردي',
  multi_choice: 'اختيار متعدد'
};

export const buildDynamicSpecsFromType = (
  typeDef: EquipmentTypeDefinition,
  existingGroups: EquipmentSpecGroupValue[] = []
): EquipmentSpecGroupValue[] => {
  const existingFieldMap = new Map<string, EquipmentSpecFieldValue>();
  existingGroups.forEach((g) => {
    g.fields.forEach((f) => {
      existingFieldMap.set(f.key, f);
    });
  });

  const templateGroups: EquipmentSpecGroupValue[] = typeDef.specGroups.map((group) => ({
    groupId: group.id,
    title: group.title,
    fields: group.fields.map((def) => {
      const prev = existingFieldMap.get(def.key);
      return {
        fieldId: def.id,
        key: def.key,
        label: def.label,
        type: def.type,
        unit: def.unit,
        options: def.options,
        value: prev
          ? prev.value
          : def.defaultValue ??
            (def.type === 'boolean' ? false : def.type === 'multi_choice' ? [] : def.type === 'number' ? 0 : ''),
        isRequired: def.isRequired,
        isPublicForClient: prev ? prev.isPublicForClient : def.isPublicForClient,
        isCustom: false
      };
    })
  }));

  const customGroups = existingGroups
    .map((g) => ({
      ...g,
      fields: g.fields.filter((f) => f.isCustom)
    }))
    .filter((g) => g.fields.length > 0);

  return [...templateGroups, ...customGroups];
};
