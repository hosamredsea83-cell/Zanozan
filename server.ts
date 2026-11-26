import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import process from 'node:process';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  computeAuthoritativeBookingBreakdown,
  evaluateCancellationRefund,
  isSlotOperatingOnDate,
  validatePromoCodeForBooking,
  type PlatformFeeTaxConfig
} from './src/utils/bookingPricing';
import type { Activity } from './src/types/activity';
import type { ResourceMaintenanceBlock, SelectedPaidAddonItem } from './src/types/finance';

interface TranslateItem {
  key: string;
  text: string;
}

interface TranslateRequestBody {
  items?: TranslateItem[];
  sourceLang?: string;
  targetLang?: string;
  targetLangs?: string[];
}

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_DIR = path.join(DATA_DIR, 'stores');
const ACTIVITIES_DB_FILE = path.join(DATA_DIR, 'activities.json');
const TRIPS_DB_FILE = path.join(DATA_DIR, 'trips.json');
const WAYPOINTS_BANK_DB_FILE = path.join(DATA_DIR, 'waypoints_bank.json');
const PRICING_SETTINGS_DB_FILE = path.join(DATA_DIR, 'pricing_settings.json');
const AUTH_USERS_DB_FILE = path.join(DATA_DIR, 'auth_users.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

const AUTH_TOKEN_SECRET =
  process.env.AUTH_TOKEN_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

const ALLOWED_STORE_DOMAINS = new Set<string>([
  'bookings_activities',
  'bookings_trips',
  'in_trip_requests',
  'logistics_vehicles',
  'finance_state',
  'equipments',
  'person_profiles',
  'bilateral_ledger',
  'reviews',
  'driver_missions',
  'maintenance_blocks',
  'audit_logs',
  'master_reference',
  'user_permissions'
]);

type ServerUserRoleKey =
  | 'platform_admin'
  | 'subscriber_owner'
  | 'driver'
  | 'equipment_owner'
  | 'customer';

interface StoredAuthUser {
  id: string;
  name: string;
  email: string;
  companyName: string;
  phone: string;
  role: string;
  roleKey: ServerUserRoleKey;
  tier: string;
  avatarColor: string;
  initials: string;
  avatarInitials: string;
  nationality?: string;
  customerScope?: 'platform' | 'company';
  registeredCompanyId?: string;
  registeredCompanyName?: string;
  registrationSource?: 'platform_signup' | 'company_page' | 'booking_clerk';
  passwordHash: string;
  createdAt: string;
}

interface AuthTokenPayload {
  uid: string;
  roleKey: ServerUserRoleKey;
  name: string;
  email: string;
  companyName: string;
  phone: string;
  exp: number;
}

interface StoredActivityRecord {
  id: string;
  name?: string;
  owner?: {
    id?: string;
    name?: string;
    companyName?: string;
    phone?: string;
    tier?: string;
  };
  updatedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}

let dbWriteQueue: Promise<void> = Promise.resolve();

async function ensureDataDirs(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

function resolveStoreFilePath(domain: string): string | null {
  if (!ALLOWED_STORE_DOMAINS.has(domain)) return null;
  const resolved = path.resolve(STORE_DIR, `store_${domain}.json`);
  if (!resolved.startsWith(STORE_DIR + path.sep)) return null;
  return resolved;
}

async function readDomainStore<T = unknown>(domain: string, fallback: T): Promise<T> {
  const filePath = resolveStoreFilePath(domain);
  if (!filePath) return fallback;
  await ensureDataDirs();
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return fallback;
    }
    console.error(`Failed to read store ${domain}:`, err);
    return fallback;
  }
}

async function writeDomainStore(domain: string, data: unknown): Promise<void> {
  const filePath = resolveStoreFilePath(domain);
  if (!filePath) throw new Error('Invalid store domain');
  await ensureDataDirs();
  const tmpFile = `${filePath}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmpFile, filePath);
}

function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPasswordScrypt(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, hexHash] = parts;
  if (!salt || !hexHash) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hexHash, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function safeTimingEqualStrings(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function signAuthToken(payload: AuthTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyAuthToken(token: string): AuthTokenPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', AUTH_TOKEN_SECRET)
    .update(body)
    .digest('base64url');
  if (!safeTimingEqualStrings(sig, expectedSig)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AuthTokenPayload;
    if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function readAuthUsersDb(): Promise<StoredAuthUser[]> {
  await ensureDataDirs();
  try {
    const raw = await fs.readFile(AUTH_USERS_DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredAuthUser[]) : [];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return [];
    }
    return [];
  }
}

async function writeAuthUsersDb(users: StoredAuthUser[]): Promise<void> {
  await ensureDataDirs();
  const tmpFile = `${AUTH_USERS_DB_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(users, null, 2), 'utf8');
  await fs.rename(tmpFile, AUTH_USERS_DB_FILE);
}

function sanitizeAuthUser(u: StoredAuthUser) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    companyName: u.companyName,
    phone: u.phone,
    role: u.role,
    roleKey: u.roleKey,
    tier: u.tier,
    avatarColor: u.avatarColor,
    initials: u.initials,
    avatarInitials: u.avatarInitials,
    nationality: u.nationality,
    customerScope: u.customerScope,
    registeredCompanyId: u.registeredCompanyId,
    registeredCompanyName: u.registeredCompanyName,
    registrationSource: u.registrationSource
  };
}

function isEgyptianNationalityServer(val?: string): boolean {
  const n = (val || '').trim().toLowerCase();
  return (
    n === 'مصر' ||
    n === 'مصري' ||
    n === 'مصرية' ||
    n === 'جمهورية مصر العربية' ||
    n === 'egypt' ||
    n === 'egyptian' ||
    n === 'eg'
  );
}

function normalizePhoneServer(val: string): string {
  return val.replace(/[^\d+]/g, '').trim();
}

function extractBearerToken(req: express.Request): string {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return '';
}

async function readActivitiesDb(): Promise<StoredActivityRecord[]> {
  await ensureDataDirs();
  try {
    const raw = await fs.readFile(ACTIVITIES_DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredActivityRecord[]) : [];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return [];
    }
    console.error('Failed to read activities DB:', err);
    return [];
  }
}

async function writeActivitiesDb(activities: StoredActivityRecord[]): Promise<void> {
  await ensureDataDirs();
  const tmpFile = `${ACTIVITIES_DB_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(activities, null, 2), 'utf8');
  await fs.rename(tmpFile, ACTIVITIES_DB_FILE);
}

function enqueueActivitiesDbMutation<T>(fn: () => Promise<T>): Promise<T> {
  const next = dbWriteQueue.then(fn, fn);
  dbWriteQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

async function readTripsDb(): Promise<StoredActivityRecord[]> {
  await ensureDataDirs();
  try {
    const raw = await fs.readFile(TRIPS_DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredActivityRecord[]) : [];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return [];
    }
    console.error('Failed to read trips DB:', err);
    return [];
  }
}

async function writeTripsDb(trips: StoredActivityRecord[]): Promise<void> {
  await ensureDataDirs();
  const tmpFile = `${TRIPS_DB_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(trips, null, 2), 'utf8');
  await fs.rename(tmpFile, TRIPS_DB_FILE);
}

interface StoredWaypointBankRecord {
  id: string;
  name: string;
  type: 'departure' | 'stopover' | 'sightseeing' | 'return';
  durationMinutes?: number;
  departureTime?: string;
  returnTime?: string;
  description?: string;
  savedAt: number;
}

const MAX_WAYPOINTS_BANK_ITEMS = 10;

function mergeWaypointsLatest10(items: StoredWaypointBankRecord[]): StoredWaypointBankRecord[] {
  const byName = new Map<string, StoredWaypointBankRecord>();
  for (const item of items) {
    const trimmedName = typeof item?.name === 'string' ? item.name.trim() : '';
    if (!trimmedName) continue;
    const key = trimmedName.toLowerCase();
    const candidate: StoredWaypointBankRecord = {
      id: item.id || `wp-${Date.now()}`,
      name: trimmedName,
      type: item.type || 'stopover',
      durationMinutes:
        item.type === 'departure' || item.type === 'return' ? undefined : item.durationMinutes,
      departureTime: item.type === 'departure' ? item.departureTime : undefined,
      returnTime: item.type === 'return' ? item.returnTime : undefined,
      description: item.description || `محطة ${trimmedName}`,
      savedAt: typeof item.savedAt === 'number' && Number.isFinite(item.savedAt) ? item.savedAt : 0,
    };
    const existing = byName.get(key);
    if (!existing || candidate.savedAt >= existing.savedAt) {
      byName.set(key, candidate);
    }
  }
  return Array.from(byName.values())
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, MAX_WAYPOINTS_BANK_ITEMS);
}

async function readWaypointsBankDb(): Promise<StoredWaypointBankRecord[]> {
  await ensureDataDirs();
  try {
    const raw = await fs.readFile(WAYPOINTS_BANK_DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? mergeWaypointsLatest10(parsed as StoredWaypointBankRecord[])
      : [];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return [];
    }
    console.error('Failed to read waypoints bank DB:', err);
    return [];
  }
}

async function writeWaypointsBankDb(waypoints: StoredWaypointBankRecord[]): Promise<StoredWaypointBankRecord[]> {
  await ensureDataDirs();
  const latest10 = mergeWaypointsLatest10(waypoints);
  const tmpFile = `${WAYPOINTS_BANK_DB_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(latest10, null, 2), 'utf8');
  await fs.rename(tmpFile, WAYPOINTS_BANK_DB_FILE);
  return latest10;
}

async function upsertActivityItineraryIntoWaypointsBank(activity: StoredActivityRecord): Promise<void> {
  const loc = activity.location as { itinerary?: StoredWaypointBankRecord[] } | undefined;
  const itinerary = Array.isArray(loc?.itinerary) ? loc.itinerary : [];
  if (itinerary.length === 0) return;
  const existing = await readWaypointsBankDb();
  const baseTime = Date.now();
  const incoming: StoredWaypointBankRecord[] = itinerary
    .filter((wp) => wp && typeof wp.name === 'string' && wp.name.trim())
    .map((wp, idx) => ({
      ...wp,
      savedAt: typeof wp.savedAt === 'number' ? wp.savedAt : baseTime + idx,
    }));
  if (incoming.length > 0) {
    await writeWaypointsBankDb([...existing, ...incoming]);
  }
}

function matchesActivityOwner(
  act: StoredActivityRecord,
  ownerId?: string,
  companyName?: string,
  ownerName?: string
): boolean {
  const o = act.owner;
  if (!o) return false;
  if (ownerId && o.id === ownerId) return true;
  if (companyName && o.companyName === companyName) return true;
  if (ownerName && (o.name === ownerName || o.name?.includes(ownerName))) return true;
  return false;
}

type SupportedLang = 'ar' | 'en' | 'ru' | 'de';

const LANG_LABELS: Record<SupportedLang, string> = {
  ar: 'Arabic',
  en: 'English',
  ru: 'Russian',
  de: 'German',
};

let cachedAiClient: GoogleGenAI | null = null;
let cachedAiKey = '';

const MAX_CACHE_ENTRIES = 1500;
const translationCache = new Map<string, string>();

const BATCH_SEPARATOR = '\n[[0x7F]]\n';
const BATCH_SEPARATOR_REGEX = /\r?\n?\[\[\s*0x7F\s*\]\]\r?\n?/i;

function getCachedTranslation(
  sourceLang: SupportedLang,
  targetLang: SupportedLang,
  text: string
): string | undefined {
  const key = `${sourceLang}:${targetLang}:${text}`;
  const hit = translationCache.get(key);
  if (hit !== undefined) {
    // Refresh recency
    translationCache.delete(key);
    translationCache.set(key, hit);
  }
  return hit;
}

function setCachedTranslation(
  sourceLang: SupportedLang,
  targetLang: SupportedLang,
  text: string,
  translated: string
) {
  const key = `${sourceLang}:${targetLang}:${text}`;
  if (translationCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = translationCache.keys().next().value;
    if (oldestKey) translationCache.delete(oldestKey);
  }
  translationCache.set(key, translated);
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  if (!cachedAiClient || cachedAiKey !== apiKey) {
    cachedAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    cachedAiKey = apiKey;
  }
  return cachedAiClient;
}

function normalizeLang(lang: unknown, fallback: SupportedLang): SupportedLang {
  if (lang === 'ar' || lang === 'en' || lang === 'ru' || lang === 'de') {
    return lang;
  }
  return fallback;
}

function combineSignalWithTimeout(parentSignal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return parentSignal ? AbortSignal.any([parentSignal, timeoutSignal]) : timeoutSignal;
}

function splitTextIntoChunks(
  text: string,
  maxChunkChars: number,
  maxEncodedChars = 1600
): string[] {
  const fitsLimit = (candidate: string) =>
    candidate.length <= maxChunkChars && encodeURIComponent(candidate).length <= maxEncodedChars;

  if (fitsLimit(text)) return [text];

  const lines = text.split('\n');
  const chunks: string[] = [];
  let buffer = '';

  const pushBuffer = () => {
    if (buffer) {
      chunks.push(buffer);
      buffer = '';
    }
  };

  for (const line of lines) {
    if (!fitsLimit(line)) {
      pushBuffer();
      const words = line.split(/\s+/);
      for (const word of words) {
        if (!word) continue;
        if (!fitsLimit(word)) {
          pushBuffer();
          let sliceStart = 0;
          while (sliceStart < word.length) {
            let sliceEnd = Math.min(word.length, sliceStart + maxChunkChars);
            while (sliceEnd > sliceStart + 1 && !fitsLimit(word.slice(sliceStart, sliceEnd))) {
              sliceEnd = Math.max(sliceStart + 1, Math.floor((sliceStart + sliceEnd) / 2));
            }
            chunks.push(word.slice(sliceStart, sliceEnd));
            sliceStart = sliceEnd;
          }
          continue;
        }
        const candidate = buffer ? `${buffer} ${word}` : word;
        if (!fitsLimit(candidate) && buffer.length > 0) {
          pushBuffer();
          buffer = word;
        } else {
          buffer = candidate;
        }
      }
      pushBuffer();
      continue;
    }

    const candidate = buffer ? `${buffer}\n${line}` : line;
    if (!fitsLimit(candidate) && buffer.length > 0) {
      pushBuffer();
      buffer = line;
    } else {
      buffer = candidate;
    }
  }
  pushBuffer();

  return chunks.length > 0 ? chunks : [text];
}

async function translateBatchWithGemini(
  items: TranslateItem[],
  sourceLang: SupportedLang,
  targetLangs: SupportedLang[],
  timeoutMs = 4500,
  parentSignal?: AbortSignal
): Promise<Record<string, Record<string, string>> | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const sourceLabel = LANG_LABELS[sourceLang];
  const targetLabels = targetLangs.map((l) => `${l} (${LANG_LABELS[l]})`).join(', ');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onParentAbort = () => controller.abort();
  parentSignal?.addEventListener('abort', onParentAbort, { once: true });

  try {
    if (parentSignal?.aborted) return null;
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: JSON.stringify(items),
      config: {
        abortSignal: controller.signal,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        systemInstruction:
          `You are a professional tourism and hospitality translator. Translate each item's "text" accurately and naturally from ${sourceLabel} into each requested target language: ${targetLabels}. If an input text is written in another language, detect it and translate it cleanly into each target language. Preserve formatting, line breaks, numbers, currency codes, and brand/place names. Return ONLY valid JSON matching the schema without markdown fences.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  lang: { type: Type.STRING },
                  translations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        translated: { type: Type.STRING },
                      },
                      required: ['key', 'translated'],
                    },
                  },
                },
                required: ['lang', 'translations'],
              },
            },
          },
          required: ['results'],
        },
      },
    });

    let rawText = response.text?.trim();
    if (!rawText) return null;

    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    const parsed = JSON.parse(rawText) as {
      results?: Array<{
        lang?: string;
        translations?: Array<{ key?: string; translated?: string }>;
      }>;
    };

    if (!Array.isArray(parsed.results)) return null;

    const byLang: Record<string, Record<string, string>> = {};
    for (const langBlock of parsed.results) {
      const langCode = normalizeLang(langBlock.lang, targetLangs[0]);
      if (!targetLangs.includes(langCode) || !Array.isArray(langBlock.translations)) continue;
      const map: Record<string, string> = {};
      for (const entry of langBlock.translations) {
        if (entry.key && typeof entry.translated === 'string' && entry.translated.trim()) {
          map[entry.key] = entry.translated.trim();
        }
      }
      if (Object.keys(map).length === items.length) {
        byLang[langCode] = map;
      }
    }

    return targetLangs.every((l) => Boolean(byLang[l])) ? byLang : null;
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener('abort', onParentAbort);
  }
}

async function translateTextChunkWithGoogleGtx(
  text: string,
  sourceLang: string,
  targetLang: string,
  signal?: AbortSignal
): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
    sourceLang
  )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url, {
    signal: combineSignalWithTimeout(signal, 2400),
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  });

  if (!res.ok) {
    throw new Error(`Google GTX HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error('Google GTX returned HTML challenge');
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('Unexpected translation response shape');
  }

  const translated = (data[0] as Array<unknown>)
    .map((segment) => (Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : ''))
    .join('');

  if (!translated.trim()) {
    throw new Error('Empty translation result');
  }

  return translated;
}

function resolveEffectiveGtxSource(text: string, sourceLang: SupportedLang): string {
  const hasArabicChars = /[\u0600-\u06FF]/.test(text);
  return (sourceLang === 'en' && hasArabicChars) || (sourceLang === 'ar' && !hasArabicChars)
    ? 'auto'
    : sourceLang;
}

async function translateTextWithGoogleGtx(
  text: string,
  sourceLang: SupportedLang,
  targetLang: SupportedLang,
  signal?: AbortSignal
): Promise<string> {
  if (sourceLang === targetLang) return text;
  const effectiveSource = resolveEffectiveGtxSource(text, sourceLang);
  const chunks = splitTextIntoChunks(text, 900, 1600);
  const translatedChunks = await Promise.all(
    chunks.map((chunk) => translateTextChunkWithGoogleGtx(chunk, effectiveSource, targetLang, signal))
  );
  return translatedChunks.join('\n');
}

async function translateItemsWithGoogleGtx(
  items: TranslateItem[],
  sourceLang: SupportedLang,
  targetLang: SupportedLang,
  signal?: AbortSignal
): Promise<Record<string, string>> {
  if (items.length === 0) return {};

  const canBatch =
    items.length > 1 && items.every((item) => !item.text.includes('0x7F'));
  if (canBatch) {
    const combined = items.map((item) => item.text.trim()).join(BATCH_SEPARATOR);
    if (combined.length <= 900 && encodeURIComponent(combined).length <= 1600) {
      const effectiveSource = resolveEffectiveGtxSource(combined, sourceLang);
      const translatedBatch = await translateTextChunkWithGoogleGtx(
        combined,
        effectiveSource,
        targetLang,
        signal
      );
      const parts = translatedBatch.split(BATCH_SEPARATOR_REGEX).map((p) => p.trim());
      if (parts.length === items.length && parts.every((p) => p.length > 0)) {
        return Object.fromEntries(items.map((item, idx) => [item.key, parts[idx]]));
      }
    }
  }

  const entries = await Promise.all(
    items.map(async (item) => {
      const translated = await translateTextWithGoogleGtx(
        item.text.trim(),
        sourceLang,
        targetLang,
        signal
      );
      return [item.key, translated] as const;
    })
  );
  return Object.fromEntries(entries);
}

async function translateChunkWithMyMemory(
  text: string,
  sourceLang: SupportedLang,
  targetLang: SupportedLang,
  signal?: AbortSignal
): Promise<string> {
  const hasArabicChars = /[\u0600-\u06FF]/.test(text);
  const effectiveSource: SupportedLang =
    sourceLang === 'en' && hasArabicChars
      ? 'ar'
      : sourceLang === 'ar' && !hasArabicChars
      ? 'en'
      : sourceLang;

  if (effectiveSource === targetLang) {
    return text;
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${encodeURIComponent(`${effectiveSource}|${targetLang}`)}`;

  const res = await fetch(url, {
    signal: combineSignalWithTimeout(signal, 2800),
  });
  if (!res.ok) {
    throw new Error(`MyMemory HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number;
  };

  if (typeof data?.responseStatus === 'number' && data.responseStatus !== 200) {
    throw new Error(`MyMemory status ${data.responseStatus}`);
  }

  const translated = data?.responseData?.translatedText?.trim();
  if (
    !translated ||
    translated.toUpperCase().startsWith('MYMEMORY WARNING:') ||
    translated.toUpperCase().includes('PLEASE SELECT TWO DISTINCT LANGUAGES')
  ) {
    throw new Error('Invalid or rate-limited MyMemory response');
  }

  return translated;
}

async function translateTextWithMyMemory(
  text: string,
  sourceLang: SupportedLang,
  targetLang: SupportedLang,
  signal?: AbortSignal
): Promise<string> {
  if (sourceLang === targetLang) return text;
  const chunks = splitTextIntoChunks(text, 420, 1350);
  const translatedChunks = await Promise.all(
    chunks.map((chunk) => translateChunkWithMyMemory(chunk, sourceLang, targetLang, signal))
  );
  return translatedChunks.join('\n');
}

async function translateItemsWithMyMemory(
  items: TranslateItem[],
  sourceLang: SupportedLang,
  targetLang: SupportedLang,
  signal?: AbortSignal
): Promise<Record<string, string>> {
  if (items.length === 0) return {};

  const canBatch =
    items.length > 1 && items.every((item) => !item.text.includes('0x7F'));
  if (canBatch) {
    const combined = items.map((item) => item.text.trim()).join(BATCH_SEPARATOR);
    if (combined.length <= 420 && encodeURIComponent(combined).length <= 1350) {
      const translatedBatch = await translateChunkWithMyMemory(
        combined,
        sourceLang,
        targetLang,
        signal
      );
      const parts = translatedBatch.split(BATCH_SEPARATOR_REGEX).map((p) => p.trim());
      if (parts.length === items.length && parts.every((p) => p.length > 0)) {
        return Object.fromEntries(items.map((item, idx) => [item.key, parts[idx]]));
      }
    }
  }

  const entries = await Promise.all(
    items.map(async (item) => {
      const translated = await translateTextWithMyMemory(
        item.text.trim(),
        sourceLang,
        targetLang,
        signal
      );
      return [item.key, translated] as const;
    })
  );
  return Object.fromEntries(entries);
}

async function startServer() {
  await ensureDataDirs();
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Upload activity images to persistent disk storage
  app.post('/api/uploads', async (req, res) => {
    try {
      const body = (req.body ?? {}) as { dataUrl?: string; filename?: string };
      const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : '';
      const match = /^data:(image\/(?:png|jpeg|jpg|webp|gif|svg\+xml));base64,(.+)$/i.exec(dataUrl);
      if (!match) {
        res.status(400).json({ error: 'صيغة الصورة غير صالحة للرفع' });
        return;
      }

      const mime = match[1].toLowerCase();
      const base64 = match[2];
      const extMap: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/svg+xml': 'svg',
      };
      const ext = extMap[mime] || 'jpg';
      const safeStem = (typeof body.filename === 'string' ? body.filename : 'activity-img')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 32) || 'activity-img';
      const fileName = `${safeStem}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      await fs.writeFile(filePath, Buffer.from(base64, 'base64'));
      res.status(201).json({ url: `/uploads/${fileName}` });
    } catch (err) {
      console.error('Failed to store uploaded image:', err);
      res.status(500).json({ error: 'تعذر حفظ الصورة على الخادم' });
    }
  });

  // Get activities (optionally filtered per company owner)
  app.get('/api/activities', async (req, res) => {
    try {
      const ownerId = typeof req.query.ownerId === 'string' ? req.query.ownerId.trim() : '';
      const companyName = typeof req.query.companyName === 'string' ? req.query.companyName.trim() : '';
      const ownerName = typeof req.query.ownerName === 'string' ? req.query.ownerName.trim() : '';

      const all = await readActivitiesDb();
      const filtered =
        ownerId || companyName || ownerName
          ? all.filter((act) => matchesActivityOwner(act, ownerId, companyName, ownerName))
          : all;

      res.json({ activities: filtered });
    } catch (err) {
      console.error('GET /api/activities failed:', err);
      res.status(500).json({ error: 'تعذر استرجاع الأنشطة من قاعدة البيانات' });
    }
  });

  // Create or upsert activity in database
  app.post('/api/activities', async (req, res) => {
    try {
      const activity = (req.body?.activity ?? req.body) as StoredActivityRecord | undefined;
      if (!activity || typeof activity !== 'object' || !activity.id) {
        res.status(400).json({ error: 'بيانات النشاط غير مكتملة' });
        return;
      }

      const saved = await enqueueActivitiesDbMutation(async () => {
        const list = await readActivitiesDb();
        const nowIso = new Date().toISOString().split('T')[0];
        const record: StoredActivityRecord = {
          ...activity,
          updatedAt: nowIso,
          createdAt: activity.createdAt || nowIso,
        };
        const idx = list.findIndex((a) => a.id === record.id);
        const nextList =
          idx >= 0
            ? list.map((a, i) => (i === idx ? record : a))
            : [record, ...list];
        await writeActivitiesDb(nextList);
        await upsertActivityItineraryIntoWaypointsBank(record);
        return record;
      });

      res.status(200).json({ activity: saved });
    } catch (err) {
      console.error('POST /api/activities failed:', err);
      res.status(500).json({ error: 'تعذر حفظ النشاط في قاعدة البيانات' });
    }
  });

  app.put('/api/activities/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const activity = (req.body?.activity ?? req.body) as StoredActivityRecord | undefined;
      if (!activity || typeof activity !== 'object') {
        res.status(400).json({ error: 'بيانات النشاط غير صالحة' });
        return;
      }

      const saved = await enqueueActivitiesDbMutation(async () => {
        const list = await readActivitiesDb();
        const nowIso = new Date().toISOString().split('T')[0];
        const record: StoredActivityRecord = {
          ...activity,
          id,
          updatedAt: nowIso,
          createdAt: activity.createdAt || nowIso,
        };
        const idx = list.findIndex((a) => a.id === id);
        const nextList =
          idx >= 0
            ? list.map((a, i) => (i === idx ? record : a))
            : [record, ...list];
        await writeActivitiesDb(nextList);
        await upsertActivityItineraryIntoWaypointsBank(record);
        return record;
      });

      res.status(200).json({ activity: saved });
    } catch (err) {
      console.error('PUT /api/activities/:id failed:', err);
      res.status(500).json({ error: 'تعذر تحديث النشاط في قاعدة البيانات' });
    }
  });

  app.patch('/api/activities/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const updates = (req.body ?? {}) as Partial<StoredActivityRecord>;

      const updated = await enqueueActivitiesDbMutation(async () => {
        const list = await readActivitiesDb();
        const idx = list.findIndex((a) => a.id === id);
        if (idx < 0) return null;
        const nowIso = new Date().toISOString().split('T')[0];
        const nextRecord: StoredActivityRecord = {
          ...list[idx],
          ...updates,
          id,
          updatedAt: nowIso,
        };
        const nextList = list.map((a, i) => (i === idx ? nextRecord : a));
        await writeActivitiesDb(nextList);
        return nextRecord;
      });

      if (!updated) {
        res.status(404).json({ error: 'النشاط غير موجود في قاعدة البيانات' });
        return;
      }
      res.json({ activity: updated });
    } catch (err) {
      console.error('PATCH /api/activities/:id failed:', err);
      res.status(500).json({ error: 'تعذر تحديث النشاط' });
    }
  });

  app.delete('/api/activities', async (_req, res) => {
    try {
      await enqueueActivitiesDbMutation(async () => {
        await writeActivitiesDb([]);
      });
      res.json({ cleared: true });
    } catch (err) {
      console.error('DELETE /api/activities failed:', err);
      res.status(500).json({ error: 'تعذر تصفير سجل الأنشطة' });
    }
  });

  app.delete('/api/activities/:id', async (req, res) => {
    try {
      const id = req.params.id;
      await enqueueActivitiesDbMutation(async () => {
        const list = await readActivitiesDb();
        const nextList = list.filter((a) => a.id !== id);
        if (nextList.length !== list.length) {
          await writeActivitiesDb(nextList);
        }
      });
      res.json({ deletedId: id });
    } catch (err) {
      console.error('DELETE /api/activities/:id failed:', err);
      res.status(500).json({ error: 'تعذر حذف النشاط من قاعدة البيانات' });
    }
  });

  // Independent Trips Database API (/api/trips)
  app.get('/api/trips', async (req, res) => {
    try {
      const ownerId = typeof req.query.ownerId === 'string' ? req.query.ownerId.trim() : '';
      const companyName = typeof req.query.companyName === 'string' ? req.query.companyName.trim() : '';
      const ownerName = typeof req.query.ownerName === 'string' ? req.query.ownerName.trim() : '';
      const all = await readTripsDb();
      const filtered =
        ownerId || companyName || ownerName
          ? all.filter((trp) => matchesActivityOwner(trp, ownerId, companyName, ownerName))
          : all;
      res.json({ trips: filtered });
    } catch (err) {
      console.error('GET /api/trips failed:', err);
      res.status(500).json({ error: 'تعذر استرجاع الرحلات من قاعدة البيانات' });
    }
  });

  app.post('/api/trips', async (req, res) => {
    try {
      const trip = (req.body?.trip ?? req.body) as StoredActivityRecord | undefined;
      if (!trip || typeof trip !== 'object' || !trip.id) {
        res.status(400).json({ error: 'بيانات الرحلة غير مكتملة' });
        return;
      }

      const saved = await enqueueActivitiesDbMutation(async () => {
        const list = await readTripsDb();
        const nowIso = new Date().toISOString().split('T')[0];
        const record: StoredActivityRecord = {
          ...trip,
          updatedAt: nowIso,
          createdAt: trip.createdAt || nowIso,
        };
        const idx = list.findIndex((t) => t.id === record.id);
        const nextList =
          idx >= 0
            ? list.map((t, i) => (i === idx ? record : t))
            : [record, ...list];
        await writeTripsDb(nextList);
        await upsertActivityItineraryIntoWaypointsBank(record);
        return record;
      });

      res.status(200).json({ trip: saved });
    } catch (err) {
      console.error('POST /api/trips failed:', err);
      res.status(500).json({ error: 'تعذر حفظ الرحلة في قاعدة البيانات' });
    }
  });

  app.put('/api/trips/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const trip = (req.body?.trip ?? req.body) as StoredActivityRecord | undefined;
      if (!trip || typeof trip !== 'object') {
        res.status(400).json({ error: 'بيانات الرحلة غير صالحة' });
        return;
      }

      const saved = await enqueueActivitiesDbMutation(async () => {
        const list = await readTripsDb();
        const nowIso = new Date().toISOString().split('T')[0];
        const record: StoredActivityRecord = {
          ...trip,
          id,
          updatedAt: nowIso,
          createdAt: trip.createdAt || nowIso,
        };
        const idx = list.findIndex((t) => t.id === id);
        const nextList =
          idx >= 0
            ? list.map((t, i) => (i === idx ? record : t))
            : [record, ...list];
        await writeTripsDb(nextList);
        await upsertActivityItineraryIntoWaypointsBank(record);
        return record;
      });

      res.status(200).json({ trip: saved });
    } catch (err) {
      console.error('PUT /api/trips/:id failed:', err);
      res.status(500).json({ error: 'تعذر تحديث الرحلة في قاعدة البيانات' });
    }
  });

  app.patch('/api/trips/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const updates = (req.body ?? {}) as Partial<StoredActivityRecord>;

      const updated = await enqueueActivitiesDbMutation(async () => {
        const list = await readTripsDb();
        const idx = list.findIndex((t) => t.id === id);
        if (idx < 0) return null;
        const nowIso = new Date().toISOString().split('T')[0];
        const nextRecord: StoredActivityRecord = {
          ...list[idx],
          ...updates,
          id,
          updatedAt: nowIso,
        };
        const nextList = list.map((t, i) => (i === idx ? nextRecord : t));
        await writeTripsDb(nextList);
        return nextRecord;
      });

      if (!updated) {
        res.status(404).json({ error: 'الرحلة غير موجودة في قاعدة البيانات' });
        return;
      }
      res.json({ trip: updated });
    } catch (err) {
      console.error('PATCH /api/trips/:id failed:', err);
      res.status(500).json({ error: 'تعذر تحديث الرحلة' });
    }
  });

  app.delete('/api/trips', async (_req, res) => {
    try {
      await enqueueActivitiesDbMutation(async () => {
        await writeTripsDb([]);
      });
      res.json({ cleared: true });
    } catch (err) {
      console.error('DELETE /api/trips failed:', err);
      res.status(500).json({ error: 'تعذر تصفير سجل الرحلات' });
    }
  });

  app.delete('/api/trips/:id', async (req, res) => {
    try {
      const id = req.params.id;
      await enqueueActivitiesDbMutation(async () => {
        const list = await readTripsDb();
        const nextList = list.filter((t) => t.id !== id);
        if (nextList.length !== list.length) {
          await writeTripsDb(nextList);
        }
      });
      res.json({ deletedId: id });
    } catch (err) {
      console.error('DELETE /api/trips/:id failed:', err);
      res.status(500).json({ error: 'تعذر حذف الرحلة من قاعدة البيانات' });
    }
  });

  // Waypoints Bank API (latest 10 saved waypoints from database)
  app.get('/api/waypoints-bank', async (_req, res) => {
    try {
      const waypoints = await readWaypointsBankDb();
      res.json({ waypoints });
    } catch (err) {
      console.error('GET /api/waypoints-bank failed:', err);
      res.status(500).json({ error: 'تعذر استرجاع بنك المحطات من قاعدة البيانات' });
    }
  });

  app.post('/api/waypoints-bank', async (req, res) => {
    try {
      const rawMany = Array.isArray(req.body?.waypoints)
        ? (req.body.waypoints as StoredWaypointBankRecord[])
        : req.body?.waypoint
        ? [req.body.waypoint as StoredWaypointBankRecord]
        : [];
      const baseTime = Date.now();
      const incoming = rawMany
        .filter((w) => w && typeof w.name === 'string' && w.name.trim())
        .map((w, idx) => ({
          ...w,
          savedAt: typeof w.savedAt === 'number' ? w.savedAt : baseTime + idx,
        }));

      const latest10 = await enqueueActivitiesDbMutation(async () => {
        const existing = await readWaypointsBankDb();
        return writeWaypointsBankDb([...existing, ...incoming]);
      });

      res.json({ waypoints: latest10 });
    } catch (err) {
      console.error('POST /api/waypoints-bank failed:', err);
      res.status(500).json({ error: 'تعذر حفظ المحطة في بنك المحطات' });
    }
  });

  // Central Pricing Tool settings API (Platform Service Fee & Central Tax)
  app.get('/api/pricing-settings', async (_req, res) => {
    try {
      await ensureDataDirs();
      const raw = await fs.readFile(PRICING_SETTINGS_DB_FILE, 'utf8');
      res.json({ settings: JSON.parse(raw) });
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
        res.json({ settings: null });
        return;
      }
      console.error('GET /api/pricing-settings failed:', err);
      res.status(500).json({ error: 'تعذر استرجاع إعدادات التسعير' });
    }
  });

  app.put('/api/pricing-settings', async (req, res) => {
    try {
      const incoming = req.body?.settings ?? req.body;
      if (!incoming || typeof incoming !== 'object') {
        res.status(400).json({ error: 'بيانات إعدادات التسعير غير صالحة' });
        return;
      }
      const saved = await enqueueActivitiesDbMutation(async () => {
        await ensureDataDirs();
        const payload = {
          ...incoming,
          updatedAt: new Date().toISOString(),
        };
        const tmpFile = `${PRICING_SETTINGS_DB_FILE}.${crypto.randomUUID()}.tmp`;
        await fs.writeFile(tmpFile, JSON.stringify(payload, null, 2), 'utf8');
        await fs.rename(tmpFile, PRICING_SETTINGS_DB_FILE);
        return payload;
      });
      res.json({ settings: saved });
    } catch (err) {
      console.error('PUT /api/pricing-settings failed:', err);
      res.status(500).json({ error: 'تعذر حفظ إعدادات التسعير' });
    }
  });

  app.post('/api/translate', async (req, res) => {
    try {
      const body = (req.body ?? {}) as TranslateRequestBody;
      const rawItems = Array.isArray(body.items) ? body.items : [];
      const items = rawItems.filter(
        (item): item is TranslateItem =>
          Boolean(item) &&
          typeof item.key === 'string' &&
          typeof item.text === 'string' &&
          item.text.trim().length > 0
      );

      if (items.length === 0) {
        res.status(400).json({ error: 'لا توجد نصوص صالحة للترجمة' });
        return;
      }

      const sourceLang = normalizeLang(body.sourceLang, 'ar');
      const requestedTargets =
        Array.isArray(body.targetLangs) && body.targetLangs.length > 0
          ? Array.from(new Set(body.targetLangs.map((l) => normalizeLang(l, 'en'))))
          : [normalizeLang(body.targetLang, sourceLang === 'en' ? 'ar' : 'en')];

      const isBatchMode = Array.isArray(body.targetLangs) && body.targetLangs.length > 0;
      const distinctTargets = requestedTargets.filter((l) => l !== sourceLang);

      const buildResponse = (
        translationsByLang: Record<string, Record<string, string>>,
        provider: string
      ) => {
        for (const lang of requestedTargets) {
          if (lang === sourceLang && !translationsByLang[lang]) {
            const passthrough: Record<string, string> = {};
            for (const item of items) {
              passthrough[item.key] = item.text.trim();
            }
            translationsByLang[lang] = passthrough;
          }
        }
        if (isBatchMode) {
          res.json({ translationsByLang, provider });
        } else {
          res.json({ translations: translationsByLang[requestedTargets[0]], provider });
        }
      };

      if (distinctTargets.length === 0) {
        buildResponse({}, 'passthrough');
        return;
      }

      // 0. Check in-memory cache first for instant (<5ms) responses
      const cachedByLang: Record<string, Record<string, string>> = {};
      const uncachedByLang: Record<string, TranslateItem[]> = {};
      let allCached = true;
      for (const targetLang of distinctTargets) {
        cachedByLang[targetLang] = {};
        uncachedByLang[targetLang] = [];
        for (const item of items) {
          const hit = getCachedTranslation(sourceLang, targetLang, item.text.trim());
          if (hit !== undefined) {
            cachedByLang[targetLang][item.key] = hit;
          } else {
            allCached = false;
            uncachedByLang[targetLang].push(item);
          }
        }
      }

      if (allCached) {
        buildResponse(cachedByLang, 'cache');
        return;
      }

      const saveAllToCache = (byLang: Record<string, Record<string, string>>) => {
        for (const targetLang of distinctTargets) {
          const map = byLang[targetLang];
          if (!map) continue;
          for (const item of items) {
            const val = map[item.key];
            if (val) setCachedTranslation(sourceLang, targetLang, item.text.trim(), val);
          }
        }
      };

      const mergeWithCached = (
        freshByLang: Record<string, Record<string, string>>
      ): Record<string, Record<string, string>> => {
        const merged: Record<string, Record<string, string>> = {};
        for (const targetLang of distinctTargets) {
          merged[targetLang] = {
            ...cachedByLang[targetLang],
            ...(freshByLang[targetLang] || {}),
          };
        }
        return merged;
      };

      // 1. Hedged parallel race across providers:
      //    - Google GTX starts immediately (batched single-call when compact).
      //    - Gemini (gemini-4-hydrogen, ThinkingLevel.LOW) starts immediately in parallel if configured.
      //    - MyMemory (parallelized chunks + batching) triggers immediately if GTX fails OR after a 650ms hedge delay.
      const raceController = new AbortController();
      let settled = false;
      let triggerMyMemoryEarly: (() => void) | null = null;
      const myMemoryGate = new Promise<void>((resolve) => {
        triggerMyMemoryEarly = resolve;
        const timer = setTimeout(resolve, 650);
        raceController.signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            resolve();
          },
          { once: true }
        );
      });

      const runGtx = async (): Promise<{
        provider: string;
        byLang: Record<string, Record<string, string>>;
      }> => {
        try {
          const entries = await Promise.all(
            distinctTargets.map(async (targetLang) => {
              const missing = uncachedByLang[targetLang];
              if (missing.length === 0) return [targetLang, {}] as const;
              const map = await translateItemsWithGoogleGtx(
                missing,
                sourceLang,
                targetLang,
                raceController.signal
              );
              return [targetLang, map] as const;
            })
          );
          return { provider: 'gtx', byLang: mergeWithCached(Object.fromEntries(entries)) };
        } catch (err) {
          triggerMyMemoryEarly?.();
          throw err;
        }
      };

      const runMyMemory = async (): Promise<{
        provider: string;
        byLang: Record<string, Record<string, string>>;
      }> => {
        await myMemoryGate;
        if (settled || raceController.signal.aborted) {
          throw new Error('Aborted before MyMemory start');
        }
        const entries = await Promise.all(
          distinctTargets.map(async (targetLang) => {
            const missing = uncachedByLang[targetLang];
            if (missing.length === 0) return [targetLang, {}] as const;
            const map = await translateItemsWithMyMemory(
              missing,
              sourceLang,
              targetLang,
              raceController.signal
            );
            return [targetLang, map] as const;
          })
        );
        return { provider: 'mymemory', byLang: mergeWithCached(Object.fromEntries(entries)) };
      };

      const racers: Array<
        Promise<{ provider: string; byLang: Record<string, Record<string, string>> }>
      > = [runGtx(), runMyMemory()];

      if (getGeminiClient()) {
        racers.push(
          (async () => {
            const geminiByLang = await translateBatchWithGemini(
              items,
              sourceLang,
              distinctTargets,
              4500,
              raceController.signal
            );
            if (!geminiByLang) {
              throw new Error('Gemini returned empty response');
            }
            return { provider: 'gemini', byLang: mergeWithCached(geminiByLang) };
          })()
        );
      }

      try {
        const winner = await Promise.any(racers);
        settled = true;
        raceController.abort();
        saveAllToCache(winner.byLang);
        buildResponse(winner.byLang, winner.provider);
        return;
      } catch (err) {
        raceController.abort();
        console.error('All translation providers failed:', err);
      }

      res.status(502).json({
        error: 'تعذر الاتصال بخدمة الترجمة الفورية حالياً، يرجى المحاولة مرة أخرى.',
      });
    } catch (err) {
      console.error('Unexpected /api/translate error:', err);
      res.status(500).json({ error: 'حدث خطأ داخلي أثناء الترجمة.' });
    }
  });

  // --------------------------------------------------------------------------
  // Authentication & Role-Based Session API (/api/auth/*)
  // --------------------------------------------------------------------------
  app.get('/api/auth/status', async (_req, res) => {
    try {
      const envPasscodeConfigured = Boolean(process.env.AUTH_ADMIN_PASSCODE?.trim());
      const users = await readAuthUsersDb();
      const claimedAdmin = users.some((u) => u.roleKey === 'platform_admin' && u.passwordHash);
      res.json({
        adminConfigured: envPasscodeConfigured || claimedAdmin,
        envPasscodeConfigured,
        claimedAdmin,
        accounts: users.map(sanitizeAuthUser)
      });
    } catch (err) {
      console.error('GET /api/auth/status failed:', err);
      res.status(500).json({ error: 'تعذر فحص حالة المصادقة' });
    }
  });

  app.post('/api/auth/bootstrap-admin', async (req, res) => {
    try {
      const envPasscode = process.env.AUTH_ADMIN_PASSCODE?.trim();
      const body = (req.body ?? {}) as {
        name?: string;
        email?: string;
        phone?: string;
        companyName?: string;
        password?: string;
      };
      const password = typeof body.password === 'string' ? body.password : '';
      if (password.length < 6) {
        res.status(400).json({ error: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' });
        return;
      }

      const result = await enqueueActivitiesDbMutation(async () => {
        const users = await readAuthUsersDb();
        const alreadyClaimed = users.some((u) => u.roleKey === 'platform_admin' && u.passwordHash);
        if (envPasscode || alreadyClaimed) {
          return { conflict: true as const };
        }
        const name = (typeof body.name === 'string' && body.name.trim()) || 'أحمد الشناوي';
        const email =
          (typeof body.email === 'string' && body.email.trim().toLowerCase()) ||
          'admin@zanoza.com';
        const phone = (typeof body.phone === 'string' && body.phone.trim()) || '+201099234812';
        const companyName =
          (typeof body.companyName === 'string' && body.companyName.trim()) ||
          'إدارة منصة زانوزا';
        const initials = name.slice(0, 2);

        const adminUser: StoredAuthUser = {
          id: 'user-ahmed',
          name,
          email,
          companyName,
          phone,
          role: 'صاحب الموقع ومزوّد خدمة رئيسي',
          roleKey: 'platform_admin',
          tier: 'إدارة المنصة · الباقة الذهبية',
          avatarColor: 'bg-cyan-600',
          initials,
          avatarInitials: initials,
          passwordHash: hashPasswordScrypt(password),
          createdAt: new Date().toISOString()
        };

        const filtered = users.filter((u) => u.id !== adminUser.id);
        await writeAuthUsersDb([adminUser, ...filtered]);
        return { conflict: false as const, adminUser };
      });

      if (result.conflict) {
        res.status(409).json({ error: 'تم إعداد حساب المسؤول بالفعل' });
        return;
      }

      const token = signAuthToken({
        uid: result.adminUser.id,
        roleKey: result.adminUser.roleKey,
        name: result.adminUser.name,
        email: result.adminUser.email,
        companyName: result.adminUser.companyName,
        phone: result.adminUser.phone,
        exp: Date.now() + 1000 * 60 * 60 * 24
      });

      res.status(201).json({
        token,
        user: sanitizeAuthUser(result.adminUser)
      });
    } catch (err) {
      console.error('POST /api/auth/bootstrap-admin failed:', err);
      res.status(500).json({ error: 'تعذر إعداد حساب المسؤول' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const body = (req.body ?? {}) as {
        name?: string;
        email?: string;
        phone?: string;
        companyName?: string;
        password?: string;
        roleKey?: ServerUserRoleKey;
        nationality?: string;
        customerScope?: 'platform' | 'company';
        registeredCompanyId?: string;
        registeredCompanyName?: string;
        registrationSource?: 'platform_signup' | 'company_page' | 'booking_clerk';
      };
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const companyName =
        (typeof body.companyName === 'string' && body.companyName.trim()) || name;
      const password = typeof body.password === 'string' ? body.password : '';
      const requestedRole = body.roleKey;
      const nationality = typeof body.nationality === 'string' ? body.nationality.trim() : '';
      const customerScope =
        body.customerScope === 'company' ? ('company' as const) : ('platform' as const);
      const registeredCompanyId =
        typeof body.registeredCompanyId === 'string' ? body.registeredCompanyId.trim() : '';
      const registeredCompanyName =
        typeof body.registeredCompanyName === 'string' ? body.registeredCompanyName.trim() : '';
      const registrationSource =
        body.registrationSource === 'company_page' ||
        body.registrationSource === 'booking_clerk'
          ? body.registrationSource
          : ('platform_signup' as const);

      if (!name || !phone || password.length < 6) {
        res.status(400).json({ error: 'يرجى إدخال الاسم ورقم الهاتف وكلمة مرور (6 أحرف على الأقل)' });
        return;
      }

      const allowedSelfRoles: ServerUserRoleKey[] = [
        'subscriber_owner',
        'driver',
        'equipment_owner',
        'customer'
      ];
      let assignedRole: ServerUserRoleKey = allowedSelfRoles.includes(
        requestedRole as ServerUserRoleKey
      )
        ? (requestedRole as ServerUserRoleKey)
        : 'subscriber_owner';

      if (requestedRole === 'platform_admin') {
        const callerToken = verifyAuthToken(extractBearerToken(req));
        if (!callerToken || callerToken.roleKey !== 'platform_admin') {
          assignedRole = 'subscriber_owner';
        } else {
          assignedRole = 'platform_admin';
        }
      }

      if (assignedRole === 'customer' && !nationality) {
        res.status(400).json({ error: 'يرجى تحديد الجنسية عند تسجيل حساب العميل لأول مرة' });
        return;
      }
      if (assignedRole === 'customer' && customerScope === 'company' && !registeredCompanyId && !registeredCompanyName) {
        res.status(400).json({ error: 'يرجى تحديد الشركة التابع لها حساب العميل' });
        return;
      }

      const roleDisplayMap: Record<ServerUserRoleKey, string> = {
        platform_admin: 'صاحب الموقع / مدير المنصة',
        subscriber_owner: 'مشترك / صاحب نشاط',
        driver: 'سائق / مندوب توصيل',
        equipment_owner: 'صاحب معدة',
        customer: 'عميل / سائح'
      };

      const colorMap: Record<ServerUserRoleKey, string> = {
        platform_admin: 'bg-cyan-600',
        subscriber_owner: 'bg-amber-600',
        driver: 'bg-indigo-600',
        equipment_owner: 'bg-emerald-600',
        customer: 'bg-slate-600'
      };

      const created = await enqueueActivitiesDbMutation(async () => {
        const users = await readAuthUsersDb();
        const normPhone = normalizePhoneServer(phone);
        const dup = users.find(
          (u) =>
            (email && u.email.toLowerCase() === email) ||
            (normPhone && normalizePhoneServer(u.phone) === normPhone)
        );
        if (dup) return { duplicate: true as const };

        const initials = name.slice(0, 2);
        const newUser: StoredAuthUser = {
          id: `usr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          name,
          email: email || `${normPhone || Date.now()}@zanoza.local`,
          companyName:
            assignedRole === 'customer' && customerScope === 'company'
              ? registeredCompanyName || companyName
              : companyName,
          phone,
          role: roleDisplayMap[assignedRole],
          roleKey: assignedRole,
          tier: assignedRole === 'customer' ? 'عضو عملاء' : 'حساب موثّق',
          avatarColor: colorMap[assignedRole],
          initials,
          avatarInitials: initials,
          ...(assignedRole === 'customer'
            ? {
                nationality,
                customerScope,
                registeredCompanyId: customerScope === 'company' ? registeredCompanyId || undefined : undefined,
                registeredCompanyName: customerScope === 'company' ? registeredCompanyName || undefined : undefined,
                registrationSource: customerScope === 'company' ? registrationSource : 'platform_signup'
              }
            : {}),
          passwordHash: hashPasswordScrypt(password),
          createdAt: new Date().toISOString()
        };

        await writeAuthUsersDb([...users, newUser]);
        return { duplicate: false as const, newUser };
      });

      if (created.duplicate) {
        res.status(409).json({ error: 'يوجد حساب مسجل مسبقاً بنفس البريد الإلكتروني أو رقم الهاتف' });
        return;
      }

      const token = signAuthToken({
        uid: created.newUser.id,
        roleKey: created.newUser.roleKey,
        name: created.newUser.name,
        email: created.newUser.email,
        companyName: created.newUser.companyName,
        phone: created.newUser.phone,
        exp: Date.now() + 1000 * 60 * 60 * 24
      });

      res.status(201).json({
        token,
        user: sanitizeAuthUser(created.newUser)
      });
    } catch (err) {
      console.error('POST /api/auth/register failed:', err);
      res.status(500).json({ error: 'تعذر إنشاء الحساب' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const body = (req.body ?? {}) as { identifier?: string; password?: string };
      const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!identifier || !password) {
        res.status(400).json({ error: 'يرجى إدخال البريد أو الهاتف وكلمة المرور' });
        return;
      }

      const envPasscode = process.env.AUTH_ADMIN_PASSCODE?.trim();
      const users = await readAuthUsersDb();
      const normId = identifier.toLowerCase();
      const normPhone = normalizePhoneServer(identifier);

      if (
        envPasscode &&
        (normId === 'admin' || normId === 'ahmed.shennawy@zanoza.com' || normPhone === '201099234812') &&
        safeTimingEqualStrings(password, envPasscode)
      ) {
        const adminUser = users.find((u) => u.roleKey === 'platform_admin') || {
          id: 'user-ahmed',
          name: 'أحمد الشناوي',
          email: 'ahmed.shennawy@zanoza.com',
          companyName: 'الشناوي مارين لليخوت والرحلات البحرية',
          phone: '+201099234812',
          role: 'صاحب الموقع ومزوّد خدمة رئيسي',
          roleKey: 'platform_admin' as const,
          tier: 'إدارة المنصة · الباقة الذهبية',
          avatarColor: 'bg-cyan-600',
          initials: 'أش',
          avatarInitials: 'أش',
          passwordHash: '',
          createdAt: ''
        };
        const token = signAuthToken({
          uid: adminUser.id,
          roleKey: 'platform_admin',
          name: adminUser.name,
          email: adminUser.email,
          companyName: adminUser.companyName,
          phone: adminUser.phone,
          exp: Date.now() + 1000 * 60 * 60 * 24
        });
        res.json({ token, user: sanitizeAuthUser(adminUser) });
        return;
      }

      const found = users.find(
        (u) =>
          u.email.toLowerCase() === normId ||
          (normPhone && normalizePhoneServer(u.phone) === normPhone)
      );

      if (!found || !verifyPasswordScrypt(password, found.passwordHash)) {
        res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
        return;
      }

      const token = signAuthToken({
        uid: found.id,
        roleKey: found.roleKey,
        name: found.name,
        email: found.email,
        companyName: found.companyName,
        phone: found.phone,
        exp: Date.now() + 1000 * 60 * 60 * 24
      });

      res.json({ token, user: sanitizeAuthUser(found) });
    } catch (err) {
      console.error('POST /api/auth/login failed:', err);
      res.status(500).json({ error: 'تعذر تسجيل الدخول' });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    const payload = verifyAuthToken(extractBearerToken(req));
    if (!payload) {
      res.status(401).json({ error: 'الجلسة غير صالحة أو منتهية' });
      return;
    }
    res.json({ user: payload });
  });

  // --------------------------------------------------------------------------
  // Unified Server Domain Store API (/api/store/:domain)
  // --------------------------------------------------------------------------
  app.get('/api/store/:domain', async (req, res) => {
    const domain = req.params.domain;
    if (!ALLOWED_STORE_DOMAINS.has(domain)) {
      res.status(400).json({ error: 'نطاق بيانات غير صالح' });
      return;
    }
    try {
      const data = await readDomainStore(domain, null);
      res.json({ domain, data });
    } catch (err) {
      console.error(`GET /api/store/${domain} failed:`, err);
      res.status(500).json({ error: 'تعذر قراءة البيانات من الخادم' });
    }
  });

  app.put('/api/store/:domain', async (req, res) => {
    const domain = req.params.domain;
    if (!ALLOWED_STORE_DOMAINS.has(domain)) {
      res.status(400).json({ error: 'نطاق بيانات غير صالح' });
      return;
    }
    try {
      // If admin credential is explicitly enforced via env var, require valid non-customer Bearer token
      const envPasscode = process.env.AUTH_ADMIN_PASSCODE?.trim();
      if (envPasscode) {
        const caller = verifyAuthToken(extractBearerToken(req));
        if (!caller || caller.roleKey === 'customer') {
          res.status(401).json({ error: 'مطلوب تسجيل الدخول بصلاحية تشغيلية لتعديل هذا النطاق' });
          return;
        }
      }

      const incoming = req.body?.data;
      if (incoming === undefined) {
        res.status(400).json({ error: 'الحقل data مطلوب' });
        return;
      }

      await enqueueActivitiesDbMutation(async () => {
        await writeDomainStore(domain, incoming);
      });
      res.json({ domain, saved: true });
    } catch (err) {
      console.error(`PUT /api/store/${domain} failed:`, err);
      res.status(500).json({ error: 'تعذر حفظ البيانات على الخادم' });
    }
  });

  // --------------------------------------------------------------------------
  // Public Customer Storefront, Direct Bookings, Tracking & Reviews (/api/public/*)
  // --------------------------------------------------------------------------
  app.get('/api/public/catalog', async (req, res) => {
    try {
      const [activities, trips, reviews, pricingRaw] = await Promise.all([
        readActivitiesDb(),
        readTripsDb(),
        readDomainStore<Array<Record<string, unknown>>>('reviews', []),
        fs.readFile(PRICING_SETTINGS_DB_FILE, 'utf8').catch(() => 'null')
      ]);

      const customerScope = req.query.customerScope === 'company' ? 'company' : 'platform';
      const companyId = typeof req.query.companyId === 'string' ? req.query.companyId.trim() : '';
      const companyName = typeof req.query.companyName === 'string' ? req.query.companyName.trim() : '';
      const registrationSource =
        req.query.registrationSource === 'booking_clerk' ? 'booking_clerk' : 'company_page';

      const filterByScopeAndChannel = (item: StoredActivityRecord) => {
        if (!item || (item.status && item.status !== 'published')) return false;
        const ch = item.channels as
          | {
              ownerStorefront?: boolean;
              tourismMarketplace?: boolean;
              mobileApp?: boolean;
              b2cCustomers?: boolean;
            }
          | undefined;
        if (customerScope === 'company') {
          const matchesOwner =
            (companyId && item.owner?.id === companyId) ||
            (companyName && (item.owner?.companyName || '').trim() === companyName);
          if (!matchesOwner) return false;
          if (!ch) return true;
          if (registrationSource === 'booking_clerk') {
            return Boolean(ch.ownerStorefront || ch.b2cCustomers || ch.tourismMarketplace || ch.mobileApp);
          }
          return Boolean(ch.ownerStorefront || ch.b2cCustomers);
        }
        if (!ch) return true;
        return Boolean(ch.tourismMarketplace || ch.mobileApp || ch.b2cCustomers);
      };

      const publishedActivities = activities.filter(filterByScopeAndChannel);
      const publishedTrips = trips.filter(filterByScopeAndChannel);

      res.json({
        activities: publishedActivities,
        trips: publishedTrips,
        reviews: Array.isArray(reviews) ? reviews : [],
        pricingSettings: JSON.parse(pricingRaw)
      });
    } catch (err) {
      console.error('GET /api/public/catalog failed:', err);
      res.status(500).json({ error: 'تعذر تحميل واجهة المتجر للعملاء' });
    }
  });

  app.post('/api/public/promo/validate', async (req, res) => {
    try {
      const body = (req.body ?? {}) as {
        code?: string;
        tripDate?: string;
        audience?: string;
        payingGuests?: number;
      };
      const dateIso =
        typeof body.tripDate === 'string' && body.tripDate.trim()
          ? body.tripDate.trim()
          : new Date().toISOString().split('T')[0];
      const audience = body.audience === 'foreigner' ? 'foreigner' : 'egyptian';
      const payingGuests = Math.max(1, Math.round(Number(body.payingGuests) || 1));

      const result = validatePromoCodeForBooking({
        code: body.code,
        dateIso,
        audience,
        payingGuests
      });

      if (!result.valid || !result.promo) {
        res.status(400).json({
          valid: false,
          error: result.errorAr || 'كود الخصم غير صالح'
        });
        return;
      }

      res.json({
        valid: true,
        promo: result.promo
      });
    } catch (err) {
      console.error('POST /api/public/promo/validate failed:', err);
      res.status(500).json({ valid: false, error: 'تعذر التحقق من كود الخصم' });
    }
  });

  app.post('/api/public/bookings', async (req, res) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
      const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';
      const customerNationality =
        typeof body.customerNationality === 'string' ? body.customerNationality.trim() : '';
      const targetTitle = typeof body.activityName === 'string' ? body.activityName.trim() : '';
      const activityId = typeof body.activityId === 'string' ? body.activityId.trim() : '';
      const tripDate = typeof body.tripDate === 'string' ? body.tripDate.trim() : '';
      const slotLabel =
        typeof body.slotLabel === 'string' && body.slotLabel.trim()
          ? body.slotLabel.trim()
          : '09:00 ص';
      const requestedEntityKind = body.entityKind === 'trip' ? 'trip' : 'activity';
      const bookingMode =
        body.bookingMode === 'private_group' ? 'private_group' : 'per_person';
      const promoCode = typeof body.promoCode === 'string' ? body.promoCode.trim() : '';
      const adultsCount = Math.max(0, Math.round(Number(body.adultsCount) || 0));
      const childrenCount = Math.max(0, Math.round(Number(body.childrenCount) || 0));
      const infantsCount = Math.max(0, Math.round(Number(body.infantsCount) || 0));

      if (!customerName || !customerPhone || !targetTitle || !activityId) {
        res.status(400).json({ error: 'يرجى استكمال اسم العميل ورقم الهاتف وتفاصيل النشاط' });
        return;
      }
      if (adultsCount + childrenCount < 1) {
        res.status(400).json({ error: 'يجب أن يشمل الحجز فرداً واحداً على الأقل' });
        return;
      }
      const todayIso = new Date().toISOString().split('T')[0];
      if (!tripDate || tripDate < todayIso) {
        res.status(400).json({ error: 'لا يمكن حجز موعد بتاريخ سابق لليوم' });
        return;
      }

      const paymentMethod =
        body.paymentMethod === 'online_card' ||
        body.paymentMethod === 'cash_on_pickup' ||
        body.paymentMethod === 'deposit'
          ? body.paymentMethod
          : 'cash_on_pickup';

      let cardLast4: string | undefined;
      if (paymentMethod === 'online_card') {
        const cardHolder =
          typeof body.cardHolder === 'string' ? body.cardHolder.trim() : customerName;
        const rawLast4 = typeof body.cardLast4 === 'string' ? body.cardLast4.replace(/[^\d]/g, '') : '';
        if (!cardHolder || rawLast4.length !== 4) {
          res.status(400).json({
            error: 'يرجى استكمال بيانات البطاقة الإلكترونية (الاسم وآخر 4 أرقام وتاريخ الانتهاء) لإتمام الدفع.'
          });
          return;
        }
        cardLast4 = rawLast4;
      }

      const resolvedCustomerType = customerNationality
        ? isEgyptianNationalityServer(customerNationality)
          ? 'egyptian'
          : 'foreigner'
        : body.customerType === 'foreigner'
          ? 'foreigner'
          : 'egyptian';

      const result = await enqueueActivitiesDbMutation(async () => {
        const [allActs, allTrips, actBookings, trpBookings, maintBlocks, pricingRaw] =
          await Promise.all([
            readActivitiesDb(),
            readTripsDb(),
            readDomainStore<Array<Record<string, unknown>>>('bookings_activities', []),
            readDomainStore<Array<Record<string, unknown>>>('bookings_trips', []),
            readDomainStore<ResourceMaintenanceBlock[]>('maintenance_blocks', []),
            fs.readFile(PRICING_SETTINGS_DB_FILE, 'utf8').catch(() => 'null')
          ]);

        const catalogItem = (
          requestedEntityKind === 'trip'
            ? allTrips.find((t) => t.id === activityId) || allActs.find((a) => a.id === activityId)
            : allActs.find((a) => a.id === activityId) || allTrips.find((t) => t.id === activityId)
        ) as unknown as Activity | undefined;

        const safeActList = Array.isArray(actBookings) ? actBookings : [];
        const safeTripList = Array.isArray(trpBookings) ? trpBookings : [];
        const safeBlocks = Array.isArray(maintBlocks) ? maintBlocks : [];

        // Validate operating days, maintenance blocks, and combined capacity when catalog item is found
        if (catalogItem) {
          const slotObj =
            catalogItem.slots?.find((s) => s.timeLabel === slotLabel) || catalogItem.slots?.[0];
          if (slotObj && !isSlotOperatingOnDate(slotObj, tripDate)) {
            return {
              status: 400 as const,
              error: `هذا الموعد لا يعمل يوم ${tripDate}. يرجى اختيار يوم تشغيل متاح.`
            };
          }

          const eqSet = new Set(catalogItem.equipmentIds || []);
          const blocked = safeBlocks.find(
            (blk) =>
              eqSet.has(blk.resourceId) && tripDate >= blk.startDate && tripDate <= blk.endDate
          );
          if (blocked) {
            return {
              status: 400 as const,
              error: `المعدة «${blocked.resourceName}» في صيانة مجدولة بتاريخ ${tripDate}. يرجى اختيار يوم آخر.`
            };
          }

          const maxCap = Math.max(1, slotObj?.maxCapacity || slotObj?.availableCount || 14);
          const bookedActSeats = safeActList
            .filter(
              (b) =>
                String(b.activityId || '') === catalogItem.id &&
                String(b.tripDate || '') === tripDate &&
                String(b.slotLabel || '') === (slotObj?.timeLabel || slotLabel) &&
                b.status !== 'rejected' &&
                b.status !== 'auto_cancelled'
            )
            .reduce((s, b) => s + Number(b.adultsCount || 0) + Number(b.childrenCount || 0), 0);

          const bookedTripSeats = safeTripList
            .filter(
              (tb) =>
                (String(tb.activityId || '') === catalogItem.id ||
                  String(tb.tripTitle || '') === catalogItem.name) &&
                String(tb.departureDate || '') === tripDate &&
                String(tb.departureTime || '') === (slotObj?.timeLabel || slotLabel) &&
                tb.status !== 'cancelled'
            )
            .reduce((s, tb) => s + Number(tb.adultsCount || 0) + Number(tb.childrenCount || 0), 0);

          const remaining = Math.max(0, maxCap - (bookedActSeats + bookedTripSeats));
          const reqSeats = adultsCount + childrenCount;
          if (reqSeats > remaining) {
            return {
              status: 400 as const,
              error: `العدد المطلوب (${reqSeats}) يتجاوز المقاعد المتبقية (${remaining}) لهذا الموعد.`
            };
          }
        }

        const pricingSettings = JSON.parse(pricingRaw) as PlatformFeeTaxConfig | null;
        const incomingAddons = Array.isArray(body.selectedPaidAddons)
          ? (body.selectedPaidAddons as SelectedPaidAddonItem[])
          : [];

        const authoritativeBreakdown = catalogItem
          ? computeAuthoritativeBookingBreakdown({
              item: catalogItem,
              audience: resolvedCustomerType,
              tripDate,
              adultsCount,
              childrenCount,
              infantsCount,
              bookingMode,
              promoCode,
              selectedAddons: incomingAddons,
              paymentMethod,
              platformSettings: pricingSettings
            })
          : null;

        const finalTotalEGP = authoritativeBreakdown
          ? authoritativeBreakdown.currency === 'EGP'
            ? authoritativeBreakdown.total
            : 0
          : Math.max(0, Number(body.totalPriceEGP) || 0);
        const finalTotalEUR = authoritativeBreakdown
          ? authoritativeBreakdown.currency === 'EUR'
            ? authoritativeBreakdown.total
            : 0
          : Math.max(0, Number(body.totalPriceEUR) || 0);

        const depositEGP = authoritativeBreakdown
          ? authoritativeBreakdown.currency === 'EGP'
            ? authoritativeBreakdown.depositAmount
            : 0
          : paymentMethod === 'deposit'
            ? Math.round(finalTotalEGP * 0.3)
            : paymentMethod === 'online_card'
              ? finalTotalEGP
              : 0;
        const depositEUR = authoritativeBreakdown
          ? authoritativeBreakdown.currency === 'EUR'
            ? authoritativeBreakdown.depositAmount
            : 0
          : paymentMethod === 'deposit'
            ? Number((finalTotalEUR * 0.3).toFixed(2))
            : paymentMethod === 'online_card'
              ? finalTotalEUR
              : 0;

        const remainingEGP = Math.max(0, finalTotalEGP - depositEGP);
        const remainingEUR = Math.max(0, Number((finalTotalEUR - depositEUR).toFixed(2)));
        const promoDiscountEGP =
          authoritativeBreakdown && authoritativeBreakdown.currency === 'EGP'
            ? authoritativeBreakdown.promoSaved
            : 0;
        const promoDiscountEUR =
          authoritativeBreakdown && authoritativeBreakdown.currency === 'EUR'
            ? authoritativeBreakdown.promoSaved
            : 0;

        const paymentStatus =
          paymentMethod === 'online_card'
            ? 'paid'
            : paymentMethod === 'deposit'
              ? 'deposit'
              : 'pending';

        if (requestedEntityKind === 'trip') {
          const tripBookingCode = `TR-${Math.floor(1000 + Math.random() * 8999)}`;
          const newTripBooking = {
            id: `pub-trp-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
            bookingCode: tripBookingCode,
            activityId,
            tripTitle: catalogItem?.name || targetTitle,
            tripType:
              authoritativeBreakdown?.bookingMode === 'private_group'
                ? 'private_charter'
                : 'group_trip',
            linkedActivities: [catalogItem?.name || targetTitle],
            departureDate: tripDate,
            departureTime: slotLabel,
            customerName,
            customerPhone,
            customerType: resolvedCustomerType,
            adultsCount,
            childrenCount,
            infantsCount,
            totalPriceEGP: finalTotalEGP,
            totalPriceEUR: finalTotalEUR,
            selectedPaidAddons: incomingAddons.length > 0 ? incomingAddons : undefined,
            paymentMethod,
            paymentStatus,
            bookingMode: authoritativeBreakdown?.bookingMode || bookingMode,
            promoCode: authoritativeBreakdown?.appliedPromo?.code,
            promoDiscountEGP,
            promoDiscountEUR,
            depositAmountEGP: depositEGP,
            depositAmountEUR: depositEUR,
            remainingAmountEGP: remainingEGP,
            remainingAmountEUR: remainingEUR,
            cardLast4,
            transportInfo:
              typeof body.pickupLocation === 'string' && body.pickupLocation.trim()
                ? body.pickupLocation.trim()
                : 'حضور ذاتي لموقع التجمع',
            status: 'pending_approval',
            notes: typeof body.notes === 'string' ? body.notes.trim() : undefined,
            createdAt: 'الآن (حجز مباشر من المتجر)'
          };
          await writeDomainStore('bookings_trips', [newTripBooking, ...safeTripList]);
          return {
            status: 201 as const,
            entityKind: 'trip' as const,
            tripBooking: newTripBooking
          };
        }

        const newBooking = {
          id: `pub-req-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          bookingCode: `ZN-${Math.floor(10000 + Math.random() * 89999)}`,
          activityId,
          activityName: catalogItem?.name || targetTitle,
          slotLabel,
          tripDate,
          customerName,
          customerPhone,
          customerType: resolvedCustomerType,
          ...(customerNationality ? { customerNationality } : {}),
          customerScope: body.customerScope === 'company' ? 'company' : 'platform',
          registeredCompanyId:
            typeof body.registeredCompanyId === 'string' ? body.registeredCompanyId : undefined,
          registeredCompanyName:
            typeof body.registeredCompanyName === 'string' ? body.registeredCompanyName : undefined,
          adultsCount,
          childrenCount,
          infantsCount,
          totalPriceEGP: finalTotalEGP,
          totalPriceEUR: finalTotalEUR,
          selectedPaidAddons: incomingAddons.length > 0 ? incomingAddons : undefined,
          requiresPickup: Boolean(body.requiresPickup),
          pickupLocation:
            typeof body.pickupLocation === 'string' && body.pickupLocation.trim()
              ? body.pickupLocation.trim()
              : 'حضور ذاتي لموقع النشاط',
          deadlineMinutesRemaining: ((catalogItem?.approvalDeadlineHours || 4) * 60),
          status: 'pending_approval',
          paymentMethod,
          paymentStatus,
          bookingMode: authoritativeBreakdown?.bookingMode || bookingMode,
          promoCode: authoritativeBreakdown?.appliedPromo?.code,
          promoDiscountEGP,
          promoDiscountEUR,
          depositAmountEGP: depositEGP,
          depositAmountEUR: depositEUR,
          remainingAmountEGP: remainingEGP,
          remainingAmountEUR: remainingEUR,
          cardLast4,
          entityKind: 'activity',
          createdAt: 'الآن (حجز مباشر من المتجر)'
        };
        await writeDomainStore('bookings_activities', [newBooking, ...safeActList]);
        return {
          status: 201 as const,
          entityKind: 'activity' as const,
          booking: newBooking
        };
      });

      if ('error' in result) {
        res.status(result.status).json({ error: result.error });
        return;
      }

      if (result.entityKind === 'trip') {
        res.status(201).json({
          entityKind: 'trip',
          tripBooking: result.tripBooking,
          booking: result.tripBooking
        });
        return;
      }

      res.status(201).json({ entityKind: 'activity', booking: result.booking });
    } catch (err) {
      console.error('POST /api/public/bookings failed:', err);
      res.status(500).json({ error: 'تعذر تسجيل الحجز' });
    }
  });

  app.get('/api/public/my-bookings', async (req, res) => {
    try {
      const phone = typeof req.query.phone === 'string' ? normalizePhoneServer(req.query.phone) : '';
      const code = typeof req.query.code === 'string' ? req.query.code.trim().toLowerCase() : '';
      if (!phone || !code || phone.length < 7) {
        res.status(400).json({ error: 'لحماية الخصوصية، يرجى إدخال رقم الهاتف وكود الحجز معاً' });
        return;
      }

      const [actBookings, tripBookings, inTripReqs] = await Promise.all([
        readDomainStore<Array<Record<string, unknown>>>('bookings_activities', []),
        readDomainStore<Array<Record<string, unknown>>>('bookings_trips', []),
        readDomainStore<Array<Record<string, unknown>>>('in_trip_requests', [])
      ]);

      const matchesRecord = (r: Record<string, unknown>) => {
        const rPhone = normalizePhoneServer(String(r.customerPhone || ''));
        const rCode = String(r.bookingCode || '').trim().toLowerCase();
        const phoneMatch = Boolean(rPhone && rPhone === phone);
        const codeMatch = Boolean(rCode && rCode === code);
        return phoneMatch && codeMatch;
      };

      res.json({
        activityBookings: (Array.isArray(actBookings) ? actBookings : []).filter(matchesRecord),
        tripBookings: (Array.isArray(tripBookings) ? tripBookings : []).filter(matchesRecord),
        inTripRequests: (Array.isArray(inTripReqs) ? inTripReqs : []).filter((r) => {
          const rPhone = normalizePhoneServer(String(r.customerPhone || ''));
          const rCode = String(r.linkedBookingCode || '').trim().toLowerCase();
          return rPhone === phone && rCode === code;
        })
      });
    } catch (err) {
      console.error('GET /api/public/my-bookings failed:', err);
      res.status(500).json({ error: 'تعذر البحث عن الحجوزات' });
    }
  });

  function restoreExperienceSlotsAndStatsServer(
    items: StoredActivityRecord[],
    targetMatch: { id?: string; name?: string },
    slotLabel: string,
    totalPax: number,
    totalPriceEGP: number,
    totalPriceEUR: number
  ): { nextItems: StoredActivityRecord[]; changed: boolean } {
    let changed = false;
    const nextItems = items.map((item) => {
      const matches =
        (targetMatch.id && item.id === targetMatch.id) ||
        (targetMatch.name && item.name === targetMatch.name);
      if (!matches) return item;
      changed = true;
      const rawSlots = Array.isArray(item.slots) ? (item.slots as Array<Record<string, unknown>>) : [];
      const nextSlots = rawSlots.map((slot) => {
        if (String(slot.timeLabel || '') !== slotLabel) return slot;
        const maxCap = Number(slot.maxCapacity || 0);
        const oldBooked = Number(slot.bookedCount || 0);
        const newBooked = Math.max(0, oldBooked - Math.max(0, totalPax));
        return {
          ...slot,
          bookedCount: newBooked,
          availableCount: Math.min(maxCap, Math.max(0, maxCap - newBooked))
        };
      });
      const oldStats =
        item.stats && typeof item.stats === 'object'
          ? (item.stats as Record<string, unknown>)
          : {};
      const nextStats = {
        ...oldStats,
        bookingsCount: Math.max(0, Number(oldStats.bookingsCount || 0) - 1),
        revenueEGP: Math.max(0, Number(oldStats.revenueEGP || 0) - Math.max(0, totalPriceEGP)),
        revenueEUR: Math.max(
          0,
          Number((Number(oldStats.revenueEUR || 0) - Math.max(0, totalPriceEUR)).toFixed(2))
        )
      };
      return {
        ...item,
        slots: nextSlots,
        stats: nextStats
      };
    });
    return { nextItems, changed };
  }

  app.post('/api/public/bookings/:id/cancel', async (req, res) => {
    try {
      const targetId = req.params.id;
      const body = (req.body ?? {}) as { customerPhone?: string; bookingCode?: string; reason?: string };
      const phone = normalizePhoneServer(String(body.customerPhone || ''));
      const code = String(body.bookingCode || '').trim().toLowerCase();

      type CancelActResult =
        | { kind: 'error'; status: 400; error: string }
        | { kind: 'ok'; booking: Record<string, unknown> | null };

      const result: CancelActResult = await enqueueActivitiesDbMutation(async () => {
        const [list, allActs] = await Promise.all([
          readDomainStore<Array<Record<string, unknown>>>('bookings_activities', []),
          readActivitiesDb()
        ]);
        const safeList = Array.isArray(list) ? list : [];
        let found: Record<string, unknown> | null = null;
        let blockedError: string | null = null;
        let shouldRestoreSlot = false;
        let restoreActivityId = '';
        let restoreActivityName = '';
        let restoreSlotLabel = '';
        let restorePax = 0;
        let restoreEgp = 0;
        let restoreEur = 0;

        const next = safeList.slice();
        for (let i = 0; i < next.length; i++) {
          const r = next[i];
          if (String(r.id) !== targetId) continue;
          const rPhone = normalizePhoneServer(String(r.customerPhone || ''));
          const rCode = String(r.bookingCode || '').trim().toLowerCase();
          const authorized =
            phone && code ? rPhone === phone && rCode === code : (phone && rPhone === phone) || (code && rCode === code);
          if (!authorized) continue;

          const prevStatus = String(r.status || '');
          if (prevStatus === 'completed') {
            blockedError = 'لا يمكن إلغاء حجز مكتمل وتم تنفيذه بالفعل';
            break;
          }
          if (prevStatus === 'auto_cancelled' || prevStatus === 'rejected') {
            found = r;
            break;
          }

          if (prevStatus === 'approved') {
            shouldRestoreSlot = true;
            restoreActivityId = String(r.activityId || '');
            restoreActivityName = String(r.activityName || '');
            restoreSlotLabel = String(r.slotLabel || '');
            restorePax =
              Number(r.adultsCount || 0) +
              Number(r.childrenCount || 0) +
              Number(r.infantsCount || 0);
            restoreEgp = Number(r.totalPriceEGP || 0);
            restoreEur = Number(r.totalPriceEUR || 0);
          }

          const act = allActs.find((a) => a.id === String(r.activityId || '')) as unknown as
            | Activity
            | undefined;
          const paidEGP =
            r.paymentStatus === 'paid'
              ? Number(r.totalPriceEGP || 0)
              : r.paymentStatus === 'deposit'
                ? Number(r.depositAmountEGP || Math.round(Number(r.totalPriceEGP || 0) * 0.3))
                : 0;
          const paidEUR =
            r.paymentStatus === 'paid'
              ? Number(r.totalPriceEUR || 0)
              : r.paymentStatus === 'deposit'
                ? Number(r.depositAmountEUR || Number((Number(r.totalPriceEUR || 0) * 0.3).toFixed(2)))
                : 0;

          const refundEval = evaluateCancellationRefund({
            policy: act?.cancellationPolicy,
            tripDate: String(r.tripDate || ''),
            slotLabel: String(r.slotLabel || ''),
            paidAmountEGP: paidEGP,
            paidAmountEUR: paidEUR
          });

          const hasPaid = paidEGP > 0 || paidEUR > 0;
          found = {
            ...r,
            status: 'auto_cancelled',
            rejectionReason: body.reason?.trim() || 'تم الإلغاء بناءً على طلب العميل',
            refundStatus: !hasPaid
              ? 'none'
              : refundEval.tier === 'full'
                ? 'full_refund_pending'
                : refundEval.tier === 'partial'
                  ? 'partial_refund_pending'
                  : 'none',
            refundAmountEGP: refundEval.refundAmountEGP,
            refundAmountEUR: refundEval.refundAmountEUR,
            cancellationPolicySummary: refundEval.summaryAr
          };
          next[i] = found;
          break;
        }

        if (blockedError) {
          return { kind: 'error', status: 400, error: blockedError };
        }
        if (found) {
          await writeDomainStore('bookings_activities', next);
          if (shouldRestoreSlot) {
            const restored = restoreExperienceSlotsAndStatsServer(
              allActs,
              { id: restoreActivityId, name: restoreActivityName },
              restoreSlotLabel,
              restorePax,
              restoreEgp,
              restoreEur
            );
            if (restored.changed) {
              await writeActivitiesDb(restored.nextItems);
            }
          }
        }
        return { kind: 'ok', booking: found };
      });

      if (result.kind === 'error') {
        res.status(result.status).json({ error: result.error });
        return;
      }
      if (!result.booking) {
        res.status(404).json({ error: 'تعذر التحقق من ملكية الحجز أو العثور عليه' });
        return;
      }
      res.json({ booking: result.booking });
    } catch (err) {
      console.error('POST /api/public/bookings/:id/cancel failed:', err);
      res.status(500).json({ error: 'تعذر إلغاء الحجز' });
    }
  });

  app.post('/api/public/trip-bookings/:id/cancel', async (req, res) => {
    try {
      const targetId = req.params.id;
      const body = (req.body ?? {}) as { customerPhone?: string; bookingCode?: string; reason?: string };
      const phone = normalizePhoneServer(String(body.customerPhone || ''));
      const code = String(body.bookingCode || '').trim().toLowerCase();

      type CancelTripResult =
        | { kind: 'error'; status: 400; error: string }
        | { kind: 'ok'; tripBooking: Record<string, unknown> | null };

      const result: CancelTripResult = await enqueueActivitiesDbMutation(async () => {
        const [list, allTrips] = await Promise.all([
          readDomainStore<Array<Record<string, unknown>>>('bookings_trips', []),
          readTripsDb()
        ]);
        const safeList = Array.isArray(list) ? list : [];
        let found: Record<string, unknown> | null = null;
        let blockedError: string | null = null;
        let shouldRestoreSlot = false;
        let restoreActivityId = '';
        let restoreTripTitle = '';
        let restoreSlotLabel = '';
        let restorePax = 0;
        let restoreEgp = 0;
        let restoreEur = 0;

        const next = safeList.slice();
        for (let i = 0; i < next.length; i++) {
          const r = next[i];
          if (String(r.id) !== targetId) continue;
          const rPhone = normalizePhoneServer(String(r.customerPhone || ''));
          const rCode = String(r.bookingCode || '').trim().toLowerCase();
          const authorized =
            phone && code ? rPhone === phone && rCode === code : (phone && rPhone === phone) || (code && rCode === code);
          if (!authorized) continue;

          const prevStatus = String(r.status || '');
          if (prevStatus === 'completed') {
            blockedError = 'لا يمكن إلغاء حجز رحلة مكتمل وتم تنفيذه بالفعل';
            break;
          }
          if (prevStatus === 'cancelled') {
            found = r;
            break;
          }

          if (prevStatus === 'confirmed') {
            shouldRestoreSlot = true;
            restoreActivityId = String(r.activityId || '');
            restoreTripTitle = String(r.tripTitle || '');
            restoreSlotLabel = String(r.departureTime || '');
            restorePax =
              Number(r.adultsCount || 0) +
              Number(r.childrenCount || 0) +
              Number(r.infantsCount || 0);
            restoreEgp = Number(r.totalPriceEGP || 0);
            restoreEur = Number(r.totalPriceEUR || 0);
          }

          const trp = allTrips.find(
            (t) => t.id === String(r.activityId || '') || t.name === String(r.tripTitle || '')
          ) as unknown as Activity | undefined;
          const paidEGP =
            r.paymentStatus === 'paid'
              ? Number(r.totalPriceEGP || 0)
              : r.paymentStatus === 'deposit'
                ? Number(r.depositAmountEGP || Math.round(Number(r.totalPriceEGP || 0) * 0.3))
                : 0;
          const paidEUR =
            r.paymentStatus === 'paid'
              ? Number(r.totalPriceEUR || 0)
              : r.paymentStatus === 'deposit'
                ? Number(r.depositAmountEUR || Number((Number(r.totalPriceEUR || 0) * 0.3).toFixed(2)))
                : 0;

          const refundEval = evaluateCancellationRefund({
            policy: trp?.cancellationPolicy,
            tripDate: String(r.departureDate || ''),
            slotLabel: String(r.departureTime || ''),
            paidAmountEGP: paidEGP,
            paidAmountEUR: paidEUR
          });

          const hasPaid = paidEGP > 0 || paidEUR > 0;
          found = {
            ...r,
            status: 'cancelled',
            rejectionReason: body.reason?.trim() || 'تم الإلغاء بناءً على طلب العميل',
            refundStatus: !hasPaid
              ? 'none'
              : refundEval.tier === 'full'
                ? 'full_refund_pending'
                : refundEval.tier === 'partial'
                  ? 'partial_refund_pending'
                  : 'none',
            refundAmountEGP: refundEval.refundAmountEGP,
            refundAmountEUR: refundEval.refundAmountEUR,
            cancellationPolicySummary: refundEval.summaryAr
          };
          next[i] = found;
          break;
        }

        if (blockedError) {
          return { kind: 'error', status: 400, error: blockedError };
        }
        if (found) {
          await writeDomainStore('bookings_trips', next);
          if (shouldRestoreSlot) {
            const restored = restoreExperienceSlotsAndStatsServer(
              allTrips,
              { id: restoreActivityId, name: restoreTripTitle },
              restoreSlotLabel,
              restorePax,
              restoreEgp,
              restoreEur
            );
            if (restored.changed) {
              await writeTripsDb(restored.nextItems);
            }
          }
        }
        return { kind: 'ok', tripBooking: found };
      });

      if (result.kind === 'error') {
        res.status(result.status).json({ error: result.error });
        return;
      }
      if (!result.tripBooking) {
        res.status(404).json({ error: 'تعذر التحقق من ملكية حجز الرحلة أو العثور عليه' });
        return;
      }
      res.json({ tripBooking: result.tripBooking });
    } catch (err) {
      console.error('POST /api/public/trip-bookings/:id/cancel failed:', err);
      res.status(500).json({ error: 'تعذر إلغاء حجز الرحلة' });
    }
  });

  app.patch('/api/public/bookings/:id/reschedule', async (req, res) => {
    try {
      const targetId = req.params.id;
      const body = (req.body ?? {}) as {
        customerPhone?: string;
        bookingCode?: string;
        tripDate?: string;
        slotLabel?: string;
      };
      const phone = normalizePhoneServer(String(body.customerPhone || ''));
      const code = String(body.bookingCode || '').trim().toLowerCase();
      const nextDate = String(body.tripDate || '').trim();
      const nextSlot = String(body.slotLabel || '').trim();
      const todayIso = new Date().toISOString().split('T')[0];

      if (!nextDate || nextDate < todayIso) {
        res.status(400).json({ error: 'يرجى اختيار تاريخ سارٍ لتعديل الموعد' });
        return;
      }

      const result = await enqueueActivitiesDbMutation(async () => {
        const [list, allActs, maintBlocks] = await Promise.all([
          readDomainStore<Array<Record<string, unknown>>>('bookings_activities', []),
          readActivitiesDb(),
          readDomainStore<ResourceMaintenanceBlock[]>('maintenance_blocks', [])
        ]);
        const safeList = Array.isArray(list) ? list : [];
        const safeBlocks = Array.isArray(maintBlocks) ? maintBlocks : [];
        const existing = safeList.find((r) => String(r.id) === targetId);
        if (!existing) return { status: 404 as const, error: 'تعذر العثور على الحجز' };

        const rPhone = normalizePhoneServer(String(existing.customerPhone || ''));
        const rCode = String(existing.bookingCode || '').trim().toLowerCase();
        const authorized =
          phone && code ? rPhone === phone && rCode === code : (phone && rPhone === phone) || (code && rCode === code);
        if (!authorized) {
          return { status: 403 as const, error: 'تعذر التحقق من ملكية الحجز' };
        }

        const chosenSlotLabel = nextSlot || String(existing.slotLabel || '09:00 ص');
        const act = allActs.find((a) => a.id === String(existing.activityId || '')) as unknown as
          | Activity
          | undefined;
        if (act) {
          const slotObj = act.slots?.find((s) => s.timeLabel === chosenSlotLabel) || act.slots?.[0];
          if (slotObj && !isSlotOperatingOnDate(slotObj, nextDate)) {
            return {
              status: 400 as const,
              error: `النشاط غير متاح في يوم ${nextDate}. يرجى اختيار يوم تشغيل متاح.`
            };
          }
          const eqSet = new Set(act.equipmentIds || []);
          const blocked = safeBlocks.find(
            (blk) => eqSet.has(blk.resourceId) && nextDate >= blk.startDate && nextDate <= blk.endDate
          );
          if (blocked) {
            return {
              status: 400 as const,
              error: `المعدة «${blocked.resourceName}» في صيانة بتاريخ ${nextDate}. يرجى اختيار تاريخ آخر.`
            };
          }
          const maxCap = Math.max(1, slotObj?.maxCapacity || slotObj?.availableCount || 14);
          const otherSeats = safeList
            .filter(
              (b) =>
                String(b.id) !== targetId &&
                String(b.activityId || '') === act.id &&
                String(b.tripDate || '') === nextDate &&
                String(b.slotLabel || '') === (slotObj?.timeLabel || chosenSlotLabel) &&
                b.status !== 'rejected' &&
                b.status !== 'auto_cancelled'
            )
            .reduce((s, b) => s + Number(b.adultsCount || 0) + Number(b.childrenCount || 0), 0);
          const reqSeats = Number(existing.adultsCount || 0) + Number(existing.childrenCount || 0);
          if (otherSeats + reqSeats > maxCap) {
            return {
              status: 400 as const,
              error: `لا توجد مقاعد كافية في الموعد الجديد (${nextDate} · ${chosenSlotLabel}).`
            };
          }
        }

        const updatedRecord = {
          ...existing,
          tripDate: nextDate,
          slotLabel: chosenSlotLabel,
          status: 'pending_approval'
        };
        const nextList = safeList.map((r) => (String(r.id) === targetId ? updatedRecord : r));
        await writeDomainStore('bookings_activities', nextList);
        return { status: 200 as const, booking: updatedRecord };
      });

      if ('error' in result) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.json({ booking: result.booking });
    } catch (err) {
      console.error('PATCH /api/public/bookings/:id/reschedule failed:', err);
      res.status(500).json({ error: 'تعذر تعديل موعد الحجز' });
    }
  });

  app.patch('/api/public/trip-bookings/:id/reschedule', async (req, res) => {
    try {
      const targetId = req.params.id;
      const body = (req.body ?? {}) as {
        customerPhone?: string;
        bookingCode?: string;
        departureDate?: string;
        departureTime?: string;
      };
      const phone = normalizePhoneServer(String(body.customerPhone || ''));
      const code = String(body.bookingCode || '').trim().toLowerCase();
      const nextDate = String(body.departureDate || '').trim();
      const nextTime = String(body.departureTime || '').trim();
      const todayIso = new Date().toISOString().split('T')[0];

      if (!nextDate || nextDate < todayIso) {
        res.status(400).json({ error: 'يرجى اختيار تاريخ سارٍ لتعديل موعد الرحلة' });
        return;
      }

      const result = await enqueueActivitiesDbMutation(async () => {
        const [list, allTrips, maintBlocks] = await Promise.all([
          readDomainStore<Array<Record<string, unknown>>>('bookings_trips', []),
          readTripsDb(),
          readDomainStore<ResourceMaintenanceBlock[]>('maintenance_blocks', [])
        ]);
        const safeList = Array.isArray(list) ? list : [];
        const safeBlocks = Array.isArray(maintBlocks) ? maintBlocks : [];
        const existing = safeList.find((r) => String(r.id) === targetId);
        if (!existing) return { status: 404 as const, error: 'تعذر العثور على حجز الرحلة' };

        const rPhone = normalizePhoneServer(String(existing.customerPhone || ''));
        const rCode = String(existing.bookingCode || '').trim().toLowerCase();
        const authorized =
          phone && code ? rPhone === phone && rCode === code : (phone && rPhone === phone) || (code && rCode === code);
        if (!authorized) {
          return { status: 403 as const, error: 'تعذر التحقق من ملكية حجز الرحلة' };
        }

        const chosenTime = nextTime || String(existing.departureTime || '09:00 ص');
        const trp = allTrips.find(
          (t) => t.id === String(existing.activityId || '') || t.name === String(existing.tripTitle || '')
        ) as unknown as Activity | undefined;
        if (trp) {
          const slotObj = trp.slots?.find((s) => s.timeLabel === chosenTime) || trp.slots?.[0];
          if (slotObj && !isSlotOperatingOnDate(slotObj, nextDate)) {
            return {
              status: 400 as const,
              error: `الرحلة غير متاحة يوم ${nextDate}. يرجى اختيار يوم تشغيل متاح.`
            };
          }
          const eqSet = new Set(trp.equipmentIds || []);
          const blocked = safeBlocks.find(
            (blk) => eqSet.has(blk.resourceId) && nextDate >= blk.startDate && nextDate <= blk.endDate
          );
          if (blocked) {
            return {
              status: 400 as const,
              error: `المعدة «${blocked.resourceName}» في صيانة بتاريخ ${nextDate}.`
            };
          }
        }

        const updatedRecord = {
          ...existing,
          departureDate: nextDate,
          departureTime: chosenTime,
          status: 'pending_approval'
        };
        const nextList = safeList.map((r) => (String(r.id) === targetId ? updatedRecord : r));
        await writeDomainStore('bookings_trips', nextList);
        return { status: 200 as const, tripBooking: updatedRecord };
      });

      if ('error' in result) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.json({ tripBooking: result.tripBooking });
    } catch (err) {
      console.error('PATCH /api/public/trip-bookings/:id/reschedule failed:', err);
      res.status(500).json({ error: 'تعذر تعديل موعد حجز الرحلة' });
    }
  });

  app.post('/api/public/reviews', async (req, res) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const targetKind = body.targetKind === 'trip' ? 'trip' : 'activity';
      const targetId = typeof body.targetId === 'string' ? body.targetId.trim() : '';
      const targetTitle = typeof body.targetTitle === 'string' ? body.targetTitle.trim() : '';
      const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
      const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';
      const verifiedBookingCode =
        typeof body.verifiedBookingCode === 'string' ? body.verifiedBookingCode.trim() : '';
      const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
      const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5)));

      if (!targetId || !customerName || !comment || !verifiedBookingCode) {
        res.status(400).json({
          error: 'يرجى اختيار حجز مكتمل وإدخال الاسم والتقييم والتعليق'
        });
        return;
      }

      const normPhone = (val?: unknown) =>
        typeof val === 'string' ? val.replace(/[^\d]/g, '').trim() : '';
      const reqPhoneNorm = normPhone(customerPhone);
      const reqCodeNorm = verifiedBookingCode.toLowerCase();

      const result = await enqueueActivitiesDbMutation(async () => {
        const [actBookings, trpBookings, missions, list] = await Promise.all([
          readDomainStore<Array<Record<string, unknown>>>('bookings_activities', []),
          readDomainStore<Array<Record<string, unknown>>>('bookings_trips', []),
          readDomainStore<Array<Record<string, unknown>>>('driver_missions', []),
          readDomainStore<Array<Record<string, unknown>>>('reviews', [])
        ]);

        const safeList = Array.isArray(list) ? list : [];
        const duplicate = safeList.some(
          (r) =>
            typeof r.verifiedBookingCode === 'string' &&
            r.verifiedBookingCode.trim().toLowerCase() === reqCodeNorm
        );
        if (duplicate) {
          return { status: 409 as const, error: 'تم إرسال تقييم موثق لهذا الحجز مسبقاً' };
        }

        const completedMissionIds = new Set(
          (Array.isArray(missions) ? missions : [])
            .filter((m) => m.status === 'completed' && typeof m.bookingId === 'string')
            .map((m) => String(m.bookingId))
        );

        const seedCompletedFallback: Array<Record<string, unknown>> = [
          {
            id: 'req-104',
            bookingCode: 'ZN-84815',
            activityId: 'act-safari-02',
            customerPhone: '+201277889900',
            status: 'completed'
          },
          {
            id: 'trp-bk-204',
            bookingCode: 'TR-5107',
            tripTitle: 'رحلة جماعية منظمة - سنوركلينج شعاب الفانوس والدلافين',
            customerPhone: '+20 111 320 4490',
            status: 'completed'
          }
        ];

        const allAct = [...(Array.isArray(actBookings) ? actBookings : []), seedCompletedFallback[0]];
        const allTrip = [...(Array.isArray(trpBookings) ? trpBookings : []), seedCompletedFallback[1]];

        const matchedAct = allAct.find(
          (b) =>
            typeof b.bookingCode === 'string' &&
            b.bookingCode.trim().toLowerCase() === reqCodeNorm
        );
        const matchedTrip = allTrip.find(
          (tb) =>
            typeof tb.bookingCode === 'string' &&
            tb.bookingCode.trim().toLowerCase() === reqCodeNorm
        );

        const matched = matchedAct || matchedTrip;
        if (!matched) {
          return {
            status: 403 as const,
            error: 'لا يمكن إرسال التقييم قبل استكمال النشاط أو الرحلة وتأكيد تأديتها.'
          };
        }

        const matchedPhoneNorm = normPhone(matched.customerPhone);
        if (reqPhoneNorm && matchedPhoneNorm && reqPhoneNorm !== matchedPhoneNorm) {
          return {
            status: 403 as const,
            error: 'رقم الهاتف لا يطابق الحجز المسجّل.'
          };
        }

        const isCompleted =
          matched.status === 'completed' ||
          (typeof matched.id === 'string' && completedMissionIds.has(matched.id));

        if (!isCompleted) {
          return {
            status: 403 as const,
            error: 'لا يمكن تقييم النشاط أو الرحلة قبل استكمالها وتأكيد تأديتها.'
          };
        }

        const newReview = {
          id: `rev-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          targetKind,
          targetId,
          targetTitle,
          customerName,
          customerPhone: customerPhone || undefined,
          rating,
          comment,
          verifiedBookingCode,
          createdAt: new Date().toISOString().split('T')[0]
        };
        await writeDomainStore('reviews', [newReview, ...safeList]);
        return { status: 201 as const, review: newReview };
      });

      if ('error' in result) {
        res.status(result.status).json({ error: result.error });
        return;
      }

      res.status(201).json({ review: result.review });
    } catch (err) {
      console.error('POST /api/public/reviews failed:', err);
      res.status(500).json({ error: 'تعذر حفظ التقييم' });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
