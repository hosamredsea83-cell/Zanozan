import { OPERATIONAL_COSTS_STORE_NAME, openUnifiedLocalDb } from './unifiedLocalDb';
import type { ActivityCostProfile } from '../types/operationalCost';

const LS_OPERATIONAL_COSTS_FALLBACK = 'zanoza_operational_costs_v1';

async function readAllProfiles(): Promise<ActivityCostProfile[]> {
  try {
    const db = await openUnifiedLocalDb();
    return await new Promise<ActivityCostProfile[]>((resolve, reject) => {
      const tx = db.transaction(OPERATIONAL_COSTS_STORE_NAME, 'readonly');
      const store = tx.objectStore(OPERATIONAL_COSTS_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as ActivityCostProfile[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error('Failed reading operational_costs'));
    });
  } catch {
    try {
      const raw = window.localStorage.getItem(LS_OPERATIONAL_COSTS_FALLBACK);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ActivityCostProfile[]) : [];
      }
    } catch {
      // ignore storage errors
    }
    return [];
  }
}

async function replaceAllProfiles(profiles: ActivityCostProfile[]): Promise<void> {
  try {
    const db = await openUnifiedLocalDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(OPERATIONAL_COSTS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(OPERATIONAL_COSTS_STORE_NAME);
      store.clear();
      for (const profile of profiles) {
        store.put(profile);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed writing operational_costs'));
    });
  } catch {
    // fallback handled below
  }

  try {
    window.localStorage.setItem(LS_OPERATIONAL_COSTS_FALLBACK, JSON.stringify(profiles));
  } catch {
    // ignore storage errors
  }
}

export async function loadOperationalCostProfilesFromDb(): Promise<ActivityCostProfile[]> {
  const profiles = await readAllProfiles();
  return [...profiles].sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );
}

export async function saveOperationalCostProfilesToDb(
  profiles: ActivityCostProfile[]
): Promise<void> {
  await replaceAllProfiles(profiles);
}
