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
  openUnifiedLocalDb
} from './unifiedLocalDb';

const V4_RESET_SEED_FLAG_KEY = 'zanoza_v4_specs_equipment_seeded_v1';
const LEGACY_CUSTOM_SPECS_LS_KEY = 'zanoza_custom_technical_specs_v1';
const LEGACY_ACTIVITIES_LS_KEY = 'zanoza_local_activities_v1';
const LS_EQ_PROPS_FALLBACK = 'zanoza_db_equipment_properties_v2';
const LS_EQ_TYPES_FALLBACK = 'zanoza_db_equipment_types_v2';
const LS_EQUIPMENTS_FALLBACK = 'zanoza_db_equipments_v2';
const LS_CUSTOM_SPECS_FALLBACK = 'zanoza_db_custom_technical_specs_v2';

export const REAL_EQUIPMENT_CATEGORIES: EquipmentCategoryOption[] = [
  { id: 'yacht', label: 'اليخوت والمراكب البحرية', icon: '⛵', linkedCategoryId: 'cat-yacht' },
  { id: 'marine_craft', label: 'الغواصات والمراكب الزجاجية', icon: '🚤', linkedCategoryId: 'cat-sub' },
  { id: 'safari_vehicle', label: 'دراجات ومركبات السفاري', icon: '🏜️', linkedCategoryId: 'cat-desert' },
  { id: 'equestrian_animal', label: 'الخيول والجمال', icon: '🐎', linkedCategoryId: 'cat-equestrian' },
  { id: 'diving_gear', label: 'معدات الغوص والسنوركلينج', icon: '🤿', linkedCategoryId: 'cat-diving' },
  { id: 'aerial_water_gear', label: 'معدات الألعاب المائية والطيران', icon: '🪂', linkedCategoryId: 'cat-watersports' }
];

const TODAY_ISO = new Date().toISOString().split('T')[0];

function buildInitialEquipmentProperties(): EquipmentPropertyItem[] {
  return [
    // 1. اليخوت والمراكب البحرية (cat-yacht)
    {
      id: 'eqp-yacht-length',
      category: 'yacht',
      key: 'yacht_length_m',
      label: 'طول الوحدة البحرية (متر)',
      type: 'number',
      unit: 'متر',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'الطول الإجمالي لليخت أو اللانش من المقدمة للمؤخرة',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-yacht-cabins',
      category: 'yacht',
      key: 'cabins_count',
      label: 'عدد الكبائن المكيفة',
      type: 'number',
      unit: 'كابينة',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'عدد أجنحة النوم والكبائن المزودة بحمام وتكييف',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-yacht-capacity',
      category: 'yacht',
      key: 'max_passengers',
      label: 'السعة القصوى للركاب',
      type: 'number',
      unit: 'راكب',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'الحد الأقصى المرخص للركاب على متن الوحدة البحرية',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-yacht-engines',
      category: 'yacht',
      key: 'engine_power_brand',
      label: 'قدرة المحركات والماركة',
      type: 'text',
      isMandatoryDefault: false,
      isPublicDefault: false,
      description: 'تفاصيل المحركات والقدرة الحصانية للتشغيل والصيانة الداخلية',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-yacht-deck',
      category: 'yacht',
      key: 'deck_amenities',
      label: 'تجهيزات السطح والرفاهية',
      type: 'multi_choice',
      options: ['جاكوزي خارجي', 'منصة سباحة خلفية', 'شواية بحرية', 'مظلة شمسية علوية', 'نظام صوتي محيطي'],
      isMandatoryDefault: false,
      isPublicDefault: true,
      description: 'التجهيزات الثابتة المتوفرة على سطح اليخت لراحة الضيوف',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },

    // 2. الغواصات والمراكب الزجاجية (cat-sub)
    {
      id: 'eqp-sub-depth',
      category: 'marine_craft',
      key: 'viewing_depth_m',
      label: 'عمق الكابينة الزجاجية تحت الماء (متر)',
      type: 'number',
      unit: 'متر',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'العمق الفعلي لصالة المشاهدة البانورامية تحت سطح البحر',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-sub-windows',
      category: 'marine_craft',
      key: 'panoramic_windows_count',
      label: 'عدد نوافذ الرؤية البانورامية',
      type: 'number',
      unit: 'نافذة',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'عدد النوافذ الزجاجية المخصصة لمشاهدة الشعاب والأسماك',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-sub-ac',
      category: 'marine_craft',
      key: 'lower_cabin_ac',
      label: 'تكييف مركزي بالكابينة السفلية',
      type: 'boolean',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'توافر تهوية وتبريد هواء بالكابينة السفلية للركاب',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-sub-year',
      category: 'marine_craft',
      key: 'hull_model_year',
      label: 'سنة الصنع أو آخر تجديد شامل',
      type: 'number',
      isMandatoryDefault: false,
      isPublicDefault: false,
      description: 'سنة تصنيع البدن أو آخر عمرة شاملة معتمدة',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },

    // 3. دراجات ومركبات السفاري (cat-desert)
    {
      id: 'eqp-saf-cc',
      category: 'safari_vehicle',
      key: 'engine_displacement_cc',
      label: 'سعة المحرك (CC)',
      type: 'number',
      unit: 'CC',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'سعة وقوة محرك دراجة البيتش باجي أو المركبة الصحراوية',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-saf-trans',
      category: 'safari_vehicle',
      key: 'transmission_type',
      label: 'نوع ناقل الحركة',
      type: 'single_choice',
      options: ['أوتوماتيك بالكامل', 'نصف أوتوماتيك', 'يدوي'],
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'نظام القيادة وناقل الحركة في المركبة',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-saf-seats',
      category: 'safari_vehicle',
      key: 'vehicle_seats_count',
      label: 'عدد مقاعد المركبة',
      type: 'number',
      unit: 'مقعد',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'عدد الركاب المسموح لكل دراجة أو مركبة سفاري',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-saf-drive',
      category: 'safari_vehicle',
      key: 'drive_system',
      label: 'نظام الدفع والتعليق',
      type: 'single_choice',
      options: ['دفع رباعي 4x4', 'دفع خلفي 2x4'],
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'تصنيف نظام الدفع للمسارات الجبلية والرملية',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-saf-cage',
      category: 'safari_vehicle',
      key: 'roll_cage_protection',
      label: 'هيكل حماية وأحزمة أمان رباعية',
      type: 'boolean',
      isMandatoryDefault: true,
      isPublicDefault: false,
      description: 'تحقق داخلي من تجهيزات الأمان بالمركبة قبل التشغيل',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },

    // 4. الخيول والجمال (cat-equestrian)
    {
      id: 'eqp-eqs-breed',
      category: 'equestrian_animal',
      key: 'animal_breed',
      label: 'السلالة والتصنيف',
      type: 'single_choice',
      options: ['خيل عربي أصيل مسجل', 'خيل مهجن مدرب', 'بوني للأطفال', 'جمل سفاري مدرب'],
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'سلالة وتدريب الخيل أو الجمل المخصص للجولات',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-eqs-weight',
      category: 'equestrian_animal',
      key: 'max_safe_load_kg',
      label: 'الحد الأقصى للوزن المسموح (كجم)',
      type: 'number',
      unit: 'كجم',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'حد الوزن الآمن للراكب حفاظاً على سلامة الفرس والتوازن',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-eqs-water',
      category: 'equestrian_animal',
      key: 'water_trained',
      label: 'مدرب على النزول للبحر والمياه الضحلة',
      type: 'boolean',
      isMandatoryDefault: false,
      isPublicDefault: true,
      description: 'هل الفرس مهيأ ومعتاد على الدخول في مياه الشاطئ',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-eqs-vet',
      category: 'equestrian_animal',
      key: 'vet_clearance_status',
      label: 'الحالة البيطرية والتطعيمات',
      type: 'single_choice',
      options: ['معتمد وسليم', 'يحتاج فحص دوري'],
      isMandatoryDefault: true,
      isPublicDefault: false,
      description: 'سجل الرعاية البيطرية الداخلي للإسطبل',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },

    // 5. معدات الغوص والسنوركلينج (cat-diving)
    {
      id: 'eqp-div-tank',
      category: 'diving_gear',
      key: 'tank_capacity_liters',
      label: 'سعة أسطوانة الهواء (لتر)',
      type: 'number',
      unit: 'لتر',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'السعة القياسية لأسطوانة الغوص المتوفرة بالمعدات',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-div-nitrox',
      category: 'diving_gear',
      key: 'nitrox_compatible',
      label: 'دعم غاز النيتروكس (Nitrox)',
      type: 'boolean',
      isMandatoryDefault: false,
      isPublicDefault: true,
      description: 'جاهزية الأسطوانات والمنظمات لخليط النيتروكس',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-div-suit',
      category: 'diving_gear',
      key: 'wetsuit_thickness_mm',
      label: 'سُمك وخامة بدلة الغوص',
      type: 'single_choice',
      options: ['3 ملم صيفي', '5 ملم متعدد المواسم', '7 ملم شتوي'],
      isMandatoryDefault: false,
      isPublicDefault: true,
      description: 'مواصفات بدلة الغوص الحرارية المتاحة مع الطقم',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },

    // 6. معدات الألعاب المائية والطيران (cat-watersports, cat-air)
    {
      id: 'eqp-air-model',
      category: 'aerial_water_gear',
      key: 'craft_gear_model',
      label: 'طراز المظلة أو القارب',
      type: 'single_choice',
      options: ['باراشوت منفرد', 'باراشوت زوجي/ثلاثي', 'بانانا بوت', 'منطاد هواء ساخن'],
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'نوع وطراز الوحدة المخصصة للألعاب المائية أو الطيران',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-air-payload',
      category: 'aerial_water_gear',
      key: 'gear_max_payload_kg',
      label: 'أقصى حمولة تشغيلية آمنة (كجم)',
      type: 'number',
      unit: 'كجم',
      isMandatoryDefault: true,
      isPublicDefault: true,
      description: 'الحد الأقصى لمجموع أوزان المشاركين في الجولة الواحدة',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    },
    {
      id: 'eqp-air-inspect',
      category: 'aerial_water_gear',
      key: 'last_safety_inspection',
      label: 'تاريخ آخر فحص سلامة معتمد',
      type: 'text',
      isMandatoryDefault: true,
      isPublicDefault: false,
      description: 'مرجع الفحص الفني الداخلي لحبال السحب أو المظلة',
      createdAt: TODAY_ISO,
      updatedAt: TODAY_ISO
    }
  ];
}

function buildInitialEquipmentTypes(props: EquipmentPropertyItem[]): EquipmentTypeDefinition[] {
  return REAL_EQUIPMENT_CATEGORIES.map((cat) => {
    const matchingProps = props.filter((p) => p.category === cat.id);
    return {
      id: `eqt-${cat.id}`,
      key: cat.id,
      name: cat.label,
      category: cat.label,
      description: `قالب المواصفات القياسي لفئة ${cat.label} والمربوط بخصائص المعدات المركزية`,
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

function buildInitialCustomTechnicalSpecs(): CustomTechnicalSpecItem[] {
  return [
    // 1. تفاصيل البرنامج البحري والغوص (cat-marine, cat-diving, cat-islands)
    {
      id: 'cspec-marine-depth',
      groupTitle: 'تفاصيل البرنامج البحري والغوص',
      label: 'أقصى عمق غوص في البرنامج (متر)',
      type: 'number',
      defaultValue: 18,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 1
    },
    {
      id: 'cspec-marine-stops',
      groupTitle: 'تفاصيل البرنامج البحري والغوص',
      label: 'عدد وقفات السباحة والسنوركلينج',
      type: 'number',
      defaultValue: 2,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 2
    },
    {
      id: 'cspec-marine-cert',
      groupTitle: 'تفاصيل البرنامج البحري والغوص',
      label: 'منظمة الاعتماد الدولية للبرنامج',
      type: 'single_choice',
      defaultValue: 'PADI 5 Star',
      options: ['PADI 5 Star', 'SSI Diamond', 'CMAS', 'بدون رخصة (تمهيدي)'],
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 3
    },
    {
      id: 'cspec-marine-license',
      groupTitle: 'تفاصيل البرنامج البحري والغوص',
      label: 'اشتراط رخصة غوص مسبقة',
      type: 'boolean',
      defaultValue: false,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 4
    },
    {
      id: 'cspec-marine-swim',
      groupTitle: 'تفاصيل البرنامج البحري والغوص',
      label: 'ملاءمة البرنامج للسباحين والمبتدئين',
      type: 'single_choice',
      defaultValue: 'مناسب للمبتدئين وغير السباحين',
      options: ['مناسب للمبتدئين وغير السباحين', 'يتطلب إجادة السباحة', 'للمحترفين فقط'],
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 5
    },

    // 2. مسار السفاري والمغامرات الصحراوية (cat-desert, cat-quad, cat-buggy, cat-bedouin)
    {
      id: 'cspec-safari-dist',
      groupTitle: 'مسار السفاري والمغامرات الصحراوية',
      label: 'طول مسار الرحلة بالصحراء (كم)',
      type: 'number',
      defaultValue: 35,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 6
    },
    {
      id: 'cspec-safari-timing',
      groupTitle: 'مسار السفاري والمغامرات الصحراوية',
      label: 'توقيت الانطلاق الرئيسي للرحلة',
      type: 'single_choice',
      defaultValue: 'غروب الشمس',
      options: ['شروق صباحي', 'منتصف اليوم', 'غروب الشمس', 'مسائي ورصد فلكي'],
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 7
    },
    {
      id: 'cspec-safari-terrain',
      groupTitle: 'مسار السفاري والمغامرات الصحراوية',
      label: 'طبيعة التضاريس في المسار',
      type: 'single_choice',
      defaultValue: 'دروب جبلية ووديان',
      options: ['كثبان رملية مفتوحة', 'دروب جبلية ووديان', 'مسار مختلط سهل'],
      isPublicForClient: true,
      isRequired: false,
      isActive: true,
      order: 8
    },
    {
      id: 'cspec-safari-bedouin',
      groupTitle: 'مسار السفاري والمغامرات الصحراوية',
      label: 'تضمين زيارة القرية البدوية والشاي',
      type: 'boolean',
      defaultValue: true,
      isPublicForClient: true,
      isRequired: false,
      isActive: true,
      order: 9
    },

    // 3. تجربة الفروسية والجولات الشاطئية (cat-equestrian, cat-horses, cat-camel)
    {
      id: 'cspec-horse-route',
      groupTitle: 'تجربة الفروسية والجولات الشاطئية',
      label: 'بيئة مسار الجولة',
      type: 'single_choice',
      defaultValue: 'شاطئ البحر والمياه الضحلة',
      options: ['شاطئ البحر والمياه الضحلة', 'الوديان الصحراوية', 'مسار مشترك شاطئ وصحراء'],
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 10
    },
    {
      id: 'cspec-horse-level',
      groupTitle: 'تجربة الفروسية والجولات الشاطئية',
      label: 'مستوى الخبرة المطلوب للفارس',
      type: 'single_choice',
      defaultValue: 'مبتدئ (بمرافقة مدرب)',
      options: ['مبتدئ (بمرافقة مدرب)', 'متوسط', 'متقدم (عدو حر)'],
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 11
    },
    {
      id: 'cspec-horse-swim',
      groupTitle: 'تجربة الفروسية والجولات الشاطئية',
      label: 'تضمين النزول والسباحة بالخيل في البحر',
      type: 'boolean',
      defaultValue: true,
      isPublicForClient: true,
      isRequired: false,
      isActive: true,
      order: 12
    },

    // 4. معايير الألعاب المائية والطيران (cat-watersports, cat-air)
    {
      id: 'cspec-air-alt',
      groupTitle: 'معايير الألعاب المائية والطيران',
      label: 'ارتفاع التحليق التقديري (متر)',
      type: 'number',
      defaultValue: 120,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 13
    },
    {
      id: 'cspec-air-duration',
      groupTitle: 'معايير الألعاب المائية والطيران',
      label: 'مدة التحليق الفعلية في الجو (دقيقة)',
      type: 'number',
      defaultValue: 12,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 14
    },
    {
      id: 'cspec-air-photo',
      groupTitle: 'معايير الألعاب المائية والطيران',
      label: 'إتاحة التصوير الاحترافي أثناء التجربة',
      type: 'boolean',
      defaultValue: true,
      isPublicForClient: true,
      isRequired: false,
      isActive: true,
      order: 15
    },

    // 5. ضوابط السلامة والأهلية للمشاركين (general)
    {
      id: 'cspec-safe-age',
      groupTitle: 'ضوابط السلامة والأهلية للمشاركين',
      label: 'الحد الأدنى لعمر المشارك (سنة)',
      type: 'number',
      defaultValue: 6,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 16
    },
    {
      id: 'cspec-safe-fitness',
      groupTitle: 'ضوابط السلامة والأهلية للمشاركين',
      label: 'مستوى اللياقة البدنية المطلوب',
      type: 'single_choice',
      defaultValue: 'مريح (مناسب للجميع)',
      options: ['مريح (مناسب للجميع)', 'متوسط النشاط', 'مجهود بدني عالي'],
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 17
    },
    {
      id: 'cspec-safe-family',
      groupTitle: 'ضوابط السلامة والأهلية للمشاركين',
      label: 'ملاءمة التجربة للعائلات والأطفال',
      type: 'boolean',
      defaultValue: true,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 18
    },
    {
      id: 'cspec-safe-guide',
      groupTitle: 'ضوابط السلامة والأهلية للمشاركين',
      label: 'توافر مدرب أو مرشد متخصص طوال النشاط',
      type: 'boolean',
      defaultValue: true,
      isPublicForClient: true,
      isRequired: true,
      isActive: true,
      order: 19
    },

    // 6. التنظيم ولغات الإرشاد والاعتماد الداخلي (general)
    {
      id: 'cspec-org-langs',
      groupTitle: 'التنظيم ولغات الإرشاد والاعتماد',
      label: 'لغات الإرشاد المتاحة بالرحلة',
      type: 'text',
      defaultValue: 'العربية، الإنجليزية، الألمانية، الروسية',
      isPublicForClient: true,
      isRequired: false,
      isActive: true,
      order: 20
    },
    {
      id: 'cspec-org-ratio',
      groupTitle: 'التنظيم ولغات الإرشاد والاعتماد',
      label: 'الحد الأقصى لحجم المجموعة مع المرشد الواحد',
      type: 'number',
      defaultValue: 12,
      isPublicForClient: false,
      isRequired: true,
      isActive: true,
      order: 21
    },
    {
      id: 'cspec-org-tier',
      groupTitle: 'التنظيم ولغات الإرشاد والاعتماد',
      label: 'تصنيف التشغيل للنشاط',
      type: 'single_choice',
      defaultValue: 'رحلة يومية منتظمة',
      options: ['رحلة يومية منتظمة', 'عرض موسمي مميز', 'رحلة خاصة VIP'],
      isPublicForClient: false,
      isRequired: false,
      isActive: true,
      order: 22
    }
  ];
}

function ensureOneTimeLegacyReset(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const done = window.localStorage.getItem(V4_RESET_SEED_FLAG_KEY);
    if (!done) {
      window.localStorage.removeItem(LEGACY_CUSTOM_SPECS_LS_KEY);
      window.localStorage.removeItem(LEGACY_ACTIVITIES_LS_KEY);
      window.localStorage.removeItem(LS_EQ_PROPS_FALLBACK);
      window.localStorage.removeItem(LS_EQ_TYPES_FALLBACK);
      window.localStorage.removeItem(LS_EQUIPMENTS_FALLBACK);
      window.localStorage.removeItem(LS_CUSTOM_SPECS_FALLBACK);
      window.localStorage.setItem(V4_RESET_SEED_FLAG_KEY, '1');
      return true;
    }
  } catch {
    // ignore storage errors
  }
  return false;
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
export async function loadEquipmentPropertiesFromDb(): Promise<EquipmentPropertyItem[]> {
  const needsReset = ensureOneTimeLegacyReset();
  const existing = needsReset
    ? []
    : await readStoreAll<EquipmentPropertyItem>(EQUIPMENT_PROPERTIES_STORE_NAME, LS_EQ_PROPS_FALLBACK);

  if (existing.length > 0) {
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
  const needsReset = ensureOneTimeLegacyReset();
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

// =========================================================================
// 3. Equipments Registry (سجل المعدات المستقل)
// =========================================================================
export async function loadEquipmentsFromDb(): Promise<EquipmentItem[]> {
  const needsReset = ensureOneTimeLegacyReset();
  if (needsReset) {
    await replaceStoreAll<EquipmentItem>(EQUIPMENTS_STORE_NAME, [], LS_EQUIPMENTS_FALLBACK);
    return [];
  }
  return readStoreAll<EquipmentItem>(EQUIPMENTS_STORE_NAME, LS_EQUIPMENTS_FALLBACK);
}

export async function saveEquipmentsToDb(items: EquipmentItem[]): Promise<void> {
  await replaceStoreAll(EQUIPMENTS_STORE_NAME, items, LS_EQUIPMENTS_FALLBACK);
}

// =========================================================================
// 4. Custom Technical Specs (ادارة المواصفات الفنية مخصصة للنشاط)
// =========================================================================
export async function loadCustomTechnicalSpecsFromDb(): Promise<CustomTechnicalSpecItem[]> {
  const needsReset = ensureOneTimeLegacyReset();
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
