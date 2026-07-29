// server/routes/tickers.ts
// GET /api/tickers  — paginated, searchable ticker endpoint
import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { runSync, getLastSyncAt, isSyncRunning } from '../sync.js';

const router = Router();

// ── GET /api/tickers ──────────────────────────────────────────────────────
// Query params:
//   search   — ticker or name substring (case-insensitive)
//   type     — "ETF" | "Stock" | "All" (default: All)
//   exchange — "Q" | "N" | "P" | "Z" etc.
//   page     — 1-based page number (default: 1)
//   limit    — results per page, max 100 (default: 20)
router.get('/', async (req: Request, res: Response) => {
  try {
    const db      = await getDb();
    const search   = String(req.query.search   || '').trim();
    const type     = String(req.query.type     || 'All');
    const exchange = String(req.query.exchange || '');
    const page     = Math.max(1, parseInt(String(req.query.page  || '1')));
    const limit    = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
    const offset   = (page - 1) * limit;

    // Build WHERE clauses
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      // Search both symbol and name (case-insensitive LIKE)
      const q = `%${search.toUpperCase()}%`;
      const qLower = `%${search.toLowerCase()}%`;
      conditions.push(`(UPPER(symbol) LIKE ? OR LOWER(name) LIKE ?)`);
      params.push(q, qLower);
    }
    if (type === 'ETF')   { conditions.push(`is_etf = 1`); }
    if (type === 'Stock') { conditions.push(`is_etf = 0`); }
    if (exchange)         { conditions.push(`exchange = ?`); params.push(exchange); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = db.exec(`SELECT COUNT(*) as cnt FROM tickers ${where}`, params);
    const total = countResult[0]?.values[0]?.[0] as number ?? 0;

    // Get paginated rows — sort ETFs first, then by symbol
    const rowsResult = db.exec(
      `SELECT symbol, name, exchange, exchange_name, is_etf, last_updated
       FROM tickers ${where}
       ORDER BY is_etf DESC, symbol ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const results = (rowsResult[0]?.values ?? []).map((row) => ({
      symbol:       row[0] as string,
      name:         row[1] as string,
      exchange:     row[2] as string,
      exchangeName: row[3] as string,
      isETF:        row[4] === 1,
      lastUpdated:  row[5] as string,
    }));

    res.json({
      total,
      page,
      limit,
      pages:   Math.ceil(total / limit),
      results,
    });
  } catch (err) {
    console.error('[route] GET /api/tickers error:', err);
    res.status(500).json({ error: 'Internal server error', message: String(err) });
  }
});

// ── GET /api/tickers/stats ────────────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = db.exec(`
      SELECT
        (SELECT COUNT(*) FROM tickers)           AS total,
        (SELECT COUNT(*) FROM tickers WHERE is_etf = 1) AS etfs,
        (SELECT COUNT(*) FROM tickers WHERE is_etf = 0) AS stocks
    `);
    const row = result[0]?.values[0] ?? [0, 0, 0];

    // Last sync time from sync_log
    const logResult = db.exec(
      `SELECT synced_at, rows_upserted FROM sync_log WHERE status='ok' ORDER BY id DESC LIMIT 1`
    );
    const lastSync = logResult[0]?.values[0];

    res.json({
      total:      row[0] as number,
      etfs:       row[1] as number,
      stocks:     row[2] as number,
      lastSync:   lastSync ? { at: lastSync[0], rows: lastSync[1] } : null,
      syncRunning: isSyncRunning(),
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── GET /api/tickers/quote/:symbol ─────────────────────────────────────────
router.get('/quote/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    const resp = await fetch(yahooUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (resp.ok) {
      const data = (await resp.json()) as any;
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice) {
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;

        return res.json({
          ticker: symbol,
          price: Number(price.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          lastUpdated: timestamp,
          isRealTime: true,
        });
      }
    }
    return res.status(502).json({ error: `Quote unavailable for ${symbol}` });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});


// ── GET /api/tickers/:symbol ───────────────────────────────────────────────
router.get('/:symbol', async (req: Request, res: Response) => {
  try {
    const db     = await getDb();
    const symbol = req.params.symbol.toUpperCase();
    const result = db.exec(
      `SELECT symbol, name, exchange, exchange_name, is_etf, last_updated
       FROM tickers WHERE symbol = ?`,
      [symbol]
    );
    if (!result[0]?.values[0]) {
      return res.status(404).json({ error: `Ticker "${symbol}" not found` });
    }
    const row = result[0].values[0];
    res.json({
      symbol:       row[0] as string,
      name:         row[1] as string,
      exchange:     row[2] as string,
      exchangeName: row[3] as string,
      isETF:        row[4] === 1,
      lastUpdated:  row[5] as string,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── POST /api/tickers/sync — manual trigger ───────────────────────────────
router.post('/sync', async (_req: Request, res: Response) => {
  try {
    if (isSyncRunning()) {
      return res.json({ status: 'already_running', message: 'Sync already in progress' });
    }
    // Fire and forget — respond immediately
    res.json({ status: 'started', message: 'Sync started in background' });
    runSync().catch(console.error);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
