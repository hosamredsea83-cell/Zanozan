import type { Waypoint } from '../types/activity';
import {
  WAYPOINTS_BANK_STORE_NAME as STORE_NAME,
  openUnifiedLocalDb
} from './unifiedLocalDb';

export interface StoredWaypointRecord {
  id: string;
  name: string;
  type: Waypoint['type'];
  durationMinutes?: number;
  departureTime?: string;
  returnTime?: string;
  description: string;
  savedAt: number;
}

const LS_FALLBACK_KEY = 'zanoza_local_waypoints_bank_v1';
export const MAX_WAYPOINTS_BANK_ITEMS = 10;

function normalizeWaypointName(name: string): string {
  return name.trim().toLowerCase();
}

function mergeAndTakeLatest10(records: StoredWaypointRecord[]): StoredWaypointRecord[] {
  const byName = new Map<string, StoredWaypointRecord>();
  for (const item of records) {
    const trimmedName = item.name?.trim();
    if (!trimmedName) continue;
    const key = normalizeWaypointName(trimmedName);
    const existing = byName.get(key);
    const candidate: StoredWaypointRecord = {
      ...item,
      name: trimmedName,
      savedAt: typeof item.savedAt === 'number' && Number.isFinite(item.savedAt) ? item.savedAt : 0
    };
    if (!existing || candidate.savedAt >= existing.savedAt) {
      byName.set(key, candidate);
    }
  }

  return Array.from(byName.values())
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, MAX_WAYPOINTS_BANK_ITEMS);
}

async function readBankFromLocalDb(): Promise<StoredWaypointRecord[]> {
  try {
    const db = await openUnifiedLocalDb();
    const rows = await new Promise<StoredWaypointRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as StoredWaypointRecord[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error('Failed to read waypoints bank'));
    });
    return mergeAndTakeLatest10(rows);
  } catch {
    try {
      const raw = window.localStorage.getItem(LS_FALLBACK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredWaypointRecord[];
        return Array.isArray(parsed) ? mergeAndTakeLatest10(parsed) : [];
      }
    } catch {
      // ignore parse errors
    }
    return [];
  }
}

async function writeBankToLocalDb(records: StoredWaypointRecord[]): Promise<void> {
  const normalized = mergeAndTakeLatest10(records);
  try {
    const db = await openUnifiedLocalDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const rec of normalized) {
        store.put(rec);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to write waypoints bank'));
    });
  } catch {
    try {
      window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(normalized));
    } catch {
      // ignore quota errors
    }
  }
}

export async function loadWaypointsBankFromDb(): Promise<StoredWaypointRecord[]> {
  const localRows = await readBankFromLocalDb();

  try {
    const res = await fetch('/api/waypoints-bank');
    if (res.ok) {
      const payload = (await res.json()) as { waypoints?: StoredWaypointRecord[] };
      const serverRows = Array.isArray(payload.waypoints) ? payload.waypoints : [];
      const merged = mergeAndTakeLatest10([...localRows, ...serverRows]);

      // Sync any local items not yet on server
      const serverKeys = new Set(serverRows.map((r) => normalizeWaypointName(r.name)));
      const missingOnServer = localRows.filter((r) => !serverKeys.has(normalizeWaypointName(r.name)));
      if (missingOnServer.length > 0) {
        void fetch('/api/waypoints-bank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ waypoints: missingOnServer })
        }).catch(() => undefined);
      }

      await writeBankToLocalDb(merged);
      return merged;
    }
  } catch {
    // Fall back to local IndexedDB
  }

  return localRows;
}

export async function saveWaypointsToBankDb(
  inputs: Array<{
    id?: string;
    name: string;
    type: Waypoint['type'];
    durationMinutes?: number;
    departureTime?: string;
    returnTime?: string;
    description?: string;
    savedAt?: number;
  }>
): Promise<StoredWaypointRecord[]> {
  const now = Date.now();
  const prepared: StoredWaypointRecord[] = inputs
    .filter((item) => Boolean(item.name?.trim()))
    .map((item, idx) => ({
      id: item.id || `wp-${now}-${idx}`,
      name: item.name.trim(),
      type: item.type,
      durationMinutes:
        item.type === 'departure' || item.type === 'return' ? undefined : item.durationMinutes,
      departureTime: item.type === 'departure' ? item.departureTime : undefined,
      returnTime: item.type === 'return' ? item.returnTime : undefined,
      description: item.description || `محطة ${item.name.trim()}`,
      savedAt: typeof item.savedAt === 'number' ? item.savedAt : now + idx
    }));

  if (prepared.length === 0) {
    return readBankFromLocalDb();
  }

  const existingLocal = await readBankFromLocalDb();
  const mergedLocal = mergeAndTakeLatest10([...existingLocal, ...prepared]);
  await writeBankToLocalDb(mergedLocal);

  try {
    const res = await fetch('/api/waypoints-bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waypoints: prepared })
    });
    if (res.ok) {
      const data = (await res.json()) as { waypoints?: StoredWaypointRecord[] };
      if (Array.isArray(data.waypoints)) {
        const merged = mergeAndTakeLatest10([...mergedLocal, ...data.waypoints]);
        await writeBankToLocalDb(merged);
        return merged;
      }
    }
  } catch {
    // Local DB already updated
  }

  return mergedLocal;
}
