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

export const SEED_CATEGORIES: SeedCategoryInput[] = [
  {
    id: 'cat-marine',
    name: 'الأنشطة البحرية واليخوت',
    handle: 'marine-and-yachts',
    description: 'الركيزة الرئيسية لرحلات اليخوت الخاصة والمشتركة والقوارب السريعة في البحر الأحمر',
    children: [
      {
        id: 'cat-marine-yacht-vip',
        name: 'رحلات اليخوت الخاصة VIP',
        handle: 'vip-private-yachts',
        description: 'يخوت فاخرة مؤجرة بالكامل للرحلات الخاصة وكبار الشخصيات والعائلات'
      },
      {
        id: 'cat-marine-yacht-shared',
        name: 'رحلات اليخوت والجزر المشتركة',
        handle: 'shared-yacht-islands',
        description: 'رحلات يومية جماعية إلى الجزر والشواطئ البحرية مع غداء ووقفات سباحة'
      },
      {
        id: 'cat-marine-speedboat',
        name: 'القوارب السريعة والجولات البحرية',
        handle: 'speedboat-tours',
        description: 'جولات مرنة وسريعة باللانش الخاص لمشاهدة الدلافين والوصول السريع للجزر'
      }
    ]
  },
  {
    id: 'cat-diving',
    name: 'الغوص والسنوركلينج',
    handle: 'diving-and-snorkeling',
    description: 'الركيزة الرئيسية لبرامج الغوص التمهيدية والمعتمدة ورحلات السنوركلينج والشعاب',
    children: [
      {
        id: 'cat-diving-intro',
        name: 'غوص تمهيدي للمبتدئين (Intro)',
        handle: 'intro-diving',
        description: 'تجربة غوص آمنة للمبتدئين مع مدرب معتمد دون اشتراط رخصة غوص مسبقة'
      },
      {
        id: 'cat-diving-pro',
        name: 'غوص أعماق معتمد (PADI / SSI)',
        handle: 'certified-deep-diving',
        description: 'غطسات متخصصة لحاملي رخص الغوص الدولية في مواقع الشعاب العميقة والحطام'
      },
      {
        id: 'cat-diving-snorkel',
        name: 'رحلات السنوركلينج والشعاب المرجانية',
        handle: 'reef-snorkeling',
        description: 'جولات سنوركلينج عائلية في المياه الضحلة والشعاب الملونة دون غوص بأسطوانات'
      }
    ]
  },
  {
    id: 'cat-safari',
    name: 'السفاري والمغامرات الصحراوية',
    handle: 'desert-safari-adventures',
    description: 'الركيزة الرئيسية لرحلات البيتش باجي والدفع الرباعي 4×4 والمخيمات البدوية',
    children: [
      {
        id: 'cat-safari-quad',
        name: 'سفاري بيتش باجي وكواد',
        handle: 'quad-bike-safari',
        description: 'قيادة دراجات البيتش باجي الفردية والزوجية في المسارات الجبلية الصحراوية'
      },
      {
        id: 'cat-safari-4x4',
        name: 'سفاري سيارات الدفع الرباعي 4×4',
        handle: 'jeep-4x4-safari',
        description: 'رحلات عائلية مريحة بسيارات الجيب المجهزة عبر الوديان والقرى البدوية'
      },
      {
        id: 'cat-safari-bedouin',
        name: 'المخيمات البدوية والعشاء ورصد النجوم',
        handle: 'bedouin-camp-stargazing',
        description: 'أمسيات صحراوية تشمل الشواء البدوي والعروض الفلكلورية ورصد النجوم بالتليسكوب'
      }
    ]
  },
  {
    id: 'cat-leisure',
    name: 'الجولات الترفيهية والنيلية والمائية',
    handle: 'leisure-marine-nile-tours',
    description: 'الركيزة الرئيسية للغواصات الزجاجية والألعاب المائية والفروسية والرحلات النيلية',
    children: [
      {
        id: 'cat-leisure-glassboat',
        name: 'الغواصات والمراكب الزجاجية',
        handle: 'glass-boats-submarines',
        description: 'جولات مشاهدة الشعاب المرجانية عبر كابينات بانورامية مكيفة لجميع الأعمار'
      },
      {
        id: 'cat-leisure-watersports',
        name: 'الألعاب المائية والباراشوت البحري',
        handle: 'watersports-parasailing',
        description: 'تحليق الباراشوت البحري وجولات البانانا بوت والتيوب المائي السريع'
      },
      {
        id: 'cat-leisure-equestrian-nile',
        name: 'الفروسية الشاطئية ورحلات الفلوكة',
        handle: 'equestrian-nile-felucca',
        description: 'جولات ركوب الخيل العربي على الشاطئ ورحلات الإبحار الهادئ بالفلوكة'
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

export async function resetAndReseedLocalCategoriesDb(): Promise<{
  records: CategoryRecord[];
  tree: CategoryNode[];
}> {
  const seeded = buildSeedRecords();
  await writeAllRecordsToStorage(seeded);
  return {
    records: sortRecords(seeded),
    tree: buildTreeFromRecords(seeded)
  };
}
