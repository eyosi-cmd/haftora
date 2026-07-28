// src/services/sqliteSearch.ts
// Client-side WebAssembly SQLite search service — zero server dependency, $0/month cost
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

export interface ClientTickerResult {
  symbol: string;
  name: string;
  exchange: string;
  exchangeName: string;
  isETF: boolean;
}

let _db: Database | null = null;
let _loadingPromise: Promise<Database | null> | null = null;

export async function getClientDb(): Promise<Database | null> {
  if (_db) return _db;
  if (_loadingPromise) return _loadingPromise;

  _loadingPromise = (async () => {
    try {
      // Load sql.js Wasm static engine locally (0 external CDN dependency, 0 CORS issues)
      const SQL: SqlJsStatic = await initSqlJs({
        locateFile: (file) => `/${file}`,
      });

      // Fetch pre-compiled /tickers.db from public asset directory
      const response = await fetch('/tickers.db');
      if (!response.ok) {
        console.warn('[sqliteClient] /tickers.db static asset not found.');
        return null;
      }

      const buffer = await response.arrayBuffer();
      _db = new SQL.Database(new Uint8Array(buffer));
      console.log('[sqliteClient] ✅ Loaded Wasm SQLite database into browser memory');
      return _db;
    } catch (err) {
      console.warn('[sqliteClient] Failed to load Wasm SQLite database:', err);
      return null;
    }
  })();

  return _loadingPromise;
}

export async function searchClientTickers(
  query: string,
  opts: { type?: 'ETF' | 'Stock' | 'All'; page?: number; limit?: number } = {}
): Promise<{ total: number; results: ClientTickerResult[] } | null> {
  const db = await getClientDb();
  if (!db) return null;

  const q = query.trim().toUpperCase();
  const type = opts.type || 'All';
  const page = Math.max(1, opts.page || 1);
  const limit = Math.min(100, Math.max(1, opts.limit || 10));
  const offset = (page - 1) * limit;

  try {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (q) {
      conditions.push(`(UPPER(symbol) LIKE ? OR UPPER(name) LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`);
    }

    if (type === 'ETF')   conditions.push('is_etf = 1');
    if (type === 'Stock') conditions.push('is_etf = 0');

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query
    const countRes = db.exec(`SELECT COUNT(*) FROM tickers ${where}`, params);
    const total = (countRes[0]?.values[0]?.[0] as number) || 0;

    // Results query
    const res = db.exec(
      `SELECT symbol, name, exchange, exchange_name, is_etf
       FROM tickers ${where}
       ORDER BY is_etf DESC, symbol ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const rows = res[0]?.values || [];
    const results: ClientTickerResult[] = rows.map((r) => ({
      symbol:       r[0] as string,
      name:         r[1] as string,
      exchange:     r[2] as string,
      exchangeName: r[3] as string,
      isETF:        r[4] === 1,
    }));

    return { total, results };
  } catch (err) {
    console.error('[sqliteClient] Search query error:', err);
    return null;
  }
}
