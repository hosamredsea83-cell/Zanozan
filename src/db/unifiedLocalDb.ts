export const UNIFIED_DB_NAME = 'zanoza_local_db';
export const UNIFIED_DB_VERSION = 11;
export const CATEGORIES_STORE_NAME = 'categories';
export const ACTIVITIES_STORE_NAME = 'activities';
export const TRIPS_STORE_NAME = 'trips';
export const WAYPOINTS_BANK_STORE_NAME = 'waypoints_bank';
export const EQUIPMENT_PROPERTIES_STORE_NAME = 'equipment_properties';
export const EQUIPMENT_TYPES_STORE_NAME = 'equipment_types';
export const EQUIPMENTS_STORE_NAME = 'equipments';
export const CUSTOM_TECHNICAL_SPECS_STORE_NAME = 'custom_technical_specs';
export const PARTNERS_STORE_NAME = 'partners';
export const SPEC_GROUPS_STORE_NAME = 'master_spec_groups';
export const INCLUSIONS_CATALOG_STORE_NAME = 'inclusions_catalog';
export const OPERATIONAL_COSTS_STORE_NAME = 'operational_costs';
export const REGISTERED_SUPPLIERS_STORE_NAME = 'registered_suppliers';
export const SUPPLIER_JOURNALS_STORE_NAME = 'supplier_pricing_journals';
export const SUBSCRIBED_USERS_STORE_NAME = 'platform_subscribed_users';
export const PERSON_PROFILES_STORE_NAME = 'person_profiles';
export const BILATERAL_LEDGER_STORE_NAME = 'bilateral_ledger_entries';
export const EQUIPMENT_UNIT_KINDS_STORE_NAME = 'ref_equipment_unit_kinds';
export const MANUFACTURERS_STORE_NAME = 'ref_manufacturers';
export const MANUFACTURER_MODELS_STORE_NAME = 'ref_manufacturer_models';
export const COUNTRIES_REF_STORE_NAME = 'ref_countries';
export const CITIES_REF_STORE_NAME = 'ref_cities';
export const MEETING_POINTS_REF_STORE_NAME = 'ref_meeting_points';

const LEGACY_ACTIVITIES_DB_NAME = 'zanoza_activities_db';
export const V6_CLEAN_RESET_FLAG_KEY = 'zanoza_v6_master_ref_clean_reset_done';

const LEGACY_LS_KEYS_TO_WIPE = [
  'zanoza_local_categories_v1',
  'zanoza_local_activities_v1',
  'zanoza_custom_technical_specs_v1',
  'zanoza_v4_specs_equipment_seeded_v1',
  'zanoza_db_equipment_properties_v2',
  'zanoza_db_equipment_types_v2',
  'zanoza_db_equipments_v2',
  'zanoza_db_custom_technical_specs_v2',
  'zanoza_db_master_spec_groups_v6',
  'zanoza_db_inclusions_catalog_v6',
  'zanoza_master_addons_v1',
  'zanoza_waypoints_bank_v1'
];

let openDbPromise: Promise<IDBDatabase> | null = null;
let v6CleanResetProcessed = false;

export function ensureOneTimeV6CleanReset(): boolean {
  if (typeof window === 'undefined') return false;
  if (v6CleanResetProcessed) return false;
  v6CleanResetProcessed = true;

  try {
    const alreadyDone = window.localStorage.getItem(V6_CLEAN_RESET_FLAG_KEY);
    if (alreadyDone === '1') {
      return false;
    }

    LEGACY_LS_KEYS_TO_WIPE.forEach((key) => {
      window.localStorage.removeItem(key);
    });

    // Clear old favorites keys and legacy nav keys safely
    for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith('zanoza_favorites_') || k.startsWith('zanoza_db_'))) {
        window.localStorage.removeItem(k);
      }
    }

    window.localStorage.setItem(V6_CLEAN_RESET_FLAG_KEY, '1');

    // Also clear legacy activities file on server once so old activities aren't re-synced
    void fetch('/api/activities', { method: 'DELETE' }).catch(() => undefined);

    return true;
  } catch {
    return false;
  }
}

function clearStoreIfExists(db: IDBDatabase, tx: IDBTransaction | null, storeName: string): void {
  if (tx && db.objectStoreNames.contains(storeName)) {
    tx.objectStore(storeName).clear();
  }
}

function ensureStores(
  db: IDBDatabase,
  tx: IDBTransaction | null,
  oldVersion: number
): void {
  const needsCleanV6Wipe = oldVersion > 0 && oldVersion < 6;

  if (!db.objectStoreNames.contains(CATEGORIES_STORE_NAME)) {
    const categoriesStore = db.createObjectStore(CATEGORIES_STORE_NAME, { keyPath: 'id' });
    categoriesStore.createIndex('handle', 'handle', { unique: true });
    categoriesStore.createIndex('parentId', 'parentId', { unique: false });
    categoriesStore.createIndex('level', 'level', { unique: false });
  } else if (needsCleanV6Wipe) {
    clearStoreIfExists(db, tx, CATEGORIES_STORE_NAME);
  }

  if (!db.objectStoreNames.contains(ACTIVITIES_STORE_NAME)) {
    const activitiesStore = db.createObjectStore(ACTIVITIES_STORE_NAME, { keyPath: 'id' });
    activitiesStore.createIndex('ownerId', 'owner.id', { unique: false });
    activitiesStore.createIndex('companyName', 'owner.companyName', { unique: false });
  } else if (needsCleanV6Wipe) {
    clearStoreIfExists(db, tx, ACTIVITIES_STORE_NAME);
  }

  if (!db.objectStoreNames.contains(TRIPS_STORE_NAME)) {
    const tripsStore = db.createObjectStore(TRIPS_STORE_NAME, { keyPath: 'id' });
    tripsStore.createIndex('ownerId', 'owner.id', { unique: false });
    tripsStore.createIndex('companyName', 'owner.companyName', { unique: false });
  } else if (needsCleanV6Wipe) {
    clearStoreIfExists(db, tx, TRIPS_STORE_NAME);
  }

  if (!db.objectStoreNames.contains(WAYPOINTS_BANK_STORE_NAME)) {
    const waypointsStore = db.createObjectStore(WAYPOINTS_BANK_STORE_NAME, { keyPath: 'id' });
    waypointsStore.createIndex('name', 'name', { unique: false });
    waypointsStore.createIndex('savedAt', 'savedAt', { unique: false });
  } else if (needsCleanV6Wipe) {
    clearStoreIfExists(db, tx, WAYPOINTS_BANK_STORE_NAME);
  }

  if (!db.objectStoreNames.contains(EQUIPMENT_PROPERTIES_STORE_NAME)) {
    const eqPropsStore = db.createObjectStore(EQUIPMENT_PROPERTIES_STORE_NAME, { keyPath: 'id' });
    eqPropsStore.createIndex('category', 'category', { unique: false });
    eqPropsStore.createIndex('key', 'key', { unique: false });
  } else if (needsCleanV6Wipe) {
    clearStoreIfExists(db, tx, EQUIPMENT_PROPERTIES_STORE_NAME);
  }

  if (!db.objectStoreNames.contains(EQUIPMENT_TYPES_STORE_NAME)) {
    db.createObjectStore(EQUIPMENT_TYPES_STORE_NAME, { keyPath: 'id' });
  } else if (needsCleanV6Wipe) {
    clearStoreIfExists(db, tx, EQUIPMENT_TYPES_STORE_NAME);
  }

  if (!db.objectStoreNames.contains(EQUIPMENTS_STORE_NAME)) {
    const eqStore = db.createObjectStore(EQUIPMENTS_STORE_NAME, { keyPath: 'id' });
    eqStore.createIndex('ownerId', 'ownerId', { unique: false });
    eqStore.createIndex('typeId', 'typeId', { unique: false });
  } else if (needsCleanV6Wipe) {
    clearStoreIfExists(db, tx, EQUIPMENTS_STORE_NAME);
  }

  if (!db.objectStoreNames.contains(CUSTOM_TECHNICAL_SPECS_STORE_NAME)) {
    const specsStore = db.createObjectStore(CUSTOM_TECHNICAL_SPECS_STORE_NAME, { keyPath: 'id' });
    specsStore.createIndex('groupTitle', 'groupTitle', { unique: false });
    specsStore.createIndex('order', 'order', { unique: false });
  } else if (needsCleanV6Wipe) {
    clearStoreIfExists(db, tx, CUSTOM_TECHNICAL_SPECS_STORE_NAME);
  }

  if (!db.objectStoreNames.contains(PARTNERS_STORE_NAME)) {
    const partnersStore = db.createObjectStore(PARTNERS_STORE_NAME, { keyPath: 'id' });
    partnersStore.createIndex('ownerId', 'ownerId', { unique: false });
    partnersStore.createIndex('partnerType', 'partnerType', { unique: false });
  }

  if (!db.objectStoreNames.contains(SPEC_GROUPS_STORE_NAME)) {
    const groupsStore = db.createObjectStore(SPEC_GROUPS_STORE_NAME, { keyPath: 'id' });
    groupsStore.createIndex('scope', 'scope', { unique: false });
    groupsStore.createIndex('order', 'order', { unique: false });
  } else if (needsCleanV6Wipe) {
    clearStoreIfExists(db, tx, SPEC_GROUPS_STORE_NAME);
  }

  if (!db.objectStoreNames.contains(INCLUSIONS_CATALOG_STORE_NAME)) {
    const incStore = db.createObjectStore(INCLUSIONS_CATALOG_STORE_NAME, { keyPath: 'id' });
    incStore.createIndex('kind', 'kind', { unique: false });
  } else if (needsCleanV6Wipe) {
    clearStoreIfExists(db, tx, INCLUSIONS_CATALOG_STORE_NAME);
  }

  if (!db.objectStoreNames.contains(OPERATIONAL_COSTS_STORE_NAME)) {
    const opCostStore = db.createObjectStore(OPERATIONAL_COSTS_STORE_NAME, { keyPath: 'id' });
    opCostStore.createIndex('ownerId', 'ownerId', { unique: false });
    opCostStore.createIndex('entityId', 'entityId', { unique: false });
  }

  if (!db.objectStoreNames.contains(REGISTERED_SUPPLIERS_STORE_NAME)) {
    const supStore = db.createObjectStore(REGISTERED_SUPPLIERS_STORE_NAME, { keyPath: 'id' });
    supStore.createIndex('platformStatus', 'platformStatus', { unique: false });
    supStore.createIndex('addedByUserId', 'addedByUserId', { unique: false });
  }

  if (!db.objectStoreNames.contains(SUPPLIER_JOURNALS_STORE_NAME)) {
    const journalStore = db.createObjectStore(SUPPLIER_JOURNALS_STORE_NAME, { keyPath: 'id' });
    journalStore.createIndex('supplierId', 'supplierId', { unique: false });
    journalStore.createIndex('entityId', 'entityId', { unique: false });
  }

  if (!db.objectStoreNames.contains(SUBSCRIBED_USERS_STORE_NAME)) {
    db.createObjectStore(SUBSCRIBED_USERS_STORE_NAME, { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains(PERSON_PROFILES_STORE_NAME)) {
    const profileStore = db.createObjectStore(PERSON_PROFILES_STORE_NAME, { keyPath: 'id' });
    profileStore.createIndex('phone', 'phone', { unique: false });
    profileStore.createIndex('addedByUserId', 'addedByUserId', { unique: false });
    profileStore.createIndex('subscriptionStatus', 'subscriptionStatus', { unique: false });
  }

  if (!db.objectStoreNames.contains(BILATERAL_LEDGER_STORE_NAME)) {
    const ledgerStore = db.createObjectStore(BILATERAL_LEDGER_STORE_NAME, { keyPath: 'id' });
    ledgerStore.createIndex('profileId', 'profileId', { unique: false });
    ledgerStore.createIndex('counterpartyUserId', 'counterpartyUserId', { unique: false });
    ledgerStore.createIndex('claimedUserId', 'claimedUserId', { unique: false });
  }

  if (!db.objectStoreNames.contains(EQUIPMENT_UNIT_KINDS_STORE_NAME)) {
    db.createObjectStore(EQUIPMENT_UNIT_KINDS_STORE_NAME, { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains(MANUFACTURERS_STORE_NAME)) {
    const mfgStore = db.createObjectStore(MANUFACTURERS_STORE_NAME, { keyPath: 'id' });
    mfgStore.createIndex('applicableTo', 'applicableTo', { unique: false });
  }

  if (!db.objectStoreNames.contains(MANUFACTURER_MODELS_STORE_NAME)) {
    const mdlStore = db.createObjectStore(MANUFACTURER_MODELS_STORE_NAME, { keyPath: 'id' });
    mdlStore.createIndex('manufacturerId', 'manufacturerId', { unique: false });
  }

  if (!db.objectStoreNames.contains(COUNTRIES_REF_STORE_NAME)) {
    db.createObjectStore(COUNTRIES_REF_STORE_NAME, { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains(CITIES_REF_STORE_NAME)) {
    const cityStore = db.createObjectStore(CITIES_REF_STORE_NAME, { keyPath: 'id' });
    cityStore.createIndex('countryId', 'countryId', { unique: false });
  }

  if (!db.objectStoreNames.contains(MEETING_POINTS_REF_STORE_NAME)) {
    const mpStore = db.createObjectStore(MEETING_POINTS_REF_STORE_NAME, { keyPath: 'id' });
    mpStore.createIndex('cityId', 'cityId', { unique: false });
  }
}

async function cleanupLegacyActivitiesDb(): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  try {
    const idbFactory = window.indexedDB as IDBFactory & {
      databases?: () => Promise<Array<{ name?: string; version?: number }>>;
    };
    if (typeof idbFactory.databases === 'function') {
      const existingDbs = await idbFactory.databases();
      if (existingDbs.some((d) => d.name === LEGACY_ACTIVITIES_DB_NAME)) {
        await new Promise<void>((resolve) => {
          const delReq = window.indexedDB.deleteDatabase(LEGACY_ACTIVITIES_DB_NAME);
          delReq.onsuccess = () => resolve();
          delReq.onerror = () => resolve();
          delReq.onblocked = () => resolve();
        });
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

export function openUnifiedLocalDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }

  ensureOneTimeV6CleanReset();

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
      void cleanupLegacyActivitiesDb().finally(() => resolve(db));
    };

    request.onerror = () => {
      openDbPromise = null;
      reject(request.error ?? new Error('Failed to open unified IndexedDB'));
    };
  });

  return openDbPromise;
}

export async function wipeStoresForCleanReset(storeNames: string[]): Promise<void> {
  try {
    const db = await openUnifiedLocalDb();
    const existing = storeNames.filter((n) => db.objectStoreNames.contains(n));
    if (existing.length === 0) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(existing, 'readwrite');
      for (const name of existing) {
        tx.objectStore(name).clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to clear stores'));
    });
  } catch {
    // Fallback storage keys cleared individually
  }
}
