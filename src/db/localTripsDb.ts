import type { TripMediaItem, TripRecord } from '../types/trip';
import type { AppUser } from '../types/auth';
import {
  TRIPS_STORE_NAME as STORE_NAME,
  openUnifiedLocalDb as openTripsDb
} from './unifiedLocalDb';

const LS_FALLBACK_KEY = 'zanoza_local_trips_v1';

async function readTripsFromLocalDb(): Promise<TripRecord[]> {
  try {
    const db = await openTripsDb();
    const rows = await new Promise<TripRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as TripRecord[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error('Failed to read trips from IndexedDB'));
    });
    return rows;
  } catch {
    try {
      const raw = window.localStorage.getItem(LS_FALLBACK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TripRecord[];
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore parse errors
    }
    return [];
  }
}

async function writeAllTripsToLocalDb(trips: TripRecord[]): Promise<void> {
  try {
    const db = await openTripsDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const trip of trips) {
        store.put(trip);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to write trips to IndexedDB'));
    });
  } catch {
    try {
      window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(trips));
    } catch {
      // ignore quota errors
    }
  }
}

async function putTripInLocalDb(trip: TripRecord): Promise<void> {
  try {
    const db = await openTripsDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(trip);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to save trip to IndexedDB'));
    });
  } catch {
    const existing = await readTripsFromLocalDb();
    const idx = existing.findIndex((t) => t.id === trip.id);
    const next = idx >= 0 ? existing.map((t, i) => (i === idx ? trip : t)) : [trip, ...existing];
    try {
      window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }
}

async function deleteTripFromLocalDb(tripId: string): Promise<void> {
  try {
    const db = await openTripsDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(tripId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to delete trip from IndexedDB'));
    });
  } catch {
    const existing = await readTripsFromLocalDb();
    const next = existing.filter((t) => t.id !== tripId);
    try {
      window.localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }
}

export function tripBelongsToOwner(trip: TripRecord, user: AppUser): boolean {
  if (trip.supplierCustody?.isExternalSupplier) {
    if (
      trip.supplierCustody.supplierStatus === 'pending_signup' ||
      trip.supplierCustody.supplierStatus === 'claim_requested'
    ) {
      return (
        trip.supplierCustody.addedByUserId === user.id ||
        trip.createdById === user.id
      );
    }
    if (trip.supplierCustody.supplierStatus === 'subscribed') {
      return (
        trip.supplierCustody.claimedUserId === user.id ||
        trip.owner?.id === user.id
      );
    }
  }
  if (!trip.owner) return false;
  return (
    trip.owner.id === user.id ||
    trip.owner.companyName === user.companyName ||
    trip.owner.name === user.name
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

async function persistTripMediaItems(media: TripMediaItem[]): Promise<TripMediaItem[]> {
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
        return { ...item, url: dataUrl };
      } catch {
        return item;
      }
    })
  );
}

export async function loadAllTripsFromDb(): Promise<TripRecord[]> {
  const localTrips = await readTripsFromLocalDb();

  try {
    const res = await fetch('/api/trips');
    if (res.ok) {
      const payload = (await res.json()) as { trips?: TripRecord[] };
      const serverTrips = Array.isArray(payload.trips) ? payload.trips : [];

      const serverIds = new Set(serverTrips.map((t) => t.id));
      const missingOnServer = localTrips.filter((t) => !serverIds.has(t.id));
      if (missingOnServer.length > 0) {
        await Promise.all(
          missingOnServer.map((trip) =>
            fetch(`/api/trips/${encodeURIComponent(trip.id)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ trip })
            }).catch(() => undefined)
          )
        );
      }

      const merged = [...missingOnServer, ...serverTrips];
      await writeAllTripsToLocalDb(merged);
      return merged;
    }
  } catch {
    // Fall back cleanly to local DB when server is unreachable
  }

  return localTrips;
}

export async function loadCompanyTripsFromDb(user: AppUser): Promise<TripRecord[]> {
  const params = new URLSearchParams({
    ownerId: user.id,
    companyName: user.companyName,
    ownerName: user.name
  });

  try {
    const res = await fetch(`/api/trips?${params.toString()}`);
    if (res.ok) {
      const payload = (await res.json()) as { trips?: TripRecord[] };
      if (Array.isArray(payload.trips)) {
        return payload.trips;
      }
    }
  } catch {
    // Fall back to local IndexedDB filter
  }

  const localTrips = await readTripsFromLocalDb();
  return localTrips.filter((trip) => tripBelongsToOwner(trip, user));
}

export async function saveTripToDb(trip: TripRecord): Promise<TripRecord> {
  const persistedMedia = await persistTripMediaItems(trip.media);
  const nowDate = new Date().toISOString().split('T')[0];
  const record: TripRecord = {
    ...trip,
    entityKind: 'trip',
    media: persistedMedia,
    createdAt: trip.createdAt || nowDate,
    updatedAt: nowDate
  };

  await putTripInLocalDb(record);

  try {
    const res = await fetch(`/api/trips/${encodeURIComponent(record.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trip: record })
    });
    if (res.ok) {
      const data = (await res.json()) as { trip?: TripRecord };
      if (data.trip) {
        await putTripInLocalDb(data.trip);
        return data.trip;
      }
    }
  } catch {
    // Local IndexedDB already has the saved trip
  }

  return record;
}

export async function deleteTripFromDb(tripId: string): Promise<void> {
  await deleteTripFromLocalDb(tripId);
  try {
    await fetch(`/api/trips/${encodeURIComponent(tripId)}`, {
      method: 'DELETE'
    });
  } catch {
    // Local IndexedDB deletion already completed
  }
}
