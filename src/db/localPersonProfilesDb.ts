import type {
  BilateralLedgerEntry,
  PersonProfile
} from '../types/personProfile';
import {
  BILATERAL_LEDGER_STORE_NAME,
  PERSON_PROFILES_STORE_NAME,
  openUnifiedLocalDb
} from './unifiedLocalDb';

const LS_PROFILES_KEY = 'zanoza_person_profiles_v1';
const LS_LEDGER_KEY = 'zanoza_bilateral_ledger_entries_v1';

async function readStore<T>(storeName: string, lsKey: string): Promise<T[]> {
  try {
    const db = await openUnifiedLocalDb();
    const rows = await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
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
      // ignore fallback errors
    }
    return [];
  }
}

async function putItem<T extends { id: string }>(
  storeName: string,
  lsKey: string,
  item: T
): Promise<T> {
  try {
    const db = await openUnifiedLocalDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error(`Failed saving to ${storeName}`));
    });
  } catch {
    const existing = await readStore<T>(storeName, lsKey);
    const idx = existing.findIndex((r) => r.id === item.id);
    const next = idx >= 0 ? existing.map((r, i) => (i === idx ? item : r)) : [item, ...existing];
    try {
      window.localStorage.setItem(lsKey, JSON.stringify(next));
    } catch {
      // ignore quota error
    }
  }
  return item;
}

async function deleteItem(storeName: string, lsKey: string, id: string): Promise<void> {
  try {
    const db = await openUnifiedLocalDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error(`Failed deleting from ${storeName}`));
    });
  } catch {
    const existing = await readStore<{ id: string }>(storeName, lsKey);
    const next = existing.filter((r) => r.id !== id);
    try {
      window.localStorage.setItem(lsKey, JSON.stringify(next));
    } catch {
      // ignore quota error
    }
  }
}

export async function loadPersonProfilesFromDb(): Promise<PersonProfile[]> {
  return readStore<PersonProfile>(PERSON_PROFILES_STORE_NAME, LS_PROFILES_KEY);
}

export async function savePersonProfileToDb(profile: PersonProfile): Promise<PersonProfile> {
  return putItem(PERSON_PROFILES_STORE_NAME, LS_PROFILES_KEY, profile);
}

export async function deletePersonProfileFromDb(profileId: string): Promise<void> {
  return deleteItem(PERSON_PROFILES_STORE_NAME, LS_PROFILES_KEY, profileId);
}

export async function loadBilateralLedgerFromDb(): Promise<BilateralLedgerEntry[]> {
  return readStore<BilateralLedgerEntry>(BILATERAL_LEDGER_STORE_NAME, LS_LEDGER_KEY);
}

export async function saveBilateralLedgerEntryToDb(
  entry: BilateralLedgerEntry
): Promise<BilateralLedgerEntry> {
  return putItem(BILATERAL_LEDGER_STORE_NAME, LS_LEDGER_KEY, entry);
}

export async function deleteBilateralLedgerEntryFromDb(entryId: string): Promise<void> {
  return deleteItem(BILATERAL_LEDGER_STORE_NAME, LS_LEDGER_KEY, entryId);
}
