import { randomUUID } from 'crypto';
import { execute, getPool, query } from './mysql/connection';
import type { CollectionName, Settings } from './types';

const locks = new Map<string, Promise<void>>();
const collectionMemory = new Map<CollectionName, unknown[]>();
const LOGS_PERSIST_DEBOUNCE_MS = 300;
let logsPersistTimer: ReturnType<typeof setTimeout> | null = null;
let logsPersistInFlight: Promise<void> | null = null;
let logsIdIndex: Map<string, unknown> | null = null;
let logsSessionIndex: Map<string, unknown> | null = null;
let dbInitialized = false;

type LogIndexRow = {
  _id: string;
  visitorSessionId?: string;
  updatedAt?: string;
  createdAt?: string;
};

function rebuildLogIndexes(items: unknown[]): void {
  const logs = items as LogIndexRow[];
  logsIdIndex = new Map(logs.map((item) => [item._id, item]));
  logsSessionIndex = new Map();

  for (const log of logs) {
    if (!log.visitorSessionId) continue;
    const existing = logsSessionIndex.get(log.visitorSessionId) as LogIndexRow | undefined;
    const logTs = new Date(log.updatedAt || log.createdAt || 0).getTime();
    const existingTs = existing
      ? new Date(existing.updatedAt || existing.createdAt || 0).getTime()
      : 0;
    if (!existing || logTs >= existingTs) {
      logsSessionIndex.set(log.visitorSessionId, log);
    }
  }
}

function setMemoryCache<T>(name: CollectionName, items: T[]): void {
  collectionMemory.set(name, items);
  if (name === 'logs') {
    rebuildLogIndexes(items);
  }
}

function getMemoryCache<T>(name: CollectionName): T[] | null {
  const cached = collectionMemory.get(name);
  return cached ? (cached as T[]) : null;
}

export function peekCollection<T>(name: CollectionName): T[] | null {
  return getMemoryCache<T>(name);
}

export function peekLogById(id: string): unknown | null {
  if (!logsIdIndex) return null;
  return logsIdIndex.get(id) ?? null;
}

export function peekLogBySessionId(sessionId: string): unknown | null {
  if (!logsSessionIndex) return null;
  return logsSessionIndex.get(sessionId) ?? null;
}

async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  locks.set(key, prev.then(() => next));
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

export function generateId(): string {
  return randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS documents (
  collection_name VARCHAR(32) NOT NULL,
  doc_id CHAR(36) NOT NULL,
  payload JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (collection_name, doc_id),
  KEY idx_collection_updated (collection_name, updated_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  id TINYINT NOT NULL PRIMARY KEY,
  payload JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function runSchema(): Promise<void> {
  const statements = SCHEMA_SQL.split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await execute(statement);
  }
}

async function seedDefaultSettings(): Promise<void> {
  const rows = await query<{ cnt: number }[]>(
    'SELECT COUNT(*) AS cnt FROM app_settings WHERE id = 1'
  );
  if (Number(rows[0]?.cnt) > 0) return;

  const settings: Settings = {
    _id: generateId(),
    businessName: 'A101',
    siteActive: true,
    storeMode: 'a101',
    mobileOnly: false,
    blockDebitCards: false,
    adminSoundEnabled: true,
    adminSoundVolume: 80,
    createdAt: now(),
    updatedAt: now(),
  };
  await execute('INSERT INTO app_settings (id, payload) VALUES (1, ?)', [
    JSON.stringify(settings),
  ]);
}

export async function initDb(): Promise<void> {
  if (dbInitialized) return;
  await runSchema();
  await seedDefaultSettings();

  const logs = await loadCollectionFromDb<unknown>('logs');
  setMemoryCache('logs', logs);
  dbInitialized = true;
}

interface DocRow {
  payload: string | Record<string, unknown>;
}

function parsePayload<T>(raw: string | Record<string, unknown>): T {
  if (typeof raw === 'string') return JSON.parse(raw) as T;
  return raw as T;
}

async function loadCollectionFromDb<T>(name: CollectionName): Promise<T[]> {
  const rows = await query<DocRow[]>(
    `SELECT payload FROM documents WHERE collection_name = ? ORDER BY updated_at DESC`,
    [name]
  );
  return rows.map((row) => parsePayload<T>(row.payload));
}

async function persistCollectionToDb<T extends { _id: string; createdAt?: string; updatedAt?: string }>(
  name: CollectionName,
  items: T[]
): Promise<void> {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM documents WHERE collection_name = ?', [name]);

    for (const item of items) {
      const createdAt = item.createdAt || now();
      const updatedAt = item.updatedAt || createdAt;
      await conn.execute(
        `INSERT INTO documents (collection_name, doc_id, payload, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [name, item._id, JSON.stringify(item), toMysqlDate(createdAt), toMysqlDate(updatedAt)]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

function toMysqlDate(iso: string): string {
  return iso.replace('T', ' ').replace('Z', '').slice(0, 23);
}

async function persistLogsToDb(): Promise<void> {
  const items = getMemoryCache<{ _id: string; createdAt?: string; updatedAt?: string }>('logs');
  if (!items) return;
  await persistCollectionToDb('logs', items);
}

function scheduleLogsPersist(): void {
  if (logsPersistTimer) clearTimeout(logsPersistTimer);
  logsPersistTimer = setTimeout(() => {
    logsPersistTimer = null;
    logsPersistInFlight = withLock('logs', persistLogsToDb).finally(() => {
      logsPersistInFlight = null;
    });
  }, LOGS_PERSIST_DEBOUNCE_MS);
}

export async function flushLogsToDisk(): Promise<void> {
  if (logsPersistTimer) {
    clearTimeout(logsPersistTimer);
    logsPersistTimer = null;
  }
  if (logsPersistInFlight) await logsPersistInFlight;
  const items = getMemoryCache('logs');
  if (items) {
    await withLock('logs', persistLogsToDb);
  }
}

async function cancelLogsPersist(): Promise<void> {
  if (logsPersistTimer) {
    clearTimeout(logsPersistTimer);
    logsPersistTimer = null;
  }
  if (logsPersistInFlight) await logsPersistInFlight;
}

export async function removeDocumentsFromCollection(
  collection: CollectionName,
  docIds: string[]
): Promise<number> {
  if (docIds.length === 0) return 0;

  return withLock(collection, async () => {
    if (collection === 'logs') {
      await cancelLogsPersist();
    }

    const idSet = new Set(docIds);
    const placeholders = docIds.map(() => '?').join(', ');
    await execute(
      `DELETE FROM documents WHERE collection_name = ? AND doc_id IN (${placeholders})`,
      [collection, ...docIds]
    );

    const cached = getMemoryCache<{ _id: string }>(collection);
    if (cached) {
      setMemoryCache(
        collection,
        cached.filter((item) => !idSet.has(item._id))
      );
    } else {
      await invalidateCollectionCache(collection);
    }

    return docIds.length;
  });
}

export async function clearCollectionInDb(collection: CollectionName): Promise<number> {
  return withLock(collection, async () => {
    if (collection === 'logs') {
      await cancelLogsPersist();
    }

    const cached = getMemoryCache<{ _id: string }>(collection);
    const count =
      cached?.length ?? (await loadCollectionFromDb<{ _id: string }>(collection)).length;

    await execute('DELETE FROM documents WHERE collection_name = ?', [collection]);
    setMemoryCache(collection, []);

    return count;
  });
}

async function readCollectionUnsafe<T>(name: CollectionName): Promise<T[]> {
  const cached = getMemoryCache<T>(name);
  if (cached) return cached;

  const items = await loadCollectionFromDb<T>(name);
  setMemoryCache(name, items);
  return items;
}

async function writeCollectionUnsafe<T extends { _id: string }>(
  name: CollectionName,
  data: T[]
): Promise<void> {
  setMemoryCache(name, data);

  if (name === 'logs') {
    scheduleLogsPersist();
    return;
  }

  await persistCollectionToDb(name, data);
}

export async function readCollection<T>(name: CollectionName): Promise<T[]> {
  return withLock(name, () => readCollectionUnsafe<T>(name));
}

export async function writeCollection<T extends { _id: string }>(
  name: CollectionName,
  data: T[]
): Promise<void> {
  return withLock(name, () => writeCollectionUnsafe(name, data));
}

export async function readSettings(): Promise<Settings> {
  return withLock('settings', async () => {
    const rows = await query<DocRow[]>('SELECT payload FROM app_settings WHERE id = 1 LIMIT 1');
    if (rows.length === 0) {
      const settings: Settings = {
        _id: generateId(),
        businessName: 'A101',
        siteActive: true,
        storeMode: 'a101',
        mobileOnly: false,
        blockDebitCards: false,
        adminSoundEnabled: true,
        adminSoundVolume: 80,
        createdAt: now(),
        updatedAt: now(),
      };
      await writeSettingsUnsafe(settings);
      return settings;
    }
    return parsePayload<Settings>(rows[0].payload);
  });
}

async function writeSettingsUnsafe(settings: Settings): Promise<void> {
  await execute(
    `INSERT INTO app_settings (id, payload) VALUES (1, ?)
     ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
    [JSON.stringify(settings)]
  );
}

export async function writeSettings(settings: Settings): Promise<void> {
  await withLock('settings', () => writeSettingsUnsafe(settings));
}

export async function updateCollection<T extends { _id: string }>(
  name: CollectionName,
  updater: (items: T[]) => T[]
): Promise<void> {
  await withLock(name, async () => {
    const items = await readCollectionUnsafe<T>(name);
    const updated = updater(items);
    await writeCollectionUnsafe(name, updated);
  });
}

export async function upsertDocument<T extends { _id: string; createdAt?: string; updatedAt?: string }>(
  collection: CollectionName,
  doc: T
): Promise<void> {
  const createdAt = doc.createdAt || now();
  const updatedAt = doc.updatedAt || createdAt;
  await execute(
    `INSERT INTO documents (collection_name, doc_id, payload, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = VALUES(updated_at)`,
    [collection, doc._id, JSON.stringify(doc), toMysqlDate(createdAt), toMysqlDate(updatedAt)]
  );

  const cached = getMemoryCache<T>(collection);
  if (cached) {
    const index = cached.findIndex((item) => item._id === doc._id);
    if (index >= 0) {
      cached[index] = doc;
    } else {
      cached.unshift(doc);
    }
    setMemoryCache(collection, cached);
  }
}

export async function deleteDocument(collection: CollectionName, docId: string): Promise<void> {
  await execute('DELETE FROM documents WHERE collection_name = ? AND doc_id = ?', [collection, docId]);

  const cached = getMemoryCache<{ _id: string }>(collection);
  if (cached) {
    setMemoryCache(
      collection,
      cached.filter((item) => item._id !== docId)
    );
  }
}

export async function invalidateCollectionCache(name: CollectionName): Promise<void> {
  collectionMemory.delete(name);
  if (name === 'logs') {
    logsIdIndex = null;
    logsSessionIndex = null;
  }
}

export async function upsertLogDocument<
  T extends { _id: string; createdAt?: string; updatedAt?: string },
>(doc: T): Promise<void> {
  await withLock('logs', async () => {
    const createdAt = doc.createdAt || now();
    const updatedAt = doc.updatedAt || createdAt;
    await execute(
      `INSERT INTO documents (collection_name, doc_id, payload, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = VALUES(updated_at)`,
      ['logs', doc._id, JSON.stringify(doc), toMysqlDate(createdAt), toMysqlDate(updatedAt)]
    );

    const cached = getMemoryCache<T>('logs');
    if (cached) {
      const index = cached.findIndex((item) => item._id === doc._id);
      if (index >= 0) {
        cached[index] = doc;
      } else {
        cached.unshift(doc);
      }
      rebuildLogIndexes(cached);
    }
  });
}
