import type { Activity, ActivityMediaItem } from '../types/activity';
import type { AppUser } from '../types/auth';

import {
  ACTIVITIES_STORE_NAME as STORE_NAME,
  openUnifiedLocalDb as openActivitiesDb
} from './unifiedLocalDb';

const LS_FALLBACK_KEY = 'zanoza_local_activities_v1';

async function readActivitiesFromLocalDb(): Promise<Activity[]> {
  try {
    const db = await openActivitiesDb();
    const rows = await new Promise<Activity[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as Activity[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error('Failed to read activities from IndexedDB'));
    });
    return rows;
  } catch {
    try {
      const raw = window.localStorage.getItem(LS_FALLBACK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Activity[];
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore parse errors
    }
    return [];
  }
}

async function writeAllActivitiesToLocalDb(activities: Activity[]): Promise<void> {
  try {
    const db = await openActivitiesDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const act of activities) {
        store.put(act);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to write activities to IndexedDB'));
    });
  } catch {
    try {
      window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(activities));
    } catch {
      // ignore quota errors
    }
  }
}

async function putActivityInLocalDb(activity: Activity): Promise<void> {
  try {
    const db = await openActivitiesDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(activity);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to save activity to IndexedDB'));
    });
  } catch {
    const existing = await readActivitiesFromLocalDb();
    const idx = existing.findIndex((a) => a.id === activity.id);
    const next = idx >= 0 ? existing.map((a, i) => (i === idx ? activity : a)) : [activity, ...existing];
    try {
      window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }
}

async function deleteActivityFromLocalDb(activityId: string): Promise<void> {
  try {
    const db = await openActivitiesDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(activityId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to delete activity from IndexedDB'));
    });
  } catch {
    const existing = await readActivitiesFromLocalDb();
    const next = existing.filter((a) => a.id !== activityId);
    try {
      window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }
}

export function activityBelongsToOwner(act: Activity, user: AppUser): boolean {
  if (!act.owner) return false;
  return (
    act.owner.id === user.id ||
    act.owner.companyName === user.companyName ||
    act.owner.name === user.name
  );
}

async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image data'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

async function persistMediaItems(media: ActivityMediaItem[]): Promise<ActivityMediaItem[]> {
  return Promise.all(
    media.map(async (item) => {
      if (item.type !== 'image' || !item.url || !item.url.startsWith('blob:')) {
        return item;
      }
      try {
        const dataUrl = await blobUrlToDataUrl(item.url);
        const res = await fetch('/api/uploads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, filename: item.title || item.id })
        });
        if (res.ok) {
          const data = (await res.json()) as { url?: string };
          if (data.url) {
            return { ...item, url: data.url };
          }
        }
        // Fallback to persistent dataUrl if server upload fails
        return { ...item, url: dataUrl };
      } catch {
        return item;
      }
    })
  );
}

export async function loadAllActivitiesFromDb(): Promise<Activity[]> {
  const localActivities = await readActivitiesFromLocalDb();

  try {
    const res = await fetch('/api/activities');
    if (res.ok) {
      const payload = (await res.json()) as { activities?: Activity[] };
      const serverActivities = Array.isArray(payload.activities) ? payload.activities : [];

      // If browser IndexedDB has saved activities that aren't on the server yet, sync them up
      const serverIds = new Set(serverActivities.map((a) => a.id));
      const missingOnServer = localActivities.filter((a) => !serverIds.has(a.id));
      if (missingOnServer.length > 0) {
        await Promise.all(
          missingOnServer.map((act) =>
            fetch(`/api/activities/${encodeURIComponent(act.id)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ activity: act })
            }).catch(() => undefined)
          )
        );
      }

      const merged = [...missingOnServer, ...serverActivities];
      await writeAllActivitiesToLocalDb(merged);
      return merged;
    }
  } catch {
    // Fall back cleanly to local DB when server is unreachable
  }

  return localActivities;
}

export async function loadCompanyActivitiesFromDb(user: AppUser): Promise<Activity[]> {
  const params = new URLSearchParams({
    ownerId: user.id,
    companyName: user.companyName,
    ownerName: user.name
  });

  try {
    const res = await fetch(`/api/activities?${params.toString()}`);
    if (res.ok) {
      const payload = (await res.json()) as { activities?: Activity[] };
      if (Array.isArray(payload.activities)) {
        return payload.activities;
      }
    }
  } catch {
    // Fall back to local IndexedDB filter
  }

  const localActivities = await readActivitiesFromLocalDb();
  return localActivities.filter((act) => activityBelongsToOwner(act, user));
}

export async function saveActivityToDb(activity: Activity): Promise<Activity> {
  const persistedMedia = await persistMediaItems(activity.media);
  const nowDate = new Date().toISOString().split('T')[0];
  const record: Activity = {
    ...activity,
    media: persistedMedia,
    createdAt: activity.createdAt || nowDate,
    updatedAt: nowDate
  };

  await putActivityInLocalDb(record);

  try {
    const res = await fetch(`/api/activities/${encodeURIComponent(record.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: record })
    });
    if (res.ok) {
      const data = (await res.json()) as { activity?: Activity };
      if (data.activity) {
        await putActivityInLocalDb(data.activity);
        return data.activity;
      }
    }
  } catch {
    // Local IndexedDB already has the saved activity
  }

  return record;
}

export async function deleteActivityFromDb(activityId: string): Promise<void> {
  await deleteActivityFromLocalDb(activityId);
  try {
    await fetch(`/api/activities/${encodeURIComponent(activityId)}`, {
      method: 'DELETE'
    });
  } catch {
    // Local IndexedDB deletion already completed
  }
}
