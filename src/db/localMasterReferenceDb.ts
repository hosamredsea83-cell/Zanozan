import type {
  CityRecord,
  CountryRecord,
  EquipmentUnitKindItem,
  InclusionCatalogItem,
  ManufacturerModelRecord,
  ManufacturerRecord,
  MeetingPointRecord,
  SpecGroupRecord
} from '../types/masterReference';
import {
  CITIES_REF_STORE_NAME,
  COUNTRIES_REF_STORE_NAME,
  EQUIPMENT_UNIT_KINDS_STORE_NAME,
  INCLUSIONS_CATALOG_STORE_NAME,
  MANUFACTURERS_STORE_NAME,
  MANUFACTURER_MODELS_STORE_NAME,
  MEETING_POINTS_REF_STORE_NAME,
  SPEC_GROUPS_STORE_NAME,
  ensureOneTimeV6CleanReset,
  openUnifiedLocalDb
} from './unifiedLocalDb';

const LS_SPEC_GROUPS_FALLBACK = 'zanoza_db_master_spec_groups_v6';
const LS_INCLUSIONS_FALLBACK = 'zanoza_db_inclusions_catalog_v6';
const LS_EQ_UNIT_KINDS_FALLBACK = 'zanoza_db_ref_eq_unit_kinds_v11';
const LS_MANUFACTURERS_FALLBACK = 'zanoza_db_ref_manufacturers_v11';
const LS_MFG_MODELS_FALLBACK = 'zanoza_db_ref_mfg_models_v11';
const LS_COUNTRIES_FALLBACK = 'zanoza_db_ref_countries_v11';
const LS_CITIES_FALLBACK = 'zanoza_db_ref_cities_v11';
const LS_MEETING_POINTS_FALLBACK = 'zanoza_db_ref_meeting_points_v11';

const SEED_TS = '2026-11-01T08:00:00.000Z';

export function buildInitialSpecGroups(): SpecGroupRecord[] {
  return [
    // 1. Marine & Yachts (cat-marine)
    {
      id: 'grp-marine-voyage',
      name: 'مواصفات الرحلة البحرية واليخت',
      scope: 'activity_spec',
      description: 'مجموعة المواصفات القياسية لرحلات اليخوت الخاصة والمشتركة والقوارب السريعة',
      order: 1,
      isActive: true,
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'grp-marine-vip-hospitality',
      name: 'ضيافة وتجهيزات اليخت VIP',
      scope: 'activity_spec',
      description: 'تجهيزات ومزايا خاصة برحلات اليخوت الخاصة VIP',
      order: 2,
      isActive: true,
      linkedCategoryIds: ['cat-marine-yacht-vip'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },

    // 2. Diving & Snorkeling (cat-diving)
    {
      id: 'grp-diving-program',
      name: 'معايير برنامج الغوص والسنوركلينج',
      scope: 'activity_spec',
      description: 'العمق المسموح، الاعتماد الدولي، وعدد الغطسات أو وقفات السباحة',
      order: 3,
      isActive: true,
      linkedCategoryIds: ['cat-diving'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'grp-diving-pro-requirements',
      name: 'اشتراطات غوص الأعماق المعتمد',
      scope: 'activity_spec',
      description: 'ضوابط الرخصة الدولية والغوص العميق لحاملي الشهادات المعتمدة فقط',
      order: 4,
      isActive: true,
      linkedCategoryIds: ['cat-diving-pro'],
      excludedCategoryIds: ['cat-diving-snorkel'],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },

    // 3. Desert Safari (cat-safari)
    {
      id: 'grp-safari-route',
      name: 'مسار ومواصفات رحلة السفاري',
      scope: 'activity_spec',
      description: 'مسافة التحرك الصحراوي، التوقيت، ونوع التضاريس',
      order: 5,
      isActive: true,
      linkedCategoryIds: ['cat-safari'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'grp-safari-camp-program',
      name: 'فعاليات المخيم البدوي ورصد النجوم',
      scope: 'activity_spec',
      description: 'برنامج الأمسية البدوية والعشاء التراثي والتليسكوب الفلكي',
      order: 6,
      isActive: true,
      linkedCategoryIds: ['cat-safari-bedouin', 'cat-safari-4x4'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },

    // 4. Leisure, Marine Glass Boat, Watersports & Equestrian/Nile (cat-leisure)
    {
      id: 'grp-leisure-experience',
      name: 'مواصفات الجولة الترفيهية والمائية',
      scope: 'activity_spec',
      description: 'ارتفاع التحليق، مدة التجربة، ومستوى الملاءمة العائلية',
      order: 7,
      isActive: true,
      linkedCategoryIds: ['cat-leisure'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },

    // 5. Cross-category Safety & Guidance
    {
      id: 'grp-safety-guidance',
      name: 'ضوابط السلامة ولغات الإرشاد',
      scope: 'activity_spec',
      description: 'مجموعة قياسية مشتركة لمتطلبات السلامة والعمر الأدنى ولغات المرشدين',
      order: 8,
      isActive: true,
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-safari', 'cat-leisure'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },

    // Equipment Library Groups (مجموعات خصائص المعدات المركزية)
    {
      id: 'grp-eq-yacht',
      name: 'مواصفات اليخوت والمراكب البحرية',
      scope: 'equipment_library',
      description: 'الخصائص الفنية الثابتة لليخوت والمراكب واللانشات السريعة',
      order: 9,
      isActive: true,
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-yacht', 'uk-sea-boat', 'uk-nile-boat', 'uk-launch'],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'grp-eq-diving',
      name: 'مواصفات معدات الغوص والسنوركلينج',
      scope: 'equipment_library',
      description: 'خصائص أسطوانات الهواء، منظمات الغوص، وبدل النيوبرين',
      order: 10,
      isActive: true,
      linkedCategoryIds: ['cat-diving'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-diving'],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'grp-eq-safari',
      name: 'مواصفات مركبات ودراجات السفاري',
      scope: 'equipment_library',
      description: 'سعة المحرك، ناقل الحركة، ونظام الدفع الرباعي',
      order: 11,
      isActive: true,
      linkedCategoryIds: ['cat-safari'],
      excludedCategoryIds: ['cat-safari-bedouin'],
      linkedUnitKindIds: ['uk-quad-buggy', 'uk-safari-4x4'],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'grp-eq-leisure',
      name: 'مواصفات الغواصات والألعاب المائية والفروسية',
      scope: 'equipment_library',
      description: 'خصائص الغواصات الزجاجية ومظلات الباراشوت والفلوكة النيلية',
      order: 12,
      isActive: true,
      linkedCategoryIds: ['cat-leisure'],
      excludedCategoryIds: [],
      linkedUnitKindIds: ['uk-glassboat', 'uk-watersports', 'uk-nile-boat'],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    }
  ];
}

export function buildInitialInclusionsCatalog(): InclusionCatalogItem[] {
  return [
    // Included: Marine
    {
      id: 'inc-marine-lunch',
      kind: 'included',
      label: 'بوفيه غداء مفتوح على متن اليخت',
      isActive: true,
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: ['cat-marine-speedboat'],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'inc-marine-drinks',
      kind: 'included',
      label: 'مشروبات غازية ومياه معدنية ومشروبات ساخنة طوال الرحلة',
      isActive: true,
      linkedCategoryIds: ['cat-marine', 'cat-diving'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'inc-marine-lifejacket',
      kind: 'included',
      label: 'سترات النجاة المعتمدة ومعدات السلامة البحرية',
      isActive: true,
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-leisure'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'inc-marine-vip-fruit',
      kind: 'included',
      label: 'ضيافة ترحيبية وفواكه موسمية ومناشف شاطئية معقمة',
      isActive: true,
      linkedCategoryIds: ['cat-marine-yacht-vip'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'inc-marine-snorkel-mask',
      kind: 'included',
      label: 'ماسك وزعانف سنوركلينج طوال التوقف البحري',
      isActive: true,
      linkedCategoryIds: ['cat-marine', 'cat-diving'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },

    // Included: Diving
    {
      id: 'inc-diving-gear',
      kind: 'included',
      label: 'طقم غوص كامل (أسطوانة هواء + منظم + BCD + بدلة نيوبرين + أوزان)',
      isActive: true,
      linkedCategoryIds: ['cat-diving'],
      excludedCategoryIds: ['cat-diving-snorkel'],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'inc-diving-instructor',
      kind: 'included',
      label: 'إشراف مدرب غوص دولي معتمد PADI طوال الغطسة',
      isActive: true,
      linkedCategoryIds: ['cat-diving'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },

    // Included: Safari
    {
      id: 'inc-safari-tea',
      kind: 'included',
      label: 'شاي بدوي أصلي ومياه معدنية باردة في الخيمة البدوية',
      isActive: true,
      linkedCategoryIds: ['cat-safari'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'inc-safari-helmet',
      kind: 'included',
      label: 'خوذة حماية معتمدة وتدريب عملي قبل الانطلاق بالمسار',
      isActive: true,
      linkedCategoryIds: ['cat-safari-quad'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'inc-safari-dinner',
      kind: 'included',
      label: 'عشاء شواء بدوي مفتوح وعرض فلكلوري مسائي',
      isActive: true,
      linkedCategoryIds: ['cat-safari-bedouin', 'cat-safari-4x4'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },

    // Included: Leisure
    {
      id: 'inc-leisure-transfer',
      kind: 'included',
      label: 'انتقالات ذهاب وعودة من الفندق بسيارة مكيفة',
      isActive: true,
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-safari', 'cat-leisure'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'inc-leisure-trainer',
      kind: 'included',
      label: 'مرافقة مدرب فروسية أو طاقم تشغيل متخصص طوال التجربة',
      isActive: true,
      linkedCategoryIds: ['cat-leisure'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },

    // Excluded (غير مشمول)
    {
      id: 'exc-island-fees',
      kind: 'excluded',
      label: 'رسوم دخول المحميات الطبيعية وتصاريح الجزر البحرية',
      isActive: true,
      linkedCategoryIds: ['cat-marine', 'cat-diving'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'exc-pro-photos',
      kind: 'excluded',
      label: 'جلسة التصوير الفوتوغرافي أو الفيديو بالدرون والـ GoPro',
      isActive: true,
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-safari', 'cat-leisure'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'exc-diving-comp',
      kind: 'excluded',
      label: 'تأجير كمبيوتر الغوص الشخصي أو بدلة الغوص الإضافية السميكة',
      isActive: true,
      linkedCategoryIds: ['cat-diving'],
      excludedCategoryIds: ['cat-diving-snorkel'],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'exc-safari-scarf',
      kind: 'excluded',
      label: 'الشال الصحراوي والنظارات الواقية من الأتربة (متاحة للشراء)',
      isActive: true,
      linkedCategoryIds: ['cat-safari'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'exc-personal-tips',
      kind: 'excluded',
      label: 'الإكراميات والمصروفات الشخصية خارج البرنامج',
      isActive: true,
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-safari', 'cat-leisure'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'exc-far-hotel-transfer',
      kind: 'excluded',
      label: 'رسوم الانتقالات الإضافية من الفنادق البعيدة (سهل حشيش / الجونة / مكادي)',
      isActive: true,
      linkedCategoryIds: ['cat-marine', 'cat-safari', 'cat-leisure'],
      excludedCategoryIds: [],
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    }
  ];
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

async function replaceStoreAll<T>(
  storeName: string,
  items: T[],
  lsFallbackKey: string
): Promise<void> {
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

const LS_REF_SPECGROUP_UNITKINDS_V3 = 'zanoza_ref_specgroup_unitkinds_v3';

export async function loadSpecGroupsFromDb(): Promise<SpecGroupRecord[]> {
  const wiped = ensureOneTimeV6CleanReset();
  const existing = wiped
    ? []
    : await readStoreAll<SpecGroupRecord>(SPEC_GROUPS_STORE_NAME, LS_SPEC_GROUPS_FALLBACK);

  if (existing.length > 0) {
    let migrated = false;
    try {
      migrated = window.localStorage.getItem(LS_REF_SPECGROUP_UNITKINDS_V3) === '1';
    } catch {
      migrated = false;
    }
    const seedMap = new Map(buildInitialSpecGroups().map((s) => [s.id, s]));
    const needsBackfill =
      !migrated ||
      existing.some(
        (g) => g.scope === 'equipment_library' && seedMap.get(g.id)?.linkedUnitKindIds && g.linkedUnitKindIds === undefined
      );
    if (needsBackfill) {
      try {
        window.localStorage.setItem(LS_REF_SPECGROUP_UNITKINDS_V3, '1');
      } catch {
        // ignore
      }
      const upgraded = existing.map((g) => {
        const seed = seedMap.get(g.id);
        if (!seed || g.linkedUnitKindIds !== undefined) return g;
        return {
          ...g,
          linkedUnitKindIds: seed.linkedUnitKindIds ?? []
        };
      });
      await replaceStoreAll(SPEC_GROUPS_STORE_NAME, upgraded, LS_SPEC_GROUPS_FALLBACK);
      return [...upgraded].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return [...existing].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const seeded = buildInitialSpecGroups();
  await replaceStoreAll(SPEC_GROUPS_STORE_NAME, seeded, LS_SPEC_GROUPS_FALLBACK);
  return seeded;
}

export async function saveSpecGroupsToDb(items: SpecGroupRecord[]): Promise<void> {
  await replaceStoreAll(SPEC_GROUPS_STORE_NAME, items, LS_SPEC_GROUPS_FALLBACK);
}

export async function resetAndReseedSpecGroupsDb(): Promise<SpecGroupRecord[]> {
  const seeded = buildInitialSpecGroups();
  await replaceStoreAll(SPEC_GROUPS_STORE_NAME, seeded, LS_SPEC_GROUPS_FALLBACK);
  return seeded;
}

export async function loadInclusionsCatalogFromDb(): Promise<InclusionCatalogItem[]> {
  const wiped = ensureOneTimeV6CleanReset();
  const existing = wiped
    ? []
    : await readStoreAll<InclusionCatalogItem>(
        INCLUSIONS_CATALOG_STORE_NAME,
        LS_INCLUSIONS_FALLBACK
      );

  if (existing.length > 0) {
    return existing;
  }

  const seeded = buildInitialInclusionsCatalog();
  await replaceStoreAll(INCLUSIONS_CATALOG_STORE_NAME, seeded, LS_INCLUSIONS_FALLBACK);
  return seeded;
}

export async function saveInclusionsCatalogToDb(items: InclusionCatalogItem[]): Promise<void> {
  await replaceStoreAll(INCLUSIONS_CATALOG_STORE_NAME, items, LS_INCLUSIONS_FALLBACK);
}

export async function resetAndReseedInclusionsCatalogDb(): Promise<InclusionCatalogItem[]> {
  const seeded = buildInitialInclusionsCatalog();
  await replaceStoreAll(INCLUSIONS_CATALOG_STORE_NAME, seeded, LS_INCLUSIONS_FALLBACK);
  return seeded;
}

// ============================================================================
// Equipment Unit Kinds, Manufacturers, Models & Geographic References
// ============================================================================

export function buildInitialEquipmentUnitKinds(): EquipmentUnitKindItem[] {
  return [
    // ==================== Equipment Domain Unit Kinds ====================
    {
      id: 'uk-yacht',
      name: 'يخت',
      domainScope: 'equipment',
      defaultCategoryId: 'cat-marine-yacht-vip',
      defaultTypeId: 'eqt-yacht',
      linkedCategoryIds: ['cat-marine'],
      excludedCategoryIds: [],
      description: 'يخت سياحي خاص أو مشترك',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-nile-boat',
      name: 'مركب نيلي',
      domainScope: 'equipment',
      defaultCategoryId: 'cat-leisure-equestrian-nile',
      defaultTypeId: 'eqt-leisure_gear',
      linkedCategoryIds: ['cat-leisure-equestrian-nile'],
      excludedCategoryIds: [],
      description: 'مركب نيلي أو دهبية / فلوكة نيلية',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-sea-boat',
      name: 'مركب',
      domainScope: 'equipment',
      defaultCategoryId: 'cat-marine-yacht-shared',
      defaultTypeId: 'eqt-yacht',
      linkedCategoryIds: ['cat-marine', 'cat-diving'],
      excludedCategoryIds: [],
      description: 'مركب بحري للرحلات اليومية والجزر',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-launch',
      name: 'لانش',
      domainScope: 'equipment',
      defaultCategoryId: 'cat-marine-speedboat',
      defaultTypeId: 'eqt-yacht',
      linkedCategoryIds: ['cat-marine', 'cat-diving'],
      excludedCategoryIds: [],
      description: 'لانش سريع / سبيد بوت بحري',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-quad-buggy',
      name: 'باتش باجي',
      domainScope: 'equipment',
      defaultCategoryId: 'cat-safari-quad',
      defaultTypeId: 'eqt-safari_vehicle',
      linkedCategoryIds: ['cat-safari-quad'],
      excludedCategoryIds: [],
      description: 'دراجة صحراوية / كواد سفاري رباعي',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-safari-4x4',
      name: 'سيارة سفاري 4x4',
      domainScope: 'equipment',
      defaultCategoryId: 'cat-safari-4x4',
      defaultTypeId: 'eqt-safari_vehicle',
      linkedCategoryIds: ['cat-safari-4x4', 'cat-safari-bedouin'],
      excludedCategoryIds: [],
      description: 'سيارة دفع رباعي مجهزة للسفاري الصحراوي',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-glassboat',
      name: 'غواصة / مركب زجاجي',
      domainScope: 'equipment',
      defaultCategoryId: 'cat-leisure-glassboat',
      defaultTypeId: 'eqt-leisure_gear',
      linkedCategoryIds: ['cat-leisure-glassboat'],
      excludedCategoryIds: [],
      description: 'غواصة سياحية أو قارب قاع زجاجي',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-diving',
      name: 'معدات غوص وسنوركلينج',
      domainScope: 'equipment',
      defaultCategoryId: 'cat-diving-pro',
      defaultTypeId: 'eqt-diving_gear',
      linkedCategoryIds: ['cat-diving', 'cat-marine'],
      excludedCategoryIds: [],
      description: 'أسطوانات ومنظمات وبدل غوص وسنوركلينج',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-watersports',
      name: 'ألعاب مائية / باراشوت',
      domainScope: 'equipment',
      defaultCategoryId: 'cat-leisure-watersports',
      defaultTypeId: 'eqt-leisure_gear',
      linkedCategoryIds: ['cat-leisure-watersports'],
      excludedCategoryIds: [],
      description: 'باراسيلينج، جيت سكي، وبنانا بوت',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    // ==================== Logistics (Transport) Domain Unit Kinds ====================
    {
      id: 'uk-car',
      name: 'سيارة سيدان / ليموزين',
      domainScope: 'logistics',
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-safari', 'cat-leisure'],
      excludedCategoryIds: [],
      description: 'سيارة سياحية خاصة أو ليموزين VIP للانتقالات',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-hiace-van',
      name: 'فان سياحي / هاي إس',
      domainScope: 'logistics',
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-safari', 'cat-leisure'],
      excludedCategoryIds: [],
      description: 'ميكروباص سياحي أو فان عائلي حتى 14 راكب',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-coaster-bus',
      name: 'ميني باص كوستر',
      domainScope: 'logistics',
      linkedCategoryIds: ['cat-marine', 'cat-diving', 'cat-leisure'],
      excludedCategoryIds: [],
      description: 'حافلة سياحية متوسطة حتى 26 راكب',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-tourist-bus',
      name: 'أتوبيس سياحي كبير',
      domainScope: 'logistics',
      linkedCategoryIds: ['cat-marine', 'cat-leisure'],
      excludedCategoryIds: [],
      description: 'أتوبيس رحلات وتفويج 45–50 راكب',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-logistics-4x4',
      name: 'سيارة دفع رباعي 4x4 (نقل)',
      domainScope: 'logistics',
      linkedCategoryIds: ['cat-safari'],
      excludedCategoryIds: [],
      description: 'مركبة نقل لوجستية للصحراء والطرق الوعرة',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'uk-shuttle-boat',
      name: 'قارب / لنش توصيل بحري',
      domainScope: 'logistics',
      linkedCategoryIds: ['cat-marine', 'cat-diving'],
      excludedCategoryIds: [],
      description: 'قارب نقل وتوصيل لوجستي للجزر والمارينا',
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    }
  ];
}

export function buildInitialManufacturers(): ManufacturerRecord[] {
  return [
    // Transport & Safari vehicles
    {
      id: 'mfg-nissan',
      name: 'نيسان (Nissan)',
      applicableTo: 'both',
      linkedUnitKindIds: ['uk-car', 'uk-hiace-van', 'uk-logistics-4x4', 'uk-safari-4x4'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'mfg-toyota',
      name: 'تويوتا (Toyota)',
      applicableTo: 'both',
      linkedUnitKindIds: ['uk-car', 'uk-hiace-van', 'uk-coaster-bus', 'uk-logistics-4x4', 'uk-safari-4x4'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'mfg-mercedes',
      name: 'مرسيدس بنز (Mercedes-Benz)',
      applicableTo: 'logistics',
      linkedUnitKindIds: ['uk-car', 'uk-hiace-van', 'uk-tourist-bus'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'mfg-hyundai',
      name: 'هيونداي (Hyundai)',
      applicableTo: 'logistics',
      linkedUnitKindIds: ['uk-car', 'uk-hiace-van'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'mfg-mitsubishi',
      name: 'ميتسوبيشي (Mitsubishi)',
      applicableTo: 'both',
      linkedUnitKindIds: ['uk-car', 'uk-logistics-4x4', 'uk-safari-4x4'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    // Quad buggies & watersports
    {
      id: 'mfg-polaris',
      name: 'بولاريس (Polaris)',
      applicableTo: 'equipment',
      linkedUnitKindIds: ['uk-quad-buggy'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'mfg-canam',
      name: 'كان-آم (Can-Am)',
      applicableTo: 'equipment',
      linkedUnitKindIds: ['uk-quad-buggy'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'mfg-yamaha',
      name: 'ياماها (Yamaha)',
      applicableTo: 'both',
      linkedUnitKindIds: ['uk-quad-buggy', 'uk-watersports', 'uk-launch', 'uk-shuttle-boat'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'mfg-honda',
      name: 'هوندا (Honda)',
      applicableTo: 'equipment',
      linkedUnitKindIds: ['uk-quad-buggy', 'uk-launch'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    // Yachts & boats
    {
      id: 'mfg-azimut',
      name: 'أزيموت (Azimut Yachts)',
      applicableTo: 'equipment',
      linkedUnitKindIds: ['uk-yacht'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'mfg-sunseeker',
      name: 'صن سيكر (Sunseeker)',
      applicableTo: 'equipment',
      linkedUnitKindIds: ['uk-yacht'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'mfg-searay',
      name: 'سي راي (Sea Ray)',
      applicableTo: 'equipment',
      linkedUnitKindIds: ['uk-launch', 'uk-yacht'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'mfg-zodiac',
      name: 'زودياك (Zodiac)',
      applicableTo: 'both',
      linkedUnitKindIds: ['uk-launch', 'uk-sea-boat', 'uk-shuttle-boat'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'mfg-nileyard',
      name: 'ترسانة النيل والبحر الأحمر',
      applicableTo: 'both',
      linkedUnitKindIds: ['uk-nile-boat', 'uk-sea-boat', 'uk-launch', 'uk-glassboat', 'uk-shuttle-boat'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    // Diving
    {
      id: 'mfg-mares',
      name: 'ماريس (Mares)',
      applicableTo: 'equipment',
      linkedUnitKindIds: ['uk-diving'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    },
    {
      id: 'mfg-scubapro',
      name: 'سكوبا برو (Scubapro)',
      applicableTo: 'equipment',
      linkedUnitKindIds: ['uk-diving'],
      isActive: true,
      createdAt: SEED_TS,
      updatedAt: SEED_TS
    }
  ];
}

export function buildInitialManufacturerModels(): ManufacturerModelRecord[] {
  return [
    // Nissan
    { id: 'mdl-nissan-sunny', manufacturerId: 'mfg-nissan', name: 'صني (Sunny)', applicableTo: 'logistics', unitKindId: 'uk-car', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-nissan-sentra', manufacturerId: 'mfg-nissan', name: 'سنترا (Sentra)', applicableTo: 'logistics', unitKindId: 'uk-car', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-nissan-urvan', manufacturerId: 'mfg-nissan', name: 'أورفان سياحي (Urvan)', applicableTo: 'logistics', unitKindId: 'uk-hiace-van', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-nissan-patrol', manufacturerId: 'mfg-nissan', name: 'باترول 4x4 (Patrol)', applicableTo: 'both', unitKindId: 'uk-safari-4x4', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Toyota
    { id: 'mdl-toyota-hiace', manufacturerId: 'mfg-toyota', name: 'هاي إس (HiAce)', applicableTo: 'logistics', unitKindId: 'uk-hiace-van', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-toyota-coaster', manufacturerId: 'mfg-toyota', name: 'كوستر (Coaster)', applicableTo: 'logistics', unitKindId: 'uk-coaster-bus', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-toyota-landcruiser', manufacturerId: 'mfg-toyota', name: 'لاند كروزر (Land Cruiser)', applicableTo: 'both', unitKindId: 'uk-safari-4x4', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-toyota-corolla', manufacturerId: 'mfg-toyota', name: 'كورولا (Corolla)', applicableTo: 'logistics', unitKindId: 'uk-car', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Mercedes
    { id: 'mdl-mb-sprinter', manufacturerId: 'mfg-mercedes', name: 'سبرينتر (Sprinter)', applicableTo: 'logistics', unitKindId: 'uk-hiace-van', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-mb-vito', manufacturerId: 'mfg-mercedes', name: 'فيتو VIP (Vito)', applicableTo: 'logistics', unitKindId: 'uk-car', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-mb-mcv600', manufacturerId: 'mfg-mercedes', name: 'أتوبيس سياحي MCV 600', applicableTo: 'logistics', unitKindId: 'uk-tourist-bus', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Hyundai
    { id: 'mdl-hyundai-h1', manufacturerId: 'mfg-hyundai', name: 'إتش وان (H1)', applicableTo: 'logistics', unitKindId: 'uk-hiace-van', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-hyundai-staria', manufacturerId: 'mfg-hyundai', name: 'ستاريا (Staria)', applicableTo: 'logistics', unitKindId: 'uk-hiace-van', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-hyundai-elantra', manufacturerId: 'mfg-hyundai', name: 'إلنترا (Elantra)', applicableTo: 'logistics', unitKindId: 'uk-car', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Mitsubishi
    { id: 'mdl-mitsu-pajero', manufacturerId: 'mfg-mitsubishi', name: 'باجيرو (Pajero 4x4)', applicableTo: 'both', unitKindId: 'uk-safari-4x4', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Polaris
    { id: 'mdl-pol-sportsman450', manufacturerId: 'mfg-polaris', name: 'سبورتسمان 450 (Sportsman)', applicableTo: 'equipment', unitKindId: 'uk-quad-buggy', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-pol-rzr1000', manufacturerId: 'mfg-polaris', name: 'RZR 1000 XP', applicableTo: 'equipment', unitKindId: 'uk-quad-buggy', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-pol-trailboss', manufacturerId: 'mfg-polaris', name: 'تريل بوس 330 (Trail Boss)', applicableTo: 'equipment', unitKindId: 'uk-quad-buggy', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Can-Am
    { id: 'mdl-canam-outlander', manufacturerId: 'mfg-canam', name: 'أوتلاندر 500 (Outlander)', applicableTo: 'equipment', unitKindId: 'uk-quad-buggy', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-canam-maverick', manufacturerId: 'mfg-canam', name: 'مافريك X3 (Maverick)', applicableTo: 'equipment', unitKindId: 'uk-quad-buggy', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Yamaha
    { id: 'mdl-yam-grizzly', manufacturerId: 'mfg-yamaha', name: 'غريزلي 700 (Grizzly)', applicableTo: 'equipment', unitKindId: 'uk-quad-buggy', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-yam-waverunner', manufacturerId: 'mfg-yamaha', name: 'ويف رانر VX (Jet Ski)', applicableTo: 'equipment', unitKindId: 'uk-watersports', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Honda
    { id: 'mdl-honda-foreman', manufacturerId: 'mfg-honda', name: 'فورمان 500 (Foreman)', applicableTo: 'equipment', unitKindId: 'uk-quad-buggy', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Azimut
    { id: 'mdl-azi-fly60', manufacturerId: 'mfg-azimut', name: 'Fly 60', applicableTo: 'equipment', unitKindId: 'uk-yacht', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-azi-s6', manufacturerId: 'mfg-azimut', name: 'S6 Sport', applicableTo: 'equipment', unitKindId: 'uk-yacht', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Sunseeker
    { id: 'mdl-sun-manhattan55', manufacturerId: 'mfg-sunseeker', name: 'Manhattan 55', applicableTo: 'equipment', unitKindId: 'uk-yacht', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Sea Ray
    { id: 'mdl-searay-320', manufacturerId: 'mfg-searay', name: 'Sundancer 320', applicableTo: 'equipment', unitKindId: 'uk-launch', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Zodiac
    { id: 'mdl-zodiac-pro750', manufacturerId: 'mfg-zodiac', name: 'Pro 750 Speedboat', applicableTo: 'both', unitKindId: 'uk-launch', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Nile Shipyard
    { id: 'mdl-nile-dahabiya', manufacturerId: 'mfg-nileyard', name: 'مركب نيلي دورين (كلاسيك)', applicableTo: 'equipment', unitKindId: 'uk-nile-boat', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-nile-felucca', manufacturerId: 'mfg-nileyard', name: 'فلوكة نيلية شراعية 12 راكب', applicableTo: 'equipment', unitKindId: 'uk-nile-boat', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-redsea-launch9', manufacturerId: 'mfg-nileyard', name: 'لانش فيبر جلاس 9 متر', applicableTo: 'both', unitKindId: 'uk-launch', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Diving
    { id: 'mdl-mares-rover', manufacturerId: 'mfg-mares', name: 'طقم غوص كامل Rover', applicableTo: 'equipment', unitKindId: 'uk-diving', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mdl-scubapro-mk25', manufacturerId: 'mfg-scubapro', name: 'منظم MK25 EVO', applicableTo: 'equipment', unitKindId: 'uk-diving', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS }
  ];
}

export function buildInitialCountriesRef(): CountryRecord[] {
  return [
    { id: 'cnt-eg', name: 'جمهورية مصر العربية', code: 'EG', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cnt-sa', name: 'المملكة العربية السعودية', code: 'SA', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cnt-ae', name: 'الإمارات العربية المتحدة', code: 'AE', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cnt-jo', name: 'المملكة الأردنية الهاشمية', code: 'JO', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS }
  ];
}

export function buildInitialCitiesRef(): CityRecord[] {
  return [
    // Egypt
    { id: 'cty-hrg', countryId: 'cnt-eg', name: 'الغردقة', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cty-gouna', countryId: 'cnt-eg', name: 'الجونة', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cty-sharm', countryId: 'cnt-eg', name: 'شرم الشيخ', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cty-marsa', countryId: 'cnt-eg', name: 'مرسى علم', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cty-dahab', countryId: 'cnt-eg', name: 'دهب', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cty-luxor', countryId: 'cnt-eg', name: 'الأقصر', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cty-aswan', countryId: 'cnt-eg', name: 'أسوان', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cty-cairo', countryId: 'cnt-eg', name: 'القاهرة', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Saudi
    { id: 'cty-jeddah', countryId: 'cnt-sa', name: 'جدة', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cty-alula', countryId: 'cnt-sa', name: 'العلا', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cty-umluj', countryId: 'cnt-sa', name: 'أملج', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // UAE
    { id: 'cty-dubai', countryId: 'cnt-ae', name: 'دبي', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cty-abudhabi', countryId: 'cnt-ae', name: 'أبوظبي', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Jordan
    { id: 'cty-aqaba', countryId: 'cnt-jo', name: 'العقبة', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'cty-wadirum', countryId: 'cnt-jo', name: 'وادي رم', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS }
  ];
}

export function buildInitialMeetingPointsRef(): MeetingPointRecord[] {
  return [
    // Hurghada
    { id: 'mp-hrg-marina', countryId: 'cnt-eg', cityId: 'cty-hrg', name: 'مارينا الغردقة الجديدة (Hurghada Marina)', pointType: 'both', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mp-hrg-hotel', countryId: 'cnt-eg', cityId: 'cty-hrg', name: 'فندق أو منتجع الإقامة (Hotel Lobby Pick-up)', pointType: 'meeting_point', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mp-hrg-sherry', countryId: 'cnt-eg', cityId: 'cty-hrg', name: 'ممشى شيري السياحي - وسط المدينة', pointType: 'meeting_point', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mp-hrg-sahl', countryId: 'cnt-eg', cityId: 'cty-hrg', name: 'بوابة منتجع سهل حشيش وخليج مكادي', pointType: 'both', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mp-hrg-orangebay', countryId: 'cnt-eg', cityId: 'cty-hrg', name: 'جزيرة أورانج باي ومحمية الجفتون', pointType: 'site', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // El Gouna
    { id: 'mp-gouna-abutig', countryId: 'cnt-eg', cityId: 'cty-gouna', name: 'مارينا أبوتيج بالجونة (Abu Tig Marina)', pointType: 'both', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mp-gouna-downtown', countryId: 'cnt-eg', cityId: 'cty-gouna', name: 'داون تاون الجونة - نقطة التجمع الرئيسية', pointType: 'meeting_point', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Sharm
    { id: 'mp-sharm-naama', countryId: 'cnt-eg', cityId: 'cty-sharm', name: 'خليج نعمة - الممشى السياحي الرئيسي', pointType: 'meeting_point', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mp-sharm-travco', countryId: 'cnt-eg', cityId: 'cty-sharm', name: 'مارينا ترافكو شرم الشيخ (شرم الميا)', pointType: 'both', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mp-sharm-rasmohamed', countryId: 'cnt-eg', cityId: 'cty-sharm', name: 'محمية رأس محمد وتيران', pointType: 'site', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Marsa Alam
    { id: 'mp-marsa-ghalib', countryId: 'cnt-eg', cityId: 'cty-marsa', name: 'بورت غالب مارينا (Port Ghalib Marina)', pointType: 'both', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Luxor & Aswan & Cairo
    { id: 'mp-luxor-corniche', countryId: 'cnt-eg', cityId: 'cty-luxor', name: 'مرسى الفلوكة بكورنيش النيل - الأقصر', pointType: 'both', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mp-aswan-nile', countryId: 'cnt-eg', cityId: 'cty-aswan', name: 'مرسى جزيرة الفنتين والنوبة - أسوان', pointType: 'both', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mp-cairo-zamalek', countryId: 'cnt-eg', cityId: 'cty-cairo', name: 'مرسى الزمالك وكورنيش النيل - القاهرة', pointType: 'both', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Dahab
    { id: 'mp-dahab-bluehole', countryId: 'cnt-eg', cityId: 'cty-dahab', name: 'ممشى المسبط والبلو هول - دهب', pointType: 'both', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    // Regional
    { id: 'mp-jeddah-obhur', countryId: 'cnt-sa', cityId: 'cty-jeddah', name: 'مرسى أبحر والبحر الأحمر - جدة', pointType: 'both', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mp-dubai-marina', countryId: 'cnt-ae', cityId: 'cty-dubai', name: 'دبي مارينا بروميناد (Dubai Marina)', pointType: 'both', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS },
    { id: 'mp-aqaba-ayla', countryId: 'cnt-jo', cityId: 'cty-aqaba', name: 'مرسى واحة أيلة - العقبة', pointType: 'both', isActive: true, createdAt: SEED_TS, updatedAt: SEED_TS }
  ];
}

async function loadOrSeedCatalog<T>(
  storeName: string,
  lsKey: string,
  buildInitial: () => T[]
): Promise<T[]> {
  const wiped = ensureOneTimeV6CleanReset();
  const existing = wiped ? [] : await readStoreAll<T>(storeName, lsKey);
  if (existing.length > 0) return existing;
  const seeded = buildInitial();
  await replaceStoreAll(storeName, seeded, lsKey);
  return seeded;
}

const LS_REF_ISOLATE_LOGISTICS_UK_KEY = 'zanoza_ref_isolate_logistics_uk_v2';
const LS_REF_UNITKIND_CATS_V3 = 'zanoza_ref_unitkind_cats_v3';
const LS_REF_ISOLATE_LOGISTICS_MFG_KEY = 'zanoza_ref_isolate_logistics_mfg_v2';
const LS_REF_ISOLATE_LOGISTICS_MDL_KEY = 'zanoza_ref_isolate_logistics_mdl_v2';

export const loadEquipmentUnitKindsFromDb = async (): Promise<EquipmentUnitKindItem[]> => {
  const loaded = await loadOrSeedCatalog(
    EQUIPMENT_UNIT_KINDS_STORE_NAME,
    LS_EQ_UNIT_KINDS_FALLBACK,
    buildInitialEquipmentUnitKinds
  );
  let migratedV2 = false;
  let migratedV3 = false;
  try {
    migratedV2 = window.localStorage.getItem(LS_REF_ISOLATE_LOGISTICS_UK_KEY) === '1';
    migratedV3 = window.localStorage.getItem(LS_REF_UNITKIND_CATS_V3) === '1';
  } catch {
    migratedV2 = false;
    migratedV3 = false;
  }
  const needsCatBackfill = loaded.some((uk) => uk.linkedCategoryIds === undefined);
  if (!migratedV2 || !migratedV3 || needsCatBackfill) {
    try {
      window.localStorage.setItem(LS_REF_ISOLATE_LOGISTICS_UK_KEY, '1');
      window.localStorage.setItem(LS_REF_UNITKIND_CATS_V3, '1');
    } catch {
      // ignore
    }
    const seeds = buildInitialEquipmentUnitKinds();
    const seedMap = new Map(seeds.map((s) => [s.id, s]));
    const updated = loaded.map((uk) => {
      const seed = seedMap.get(uk.id);
      if (!seed) {
        return uk.linkedCategoryIds !== undefined
          ? uk
          : { ...uk, linkedCategoryIds: uk.defaultCategoryId ? [uk.defaultCategoryId] : [], excludedCategoryIds: [] };
      }
      return {
        ...uk,
        domainScope: uk.id === 'uk-car' || uk.id === 'uk-safari-4x4' ? seed.domainScope : uk.domainScope,
        name: uk.id === 'uk-car' && uk.name === 'سيارة' ? seed.name : uk.name,
        linkedCategoryIds:
          uk.linkedCategoryIds !== undefined ? uk.linkedCategoryIds : (seed.linkedCategoryIds ?? []),
        excludedCategoryIds:
          uk.excludedCategoryIds !== undefined ? uk.excludedCategoryIds : (seed.excludedCategoryIds ?? [])
      };
    });
    const existingIds = new Set(updated.map((u) => u.id));
    for (const seed of seeds) {
      if (!existingIds.has(seed.id)) {
        updated.push(seed);
      }
    }
    await saveEquipmentUnitKindsToDb(updated);
    return updated;
  }
  return loaded;
};
export const saveEquipmentUnitKindsToDb = (items: EquipmentUnitKindItem[]) =>
  replaceStoreAll(EQUIPMENT_UNIT_KINDS_STORE_NAME, items, LS_EQ_UNIT_KINDS_FALLBACK);
export const resetEquipmentUnitKindsDb = async () => {
  const seeded = buildInitialEquipmentUnitKinds();
  await saveEquipmentUnitKindsToDb(seeded);
  return seeded;
};

export const loadManufacturersFromDb = async (): Promise<ManufacturerRecord[]> => {
  const loaded = await loadOrSeedCatalog(
    MANUFACTURERS_STORE_NAME,
    LS_MANUFACTURERS_FALLBACK,
    buildInitialManufacturers
  );
  let migrated = false;
  try {
    migrated = window.localStorage.getItem(LS_REF_ISOLATE_LOGISTICS_MFG_KEY) === '1';
  } catch {
    migrated = false;
  }
  if (!migrated || loaded.some((m) => m.linkedUnitKindIds === undefined)) {
    try {
      window.localStorage.setItem(LS_REF_ISOLATE_LOGISTICS_MFG_KEY, '1');
    } catch {
      // ignore
    }
    const seedMap = new Map(buildInitialManufacturers().map((s) => [s.id, s]));
    const upgraded = loaded.map((m) => {
      const seed = seedMap.get(m.id);
      if (!seed) {
        return m.linkedUnitKindIds !== undefined ? m : { ...m, linkedUnitKindIds: [] };
      }
      const existingKinds = m.linkedUnitKindIds ?? [];
      const mergedKinds = Array.from(new Set([...existingKinds, ...(seed.linkedUnitKindIds ?? [])]));
      return {
        ...m,
        applicableTo: seed.applicableTo,
        linkedUnitKindIds: mergedKinds
      };
    });
    await saveManufacturersToDb(upgraded);
    return upgraded;
  }
  return loaded;
};
export const saveManufacturersToDb = (items: ManufacturerRecord[]) =>
  replaceStoreAll(MANUFACTURERS_STORE_NAME, items, LS_MANUFACTURERS_FALLBACK);
export const resetManufacturersDb = async () => {
  const seeded = buildInitialManufacturers();
  await saveManufacturersToDb(seeded);
  return seeded;
};

export const loadManufacturerModelsFromDb = async (): Promise<ManufacturerModelRecord[]> => {
  const loaded = await loadOrSeedCatalog(
    MANUFACTURER_MODELS_STORE_NAME,
    LS_MFG_MODELS_FALLBACK,
    buildInitialManufacturerModels
  );
  let migrated = false;
  try {
    migrated = window.localStorage.getItem(LS_REF_ISOLATE_LOGISTICS_MDL_KEY) === '1';
  } catch {
    migrated = false;
  }
  const seedMap = new Map(buildInitialManufacturerModels().map((s) => [s.id, s]));
  const needsUpgrade =
    !migrated ||
    loaded.some((mdl) => {
      const seed = seedMap.get(mdl.id);
      return seed && mdl.unitKindId === undefined && seed.unitKindId !== undefined;
    });
  if (needsUpgrade) {
    try {
      window.localStorage.setItem(LS_REF_ISOLATE_LOGISTICS_MDL_KEY, '1');
    } catch {
      // ignore
    }
    const upgraded = loaded.map((mdl) => {
      const seed = seedMap.get(mdl.id);
      if (!seed) return mdl;
      return {
        ...mdl,
        applicableTo: seed.applicableTo,
        unitKindId: seed.unitKindId ?? mdl.unitKindId
      };
    });
    await saveManufacturerModelsToDb(upgraded);
    return upgraded;
  }
  return loaded;
};
export const saveManufacturerModelsToDb = (items: ManufacturerModelRecord[]) =>
  replaceStoreAll(MANUFACTURER_MODELS_STORE_NAME, items, LS_MFG_MODELS_FALLBACK);
export const resetManufacturerModelsDb = async () => {
  const seeded = buildInitialManufacturerModels();
  await saveManufacturerModelsToDb(seeded);
  return seeded;
};

export const loadCountriesRefFromDb = () =>
  loadOrSeedCatalog(COUNTRIES_REF_STORE_NAME, LS_COUNTRIES_FALLBACK, buildInitialCountriesRef);
export const saveCountriesRefToDb = (items: CountryRecord[]) =>
  replaceStoreAll(COUNTRIES_REF_STORE_NAME, items, LS_COUNTRIES_FALLBACK);
export const resetCountriesRefDb = async () => {
  const seeded = buildInitialCountriesRef();
  await saveCountriesRefToDb(seeded);
  return seeded;
};

export const loadCitiesRefFromDb = () =>
  loadOrSeedCatalog(CITIES_REF_STORE_NAME, LS_CITIES_FALLBACK, buildInitialCitiesRef);
export const saveCitiesRefToDb = (items: CityRecord[]) =>
  replaceStoreAll(CITIES_REF_STORE_NAME, items, LS_CITIES_FALLBACK);
export const resetCitiesRefDb = async () => {
  const seeded = buildInitialCitiesRef();
  await saveCitiesRefToDb(seeded);
  return seeded;
};

export const loadMeetingPointsRefFromDb = () =>
  loadOrSeedCatalog(MEETING_POINTS_REF_STORE_NAME, LS_MEETING_POINTS_FALLBACK, buildInitialMeetingPointsRef);
export const saveMeetingPointsRefToDb = (items: MeetingPointRecord[]) =>
  replaceStoreAll(MEETING_POINTS_REF_STORE_NAME, items, LS_MEETING_POINTS_FALLBACK);
export const resetMeetingPointsRefDb = async () => {
  const seeded = buildInitialMeetingPointsRef();
  await saveMeetingPointsRefToDb(seeded);
  return seeded;
};

