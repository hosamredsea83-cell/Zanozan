import type { Waypoint } from '../../types/activity';
import type { Asset } from '../MediaUploadSection';

export interface RegisteredOwnerItem {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  tier: string;
}

export const DEFAULT_PAGE_OWNER: RegisteredOwnerItem = {
  id: 'own-page-user',
  name: 'كابتن طارق السويفي (صاحب الصفحة)',
  companyName: 'بلو أوشن للرحلات البحرية واليخوت',
  phone: '+201099234812',
  tier: 'باقة المحترفين الذهبية (الحساب الحالي)'
};

export interface CategoryNode {
  id: string;
  name: string;
  handle?: string;
  description?: string;
  parentId?: string | null;
  level?: number;
  children?: CategoryNode[];
}

export const INITIAL_CATEGORY_TREE: CategoryNode[] = [
  {
    id: 'cat-tour',
    name: 'الأنشطة السياحية',
    children: [
      {
        id: 'cat-marine',
        name: 'الأنشطة البحرية',
        children: [
          {
            id: 'cat-yacht',
            name: 'رحلات اليخوت',
            children: [
              { id: 'cat-yacht-private', name: 'يخوت خاصة VIP' },
              { id: 'cat-yacht-shared', name: 'يخوت مشتركة' },
              { id: 'cat-yacht-sunset', name: 'رحلات غروب رومانسية' }
            ]
          },
          {
            id: 'cat-diving',
            name: 'الغوص والسنوركلينج',
            children: [
              { id: 'cat-dive-intro', name: 'غوص تمهيدي للمبتدئين (Intro)' },
              { id: 'cat-dive-pro', name: 'غوص أعماق محترفين (PADI)' },
              { id: 'cat-dive-night', name: 'غوص ليلي واستكشاف كهوف' }
            ]
          },
          {
            id: 'cat-islands',
            name: 'رحلات الجزر البحرية',
            children: [
              { id: 'cat-isl-giftun', name: 'جزيرة الجفتون وأورانج باي' },
              { id: 'cat-isl-paradise', name: 'جزيرة برادايس وباراشوت' },
              { id: 'cat-isl-magawish', name: 'جزر مجاويش وأبو منقار' }
            ]
          },
          {
            id: 'cat-sub',
            name: 'الغواصات والمراكب الزجاجية',
            children: [
              { id: 'cat-sub-semi', name: 'غواصات شبه غاطسة (Semi-Submarine)' },
              { id: 'cat-sub-glass', name: 'مراكب زجاجية بانورامية (Glass-Bottom)' }
            ]
          },
          {
            id: 'cat-watersports',
            name: 'ألعاب مائية وباراشوت',
            children: [
              { id: 'cat-ws-parasail', name: 'باراشوت بحري منفرد وزوجي' },
              { id: 'cat-ws-banana', name: 'بانانا بوت وتيوب مائي سريع' }
            ]
          }
        ]
      },
      {
        id: 'cat-desert',
        name: 'سفاري ومغامرات صحراوية',
        children: [
          {
            id: 'cat-quad',
            name: 'سفاري بيتش باجي (Quad Bikes)',
            children: [
              { id: 'cat-quad-single', name: 'بيتش باجي فردي 250cc' },
              { id: 'cat-quad-double', name: 'بيتش باجي زوجي ومجموعات' }
            ]
          },
          {
            id: 'cat-buggy',
            name: 'سفاري سيارات الدفع الرباعي والباجي',
            children: [
              { id: 'cat-buggy-sp', name: 'سبايدر كار وباجي صحراوي' },
              { id: 'cat-jeep-4x4', name: 'جيب لاند كروزر 4x4' }
            ]
          },
          {
            id: 'cat-bedouin',
            name: 'عشاء بدوي وفلكلور صحراوي',
            children: [
              { id: 'cat-bed-stargaze', name: 'رصد فلكي وتليسكوبات' },
              { id: 'cat-bed-show', name: 'حفل شواء بدوي وعرض نار' }
            ]
          }
        ]
      },
      {
        id: 'cat-equestrian',
        name: 'فروسية وركوب الخيل والجمال',
        children: [
          {
            id: 'cat-horses',
            name: 'خيول عربية أصيلة',
            children: [
              { id: 'cat-horse-beach', name: 'سباحة بالخيل على الشاطئ' },
              { id: 'cat-horse-desert', name: 'ركوب خيل في الوديان الصحراوية' }
            ]
          },
          {
            id: 'cat-camel',
            name: 'قوافل الجمال البدوية',
            children: [
              { id: 'cat-camel-sunset', name: 'جولات الجمال وقت الغروب' }
            ]
          }
        ]
      },
      {
        id: 'cat-air',
        name: 'طيران وسياحة هوائية',
        children: [
          {
            id: 'cat-balloon',
            name: 'المنطاد الطائر (Hot Air Balloon)',
            children: [
              { id: 'cat-balloon-luxor', name: 'منطاد شروق الشمس' }
            ]
          }
        ]
      }
    ]
  }
];

export const INITIAL_REGISTERED_OWNERS: RegisteredOwnerItem[] = [
  {
    id: 'own-002',
    name: 'كابتن حسام الصياد',
    companyName: 'رد سي لليخوت ومارينز الغردقة',
    phone: '+201011223344',
    tier: 'باقة كبار الشركاء VIP'
  },
  {
    id: 'own-003',
    name: 'م. إبراهيم البدوي',
    companyName: 'ديزرت سفاري إيجيبت والمغامرات الصحراوية',
    phone: '+201055667788',
    tier: 'باقة المحترفين الفضية'
  },
  {
    id: 'own-004',
    name: 'د. نرمين الشافعي',
    companyName: 'مركز بلو هول للغوص والمغامرات المائية',
    phone: '+201099887766',
    tier: 'باقة المؤسسات الماسية'
  },
  {
    id: 'own-005',
    name: 'كابتن منصور الهواري',
    companyName: 'إسطبلات ونادي فروسية الأصايل بالجونة',
    phone: '+201122334455',
    tier: 'باقة الشركاء المعتمدين'
  },
  {
    id: 'own-006',
    name: 'أ. علاء الدين الجيار',
    companyName: 'سي وورلد للغواصات والمراكب الزجاجية',
    phone: '+201288776655',
    tier: 'باقة الشركاء الذهبية'
  }
];

export interface StoredActivityPreset {
  id: string;
  category: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  badge?: string;
  popular?: boolean;
}

export const INITIAL_STORED_MEDIA_LIBRARY: Asset[] = [
  {
    id: 'lib-granola-jar',
    name: 'granola_jar',
    extension: '.png',
    url: 'https://images.unsplash.com/photo-1517093157656-b9ec91e3e789?auto=format&fit=crop&w=800&q=80',
    sizeBytes: 1250000,
    dateAdded: Date.now() - 3600000 * 2,
    activityTag: 'general'
  },
  {
    id: 'lib-gaming-mouse',
    name: 'gaming_mouse',
    extension: '.png',
    url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    sizeBytes: 980000,
    dateAdded: Date.now() - 3600000 * 3,
    activityTag: 'general'
  },
  {
    id: 'lib-scandi-table',
    name: 'scandi_table',
    extension: '.png',
    url: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80',
    sizeBytes: 1450000,
    dateAdded: Date.now() - 3600000 * 4,
    activityTag: 'general'
  },
  {
    id: 'lib-premium-tshirt',
    name: 'premium_tshirt',
    extension: '.png',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    sizeBytes: 890000,
    dateAdded: Date.now() - 3600000 * 5,
    activityTag: 'general'
  },
  {
    id: 'lib-yacht-1',
    name: 'يخت رويال أزور الفاخر في مياه الغردقة',
    extension: '.jpg',
    url: '/src/assets/images/zanoza_yacht_hurghada_1794046061468.jpg',
    sizeBytes: 2450000,
    dateAdded: Date.now() - 86400000 * 3,
    activityTag: 'yacht'
  },
  {
    id: 'lib-dive-1',
    name: 'غوص وسنوركلينج واستكشاف الشعاب المرجانية',
    extension: '.jpg',
    url: '/src/assets/images/zanoza_scuba_diving_1794046063460.jpg',
    sizeBytes: 1980000,
    dateAdded: Date.now() - 86400000 * 2
  },
  {
    id: 'lib-safari-1',
    name: 'مغامرة بيتش باجي وسفاري صحراوي بالغروب',
    extension: '.jpg',
    url: '/src/assets/images/zanoza_safari_desert_1794046062158.jpg',
    sizeBytes: 990767,
    dateAdded: Date.now() - 86400000 * 5
  },
  {
    id: 'lib-horses-1',
    name: 'فروسية وركوب خيل عربي أصيل على شاطئ البحر',
    extension: '.jpg',
    url: '/src/assets/images/zanoza_horses_riding_1794047443692.jpg',
    sizeBytes: 933997,
    dateAdded: Date.now() - 86400000 * 4
  },
  {
    id: 'lib-boat-1',
    name: 'قارب زجاجي وغواصة بحرية لمشاهدة الأسماك الملونة',
    extension: '.jpg',
    url: '/src/assets/images/zanoza_glass_boat_1794046062451.jpg',
    sizeBytes: 1085599,
    dateAdded: Date.now() - 86400000 * 1
  },
  {
    id: 'lib-orange-bay',
    name: 'شاطئ جزيرة أورانج باي والمياه الفيروزية',
    extension: '.jpg',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    sizeBytes: 1650000,
    dateAdded: Date.now() - 86400000 * 6
  },
  {
    id: 'lib-dolphin',
    name: 'مستعمرة الدلافين الطبيعية بالبحر المفتوح',
    extension: '.jpg',
    url: 'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?auto=format&fit=crop&w=1200&q=80',
    sizeBytes: 1820000,
    dateAdded: Date.now() - 86400000 * 7
  },
  {
    id: 'lib-parasail',
    name: 'تحليق الباراشوت المائي وتجربة الألعاب المائية',
    extension: '.jpg',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    sizeBytes: 1420000,
    dateAdded: Date.now() - 86400000 * 8
  }
];

export const INITIAL_STORED_PRESETS: StoredActivityPreset[] = [
  {
    id: 'preset-yacht-vip',
    category: 'أنشطة بحرية ويخوت',
    name: 'رحلة يخت ملكي خاص VIP شاملة الغداء والسنوركلينج',
    nameEn: 'VIP Private Luxury Yacht Cruise with Lunch & Snorkeling',
    description:
      'تجربة إبحار حصرية على متن يخت فاخر مجهز بأحدث وسائل الراحة، تتضمن وقفتين للسباحة والسنوركلينج عند أجمل الشعاب المرجانية، مع وجبة غداء مأكولات بحرية طازجة ومشروبات منعشة طوال اليوم.',
    descriptionEn:
      'Exclusive luxury yacht cruise with premium amenities, two snorkeling stops at pristine coral reefs, freshly prepared seafood lunch, and unlimited refreshments.',
    badge: 'الأكثر طلباً',
    popular: true
  },
  {
    id: 'preset-dolphin-snorkel',
    category: 'غوص وسنوركلينج',
    name: 'جولة السنوركلينج مع الدلافين واستكشاف الشعاب المرجانية',
    nameEn: 'Dolphin Snorkeling Tour & Coral Reef Exploration',
    description:
      'رحلة بحرية رائعة في محمية الدلافين الطبيعية، تتيح لك السباحة بالقرب من أسراب الدلافين في بيئتها الطبيعية مع معدات سنوركلينج حديثة وإرشاد بحري متخصص لضمان أفضل تجربة.',
    descriptionEn:
      'Thrilling boat excursion to natural dolphin habitats with guided snorkeling, high-end equipment, and unforgettable encounters in open waters.',
    badge: 'مميز',
    popular: true
  },
  {
    id: 'preset-quad-desert-safari',
    category: 'سفاري ومغامرات صحراوية',
    name: 'سفاري بيتش باجي 4x4 في الصحراء مع عشاء وحفلة بدوية',
    nameEn: 'Desert Quad Buggy Safari with Bedouin Dinner & Show',
    description:
      'مغامرة انطلاق بالدراجات الرباعية في قلب سلاسل جبال البحر الأحمر وقت الغروب، تليها زيارة قرية بدوية وركوب جمال والاستمتاع بعشاء مشويات شرقي مع عروض فلكلورية وعروض نار ساحرة.',
    descriptionEn:
      'Thrilling quad bike tour across scenic desert dunes at sunset, followed by a traditional Bedouin village visit, camel ride, and BBQ dinner show.',
    badge: 'شائع',
    popular: true
  },
  {
    id: 'preset-orange-bay-island',
    category: 'أنشطة بحرية ويخوت',
    name: 'رحلة جزيرة أورانج باي وجزيرة الجفتون باللانش السريع',
    nameEn: 'Orange Bay & Giftun Island Speedboat Excursion',
    description:
      'استمتع بالرمال البيضاء والمياه الفيروزية الساحرة في مالديف مصر مع ساعتين استرخاء على شاطئ أورانج باي، جولة ألعاب مائية (بنانا وتابلت)، وغداء بوفيه مفتوح مع مرشد سياحي.',
    descriptionEn:
      'Relax on the Caribbean-like white sands of Orange Bay with crystal water, watersports activities, and delicious buffet dining.',
    badge: 'عائلي',
    popular: true
  },
  {
    id: 'preset-semi-submarine',
    category: 'جولات ترفيهية وعائلية',
    name: 'جولة الغواصة شبه الغاطسة لمشاهدة الحياة البحرية للأطفال والعائلات',
    nameEn: 'Semi-Submarine Underwater Explorer for Families',
    description:
      'مشاهدة بانورامية لأعماق البحر الأحمر من خلال كابينة زجاجية مكيفة على عمق 4 أمتار تحت سطح الماء، مثالية لجميع الأعمار لمشاهدة الأسماك الملونة والشعاب النادرة دون الحاجة للسباحة.',
    descriptionEn:
      'Air-conditioned underwater observation deck viewing exotic coral formations and marine life up-close, suitable for all ages without getting wet.',
    badge: 'للأطفال والعائلات',
    popular: false
  },
  {
    id: 'preset-padi-intro-dive',
    category: 'غوص وسنوركلينج',
    name: 'تجربة الغوص للمبتدئين (Intro Dive) مع مدرب PADI معتمد',
    nameEn: 'Introductory Scuba Diving with Certified PADI Instructor',
    description:
      'غطسة فردية للمبتدئين مع شرح تدريبي كامل ومرافقة فردية خطوة بخطوة مع كابتن غوص محترف لاكتشاف روعة عالم البحار بكل أمان وتصوير تذكاري تحت الماء.',
    descriptionEn:
      'One-on-one intro scuba dive supervised by certified PADI masters with complete briefing, safety gear, and underwater souvenir photos.',
    badge: 'معتمد',
    popular: true
  },
  {
    id: 'preset-horse-beach-sunset',
    category: 'جولات ترفيهية وعائلية',
    name: 'فروسية وركوب خيل عربي على الشاطئ والصحراء وقت الغروب',
    nameEn: 'Arabian Horse Riding on Beach & Desert at Sunset',
    description:
      'جولة ساحرة على ظهور الخيول العربية الأصيلة بطول شاطئ البحر الأحمر والكثبان الرملية الذهبية، مناسبة للمبتدئين والفرسان المحترفين برفقة مدرب معتمد.',
    descriptionEn:
      'Scenic horseback trail ride featuring trained Arabian horses along coastal shores and tranquil desert trails during magical sunset hours.',
    badge: 'رومانسي',
    popular: false
  }
];

export const INITIAL_STORED_COUNTRIES: string[] = [
  'جمهورية مصر العربية',
  'المملكة العربية السعودية',
  'الإمارات العربية المتحدة',
  'المملكة الأردنية الهاشمية',
  'سلطنة عمان',
  'اليونان'
];

export const INITIAL_STORED_CITIES: string[] = [
  'الغردقة',
  'الجونة',
  'شرم الشيخ',
  'مرسى علم',
  'دهب',
  'الأقصر',
  'أسوان',
  'طابا',
  'نويبع',
  'العلمين الجديدة'
];

export const INITIAL_STORED_SITES: string[] = [
  'مارينا الغردقة الجديدة (Hurghada Marina)',
  'مارينا أبوتيج بالجونة (Abu Tig)',
  'جزيرة أورانج باي (Orange Bay)',
  'جزيرة الجفتون الكبرى (Giftun Island)',
  'شعاب الفانوس والدلافين (Dolphin House)',
  'وادي الصحراء الكبرى وسلاسل الجبال',
  'خليج مكادي وسهل حشيش',
  'محمية رأس محمد والواحات البحرية'
];

export interface StoredWaypointTemplate {
  id: string;
  name: string;
  type: Waypoint['type'];
  durationMinutes?: number;
  departureTime?: string;
  returnTime?: string;
  description: string;
}

export function sortItineraryWithAnchors(waypoints: Waypoint[]): Waypoint[] {
  const departures = waypoints.filter((w) => w.type === 'departure');
  const middles = waypoints.filter((w) => w.type !== 'departure' && w.type !== 'return');
  const returns = waypoints.filter((w) => w.type === 'return');
  return [...departures, ...middles, ...returns].map((w, idx) => ({
    ...w,
    order: idx + 1
  }));
}

export const INITIAL_STORED_WAYPOINTS_BANK: StoredWaypointTemplate[] = [];

export interface StoredDurationPreset {
  id: string;
  label: string;
  days: number;
  hours: number;
  minutes: number;
}

export const INITIAL_STORED_DURATIONS: StoredDurationPreset[] = [
  { id: 'dur-1', label: 'ساعتان (جولة سريعة)', days: 0, hours: 2, minutes: 0 },
  { id: 'dur-2', label: '3 ساعات (مغامرة نصف يوم خفيفة)', days: 0, hours: 3, minutes: 0 },
  { id: 'dur-3', label: '4 ساعات (نصف يوم صباحي أو غروب)', days: 0, hours: 4, minutes: 0 },
  { id: 'dur-4', label: '6 ساعات (رحلة بحرية موسعة)', days: 0, hours: 6, minutes: 0 },
  { id: 'dur-5', label: '8 ساعات (يوم كامل VIP مع غداء)', days: 0, hours: 8, minutes: 0 },
  { id: 'dur-6', label: 'يومان (مبيت وتخييم صحراوي / يخت)', days: 2, hours: 0, minutes: 0 },
  { id: 'dur-7', label: '3 أيام (رحلة سفاري بحري غوص احترافي)', days: 3, hours: 0, minutes: 0 }
];

export interface StoredStatusOption {
  id: string;
  label: string;
  badgeText: string;
  color: string;
}

export const INITIAL_STORED_STATUSES: StoredStatusOption[] = [
  { id: 'draft', label: '1. مسودة داخلية', badgeText: 'مسودة', color: 'slate' },
  { id: 'pending_review', label: '2. بانتظار المراجعة والاعتماد', badgeText: 'قيد المراجعة', color: 'amber' },
  { id: 'published', label: '3. منشور ومتاح للحجز المباشر', badgeText: 'منشور', color: 'emerald' },
  { id: 'paused', label: '4. موقوف مؤقتاً', badgeText: 'موقوف', color: 'rose' },
  { id: 'archived', label: '5. مؤرشف في السجلات', badgeText: 'مؤرشف', color: 'slate' }
];

export interface StoredChannelItem {
  id: string;
  name: string;
  description: string;
  badge: string;
  active: boolean;
}

export const INITIAL_STORED_CHANNELS: StoredChannelItem[] = [
  {
    id: 'ownerStorefront',
    name: 'موقعي الخاص (المتجر المباشر)',
    description: 'نشر النشاط مباشرة على صفحة المتجر والموقع الإلكتروني الخاص بك لاستقبال الحجوزات المباشرة.',
    badge: 'حجز مباشر',
    active: true
  },
  {
    id: 'tourismMarketplace',
    name: 'داخل المنصة (سوق ZanoZa)',
    description: 'عرض النشاط في متجر الأنشطة العام بالمنصة للشركات السياحية والوكلاء وجميع الزوار.',
    badge: 'سوق عام',
    active: true
  },
  {
    id: 'mobileApp',
    name: 'تطبيق الهاتف الذكي للمسافرين (Mobile App)',
    description: 'إتاحة النشاط داخل تطبيق الهاتف الجوال للنزلاء في الفنادق والسياح.',
    badge: 'تطبيق الجوال',
    active: true
  },
  {
    id: 'b2bAgents',
    name: 'شبكة وكلاء السياحة وشركات B2B',
    description: 'إتاحة النشاط لشركات السياحة والفنادق الشريكة بأسعار الجملة والعقود السنوية.',
    badge: 'B2B',
    active: false
  }
];

export interface StoredDescriptionTemplate {
  id: string;
  title: string;
  text: string;
}

export const INITIAL_STORED_DESCRIPTION_TEMPLATES: StoredDescriptionTemplate[] = [
  {
    id: 'dt-1',
    title: 'رحلة بحرية VIP ويخوت فاخرة',
    text: 'تجربة إبحار حصرية على متن يخت فاخر شاملة وجبة غداء بحرية طازجة، وقفتين سنوركلينج عند أجمل الشعاب المرجانية، ومشروبات غير محدودة طوال الرحلة، مع طاقم بحري محترف لضمان أقصى درجات الأمان والراحة.'
  },
  {
    id: 'dt-2',
    title: 'مغامرة سفاري بيتش باجي وغروب صحراوي',
    text: 'انطلاق بالبيتش باجي في دروب الصحراء وسلاسل الجبال وقت الغروب، زيارة قرية بدوية أصيلة وتذوق شاي الأعشاب وركوب الجمال، يتبعها عشاء مشويات شرقي فاخر وحفلة فلكلورية مع عروض النار والنجوم.'
  },
  {
    id: 'dt-3',
    title: 'جولة عائلية خفيفة واستكشاف بحري',
    text: 'برنامج ممتع وآمن لجميع أفراد العائلة والأطفال، يشمل مرشداً سياحياً معتمداً، انتقالات مكيفة ومريحة، مشاهدة الكائنات البحرية والشعاب النادرة عبر الغواصة أو الزوارق الزجاجية، وأنشطة ترفيهية خفيفة.'
  },
  {
    id: 'dt-4',
    title: 'دورة وتجربة غوص أعماق PADI للمبتدئين',
    text: 'تجربة غوص فريدة بإشراف مدربين دوليين معتمدين من PADI، تتضمن شرحاً تفصيلياً لقواعد السلامة وتجهيز المعدات، غطسة تدريبية مرافقة خطوة بخطوة في بيئة بحرية ساحرة وتصوير فوتوغرافي احترافي تحت الماء.'
  }
];

export const INITIAL_STORED_INCLUSIONS: string[] = [
  'وجبة غداء بوفيه مفتوح',
  'مأكولات بحرية طازجة',
  'مشروبات ساخنة وباردة غير محدودة',
  'معدات سنوركلينج كاملة حديثة',
  'لايف جاكيت وسترات نجاة معتمدة',
  'مرشد سياحي بحري معتمد',
  'تأمين شامل على الركاب',
  'تصوير فوتوغرافي تذكاري',
  'جولة ألعاب مائية (بنانا وتابلت)',
  'انتقالات ذهاب وعودة من الفندق',
  'عشاء مشويات بدوي فاخر',
  'ركوب جمال وشاي أعشاب'
];

export const INITIAL_STORED_EXCLUSIONS: string[] = [
  'التقاط الصور الخاصة تحت الماء بالطلب',
  'رسوم دخول المحميات الطبيعية (إن وجدت)',
  'المشروبات الكحولية والمعلبات المستوردة',
  'الإكراميات والإضافات الشخصية',
  'خدمة النقل من المناطق البعيدة (الجونة / سوما باي)'
];

export const INITIAL_STORED_PICKUP_POINTS: string[] = [
  'فندق أو منتجع الإقامة (Hotel Lobby Pick-up)',
  'مارينا الغردقة الجديدة - البوابة الرئيسية',
  'مارينا أبوتيج بالجونة (Abu Tig Marina Gate)',
  'ممشى شيري السياحي - وسط المدينة',
  'ممشى النصر السياحي بالغردقة',
  'بوابة منتجع سهل حشيش الرئيسية',
  'نقطة التجمع الرئيسية بخليج مكادي',
  'بورت غالب مارينا - مرسى علم'
];

export interface StoredPricingPackage {
  id: string;
  name: string;
  badge: string;
  egyptianAdult: number;
  egyptianChild: number;
  egyptianPrivate: number;
  foreignAdult: number;
  foreignChild: number;
  foreignPrivate: number;
}

export const INITIAL_STORED_PRICING_PACKAGES: StoredPricingPackage[] = [
  {
    id: 'pkg-eco',
    name: 'الباقة الاقتصادية القياسية',
    badge: 'اقتصادي',
    egyptianAdult: 650,
    egyptianChild: 350,
    egyptianPrivate: 4500,
    foreignAdult: 30,
    foreignChild: 15,
    foreignPrivate: 180
  },
  {
    id: 'pkg-family',
    name: 'باقة العائلات المميزة',
    badge: 'عائلي شائع',
    egyptianAdult: 950,
    egyptianChild: 500,
    egyptianPrivate: 6500,
    foreignAdult: 45,
    foreignChild: 25,
    foreignPrivate: 260
  },
  {
    id: 'pkg-vip',
    name: 'باقة VIP الفاخرة الملكية',
    badge: 'VIP فاخر',
    egyptianAdult: 1800,
    egyptianChild: 900,
    egyptianPrivate: 12500,
    foreignAdult: 80,
    foreignChild: 40,
    foreignPrivate: 480
  }
];
