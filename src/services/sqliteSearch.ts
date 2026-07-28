import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

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
      // 1. Pre-fetch Wasm binary as ArrayBuffer (bypasses WebAssembly streaming MIME type errors)
      let wasmBinary: Uint8Array | undefined = undefined;
      const targetWasmUrl = sqlWasmUrl || '/sql-wasm.wasm';

      try {
        const wasmRes = await fetch(targetWasmUrl);
        const contentType = wasmRes.headers.get('content-type') || '';
        if (wasmRes.ok && !contentType.includes('text/html')) {
          const buf = await wasmRes.arrayBuffer();
          const bytes = new Uint8Array(buf);
          // Verify WebAssembly magic bytes: 0x00 0x61 0x73 0x6d (\0asm)
          if (bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d) {
            wasmBinary = bytes;
          }
        }
      } catch (e) {
        console.warn('[sqliteClient] Wasm binary pre-fetch notice:', e);
      }

      // 2. Initialize sql.js engine
      const SQL: SqlJsStatic = await initSqlJs(
        wasmBinary
          ? { wasmBinary }
          : { locateFile: (file) => (file.endsWith('.wasm') ? targetWasmUrl : `/${file}`) }
      );

      // 3. Fetch pre-compiled /tickers.db static database
      const dbRes = await fetch('/tickers.db');
      const dbContentType = dbRes.headers.get('content-type') || '';
      if (!dbRes.ok || dbContentType.includes('text/html')) {
        console.warn('[sqliteClient] /tickers.db static asset not found.');
        return null;
      }

      const dbBuf = await dbRes.arrayBuffer();
      const dbBytes = new Uint8Array(dbBuf);
      // Verify SQLite magic header: "SQLite format 3\0" (0x53 0x51 0x4c 0x69 0x74 0x65)
      if (dbBytes[0] !== 0x53 || dbBytes[1] !== 0x51 || dbBytes[2] !== 0x4c) {
        console.warn('[sqliteClient] /tickers.db is not a valid SQLite database.');
        return null;
      }

      _db = new SQL.Database(dbBytes);
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
