import type { CustomTechnicalSpecItem } from '../types/activity';
import type {
  EquipmentCategoryOption,
  EquipmentItem,
  EquipmentPropertyItem,
  EquipmentTypeDefinition
} from '../types/equipment';
import {
  CUSTOM_TECHNICAL_SPECS_STORE_NAME,
  EQUIPMENTS_STORE_NAME,
  EQUIPMENT_PROPERTIES_STORE_NAME,
  EQUIPMENT_TYPES_STORE_NAME,
  ensureOneTimeV6CleanReset,
  openUnifiedLocalDb
} from './unifiedLocalDb';

const V6_SPECS_SEED_FLAG_KEY = 'zanoza_v6_specs_equipment_seeded_v1';
const LS_EQ_PROPS_FALLBACK = 'zanoza_db_equipment_properties_v6';
const LS_EQ_TYPES_FALLBACK = 'zanoza_db_equipment_types_v6';
const LS_EQUIPMENTS_FALLBACK = 'zanoza_db_equipments_v6';
const LS_CUSTOM_SPECS_FALLBACK = 'zanoza_db_custom_technical_specs_v6';

export const REAL_EQUIPMENT_CATEGORIES: EquipmentCategoryOption[] = [
  {
    id: 'yacht',
    label: 'اليخوت والمراكب البحرية',
    icon: '⛵',
    linkedCategoryId: 'cat-marine'
  },
  {
    id: 'diving_gear',
    label: 'معدات الغوص والسنوركلينج',
    icon: '🤿',
    linkedCategoryId: 'cat-diving'
  },
  {
    id: 'safari_vehicle',
    label: 'مركبات ودراجات السفاري',
    icon: '🏜️',
    linkedCategoryId: 'cat-safari'
  },
  {
    id: 'leisure_gear',
    label: 'الغواصات والألعاب المائية والفروسية',
    icon: '🚤',
    linkedCategoryId: 'cat-leisure'
  }
];

const TODAY_ISO = '2026-11-01';

export function buildInitialEquipmentProperties(): EquipmentPropertyItem[] {
  return [
    // 1. اليخوت والمراكب البحرية (grp-eq-yacht -> cat-marine)
    {
      id: 'eqp-yacht-length',
      groupId: 'grp-eq-yacht',
      category: 'yacht',
      key: 'yacht_length_m',
      label: 'طول الوحدة البحرية',
      type: 'number',
      unit: 'متر',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'الطول الإجمالي لليخت أو المركب أو القارب السريع',
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-yacht', 'uk-sea-boat', 'uk-nile-boat', 'uk-launch'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-yacht-capacity',
      groupId: 'grp-eq-yacht',
      category: 'yacht',
      key: 'max_passengers',
      label: 'السعة القصوى للركاب',
      type: 'number',
      unit: 'راكب',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'الحد الأقصى المرخص للركاب على متن الوحدة البحرية',
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-yacht', 'uk-sea-boat', 'uk-nile-boat', 'uk-launch'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-yacht-cabins',
      groupId: 'grp-eq-yacht',
      category: 'yacht',
      key: 'cabins_count',
      label: 'عدد الكبائن المكيفة',
      type: 'number',
      unit: 'كابينة',
      isMandatoryDefault: false,
      isPublicDefault: true,
      description: 'عدد الكبائن الفندقية المكيفة على متن اليخت أو المركب السياحي',
      linkedCategoryIds: ['cat-marine-yacht-vip', 'cat-marine-yacht-shared'],
      excludedCategoryIds: ['cat-marine-speedboat'],
      linkedUnitKindIds: ['uk-yacht', 'uk-nile-boat'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-yacht-engines',
      groupId: 'grp-eq-yacht',
      category: 'yacht',
      key: 'engine_power_hp',
      label: 'قدرة المحركات الإجمالية',
      type: 'text',
      unit: 'حصان',
      isMandatoryDefault: true,
      isPublicDefault: false,
      description: 'تفاصيل المحركات للتشغيل الفني والصيانة',
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-yacht', 'uk-sea-boat', 'uk-launch'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-boat-hull',
      groupId: 'grp-eq-yacht',
      category: 'yacht',
      key: 'boat_hull_material',
      label: 'خامة هيكل المركب / القارب',
      type: 'single_choice',
      options: ['فيبر جلاس', 'خشب تقليدي', 'فولاذ / ألومنيوم'],
      isMandatoryDefault: false,
      isPublicDefault: true,
      description: 'خامة تصنيع الهيكل البحري للمركب أو اليخت أو اللانش',
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-sea-boat', 'uk-nile-boat', 'uk-launch', 'uk-yacht'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-boat-decks',
      groupId: 'grp-eq-yacht',
      category: 'yacht',
      key: 'boat_decks_count',
      label: 'عدد الطوابق / المساحات المظللة',
      type: 'number',
      unit: 'طابق',
      isMandatoryDefault: false,
      isPublicDefault: true,
      description: 'عدد طوابق الجلوس والسطح العلوي المجهز للشمس',
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-sea-boat', 'uk-nile-boat', 'uk-yacht'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-boat-toilet',
      groupId: 'grp-eq-yacht',
      category: 'yacht',
      key: 'boat_has_shade_restroom',
      label: 'توفر حمام ومظلة شمسية على المركب',
      type: 'boolean',
      isMandatoryDefault: false,
      isPublicDefault: true,
      description: 'جاهزية المركب بدورة مياه ومظلة حماية من الشمس للرحلات الطويلة',
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-sea-boat', 'uk-nile-boat', 'uk-launch', 'uk-yacht'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },

    // 2. معدات الغوص والسنوركلينج (grp-eq-diving -> cat-diving)
    {
      id: 'eqp-div-tank',
      groupId: 'grp-eq-diving',
      category: 'diving_gear',
      key: 'tank_capacity_liters',
      label: 'سعة أسطوانة الغوص',
      type: 'number',
      unit: 'لتر',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'السعة القياسية لأسطوانة الهواء المضغوط',
      linkedCategoryIds: ['cat-diving-intro', 'cat-diving-pro'],
      excludedCategoryIds: ['cat-diving-snorkel'],
      linkedUnitKindIds: ['uk-diving'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-div-nitrox',
      groupId: 'grp-eq-diving',
      category: 'diving_gear',
      key: 'nitrox_compatible',
      label: 'دعم غاز النيتروكس (Nitrox)',
      type: 'boolean',
      isMandatoryDefault: false,
      isPublicDefault: true,
      description: 'جاهزية الأسطوانات والمنظمات لخليط النيتروكس',
      linkedCategoryIds: ['cat-diving-pro'],
      excludedCategoryIds: ['cat-diving-snorkel', 'cat-diving-intro'],
      linkedUnitKindIds: ['uk-diving'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-div-suit',
      groupId: 'grp-eq-diving',
      category: 'diving_gear',
      key: 'wetsuit_thickness_mm',
      label: 'سُمك بدلة الغوص والسنوركلينج',
      type: 'single_choice',
      options: ['3 ملم صيفي', '5 ملم متعدد المواسم', '7 ملم شتوي'],
      isMandatoryDefault: false,
      isPublicDefault: true,
      description: 'سمك بدلة الحماية الحرارية المتاحة مع الطقم',
      linkedCategoryIds: ['cat-diving'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-diving'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },

    // 3. مركبات ودراجات السفاري (grp-eq-safari -> cat-safari)
    {
      id: 'eqp-saf-cc',
      groupId: 'grp-eq-safari',
      category: 'safari_vehicle',
      key: 'engine_displacement_cc',
      label: 'سعة وقوة المحرك',
      type: 'number',
      unit: 'CC',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'قدرة المحرك بالـ CC للدراجة أو مركبة السفاري',
      linkedCategoryIds: ['cat-safari-quad', 'cat-safari-4x4'],
      excludedCategoryIds: ['cat-safari-bedouin'],
      linkedUnitKindIds: ['uk-quad-buggy', 'uk-safari-4x4'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-saf-trans',
      groupId: 'grp-eq-safari',
      category: 'safari_vehicle',
      key: 'transmission_type',
      label: 'نظام ناقل الحركة',
      type: 'single_choice',
      options: ['أوتوماتيك بالكامل', 'نصف أوتوماتيك', 'دفع رباعي 4x4'],
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'نوع ناقل الحركة لتسهيل الاستخدام للمبتدئين',
      linkedCategoryIds: ['cat-safari-quad', 'cat-safari-4x4'],
      excludedCategoryIds: ['cat-safari-bedouin'],
      linkedUnitKindIds: ['uk-quad-buggy', 'uk-safari-4x4'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-saf-seats',
      groupId: 'grp-eq-safari',
      category: 'safari_vehicle',
      key: 'vehicle_seats_count',
      label: 'عدد مقاعد المركبة',
      type: 'number',
      unit: 'مقعد',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'العدد المصرح به للركاب في المركبة الواحدة',
      linkedCategoryIds: ['cat-safari'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-quad-buggy', 'uk-safari-4x4'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },

    // 4. الغواصات والألعاب المائية والفروسية (grp-eq-leisure -> cat-leisure)
    {
      id: 'eqp-lei-depth',
      groupId: 'grp-eq-leisure',
      category: 'leisure_gear',
      key: 'viewing_depth_or_alt',
      label: 'عمق المشاهدة / ارتفاع التحليق',
      type: 'number',
      unit: 'متر',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'عمق الكابينة الزجاجية تحت الماء أو ارتفاع الباراشوت',
      linkedCategoryIds: ['cat-leisure-glassboat', 'cat-leisure-watersports'],
      excludedCategoryIds: ['cat-leisure-equestrian-nile'],
      linkedUnitKindIds: ['uk-glassboat', 'uk-watersports'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-lei-breed',
      groupId: 'grp-eq-leisure',
      category: 'leisure_gear',
      key: 'craft_or_breed_class',
      label: 'الطراز / سلالة الفروسية',
      type: 'single_choice',
      options: [
        'كابينة بانورامية مكيفة',
        'باراشوت زوجي/ثلاثي',
        'خيل عربي أصيل مسجل',
        'فلوكة شراعية نيلية'
      ],
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'تصنيف الوحدة المخصصة للتجربة الترفيهية أو الشاطئية',
      linkedCategoryIds: ['cat-leisure'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-glassboat', 'uk-watersports', 'uk-nile-boat'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-lei-payload',
      groupId: 'grp-eq-leisure',
      category: 'leisure_gear',
      key: 'safe_payload_kg',
      label: 'الحد الأقصى للوزن الآمن',
      type: 'number',
      unit: 'كجم',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'أقصى حمولة أو وزن مسموح به لضمان السلامة التشغيلية',
      linkedCategoryIds: ['cat-leisure'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-glassboat', 'uk-watersports', 'uk-nile-boat'],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    }
  ];
}

export function buildInitialEquipmentTypes(
  props: EquipmentPropertyItem[]
): EquipmentTypeDefinition[] {
  const categoryLinksMap: Record<string, { linked: string[]; excluded: string[] }> = {
    yacht: { linked: ['cat-marine'], excluded: [] },
    diving_gear: { linked: ['cat-diving'], excluded: [] },
    safari_vehicle: { linked: ['cat-safari'], excluded: ['cat-safari-bedouin'] },
    leisure_gear: { linked: ['cat-leisure'], excluded: [] }
  };

  return REAL_EQUIPMENT_CATEGORIES.map((cat) => {
    const matchingProps = props.filter((p) => p.category === cat.id);
    const linkCfg = categoryLinksMap[cat.id] || {
      linked: cat.linkedCategoryId ? [cat.linkedCategoryId] : [],
      excluded: []
    };
    return {
      id: `eqt-${cat.id}`,
      key: cat.id,
      name: cat.label,
      category: cat.label,
      description: `قالب المواصفات المرجعي لفئة ${cat.label} والمربوط بالمرجع الموحد`,
      linkedCategoryIds: linkCfg.linked,
      excludedCategoryIds: linkCfg.excluded,
      specGroups: [
        {
          id: `eqsg-${cat.id}-main`,
          title: `مواصفات ${cat.label}`,
          fields: matchingProps.map((p) => ({
            id: p.id,
            key: p.key,
            label: p.label,
            type: p.type,
            unit: p.unit,
            options: p.options,
            isRequired: p.isMandatoryDefault,
            isPublicForClient: p.isPublicDefault,
            defaultValue:
              p.type === 'boolean'
                ? false
                : p.type === 'multi_choice'
                ? []
                : p.type === 'number'
                ? 0
                : p.options?.[0] ?? ''
          }))
        }
      ],
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    };
  });
}

export function buildInitialStarterEquipments(
  types: EquipmentTypeDefinition[]
): EquipmentItem[] {
  const typeByKey = new Map(types.map((t) => [t.key, t]));
  const mkSpecs = (key: string, values: Record<string, string | number | boolean | string[]>) => {
    const def = typeByKey.get(key);
    if (!def) return [];
    return def.specGroups.map((g) => ({
      groupId: g.id,
      title: g.title,
      fields: g.fields.map((f) => ({
        fieldId: f.id,
        key: f.key,
        label: f.label,
        type: f.type,
        unit: f.unit,
        options: f.options,
        value: values[f.key] ?? f.defaultValue ?? '',
        isRequired: f.isRequired,
        isPublicForClient: f.isPublicForClient
      }))
    }));
  };

  return [
    {
      id: 'EQ-MAR-101',
      ownerId: 'user-ahmed',
      ownerName: 'أحمد الشناوي',
      ownerCompanyName: 'الشناوي مارين لليخوت والرحلات البحرية',
      name: 'يخت رويال أزور الفاخر 32 متر',
      typeId: 'eqt-yacht',
      linkedCategoryIds: ['cat-marine'],
      classification: 'الأنشطة البحرية واليخوت',
      description: 'يخت خاص ثلاثي الطوابق مجهز بـ 4 كبائن VIP ومنصة سباحة ونظام ملاحة متكامل',
      media: [],
      operationalData: {
        serialOrRegistrationNo: 'HRG-YCT-3201',
        modelYear: '2024',
        capacityOrUnitLabel: '24 راكب VIP',
        maintenanceStatus: 'ready',
        lastInspectionDate: TODAY_ISO
      },
      status: 'available',
      ownershipType: 'owned',
      dynamicSpecs: mkSpecs('yacht', {
        yacht_length_m: 32,
        max_passengers: 24,
        cabins_count: 4,
        engine_power_hp: '2 × 1200 حصان MAN'
      }),
      extraData: [],
      showToClientDefault: true,
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO,
      createdById: 'user-ahmed',
      createdByName: 'أحمد الشناوي',
      createdByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      createdAtTime: '2026-11-01 · 08:00:00'
    },
    {
      id: 'EQ-MAR-102',
      ownerId: 'user-ahmed',
      ownerName: 'أحمد الشناوي',
      ownerCompanyName: 'الشناوي مارين لليخوت والرحلات البحرية',
      name: 'لانش سبيد بوت دولفين 900',
      typeId: 'eqt-yacht',
      linkedCategoryIds: ['cat-marine-speedboat'],
      classification: 'القوارب السريعة والجولات البحرية',
      description: 'قارب سريع مزدوج المحرك مثالي لرحلات الجزر السريعة ورصد الدلافين',
      media: [],
      operationalData: {
        serialOrRegistrationNo: 'HRG-SPD-904',
        modelYear: '2025',
        capacityOrUnitLabel: '10 ركاب',
        maintenanceStatus: 'ready',
        lastInspectionDate: TODAY_ISO
      },
      status: 'available',
      ownershipType: 'owned',
      dynamicSpecs: mkSpecs('yacht', {
        yacht_length_m: 11,
        max_passengers: 10,
        cabins_count: 0,
        engine_power_hp: '2 × 250 حصان Yamaha'
      }),
      extraData: [],
      showToClientDefault: true,
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO,
      createdById: 'user-ahmed',
      createdByName: 'أحمد الشناوي',
      createdByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      createdAtTime: '2026-11-01 · 08:00:00'
    },
    {
      id: 'EQ-DIV-201',
      ownerId: 'user-tarek',
      ownerName: 'طارق السويفي',
      ownerCompanyName: 'بلو أوشن للغوص والأنشطة البحرية',
      name: 'طقم غوص احترافي Aqualung Nitrox Pro',
      typeId: 'eqt-diving_gear',
      linkedCategoryIds: ['cat-diving'],
      classification: 'الغوص والسنوركلينج',
      description: 'أطقم غوص متكاملة ومعقمة تشمل أسطوانة 12 لتر ومنظم وجاكيت توازن وكمبيوتر غوص',
      media: [],
      operationalData: {
        serialOrRegistrationNo: 'BLU-DIV-120',
        modelYear: '2025',
        capacityOrUnitLabel: '20 طقم كامل',
        maintenanceStatus: 'ready',
        lastInspectionDate: TODAY_ISO
      },
      status: 'available',
      ownershipType: 'owned',
      dynamicSpecs: mkSpecs('diving_gear', {
        tank_capacity_liters: 12,
        nitrox_compatible: true,
        wetsuit_thickness_mm: '5 ملم متعدد المواسم'
      }),
      extraData: [],
      showToClientDefault: true,
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO,
      createdById: 'user-tarek',
      createdByName: 'طارق السويفي',
      createdByCompany: 'بلو أوشن للغوص والأنشطة البحرية',
      createdAtTime: '2026-11-01 · 08:00:00'
    },
    {
      id: 'EQ-SAF-301',
      ownerId: 'user-mohamed',
      ownerName: 'محمد عبد الرحمن',
      ownerCompanyName: 'رد سي إكستريم لسفاري الصحراء والبيتش باجي',
      name: 'دراجة بيتش باجي بولاريس 450 CC',
      typeId: 'eqt-safari_vehicle',
      linkedCategoryIds: ['cat-safari-quad'],
      classification: 'سفاري بيتش باجي وكواد',
      description: 'دراجة صحراوية أوتوماتيك بالكامل مع نظام تعليق جبلي وهيكل حماية أمان',
      media: [],
      operationalData: {
        serialOrRegistrationNo: 'RDS-ATV-450',
        modelYear: '2025',
        capacityOrUnitLabel: '1-2 راكب لكل دراجة',
        maintenanceStatus: 'ready',
        lastInspectionDate: TODAY_ISO
      },
      status: 'available',
      ownershipType: 'owned',
      dynamicSpecs: mkSpecs('safari_vehicle', {
        engine_displacement_cc: 450,
        transmission_type: 'أوتوماتيك بالكامل',
        vehicle_seats_count: 2
      }),
      extraData: [],
      showToClientDefault: true,
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO,
      createdById: 'user-mohamed',
      createdByName: 'محمد عبد الرحمن',
      createdByCompany: 'رد سي إكستريم لسفاري الصحراء والبيتش باجي',
      createdAtTime: '2026-11-01 · 08:00:00'
    },
    {
      id: 'EQ-LEI-401',
      ownerId: 'user-ahmed',
      ownerName: 'أحمد الشناوي',
      ownerCompanyName: 'الشناوي مارين لليخوت والرحلات البحرية',
      name: 'مركب نصف غواصة بانورامي SeaScope Glass',
      typeId: 'eqt-leisure_gear',
      linkedCategoryIds: ['cat-leisure-glassboat'],
      classification: 'الغواصات والمراكب الزجاجية',
      description: 'وحدة مشاهدة تحت الماء بكابينة زجاجية مكيفة على عمق 4 أمتار لمشاهدة الشعاب',
      media: [],
      operationalData: {
        serialOrRegistrationNo: 'HRG-SUB-401',
        modelYear: '2024',
        capacityOrUnitLabel: '40 راكب',
        maintenanceStatus: 'ready',
        lastInspectionDate: TODAY_ISO
      },
      status: 'available',
      ownershipType: 'owned',
      dynamicSpecs: mkSpecs('leisure_gear', {
        viewing_depth_or_alt: 4,
        craft_or_breed_class: 'كابينة بانورامية مكيفة',
        safe_payload_kg: 3200
      }),
      extraData: [],
      showToClientDefault: true,
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO,
      createdById: 'user-ahmed',
      createdByName: 'أحمد الشناوي',
      createdByCompany: 'الشناوي مارين لليخوت والرحلات البحرية',
      createdAtTime: '2026-11-01 · 08:00:00'
    }
  ];
}

export function buildInitialCustomTechnicalSpecs(): CustomTechnicalSpecItem[] {
  return [
    // Group 1: grp-marine-voyage (cat-marine)
    {
      id: 'cspec-marine-stops',
      groupId: 'grp-marine-voyage',
      groupTitle: 'مواصفات الرحلة البحرية واليخت',
      label: 'عدد وقفات السباحة والسنوركلينج',
      type: 'number',
      unit: 'وقفة',
      defaultValue: 2,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 1,
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: []
    },
    {
      id: 'cspec-marine-island',
      groupId: 'grp-marine-voyage',
      groupTitle: 'مواصفات الرحلة البحرية واليخت',
      label: 'شامل النزول إلى شاطئ الجزيرة',
      type: 'boolean',
      defaultValue: true,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 2,
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: []
    },
    {
      id: 'cspec-marine-dock',
      groupId: 'grp-marine-voyage',
      groupTitle: 'مواصفات الرحلة البحرية واليخت',
      label: 'نوع ومرونة المسار البحري',
      type: 'single_choice',
      defaultValue: 'مسار بحري مرن حسب حالة الطقس',
      options: ['مسار بحري محدد للجزر', 'مسار بحري مرن حسب حالة الطقس', 'رحلة غروب ساحلية'],
      isPublicForClient: true,
      isRequired: false,
      isActive: true,
      order: 3,
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: []
    },

    // Group 2: grp-marine-vip-hospitality (cat-marine-yacht-vip only)
    {
      id: 'cspec-vip-chef',
      groupId: 'grp-marine-vip-hospitality',
      groupTitle: 'ضيافة وتجهيزات اليخت VIP',
      label: 'توافر شيف خاص وطاقم ضيافة VIP على اليخت',
      type: 'boolean',
      defaultValue: true,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 4,
      linkedCategoryIds: ['cat-marine-yacht-vip'],
      excludedCategoryIds: []
    },
    {
      id: 'cspec-vip-jacuzzi',
      groupId: 'grp-marine-vip-hospitality',
      groupTitle: 'ضيافة وتجهيزات اليخت VIP',
      label: 'جاكوزي ومنطقة استرخاء علوية خاصة',
      type: 'boolean',
      defaultValue: true,
      isPublicForClient: true,
      isRequired: false,
      isActive: true,
      order: 5,
      linkedCategoryIds: ['cat-marine-yacht-vip'],
      excludedCategoryIds: []
    },

    // Group 3: grp-diving-program (cat-diving)
    {
      id: 'cspec-diving-depth',
      groupId: 'grp-diving-program',
      groupTitle: 'معايير برنامج الغوص والسنوركلينج',
      label: 'أقصى عمق في البرنامج',
      type: 'number',
      unit: 'متر',
      defaultValue: 12,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 6,
      linkedCategoryIds: ['cat-diving'],
      excludedCategoryIds: []
    },
    {
      id: 'cspec-diving-count',
      groupId: 'grp-diving-program',
      groupTitle: 'معايير برنامج الغوص والسنوركلينج',
      label: 'عدد الغطسات / جولات السنوركلينج باليوم',
      type: 'number',
      unit: 'جولة',
      defaultValue: 2,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 7,
      linkedCategoryIds: ['cat-diving'],
      excludedCategoryIds: []
    },
    {
      id: 'cspec-diving-swim',
      groupId: 'grp-diving-program',
      groupTitle: 'معايير برنامج الغوص والسنوركلينج',
      label: 'ملاءمة البرنامج لغير السباحين والمبتدئين',
      type: 'single_choice',
      defaultValue: 'مناسب للمبتدئين (بمرافقة مدرب 1:1)',
      options: ['مناسب للمبتدئين (بمرافقة مدرب 1:1)', 'يتطلب إجادة السباحة الأساسية', 'للمحترفين المعتمدين فقط'],
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 8,
      linkedCategoryIds: ['cat-diving'],
      excludedCategoryIds: []
    },

    // Group 4: grp-diving-pro-requirements (cat-diving-pro only)
    {
      id: 'cspec-divpro-cert',
      groupId: 'grp-diving-pro-requirements',
      groupTitle: 'اشتراطات غوص الأعماق المعتمد',
      label: 'الحد الأدنى لرخصة الغوص المطلوبة',
      type: 'single_choice',
      defaultValue: 'PADI Open Water أو ما يعادلها',
      options: ['PADI Open Water أو ما يعادلها', 'PADI Advanced Open Water', 'Rescue / Divemaster'],
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 9,
      linkedCategoryIds: ['cat-diving-pro'],
      excludedCategoryIds: ['cat-diving-snorkel', 'cat-diving-intro']
    },
    {
      id: 'cspec-divpro-computer',
      groupId: 'grp-diving-pro-requirements',
      groupTitle: 'اشتراطات غوص الأعماق المعتمد',
      label: 'إلزامية حمل كمبيوتر غوص شخصي',
      type: 'boolean',
      defaultValue: true,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 10,
      linkedCategoryIds: ['cat-diving-pro'],
      excludedCategoryIds: ['cat-diving-snorkel', 'cat-diving-intro']
    },

    // Group 5: grp-safari-route (cat-safari)
    {
      id: 'cspec-safari-dist',
      groupId: 'grp-safari-route',
      groupTitle: 'مسار ومواصفات رحلة السفاري',
      label: 'طول مسار الرحلة بالصحراء',
      type: 'number',
      unit: 'كم',
      defaultValue: 35,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 11,
      linkedCategoryIds: ['cat-safari'],
      excludedCategoryIds: []
    },
    {
      id: 'cspec-safari-timing',
      groupId: 'grp-safari-route',
      groupTitle: 'مسار ومواصفات رحلة السفاري',
      label: 'الفترة الزمنية المفضلة للانطلاق',
      type: 'single_choice',
      defaultValue: 'جولة الغروب (Sunset Safari)',
      options: ['شروق صباحي', 'منتصف اليوم', 'جولة الغروب (Sunset Safari)', 'أمسية ليلية'],
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 12,
      linkedCategoryIds: ['cat-safari'],
      excludedCategoryIds: []
    },
    {
      id: 'cspec-safari-terrain',
      groupId: 'grp-safari-route',
      groupTitle: 'مسار ومواصفات رحلة السفاري',
      label: 'طبيعة التضاريس الصحراوية',
      type: 'single_choice',
      defaultValue: 'وديان صحراوية وكثبان رملية',
      options: ['وديان صحراوية وكثبان رملية', 'مسارات جبلية وعرة', 'طرق صحراوية ممهدة للعائلات'],
      isPublicForClient: true,
      isRequired: false,
      isActive: true,
      order: 13,
      linkedCategoryIds: ['cat-safari'],
      excludedCategoryIds: []
    },

    // Group 6: grp-safari-camp-program (cat-safari-bedouin & cat-safari-4x4)
    {
      id: 'cspec-camp-telescope',
      groupId: 'grp-safari-camp-program',
      groupTitle: 'فعاليات المخيم البدوي ورصد النجوم',
      label: 'تضمين جلسة رصد النجوم بالتليسكوب الفلكي',
      type: 'boolean',
      defaultValue: true,
      isPublicForClient: true,
      isRequired: false,
      isActive: true,
      order: 14,
      linkedCategoryIds: ['cat-safari-bedouin', 'cat-safari-4x4'],
      excludedCategoryIds: []
    },
    {
      id: 'cspec-camp-show',
      groupId: 'grp-safari-camp-program',
      groupTitle: 'فعاليات المخيم البدوي ورصد النجوم',
      label: 'فقرات فلكلورية وعرض التنورة والنار',
      type: 'boolean',
      defaultValue: true,
      isPublicForClient: true,
      isRequired: false,
      isActive: true,
      order: 15,
      linkedCategoryIds: ['cat-safari-bedouin', 'cat-safari-4x4'],
      excludedCategoryIds: []
    },

    // Group 7: grp-leisure-experience (cat-leisure)
    {
      id: 'cspec-leisure-type',
      groupId: 'grp-leisure-experience',
      groupTitle: 'مواصفات الجولة الترفيهية والمائية',
      label: 'بيئة تنفيذ التجربة',
      type: 'single_choice',
      defaultValue: 'مياه ساحلية هادئة مناسبة للعائلات',
      options: [
        'مياه ساحلية هادئة مناسبة للعائلات',
        'تحليق بحري مفتوح (باراشوت / ألعاب)',
        'شاطئ رملي ومياه ضحلة للفروسية'
      ],
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 16,
      linkedCategoryIds: ['cat-leisure'],
      excludedCategoryIds: []
    },
    {
      id: 'cspec-leisure-duration-min',
      groupId: 'grp-leisure-experience',
      groupTitle: 'مواصفات الجولة الترفيهية والمائية',
      label: 'المدة الفعلية للتجربة',
      type: 'number',
      unit: 'دقيقة',
      defaultValue: 60,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 17,
      linkedCategoryIds: ['cat-leisure'],
      excludedCategoryIds: []
    },

    // Group 8: grp-safety-guidance (All 4 Pillars)
    {
      id: 'cspec-safe-age',
      groupId: 'grp-safety-guidance',
      groupTitle: 'ضوابط السلامة ولغات الإرشاد',
      label: 'الحد الأدنى لعمر المشارك',
      type: 'number',
      unit: 'سنة',
      defaultValue: 6,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 18,
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-safari', 'cat-leisure'],
      excludedCategoryIds: []
    },
    {
      id: 'cspec-safe-langs',
      groupId: 'grp-safety-guidance',
      groupTitle: 'ضوابط السلامة ولغات الإرشاد',
      label: 'لغات الإرشاد السياحي المتاحة',
      type: 'text',
      defaultValue: 'العربية، الإنجليزية، الألمانية، الروسية',
      isPublicForClient: true,
      isRequired: false,
      isActive: true,
      order: 19,
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-safari', 'cat-leisure'],
      excludedCategoryIds: []
    },
    {
      id: 'cspec-safe-guide',
      groupId: 'grp-safety-guidance',
      groupTitle: 'ضوابط السلامة ولغات الإرشاد',
      label: 'إشراف مدرب أو مرشد مرخص طوال النشاط',
      type: 'boolean',
      defaultValue: true,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 20,
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-safari', 'cat-leisure'],
      excludedCategoryIds: []
    }
  ];
}

function ensureOneTimeV6SeedReset(): boolean {
  const globalWiped = ensureOneTimeV6CleanReset();
  if (typeof window === 'undefined') return globalWiped;
  try {
    const done = window.localStorage.getItem(V6_SPECS_SEED_FLAG_KEY);
    if (!done) {
      window.localStorage.setItem(V6_SPECS_SEED_FLAG_KEY, '1');
      return true;
    }
  } catch {
    // ignore storage errors
  }
  return globalWiped;
}

async function readStoreAll<T>(storeName: string, lsFallbackKey: string): Promise<T[]> {
  try {
    const db = await openUnifiedLocalDb();
    return await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error(`Failed reading ${storeName}`));
    });
  } catch {
    try {
      const raw = window.localStorage.getItem(lsFallbackKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      }
    } catch {
      // ignore
    }
    return [];
  }
}

async function replaceStoreAll<T>(storeName: string, items: T[], lsFallbackKey: string): Promise<void> {
  try {
    const db = await openUnifiedLocalDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error(`Failed writing ${storeName}`));
    });
  } catch {
    try {
      window.localStorage.setItem(lsFallbackKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  }
}

// =========================================================================
// 1. Equipment Properties (خصائص المعدات المركزية)
// =========================================================================
const LS_EQPROPS_UNITKINDS_V3 = 'zanoza_ref_eqprops_unitkinds_v3';

export async function loadEquipmentPropertiesFromDb(): Promise<EquipmentPropertyItem[]> {
  const needsReset = ensureOneTimeV6SeedReset();
  const existing = needsReset
    ? []
    : await readStoreAll<EquipmentPropertyItem>(EQUIPMENT_PROPERTIES_STORE_NAME, LS_EQ_PROPS_FALLBACK);

  if (existing.length > 0) {
    let migrated = false;
    try {
      migrated = window.localStorage.getItem(LS_EQPROPS_UNITKINDS_V3) === '1';
    } catch {
      migrated = false;
    }
    const seeds = buildInitialEquipmentProperties();
    const seedMap = new Map(seeds.map((s) => [s.id, s]));
    const needsBackfill =
      !migrated ||
      existing.some((p) => seedMap.has(p.id) && p.linkedUnitKindIds === undefined);
    if (needsBackfill) {
      try {
        window.localStorage.setItem(LS_EQPROPS_UNITKINDS_V3, '1');
      } catch {
        // ignore
      }
      const upgraded = existing.map((p) => {
        const seed = seedMap.get(p.id);
        if (!seed || p.linkedUnitKindIds !== undefined) return p;
        return {
          ...p,
          linkedUnitKindIds: seed.linkedUnitKindIds ?? []
        };
      });
      const existingIds = new Set(upgraded.map((u) => u.id));
      for (const seed of seeds) {
        if (!existingIds.has(seed.id)) {
          upgraded.push(seed);
        }
      }
      await replaceStoreAll(EQUIPMENT_PROPERTIES_STORE_NAME, upgraded, LS_EQ_PROPS_FALLBACK);
      return upgraded;
    }
    return existing;
  }

  const seeded = buildInitialEquipmentProperties();
  await replaceStoreAll(EQUIPMENT_PROPERTIES_STORE_NAME, seeded, LS_EQ_PROPS_FALLBACK);
  return seeded;
}

export async function saveEquipmentPropertiesToDb(items: EquipmentPropertyItem[]): Promise<void> {
  await replaceStoreAll(EQUIPMENT_PROPERTIES_STORE_NAME, items, LS_EQ_PROPS_FALLBACK);
}

export async function resetAndReseedEquipmentPropertiesDb(): Promise<EquipmentPropertyItem[]> {
  const seeded = buildInitialEquipmentProperties();
  await replaceStoreAll(EQUIPMENT_PROPERTIES_STORE_NAME, seeded, LS_EQ_PROPS_FALLBACK);
  return seeded;
}

// =========================================================================
// 2. Equipment Types (أنواع وقوالب المعدات)
// =========================================================================
export async function loadEquipmentTypesFromDb(): Promise<EquipmentTypeDefinition[]> {
  const needsReset = ensureOneTimeV6SeedReset();
  const existing = needsReset
    ? []
    : await readStoreAll<EquipmentTypeDefinition>(EQUIPMENT_TYPES_STORE_NAME, LS_EQ_TYPES_FALLBACK);

  if (existing.length > 0) {
    return existing;
  }

  const props = await loadEquipmentPropertiesFromDb();
  const seeded = buildInitialEquipmentTypes(props);
  await replaceStoreAll(EQUIPMENT_TYPES_STORE_NAME, seeded, LS_EQ_TYPES_FALLBACK);
  return seeded;
}

export async function saveEquipmentTypesToDb(types: EquipmentTypeDefinition[]): Promise<void> {
  await replaceStoreAll(EQUIPMENT_TYPES_STORE_NAME, types, LS_EQ_TYPES_FALLBACK);
}

export async function resetAndReseedEquipmentTypesDb(
  props?: EquipmentPropertyItem[]
): Promise<EquipmentTypeDefinition[]> {
  const resolvedProps = props ?? buildInitialEquipmentProperties();
  const seeded = buildInitialEquipmentTypes(resolvedProps);
  await replaceStoreAll(EQUIPMENT_TYPES_STORE_NAME, seeded, LS_EQ_TYPES_FALLBACK);
  return seeded;
}

// =========================================================================
// 3. Equipments Registry (سجل المعدات المستقل)
// =========================================================================
export async function loadEquipmentsFromDb(): Promise<EquipmentItem[]> {
  const needsReset = ensureOneTimeV6SeedReset();
  const existing = needsReset
    ? []
    : await readStoreAll<EquipmentItem>(EQUIPMENTS_STORE_NAME, LS_EQUIPMENTS_FALLBACK);

  if (existing.length > 0) {
    return existing;
  }

  const types = await loadEquipmentTypesFromDb();
  const seeded = buildInitialStarterEquipments(types);
  await replaceStoreAll(EQUIPMENTS_STORE_NAME, seeded, LS_EQUIPMENTS_FALLBACK);
  return seeded;
}

export async function saveEquipmentsToDb(items: EquipmentItem[]): Promise<void> {
  await replaceStoreAll(EQUIPMENTS_STORE_NAME, items, LS_EQUIPMENTS_FALLBACK);
}

export async function resetAndReseedStarterEquipmentsDb(
  types?: EquipmentTypeDefinition[]
): Promise<EquipmentItem[]> {
  const resolvedTypes = types ?? buildInitialEquipmentTypes(buildInitialEquipmentProperties());
  const seeded = buildInitialStarterEquipments(resolvedTypes);
  await replaceStoreAll(EQUIPMENTS_STORE_NAME, seeded, LS_EQUIPMENTS_FALLBACK);
  return seeded;
}

// =========================================================================
// 4. Custom Technical Specs (ادارة المواصفات الفنية مخصصة للنشاط)
// =========================================================================
export async function loadCustomTechnicalSpecsFromDb(): Promise<CustomTechnicalSpecItem[]> {
  const needsReset = ensureOneTimeV6SeedReset();
  const existing = needsReset
    ? []
    : await readStoreAll<CustomTechnicalSpecItem>(
        CUSTOM_TECHNICAL_SPECS_STORE_NAME,
        LS_CUSTOM_SPECS_FALLBACK
      );

  if (existing.length > 0) {
    return [...existing].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const seeded = buildInitialCustomTechnicalSpecs();
  await replaceStoreAll(CUSTOM_TECHNICAL_SPECS_STORE_NAME, seeded, LS_CUSTOM_SPECS_FALLBACK);
  return seeded;
}

export async function saveCustomTechnicalSpecsToDb(items: CustomTechnicalSpecItem[]): Promise<void> {
  await replaceStoreAll(CUSTOM_TECHNICAL_SPECS_STORE_NAME, items, LS_CUSTOM_SPECS_FALLBACK);
}

export async function resetAndReseedCustomTechnicalSpecsDb(): Promise<CustomTechnicalSpecItem[]> {
  const seeded = buildInitialCustomTechnicalSpecs();
  await replaceStoreAll(CUSTOM_TECHNICAL_SPECS_STORE_NAME, seeded, LS_CUSTOM_SPECS_FALLBACK);
  return seeded;
}
