// server/index.ts
// Haftora Ticker Backend — Express server + daily cron sync
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { getDb } from './db.js';
import { runSync } from './sync.js';
import tickerRouter from './routes/tickers.js';

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173', /\.netlify\.app$/] }));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/tickers', tickerRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), port: PORT });
});

// ── Startup ─────────────────────────────────────────────────────────────────
async function start() {
  console.log('\n🚀 Haftora Ticker Backend starting...');

  // Init DB
  const db = await getDb();

  // Check if we need an initial sync (empty DB)
  const countResult = db.exec('SELECT COUNT(*) FROM tickers');
  const count = countResult[0]?.values[0]?.[0] as number ?? 0;
  console.log(`[startup] Database has ${count} tickers`);

  if (count === 0) {
    console.log('[startup] Empty DB — running initial sync now...');
    runSync().catch(err => console.error('[startup] Initial sync failed:', err));
  } else {
    // Check if last sync was more than 23 hours ago
    const logResult = db.exec(
      `SELECT synced_at FROM sync_log WHERE status='ok' ORDER BY id DESC LIMIT 1`
    );
    const lastSyncAt = logResult[0]?.values[0]?.[0] as string | undefined;
    if (lastSyncAt) {
      const ageHours = (Date.now() - new Date(lastSyncAt).getTime()) / 3_600_000;
      if (ageHours > 23) {
        console.log(`[startup] Data is ${ageHours.toFixed(1)}h old — refreshing...`);
        runSync().catch(console.error);
      } else {
        console.log(`[startup] Data is ${ageHours.toFixed(1)}h old — OK, next sync at 2 AM EST`);
      }
    }
  }

  // ── Cron: daily at 2:00 AM Eastern Time ──────────────────────────────────
  cron.schedule('0 2 * * *', () => {
    console.log('\n⏰ [cron] Running scheduled 2 AM EST daily sync...');
    runSync().catch(err => console.error('[cron] Sync error:', err));
  }, { timezone: 'America/New_York' });

  console.log('[cron] Daily sync scheduled: 2:00 AM EST (America/New_York)');

  // Start server
  app.listen(PORT, () => {
    console.log(`\n✅ Haftora API server running at http://localhost:${PORT}`);
    console.log(`   GET  http://localhost:${PORT}/api/tickers?search=VOO`);
    console.log(`   GET  http://localhost:${PORT}/api/tickers?type=ETF&limit=10`);
    console.log(`   GET  http://localhost:${PORT}/api/tickers/stats`);
    console.log(`   POST http://localhost:${PORT}/api/tickers/sync`);
    console.log(`   GET  http://localhost:${PORT}/health\n`);
  });
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
