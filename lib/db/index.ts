import { initDb } from './store';

let initialized = false;

export async function connectDB(): Promise<void> {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
}

export * from './types';
export * from './repositories';
export { generateId, now, flushLogsToDisk, peekCollection, peekLogById, peekLogBySessionId, removeDocumentsFromCollection, clearCollectionInDb, upsertLogDocument } from './store';
