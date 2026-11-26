import type { AppUser } from '../types/auth';
import type {
  RegisteredSupplierRecord,
  SupplierPricingJournalEntry
} from '../types/supplierJournal';
import {
  REGISTERED_SUPPLIERS_STORE_NAME,
  SUBSCRIBED_USERS_STORE_NAME,
  SUPPLIER_JOURNALS_STORE_NAME,
  openUnifiedLocalDb
} from './unifiedLocalDb';

const LS_SUPPLIERS_KEY = 'zanoza_registered_suppliers_v1';
const LS_JOURNALS_KEY = 'zanoza_supplier_pricing_journals_v1';
const LS_SUBSCRIBED_USERS_KEY = 'zanoza_platform_subscribed_users_v1';

async function readAllFromStore<T>(storeName: string, lsKey: string): Promise<T[]> {
  try {
    const db = await openUnifiedLocalDb();
    const rows = await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error(`Failed reading ${storeName}`));
    });
    return rows;
  } catch {
    try {
      const raw = window.localStorage.getItem(lsKey);
      if (raw) {
        const parsed = JSON.parse(raw) as T[];
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore fallback parse error
    }
    return [];
  }
}

async function putRecordInStore<T extends { id: string }>(
  storeName: string,
  lsKey: string,
  record: T
): Promise<void> {
  try {
    const db = await openUnifiedLocalDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error(`Failed saving to ${storeName}`));
    });
  } catch {
    const existing = await readAllFromStore<T>(storeName, lsKey);
    const idx = existing.findIndex((item) => item.id === record.id);
    const next =
      idx >= 0 ? existing.map((item, i) => (i === idx ? record : item)) : [record, ...existing];
    try {
      window.localStorage.setItem(lsKey, JSON.stringify(next));
    } catch {
      // ignore quota error
    }
  }
}

export async function loadRegisteredSuppliersFromDb(): Promise<RegisteredSupplierRecord[]> {
  return readAllFromStore<RegisteredSupplierRecord>(
    REGISTERED_SUPPLIERS_STORE_NAME,
    LS_SUPPLIERS_KEY
  );
}

export async function saveRegisteredSupplierToDb(
  record: RegisteredSupplierRecord
): Promise<RegisteredSupplierRecord> {
  await putRecordInStore(REGISTERED_SUPPLIERS_STORE_NAME, LS_SUPPLIERS_KEY, record);
  return record;
}

export async function loadSupplierPricingJournalsFromDb(): Promise<SupplierPricingJournalEntry[]> {
  return readAllFromStore<SupplierPricingJournalEntry>(
    SUPPLIER_JOURNALS_STORE_NAME,
    LS_JOURNALS_KEY
  );
}

export async function saveSupplierPricingJournalToDb(
  entry: SupplierPricingJournalEntry
): Promise<SupplierPricingJournalEntry> {
  await putRecordInStore(SUPPLIER_JOURNALS_STORE_NAME, LS_JOURNALS_KEY, entry);
  return entry;
}

export async function loadSubscribedUsersFromDb(): Promise<AppUser[]> {
  return readAllFromStore<AppUser>(SUBSCRIBED_USERS_STORE_NAME, LS_SUBSCRIBED_USERS_KEY);
}

export async function saveSubscribedUserToDb(user: AppUser): Promise<AppUser> {
  await putRecordInStore(SUBSCRIBED_USERS_STORE_NAME, LS_SUBSCRIBED_USERS_KEY, user);
  return user;
}
