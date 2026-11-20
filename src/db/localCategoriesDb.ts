import type { Activity, CategoryRecord } from '../types/activity';
import type { CategoryNode } from '../components/activities/ActivityEditor';

import {
  CATEGORIES_STORE_NAME as STORE_NAME,
  openUnifiedLocalDb as openIndexedDb
} from './unifiedLocalDb';

const LS_FALLBACK_KEY = 'zanoza_local_categories_v1';

const ARABIC_TRANSLIT_MAP: Record<string, string> = {
  أ: 'a',
  إ: 'e',
  آ: 'a',
  ا: 'a',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  ة: 'a',
  و: 'w',
  ؤ: 'w',
  ي: 'y',
  ى: 'a',
  ئ: 'y',
  ء: ''
};

export function generateCategoryHandle(input: string, fallback = 'category'): string {
  const raw = input.trim().toLowerCase();
  if (!raw) return fallback;

  let out = '';
  for (const ch of raw) {
    if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) {
      out += ch;
    } else if (ch === ' ' || ch === '-' || ch === '_' || ch === '/') {
      out += '-';
    } else if (ARABIC_TRANSLIT_MAP[ch] !== undefined) {
      out += ARABIC_TRANSLIT_MAP[ch];
    }
  }

  const cleaned = out.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return cleaned || fallback;
}

interface SeedCategoryInput {
  id: string;
  name: string;
  handle: string;
  description: string;
  children?: SeedCategoryInput[];
}

const SEED_CATEGORIES: SeedCategoryInput[] = [
  {
    id: 'cat-tour',
    name: 'الأنشطة السياحية',
    handle: 'tour-activities',
    description: 'التصنيف الرئيسي لجميع الأنشطة والرحلات السياحية في المنصة',
    children: [
      {
        id: 'cat-marine',
        name: 'الأنشطة البحرية',
        handle: 'marine-activities',
        description: 'رحلات البحر الأحمر واليخوت والغوص والجزر البحرية',
        children: [
          {
            id: 'cat-yacht',
            name: 'رحلات اليخوت',
            handle: 'yacht-trips',
            description: 'تأجير ورحلات اليخوت السياحية الخاصة والمشتركة',
            children: [
              {
                id: 'cat-yacht-private',
                name: 'يخوت خاصة VIP',
                handle: 'vip-private-yachts',
                description: 'يخوت فاخرة مؤجرة بالكامل للرحلات الخاصة وكبار الشخصيات'
              },
              {
                id: 'cat-yacht-shared',
                name: 'يخوت مشتركة',
                handle: 'shared-yachts',
                description: 'رحلات يومية جماعية على متن يخوت مجهزة بالوجبات والسنوركلينج'
              },
              {
                id: 'cat-yacht-sunset',
                name: 'رحلات غروب رومانسية',
                handle: 'romantic-sunset-trips',
                description: 'جولات مسائية هادئة لمشاهدة الغروب مع عشاء بحري'
              }
            ]
          },
          {
            id: 'cat-diving',
            name: 'الغوص والسنوركلينج',
            handle: 'diving-snorkeling',
            description: 'برامج الغوص الاحترافية والتمهيدية واستكشاف الشعاب المرجانية',
            children: [
              {
                id: 'cat-dive-intro',
                name: 'غوص تمهيدي للمبتدئين (Intro)',
                handle: 'intro-diving',
                description: 'تجربة غوص آمنة مع مدرب معتمد دون اشتراط رخصة مسبقة'
              },
              {
                id: 'cat-dive-pro',
                name: 'غوص أعماق محترفين (PADI)',
                handle: 'pro-padi-diving',
                description: 'غطسات متخصصة لحاملي رخص الغوص الدولية في مواقع الأعماق'
              },
              {
                id: 'cat-dive-night',
                name: 'غوص ليلي واستكشاف كهوف',
                handle: 'night-cave-diving',
                description: 'مغامرات غوص ليلية واستكشاف الكهوف والشعاب المرجانية'
              }
            ]
          },
          {
            id: 'cat-islands',
            name: 'رحلات الجزر البحرية',
            handle: 'island-trips',
            description: 'رحلات يومية إلى أشهر الجزر والشواطئ الرملية بالبحر الأحمر',
            children: [
              {
                id: 'cat-isl-giftun',
                name: 'جزيرة الجفتون وأورانج باي',
                handle: 'giftun-orange-bay',
                description: 'رحلة بحرية إلى محمية الجفتون وشاطئ أورانج باي'
              },
              {
                id: 'cat-isl-paradise',
                name: 'جزيرة برادايس وباراشوت',
                handle: 'paradise-island-parasail',
                description: 'يوم كامل بجزيرة برادايس مع ألعاب مائية وباراشوت'
              },
              {
                id: 'cat-isl-magawish',
                name: 'جزر مجاويش وأبو منقار',
                handle: 'magawish-abu-minqar',
                description: 'جولات استجمام وسباحة في جزر مجاويش وأبو منقار'
              }
            ]
          },
          {
            id: 'cat-sub',
            name: 'الغواصات والمراكب الزجاجية',
            handle: 'submarines-glass-boats',
            description: 'جولات مشاهدة الشعاب المرجانية دون الحاجة للسباحة',
            children: [
              {
                id: 'cat-sub-semi',
                name: 'غواصات شبه غاطسة (Semi-Submarine)',
                handle: 'semi-submarine',
                description: 'كابينة مشاهدة بانورامية تحت سطح الماء للعائلات والأطفال'
              },
              {
                id: 'cat-sub-glass',
                name: 'مراكب زجاجية بانورامية (Glass-Bottom)',
                handle: 'glass-bottom-boats',
                description: 'قوارب بقاع زجاجي شفاف لاستكشاف الأسماك والشعاب'
              }
            ]
          },
          {
            id: 'cat-watersports',
            name: 'ألعاب مائية وباراشوت',
            handle: 'water-sports-parasailing',
            description: 'أنشطة التشويق المائي والباراشوت البحري والبانانا بوت',
            children: [
              {
                id: 'cat-ws-parasail',
                name: 'باراشوت بحري منفرد وزوجي',
                handle: 'solo-tandem-parasailing',
                description: 'تحليق بالباراشوت البحري فوق ساحل البحر الأحمر'
              },
              {
                id: 'cat-ws-banana',
                name: 'بانانا بوت وتيوب مائي سريع',
                handle: 'banana-boat-tube',
                description: 'جولات سريعة بالقوارب المطاطية والتيوب المائي'
              }
            ]
          }
        ]
      },
      {
        id: 'cat-desert',
        name: 'سفاري ومغامرات صحراوية',
        handle: 'desert-safari-adventures',
        description: 'رحلات السفاري الجبلية والوديان الصحراوية والمخيمات البدوية',
        children: [
          {
            id: 'cat-quad',
            name: 'سفاري بيتش باجي (Quad Bikes)',
            handle: 'quad-bike-safari',
            description: 'قيادة دراجات الدفع الرباعي في المسارات الجبلية الصحراوية',
            children: [
              {
                id: 'cat-quad-single',
                name: 'بيتش باجي فردي 250cc',
                handle: 'single-quad-250cc',
                description: 'دراجة بيتش باجي فردية لرحلات السفاري السريعة'
              },
              {
                id: 'cat-quad-double',
                name: 'بيتش باجي زوجي ومجموعات',
                handle: 'double-group-quad',
                description: 'دراجات بيتش باجي مزدوجة مناسبة للأزواج والمجموعات'
              }
            ]
          },
          {
            id: 'cat-buggy',
            name: 'سفاري سيارات الدفع الرباعي والباجي',
            handle: '4x4-buggy-safari',
            description: 'مغامرات الصحراء بسيارات الجيب وسبايدر كار',
            children: [
              {
                id: 'cat-buggy-sp',
                name: 'سبايدر كار وباجي صحراوي',
                handle: 'spider-car-desert-buggy',
                description: 'مركبات سبايدر كار الرياضية ذات المقعدين في الصحراء'
              },
              {
                id: 'cat-jeep-4x4',
                name: 'جيب لاند كروزر 4x4',
                handle: 'land-cruiser-4x4',
                description: 'رحلات جيب مكيفة عبر الوديان الجبلية والقرى البدوية'
              }
            ]
          },
          {
            id: 'cat-bedouin',
            name: 'عشاء بدوي وفلكلور صحراوي',
            handle: 'bedouin-dinner-folklore',
            description: 'سهرات صحراوية تشمل العشاء البدوي ورصد النجوم والعروض',
            children: [
              {
                id: 'cat-bed-stargaze',
                name: 'رصد فلكي وتليسكوبات',
                handle: 'astronomy-stargazing',
                description: 'ليلة رصد للنجوم والكواكب باستخدام التليسكوبات الفلكية'
              },
              {
                id: 'cat-bed-show',
                name: 'حفل شواء بدوي وعرض نار',
                handle: 'bedouin-bbq-fire-show',
                description: 'بوفيه شواء بدوي وعروض فلكلورية ونارية مسائية'
              }
            ]
          }
        ]
      },
      {
        id: 'cat-equestrian',
        name: 'فروسية وركوب الخيل والجمال',
        handle: 'equestrian-horse-camel',
        description: 'جولات الفروسية على الشاطئ وفي الصحراء وركوب الجمال',
        children: [
          {
            id: 'cat-horses',
            name: 'خيول عربية أصيلة',
            handle: 'arabian-horses',
            description: 'تجارب ركوب الخيول العربية الأصيلة للمبتدئين والمحترفين',
            children: [
              {
                id: 'cat-horse-beach',
                name: 'سباحة بالخيل على الشاطئ',
                handle: 'beach-horse-swimming',
                description: 'جولة ركوب وسباحة بالخيل على شاطئ البحر الأحمر'
              },
              {
                id: 'cat-horse-desert',
                name: 'ركوب خيل في الوديان الصحراوية',
                handle: 'desert-valley-horse-riding',
                description: 'انطلاق بالخيول في المسارات الصحراوية والوديان الجبلية'
              }
            ]
          },
          {
            id: 'cat-camel',
            name: 'قوافل الجمال البدوية',
            handle: 'bedouin-camel-caravans',
            description: 'جولات هادئة على ظهور الجمال في المسارات البدوية',
            children: [
              {
                id: 'cat-camel-sunset',
                name: 'جولات الجمال وقت الغروب',
                handle: 'sunset-camel-rides',
                description: 'رحلة جمال صحراوية ساحرة مع غروب الشمس'
              }
            ]
          }
        ]
      },
      {
        id: 'cat-air',
        name: 'طيران وسياحة هوائية',
        handle: 'air-aviation-tourism',
        description: 'أنشطة التحليق والسياحة الجوية والمناطيد',
        children: [
          {
            id: 'cat-balloon',
            name: 'المنطاد الطائر (Hot Air Balloon)',
            handle: 'hot-air-balloon',
            description: 'رحلات المنطاد الهوائي فوق المعالم الأثرية والطبيعية',
            children: [
              {
                id: 'cat-balloon-luxor',
                name: 'منطاد شروق الشمس',
                handle: 'sunrise-balloon-luxor',
                description: 'تحليق بالمنطاد وقت الشروق بإطلالة بانورامية كاملة'
              }
            ]
          }
        ]
      }
    ]
  }
];

function buildSeedRecords(): CategoryRecord[] {
  const records: CategoryRecord[] = [];
  const baseTime = Date.UTC(2026, 10, 1, 8, 0, 0);
  let seq = 0;

  const walk = (nodes: SeedCategoryInput[], parentId: string | null, level: number) => {
    for (const node of nodes) {
      const ts = new Date(baseTime + seq * 1000).toISOString();
      seq += 1;
      records.push({
        id: node.id,
        name: node.name,
        handle: node.handle,
        description: node.description,
        parentId,
        level,
        activitiesCount: 0,
        createdAt: ts,
        updatedAt: ts
      });
      if (node.children && node.children.length > 0) {
        walk(node.children, node.id, level + 1);
      }
    }
  };

  walk(SEED_CATEGORIES, null, 1);
  return records;
}

function sortRecords(records: CategoryRecord[]): CategoryRecord[] {
  return [...records].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    const t = a.createdAt.localeCompare(b.createdAt);
    if (t !== 0) return t;
    return a.id.localeCompare(b.id);
  });
}

export function buildTreeFromRecords(records: CategoryRecord[]): CategoryNode[] {
  const ordered = sortRecords(records);
  const nodeMap = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const rec of ordered) {
    nodeMap.set(rec.id, {
      id: rec.id,
      name: rec.name,
      handle: rec.handle,
      description: rec.description,
      parentId: rec.parentId,
      level: rec.level,
      children: []
    });
  }

  for (const rec of ordered) {
    const node = nodeMap.get(rec.id)!;
    if (rec.parentId && nodeMap.has(rec.parentId)) {
      nodeMap.get(rec.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}


function normalizeRecord(rec: CategoryRecord): CategoryRecord {
  return {
    ...rec,
    activitiesCount: typeof rec.activitiesCount === 'number' && Number.isFinite(rec.activitiesCount)
      ? Math.max(0, Math.floor(rec.activitiesCount))
      : 0
  };
}

function buildCategoryPathMap(records: CategoryRecord[]): Map<string, string[]> {
  const byId = new Map<string, CategoryRecord>();
  for (const r of records) {
    byId.set(r.id, r);
  }

  const cache = new Map<string, string[]>();
  const resolvePath = (id: string, visited = new Set<string>()): string[] => {
    const cached = cache.get(id);
    if (cached) return cached;

    const rec = byId.get(id);
    if (!rec || visited.has(id)) return [];
    visited.add(id);

    const parentPath = rec.parentId ? resolvePath(rec.parentId, visited) : [];
    const fullPath = [...parentPath, rec.name];
    cache.set(id, fullPath);
    return fullPath;
  };

  for (const r of records) {
    resolvePath(r.id);
  }
  return cache;
}

function countActivitiesForPath(recPath: string[], activities: Activity[]): number {
  if (!recPath || recPath.length === 0) return 0;
  let count = 0;
  for (const act of activities) {
    if (!Array.isArray(act.categoryPath) || act.categoryPath.length < recPath.length) {
      continue;
    }
    let matches = true;
    for (let i = 0; i < recPath.length; i += 1) {
      if (act.categoryPath[i] !== recPath[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      count += 1;
    }
  }
  return count;
}

function withComputedActivityCounts(
  records: CategoryRecord[],
  activities: Activity[]
): { records: CategoryRecord[]; changed: boolean } {
  const pathMap = buildCategoryPathMap(records);
  let changed = false;
  const nextRecords = records.map((rec) => {
    const path = pathMap.get(rec.id) ?? [rec.name];
    const nextCount = countActivitiesForPath(path, activities);
    if (rec.activitiesCount !== nextCount) {
      changed = true;
      return { ...rec, activitiesCount: nextCount };
    }
    return rec;
  });
  return { records: nextRecords, changed };
}

async function readAllRecordsFromStorage(): Promise<CategoryRecord[]> {
  try {
    const db = await openIndexedDb();
    const rows = await new Promise<CategoryRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as CategoryRecord[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error('Failed to read categories'));
    });

    if (rows.length > 0) {
      return sortRecords(rows.map(normalizeRecord));
    }

    // Seed initial categories on first local run
    const seeded = buildSeedRecords();
    await writeAllRecordsToStorage(seeded);
    return sortRecords(seeded);
  } catch {
    // Fallback to localStorage if IndexedDB is blocked in a restricted frame
    try {
      const raw = window.localStorage.getItem(LS_FALLBACK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CategoryRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sortRecords(parsed.map(normalizeRecord));
        }
      }
    } catch {
      // ignore parse errors
    }
    const seeded = buildSeedRecords();
    try {
      window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(seeded));
    } catch {
      // ignore quota errors
    }
    return sortRecords(seeded);
  }
}

async function writeAllRecordsToStorage(records: CategoryRecord[]): Promise<void> {
  try {
    const db = await openIndexedDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const rec of records) {
        store.put(rec);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to write categories'));
    });
  } catch {
    window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(records));
  }
}

function ensureUniqueHandle(records: CategoryRecord[], baseHandle: string, excludeId?: string): string {
  const taken = new Set(
    records.filter((r) => r.id !== excludeId).map((r) => r.handle.toLowerCase())
  );
  let candidate = baseHandle;
  let suffix = 2;
  while (taken.has(candidate.toLowerCase())) {
    candidate = `${baseHandle}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function resolveParentByPath(
  records: CategoryRecord[],
  parentPath: string[]
): { parentId: string | null; level: number } {
  if (!parentPath || parentPath.length === 0) {
    return { parentId: null, level: 1 };
  }

  let currentParentId: string | null = null;
  for (const segment of parentPath) {
    const match = records.find(
      (r) => r.name === segment && r.parentId === currentParentId
    );
    if (!match) {
      return { parentId: currentParentId, level: parentPath.length + 1 };
    }
    currentParentId = match.id;
  }

  return { parentId: currentParentId, level: parentPath.length + 1 };
}

export async function getLocalCategoriesSnapshot(): Promise<{
  records: CategoryRecord[];
  tree: CategoryNode[];
}> {
  const records = await readAllRecordsFromStorage();
  return {
    records,
    tree: buildTreeFromRecords(records)
  };
}

export async function syncLocalCategoryActivityCounts(activities: Activity[]): Promise<{
  records: CategoryRecord[];
  tree: CategoryNode[];
}> {
  const records = await readAllRecordsFromStorage();
  const { records: nextRecords, changed } = withComputedActivityCounts(records, activities);
  if (changed) {
    await writeAllRecordsToStorage(nextRecords);
  }
  return {
    records: nextRecords,
    tree: buildTreeFromRecords(nextRecords)
  };
}

export async function createLocalCategoryRecord(input: {
  id?: string;
  name: string;
  handle?: string;
  description?: string;
  parentId?: string | null;
  parentPath?: string[];
}): Promise<{
  record: CategoryRecord;
  records: CategoryRecord[];
  tree: CategoryNode[];
}> {
  const records = await readAllRecordsFromStorage();
  const name = input.name.trim();
  if (!name) {
    throw new Error('اسم التصنيف (Name) مطلوب');
  }

  let parentId: string | null = input.parentId ?? null;
  let level = 1;

  if (parentId) {
    const parentRow = records.find((r) => r.id === parentId);
    if (!parentRow) {
      throw new Error('التصنيف الأب المحدد غير موجود');
    }
    level = parentRow.level + 1;
  } else if (Array.isArray(input.parentPath) && input.parentPath.length > 0) {
    const resolved = resolveParentByPath(records, input.parentPath);
    parentId = resolved.parentId;
    level = resolved.level;
  }

  const rawId = input.id?.trim();
  const id = rawId || `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  if (records.some((r) => r.id === id)) {
    throw new Error(`المعرف (Id) "${id}" مستخدم بالفعل`);
  }

  const rawHandle = input.handle?.trim();
  const baseHandle = generateCategoryHandle(rawHandle || name, `cat-${Date.now().toString(36)}`);
  const handle = ensureUniqueHandle(records, baseHandle);
  const description = (input.description ?? '').trim();
  const now = new Date().toISOString();

  const newRecord: CategoryRecord = {
    id,
    name,
    handle,
    description,
    parentId,
    level,
    activitiesCount: 0,
    createdAt: now,
    updatedAt: now
  };

  const nextRecords = sortRecords([...records, newRecord]);
  await writeAllRecordsToStorage(nextRecords);

  return {
    record: newRecord,
    records: nextRecords,
    tree: buildTreeFromRecords(nextRecords)
  };
}

export async function updateLocalCategoryRecord(
  id: string,
  updates: { name?: string; handle?: string; description?: string },
  activities?: Activity[]
): Promise<{
  record: CategoryRecord;
  records: CategoryRecord[];
  tree: CategoryNode[];
  previousPath?: string[];
  updatedPath?: string[];
  renamedLevelIndex?: number;
}> {
  const rawRecords = await readAllRecordsFromStorage();
  const records = activities ? withComputedActivityCounts(rawRecords, activities).records : rawRecords;
  const existing = records.find((r) => r.id === id);
  if (!existing) {
    throw new Error('السجل غير موجود في قاعدة البيانات المحلية');
  }

  const nextName = updates.name !== undefined ? updates.name.trim() : existing.name;
  if (!nextName) {
    throw new Error('اسم التصنيف (Name) مطلوب');
  }

  const linkedCount = existing.activitiesCount ?? 0;
  // When activities are linked to this category, only its Name may be edited
  const nextHandle =
    linkedCount > 0
      ? existing.handle
      : ensureUniqueHandle(
          records,
          generateCategoryHandle(
            (updates.handle !== undefined ? updates.handle.trim() : existing.handle) || nextName,
            existing.handle
          ),
          id
        );
  const nextDescription =
    linkedCount > 0
      ? existing.description
      : updates.description !== undefined
      ? updates.description.trim()
      : existing.description;
  const now = new Date().toISOString();

  const pathMap = buildCategoryPathMap(records);
  const previousPath = pathMap.get(id);
  const didRename = nextName !== existing.name && Array.isArray(previousPath) && previousPath.length > 0;
  const updatedPath = didRename ? [...previousPath.slice(0, -1), nextName] : previousPath;
  const renamedLevelIndex = didRename ? previousPath.length - 1 : undefined;

  const updatedRecord: CategoryRecord = {
    ...existing,
    name: nextName,
    handle: nextHandle,
    description: nextDescription,
    updatedAt: now
  };

  const nextRecords = sortRecords(
    records.map((r) => (r.id === id ? updatedRecord : r))
  );
  await writeAllRecordsToStorage(nextRecords);

  return {
    record: updatedRecord,
    records: nextRecords,
    tree: buildTreeFromRecords(nextRecords),
    previousPath: didRename ? previousPath : undefined,
    updatedPath: didRename ? updatedPath : undefined,
    renamedLevelIndex
  };
}

export async function deleteLocalCategoryRecord(
  id: string,
  activities?: Activity[]
): Promise<{
  deletedId: string;
  records: CategoryRecord[];
  tree: CategoryNode[];
}> {
  const rawRecords = await readAllRecordsFromStorage();
  const records = activities ? withComputedActivityCounts(rawRecords, activities).records : rawRecords;
  const target = records.find((r) => r.id === id);
  if (!target) {
    throw new Error('السجل غير موجود في قاعدة البيانات المحلية');
  }

  // Cascade scope: check target and all child categories
  const idsToRemove = new Set<string>([id]);
  let added = true;
  while (added) {
    added = false;
    for (const rec of records) {
      if (rec.parentId && idsToRemove.has(rec.parentId) && !idsToRemove.has(rec.id)) {
        idsToRemove.add(rec.id);
        added = true;
      }
    }
  }

  const hasLinkedActivities = records.some(
    (rec) => idsToRemove.has(rec.id) && (rec.activitiesCount ?? 0) > 0
  );
  if (hasLinkedActivities) {
    throw new Error('لا يمكن حذف هذا التصنيف لوجود أنشطة مرتبطة به؛ يمكنك تعديل الاسم فقط.');
  }

  const nextRecords = sortRecords(records.filter((r) => !idsToRemove.has(r.id)));
  await writeAllRecordsToStorage(nextRecords);

  return {
    deletedId: id,
    records: nextRecords,
    tree: buildTreeFromRecords(nextRecords)
  };
}
