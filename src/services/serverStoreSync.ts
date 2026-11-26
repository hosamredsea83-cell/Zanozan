export type ServerStoreDomain =
  | 'bookings_activities'
  | 'bookings_trips'
  | 'in_trip_requests'
  | 'logistics_vehicles'
  | 'finance_state'
  | 'equipments'
  | 'person_profiles'
  | 'bilateral_ledger'
  | 'reviews'
  | 'driver_missions'
  | 'maintenance_blocks'
  | 'audit_logs'
  | 'master_reference'
  | 'user_permissions';

let inMemoryBearerToken: string | null = null;

export function setInMemoryAuthToken(token: string | null): void {
  inMemoryBearerToken = token;
}

export function getInMemoryAuthToken(): string | null {
  return inMemoryBearerToken;
}

export function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra || {}) };
  if (inMemoryBearerToken) {
    headers.Authorization = `Bearer ${inMemoryBearerToken}`;
  }
  return headers;
}

export async function fetchDomainStore<T>(domain: ServerStoreDomain): Promise<T | null> {
  try {
    const res = await fetch(`/api/store/${encodeURIComponent(domain)}`, {
      headers: buildAuthHeaders()
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T | null };
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function saveDomainStore<T>(
  domain: ServerStoreDomain,
  data: T
): Promise<boolean> {
  try {
    const res = await fetch(`/api/store/${encodeURIComponent(domain)}`, {
      method: 'PUT',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ data })
    });
    return res.ok;
  } catch {
    return false;
  }
}
