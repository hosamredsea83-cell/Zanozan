export const UNIFIED_DB_NAME = 'zanoza_local_db';
export const UNIFIED_DB_VERSION = 5;
export const CATEGORIES_STORE_NAME = 'categories';
export const ACTIVITIES_STORE_NAME = 'activities';
export const WAYPOINTS_BANK_STORE_NAME = 'waypoints_bank';
export const EQUIPMENT_PROPERTIES_STORE_NAME = 'equipment_properties';
export const EQUIPMENT_TYPES_STORE_NAME = 'equipment_types';
export const EQUIPMENTS_STORE_NAME = 'equipments';
export const CUSTOM_TECHNICAL_SPECS_STORE_NAME = 'custom_technical_specs';
export const PARTNERS_STORE_NAME = 'partners';

const LEGACY_ACTIVITIES_DB_NAME = 'zanoza_activities_db';

let openDbPromise: Promise<IDBDatabase> | null = null;
let legacyMigrationStarted = false;

function ensureStores(
  db: IDBDatabase,
  tx: IDBTransaction | null,
  oldVersion: number
): void {
  if (!db.objectStoreNames.contains(CATEGORIES_STORE_NAME)) {
    const categoriesStore = db.createObjectStore(CATEGORIES_STORE_NAME, { keyPath: 'id' });
    categoriesStore.createIndex('handle', 'handle', { unique: true });
    categoriesStore.createIndex('parentId', 'parentId', { unique: false });
    categoriesStore.createIndex('level', 'level', { unique: false });
  }

  if (!db.objectStoreNames.contains(ACTIVITIES_STORE_NAME)) {
    const activitiesStore = db.createObjectStore(ACTIVITIES_STORE_NAME, { keyPath: 'id' });
    activitiesStore.createIndex('ownerId', 'owner.id', { unique: false });
    activitiesStore.createIndex('companyName', 'owner.companyName', { unique: false });
  } else if (oldVersion > 0 && oldVersion < 4 && tx) {
    tx.objectStore(ACTIVITIES_STORE_NAME).clear();
  }

  if (!db.objectStoreNames.contains(WAYPOINTS_BANK_STORE_NAME)) {
    const waypointsStore = db.createObjectStore(WAYPOINTS_BANK_STORE_NAME, { keyPath: 'id' });
    waypointsStore.createIndex('name', 'name', { unique: false });
    waypointsStore.createIndex('savedAt', 'savedAt', { unique: false });
  } else if (oldVersion > 0 && oldVersion < 4 && tx) {
    tx.objectStore(WAYPOINTS_BANK_STORE_NAME).clear();
  }

  if (!db.objectStoreNames.contains(EQUIPMENT_PROPERTIES_STORE_NAME)) {
    const eqPropsStore = db.createObjectStore(EQUIPMENT_PROPERTIES_STORE_NAME, { keyPath: 'id' });
    eqPropsStore.createIndex('category', 'category', { unique: false });
    eqPropsStore.createIndex('key', 'key', { unique: false });
  }

  if (!db.objectStoreNames.contains(EQUIPMENT_TYPES_STORE_NAME)) {
    db.createObjectStore(EQUIPMENT_TYPES_STORE_NAME, { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains(EQUIPMENTS_STORE_NAME)) {
    const eqStore = db.createObjectStore(EQUIPMENTS_STORE_NAME, { keyPath: 'id' });
    eqStore.createIndex('ownerId', 'ownerId', { unique: false });
    eqStore.createIndex('typeId', 'typeId', { unique: false });
  }

  if (!db.objectStoreNames.contains(CUSTOM_TECHNICAL_SPECS_STORE_NAME)) {
    const specsStore = db.createObjectStore(CUSTOM_TECHNICAL_SPECS_STORE_NAME, { keyPath: 'id' });
    specsStore.createIndex('groupTitle', 'groupTitle', { unique: false });
    specsStore.createIndex('order', 'order', { unique: false });
  }

  if (!db.objectStoreNames.contains(PARTNERS_STORE_NAME)) {
    const partnersStore = db.createObjectStore(PARTNERS_STORE_NAME, { keyPath: 'id' });
    partnersStore.createIndex('ownerId', 'ownerId', { unique: false });
    partnersStore.createIndex('partnerType', 'partnerType', { unique: false });
  }
}

async function migrateLegacyActivitiesDb(targetDb: IDBDatabase): Promise<void> {
  if (legacyMigrationStarted || typeof window === 'undefined' || !('indexedDB' in window)) {
    return;
  }
  legacyMigrationStarted = true;

  try {
    const idbFactory = window.indexedDB as IDBFactory & {
      databases?: () => Promise<Array<{ name?: string; version?: number }>>;
    };

    if (typeof idbFactory.databases !== 'function') {
      return;
    }

    const existingDbs = await idbFactory.databases();
    const hasLegacyDb = existingDbs.some((d) => d.name === LEGACY_ACTIVITIES_DB_NAME);
    if (!hasLegacyDb) {
      return;
    }

    const legacyRows = await new Promise<unknown[]>((resolve) => {
      const req = window.indexedDB.open(LEGACY_ACTIVITIES_DB_NAME);
      req.onsuccess = () => {
        const legacyDb = req.result;
        if (!legacyDb.objectStoreNames.contains(ACTIVITIES_STORE_NAME)) {
          legacyDb.close();
          resolve([]);
          return;
        }
        try {
          const tx = legacyDb.transaction(ACTIVITIES_STORE_NAME, 'readonly');
          const store = tx.objectStore(ACTIVITIES_STORE_NAME);
          const getAllReq = store.getAll();
          getAllReq.onsuccess = () => {
            const rows = Array.isArray(getAllReq.result) ? getAllReq.result : [];
            legacyDb.close();
            resolve(rows);
          };
          getAllReq.onerror = () => {
            legacyDb.close();
            resolve([]);
          };
        } catch {
          legacyDb.close();
          resolve([]);
        }
      };
      req.onerror = () => resolve([]);
    });

    if (legacyRows.length > 0 && targetDb.objectStoreNames.contains(ACTIVITIES_STORE_NAME)) {
      await new Promise<void>((resolve) => {
        const tx = targetDb.transaction(ACTIVITIES_STORE_NAME, 'readwrite');
        const store = tx.objectStore(ACTIVITIES_STORE_NAME);
        for (const row of legacyRows) {
          if (row && typeof row === 'object' && 'id' in row) {
            store.put(row);
          }
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }

    await new Promise<void>((resolve) => {
      const delReq = window.indexedDB.deleteDatabase(LEGACY_ACTIVITIES_DB_NAME);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => resolve();
      delReq.onblocked = () => resolve();
    });
  } catch {
    // Ignore migration errors cleanly
  }
}

export function openUnifiedLocalDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }

  if (openDbPromise) {
    return openDbPromise;
  }

  openDbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(UNIFIED_DB_NAME, UNIFIED_DB_VERSION);

    request.onupgradeneeded = (event) => {
      ensureStores(request.result, request.transaction, event.oldVersion);
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        openDbPromise = null;
      };
      void migrateLegacyActivitiesDb(db).finally(() => resolve(db));
    };

    request.onerror = () => {
      openDbPromise = null;
      reject(request.error ?? new Error('Failed to open unified IndexedDB'));
    };
  });

  return openDbPromise;
}
