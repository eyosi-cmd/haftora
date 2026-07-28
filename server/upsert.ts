// server/upsert.ts
// Bulk upsert parsed ticker rows into the SQLite database
import { Database } from 'sql.js';
import { RawTickerRow } from './fetcher.js';
import { EXCHANGE_NAMES, saveDb } from './db.js';

export function upsertTickers(db: Database, rows: RawTickerRow[]): number {
  console.log(`[upsert] Upserting ${rows.length} tickers...`);
  const now = new Date().toISOString().split('T')[0];

  // Clear existing data for a full-refresh strategy (cleanest for daily sync)
  db.run('DELETE FROM tickers');

  // Batch insert using individual statements (sql.js doesn't support prepared statement reuse in same way)
  let count = 0;
  const BATCH_SIZE = 500;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = batch
      .map(r => {
        const sym  = r.symbol.replace(/'/g, "''");
        const name = r.name.replace(/'/g, "''");
        const exch = (r.exchange || '').replace(/'/g, "''");
        const exchName = (EXCHANGE_NAMES[r.exchange] || r.exchange || '').replace(/'/g, "''");
        const isETF = r.isETF ? 1 : 0;
        return `('${sym}','${name}','${exch}','${exchName}',${isETF},'${now}')`;
      })
      .join(',');

    if (values) {
      db.run(`
        INSERT OR REPLACE INTO tickers (symbol, name, exchange, exchange_name, is_etf, last_updated)
        VALUES ${values}
      `);
      count += batch.length;
    }
  }

  // Log sync
  db.run(
    `INSERT INTO sync_log (synced_at, rows_upserted, status, message)
     VALUES (?, ?, 'ok', 'Daily sync completed')`,
    [new Date().toISOString(), count]
  );

  // Persist to disk
  saveDb(db);

  console.log(`[upsert] Done — ${count} tickers saved`);
  return count;
}
