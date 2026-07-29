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

// High-Performance In-Memory LRU Cache (Capacity: 300 queries)
const SEARCH_CACHE_MAX_SIZE = 300;
const searchCache = new Map<string, { total: number; results: ClientTickerResult[] }>();

// Fast O(1) Ticker Symbol Index Map for instant exact lookups
const symbolIndexMap = new Map<string, ClientTickerResult>();

function getCacheKey(query: string, type: string, page: number, limit: number): string {
  return `${query.trim().toLowerCase()}:${type}:${page}:${limit}`;
}

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

      // Pre-index all symbols in memory for O(1) instant exact match lookups
      try {
        const allRes = _db.exec(`SELECT symbol, name, exchange, exchange_name, is_etf FROM tickers`);
        const rows = allRes[0]?.values || [];
        for (const r of rows) {
          const item: ClientTickerResult = {
            symbol: r[0] as string,
            name: r[1] as string,
            exchange: r[2] as string,
            exchangeName: r[3] as string,
            isETF: r[4] === 1,
          };
          symbolIndexMap.set(item.symbol.toUpperCase(), item);
        }
        console.log(`[sqliteClient] ✅ Indexed ${symbolIndexMap.size} tickers into fast O(1) memory map`);
      } catch {}

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
  const q = query.trim().toUpperCase();
  const type = opts.type || 'All';
  const page = Math.max(1, opts.page || 1);
  const limit = Math.min(100, Math.max(1, opts.limit || 10));
  const offset = (page - 1) * limit;

  // 1. Check High-Performance In-Memory LRU Cache ($O(1)$ response)
  const cacheKey = getCacheKey(query, type, page, limit);
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  // 2. Instant O(1) exact ticker symbol lookup optimization
  if (q && page === 1 && (type === 'All' || (type === 'ETF' && symbolIndexMap.get(q)?.isETF) || (type === 'Stock' && !symbolIndexMap.get(q)?.isETF))) {
    const exactMatch = symbolIndexMap.get(q);
    if (exactMatch) {
      // Return exact match first, plus background SQLite query for additional prefix matches
      const db = await getClientDb();
      if (db) {
        try {
          const prefixRes = db.exec(
            `SELECT symbol, name, exchange, exchange_name, is_etf
             FROM tickers
             WHERE (UPPER(symbol) LIKE ? OR UPPER(name) LIKE ?)
               ${type === 'ETF' ? 'AND is_etf = 1' : type === 'Stock' ? 'AND is_etf = 0' : ''}
             ORDER BY CASE WHEN UPPER(symbol) = ? THEN 1 WHEN UPPER(symbol) LIKE ? THEN 2 ELSE 3 END, is_etf DESC, symbol ASC
             LIMIT ? OFFSET ?`,
            [`${q}%`, `%${q}%`, q, `${q}%`, limit, offset]
          );

          const countRes = db.exec(
            `SELECT COUNT(*) FROM tickers WHERE (UPPER(symbol) LIKE ? OR UPPER(name) LIKE ?) ${type === 'ETF' ? 'AND is_etf = 1' : type === 'Stock' ? 'AND is_etf = 0' : ''}`,
            [`%${q}%`, `%${q}%`]
          );

          const total = (countRes[0]?.values[0]?.[0] as number) || 1;
          const rows = prefixRes[0]?.values || [];
          const results: ClientTickerResult[] = rows.map((r) => ({
            symbol: r[0] as string,
            name: r[1] as string,
            exchange: r[2] as string,
            exchangeName: r[3] as string,
            isETF: r[4] === 1,
          }));

          const cachedValue = { total, results };
          searchCache.set(cacheKey, cachedValue);
          return cachedValue;
        } catch {}
      }
    }
  }

  const db = await getClientDb();
  if (!db) return null;

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
    const countRes = db.exec(`SELECT COUNT(*) FROM tickers ${where}`, q ? [`%${q}%`, `%${q}%`] : []);
    const total = (countRes[0]?.values[0]?.[0] as number) || 0;

    // Relevance-Weighted Results query (Exact Match > Symbol Prefix > Name Match)
    const orderClause = q
      ? `ORDER BY CASE WHEN UPPER(symbol) = '${q}' THEN 1 WHEN UPPER(symbol) LIKE '${q}%' THEN 2 ELSE 3 END, is_etf DESC, symbol ASC`
      : `ORDER BY is_etf DESC, symbol ASC`;

    const res = db.exec(
      `SELECT symbol, name, exchange, exchange_name, is_etf
       FROM tickers ${where}
       ${orderClause}
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

    const responsePayload = { total, results };

    // Evict oldest cache entry if max size reached
    if (searchCache.size >= SEARCH_CACHE_MAX_SIZE) {
      const firstKey = searchCache.keys().next().value;
      if (firstKey) searchCache.delete(firstKey);
    }
    searchCache.set(cacheKey, responsePayload);

    return responsePayload;
  } catch (err) {
    console.error('[sqliteClient] Search query error:', err);
    return null;
  }
}
