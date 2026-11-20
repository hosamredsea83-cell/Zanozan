import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import process from 'node:process';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

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
const ACTIVITIES_DB_FILE = path.join(DATA_DIR, 'activities.json');
const WAYPOINTS_BANK_DB_FILE = path.join(DATA_DIR, 'waypoints_bank.json');
const PRICING_SETTINGS_DB_FILE = path.join(DATA_DIR, 'pricing_settings.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

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
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
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
