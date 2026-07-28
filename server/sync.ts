// server/sync.ts
// Orchestrates fetch → parse → upsert pipeline
import { getDb, saveDb } from './db.js';
import { fetchAllTickers } from './fetcher.js';
import { upsertTickers } from './upsert.js';

let isSyncing = false;
let lastSyncAt: string | null = null;

export async function runSync(): Promise<{ rows: number; duration: number }> {
  if (isSyncing) {
    console.log('[sync] Already syncing, skipping...');
    return { rows: 0, duration: 0 };
  }

  isSyncing = true;
  const start = Date.now();

  try {
    console.log('[sync] ── Starting daily ticker sync ──');
    const db   = await getDb();
    const rows = await fetchAllTickers();
    const count = upsertTickers(db, rows);

    lastSyncAt = new Date().toISOString();
    const duration = Date.now() - start;
    console.log(`[sync] ── Sync complete: ${count} tickers in ${duration}ms ──`);
    return { rows: count, duration };
  } catch (err) {
    console.error('[sync] Sync failed:', err);
    const db = await getDb();
    db.run(
      `INSERT INTO sync_log (synced_at, rows_upserted, status, message) VALUES (?, 0, 'error', ?)`,
      [new Date().toISOString(), String(err)]
    );
    saveDb(db);
    throw err;
  } finally {
    isSyncing = false;
  }
}

export function getLastSyncAt(): string | null {
  return lastSyncAt;
}

export function isSyncRunning(): boolean {
  return isSyncing;
}
