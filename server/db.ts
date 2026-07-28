// server/db.ts
// Pure-JS SQLite via sql.js (no native compilation required)
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.join(__dirname, '..', 'data');
const DB_PATH   = path.join(DATA_DIR, 'tickers.db');

let _SQL: SqlJsStatic | null = null;
let _db: Database | null = null;

async function getSql(): Promise<SqlJsStatic> {
  if (_SQL) return _SQL;
  _SQL = await initSqlJs();
  return _SQL;
}

export async function getDb(): Promise<Database> {
  if (_db) return _db;

  const SQL = await getSql();
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
    console.log('[db] Loaded existing database from', DB_PATH);
  } else {
    _db = new SQL.Database();
    console.log('[db] Created new in-memory database');
  }

  initSchema(_db);
  return _db;
}

export function saveDb(db: Database): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  console.log(`[db] Saved database to ${DB_PATH} (${(data.byteLength / 1024).toFixed(1)} KB)`);
}

function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS tickers (
      symbol        TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      exchange      TEXT DEFAULT '',
      exchange_name TEXT DEFAULT '',
      is_etf        INTEGER DEFAULT 0,
      last_updated  TEXT DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_symbol   ON tickers(symbol);
    CREATE INDEX IF NOT EXISTS idx_is_etf   ON tickers(is_etf);
    CREATE INDEX IF NOT EXISTS idx_exchange ON tickers(exchange);

    CREATE TABLE IF NOT EXISTS sync_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      synced_at     TEXT NOT NULL,
      rows_upserted INTEGER DEFAULT 0,
      status        TEXT DEFAULT 'ok',
      message       TEXT DEFAULT ''
    );
  `);
}

export const EXCHANGE_NAMES: Record<string, string> = {
  Q: 'NASDAQ',
  N: 'NYSE',
  P: 'NYSE Arca',
  Z: 'CBOE BZX',
  A: 'NYSE American',
  C: 'NASDAQ Capital Market',
  G: 'NASDAQ Global Select',
  D: 'FINRA ADF',
  E: 'NYSE National',
  I: 'ISE',
  M: 'Chicago SE',
  S: 'NASDAQ Capital',
  T: 'NASDAQ Global',
  U: 'OTC',
  V: 'IEX',
  W: 'CBOE',
  X: 'PHLX',
  Y: 'BATS Y-Exchange',
};
